'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { AgentId, AgentResult, AgentState, SSEEvent } from '@/types/agents';
import type { FinalSEOReport } from '@/types/seo';
import { ProgressPanel } from './progress-panel';
import { PriorityActions } from './priority-actions';
import { ResultsTabs } from './results-tabs';

const AGENT_IDS: AgentId[] = [
  'technical-auditor', 'page-speed', 'meta-optimizer', 'ai-visibility',
  'company-intelligence', 'internal-link', 'semantic-content',
  'cannibalization', 'competitor-gap', 'feedback-analyzer', 'blog-writer',
];

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
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), keyword: keyword.trim() || undefined }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
            handleSSEEvent(event);
          } catch {
            // ignore malformed lines
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  }, [url, keyword]);

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
