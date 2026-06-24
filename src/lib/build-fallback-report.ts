import type { AgentId, AgentResult, Finding } from '@/types/agents';
import type { BlogArticleRaw, FinalSEOReport, PriorityAction } from '@/types/seo';

// The fields a synthesized report needs beyond the raw agent results.
export interface SynthesisCore {
  priorityActions: PriorityAction[];
  overallScore: number;
  summary: string;
}

const SEVERITY_RANK = { critical: 0, warning: 1, opportunity: 2 } as const;
const LEVEL_RANK = { high: 0, medium: 1, low: 2 } as const;

export function collectFindings(
  results: AgentResult[],
): Array<Finding & { agentId: AgentId }> {
  return results.flatMap(r => (r.findings ?? []).map(f => ({ ...f, agentId: r.agentId })));
}

export function scoreFindings(findings: Finding[]): number {
  const score = findings.reduce((acc, f) => {
    return acc - (f.severity === 'critical' ? 10 : f.severity === 'warning' ? 3 : 1);
  }, 100);
  return Math.max(0, score);
}

// Deterministic report core assembled from successful agents — used both when
// the LLM synthesis step fails server-side and when the client never receives
// a `final_report` (stream cut off mid-run). Never throws away finished work.
export function buildFallbackSynthesis(results: AgentResult[]): SynthesisCore {
  const all = collectFindings(results);
  const ranked = [...all].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      LEVEL_RANK[a.impact] - LEVEL_RANK[b.impact] ||
      LEVEL_RANK[a.effort] - LEVEL_RANK[b.effort],
  );

  const priorityActions: PriorityAction[] = ranked.slice(0, 10).map((f, i) => ({
    rank: i + 1,
    severity: f.severity,
    agentId: f.agentId,
    title: f.title,
    impact: f.description || `${f.impact}-impact finding`,
    effort: f.effort,
    recommendation: f.recommendation,
  }));

  const counts = {
    critical: all.filter(f => f.severity === 'critical').length,
    warning: all.filter(f => f.severity === 'warning').length,
    opportunity: all.filter(f => f.severity === 'opportunity').length,
  };
  const score = scoreFindings(all);
  const topCritical = ranked.filter(f => f.severity === 'critical').slice(0, 2).map(f => f.title);
  const summary =
    `Automated summary (synthesis step skipped): collected ${all.length} findings from ${results.length} agents — ` +
    `${counts.critical} critical, ${counts.warning} warnings, ${counts.opportunity} opportunities. Overall score ${score}/100.` +
    (topCritical.length ? ` Top critical issues: ${topCritical.join('; ')}.` : '');

  return { priorityActions, overallScore: score, summary };
}

// Assemble a full FinalSEOReport from a synthesis core plus the raw agent
// results, splitting the blog-writer result out into `blog_article`.
export function assembleReport(
  core: SynthesisCore,
  seoResults: AgentResult[],
  blogResult: AgentResult | null,
  url: string,
  keyword: string | undefined,
  durationMs: number,
  partial = false,
): FinalSEOReport {
  const report: FinalSEOReport = {
    url,
    keyword,
    analyzedAt: new Date().toISOString(),
    totalDurationMs: durationMs,
    agentResults: blogResult ? [...seoResults, blogResult] : seoResults,
    priorityActions: core.priorityActions,
    overallScore: core.overallScore,
    summary: core.summary,
    ...(partial ? { partial: true } : {}),
  };
  if (blogResult) {
    const blogArticle = blogResult.raw.blog_article as BlogArticleRaw | undefined;
    if (blogArticle) report.blog_article = blogArticle;
  }
  return report;
}

// Build a partial report purely from the agent results that finished — used by
// the client when the stream ends before a `final_report` arrives, so even a
// single successful agent yields a viewable, downloadable (PDF) report.
export function buildPartialReport(args: {
  url: string;
  keyword?: string;
  agentResults: AgentResult[];
  durationMs: number;
}): FinalSEOReport {
  const blogResult = args.agentResults.find(r => r.agentId === 'blog-writer') ?? null;
  const seoResults = args.agentResults.filter(r => r.agentId !== 'blog-writer');
  const core = buildFallbackSynthesis(seoResults);
  return assembleReport(core, seoResults, blogResult, args.url, args.keyword, args.durationMs, true);
}
