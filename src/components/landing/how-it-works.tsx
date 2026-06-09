const steps = [
  {
    number: '01',
    title: 'Paste your URL',
    description: 'Enter any page URL and optionally your target keyword. No account needed.',
  },
  {
    number: '02',
    title: 'Agents run in parallel',
    description: 'The orchestrator dispatches all 8 agents simultaneously across three phases, cutting analysis time by 4×.',
  },
  {
    number: '03',
    title: 'Live streaming results',
    description: 'Watch agents complete in real time via SSE streaming. No spinner, no waiting — see progress as it happens.',
  },
  {
    number: '04',
    title: 'Prioritized action plan',
    description: 'Get a ranked list of the top 10 actions sorted by impact vs effort, with specific recommendations per finding.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-white/[0.01] border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            From URL to action plan in 60 seconds
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            No configuration, no onboarding. Just analysis.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%_-_12px)] w-6 h-px bg-white/10 z-10" />
              )}
              <div className="card-dark rounded-xl p-6">
                <div className="text-3xl font-bold text-white/10 mb-4 font-mono">{step.number}</div>
                <h3 className="text-white font-semibold mb-2 text-sm">{step.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-white/[0.06] bg-[#080808] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-sm text-gray-400 font-medium">Live Agent Activity</span>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
              Analyzing example.com
            </div>
          </div>
          <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: 'Technical Audit', phase: 1, status: 'complete', time: '8.2s' },
              { name: 'Page Speed', phase: 1, status: 'complete', time: '11.4s' },
              { name: 'Meta Optimizer', phase: 1, status: 'complete', time: '6.1s' },
              { name: 'AI Visibility', phase: 1, status: 'complete', time: '9.8s' },
              { name: 'Internal Links', phase: 2, status: 'running', time: '' },
              { name: 'Semantic Content', phase: 2, status: 'running', time: '' },
              { name: 'Cannibalization', phase: 3, status: 'pending', time: '' },
              { name: 'Competitor Gap', phase: 3, status: 'pending', time: '' },
            ].map((agent) => (
              <div
                key={agent.name}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <div>
                  <div className="text-xs text-white font-medium">{agent.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">Phase {agent.phase}</div>
                </div>
                <div className={`flex items-center gap-1 text-xs ${
                  agent.status === 'complete' ? 'text-green-400' :
                  agent.status === 'running' ? 'text-blue-400' :
                  'text-gray-600'
                }`}>
                  {agent.status === 'complete' ? (
                    <>✓ {agent.time}</>
                  ) : agent.status === 'running' ? (
                    <span className="pulse-dot">●</span>
                  ) : (
                    <span>–</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
