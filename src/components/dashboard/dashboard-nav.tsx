'use client';

import Link from 'next/link';
import { Zap, Plus, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useDashboard } from '@/lib/dashboard-context';

interface Props {
  onNewRun: () => void;
}

export function DashboardNav({ onNewRun }: Props) {
  const { runs, clearCompleted } = useDashboard();
  const running = runs.filter((r) => r.status === 'running').length;
  const total = runs.length;

  return (
    <header className="flex-shrink-0 h-12 border-b border-white/[0.06] bg-[#020202]/90 backdrop-blur-sm flex items-center px-4 gap-3 z-50">
      <Link href="/" className="flex items-center gap-2 mr-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-semibold text-white text-sm">SEO Optimizer</span>
      </Link>

      <div className="h-4 w-px bg-white/10" />

      <nav className="flex items-center gap-1">
        <span className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.1] text-white text-xs font-medium px-3 py-1.5 rounded-md">
          <LayoutDashboard className="h-3 w-3" />
          Board
        </span>
        <Link
          href="/analyze"
          className="flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          Raporlar
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {running > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400 border border-blue-400/20 bg-blue-400/5 px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-dot" />
            {running} aktif
          </div>
        )}

        {total > 0 && (
          <span className="text-xs text-gray-600 border border-white/[0.06] px-2.5 py-1 rounded-md">
            {total} analiz
          </span>
        )}

        <button
          onClick={clearCompleted}
          className="text-gray-500 hover:text-gray-300 p-1.5 rounded-md hover:bg-white/[0.04] transition-colors"
          title="Tamamlananları temizle"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onNewRun}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Analiz
        </button>
      </div>
    </header>
  );
}
