import { load } from 'cheerio';
import type { CheckCanonicalInput, CheckCanonicalOutput } from '@/types/tools';

export function checkCanonical(input: CheckCanonicalInput): CheckCanonicalOutput {
  const $ = load(input.html);
  const tag = $('link[rel="canonical"]').first();

  if (!tag.length) {
    return { present: false, isSelfReferencing: false, isRelative: false, mismatch: false };
  }

  const href = tag.attr('href')?.trim() ?? '';
  const isRelative = !href.startsWith('http');

  let canonicalUrl = href;
  if (isRelative) {
    try {
      canonicalUrl = new URL(href, input.url).href;
    } catch {
      canonicalUrl = href;
    }
  }

  const pageUrlNormalized = input.url.replace(/\/$/, '').toLowerCase();
  const canonicalNormalized = canonicalUrl.replace(/\/$/, '').toLowerCase();
  const isSelfReferencing = pageUrlNormalized === canonicalNormalized;
  const mismatch = !isSelfReferencing && !!canonicalUrl;

  return { present: true, canonicalUrl, isSelfReferencing, isRelative, mismatch };
}
