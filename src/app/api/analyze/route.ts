import { NextRequest } from 'next/server';
import { runSubAgent, runTechnicalMetaCombined, AgentError } from '@/lib/run-sub-agent';
import { encodeSSE } from '@/lib/sse';
import { cleanHtml } from '@/lib/clean-html';
import { summarizePageSpeed } from '@/lib/summarize-pagespeed';
import { fetchSerpData } from '@/lib/tools/fetch-serp-data';
import { assertSafeUrl } from '@/lib/url-safety';
import { extractMetaTags } from '@/lib/tools/extract-meta-tags';
import { checkCanonical } from '@/lib/tools/check-canonical';
import { extractSchemaMarkup } from '@/lib/tools/extract-schema-markup';
import { fetchCrux } from '@/lib/tools/get-crux';
import { createAnthropicClient } from '@/lib/anthropic-client';
import { ANALYSIS_MODEL, MAX_TOKENS } from '@/lib/model';
import { extractJSON } from '@/lib/extract-json';
import { emptyUsage, addUsage, sumUsage, formatUsage } from '@/lib/usage';
import { SYNTHESIS_SYSTEM_PROMPT } from '@/agents/orchestrator/synthesis-prompt';
import {
  type SynthesisCore,
  buildFallbackSynthesis,
  assembleReport,
  collectFindings,
  scoreFindings,
} from '@/lib/build-fallback-report';
import type { AgentId, AgentResult, UsageTotals } from '@/types/agents';
import type { AnalysisRequest } from '@/types/seo';
import type Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
// The full pipeline (3 sequential phases + synthesis, ~11 multi-turn agents)
// can run for several minutes. Note: Vercel Hobby caps this at 300s regardless;
// a higher value only takes effect on self-hosted / higher Vercel tiers.
export const maxDuration = 800;

const client = createAnthropicClient();

// Phases run sequentially (to stay within API rate limits), but every agent
// inside a phase runs in parallel. Page-based agents go first, then agents that
// hit external data (SERP), then the blog writer which builds on prior findings.
const PHASE_1: AgentId[] = [
  'technical-auditor', 'page-speed', 'meta-optimizer', 'internal-link',
  'semantic-content', 'ai-visibility', 'company-intelligence',
];
const PHASE_2: AgentId[] = ['cannibalization', 'competitor-gap', 'feedback-analyzer', 'geo'];
const PHASE_3: AgentId[] = ['blog-writer'];

// Only these agents parse the pre-fetched page HTML directly. Sending the
// cleaned HTML (~10k chars) to the rest just inflates their input token bill —
// they fetch whatever they need via WebFetch. Gating it cuts the duplicated
// page-content cost across the fan-out.
const AGENTS_NEEDING_PAGE_HTML = new Set<AgentId>([
  'technical-auditor', 'meta-optimizer', 'internal-link', 'semantic-content', 'ai-visibility',
]);

// Only these agents consume Google SERP results for the target keyword. We
// pre-fetch the SERP once and hand it to them so they skip the duplicate
// fetch_serp_data round-trip (and the re-billed result on every later turn).
const AGENTS_NEEDING_SERP = new Set<AgentId>([
  'geo', 'competitor-gap', 'meta-optimizer', 'blog-writer',
]);

// Only the page-speed agent reads PageSpeed Insights.
const AGENTS_NEEDING_PAGESPEED = new Set<AgentId>(['page-speed']);

const ALL_ANALYSIS_AGENTS: AgentId[] = [...PHASE_1, ...PHASE_2];

async function runSynthesis(
  agentResults: AgentResult[],
  url: string,
  keyword: string | undefined,
): Promise<{ core: SynthesisCore; usage: UsageTotals }> {
  // Send only findings (not the bulky `raw` blocks) — the synthesizer ranks
  // findings, and trimming the input keeps us well clear of token limits.
  const slim = agentResults.map(r => ({ agentId: r.agentId, findings: r.findings }));
  const userPrompt = `Synthesize the following ${agentResults.length} SEO agent results for URL: ${url}${keyword ? `\nKeyword: ${keyword}` : ''}\n\nAgent findings:\n${JSON.stringify(slim, null, 2)}`;

  const response = await client.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: SYNTHESIS_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });
  const usage = addUsage(emptyUsage(), response.usage);

  const textBlock = response.content.find(c => c.type === 'text') as Anthropic.TextBlock | undefined;
  const rawText = textBlock?.text ?? '';
  let parsed: Partial<SynthesisCore>;
  try {
    parsed = JSON.parse(extractJSON(rawText)) as Partial<SynthesisCore>;
  } catch {
    throw new Error(`Synthesis output parse failed: ${rawText.slice(0, 300)}`);
  }
  return {
    core: {
      priorityActions: Array.isArray(parsed.priorityActions) ? parsed.priorityActions.slice(0, 10) : [],
      overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : scoreFindings(collectFindings(agentResults)),
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    },
    usage,
  };
}

export async function POST(req: NextRequest) {
  const body: AnalysisRequest = await req.json();
  const { url, keyword, competitorUrls, includeBlog, agents } = body;

  if (!url) {
    return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
  }

  // SSRF guard: reject internal/private/metadata targets before doing any work.
  try {
    await assertSafeUrl(url);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unsafe URL' }),
      { status: 400 },
    );
  }

  // Resolve which analysis agents to run. An OMITTED list means "all of them"
  // (backwards compatible); an explicit list is honored literally (unknown ids
  // dropped), so an explicit empty array means "no analysis agents".
  const selected = new Set<AgentId>(
    Array.isArray(agents)
      ? agents.filter((a): a is AgentId => ALL_ANALYSIS_AGENTS.includes(a))
      : ALL_ANALYSIS_AGENTS
  );

  if (selected.size === 0 && !includeBlog) {
    return new Response(JSON.stringify({ error: 'Select at least one agent' }), { status: 400 });
  }

  // Every agent that will actually run this analysis (blog-writer included when
  // opted in) — used to decide which shared evidence is worth pre-fetching.
  const activeAgents = new Set<AgentId>(selected);
  if (includeBlog) activeAgents.add('blog-writer');

  const encoder = new TextEncoder();
  const analysisStart = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(encodeSSE({ timestamp: Date.now(), ...event } as import('@/types/agents').SSEEvent)));
        } catch {
          // controller closed
        }
      };

      // ---- Shared evidence: gather each source once, then hand it to the
      // agents that need it so they skip the duplicate (and re-billed) fetch.
      // Only fetch what a selected/active agent will actually consume.
      const needsPageHtml = [...AGENTS_NEEDING_PAGE_HTML].some(a => activeAgents.has(a));
      const needsPageSpeed = [...AGENTS_NEEDING_PAGESPEED].some(a => activeAgents.has(a));
      const needsSerp = !!keyword && [...AGENTS_NEEDING_SERP].some(a => activeAgents.has(a));

      let pageContent: string | undefined;
      let facts: string | undefined;
      if (needsPageHtml) {
        try {
          const res = await fetch(url, {
            signal: AbortSignal.timeout(15_000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
          });
          const text = await res.text();
          pageContent = cleanHtml(text);
          // Deterministic facts are extracted from the RAW HTML (cleanHtml strips
          // <script>/attrs, which would hide JSON-LD and meta content). Feeding
          // these to the agents lets them skip re-parsing the page in the LLM.
          try {
            const meta = extractMetaTags({ html: text });
            const canonical = checkCanonical({ html: text, url });
            const schema = extractSchemaMarkup({ html: text });
            facts = JSON.stringify(
              {
                meta,
                canonical,
                schema: {
                  types: schema.types,
                  hasErrors: schema.hasErrors,
                  items: schema.schemas.map((s) => ({ type: s.type, valid: s.valid, errors: s.errors })),
                },
              },
              null,
              2,
            );
          } catch {
            // Extraction is best-effort; agents fall back to parsing the HTML.
          }
          send({ type: 'page_fetched', data: { url, contentLength: pageContent.length } });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          send({ type: 'page_fetch_error', data: { url, error: message } });
        }
      }

      let pageSpeedData: string | undefined;
      if (needsPageSpeed) {
        try {
          const encoded = encodeURIComponent(url);
          let api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encoded}&strategy=mobile&category=performance`;
          if (process.env.GOOGLE_PAGESPEED_API_KEY) api += `&key=${process.env.GOOGLE_PAGESPEED_API_KEY}`;
          const res = await fetch(api, { signal: AbortSignal.timeout(30_000) });
          pageSpeedData = summarizePageSpeed(api, await res.text()) ?? undefined;
        } catch {
          // Fall through — the page-speed agent fetches PageSpeed itself.
        }
        // Add real-world CrUX field data alongside the lab PageSpeed numbers.
        try {
          const crux = await fetchCrux(url);
          if (crux) pageSpeedData = (pageSpeedData ? pageSpeedData + '\n\n' : '') + crux;
        } catch {
          // CrUX is best-effort (no field data for low-traffic URLs).
        }
      }

      let serpData: string | undefined;
      if (needsSerp && keyword) {
        try {
          const serp = await fetchSerpData({ keyword });
          if (serp.results.length > 0) serpData = JSON.stringify(serp);
        } catch {
          // Fall through — the SERP-consuming agents fetch it themselves.
        }
      }

      const runAgent = async (agentId: AgentId): Promise<AgentResult | null> => {
        send({ type: 'agent_start', agentId, data: { url } });
        try {
          const result = await runSubAgent(agentId, {
            url,
            keyword,
            pageContent: AGENTS_NEEDING_PAGE_HTML.has(agentId) ? pageContent : undefined,
            facts: AGENTS_NEEDING_PAGE_HTML.has(agentId) ? facts : undefined,
            pageSpeedData: AGENTS_NEEDING_PAGESPEED.has(agentId) ? pageSpeedData : undefined,
            serpData: AGENTS_NEEDING_SERP.has(agentId) ? serpData : undefined,
            competitorUrls,
          });
          if (result.usage) console.log(formatUsage(agentId, result.usage));
          send({ type: 'agent_complete', agentId, data: { result, durationMs: Date.now() - analysisStart } });
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          // Preserve the tokens already burned before the agent failed.
          const usage = err instanceof AgentError ? err.usage : emptyUsage();
          console.log(formatUsage(`${agentId} (failed)`, usage));
          send({ type: 'agent_error', agentId, data: { message, retryable: false } });
          return { agentId, findings: [], raw: { error: message }, usage };
        }
      };

      // All agents within a phase run concurrently.
      const runPhase = (agentIds: AgentId[]) =>
        Promise.all(agentIds.map(runAgent));

      // technical-auditor and meta-optimizer both parse the same page HTML, so
      // when both are selected we run them as ONE LLM call (page context sent
      // once) and split the result back into two AgentResults.
      const runCombinedTechMeta = async (): Promise<AgentResult[]> => {
        send({ type: 'agent_start', agentId: 'technical-auditor', data: { url } });
        send({ type: 'agent_start', agentId: 'meta-optimizer', data: { url } });
        try {
          const results = await runTechnicalMetaCombined({
            url, keyword, pageContent, facts, serpData, competitorUrls,
          });
          for (const result of results) {
            if (result.usage) console.log(formatUsage(`${result.agentId} (combined)`, result.usage));
            send({ type: 'agent_complete', agentId: result.agentId, data: { result, durationMs: Date.now() - analysisStart } });
          }
          return results;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const usage = err instanceof AgentError ? err.usage : emptyUsage();
          console.log(formatUsage('technical-auditor+meta-optimizer (failed)', usage));
          const errorResults: AgentResult[] = [
            { agentId: 'technical-auditor', findings: [], raw: { error: message }, usage },
            { agentId: 'meta-optimizer', findings: [], raw: { error: message }, usage: emptyUsage() },
          ];
          for (const r of errorResults) send({ type: 'agent_error', agentId: r.agentId, data: { message, retryable: false } });
          return errorResults;
        }
      };

      try {
        const p1 = PHASE_1.filter(a => selected.has(a));
        const mergeTechMeta = p1.includes('technical-auditor') && p1.includes('meta-optimizer');
        const p1Individual = mergeTechMeta
          ? p1.filter(a => a !== 'technical-auditor' && a !== 'meta-optimizer')
          : p1;
        const [p1Ind, p1Comb] = await Promise.all([
          runPhase(p1Individual),
          mergeTechMeta ? runCombinedTechMeta() : Promise.resolve([] as AgentResult[]),
        ]);
        const phase1Results = [...p1Ind, ...p1Comb];
        const phase2Results = await runPhase(PHASE_2.filter(a => selected.has(a)));
        // The blog writer is opt-in (most expensive agent) — skip it unless asked.
        const phase3Results = includeBlog ? await runPhase(PHASE_3) : [];

        const seoResults = [...phase1Results, ...phase2Results].filter(
          (r): r is AgentResult => r !== null
        );
        const blogResult = phase3Results[0] ?? null;

        // Try the LLM synthesis; if it fails, fall back to a deterministic
        // report built from the agents that did succeed — never discard their work.
        let core: SynthesisCore;
        let synthesisUsage = emptyUsage();
        try {
          const synth = await runSynthesis(seoResults, url, keyword);
          core = synth.core;
          synthesisUsage = synth.usage;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error('[analyze] synthesis failed, using fallback report:', message);
          send({ type: 'synthesis_fallback', data: { message } });
          core = buildFallbackSynthesis(seoResults);
        }

        // Roll up every agent + the blog writer + synthesis into one run total.
        const totalUsage = sumUsage([
          ...seoResults.map(r => r.usage),
          blogResult?.usage,
          synthesisUsage,
        ]);
        console.log(formatUsage('TOTAL', totalUsage));

        const report = assembleReport(core, seoResults, blogResult, url, keyword, Date.now() - analysisStart);
        report.usageTotals = totalUsage;
        send({ type: 'final_report', data: { report } });
      } catch (err) {
        // Reaching here means something outside synthesis broke. Report it as an
        // analysis-level error rather than blaming an individual agent.
        const message = err instanceof Error ? err.message : String(err);
        console.error('[analyze] fatal error:', message);
        send({ type: 'analysis_error', data: { message, retryable: false } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
