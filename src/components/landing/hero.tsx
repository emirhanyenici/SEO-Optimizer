'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const terminalLines = [
  { type: 'system', text: 'SEO Orchestrator initialized' },
  { type: 'agent', name: 'technical-auditor', text: 'Crawling robots.txt and sitemap...' },
  { type: 'agent', name: 'page-speed', text: 'Running Core Web Vitals analysis...' },
  { type: 'agent', name: 'meta-optimizer', text: 'Analyzing title tags and meta descriptions...' },
  { type: 'agent', name: 'ai-visibility', text: 'Checking AI citation readiness...' },
  { type: 'result', text: 'Phase 1 complete — 4 agents finished in 12.3s' },
  { type: 'agent', name: 'internal-link', text: 'Mapping internal link graph...' },
  { type: 'agent', name: 'semantic-content', text: 'Analyzing topical authority signals...' },
  { type: 'result', text: 'Critical: 3 canonical mismatches detected' },
  { type: 'result', text: 'Warning: LCP 4.2s — above 2.5s threshold' },
  { type: 'success', text: 'Report ready — 23 findings, score: 61/100' },
];

const colorMap: Record<string, string> = {
  system: 'text-gray-500',
  agent: 'text-blue-400',
  result: 'text-gray-300',
  success: 'text-green-400',
};

export function Hero() {
  return (
    <section className="pt-32 pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] rounded-full px-3 py-1 text-xs text-gray-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-dot" />
            8 AI agents running in parallel
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Your 24/7{' '}
            <span className="gradient-text-blue">AI SEO</span>
            <br />
            Specialist
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
            Paste a URL. Eight specialized AI agents analyze your site in parallel — technical issues, content gaps, speed, competitor intelligence — and deliver a prioritized action plan in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Analyze your site free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
            >
              See how it works
            </a>
          </div>

          <div className="flex flex-col gap-2">
            {['No account required', 'Free to use', 'Results in ~60 seconds'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full" />
          <div className="relative rounded-xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-gray-500 font-mono">seo-optimizer — analysis in progress</span>
            </div>
            <div className="p-4 font-mono text-xs space-y-1.5 min-h-[280px]">
              {terminalLines.map((line, i) => (
                <div key={i} className={`flex gap-2 ${colorMap[line.type]}`}>
                  <span className="text-gray-600 select-none flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {line.type === 'agent' ? (
                    <span>
                      <span className="text-blue-500">[{line.name}]</span>{' '}
                      <span className="text-gray-300">{line.text}</span>
                    </span>
                  ) : (
                    <span>{line.text}</span>
                  )}
                </div>
              ))}
              <div className="flex gap-2 text-gray-500">
                <span className="text-gray-600 select-none">12</span>
                <span>
                  <span className="typing-cursor">▋</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
