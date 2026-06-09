import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const COMPETITOR_GAP_TOOLS: Tool[] = [
  {
    name: 'fetch_serp_data',
    description: 'Fetch Google SERP results for a keyword using Apify.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Keyword to search for' },
        location: { type: 'string', description: 'Country code (default: us)' },
        numResults: { type: 'number', description: 'Number of results to fetch (max 10)' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'fetch_page',
    description: 'Fetch HTML content of a competitor page.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  },
];
