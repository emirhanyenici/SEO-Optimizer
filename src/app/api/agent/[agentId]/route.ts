import { NextRequest } from 'next/server';
import type { AgentId } from '@/types/agents';
import { runSubAgent } from '@/lib/run-sub-agent';
import { encodeSSE } from '@/lib/sse';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VALID_AGENT_IDS: AgentId[] = [
  'technical-auditor', 'page-speed', 'internal-link', 'meta-optimizer',
  'semantic-content', 'cannibalization', 'competitor-gap', 'ai-visibility',
  'company-intelligence', 'feedback-analyzer', 'blog-writer', 'geo',
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId: rawId } = await params;
  const agentId = rawId as AgentId;

  if (!VALID_AGENT_IDS.includes(agentId)) {
    return new Response(JSON.stringify({ error: 'Invalid agent ID' }), { status: 400 });
  }

  let body: {
    url?: string;
    keyword?: string;
    instructions?: string;
    competitorUrls?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { url, keyword, instructions, competitorUrls } = body;
  if (!url) {
    return new Response(JSON.stringify({ error: 'url is required' }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (event: object) => {
        controller.enqueue(new TextEncoder().encode(encodeSSE(event as Parameters<typeof encodeSSE>[0])));
      };

      const now = () => Date.now();

      encode({ type: 'agent_start', agentId, timestamp: now(), data: { url } });

      try {
        const result = await runSubAgent(agentId, { url, keyword, instructions, competitorUrls });
        encode({
          type: 'agent_complete',
          agentId,
          timestamp: now(),
          data: { result, durationMs: 0 },
        });
      } catch (err) {
        encode({
          type: 'agent_error',
          agentId,
          timestamp: now(),
          data: { message: err instanceof Error ? err.message : String(err), retryable: false },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
