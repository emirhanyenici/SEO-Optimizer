import { load } from 'cheerio';
import type { ExtractMetaTagsInput, ExtractMetaTagsOutput } from '@/types/tools';

export function extractMetaTags(input: ExtractMetaTagsInput): ExtractMetaTagsOutput {
  const $ = load(input.html);

  const title = $('title').first().text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const robots = $('meta[name="robots"]').attr('content')?.trim();
  const canonical = $('link[rel="canonical"]').attr('href')?.trim();
  const lang = $('html').attr('lang')?.trim();

  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim();
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim();
  const twitterCard = $('meta[name="twitter:card"]').attr('content')?.trim();

  const h1: string[] = [];
  const h2: string[] = [];
  const h3: string[] = [];

  $('h1').each((_, el) => { const t = $(el).text().trim(); if (t) h1.push(t); });
  $('h2').each((_, el) => { const t = $(el).text().trim(); if (t) h2.push(t); });
  $('h3').each((_, el) => { const t = $(el).text().trim(); if (t) h3.push(t); });

  return {
    title: { text: title, length: title.length },
    metaDescription: { text: metaDescription, length: metaDescription.length },
    h1,
    h2,
    h3,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    robots,
    canonical,
    lang,
  };
}
