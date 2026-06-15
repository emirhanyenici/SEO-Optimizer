'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { AgentId, AgentResult, AgentState, SSEEvent } from '@/types/agents';
import type { FinalSEOReport } from '@/types/seo';
import { ProgressPanel } from './progress-panel';
import { PriorityActions } from './priority-actions';
import { ResultsTabs } from './results-tabs';
import { PdfDownloadButton } from './pdf/pdf-download-button';
import { buildPartialReport } from '@/lib/build-fallback-report';

const AGENT_IDS: AgentId[] = [
  'technical-auditor', 'page-speed', 'meta-optimizer', 'ai-visibility',
  'company-intelligence', 'internal-link', 'semantic-content',
  'cannibalization', 'competitor-gap', 'feedback-analyzer', 'geo', 'blog-writer',
];

// Trim, prepend https:// when no scheme, validate, cap at 5. Used for the
// optional competitor list the GEO / blog-writer agents consume.
function parseCompetitorUrls(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('http') ? line : 'https://' + line))
    .filter((line) => {
      try { new URL(line); return true; } catch { return false; }
    })
    .slice(0, 5);
}

function initialStates(): Record<AgentId, AgentState> {
  return Object.fromEntries(
    AGENT_IDS.map((id) => [id, { id, status: 'pending' as const }])
  ) as Record<AgentId, AgentState>;
}

interface AnalyzeFormProps {
  onStarted?: () => void;
}

export function AnalyzeForm({ onStarted }: AnalyzeFormProps = {}) {
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [competitorsText, setCompetitorsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStates, setAgentStates] = useState<Record<AgentId, AgentState>>(initialStates());
  const [report, setReport] = useState<FinalSEOReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const updateAgent = useCallback((agentId: AgentId, updates: Partial<AgentState>) => {
    setAgentStates(prev => ({
      ...prev,
      [agentId]: { ...prev[agentId], ...updates },
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setReport(null);
    setAgentStates(initialStates());
    setStarted(true);
    onStarted?.();

    try {
      const competitorUrls = parseCompetitorUrls(competitorsText);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          keyword: keyword.trim() || undefined,
          competitorUrls: competitorUrls.length > 0 ? competitorUrls : undefined,
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const startedAt = Date.now();
      // Track finished results so we can salvage a partial report if the stream
      // ends before a `final_report` (timeout, server killed mid-run).
      const completed = new Map<AgentId, AgentResult>();
      let gotFinalReport = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as SSEEvent;
            if (event.type === 'agent_complete' && event.agentId) {
              completed.set(event.agentId, (event.data as { result: AgentResult }).result);
            } else if (event.type === 'final_report') {
              gotFinalReport = true;
            }
            handleSSEEvent(event);
          } catch {
            // ignore malformed lines
          }
        }
      }

      // Stream closed without a synthesized report — build one from the agents
      // that finished, so even a single success is viewable / downloadable.
      if (!gotFinalReport && completed.size > 0) {
        setReport(buildPartialReport({
          url: url.trim(),
          keyword: keyword.trim() || undefined,
          agentResults: [...completed.values()],
          durationMs: Date.now() - startedAt,
        }));
      } else if (!gotFinalReport) {
        setError('Stream ended without final report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  }, [url, keyword, competitorsText]);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'agent_start':
        if (event.agentId) updateAgent(event.agentId, { status: 'running', startedAt: event.timestamp });
        break;
      case 'agent_complete':
        if (event.agentId) {
          const data = event.data as { result: AgentResult; durationMs: number };
          updateAgent(event.agentId, { status: 'complete', completedAt: event.timestamp, result: data.result });
        }
        break;
      case 'agent_error':
        if (event.agentId) {
          const data = event.data as { message: string };
          updateAgent(event.agentId, { status: 'error', error: data.message });
        }
        break;
      case 'final_report': {
        const data = event.data as { report: FinalSEOReport };
        setReport(data.report);
        break;
      }
    }
  }, [updateAgent]);

  const agentResults = Object.values(agentStates)
    .filter(s => s.result)
    .map(s => s.result!);

  return (
    <div className="space-y-6">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
            URL to analyze
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-300 mb-1">
            Target keyword <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="e.g. best seo tools 2025"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="competitors" className="block text-sm font-medium text-gray-300 mb-1">
            Competitor URLs <span className="text-gray-500 font-normal">(optional, one per line, max 5)</span>
          </label>
          <textarea
            id="competitors"
            value={competitorsText}
            onChange={e => setCompetitorsText(e.target.value)}
            placeholder={`https://competitor-1.com/page\nhttps://competitor-2.com/page`}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-600 mt-1">
            GEO ajanı bunları sizin domaininizle karşılaştırır. Boş bırakırsanız SERP&apos;ten otomatik bulunur.
          </p>
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {isLoading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Agent progress */}
      {started && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Agent Status</h2>
          <ProgressPanel agentStates={agentStates} />
        </div>
      )}

      {/* Final report */}
      {report && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              Analiz Raporu
              {report.partial && (
                <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-amber-500/15 text-amber-300 normal-case tracking-normal">
                  Kısmi
                </span>
              )}
            </h2>
            <PdfDownloadButton report={report} />
          </div>
          {report.partial && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
              Analiz tamamlanmadan (akış kesildi) bitti. Bu rapor yalnızca başarıyla tamamlanan
              ajanlardan oluşturuldu; sentez aşaması atlandı.
            </div>
          )}
          <PriorityActions
            actions={report.priorityActions}
            overallScore={report.overallScore}
            summary={report.summary}
          />
          <div>
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Detailed Findings by Agent
            </h2>
            <ResultsTabs agentResults={agentResults} blogArticle={report.blog_article} />
          </div>
        </>
      )}
    </div>
  );
}
