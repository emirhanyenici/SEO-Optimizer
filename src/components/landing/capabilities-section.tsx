import {
  SlidersHorizontal,
  GitCompareArrows,
  Code2,
  FileDown,
  Sparkles,
  Gauge,
  FlaskConical,
} from 'lucide-react';

// Product capabilities that sit on top of the agent roster — the things that
// shipped after the original 8-agent launch and weren't reflected anywhere on
// the marketing page.
const capabilities = [
  {
    icon: SlidersHorizontal,
    title: 'Agent selection & cost control',
    description: 'Pick exactly which agents run before each analysis. Fewer agents means fewer tokens — you decide the depth-vs-cost trade-off.',
  },
  {
    icon: GitCompareArrows,
    title: 'Drift comparison',
    description: 'Re-run any URL and see a deterministic diff against the previous run — title, canonical, noindex, schema, score, and finding counts.',
  },
  {
    icon: Code2,
    title: 'Schema JSON-LD generation',
    description: 'When critical structured data is missing, agents generate valid, copy-paste-ready JSON-LD you can drop straight into your page.',
  },
  {
    icon: Sparkles,
    title: 'AI-search visibility (GEO)',
    description: 'A dedicated agent scores how citable you are by ChatGPT, Perplexity, and Claude, and benchmarks you against competitors.',
    accent: 'violet' as const,
  },
  {
    icon: Gauge,
    title: 'CrUX field data',
    description: 'Real-user Core Web Vitals (p75 LCP, INP, CLS) pulled from the Chrome UX Report — actual visitor experience, not just lab metrics.',
  },
  {
    icon: FlaskConical,
    title: 'Falsifiable findings',
    description: 'Every recommendation ships with how you\'d know it failed and a leading indicator to watch — testable advice, not vague guidance.',
    accent: 'violet' as const,
  },
  {
    icon: FileDown,
    title: 'PDF export',
    description: 'Download the full report — priority actions, findings, evidence, and the generated blog article — as a clean, shareable PDF.',
  },
];

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
          More than findings.{' '}
          <span className="gradient-text-violet">A workflow.</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Beyond the agent roster, the toolkit gives you control over cost, change tracking, AI-search
          readiness, and shareable output.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {capabilities.map((cap) => {
          const Icon = cap.icon;
          const violet = cap.accent === 'violet';
          return (
            <div
              key={cap.title}
              className={`card-dark rounded-xl p-5 transition-all duration-200 ${
                violet ? 'hover:glow-violet' : 'hover:glow-blue'
              }`}
            >
              <div
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-4 ${
                  violet ? 'bg-violet-400/10' : 'bg-blue-400/10'
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 ${violet ? 'text-violet-400' : 'text-blue-400'}`}
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">{cap.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{cap.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
