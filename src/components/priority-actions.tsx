'use client';

import { AGENT_LABELS } from '@/types/agents';
import type { PriorityAction } from '@/types/seo';
import { SeverityBadge } from './severity-badge';
import { cn } from '@/lib/utils';

const EFFORT_LABELS = { low: 'Easy', medium: 'Medium', high: 'Hard' };
const EFFORT_STYLES = {
  low: 'text-green-300 bg-green-500/15',
  medium: 'text-amber-300 bg-amber-500/15',
  high: 'text-red-300 bg-red-500/15',
};

interface PriorityActionsProps {
  actions: PriorityAction[];
  overallScore: number;
  summary: string;
}

export function PriorityActions({ actions, overallScore, summary }: PriorityActionsProps) {
  return (
    <div className="space-y-4">
      {/* Score + Summary */}
      <div className="flex items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div
          className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 shrink-0 bg-white/[0.02]"
          style={{ borderColor: scoreColor(overallScore) }}
          role="img"
          aria-label={`SEO health score ${overallScore} out of 100`}
        >
          <span className="text-2xl font-bold" style={{ color: scoreColor(overallScore) }}>
            {overallScore}
          </span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-100 mb-1">SEO Health Score</h2>
          <p className="text-sm text-gray-400">{summary}</p>
        </div>
      </div>

      {/* Action list */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
          <h2 className="font-semibold text-gray-100">Priority Actions</h2>
        </div>
        <ul className="divide-y divide-white/[0.06]">
          {actions.map((action) => (
            <li key={action.rank} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-start gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-white/[0.06] text-xs font-bold text-gray-400 flex items-center justify-center mt-0.5">
                  {action.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SeverityBadge severity={action.severity} />
                    <span className="text-xs text-gray-500">{AGENT_LABELS[action.agentId]}</span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', EFFORT_STYLES[action.effort])}>
                      {EFFORT_LABELS[action.effort]}
                    </span>
                  </div>
                  <p className="font-medium text-sm text-gray-100">{action.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{action.impact}</p>
                  <p className="text-xs text-gray-300 mt-1 bg-white/[0.02] border border-white/[0.06] rounded px-2 py-1">{action.recommendation}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}
