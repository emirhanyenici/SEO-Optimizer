import type { UsageTotals } from '@/types/agents';

// Haiku 4.5 pricing (USD per million tokens). The whole pipeline runs on Haiku
// (see src/lib/model.ts); if ANTHROPIC_MODEL is overridden to another model
// these figures will be off — they exist for rough, real-time cost visibility,
// not for billing reconciliation.
const PRICE_PER_MTOK = {
  input: 1,
  output: 5,
  cacheRead: 0.1,
  cacheWrite: 1.25,
} as const;

// Structural shape of the SDK's `response.usage` — kept loose so it accepts
// Anthropic.Usage without importing the SDK type here.
interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export function emptyUsage(): UsageTotals {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    estimatedCostUsd: 0,
  };
}

function costOf(u: UsageTotals): number {
  return (
    (u.inputTokens * PRICE_PER_MTOK.input +
      u.outputTokens * PRICE_PER_MTOK.output +
      u.cacheReadTokens * PRICE_PER_MTOK.cacheRead +
      u.cacheCreationTokens * PRICE_PER_MTOK.cacheWrite) /
    1_000_000
  );
}

// Fold one API response's usage into a running per-agent total (mutates + returns
// `acc`). Recomputes the cost estimate after every call so the accumulator is
// always self-consistent.
export function addUsage(acc: UsageTotals, u: RawUsage | undefined | null): UsageTotals {
  if (u) {
    acc.inputTokens += u.input_tokens ?? 0;
    acc.outputTokens += u.output_tokens ?? 0;
    acc.cacheReadTokens += u.cache_read_input_tokens ?? 0;
    acc.cacheCreationTokens += u.cache_creation_input_tokens ?? 0;
  }
  acc.estimatedCostUsd = costOf(acc);
  return acc;
}

// Combine many per-agent totals into one analysis-wide total.
export function sumUsage(list: Array<UsageTotals | undefined>): UsageTotals {
  const total = emptyUsage();
  for (const u of list) {
    if (!u) continue;
    total.inputTokens += u.inputTokens;
    total.outputTokens += u.outputTokens;
    total.cacheReadTokens += u.cacheReadTokens;
    total.cacheCreationTokens += u.cacheCreationTokens;
  }
  total.estimatedCostUsd = costOf(total);
  return total;
}

// One-line server log of an agent's (or the whole run's) token spend.
export function formatUsage(label: string, u: UsageTotals): string {
  return (
    `[usage] ${label} in=${u.inputTokens} out=${u.outputTokens} ` +
    `cacheRead=${u.cacheReadTokens} cacheWrite=${u.cacheCreationTokens} ` +
    `~$${u.estimatedCostUsd.toFixed(4)}`
  );
}
