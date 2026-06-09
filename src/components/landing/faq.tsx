'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How does the multi-agent architecture work?',
    a: 'An orchestrator agent receives your URL and dispatches 8 specialized sub-agents in parallel across three phases. Each agent uses a tailored system prompt and a set of tools specific to its domain — for example, the Page Speed agent calls Google PageSpeed Insights, while the Competitor Gap agent queries live SERP data via Apify. The orchestrator synthesizes all findings into a single prioritized report.',
  },
  {
    q: 'How long does an analysis take?',
    a: 'Most analyses complete in 30–90 seconds. The bottleneck is usually the Competitor Gap agent, which waits for live SERP data. Phase 1 agents (Technical Audit, Page Speed, Meta Optimizer, AI Visibility) typically finish in 8–15 seconds running in parallel.',
  },
  {
    q: 'Does it work on JavaScript-heavy SPAs?',
    a: 'The current version fetches server-rendered HTML, which works for most server-side and static sites. Client-side rendered SPAs (Next.js SPA mode, React without SSR) may return limited content. Rendered analysis is on the roadmap.',
  },
  {
    q: 'What are the API requirements?',
    a: 'You need an Anthropic API key (for Claude agents). Google PageSpeed Insights works without a key but is rate-limited. The Competitor Gap agent requires an Apify API token for live SERP data — without it, that agent gracefully skips.',
  },
  {
    q: 'What AI model does it use?',
    a: 'All agents run on claude-sonnet-4-6, Anthropic\'s most cost-effective high-performance model. Each full analysis costs roughly $0.05–0.15 in API tokens depending on page content length.',
  },
  {
    q: 'How is the SEO score calculated?',
    a: 'The orchestrator assigns a 0–100 score based on the severity distribution of findings. Critical issues reduce the score significantly, warnings moderately, and opportunities represent potential gains. The score reflects technical and content health, not ranking position.',
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
