'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Globe } from 'lucide-react';
import { useDashboard } from '@/lib/dashboard-context';
import type { AgentId } from '@/types/agents';
import { AGENT_LABELS } from '@/types/agents';

const AGENT_DESCS: Partial<Record<AgentId, string>> = {
  'technical-auditor': 'robots.txt, canonical URL, yönlendirmeler, site haritası ve şema işaretlemeleri',
  'page-speed': 'Google PageSpeed API ile Core Web Vitals: LCP, CLS, INP, TTFB',
  'meta-optimizer': 'Başlık CTR potansiyeli, meta açıklaması, H1 hizalaması, Open Graph',
  'internal-link': 'Bağlantı grafiği, yetim sayfalar, çapa metin çeşitliliği',
  'semantic-content': 'Topikal otorite, varlık kapsamı, arama niyeti eşleşmesi',
  'cannibalization': 'Aynı anahtar kelime için rekabet eden sayfalar ve sıralama seyrelmesi',
  'competitor-gap': 'Canlı SERP verileri ile rakip anahtar kelime fırsatları',
  'ai-visibility': 'ChatGPT, Perplexity ve yapay zeka arama motoru alıntı hazırlığı',
};

const AGENT_COLORS: Partial<Record<AgentId, string>> = {
  'technical-auditor': 'bg-red-500',
  'page-speed': 'bg-yellow-500',
  'meta-optimizer': 'bg-blue-500',
  'ai-visibility': 'bg-pink-500',
  'internal-link': 'bg-green-500',
  'semantic-content': 'bg-purple-500',
  'cannibalization': 'bg-orange-500',
  'competitor-gap': 'bg-cyan-500',
};

interface Props {
  agentId: AgentId;
  onClose: () => void;
}

export function AgentRunModal({ agentId, onClose }: Props) {
  const { startAgentRun, runs } = useDashboard();
  const [url, setUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const color = AGENT_COLORS[agentId] ?? 'bg-blue-500';
  const initial = AGENT_LABELS[agentId]?.[0] ?? 'A';

  const activeRun = runs.find(
    (r) => r.mode === 'single' && r.singleAgentId === agentId && r.status === 'running'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { setError('URL gerekli'); return; }
    let normalized = url.trim();
    if (!normalized.startsWith('http')) normalized = 'https://' + normalized;
    try { new URL(normalized); } catch { setError('Geçersiz URL'); return; }
    startAgentRun(agentId, normalized, instructions.trim() || undefined);
    setSubmitted(true);
  };

  const agentState = activeRun?.agentStates[agentId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0e0e0e] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${color} text-white font-bold text-sm flex-shrink-0`}>
            {initial}
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">{AGENT_LABELS[agentId]}</h2>
            <p className="text-xs text-gray-600">{AGENT_DESCS[agentId]}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/[0.06]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Analiz edilecek URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(''); }}
                  placeholder="https://example.com"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Özel talimatlar <span className="text-gray-600">(isteğe bağlı)</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={`Bu agent için özel bir odak noktası belirtin...\nörn. "Özellikle mobil performansa odaklan"`}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Çalıştır
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 text-sm ${
              agentState?.status === 'running' ? 'text-blue-400' :
              agentState?.status === 'complete' ? 'text-green-400' :
              agentState?.status === 'error' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {agentState?.status === 'running' && <span className="pulse-dot">●</span>}
              {agentState?.status === 'complete' && <span>✓</span>}
              {agentState?.status === 'error' && <span>✗</span>}
              <span className="capitalize">
                {agentState?.status === 'running' ? 'Analiz ediliyor...' :
                 agentState?.status === 'complete' ? 'Tamamlandı' :
                 agentState?.status === 'error' ? `Hata: ${agentState.error}` :
                 'Başlatılıyor...'}
              </span>
            </div>

            {activeRun?.events.map((ev, i) => (
              <div key={i} className="text-xs text-gray-500 font-mono bg-white/[0.02] rounded-lg p-2.5 truncate">
                [{ev.type}] {ev.agentId ?? 'system'}
              </div>
            ))}

            {(agentState?.status === 'complete' || agentState?.status === 'error') && (
              <button
                onClick={onClose}
                className="w-full border border-white/[0.08] hover:border-white/20 text-gray-300 hover:text-white text-sm py-2.5 rounded-lg transition-colors"
              >
                Dashboard'a dön
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
