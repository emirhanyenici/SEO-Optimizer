import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const INTERNAL_LINK_TOOLS: Tool[] = [
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
    name: 'extract_internal_links',
    description: 'Extract all internal links from HTML, including anchor text and nofollow status.',
    input_schema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML content' },
        baseUrl: { type: 'string', description: 'Base URL of the page to determine internal vs external links' },
      },
      required: ['html', 'baseUrl'],
    },
  },
];
