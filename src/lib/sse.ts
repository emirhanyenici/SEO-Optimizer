import type { SSEEvent } from '@/types/agents';

export function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function parseSSELine(line: string): SSEEvent | null {
  if (!line.startsWith('data: ')) return null;
  try {
    return JSON.parse(line.slice(6)) as SSEEvent;
  } catch {
    return null;
  }
}
