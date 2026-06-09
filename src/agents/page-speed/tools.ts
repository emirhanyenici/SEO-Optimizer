import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const PAGE_SPEED_TOOLS: Tool[] = [
  {
    name: 'get_page_speed',
    description: 'Get Core Web Vitals and performance metrics via Google PageSpeed Insights API.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to analyze' },
        strategy: { type: 'string', enum: ['mobile', 'desktop'], description: 'Device strategy (default: mobile)' },
      },
      required: ['url'],
    },
  },
];
