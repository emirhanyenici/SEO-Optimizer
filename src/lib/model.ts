import type { AgentId } from '@/types/agents';

// Central model + token configuration for all Claude calls in the analysis pipeline.
// Default model is Haiku to keep per-crawl cost low; override with ANTHROPIC_MODEL.
export const ANALYSIS_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';

// Sub-agents and the synthesizer emit large JSON objects (findings + raw blocks);
// the blog-writer emits a full 2500-3500 word HTML article. 2048 truncated the
// output and broke JSON.parse. max_tokens is only a ceiling — short agents pay
// solely for what they generate — so a high cap is safe and prevents truncation.
export const MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS) || 16384;

// Per-agent output ceiling. Only the blog-writer genuinely needs the full 16k
// (long HTML article); every other agent emits findings JSON that fits well
// under 8k. A lower cap doesn't reduce normal cost (you pay for what you
// generate) but bounds the worst case of a runaway loop. Override the default
// for all non-blog agents with ANTHROPIC_AGENT_MAX_TOKENS.
const AGENT_MAX_TOKENS: Partial<Record<AgentId, number>> = {
  'blog-writer': MAX_TOKENS,
};

export function maxTokensFor(agentId: AgentId): number {
  return AGENT_MAX_TOKENS[agentId] ?? (Number(process.env.ANTHROPIC_AGENT_MAX_TOKENS) || 8192);
}
