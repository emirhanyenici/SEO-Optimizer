'use client';

import { useState } from 'react';
import { X, ExternalLink, RefreshCw } from 'lucide-react';
import type { DashboardRun } from '@/lib/dashboard-context';
import { useDashboard } from '@/lib/dashboard-context';
import { PriorityActions } from '@/components/priority-actions';
import { ResultsTabs } from '@/components/results-tabs';
import { PdfDownloadButton } from '@/components/pdf/pdf-download-button';

interface Props {
  run: DashboardRun;
  onClose: () => void;
}

export function RunDetailModal({ run, onClose }: Props) {
  const { startRun } = useDashboard();
  const [tab, setTab] = useState<'actions' | 'findings'>('actions');

  const report = run.report;
  if (!report) return null;

  const duration = run.completedAt
    ? Math.floor((run.completedAt - run.startedAt) / 1000)
    : null;

  const score = report.overallScore;
  const scoreColor = score >= 80 ? 'text-green-400 border-green-400/30' :
                     score >= 50 ? 'text-yellow-400 border-yellow-400/30' :
                     'text-red-400 border-red-400/30';

  const handleRerun = () => {
    startRun(run.url, run.keyword);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] border border-white/[0.1] rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-4 px-5 py-4 border-b border-white/[0.06]">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 ${scoreColor} bg-white/[0.02] flex-shrink-0`}>
            <span className={`text-sm font-bold ${scoreColor.split(' ')[0]}`}>{score}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold text-sm truncate">{run.url}</h2>
              <a href={run.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-300 flex-shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {run.partial && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium bg-amber-500/15 text-amber-300 flex-shrink-0"
                  title="Bazı ajanlar tamamlanmadı — rapor tamamlanan ajanlardan oluşturuldu"
                >
                  Kısmi rapor
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              {run.keyword && <span>"{run.keyword}"</span>}
              {duration && <span>{duration}s</span>}
              <span>{new Date(run.startedAt).toLocaleString('tr-TR')}</span>
              <span>{report.priorityActions.length} aksiyon</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <PdfDownloadButton
              report={report}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleRerun}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Yeniden Analiz
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex-shrink-0 flex items-center gap-1 px-5 py-2 border-b border-white/[0.06]">
          <button
            onClick={() => setTab('actions')}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              tab === 'actions'
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Öncelikli Aksiyonlar ({report.priorityActions.length})
          </button>
          <button
            onClick={() => setTab('findings')}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              tab === 'findings'
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Bulgular ({report.agentResults.reduce((s, r) => s + r.findings.length, 0)})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {run.partial && (
            <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
              Bu kısmi bir rapordur: analiz tamamlanmadan (akış kesildi) bitti. Aşağıdaki sonuçlar
              yalnızca başarıyla tamamlanan ajanlardan toplandı; sentez aşaması atlandı.
            </div>
          )}
          {tab === 'actions' ? (
            <PriorityActions
              actions={report.priorityActions}
              overallScore={report.overallScore}
              summary={report.summary}
            />
          ) : (
            <ResultsTabs agentResults={report.agentResults} />
          )}
        </div>
      </div>
    </div>
  );
}
