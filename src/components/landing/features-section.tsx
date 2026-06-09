import {
  Search,
  Zap,
  Link2,
  FileText,
  BarChart3,
  Bot,
  Shield,
  Target,
} from 'lucide-react';

const agents = [
  {
    icon: Shield,
    title: 'Technical Audit',
    description: 'Detects broken redirects, canonical mismatches, robots.txt issues, missing sitemaps, and hreflang errors.',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
  {
    icon: Zap,
    title: 'Core Web Vitals',
    description: 'Pulls LCP, CLS, INP, TTFB, and FCP from Google PageSpeed Insights with specific optimization opportunities.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: FileText,
    title: 'Meta Optimizer',
    description: 'Analyzes title tag CTR potential, meta descriptions, H1 alignment, and Open Graph completeness.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: Link2,
    title: 'Internal Link Analysis',
    description: 'Maps your link graph, identifies orphaned pages, over-linked pages, and anchor text diversity gaps.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    icon: Search,
    title: 'Semantic Content',
    description: 'Evaluates topical authority, entity coverage, search intent match, and content depth vs. competitors.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: Target,
    title: 'Keyword Cannibalization',
    description: 'Identifies pages competing for the same search intent, causing ranking dilution and confusing Google.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    icon: BarChart3,
    title: 'Competitor Gap',
    description: 'Scrapes live SERP data via Apify to find keyword and content opportunities your competitors rank for.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: Bot,
    title: 'AI Visibility',
    description: 'Checks if your content is structured to be cited by ChatGPT, Perplexity, and AI search engines.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
          8 agents. One report.
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Each specialized agent digs deep into a single domain, then the orchestrator combines all findings into a single prioritized action plan.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.title}
              className="card-dark rounded-xl p-5 group hover:glow-blue transition-all duration-200"
            >
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${agent.bg} mb-4`}>
                <Icon className={`h-4.5 w-4.5 ${agent.color}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">{agent.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{agent.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
