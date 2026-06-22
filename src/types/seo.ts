import type { AgentId, AgentResult, Finding, UsageTotals } from './agents';

export interface AnalysisRequest {
  url: string;
  keyword?: string;
  competitorUrls?: string[];
  // Which analysis agents to run. Omitted or empty → all of them (backwards
  // compatible). `blog-writer` is NOT part of this list — it stays gated behind
  // `includeBlog` because it is the single most expensive step.
  agents?: AgentId[];
  // Opt-in: the blog-writer is the single most expensive agent (long article
  // output + multiple competitor fetches), so it only runs when requested.
  includeBlog?: boolean;
}

export interface PriorityAction {
  rank: number;
  severity: 'critical' | 'warning' | 'opportunity';
  agentId: AgentId;
  title: string;
  impact: string;
  effort: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface BlogArticleRaw {
  title: string;
  language: string;
  word_count: number;
  meta_description: string;
  html: string;
  outline: string[];
}

export interface FinalSEOReport {
  url: string;
  keyword?: string;
  analyzedAt: string;
  totalDurationMs: number;
  agentResults: AgentResult[];
  priorityActions: PriorityAction[];
  overallScore: number;
  summary: string;
  blog_article?: BlogArticleRaw;
  // Run-wide token spend + Haiku-priced cost estimate for this analysis.
  // Absent on client-built partial reports (the client never sees usage data).
  usageTotals?: UsageTotals;
  // True when the report was assembled from the agents that finished rather
  // than from the LLM synthesis step (stream cut off, or synthesis skipped).
  partial?: boolean;
}

export interface TechnicalAuditRaw {
  robotsTxt: { accessible: boolean; disallowed: string[]; hasSitemap: boolean };
  canonical: { present: boolean; selfReferencing: boolean; url?: string };
  noindex: boolean;
  statusCode: number;
  redirectChain: string[];
  sitemapUrls: string[];
  hreflang: { present: boolean; locales: string[] };
  schemaTypes: string[];
}

export interface PageSpeedRaw {
  lcp: number;
  cls: number;
  inp: number;
  ttfb: number;
  fcp: number;
  performanceScore: number;
  opportunities: Array<{ title: string; savings: string }>;
}

export interface MetaOptimizerRaw {
  title: { text: string; length: number; hasKeyword: boolean; truncated: boolean };
  metaDescription: { text: string; length: number; hasKeyword: boolean; truncated: boolean };
  h1Count: number;
  h1Texts: string[];
  ogPresent: boolean;
  twitterCardPresent: boolean;
  ctrScore: number;
}
