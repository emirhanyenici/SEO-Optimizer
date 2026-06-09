'use client';

import { AGENT_LABELS } from '@/types/agents';
import type { PriorityAction } from '@/types/seo';
import { SeverityBadge } from './severity-badge';
import { cn } from '@/lib/utils';

const EFFORT_LABELS = { low: 'Easy', medium: 'Medium', high: 'Hard' };
const EFFORT_STYLES = {
  low: 'text-green-700 bg-green-100',
  medium: 'text-yellow-700 bg-yellow-100',
  high: 'text-red-700 bg-red-100',
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
      <div className="flex items-start gap-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 shrink-0"
          style={{ borderColor: scoreColor(overallScore) }}>
          <span className="text-2xl font-bold" style={{ color: scoreColor(overallScore) }}>
            {overallScore}
          </span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-1">SEO Health Score</h2>
          <p className="text-sm text-gray-600">{summary}</p>
        </div>
      </div>

      {/* Action list */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Priority Actions</h2>
        </div>
        <ul className="divide-y">
          {actions.map((action) => (
            <li key={action.rank} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center mt-0.5">
                  {action.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SeverityBadge severity={action.severity} />
                    <span className="text-xs text-gray-400">{AGENT_LABELS[action.agentId]}</span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', EFFORT_STYLES[action.effort])}>
                      {EFFORT_LABELS[action.effort]}
                    </span>
                  </div>
                  <p className="font-medium text-sm text-gray-900">{action.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{action.impact}</p>
                  <p className="text-xs text-gray-700 mt-1 bg-gray-50 rounded px-2 py-1">{action.recommendation}</p>
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
