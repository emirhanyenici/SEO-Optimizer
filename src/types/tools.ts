export interface FetchPageInput { url: string }
export interface FetchPageOutput {
  html: string;
  statusCode: number;
  finalUrl: string;
  headers: Record<string, string>;
  loadTimeMs: number;
  error?: string;
}

export interface CheckStatusCodeInput { url: string }
export interface CheckStatusCodeOutput {
  statusCode: number;
  redirectChain: string[];
  finalUrl: string;
  error?: string;
}

export interface CheckRobotsInput { url: string }
export interface CheckRobotsOutput {
  accessible: boolean;
  content: string;
  disallowedPaths: string[];
  sitemapUrls: string[];
  crawlDelay?: number;
  error?: string;
}

export interface ParseSitemapInput { url: string }
export interface ParseSitemapOutput {
  urls: string[];
  sitemapIndexUrls: string[];
  totalCount: number;
  error?: string;
}

export interface ExtractMetaTagsInput { html: string; keyword?: string }
export interface ExtractMetaTagsOutput {
  title: { text: string; length: number };
  metaDescription: { text: string; length: number };
  h1: string[];
  h2: string[];
  h3: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  robots?: string;
  canonical?: string;
  lang?: string;
}

export interface ExtractInternalLinksInput { html: string; baseUrl: string }
export interface ExtractInternalLinksOutput {
  links: Array<{
    href: string;
    text: string;
    rel?: string;
    isNofollow: boolean;
  }>;
  totalCount: number;
  uniqueUrls: string[];
  nofollowCount: number;
}

export interface ExtractSchemaMarkupInput { html: string }
export interface ExtractSchemaMarkupOutput {
  schemas: Array<{
    type: string;
    raw: Record<string, unknown>;
    valid: boolean;
    errors: string[];
  }>;
  types: string[];
  hasErrors: boolean;
}

export interface CheckCanonicalInput { html: string; url: string }
export interface CheckCanonicalOutput {
  present: boolean;
  canonicalUrl?: string;
  isSelfReferencing: boolean;
  isRelative: boolean;
  mismatch: boolean;
}

export interface GetPageSpeedInput { url: string; strategy?: 'mobile' | 'desktop' }
export interface GetPageSpeedOutput {
  performanceScore: number;
  lcp: number;
  cls: number;
  inp: number;
  ttfb: number;
  fcp: number;
  opportunities: Array<{ id: string; title: string; description: string; savings: string }>;
  diagnostics: Array<{ id: string; title: string; description: string }>;
  error?: string;
}

export interface FetchSerpDataInput { keyword: string; location?: string; numResults?: number }
export interface FetchSerpDataOutput {
  results: Array<{
    position: number;
    url: string;
    title: string;
    description: string;
    domain: string;
  }>;
  totalResults: number;
  error?: string;
}
