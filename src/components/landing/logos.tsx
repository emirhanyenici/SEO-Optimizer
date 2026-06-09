export function Logos() {
  const logos = [
    'Technical Audit',
    'Core Web Vitals',
    'Schema Markup',
    'SERP Analysis',
    'Content Gaps',
    'AI Visibility',
    'Internal Links',
    'Meta Optimization',
  ];

  return (
    <section className="py-12 border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs text-gray-600 uppercase tracking-widest mb-8">
          8 specialized analysis domains
        </p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          {logos.map((logo) => (
            <span key={logo} className="text-sm text-gray-600 font-medium">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
