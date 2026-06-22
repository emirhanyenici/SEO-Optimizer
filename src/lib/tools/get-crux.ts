// Chrome UX Report (CrUX) — real-world (field) Core Web Vitals to complement the
// lab numbers from PageSpeed/Lighthouse. Free; uses the same GOOGLE_PAGESPEED_API_KEY.
// Returns a compact one-line p75 summary, or null when there is no field data
// (low-traffic URLs/origins are not in the CrUX dataset) or no API key.

interface CruxMetric {
  percentiles?: { p75?: number | string };
}
interface CruxResponse {
  record?: { metrics?: Record<string, CruxMetric> };
}

export async function fetchCrux(url: string): Promise<string | null> {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!key) return null; // CrUX API requires a key

  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return null;
  }

  const endpoint = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${key}`;
  // Prefer page-level field data; fall back to origin-level (broader coverage).
  const bodies: Record<string, string>[] = [
    { url, formFactor: 'PHONE' },
    { origin, formFactor: 'PHONE' },
  ];

  for (const body of bodies) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as CruxResponse;
      const metrics = data.record?.metrics;
      if (!metrics) continue;

      const p75 = (name: string): number | string | undefined => metrics[name]?.percentiles?.p75;
      const lcp = p75('largest_contentful_paint');
      const inp = p75('interaction_to_next_paint');
      const cls = p75('cumulative_layout_shift');
      const ttfb = p75('experimental_time_to_first_byte');
      const fcp = p75('first_contentful_paint');
      if (lcp == null && inp == null && cls == null) continue; // no useful data at this scope

      const scope = 'url' in body ? 'URL' : 'origin';
      return (
        `CrUX field data (real users, p75, ${scope}-level, mobile): ` +
        `LCP ${lcp ?? 'n/a'}ms, INP ${inp ?? 'n/a'}ms, CLS ${cls ?? 'n/a'}, ` +
        `TTFB ${ttfb ?? 'n/a'}ms, FCP ${fcp ?? 'n/a'}ms`
      );
    } catch {
      continue; // try next scope
    }
  }
  return null;
}
