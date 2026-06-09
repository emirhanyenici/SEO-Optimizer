import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const META_OPTIMIZER_TOOLS: Tool[] = [
  {
    name: 'fetch_page',
    description: 'Fetch the full HTML content of a webpage.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  },
  {
    name: 'extract_meta_tags',
    description: 'Extract title, meta description, H1-H3 tags, Open Graph, and Twitter Card data from HTML.',
    input_schema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML content to parse' },
        keyword: { type: 'string', description: 'Target keyword to check for inclusion (optional)' },
      },
      required: ['html'],
    },
  },
];
