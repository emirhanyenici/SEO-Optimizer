'use client';

import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DashboardRun } from '@/lib/dashboard-context';
import { compareRuns } from '@/lib/compare-runs';

interface Props {
  prev: DashboardRun;
  current: DashboardRun;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-red-400/30 bg-red-500/10',
  warning: 'border-amber-400/30 bg-amber-500/10',
  info: 'border-white/[0.08] bg-white/[0.02]',
};

export function DriftPanel({ prev, current }: Props) {
  const changes = compareRuns(prev, current);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {new Date(prev.startedAt).toLocaleString('tr-TR')} → {new Date(current.startedAt).toLocaleString('tr-TR')} arası değişimler
      </p>

      {changes.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          İki çalışma arasında izlenen SEO sinyallerinde değişiklik yok.
        </p>
      ) : (
        changes.map((c) => {
          const Icon = c.direction === 'improvement' ? TrendingUp : c.direction === 'regression' ? TrendingDown : Minus;
          const iconColor = c.direction === 'improvement' ? 'text-emerald-400' : c.direction === 'regression' ? 'text-red-400' : 'text-gray-500';
          return (
            <div key={c.field} className={`rounded-lg border px-3 py-2.5 ${SEVERITY_STYLES[c.severity]}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                <span className="text-sm font-medium text-gray-200">{c.label}</span>
                {c.severity === 'critical' && (
                  <span className="text-[10px] uppercase tracking-wider text-red-300 bg-red-500/15 px-1.5 py-0.5 rounded">kritik</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 line-through break-all">{c.before}</span>
                <ArrowRight className="h-3 w-3 text-gray-600 flex-shrink-0" />
                <span className="text-gray-200 break-all">{c.after}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
