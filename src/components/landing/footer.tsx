import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white text-sm">SEO Optimizer</span>
            </Link>
            <p className="text-gray-600 text-xs leading-relaxed max-w-[200px]">
              Multi-agent AI SEO analysis powered by Claude and built with Next.js.
            </p>
          </div>

          <div>
            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Analyze', href: '/analyze' },
                { label: 'Features', href: '#features' },
                { label: 'How it works', href: '#how-it-works' },
                { label: 'FAQ', href: '#faq' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-gray-600 hover:text-gray-300 text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-4">Agents</h4>
            <ul className="space-y-2.5">
              {[
                'Technical Audit',
                'Page Speed',
                'Meta Optimizer',
                'Company Intelligence',
                'AI Visibility',
                'Competitor Gap',
                'GEO',
                'Blog Writer',
              ].map((item) => (
                <li key={item}>
                  <span className="text-gray-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-4">Tech</h4>
            <ul className="space-y-2.5">
              {[
                'Claude Haiku 4.5',
                'Next.js 16',
                'Google PageSpeed API',
                'Live SERP Data',
                'Tailwind CSS v4',
                'Base UI',
              ].map((item) => (
                <li key={item}>
                  <span className="text-gray-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-700 text-xs">
            © 2026 SEO Optimizer. Built with Claude Code.
          </p>
          <p className="text-gray-700 text-xs">
            Powered by Anthropic Claude API
          </p>
        </div>
      </div>
    </footer>
  );
}
