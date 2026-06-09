import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const TECHNICAL_AUDITOR_TOOLS: Tool[] = [
  {
    name: 'check_status_code',
    description: 'Check the HTTP status code and redirect chain for a URL.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'The URL to check' } },
      required: ['url'],
    },
  },
  {
    name: 'fetch_page',
    description: 'Fetch the full HTML content of a webpage.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'The URL to fetch' } },
      required: ['url'],
    },
  },
  {
    name: 'check_robots',
    description: 'Fetch and parse the robots.txt file for a domain.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Any URL on the domain (e.g. https://example.com)' } },
      required: ['url'],
    },
  },
  {
    name: 'parse_sitemap',
    description: 'Fetch and parse the sitemap.xml for a domain.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Any URL on the domain' } },
      required: ['url'],
    },
  },
  {
    name: 'check_canonical',
    description: 'Check canonical tag in HTML.',
    input_schema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML content' },
        url: { type: 'string', description: 'Page URL for relative canonical resolution' },
      },
      required: ['html', 'url'],
    },
  },
  {
    name: 'extract_schema_markup',
    description: 'Extract and validate JSON-LD schema markup from HTML.',
    input_schema: {
      type: 'object',
      properties: { html: { type: 'string', description: 'HTML content' } },
      required: ['html'],
    },
  },
];
