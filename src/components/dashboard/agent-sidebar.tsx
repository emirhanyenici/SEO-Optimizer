'use client';

import { useDashboard } from '@/lib/dashboard-context';
import type { AgentId } from '@/types/agents';

interface AgentConfig {
  id: AgentId | 'orchestrator';
  label: string;
  desc: string;
  color: string;
  initial: string;
}

// `accent` tints the section header — violet marks the AI/GEO surfaces (secondary
// accent), everything else stays neutral so blue/violet keep distinct meaning.
const AGENT_GROUPS: { section: string; accent?: 'violet'; agents: AgentConfig[] }[] = [
  {
    section: 'MANAGEMENT',
    agents: [
      { id: 'orchestrator', label: 'SEO Orchestrator', desc: 'Coordinates all agents, produces the priority plan', color: 'bg-blue-600', initial: 'O' },
    ],
  },
  {
    section: 'PHASE 1',
    agents: [
      { id: 'technical-auditor', label: 'Technical Audit', desc: 'robots.txt, canonical, redirects, sitemap', color: 'bg-red-500', initial: 'T' },
      { id: 'page-speed', label: 'Page Speed', desc: 'Core Web Vitals — LCP, CLS, INP, TTFB', color: 'bg-yellow-500', initial: 'P' },
      { id: 'meta-optimizer', label: 'Meta Optimizer', desc: 'Title CTR, meta description, H1, OG', color: 'bg-blue-500', initial: 'M' },
      { id: 'ai-visibility', label: 'AI Visibility', desc: 'ChatGPT and Perplexity citation readiness', color: 'bg-pink-500', initial: 'A' },
      { id: 'company-intelligence', label: 'Company Intelligence', desc: 'Business model, audience, strategy gaps', color: 'bg-teal-500', initial: 'C' },
    ],
  },
  {
    section: 'PHASE 2',
    agents: [
      { id: 'internal-link', label: 'Internal Links', desc: 'Link graph, orphan pages', color: 'bg-green-500', initial: 'L' },
      { id: 'semantic-content', label: 'Semantic Content', desc: 'Topical authority, intent match', color: 'bg-purple-500', initial: 'S' },
    ],
  },
  {
    section: 'PHASE 3',
    agents: [
      { id: 'cannibalization', label: 'Cannibalization', desc: 'Keyword overlap, ranking dilution', color: 'bg-orange-500', initial: 'C' },
      { id: 'competitor-gap', label: 'Competitor Gap', desc: 'SERP data, competitor opportunities', color: 'bg-cyan-500', initial: 'G' },
      { id: 'feedback-analyzer', label: 'Feedback Analyzer', desc: 'Root-cause analysis, high-impact fixes', color: 'bg-violet-500', initial: 'F' },
    ],
  },
  {
    section: 'GEO',
    accent: 'violet',
    agents: [
      { id: 'geo', label: 'GEO', desc: 'AI citation readiness, competitor comparison', color: 'bg-fuchsia-500', initial: 'G' },
    ],
  },
  {
    section: 'CONTENT',
    accent: 'violet',
    agents: [
      { id: 'blog-writer', label: 'Blog Writer', desc: 'Generates a full SEO-focused blog post', color: 'bg-emerald-500', initial: 'B' },
    ],
  },
];

interface Props {
  onAgentClick: (agentId: AgentId | 'orchestrator') => void;
}

export function AgentSidebar({ onAgentClick }: Props) {
  const { runs } = useDashboard();

  const agentStatuses = new Map<string, 'idle' | 'running' | 'done' | 'error'>();
  for (const run of runs.filter((r) => r.status === 'running')) {
    for (const [id, state] of Object.entries(run.agentStates)) {
      if (state.status === 'running') agentStatuses.set(id, 'running');
      else if (state.status === 'complete' && agentStatuses.get(id) !== 'running') agentStatuses.set(id, 'done');
      else if (state.status === 'error' && agentStatuses.get(id) !== 'running') agentStatuses.set(id, 'error');
    }
  }

  return (
    <aside className="w-[240px] flex-shrink-0 border-r border-white/[0.06] overflow-y-auto py-3">
      {AGENT_GROUPS.map(({ section, accent, agents }) => (
        <div key={section} className="mb-4">
          <p className={`px-4 py-1 text-[10px] font-semibold uppercase tracking-widest ${
            accent === 'violet' ? 'text-violet-400/80' : 'text-gray-600'
          }`}>
            {section}
          </p>
          {agents.map((agent) => {
            const status = agentStatuses.get(agent.id) ?? 'idle';
            return (
              <button
                key={agent.id}
                onClick={() => onAgentClick(agent.id as AgentId | 'orchestrator')}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors group text-left"
              >
                <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${agent.color} text-white text-xs font-bold`}>
                  {agent.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors truncate">
                    {agent.label}
                  </p>
                  <p className="text-[10px] text-gray-600 truncate leading-tight mt-0.5">
                    {agent.desc}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {status === 'running' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-dot inline-block" />
                  ) : status === 'done' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  ) : status === 'error' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/10 inline-block opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
