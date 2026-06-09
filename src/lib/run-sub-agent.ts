import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { AgentId, AgentResult } from '@/types/agents';
import { getAgentSystemPrompt } from './agent-registry';

const execAsync = promisify(exec);
const client = new Anthropic();

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
];

async function executeTool(name: string, input: Record<string, string>): Promise<string> {
  if (name === 'WebFetch') {
    try {
      const res = await fetch(input.url, {
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
  return 'Unknown tool';
}

function extractJSON(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  const rawJSON = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (rawJSON) return rawJSON[1].trim();
  return text.trim();
}

export async function runSubAgent(
  agentId: AgentId,
  input: { url: string; keyword?: string },
): Promise<AgentResult> {
  const systemPrompt = TOOL_PREAMBLE + getAgentSystemPrompt(agentId);
  const userPrompt = `Analyze this URL: ${input.url}${input.keyword ? `\nTarget keyword: ${input.keyword}` : ''}`;

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }];

  for (let turn = 0; turn < 20; turn++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: systemPrompt,
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
