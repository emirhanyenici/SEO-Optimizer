import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { fetchPage, fetchPageSpeed, fetchSerp } from './tools';
import { AGENTS, buildAgentPrompt, buildOrchestratorPrompt } from './agents';

const server = new McpServer({
  name: 'seo-optimizer',
  version: '1.0.0',
});

// ---------------------------------------------------------------------------
// Tools — deterministic crawl/data gathering. The connecting client's Claude
// calls these while acting as a specialist; inference is billed to that client,
// not to us.
// ---------------------------------------------------------------------------

server.registerTool(
  'fetch_page',
  {
    title: 'Fetch page HTML',
    description:
      'Fetch a URL and return cleaned, readable HTML (scripts/styles/attributes stripped). Use for the target page, competitor pages, robots.txt, sitemap.xml, etc.',
    inputSchema: { url: z.string().describe('The URL to fetch') },
  },
  async ({ url }) => ({ content: [{ type: 'text', text: await fetchPage(url) }] }),
);

server.registerTool(
  'pagespeed',
  {
    title: 'PageSpeed Insights',
    description:
      'Google PageSpeed Insights / Lighthouse summary: Core Web Vitals (LCP, CLS, INP, TTFB, FCP) plus the biggest performance opportunities.',
    inputSchema: {
      url: z.string().describe('The page URL to measure'),
      strategy: z.enum(['mobile', 'desktop']).default('mobile').describe('Device strategy'),
    },
  },
  async ({ url, strategy }) => ({
    content: [{ type: 'text', text: await fetchPageSpeed(url, strategy) }],
  }),
);

server.registerTool(
  'serp',
  {
    title: 'Search results (SERP)',
    description:
      'Organic search results for a keyword (top ranking URLs, titles, descriptions, positions). Uses SerpAPI if SerpAPI_KEY is set, otherwise falls back to a key-less DuckDuckGo lookup. The "source" field in the output says which was used.',
    inputSchema: {
      keyword: z.string().describe('Search keyword'),
      location: z.string().optional().describe('Country code, e.g. "us", "tr" (default "us")'),
      numResults: z.number().int().min(1).max(10).optional().describe('Number of results (max 10)'),
    },
  },
  async ({ keyword, location, numResults }) => ({
    content: [{ type: 'text', text: await fetchSerp(keyword, location, numResults) }],
  }),
);

// ---------------------------------------------------------------------------
// Prompts — one per specialist agent (reusing the live system prompts), plus a
// full-pipeline orchestrator. Invoking a prompt in the client makes its Claude
// act as that specialist and use the tools above.
// ---------------------------------------------------------------------------

const promptArgs = {
  url: z.string().describe('The URL to analyze'),
  keyword: z.string().optional().describe('Target keyword (optional)'),
  competitorUrls: z
    .string()
    .optional()
    .describe('Competitor URLs, comma- or newline-separated (optional)'),
};

for (const agent of AGENTS) {
  server.registerPrompt(
    agent.name,
    {
      title: `${agent.label} (SEO)`,
      description: agent.description,
      argsSchema: promptArgs,
    },
    ({ url, keyword, competitorUrls }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildAgentPrompt(agent, { url, keyword, competitorUrls }) },
        },
      ],
    }),
  );
}

server.registerPrompt(
  'seo-full-analysis',
  {
    title: 'Full SEO Analysis (all specialists)',
    description: 'Run every specialist lens, then synthesize a single prioritized SEO report.',
    argsSchema: promptArgs,
  },
  ({ url, keyword, competitorUrls }) => ({
    messages: [
      {
        role: 'user',
        content: { type: 'text', text: buildOrchestratorPrompt({ url, keyword, competitorUrls }) },
      },
    ],
  }),
);

// ---------------------------------------------------------------------------
// Connect over stdio (Claude Desktop / Claude Code / Cursor local servers).
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr is safe for logs; stdout is reserved for the JSON-RPC protocol.
console.error('[seo-optimizer-mcp] ready — 3 tools, ' + (AGENTS.length + 1) + ' prompts');
