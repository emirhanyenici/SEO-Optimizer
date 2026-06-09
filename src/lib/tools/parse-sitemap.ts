import { load } from 'cheerio';
import type { ParseSitemapInput, ParseSitemapOutput } from '@/types/tools';

export async function parseSitemap(input: ParseSitemapInput): Promise<ParseSitemapOutput> {
  try {
    const base = new URL(input.url);
    const sitemapUrl = `${base.protocol}//${base.host}/sitemap.xml`;

    const response = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOOptimizer/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { urls: [], sitemapIndexUrls: [], totalCount: 0, error: `HTTP ${response.status}` };
    }

    const xml = await response.text();
    const $ = load(xml, { xmlMode: true });

    const urls: string[] = [];
    const sitemapIndexUrls: string[] = [];

    // Sitemap index
    $('sitemap > loc').each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) sitemapIndexUrls.push(loc);
    });

    // Regular sitemap
    $('url > loc').each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) urls.push(loc);
    });

    return { urls, sitemapIndexUrls, totalCount: urls.length + sitemapIndexUrls.length };
  } catch (err) {
    return {
      urls: [],
      sitemapIndexUrls: [],
      totalCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
