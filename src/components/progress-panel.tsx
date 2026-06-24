'use client';

import { CheckCircle, XCircle, Loader2, Circle } from 'lucide-react';
import { AGENT_LABELS, type AgentId, type AgentState } from '@/types/agents';
import { cn } from '@/lib/utils';

const AGENT_ORDER: AgentId[] = [
  'technical-auditor',
  'page-speed',
  'meta-optimizer',
  'ai-visibility',
  'company-intelligence',
  'internal-link',
  'semantic-content',
  'cannibalization',
  'competitor-gap',
  'feedback-analyzer',
  'geo',
  'blog-writer',
];

interface ProgressPanelProps {
  agentStates: Record<AgentId, AgentState>;
  // Restrict which agents are shown (e.g. hide blog-writer when not requested).
  agentIds?: AgentId[];
}

export function ProgressPanel({ agentStates, agentIds }: ProgressPanelProps) {
  const order = agentIds ?? AGENT_ORDER;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {order.map((id) => {
        const state = agentStates[id];
        return (
          <div
            key={id}
            role="status"
            aria-label={`${AGENT_LABELS[id]}: ${state.status}`}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
              state.status === 'running' && 'border-blue-400/30 bg-blue-500/10 text-blue-200',
              state.status === 'complete' && 'border-green-400/30 bg-green-500/10 text-green-200',
              state.status === 'error' && 'border-red-400/30 bg-red-500/10 text-red-200',
              state.status === 'pending' && 'border-white/[0.08] bg-white/[0.02] text-gray-500'
            )}
          >
            <StatusIcon status={state.status} />
            <span className="font-medium truncate">{AGENT_LABELS[id]}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatusIcon({ status }: { status: AgentState['status'] }) {
  if (status === 'running') return <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />;
  if (status === 'complete') return <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />;
  if (status === 'error') return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
  return <Circle className="h-4 w-4 text-gray-600 shrink-0" />;
}
