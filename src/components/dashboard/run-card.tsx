'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import type { DashboardRun } from '@/lib/dashboard-context';
import { useDashboard } from '@/lib/dashboard-context';
import { AGENT_LABELS, type AgentId } from '@/types/agents';
import { ALL_AGENT_IDS } from '@/lib/dashboard-store';

function useElapsed(startedAt: number, active: boolean) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startedAt) / 1000));
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt, active]);
  return elapsed;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className={`flex flex-col items-center justify-center w-9 h-9 rounded-full border-2 ${
      score >= 80 ? 'border-green-400/30' : score >= 50 ? 'border-yellow-400/30' : 'border-red-400/30'
    } bg-white/[0.02]`}>
      <span className={`text-xs font-bold ${color}`}>{score}</span>
    </div>
  );
}

function AgentDot({ status }: { status: string }) {
  if (status === 'running') return <span className="w-2 h-2 rounded-full bg-blue-400 pulse-dot inline-block" />;
  if (status === 'complete') return <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />;
  if (status === 'error') return <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-white/10 inline-block" />;
}

interface Props {
  run: DashboardRun;
  onViewDetails: (run: DashboardRun) => void;
}

export function RunCard({ run, onViewDetails }: Props) {
  const { stopRun, deleteRun } = useDashboard();
  const elapsed = useElapsed(run.startedAt, run.status === 'running');
  const [hovered, setHovered] = useState(false);

  const hostname = (() => {
    try { return new URL(run.url).hostname; } catch { return run.url; }
  })();

  const duration = run.completedAt
    ? Math.floor((run.completedAt - run.startedAt) / 1000)
    : elapsed;

  const isRunning = run.status === 'running';
  const isCompleted = run.status === 'completed';

  return (
    <div
      className={`relative rounded-xl border bg-[#0a0a0a] p-4 group transition-all duration-200 cursor-default ${
        isRunning
          ? 'border-blue-500/30 shadow-[0_0_20px_rgba(24,140,255,0.07)]'
          : 'border-white/[0.06] hover:border-white/[0.12]'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              run.mode === 'single'
                ? 'bg-purple-500/15 text-purple-300'
                : 'bg-blue-500/10 text-blue-300'
            }`}>
              {run.mode === 'single' && run.singleAgentId
                ? AGENT_LABELS[run.singleAgentId]
                : 'Full Analysis'}
            </span>
            {run.partial && (
              <span
                className="text-xs px-1.5 py-0.5 rounded font-medium bg-amber-500/15 text-amber-300"
                title="Bazı ajanlar tamamlanmadı — rapor tamamlanan ajanlardan oluşturuldu"
              >
                Kısmi
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-white truncate max-w-[180px]" title={run.url}>
            {hostname}
          </p>
          {run.keyword && (
            <p className="text-xs text-gray-600 truncate mt-0.5">"{run.keyword}"</p>
          )}
        </div>

        <button
          onClick={() => isRunning ? stopRun(run.id) : deleteRun(run.id)}
          className="text-gray-600 hover:text-gray-300 flex-shrink-0 p-0.5 rounded hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100"
          title={isRunning ? 'Durdur' : 'Sil'}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Agent dots */}
      {run.mode === 'full' && (
        <div className="grid grid-cols-10 gap-1 mb-3">
          {(run.selectedAgents ?? ALL_AGENT_IDS).map((id) => (
            <div key={id} className="flex flex-col items-center gap-1" title={AGENT_LABELS[id]}>
              <AgentDot status={run.agentStates[id]?.status ?? 'pending'} />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {isRunning ? (
            <span className="text-blue-400">{duration}s çalışıyor</span>
          ) : (
            <span>{duration}s</span>
          )}
          {run.error && (
            <span className="text-red-400 truncate max-w-[100px]" title={run.error}>
              {run.error.slice(0, 30)}
            </span>
          )}
        </div>

        {isCompleted && run.report && (
          <ScoreCircle score={run.report.overallScore} />
        )}
      </div>

      {/* Details button */}
      {isCompleted && hovered && (
        <button
          onClick={() => onViewDetails(run)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full transition-all"
        >
          Detaylar
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
