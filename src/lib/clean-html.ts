import * as cheerio from 'cheerio';

export function cleanHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove script tags except JSON-LD
  $('script:not([type="application/ld+json"])').remove();
  $('style').remove();
  $('svg').remove();
  $('noscript').remove();
  $('img').remove();

  // Remove non-semantic attributes
  $('[style]').removeAttr('style');
  $('[class]').removeAttr('class');
  $('[id]').removeAttr('id');

  // Keep only canonical link, remove others
  $('link').filter((_, el) => $(el).attr('rel') !== 'canonical').remove();

  const cleaned = $.html().replace(/\s{2,}/g, ' ').trim();
  // ~10k chars ≈ ~2.5k tokens — enough for <head>, headings and link structure
  // the page-parsing agents need, without re-billing a large blob across the
  // fan-out (and on every multi-turn re-send).
  return cleaned.slice(0, 10_000);
}
