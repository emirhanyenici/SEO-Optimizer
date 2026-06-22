export type AgentId =
  | 'technical-auditor'
  | 'page-speed'
  | 'internal-link'
  | 'meta-optimizer'
  | 'semantic-content'
  | 'cannibalization'
  | 'competitor-gap'
  | 'ai-visibility'
  | 'company-intelligence'
  | 'feedback-analyzer'
  | 'blog-writer'
  | 'geo';

export type AgentStatus = 'pending' | 'running' | 'complete' | 'error';

export interface Finding {
  id: string;
  severity: 'critical' | 'warning' | 'opportunity';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  evidence?: string[];
  // How we would know this recommendation failed — makes the finding testable
  // rather than a blind assertion (claude-seo FLOW falsifiability principle).
  falsifiability?: string;
  // The early metric to watch to confirm the fix is working (e.g. "impressions
  // for this query in GSC over 2-4 weeks").
  leadingIndicator?: string;
  // Ready-to-paste JSON-LD when the finding is about missing/incorrect schema.
  suggestedSchema?: string;
}

// Per-agent (or analysis-wide) token spend + a Haiku-priced cost estimate,
// surfaced for real-time cost visibility. See src/lib/usage.ts.
export interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  estimatedCostUsd: number;
}

export interface AgentResult {
  agentId: AgentId;
  findings: Finding[];
  raw: Record<string, unknown>;
  usage?: UsageTotals;
}

export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  startedAt?: number;
  completedAt?: number;
  result?: AgentResult;
  error?: string;
}

export type SSEEventType =
  | 'agent_start'
  | 'agent_complete'
  | 'agent_error'
  | 'orchestrator_thinking'
  | 'final_report';

export interface SSEEvent {
  type: SSEEventType;
  agentId?: AgentId;
  timestamp: number;
  data: unknown;
}

export const AGENT_LABELS: Record<AgentId, string> = {
  'technical-auditor': 'Technical Audit',
  'page-speed': 'Page Speed',
  'internal-link': 'Internal Links',
  'meta-optimizer': 'Meta Optimizer',
  'semantic-content': 'Semantic Content',
  'cannibalization': 'Cannibalization',
  'competitor-gap': 'Competitor Gap',
  'ai-visibility': 'AI Visibility',
  'company-intelligence': 'Company Intelligence',
  'feedback-analyzer': 'Feedback Analyzer',
  'blog-writer': 'Blog Writer',
  'geo': 'GEO',
};
