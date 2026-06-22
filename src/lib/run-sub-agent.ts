import { exec } from 'child_process';
import { promisify } from 'util';
import type { AgentId, AgentResult, Finding } from '@/types/agents';
import { getAgentSystemPrompt } from './agent-registry';
import { TECHNICAL_AUDITOR_SYSTEM_PROMPT } from '@/agents/technical-auditor/system-prompt';
import { META_OPTIMIZER_SYSTEM_PROMPT } from '@/agents/meta-optimizer/system-prompt';
import { createAnthropicClient } from './anthropic-client';
import { ANALYSIS_MODEL, maxTokensFor } from './model';
import { extractJSON } from './extract-json';
import { emptyUsage, addUsage } from './usage';
import { cleanHtml } from './clean-html';
import { summarizePageSpeed } from './summarize-pagespeed';
import { assertSafeUrl } from './url-safety';
import type { UsageTotals } from '@/types/agents';
import type Anthropic from '@anthropic-ai/sdk';

// Error carrying the token spend accumulated before the agent failed, so the
// caller can still count those (already-billed) tokens in the run total.
export class AgentError extends Error {
  usage: UsageTotals;
  constructor(message: string, usage: UsageTotals) {
    super(message);
    this.name = 'AgentError';
    this.usage = usage;
  }
}

const execAsync = promisify(exec);
const client = createAnthropicClient();

const TOOL_PREAMBLE = `## Available Tools
You have these tools available:
- WebFetch(url): Fetch any URL and get its full content (HTML, JSON, text).
  Use this for ALL page fetching operations:
  - Main page HTML → WebFetch(url)
  - robots.txt → WebFetch(baseUrl + "/robots.txt")
  - sitemap.xml → WebFetch(baseUrl + "/sitemap.xml")
  - PageSpeed data → WebFetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" + encodedUrl + "&strategy=mobile")
  - After fetching HTML: read it directly to extract meta tags, canonical, schema markup, internal links — no separate tool needed.
- Bash(command): Run shell commands when needed.
  - HTTP status + redirects → Bash("curl -sI 'URL' 2>&1 | head -15")
- fetch_serp_data(keyword, location?, numResults?): Get Google organic search results for a keyword.
  - Returns top ranking URLs, titles, descriptions, and positions.
  - location: country code (e.g. "us", "tr"), default "us"

Do NOT reference old tool names (fetch_page, check_status_code, check_robots, etc.) — use WebFetch and Bash instead.

`;

// Shared output-quality instruction appended to every agent's system prompt.
// Enforces evidence-based, falsifiable findings (claude-seo FLOW framework).
const FINDINGS_QUALITY_NOTE = `

## Finding quality rules (apply to EVERY finding)
- Numeric claims MUST trace to actual tool output / provided data. If you cannot back a number with evidence, state it qualitatively instead — never invent figures.
- Whenever meaningful, add two optional fields to a finding:
  - "falsifiability": one sentence on how we would know this recommendation FAILED (a concrete, observable disconfirming signal).
  - "leadingIndicator": the earliest metric to watch to confirm the fix is working (e.g. "GSC impressions for this query over 2-4 weeks", "LCP in field data").
- Prefer fewer, higher-confidence findings over many speculative ones.
`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'WebFetch',
    description: 'Fetch a URL and return its full content (HTML, JSON, plain text)',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The URL to fetch' },
      },
      required: ['url'],
    },
  },
  {
    name: 'Bash',
    description: 'Run a shell command and return stdout',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: 'The shell command to execute' },
      },
      required: ['command'],
    },
  },
  {
    name: 'fetch_serp_data',
    description: 'Fetch Google organic search results for a keyword',
    input_schema: {
      type: 'object' as const,
      properties: {
        keyword: { type: 'string', description: 'Search keyword' },
        location: { type: 'string', description: 'Country code (e.g. "us", "tr")' },
        numResults: { type: 'number', description: 'Number of results to return (max 10)' },
      },
      required: ['keyword'],
    },
  },
];

// Move a single prompt-cache breakpoint to the most recent message block before
// each turn. Claude is stateless: without this, the entire (growing) message
// history — including 15-60k-char tool results — is re-billed at full input
// price on every turn. Marking the latest block lets Claude read the whole
// accumulated prefix from cache (~10x cheaper) and only write the new delta.
// We clear prior breakpoints first so we never exceed the 4-breakpoint cap
// (the system prompt holds one of its own).
function moveCacheBreakpoint(messages: Anthropic.MessageParam[]): void {
  for (const m of messages) {
    if (Array.isArray(m.content)) {
      for (const block of m.content) {
        delete (block as { cache_control?: unknown }).cache_control;
      }
    }
  }
  const last = messages[messages.length - 1];
  if (!last) return;
  if (typeof last.content === 'string') {
    last.content = [{ type: 'text', text: last.content, cache_control: { type: 'ephemeral' } }];
  } else {
    const lastBlock = last.content[last.content.length - 1];
    if (lastBlock) (lastBlock as { cache_control?: { type: 'ephemeral' } }).cache_control = { type: 'ephemeral' };
  }
}

async function executeTool(name: string, input: Record<string, string>): Promise<string> {
  if (name === 'WebFetch') {
    let targetUrl = input.url;

    if (
      process.env.GOOGLE_PAGESPEED_API_KEY &&
      targetUrl.includes('googleapis.com/pagespeedonline')
    ) {
      const sep = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${sep}key=${process.env.GOOGLE_PAGESPEED_API_KEY}`;
    }

    // SSRF guard: reject private/reserved/metadata targets before fetching.
    try {
      await assertSafeUrl(targetUrl);
    } catch (err) {
      return `Blocked URL (safety): ${err instanceof Error ? err.message : String(err)}`;
    }

    try {
      const res = await fetch(targetUrl, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
      });
      const text = await res.text();

      // PageSpeed/Lighthouse JSON → compact summary (~15k tokens → ~300).
      const pageSpeed = summarizePageSpeed(targetUrl, text);
      if (pageSpeed !== null) return pageSpeed;

      // HTML → strip scripts/styles/attrs and cap (cleanHtml slices to 15k chars);
      // other content (robots.txt, sitemap.xml, JSON APIs) → cap at 20k chars.
      const contentType = res.headers.get('content-type') ?? '';
      const looksHtml = contentType.includes('html') || /^\s*<(?:!doctype|html)/i.test(text);
      return looksHtml ? cleanHtml(text) : text.slice(0, 20_000);
    } catch (err) {
      return `Fetch error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  if (name === 'Bash') {
    // SSRF guard: validate every URL the command would hit (curl, wget, etc.).
    const urls = input.command.match(/https?:\/\/[^\s'"`)]+/gi) ?? [];
    for (const u of urls) {
      try {
        await assertSafeUrl(u);
      } catch (err) {
        return `Blocked command (safety): ${err instanceof Error ? err.message : String(err)}`;
      }
    }
    try {
      const { stdout, stderr } = await execAsync(input.command, { timeout: 10_000 });
      return (stdout + (stderr ? `\nSTDERR: ${stderr}` : '')).slice(0, 10_000);
    } catch (err) {
      return `Bash error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  if (name === 'fetch_serp_data') {
    const { fetchSerpData } = await import('./tools/fetch-serp-data');
    const result = await fetchSerpData({
      keyword: input.keyword,
      location: input.location,
      numResults: input.numResults ? Number(input.numResults) : undefined,
    });
    return JSON.stringify(result);
  }
  return 'Unknown tool';
}

export interface AgentInput {
  url: string;
  keyword?: string;
  pageContent?: string;
  // Pre-fetched shared evidence, gathered once by the orchestrator and passed
  // in so the agent skips the corresponding tool round-trip (less re-billed
  // context). pageSpeedData is the compact PageSpeed summary; serpData is the
  // JSON SERP result for the target keyword.
  pageSpeedData?: string;
  serpData?: string;
  // Pre-computed deterministic facts (title/meta/canonical/schema extracted in
  // code via cheerio). Authoritative ground truth so the agent doesn't re-parse
  // the HTML for these — it only validates and interprets them.
  facts?: string;
  competitorUrls?: string[];
  instructions?: string;
}

// System-prompt notes telling the model which evidence is already provided so it
// skips the corresponding (re-billed) tool call.
function buildEvidenceNotes(input: AgentInput): string {
  const pageFetchNote = input.pageContent
    ? `\nIMPORTANT: The main page HTML is already provided in the user message. Do NOT call WebFetch for "${input.url}" — use the provided HTML instead. You may still call WebFetch for other URLs (robots.txt, sitemap.xml, competitor pages, APIs etc.).\n`
    : '';
  const pageSpeedNote = input.pageSpeedData
    ? `\nIMPORTANT: A PageSpeed Insights summary is already provided in the user message. Do NOT call WebFetch for any "googleapis.com/pagespeedonline" URL — use the provided summary instead.\n`
    : '';
  const serpNote = input.serpData
    ? `\nIMPORTANT: Google SERP results for the target keyword are already provided in the user message. Do NOT call fetch_serp_data for that keyword — use the provided results instead.\n`
    : '';
  const factsNote = input.facts
    ? `\nIMPORTANT: Deterministic page facts (title, meta description, headings, canonical, robots, Open Graph, schema types) have ALREADY been extracted in code and are provided in the user message. Treat them as authoritative ground truth — do NOT re-extract these from the HTML. Use them directly and spend your effort interpreting/judging and producing recommendations.\n`
    : '';
  return pageFetchNote + pageSpeedNote + serpNote + factsNote;
}

// The user message: target details + whatever pre-fetched evidence we have.
function buildUserPrompt(input: AgentInput): string {
  const competitorUrls = (input.competitorUrls ?? []).filter(u => u && u.trim());
  const parts = [
    `Analyze this URL: ${input.url}`,
    input.keyword ? `Target keyword: ${input.keyword}` : null,
    competitorUrls.length > 0
      ? `\n## Competitor URLs to analyze\nThese are the chosen competitor pages ranking for the target query. Fetch and analyze each one, then take their structure and coverage into account:\n${competitorUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}`
      : null,
    input.instructions ? `\n## Custom instructions\n${input.instructions}` : null,
    input.pageSpeedData
      ? `\n## Pre-fetched PageSpeed Insights summary\nThe following PageSpeed data was already fetched for you. Use it directly — do NOT call WebFetch for pagespeedonline again:\n${input.pageSpeedData}`
      : null,
    input.serpData
      ? `\n## Pre-fetched SERP results\nThe following Google SERP results for the target keyword were already fetched for you. Use them directly — do NOT call fetch_serp_data for this keyword again:\n${input.serpData}`
      : null,
    input.facts
      ? `\n## Pre-computed page facts (authoritative)\nThese were extracted from the page HTML in code. Do NOT re-extract them — validate and interpret them, then base your findings/raw on them:\n${input.facts}`
      : null,
    input.pageContent
      ? `\n## Pre-fetched Page HTML\nThe following HTML was already fetched for you. Use it directly — do NOT call WebFetch for this URL again:\n\`\`\`html\n${input.pageContent}\n\`\`\``
      : null,
  ].filter(Boolean) as string[];
  return parts.join('\n');
}

// Shared multi-turn tool-use loop. `parse` turns the model's final text into the
// typed result and throws on invalid output (triggering one reformat retry).
// Accumulates token spend across every turn so the run-wide total reflects the
// (often dominant) cost of re-sent context.
async function runAgentLoop<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  parse: (rawText: string) => T,
  label: string,
): Promise<{ value: T; usage: UsageTotals }> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];
  let parseRetried = false;
  const usage = emptyUsage();

  for (let turn = 0; turn < 20; turn++) {
    moveCacheBreakpoint(messages);
    const response = await client.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: maxTokens,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages,
      tools: TOOLS,
    });
    addUsage(usage, response.usage);

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(c => c.type === 'text') as Anthropic.TextBlock | undefined;
      const rawText = textBlock?.text ?? '';
      try {
        return { value: parse(rawText), usage };
      } catch {
        // Give the model exactly one chance to reformat into valid JSON.
        if (!parseRetried) {
          parseRetried = true;
          messages.push({
            role: 'user',
            content:
              'Your previous response was not valid JSON. Reply with ONLY the JSON object — no markdown, no code fences, no commentary.',
          });
          continue;
        }
        throw new AgentError(`${label} output parse failed: ${rawText.slice(0, 300)}`, usage);
      }
    }

    if (response.stop_reason === 'tool_use') {
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const content = await executeTool(block.name, block.input as Record<string, string>);
          results.push({ type: 'tool_result', tool_use_id: block.id, content });
        }
      }
      messages.push({ role: 'user', content: results });
    }
  }

  throw new AgentError(`${label} exceeded max turns`, usage);
}

export async function runSubAgent(agentId: AgentId, input: AgentInput): Promise<AgentResult> {
  const systemPrompt = TOOL_PREAMBLE + buildEvidenceNotes(input) + getAgentSystemPrompt(agentId) + FINDINGS_QUALITY_NOTE;
  const userPrompt = buildUserPrompt(input);
  const { value, usage } = await runAgentLoop<AgentResult>(
    systemPrompt,
    userPrompt,
    maxTokensFor(agentId),
    (rawText) => JSON.parse(extractJSON(rawText)) as AgentResult,
    `Agent ${agentId}`,
  );
  value.usage = usage;
  return value;
}

// Combined spec: technical-auditor + meta-optimizer in ONE pass. Both lenses read
// the SAME page HTML, so running them together sends the page context once instead
// of twice. The two existing specs are embedded verbatim (single source of truth);
// only the final output shape is overridden to a two-key object we split apart.
const COMBINED_TECH_META_SPEC = `You are running TWO SEO analyses on the SAME page in a SINGLE pass, to avoid reading the page twice. Gather any tool data (curl, robots.txt, sitemap.xml, SERP) ONCE and reuse it across both analyses.

Below are two analysis specifications. Perform BOTH. Each spec contains its own "Output Format" — treat those ONLY as the description of that lens's \`findings\` and \`raw\` shape; do NOT emit two separate objects.

# ===== ANALYSIS A — Technical Auditor =====
${TECHNICAL_AUDITOR_SYSTEM_PROMPT}

# ===== ANALYSIS B — Meta Optimizer =====
${META_OPTIMIZER_SYSTEM_PROMPT}

# ===== FINAL OUTPUT (combined) =====
Return ONLY ONE valid JSON object (no markdown, no code fences, no commentary) with EXACTLY these two keys, each holding that lens's findings and raw per its spec above:
{
  "technical-auditor": { "findings": [ /* Finding objects */ ], "raw": { /* technical raw */ } },
  "meta-optimizer": { "findings": [ /* Finding objects */ ], "raw": { /* meta raw */ } }
}`;

interface CombinedLens {
  findings: Finding[];
  raw: Record<string, unknown>;
}

// Runs the technical-auditor + meta-optimizer pair as a single LLM call and
// splits the result back into two AgentResults so the rest of the pipeline (per-
// agent tabs, synthesis, progress) is unchanged. The combined token spend is
// attributed to technical-auditor; meta-optimizer carries zero to avoid double
// counting the shared call in the run total.
export async function runTechnicalMetaCombined(input: AgentInput): Promise<AgentResult[]> {
  const systemPrompt = TOOL_PREAMBLE + buildEvidenceNotes(input) + COMBINED_TECH_META_SPEC + FINDINGS_QUALITY_NOTE;
  const userPrompt = buildUserPrompt(input);
  const { value, usage } = await runAgentLoop<{ technical: CombinedLens; meta: CombinedLens }>(
    systemPrompt,
    userPrompt,
    maxTokensFor('technical-auditor') + maxTokensFor('meta-optimizer'),
    (rawText) => {
      const parsed = JSON.parse(extractJSON(rawText)) as Record<string, Partial<CombinedLens>>;
      const t = parsed['technical-auditor'];
      const m = parsed['meta-optimizer'];
      if (!t || !m) throw new Error('combined output missing a lens key');
      return {
        technical: { findings: Array.isArray(t.findings) ? t.findings : [], raw: t.raw ?? {} },
        meta: { findings: Array.isArray(m.findings) ? m.findings : [], raw: m.raw ?? {} },
      };
    },
    'Combined technical/meta',
  );

  return [
    { agentId: 'technical-auditor', findings: value.technical.findings, raw: value.technical.raw, usage },
    { agentId: 'meta-optimizer', findings: value.meta.findings, raw: value.meta.raw, usage: emptyUsage() },
  ];
}
