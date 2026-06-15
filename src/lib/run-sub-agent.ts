import { exec } from 'child_process';
import { promisify } from 'util';
import type { AgentId, AgentResult } from '@/types/agents';
import { getAgentSystemPrompt } from './agent-registry';
import { createAnthropicClient } from './anthropic-client';
import { ANALYSIS_MODEL, MAX_TOKENS } from './model';
import { extractJSON } from './extract-json';
import type Anthropic from '@anthropic-ai/sdk';

const execAsync = promisify(exec);
const client = createAnthropicClient();

const TOOL_PREAMBLE = `## Available Tools
You have these tools available:
- WebFetch(url): Fetch any URL and get its full content (HTML, JSON, text).
  Use this for ALL page fetching operations:
  - Main page HTML → WebFetch(url)
  - robots.txt → WebFetch(baseUrl + "/robots.txt")
  - sitemap.xml → WebFetch(baseUrl + "/sitemap.xml")
  - PageSpeed data → WebFetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" + encodedUrl + "&strategy=mobile")
  - After fetching HTML: read it directly to extract meta tags, canonical, schema markup, internal links — no separate tool needed.
- Bash(command): Run shell commands when needed.
  - HTTP status + redirects → Bash("curl -sI 'URL' 2>&1 | head -15")
- fetch_serp_data(keyword, location?, numResults?): Get Google organic search results for a keyword.
  - Returns top ranking URLs, titles, descriptions, and positions.
  - location: country code (e.g. "us", "tr"), default "us"

Do NOT reference old tool names (fetch_page, check_status_code, check_robots, etc.) — use WebFetch and Bash instead.

`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'WebFetch',
    description: 'Fetch a URL and return its full content (HTML, JSON, plain text)',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The URL to fetch' },
      },
      required: ['url'],
    },
  },
  {
    name: 'Bash',
    description: 'Run a shell command and return stdout',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: 'The shell command to execute' },
      },
      required: ['command'],
    },
  },
  {
    name: 'fetch_serp_data',
    description: 'Fetch Google organic search results for a keyword',
    input_schema: {
      type: 'object' as const,
      properties: {
        keyword: { type: 'string', description: 'Search keyword' },
        location: { type: 'string', description: 'Country code (e.g. "us", "tr")' },
        numResults: { type: 'number', description: 'Number of results to return (max 10)' },
      },
      required: ['keyword'],
    },
  },
];

async function executeTool(name: string, input: Record<string, string>): Promise<string> {
  if (name === 'WebFetch') {
    let targetUrl = input.url;

    if (
      process.env.GOOGLE_PAGESPEED_API_KEY &&
      targetUrl.includes('googleapis.com/pagespeedonline')
    ) {
      const sep = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${sep}key=${process.env.GOOGLE_PAGESPEED_API_KEY}`;
    }

    try {
      const res = await fetch(targetUrl, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
      });
      const text = await res.text();
      return text.slice(0, 60_000);
    } catch (err) {
      return `Fetch error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  if (name === 'Bash') {
    try {
      const { stdout, stderr } = await execAsync(input.command, { timeout: 10_000 });
      return (stdout + (stderr ? `\nSTDERR: ${stderr}` : '')).slice(0, 10_000);
    } catch (err) {
      return `Bash error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  if (name === 'fetch_serp_data') {
    const { fetchSerpData } = await import('./tools/fetch-serp-data');
    const result = await fetchSerpData({
      keyword: input.keyword,
      location: input.location,
      numResults: input.numResults ? Number(input.numResults) : undefined,
    });
    return JSON.stringify(result);
  }
  return 'Unknown tool';
}

export async function runSubAgent(
  agentId: AgentId,
  input: {
    url: string;
    keyword?: string;
    pageContent?: string;
    competitorUrls?: string[];
    instructions?: string;
  },
): Promise<AgentResult> {
  const pageFetchNote = input.pageContent
    ? `\nIMPORTANT: The main page HTML is already provided in the user message. Do NOT call WebFetch for "${input.url}" — use the provided HTML instead. You may still call WebFetch for other URLs (robots.txt, sitemap.xml, competitor pages, APIs etc.).\n`
    : '';
  const systemPrompt = TOOL_PREAMBLE + pageFetchNote + getAgentSystemPrompt(agentId);

  const competitorUrls = (input.competitorUrls ?? []).filter(u => u && u.trim());
  const userPromptParts = [
    `Analyze this URL: ${input.url}`,
    input.keyword ? `Target keyword: ${input.keyword}` : null,
    competitorUrls.length > 0
      ? `\n## Competitor URLs to analyze\nThese are the chosen competitor pages ranking for the target query. Fetch and analyze each one, then take their structure and coverage into account:\n${competitorUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}`
      : null,
    input.instructions ? `\n## Custom instructions\n${input.instructions}` : null,
    input.pageContent
      ? `\n## Pre-fetched Page HTML\nThe following HTML was already fetched for you. Use it directly — do NOT call WebFetch for this URL again:\n\`\`\`html\n${input.pageContent}\n\`\`\``
      : null,
  ].filter(Boolean) as string[];
  const userPrompt = userPromptParts.join('\n');

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];

  let parseRetried = false;

  for (let turn = 0; turn < 20; turn++) {
    const response = await client.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
      tools: TOOLS,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(c => c.type === 'text') as Anthropic.TextBlock | undefined;
      const rawText = textBlock?.text ?? '';
      try {
        return JSON.parse(extractJSON(rawText)) as AgentResult;
      } catch {
        // Give the model exactly one chance to reformat into valid JSON
        // before failing the whole agent.
        if (!parseRetried) {
          parseRetried = true;
          messages.push({
            role: 'user',
            content:
              'Your previous response was not valid JSON. Reply with ONLY the JSON object for this agent — no markdown, no code fences, no commentary.',
          });
          continue;
        }
        throw new Error(`Agent ${agentId} output parse failed: ${rawText.slice(0, 300)}`);
      }
    }

    if (response.stop_reason === 'tool_use') {
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const content = await executeTool(block.name, block.input as Record<string, string>);
          results.push({ type: 'tool_result', tool_use_id: block.id, content });
        }
      }
      messages.push({ role: 'user', content: results });
    }
  }

  throw new Error(`Agent ${agentId} exceeded max turns`);
}
