// Deterministic crawl/data tools — no LLM, no API key needed for fetch_page /
// pagespeed. They REUSE the live app's helpers verbatim (single source of
// truth); nothing in src/ is modified.
import * as cheerio from 'cheerio';
import { cleanHtml } from '../../src/lib/clean-html';
import { summarizePageSpeed } from '../../src/lib/summarize-pagespeed';
import { fetchSerpData } from '../../src/lib/tools/fetch-serp-data';
import type { FetchSerpDataOutput } from '../../src/types/tools';

const USER_AGENT = 'Mozilla/5.0 (compatible; SEOBot/1.0)';

/** Fetch a URL and return cleaned HTML (or capped text for non-HTML responses). */
export async function fetchPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': USER_AGENT },
    });
    const text = await res.text();
    const contentType = res.headers.get('content-type') ?? '';
    const looksHtml = contentType.includes('html') || /^\s*<(?:!doctype|html)/i.test(text);
    return looksHtml ? cleanHtml(text) : text.slice(0, 20_000);
  } catch (err) {
    return `Fetch error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** Run Google PageSpeed Insights and return the compact summary the page-speed agent expects. */
export async function fetchPageSpeed(url: string, strategy: 'mobile' | 'desktop'): Promise<string> {
  const encoded = encodeURIComponent(url);
  let api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encoded}&strategy=${strategy}&category=performance`;
  if (process.env.GOOGLE_PAGESPEED_API_KEY) {
    api += `&key=${process.env.GOOGLE_PAGESPEED_API_KEY}`;
  }
  try {
    const res = await fetch(api, { signal: AbortSignal.timeout(30_000) });
    const text = await res.text();
    // summarizePageSpeed recognizes the pagespeedonline URL and collapses the
    // ~15k-token JSON into a ~300-token summary.
    return summarizePageSpeed(api, text) ?? text.slice(0, 4_000);
  } catch (err) {
    return `PageSpeed error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// DuckDuckGo wraps result links as //duckduckgo.com/l/?uddg=<encoded-real-url>.
function decodeDdgHref(href: string): string {
  try {
    const u = new URL(href, 'https://duckduckgo.com');
    const uddg = u.searchParams.get('uddg');
    if (uddg) return decodeURIComponent(uddg);
    return href.startsWith('//') ? `https:${href}` : href;
  } catch {
    return href;
  }
}

// Free, key-less SERP via the DuckDuckGo HTML endpoint (same source the
// blog-writer agent already uses). Region-agnostic; less rich than SerpAPI.
async function fetchSerpDuckDuckGo(keyword: string, numResults: number): Promise<FetchSerpDataOutput> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return { results: [], totalResults: 0, error: `DuckDuckGo error: ${res.status}` };

    const $ = cheerio.load(await res.text());
    const results: FetchSerpDataOutput['results'] = [];
    $('.result').each((_, el) => {
      if (results.length >= numResults) return;
      const a = $(el).find('a.result__a').first();
      const title = a.text().trim();
      const rawHref = a.attr('href') ?? '';
      if (!title || !rawHref) return;
      const url = decodeDdgHref(rawHref);
      let domain = '';
      try {
        domain = new URL(url).hostname;
      } catch {
        /* leave blank */
      }
      results.push({
        position: results.length + 1,
        url,
        title,
        description: $(el).find('.result__snippet').first().text().trim(),
        domain,
      });
    });
    return { results, totalResults: results.length };
  } catch (err) {
    return { results: [], totalResults: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Google organic SERP results for a keyword. Uses SerpAPI when `SerpAPI_KEY` is
 * set (richer, location-aware); otherwise falls back to a key-less DuckDuckGo
 * scrape so the tool works out of the box.
 */
export async function fetchSerp(
  keyword: string,
  location?: string,
  numResults?: number,
): Promise<string> {
  const n = numResults ?? 10;

  if (process.env.SerpAPI_KEY) {
    const serp = await fetchSerpData({ keyword, location, numResults: n });
    if (serp.results.length > 0) {
      return JSON.stringify({ source: 'serpapi', ...serp }, null, 2);
    }
  }

  const ddg = await fetchSerpDuckDuckGo(keyword, n);
  return JSON.stringify({ source: 'duckduckgo', ...ddg }, null, 2);
}
