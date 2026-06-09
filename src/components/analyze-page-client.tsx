'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, Zap, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { AnalyzeForm } from './analyze-form';

export function AnalyzePageClient() {
  const [started, setStarted] = useState(false);
  const handleStarted = useCallback(() => setStarted(true), []);

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col">
      {/* Header — full width */}
      <header className="border-b border-white/[0.06] bg-[#020202]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full px-6 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">SEO Optimizer</span>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-gray-500">
            <span className="border border-white/10 px-2 py-1 rounded-md">8 Agents</span>
            <span className="border border-white/10 px-2 py-1 rounded-md">Parallel</span>
          </div>
        </div>
      </header>

      {/* Main — single AnalyzeForm instance; wrapper changes layout when analysis starts */}
      <main
        className={
          started
            ? 'flex-1 w-full max-w-6xl mx-auto px-6 py-8'
            : 'flex-1 flex flex-col items-center justify-center px-6 py-16'
        }
      >
        {/* Hero intro — hidden once analysis starts */}
        {!started && (
          <div className="w-full max-w-2xl text-center mb-8">
            <div className="inline-flex items-center gap-2 text-xs text-blue-400 border border-blue-500/20 bg-blue-500/10 rounded-full px-3 py-1 mb-6">
              <Zap className="h-3 w-3" />
              8 AI agents running in parallel
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Analyze your website
            </h1>
            <p className="text-gray-400 text-base leading-relaxed">
              Paste any URL. Eight specialized AI agents examine your site in parallel — technical issues, speed, content gaps, competitor intelligence — and deliver a prioritized action plan in under 60 seconds.
            </p>
          </div>
        )}

        {/* Form — always mounted, width adapts to layout state */}
        <div className={started ? 'w-full' : 'w-full max-w-2xl'}>
          <AnalyzeForm onStarted={handleStarted} />
        </div>
      </main>
    </div>
  );
}
