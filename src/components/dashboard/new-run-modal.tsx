'use client';

import { useState } from 'react';
import { X, ArrowRight, Globe } from 'lucide-react';
import { useDashboard } from '@/lib/dashboard-context';

interface Props {
  onClose: () => void;
}

export function NewRunModal({ onClose }: Props) {
  const { startRun, runs } = useDashboard();
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');

  const recentUrls = [...new Set(
    runs
      .filter((r) => r.status !== 'running')
      .map((r) => r.url)
  )].slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { setError('URL gerekli'); return; }
    let normalized = url.trim();
    if (!normalized.startsWith('http')) normalized = 'https://' + normalized;
    try {
      new URL(normalized);
    } catch {
      setError('Geçersiz URL'); return;
    }
    startRun(normalized, keyword.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0e0e0e] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Yeni Analiz Başlat</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/[0.06]">
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
            <label className="block text-xs text-gray-400 mb-1.5">Hedef Anahtar Kelime <span className="text-gray-600">(isteğe bağlı)</span></label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="örn. seo analiz aracı"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-colors"
            />
          </div>

          {recentUrls.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Son analizler</p>
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
              Analiz Başlat (10 Agent)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
