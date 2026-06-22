// The PageSpeed Insights / Lighthouse JSON response is enormous (~150-250KB,
// ~15k tokens even after a hard slice). Feeding it raw into the model — and then
// re-sending it on every subsequent turn of the agent loop — was a top cost
// driver. This collapses it to the handful of fields the page-speed agent
// actually needs (lab metrics, field/CrUX metrics, and the biggest
// opportunities), turning ~15k tokens into ~300.

interface LhAudit {
  title?: string;
  displayValue?: string;
  numericValue?: number;
  score?: number | null;
  details?: { type?: string; overallSavingsMs?: number };
}

function isPageSpeedUrl(url: string): boolean {
  return url.includes('googleapis.com/pagespeedonline');
}

function summarize(raw: string): string {
  const data = JSON.parse(raw) as Record<string, unknown>;
  const lh = (data.lighthouseResult ?? {}) as Record<string, unknown>;
  const audits = (lh.audits ?? {}) as Record<string, LhAudit>;
  const categories = (lh.categories ?? {}) as Record<string, { score?: number | null }>;
  const crux = ((data.loadingExperience as Record<string, unknown>)?.metrics ?? {}) as Record<
    string,
    { percentile?: number; category?: string }
  >;

  // Prefer the human-readable displayValue (e.g. "3.2 s"), fall back to the raw number.
  const lab = (id: string): string | number | null =>
    audits[id]?.displayValue ?? audits[id]?.numericValue ?? null;

  const field = (id: string) =>
    crux[id] ? { value: crux[id].percentile ?? null, rating: crux[id].category ?? null } : null;

  const opportunities = Object.values(audits)
    .filter(a => a?.details?.type === 'opportunity' && (a.details?.overallSavingsMs ?? 0) > 0)
    .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
    .slice(0, 8)
    .map(a => ({ title: a.title ?? '', savings: `${Math.round(a.details?.overallSavingsMs ?? 0)}ms` }));

  const summary = {
    source: 'PageSpeed Insights (summarized server-side)',
    strategy: (lh.configSettings as Record<string, unknown>)?.formFactor ?? null,
    performanceScore:
      categories.performance?.score != null ? Math.round(categories.performance.score * 100) : null,
    labMetrics: {
      FCP: lab('first-contentful-paint'),
      LCP: lab('largest-contentful-paint'),
      CLS: lab('cumulative-layout-shift'),
      TBT: lab('total-blocking-time'),
      SpeedIndex: lab('speed-index'),
      TTI: lab('interactive'),
      TTFB: lab('server-response-time'),
    },
    fieldMetrics: {
      // Real-user (CrUX) data when available — this is where INP/TTFB truly live.
      LCP: field('LARGEST_CONTENTFUL_PAINT_MS'),
      INP: field('INTERACTION_TO_NEXT_PAINT'),
      CLS: field('CUMULATIVE_LAYOUT_SHIFT_SCORE'),
      FCP: field('FIRST_CONTENTFUL_PAINT_MS'),
      TTFB: field('EXPERIMENTAL_TIME_TO_FIRST_BYTE'),
    },
    topOpportunities: opportunities,
  };

  return JSON.stringify(summary);
}

// Returns a compact JSON summary for PageSpeed responses; for anything else (or
// if the JSON can't be parsed as a Lighthouse result) returns null so the caller
// falls back to its normal handling.
export function summarizePageSpeed(url: string, raw: string): string | null {
  if (!isPageSpeedUrl(url)) return null;
  try {
    return summarize(raw);
  } catch {
    // Error payloads (quota, invalid URL) aren't huge — cap and pass through.
    return raw.slice(0, 4_000);
  }
}
