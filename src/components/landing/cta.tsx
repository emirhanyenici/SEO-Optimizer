import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-blue-950/20 to-transparent p-12 overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/5 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              See the whole picture.
              <br />
              <span className="gradient-text-blue">Start free.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
              No account. No credit card. Just paste a URL and let 12 AI agents go to work.
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3.5 rounded-xl transition-colors text-sm"
            >
              Analyze your site now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
