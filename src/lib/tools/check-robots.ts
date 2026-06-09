import type { CheckRobotsInput, CheckRobotsOutput } from '@/types/tools';

export async function checkRobots(input: CheckRobotsInput): Promise<CheckRobotsOutput> {
  try {
    const base = new URL(input.url);
    const robotsUrl = `${base.protocol}//${base.host}/robots.txt`;

    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOOptimizer/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { accessible: false, content: '', disallowedPaths: [], sitemapUrls: [] };
    }

    const content = await response.text();
    const lines = content.split('\n').map(l => l.trim());

    const disallowedPaths: string[] = [];
    const sitemapUrls: string[] = [];
    let crawlDelay: number | undefined;
    let inRelevantBlock = false;

    for (const line of lines) {
      if (line.toLowerCase().startsWith('user-agent:')) {
        const agent = line.split(':')[1]?.trim();
        inRelevantBlock = agent === '*' || agent?.toLowerCase() === 'googlebot';
      }
      if (inRelevantBlock && line.toLowerCase().startsWith('disallow:')) {
        const path = line.split(':').slice(1).join(':').trim();
        if (path) disallowedPaths.push(path);
      }
      if (inRelevantBlock && line.toLowerCase().startsWith('crawl-delay:')) {
        const delay = parseFloat(line.split(':')[1]?.trim() ?? '');
        if (!isNaN(delay)) crawlDelay = delay;
      }
      if (line.toLowerCase().startsWith('sitemap:')) {
        const sitemapUrl = line.split(':').slice(1).join(':').trim();
        if (sitemapUrl) sitemapUrls.push(sitemapUrl);
      }
    }

    return { accessible: true, content, disallowedPaths, sitemapUrls, crawlDelay };
  } catch (err) {
    return {
      accessible: false,
      content: '',
      disallowedPaths: [],
      sitemapUrls: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
