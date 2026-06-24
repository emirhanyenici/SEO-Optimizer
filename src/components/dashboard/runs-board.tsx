'use client';

import { Sparkles } from 'lucide-react';
import { useDashboard, type DashboardRun } from '@/lib/dashboard-context';
import { RunCard } from './run-card';

interface Column {
  key: DashboardRun['status'];
  label: string;
  dotColor: string;
  emptyText: string;
}

const COLUMNS: Column[] = [
  { key: 'running', label: 'ACTIVE', dotColor: 'bg-blue-400', emptyText: 'No active analyses' },
  { key: 'completed', label: 'COMPLETED', dotColor: 'bg-green-400', emptyText: 'Nothing completed yet' },
  { key: 'failed', label: 'FAILED', dotColor: 'bg-red-400', emptyText: 'No failed analyses' },
  { key: 'stopped', label: 'STOPPED', dotColor: 'bg-gray-500', emptyText: 'Nothing stopped' },
];

interface Props {
  onViewDetails: (run: DashboardRun) => void;
}

export function RunsBoard({ onViewDetails }: Props) {
  const { runs } = useDashboard();

  // First-time / empty dashboard: show a single warm welcome instead of four
  // empty columns.
  if (runs.length === 0) {
    return (
      <main className="flex-1 overflow-hidden flex items-center justify-center p-4">
        <div className="max-w-md text-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-8 py-12">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-100">No analyses yet</h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Start a new run to analyze a URL with 12 specialist agents. Your runs will appear here as
            cards you can track, compare, and export.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-hidden flex gap-4 p-4">
      {COLUMNS.map((col) => {
        const colRuns = runs.filter((r) => r.status === col.key);
        return (
          <div key={col.key} className="flex-1 min-w-0 flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2 h-2 rounded-full ${col.dotColor} ${col.key === 'running' ? 'pulse-dot' : ''}`} />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {col.label}
              </span>
              {colRuns.length > 0 && (
                <span className="ml-auto text-xs text-gray-600 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">
                  {colRuns.length}
                </span>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {colRuns.length === 0 ? (
                <div className="border border-dashed border-white/[0.06] rounded-xl p-6 text-center text-xs text-gray-700">
                  {col.emptyText}
                </div>
              ) : (
                colRuns.map((run) => (
                  <RunCard key={run.id} run={run} onViewDetails={onViewDetails} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </main>
  );
}
