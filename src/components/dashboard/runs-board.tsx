'use client';

import { useState } from 'react';
import { useDashboard, type DashboardRun } from '@/lib/dashboard-context';
import { RunCard } from './run-card';

interface Column {
  key: DashboardRun['status'];
  label: string;
  dotColor: string;
  emptyText: string;
}

const COLUMNS: Column[] = [
  { key: 'running', label: 'AKTİF', dotColor: 'bg-blue-400', emptyText: 'Aktif analiz yok' },
  { key: 'completed', label: 'TAMAMLANDI', dotColor: 'bg-green-400', emptyText: 'Tamamlanan yok' },
  { key: 'failed', label: 'BAŞARISIZ', dotColor: 'bg-red-400', emptyText: 'Başarısız analiz yok' },
  { key: 'stopped', label: 'DURDURULDU', dotColor: 'bg-gray-500', emptyText: 'Durdurulan yok' },
];

interface Props {
  onViewDetails: (run: DashboardRun) => void;
}

export function RunsBoard({ onViewDetails }: Props) {
  const { runs } = useDashboard();

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
