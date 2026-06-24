'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AGENT_LABELS, type AgentId, type AgentResult } from '@/types/agents';
import { SeverityBadge } from './severity-badge';
import { sanitizeBlogHtml } from '@/lib/sanitize-blog-html';
import type { BlogArticleRaw } from '@/types/seo';

interface ResultsTabsProps {
  agentResults: AgentResult[];
  blogArticle?: BlogArticleRaw;
  // The analyzed page URL — relative links in the blog preview are absolutized
  // against this so clicking one never hijacks the dashboard navigation.
  baseUrl?: string;
}

// Ready-to-paste JSON-LD block with its own copy button (used when a finding
// carries a suggestedSchema).
function SchemaBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="mt-2 rounded-md bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-300">Suggested JSON-LD</span>
        <button onClick={copy} aria-label="Copy JSON-LD" className="text-xs text-gray-400 hover:text-white">
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 text-xs text-gray-200 overflow-x-auto whitespace-pre-wrap break-all">{code}</pre>
    </div>
  );
}

export function ResultsTabs({ agentResults, blogArticle, baseUrl }: ResultsTabsProps) {
  const [copied, setCopied] = useState(false);

  // Sanitized copy for the on-screen preview only; the raw HTML is kept for the
  // "copy HTML" action below so the user's CMS receives the original links.
  const previewHtml = useMemo(
    () => (blogArticle ? sanitizeBlogHtml(blogArticle.html, baseUrl ?? '') : ''),
    [blogArticle, baseUrl],
  );

  const seoResults = agentResults.filter(r => r.agentId !== 'blog-writer');
  const hasBlog = !!blogArticle;

  if (seoResults.length === 0 && !hasBlog) return null;

  const defaultTab = hasBlog ? 'blog-article' : seoResults[0]?.agentId;

  const copyHtml = () => {
    if (!blogArticle) return;
    navigator.clipboard.writeText(blogArticle.html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
        {seoResults.map((result) => {
          const critical = result.findings.filter(f => f.severity === 'critical').length;
          return (
            <TabsTrigger key={result.agentId} value={result.agentId} className="text-xs">
              {AGENT_LABELS[result.agentId as AgentId]}
              {critical > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {critical}
                </span>
              )}
            </TabsTrigger>
          );
        })}
        {hasBlog && (
          <TabsTrigger value="blog-article" className="text-xs">
            Blog Post
            <span className="ml-1.5 bg-green-600 text-white text-xs rounded-full px-1.5 py-0.5">
              {blogArticle.word_count.toLocaleString()}w
            </span>
          </TabsTrigger>
        )}
      </TabsList>

      {seoResults.map((result) => (
        <TabsContent key={result.agentId} value={result.agentId}>
          <div className="space-y-3">
            {result.findings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
                <p className="text-sm font-medium text-gray-200">No issues found 🎉</p>
                <p className="text-xs text-gray-500">This agent didn&apos;t flag anything for review.</p>
              </div>
            ) : (
              result.findings.map((finding) => (
                <div key={finding.id} className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-xs text-gray-400 bg-white/[0.06] px-2 py-0.5 rounded">
                          {finding.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-gray-100">{finding.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{finding.description}</p>
                      <div className="mt-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                        <p className="text-xs font-medium text-blue-300">Recommendation</p>
                        <p className="text-xs text-blue-200 mt-0.5">{finding.recommendation}</p>
                      </div>
                      {finding.evidence && finding.evidence.length > 0 && (
                        <div className="mt-2 rounded-md bg-white/[0.02] border border-white/[0.06] px-3 py-2">
                          <p className="text-xs font-medium text-gray-300 mb-1">Evidence</p>
                          <ul className="text-xs text-gray-400 space-y-0.5">
                            {finding.evidence.map((e, i) => (
                              <li key={i} className="font-mono">{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(finding.falsifiability || finding.leadingIndicator) && (
                        <div className="mt-2 grid sm:grid-cols-2 gap-2">
                          {finding.falsifiability && (
                            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                              <p className="text-xs font-medium text-amber-300">How to falsify</p>
                              <p className="text-xs text-amber-200 mt-0.5">{finding.falsifiability}</p>
                            </div>
                          )}
                          {finding.leadingIndicator && (
                            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                              <p className="text-xs font-medium text-emerald-300">Leading indicator</p>
                              <p className="text-xs text-emerald-200 mt-0.5">{finding.leadingIndicator}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {finding.suggestedSchema && <SchemaBlock code={finding.suggestedSchema} />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      ))}

      {hasBlog && (
        <TabsContent value="blog-article">
          <div className="space-y-4">
            {/* Header row */}
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-gray-100 mb-1">{blogArticle.title}</h3>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                    <span className="bg-green-500/15 text-green-300 border border-green-400/30 px-2 py-0.5 rounded-full font-medium">
                      {blogArticle.word_count.toLocaleString()} words
                    </span>
                    <span className="bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full uppercase tracking-wider text-gray-400">
                      {blogArticle.language}
                    </span>
                  </div>
                </div>
                <button
                  onClick={copyHtml}
                  aria-label="Copy blog HTML"
                  className="flex-shrink-0 text-xs bg-white/[0.06] border border-white/[0.08] text-gray-200 px-3 py-1.5 rounded-lg hover:bg-white/[0.1] transition-colors font-medium"
                >
                  {copied ? 'Copied ✓' : 'Copy HTML'}
                </button>
              </div>

              {/* Meta description */}
              <div className="mt-3 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                <p className="text-xs font-medium text-blue-300 mb-0.5">Meta Description</p>
                <p className="text-xs text-blue-200">{blogArticle.meta_description}</p>
                <p className="text-[10px] text-blue-400 mt-1">{blogArticle.meta_description.length} characters</p>
              </div>

              {/* Outline */}
              {blogArticle.outline.length > 0 && (
                <div className="mt-3 rounded-md bg-white/[0.02] border border-white/[0.06] px-3 py-2">
                  <p className="text-xs font-medium text-gray-300 mb-1.5">Article Outline</p>
                  <ul className="space-y-1">
                    {blogArticle.outline.map((section, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                        <span className="text-gray-500 font-mono">{i + 1}.</span>
                        {section}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* HTML Preview */}
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] overflow-hidden">
              <div className="border-b border-white/[0.08] px-4 py-2 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Preview</span>
              </div>
              <div
                className="p-6 prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
