# SEO Optimizer — MCP Server

An [MCP](https://modelcontextprotocol.io) server that exposes a multi-agent SEO
analysis toolkit to **your own Claude client** (Claude Code, Claude Desktop,
Cursor, …): 12 specialist agents as **prompts** plus crawl/data **tools**
(`fetch_page`, `pagespeed`, `serp`).

**The reasoning runs on your own Claude** (your subscription / login). You invoke
a prompt, your Claude performs the analysis using these tools. No
`ANTHROPIC_API_KEY` for the server, no central billing, no per-URL cost.

> Ships as a single self-contained bundle (`dist/index.js`) — the only runtime
> dependencies are `@modelcontextprotocol/sdk`, `zod`, and `cheerio`.

## What it provides

**Tools** (deterministic, no LLM):
| Tool | Purpose |
|---|---|
| `fetch_page(url)` | Fetch a URL → cleaned, readable HTML |
| `pagespeed(url, strategy)` | PageSpeed/Lighthouse summary (Core Web Vitals + opportunities) |
| `serp(keyword, location?, numResults?)` | Organic search results — SerpAPI if `SerpAPI_KEY` is set, else a key-less DuckDuckGo lookup |

**Prompts** — `technical-auditor`, `page-speed`, `meta-optimizer`,
`internal-link`, `semantic-content`, `cannibalization`, `competitor-gap`,
`ai-visibility`, `company-intelligence`, `feedback-analyzer`, `geo`,
`blog-writer`, and **`seo-full-analysis`** (gathers evidence once, runs all 11
analysis lenses, then outputs a prioritized report).

## Install

Requires **Node.js 18+**. Pick whichever you prefer — both are one command, no
clone, no file paths:

```bash
# From npm (after the package is published)
npx -y seo-optimizer-mcp

# …or straight from GitHub, no npm publish needed
npx -y github:emirhanyenici/SEO-Optimizer-MCP
```

> `npx` installs the three deps on first run and caches them.

### Claude Code

```bash
claude mcp add seo-optimizer -s user -- npx -y seo-optimizer-mcp
# or:  ... -- npx -y github:emirhanyenici/SEO-Optimizer-MCP
```

- `-s user` makes it available in **all** your projects (use `-s local` for just
  the current one, or `-s project` to write a shared `.mcp.json`).
- Add optional keys with `-e SerpAPI_KEY=… -e GOOGLE_PAGESPEED_API_KEY=…`.
- Verify with `claude mcp list`, or `/mcp` inside a session. The prompts appear as
  slash commands like `/mcp__seo-optimizer__seo-full-analysis`; the tools are
  available automatically.

### Claude Desktop

Edit `claude_desktop_config.json`
(Windows `%APPDATA%\Claude\…`, macOS `~/Library/Application Support/Claude/…`):

```json
{
  "mcpServers": {
    "seo-optimizer": {
      "command": "npx",
      "args": ["-y", "seo-optimizer-mcp"],
      "env": { "SerpAPI_KEY": "optional", "GOOGLE_PAGESPEED_API_KEY": "optional" }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` (or global `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "seo-optimizer": { "command": "npx", "args": ["-y", "seo-optimizer-mcp"] }
  }
}
```

## Environment variables (both optional)

| Var | Used by | Notes |
|---|---|---|
| `SerpAPI_KEY` | `serp` | With it: SerpAPI (richer, location-aware). Without it: automatic DuckDuckGo fallback. |
| `GOOGLE_PAGESPEED_API_KEY` | `pagespeed` | Works without a key (public quota); a key raises the rate limit. |

The server runs and every tool works with **no env at all**.

## Usage

In your Claude client, pick a prompt — e.g. **Full SEO Analysis** — and pass
`url` (required), `keyword` and `competitorUrls` (optional). Your Claude runs the
analysis and returns an overall score + a prioritized action table + per-lens
findings. All inference is billed to *your* account. For a single lens, invoke
that specialist's prompt instead (e.g. `page-speed`); for an SEO article, invoke
`blog-writer`.

## Maintainers — building & releasing

The TypeScript source lives in the main SEO Optimizer project (it reuses that
project's agent prompts and helpers). To cut a new release of this distributable:

```bash
# in the main project's mcp/ folder
npm run build      # esbuild → dist/index.js (self-contained)
```

Then publish/push the bundle:

```bash
npm publish                       # to npm  → users get `npx -y seo-optimizer-mcp`
# and/or push dist + package.json + README to the public repo for `npx github:…`
```
