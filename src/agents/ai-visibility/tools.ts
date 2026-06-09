import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const AI_VISIBILITY_TOOLS: Tool[] = [
  {
    name: 'fetch_page',
    description: 'Fetch the full HTML content of a webpage for AI visibility analysis.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  },
];
