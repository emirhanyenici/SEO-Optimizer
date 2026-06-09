import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { runSubAgent } from '@/lib/run-sub-agent';
import { encodeSSE } from '@/lib/sse';
import { SYNTHESIS_SYSTEM_PROMPT } from '@/agents/orchestrator/synthesis-prompt';
import type { AgentId, AgentResult } from '@/types/agents';
import type { AnalysisRequest, BlogArticleRaw, FinalSEOReport } from '@/types/seo';

export const runtime = 'nodejs';
export const maxDuration = 300;

const client = new Anthropic();

const PHASE_1: AgentId[] = ['technical-auditor', 'page-speed', 'meta-optimizer', 'ai-visibility', 'company-intelligence'];
const PHASE_2: AgentId[] = ['internal-link', 'semantic-content'];
const PHASE_3: AgentId[] = ['cannibalization', 'competitor-gap', 'feedback-analyzer'];
const PHASE_4: AgentId[] = ['blog-writer'];

function extractJSON(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  const rawJSON = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (rawJSON) return rawJSON[1].trim();
  return text.trim();
}

async function runSynthesis(
  agentResults: AgentResult[],
  url: string,
  keyword: string | undefined,
  durationMs: number,
): Promise<FinalSEOReport> {
  const userPrompt = `Synthesize the following 10 SEO agent results for URL: ${url}${keyword ? `\nKeyword: ${keyword}` : ''}\n\nAgent results:\n${JSON.stringify(agentResults, null, 2)}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    system: SYNTHESIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find(c => c.type === 'text') as Anthropic.TextBlock | undefined;
  const rawText = textBlock?.text ?? '';
  const report = JSON.parse(extractJSON(rawText)) as FinalSEOReport;
  report.totalDurationMs = durationMs;
  return report;
}

export async function POST(req: NextRequest) {
  const body: AnalysisRequest = await req.json();
  const { url, keyword } = body;

  if (!url) {
    return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
  }

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

      const runAgent = async (agentId: AgentId): Promise<AgentResult | null> => {
        send({ type: 'agent_start', agentId, data: { url } });
        try {
          const result = await runSubAgent(agentId, { url, keyword });
          send({ type: 'agent_complete', agentId, data: { result, durationMs: Date.now() - analysisStart } });
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          send({ type: 'agent_error', agentId, data: { message, retryable: false } });
          return { agentId, findings: [], raw: { error: message } };
        }
      };

      try {
        const phase1Results = await Promise.all(PHASE_1.map(runAgent));
        const phase2Results = await Promise.all(PHASE_2.map(runAgent));
        const phase3Results = await Promise.all(PHASE_3.map(runAgent));
        const phase4Results = await Promise.all(PHASE_4.map(runAgent));

        const seoResults = [...phase1Results, ...phase2Results, ...phase3Results].filter(
          (r): r is AgentResult => r !== null
        );
        const blogResult = phase4Results[0] ?? null;

        const report = await runSynthesis(seoResults, url, keyword, Date.now() - analysisStart);

        if (blogResult) {
          const blogArticle = blogResult.raw.blog_article as BlogArticleRaw | undefined;
          if (blogArticle) report.blog_article = blogArticle;
          report.agentResults = [...report.agentResults, blogResult];
        }

        send({ type: 'final_report', data: { report } });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send({ type: 'agent_error', agentId: 'technical-auditor', data: { message, retryable: false } });
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
