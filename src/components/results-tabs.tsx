'use client';

import { useMemo, useState } from 'react';
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
        <span className="text-xs font-medium text-gray-300">Önerilen JSON-LD</span>
        <button onClick={copy} className="text-xs text-gray-400 hover:text-white">
          {copied ? 'Kopyalandı ✓' : 'Kopyala'}
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
            Blog Yazısı
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
              <p className="text-sm text-gray-500 text-center py-6">No issues found for this agent.</p>
            ) : (
              result.findings.map((finding) => (
                <div key={finding.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {finding.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900">{finding.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                      <div className="mt-2 rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
                        <p className="text-xs font-medium text-blue-800">Recommendation</p>
                        <p className="text-xs text-blue-700 mt-0.5">{finding.recommendation}</p>
                      </div>
                      {finding.evidence && finding.evidence.length > 0 && (
                        <div className="mt-2 rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Evidence</p>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {finding.evidence.map((e, i) => (
                              <li key={i} className="font-mono">{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(finding.falsifiability || finding.leadingIndicator) && (
                        <div className="mt-2 grid sm:grid-cols-2 gap-2">
                          {finding.falsifiability && (
                            <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
                              <p className="text-xs font-medium text-amber-800">Nasıl yanlışlanır</p>
                              <p className="text-xs text-amber-700 mt-0.5">{finding.falsifiability}</p>
                            </div>
                          )}
                          {finding.leadingIndicator && (
                            <div className="rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2">
                              <p className="text-xs font-medium text-emerald-800">Öncü gösterge</p>
                              <p className="text-xs text-emerald-700 mt-0.5">{finding.leadingIndicator}</p>
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
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-gray-900 mb-1">{blogArticle.title}</h3>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                    <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                      {blogArticle.word_count.toLocaleString()} kelime
                    </span>
                    <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {blogArticle.language}
                    </span>
                  </div>
                </div>
                <button
                  onClick={copyHtml}
                  className="flex-shrink-0 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  {copied ? 'Kopyalandı ✓' : 'HTML Kopyala'}
                </button>
              </div>

              {/* Meta description */}
              <div className="mt-3 rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
                <p className="text-xs font-medium text-blue-800 mb-0.5">Meta Description</p>
                <p className="text-xs text-blue-700">{blogArticle.meta_description}</p>
                <p className="text-[10px] text-blue-500 mt-1">{blogArticle.meta_description.length} karakter</p>
              </div>

              {/* Outline */}
              {blogArticle.outline.length > 0 && (
                <div className="mt-3 rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                  <p className="text-xs font-medium text-gray-700 mb-1.5">Makale Yapısı</p>
                  <ul className="space-y-1">
                    {blogArticle.outline.map((section, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-gray-400 font-mono">{i + 1}.</span>
                        {section}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* HTML Preview */}
            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Önizleme</span>
              </div>
              <div
                className="p-6 prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
