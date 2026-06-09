import { load } from 'cheerio';
import type { ExtractInternalLinksInput, ExtractInternalLinksOutput } from '@/types/tools';

export function extractInternalLinks(input: ExtractInternalLinksInput): ExtractInternalLinksOutput {
  const $ = load(input.html);
  const baseHost = new URL(input.baseUrl).host;

  const links: ExtractInternalLinksOutput['links'] = [];
  const seenUrls = new Set<string>();

  $('a[href]').each((_, el) => {
    const rawHref = $(el).attr('href')?.trim() ?? '';
    const text = $(el).text().trim().slice(0, 100);
    const rel = $(el).attr('rel')?.trim();
    const isNofollow = rel?.includes('nofollow') ?? false;

    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;

    try {
      const resolved = new URL(rawHref, input.baseUrl);
      if (resolved.host !== baseHost) return;

      links.push({ href: resolved.href, text, rel, isNofollow });
      seenUrls.add(resolved.href);
    } catch {
      // invalid URL, skip
    }
  });

  return {
    links,
    totalCount: links.length,
    uniqueUrls: Array.from(seenUrls),
    nofollowCount: links.filter(l => l.isNofollow).length,
  };
}
