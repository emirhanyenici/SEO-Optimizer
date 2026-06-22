// Reuses the EXISTING agent system prompts verbatim (single source of truth) —
// these files are plain string exports with no runtime imports, so the live web
// app and this MCP server always stay in sync. Nothing in src/ is modified.
import { TECHNICAL_AUDITOR_SYSTEM_PROMPT } from '../../src/agents/technical-auditor/system-prompt';
import { PAGE_SPEED_SYSTEM_PROMPT } from '../../src/agents/page-speed/system-prompt';
import { META_OPTIMIZER_SYSTEM_PROMPT } from '../../src/agents/meta-optimizer/system-prompt';
import { INTERNAL_LINK_SYSTEM_PROMPT } from '../../src/agents/internal-link/system-prompt';
import { SEMANTIC_CONTENT_SYSTEM_PROMPT } from '../../src/agents/semantic-content/system-prompt';
import { CANNIBALIZATION_SYSTEM_PROMPT } from '../../src/agents/cannibalization/system-prompt';
import { COMPETITOR_GAP_SYSTEM_PROMPT } from '../../src/agents/competitor-gap/system-prompt';
import { AI_VISIBILITY_SYSTEM_PROMPT } from '../../src/agents/ai-visibility/system-prompt';
import { COMPANY_INTELLIGENCE_SYSTEM_PROMPT } from '../../src/agents/company-intelligence/system-prompt';
import { FEEDBACK_ANALYZER_SYSTEM_PROMPT } from '../../src/agents/feedback-analyzer/system-prompt';
import { BLOG_WRITER_SYSTEM_PROMPT } from '../../src/agents/blog-writer/system-prompt';
import { GEO_SYSTEM_PROMPT } from '../../src/agents/geo/system-prompt';
import { ORCHESTRATOR_SYSTEM_PROMPT } from '../../src/agents/orchestrator/system-prompt';
import { SYNTHESIS_SYSTEM_PROMPT } from '../../src/agents/orchestrator/synthesis-prompt';

export interface AgentDef {
  /** MCP prompt name (what the user invokes in their Claude client). */
  name: string;
  /** Human-readable label. */
  label: string;
  /** One-line description shown in the prompt picker. */
  description: string;
  /** The existing agent system prompt, reused verbatim. */
  systemPrompt: string;
  /** Short, actionable checklist for the full-analysis orchestrator (omitted for content-generation agents). */
  checks?: string;
}

export const AGENTS: AgentDef[] = [
  { name: 'technical-auditor', label: 'Technical Auditor', description: 'Robots, canonical, redirects, schema, indexability.', systemPrompt: TECHNICAL_AUDITOR_SYSTEM_PROMPT, checks: 'indexability (robots.txt + meta robots/noindex), canonical correctness, redirect chains, sitemap presence, hreflang, structured-data (schema) types' },
  { name: 'page-speed', label: 'Page Speed', description: 'Core Web Vitals (LCP, CLS, INP, TTFB) and performance.', systemPrompt: PAGE_SPEED_SYSTEM_PROMPT, checks: 'LCP/CLS/INP/TTFB vs thresholds, render-blocking resources, image optimization (lazy-load, WebP/AVIF, width/height), font-display:swap, caching + compression' },
  { name: 'meta-optimizer', label: 'Meta Optimizer', description: 'Title, meta description, H1, Open Graph, CTR.', systemPrompt: META_OPTIMIZER_SYSTEM_PROMPT, checks: 'title length + keyword placement, meta description length + CTR appeal, exactly one H1, Open Graph / Twitter card tags' },
  { name: 'internal-link', label: 'Internal Links', description: 'Orphan pages, anchor text, link depth.', systemPrompt: INTERNAL_LINK_SYSTEM_PROMPT, checks: 'orphan / under-linked pages, descriptive anchor text, click depth, broken internal links' },
  { name: 'semantic-content', label: 'Semantic Content', description: 'Topical completeness and entity coverage.', systemPrompt: SEMANTIC_CONTENT_SYSTEM_PROMPT, checks: 'topical completeness vs search intent, entity/subtopic coverage, content depth vs competitors' },
  { name: 'cannibalization', label: 'Cannibalization', description: 'Keyword overlap and intent collisions.', systemPrompt: CANNIBALIZATION_SYSTEM_PROMPT, checks: 'multiple pages competing for the same keyword/intent, overlapping titles, duplicate-purpose content' },
  { name: 'competitor-gap', label: 'Competitor Gap', description: 'Keyword/content gaps vs. SERP competitors.', systemPrompt: COMPETITOR_GAP_SYSTEM_PROMPT, checks: 'subtopics/keywords competitors cover that the target misses, SERP features, depth gaps (use the serp evidence)' },
  { name: 'ai-visibility', label: 'AI Visibility', description: 'AI-search readiness, FAQ schema, llms.txt.', systemPrompt: AI_VISIBILITY_SYSTEM_PROMPT, checks: 'FAQ/HowTo schema, clear Q&A structure, llms.txt, extractable/citable answer blocks' },
  { name: 'company-intelligence', label: 'Company Intelligence', description: 'Business model, industry, strategic gaps.', systemPrompt: COMPANY_INTELLIGENCE_SYSTEM_PROMPT, checks: 'business model + value proposition clarity, trust signals (about/pricing/contact), strategic content gaps' },
  { name: 'feedback-analyzer', label: 'Feedback Analyzer', description: 'Root-cause analysis and systemic patterns.', systemPrompt: FEEDBACK_ANALYZER_SYSTEM_PROMPT, checks: 'recurring/systemic issues across the other lenses, root causes, quick wins vs structural fixes' },
  { name: 'geo', label: 'GEO', description: 'Generative Engine Optimization / AI-citation readiness.', systemPrompt: GEO_SYSTEM_PROMPT, checks: 'citation-worthy facts/stats, structured direct answers, entity authority, freshness signals for AI/LLM citation' },
  { name: 'blog-writer', label: 'Blog Writer', description: 'Full SEO-optimized HTML article (most expensive).', systemPrompt: BLOG_WRITER_SYSTEM_PROMPT },
];

/** The analysis lenses the full run covers (everything except content generation). */
export const ANALYSIS_AGENTS: AgentDef[] = AGENTS.filter(a => a.name !== 'blog-writer');

// Describes the tools this MCP server exposes so the model (acting as a
// specialist) knows how to gather evidence. Mirrors the capabilities the live
// pipeline's sub-agents use, mapped to the MCP tool names.
export const MCP_TOOL_PREAMBLE = `## Available tools (provided by the SEO Optimizer MCP server)
- fetch_page(url): Fetch a URL and return cleaned, readable HTML (scripts/styles/attributes stripped). Use for the target page, competitor pages, robots.txt, sitemap.xml, /about, /pricing, etc.
- pagespeed(url, strategy): Google PageSpeed Insights / Lighthouse summary — Core Web Vitals plus the top opportunities. strategy is "mobile" (default) or "desktop".
- serp(keyword, location?, numResults?): Organic search results for a keyword — top ranking URLs, titles, descriptions and positions (SerpAPI if configured, else DuckDuckGo).

Use these tools to gather real evidence before reporting findings. Do not invent data.`;

export interface PromptInput {
  url: string;
  keyword?: string;
  competitorUrls?: string;
}

function competitorBlock(raw?: string): string | null {
  if (!raw) return null;
  const list = raw
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(Boolean);
  if (list.length === 0) return null;
  return `\n## Competitor URLs to analyze\nFetch and analyze each one, then factor their structure and coverage into your findings:\n${list.map((u, i) => `${i + 1}. ${u}`).join('\n')}`;
}

/** The target details (url + keyword + competitors), without any tool instruction. */
function targetBlock(input: PromptInput): string {
  return [
    `Analyze this URL: ${input.url}`,
    input.keyword ? `Target keyword: ${input.keyword}` : null,
    competitorBlock(input.competitorUrls),
  ]
    .filter(Boolean)
    .join('\n');
}

/** Builds the user-message text for a single specialist agent prompt. */
export function buildAgentPrompt(agent: AgentDef, input: PromptInput): string {
  return `${MCP_TOOL_PREAMBLE}

You are acting as the **${agent.label}** specialist in an SEO analysis. Follow these instructions precisely and return your findings.

${agent.systemPrompt}

---

${targetBlock(input)}

Start by calling \`fetch_page\` on the URL above to read its HTML (once — then reuse it). Use \`pagespeed\` for Core Web Vitals and \`serp\` for ranking/SERP data when relevant. Call each tool at most once per URL.`;
}

/** Builds the full-pipeline orchestrator prompt — runs every specialist lens, then synthesizes. */
export function buildOrchestratorPrompt(input: PromptInput): string {
  const lenses = ANALYSIS_AGENTS.map(a => `- **${a.label}** — ${a.checks}`).join('\n');
  const hasKeyword = !!input.keyword;
  return `${MCP_TOOL_PREAMBLE}

${ORCHESTRATOR_SYSTEM_PROMPT}

You are running a COMPLETE SEO analysis as a single agent. Be tool-efficient: gather shared evidence ONCE, hold it in working memory, and reuse it across every lens. Never call a tool twice for the same URL.

## Target
${targetBlock(input)}

## Phase 0 — Gather shared evidence (do this first, minimize calls)
1. Call \`fetch_page\` on the target URL exactly ONCE; reuse that HTML for every lens — do NOT fetch the target again.
2. Call \`pagespeed\` on the target URL ONCE (strategy "mobile").
${hasKeyword ? '3. Call `serp` on the target keyword ONCE to see the ranking competitors.' : '3. (No keyword given — skip `serp` unless a lens clearly needs it.)'}
Fetch extra URLs (robots.txt, sitemap.xml, /about, competitor pages) only when a specific lens needs something not already gathered, and fetch each such URL at most once.

## Phase 1 — Evaluate every lens against the gathered evidence
Work through all of these. For each finding record: severity (critical | warning | opportunity), title, impact, effort (low | medium | high), recommendation, and concrete evidence (numbers/snippets):
${lenses}

(For a deeper single-lens pass, the user can invoke that specialist's own prompt, e.g. \`page-speed\` — but in this full run, cover every lens yourself from the shared evidence.)

## Phase 2 — Synthesize ONE prioritized report
Deduplicate overlapping findings and rank them by severity, then impact, then effort, following these criteria:

${SYNTHESIS_SYSTEM_PROMPT}

### Output format
1. **Overall SEO score:** N/100, with a 2-3 sentence executive summary.
2. **Priority actions (top 10):** a table — Rank | Severity | Lens | Title | Impact | Effort | Recommendation.
3. **Findings by lens:** the remaining findings grouped under each lens heading.

This full run intentionally **excludes long-form blog generation** (the most expensive step). To produce an SEO article afterward, invoke the \`blog-writer\` prompt separately.`;
}
