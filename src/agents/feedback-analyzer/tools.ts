import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const FEEDBACK_ANALYZER_TOOLS: Tool[] = [
  {
    name: 'fetch_page',
    description: 'Fetch the full HTML content of a webpage. Use to retrieve the main page and 1-2 subpages to detect cross-site patterns and systemic issues.',
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
