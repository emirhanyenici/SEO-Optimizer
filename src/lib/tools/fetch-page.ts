import { load } from 'cheerio';
import type { FetchPageInput, FetchPageOutput } from '@/types/tools';
import { assertSafeUrl } from '../url-safety';

export async function fetchPage(input: FetchPageInput): Promise<FetchPageOutput> {
  const start = Date.now();
  try {
    await assertSafeUrl(input.url);
    const response = await fetch(input.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOOptimizer/1.0; +https://seo-optimizer.dev)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    const html = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => { headers[key] = value; });

    return {
      html,
      statusCode: response.status,
      finalUrl: response.url,
      headers,
      loadTimeMs: Date.now() - start,
    };
  } catch (err) {
    return {
      html: '',
      statusCode: 0,
      finalUrl: input.url,
      headers: {},
      loadTimeMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
