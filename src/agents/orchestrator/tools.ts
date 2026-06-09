import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const ORCHESTRATOR_TOOLS: Tool[] = [
  {
    name: 'run_technical_audit',
    description: 'Run a full technical SEO audit: robots.txt, canonical tags, noindex, status codes, redirect chains, sitemap, hreflang, schema markup. Call this immediately — fast and blocks other decisions.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The full URL to audit' },
        keyword: { type: 'string', description: 'Primary target keyword (optional)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'run_page_speed_analysis',
    description: 'Analyze Core Web Vitals (LCP, CLS, INP, TTFB) via Google PageSpeed Insights. Checks image optimization and render-blocking resources.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keyword: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'run_meta_optimizer_analysis',
    description: 'Optimize title tags and meta descriptions for CTR. Checks title length, keyword placement, emotional triggers, meta description quality, H1 structure, OG tags.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keyword: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'run_ai_visibility_analysis',
    description: 'Analyze how well the page is optimized for AI search visibility (ChatGPT, Bing Copilot, Perplexity citations). Checks answer formatting, FAQ schema, extractable content.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keyword: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'run_internal_link_analysis',
    description: 'Analyze internal linking: orphan pages, anchor text diversity, nofollow usage, link depth, broken internal links.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keyword: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'run_semantic_content_analysis',
    description: 'Analyze semantic SEO quality: topical completeness, search intent alignment, entity coverage, E-E-A-T signals, content structure.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keyword: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'run_cannibalization_analysis',
    description: 'Detect keyword cannibalization and content overlap: intent collision, keyword stuffing, title/H1/URL misalignment.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keyword: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'run_competitor_gap_analysis',
    description: 'Analyze competitor opportunities: keyword gaps, content gaps, SERP feature ownership. Uses Apify SERP scraper — runs last due to latency.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keyword: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'run_company_intelligence_analysis',
    description: 'Extract business context behind the URL: business model, industry, target audience, geographic focus, company stage, and strategic SEO content gaps specific to this business type.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keyword: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'run_feedback_analysis',
    description: 'Root cause analysis and SEO pattern recognition. Finds systemic issues that explain multiple symptoms simultaneously. Identifies high-leverage fixes where one change resolves several problems.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keyword: { type: 'string' },
      },
      required: ['url'],
    },
  },
];
