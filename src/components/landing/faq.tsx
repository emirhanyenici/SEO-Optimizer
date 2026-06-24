'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How does the multi-agent architecture work?',
    a: 'Your URL is dispatched to up to 12 specialized sub-agents that run in parallel across phased waves. Each agent uses a tailored system prompt and tools specific to its domain — for example, the Page Speed agent calls Google PageSpeed Insights, while the Competitor Gap agent queries live SERP data. A synthesis step then combines every finding into a single prioritized report.',
  },
  {
    q: 'How long does an analysis take?',
    a: 'Most analyses complete in 30–90 seconds. The bottleneck is usually the Competitor Gap and GEO agents, which wait for live SERP data. Phase 1 agents (Technical Audit, Page Speed, Meta Optimizer, Company Intelligence, AI Visibility) typically finish in 8–15 seconds running in parallel.',
  },
  {
    q: 'Can I control which agents run and the cost?',
    a: 'Yes. Before each run you choose exactly which of the 12 agents execute — fewer agents means fewer tokens and lower cost. The Blog Writer (a 2,500+ word article) is the most expensive agent and is off by default; you opt in only when you want it.',
  },
  {
    q: 'What is GEO (Generative Engine Optimization)?',
    a: 'GEO measures how ready your content is to be cited by AI answer engines like ChatGPT, Perplexity, and Claude. The dedicated GEO agent scores extractable answers, entity consistency, and crawlable HTML, and benchmarks you against competitor URLs you provide or that it discovers from the SERP.',
  },
  {
    q: 'Does it work on JavaScript-heavy SPAs?',
    a: 'The current version fetches server-rendered HTML, which works for most server-side and static sites. Client-side rendered SPAs (Next.js SPA mode, React without SSR) may return limited content. Rendered analysis is on the roadmap.',
  },
  {
    q: 'What AI model does it use?',
    a: 'All agents run on claude-haiku-4-5, chosen to keep per-crawl cost low while staying fast. The pipeline also applies prompt caching and shared-evidence prefetching so the same page and SERP data aren\'t re-fetched by every agent.',
  },
  {
    q: 'How is the SEO score calculated?',
    a: 'The report assigns a 0–100 score based on the severity distribution of findings. Critical issues reduce the score significantly, warnings moderately, and opportunities represent potential gains. The score reflects technical and content health, not ranking position.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
          Frequently asked questions
        </h2>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="card-dark rounded-xl overflow-hidden transition-all duration-200"
          >
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="text-white text-sm font-medium pr-4">{faq.q}</span>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            {open === i && (
              <div className="px-5 pb-4">
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
