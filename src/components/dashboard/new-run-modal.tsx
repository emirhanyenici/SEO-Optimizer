'use client';

import { useState } from 'react';
import { X, ArrowRight, Globe } from 'lucide-react';
import { useDashboard } from '@/lib/dashboard-context';
import { AGENT_LABELS, type AgentId } from '@/types/agents';
import { ALL_AGENT_IDS } from '@/lib/dashboard-store';

// Selectable analysis agents (blog-writer has its own opt-in toggle below).
const ANALYSIS_AGENT_IDS: AgentId[] = ALL_AGENT_IDS.filter((id) => id !== 'blog-writer');

interface Props {
  onClose: () => void;
}

export function NewRunModal({ onClose }: Props) {
  const { startRun, runs } = useDashboard();
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [includeBlog, setIncludeBlog] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<AgentId[]>(ANALYSIS_AGENT_IDS);
  const [error, setError] = useState('');

  const toggleAgent = (id: AgentId) =>
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  const allSelected = selectedAgents.length === ANALYSIS_AGENT_IDS.length;

  const recentUrls = [...new Set(
    runs
      .filter((r) => r.status !== 'running')
      .map((r) => r.url)
  )].slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { setError('URL is required'); return; }
    let normalized = url.trim();
    if (!normalized.startsWith('http')) normalized = 'https://' + normalized;
    try {
      new URL(normalized);
    } catch {
      setError('Invalid URL'); return;
    }
    if (selectedAgents.length === 0 && !includeBlog) {
      setError('Select at least one agent'); return;
    }
    startRun(normalized, keyword.trim() || undefined, { includeBlog, agents: selectedAgents });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0e0e0e] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Start New Analysis</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/[0.06]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Website URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                placeholder="https://example.com"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Target Keyword <span className="text-gray-600">(optional)</span></label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. seo analysis tool"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-gray-400">Agents to run</label>
              <button
                type="button"
                onClick={() => setSelectedAgents(allSelected ? [] : ANALYSIS_AGENT_IDS)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {allSelected ? 'None' : 'All'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ANALYSIS_AGENT_IDS.map((id) => {
                const checked = selectedAgents.includes(id);
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-2 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                      checked
                        ? 'border-blue-500/40 bg-blue-500/10 text-gray-200'
                        : 'border-white/[0.08] bg-white/[0.02] text-gray-500 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAgent(id)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-blue-600"
                    />
                    <span className="truncate">{AGENT_LABELS[id]}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-600 mt-1.5">Only the selected agents run — fewer agents, lower cost.</p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
            <input
              type="checkbox"
              checked={includeBlog}
              onChange={(e) => setIncludeBlog(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-600"
            />
            <span className="text-xs text-gray-300">
              Also generate a blog post
              <span className="block text-gray-600">The most expensive step — off by default. When enabled, it generates a 2,500+ word article and increases cost.</span>
            </span>
          </label>

          {recentUrls.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Recent analyses</p>
              <div className="flex flex-wrap gap-1.5">
                {recentUrls.map((u) => {
                  const host = (() => { try { return new URL(u).hostname; } catch { return u; } })();
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrl(u)}
                      className="text-xs text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 bg-white/[0.02] px-2 py-1 rounded-md transition-colors"
                    >
                      {host}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Start Analysis ({selectedAgents.length + (includeBlog ? 1 : 0)} agents)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
