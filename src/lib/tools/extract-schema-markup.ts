import { load } from 'cheerio';
import type { ExtractSchemaMarkupInput, ExtractSchemaMarkupOutput } from '@/types/tools';

export function extractSchemaMarkup(input: ExtractSchemaMarkupInput): ExtractSchemaMarkupOutput {
  const $ = load(input.html);
  const schemas: ExtractSchemaMarkupOutput['schemas'] = [];
  const types: string[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html()?.trim() ?? '';
    const errors: string[] = [];
    let parsed: Record<string, unknown> = {};
    let valid = true;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      valid = false;
      errors.push(`JSON parse error: ${e instanceof Error ? e.message : String(e)}`);
    }

    const schemaType = (parsed['@type'] as string) ?? 'Unknown';
    if (schemaType && !types.includes(schemaType)) types.push(schemaType);

    // Basic validation
    if (valid && !parsed['@context']) {
      valid = false;
      errors.push('Missing @context');
    }
    if (valid && !parsed['@type']) {
      valid = false;
      errors.push('Missing @type');
    }

    schemas.push({ type: schemaType, raw: parsed, valid, errors });
  });

  return { schemas, types, hasErrors: schemas.some(s => !s.valid) };
}
