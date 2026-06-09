import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const COMPANY_INTELLIGENCE_TOOLS: Tool[] = [
  {
    name: 'fetch_page',
    description: 'Fetch the full HTML content of a webpage. Use to retrieve the homepage, /about, /pricing, /products, or /services pages to understand the business.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to fetch' },
        selector: { type: 'string', description: 'Optional CSS selector to extract specific content' },
      },
      required: ['url'],
    },
  },
];
