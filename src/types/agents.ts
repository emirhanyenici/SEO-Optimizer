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
  | 'blog-writer';

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
}

export interface AgentResult {
  agentId: AgentId;
  findings: Finding[];
  raw: Record<string, unknown>;
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
};
