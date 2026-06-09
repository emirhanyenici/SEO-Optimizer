import type { GetPageSpeedInput, GetPageSpeedOutput } from '@/types/tools';

export async function getPageSpeed(input: GetPageSpeedInput): Promise<GetPageSpeedOutput> {
  const strategy = input.strategy ?? 'mobile';
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

  const params = new URLSearchParams({
    url: input.url,
    strategy,
    category: 'performance',
    ...(apiKey ? { key: apiKey } : {}),
  });

  try {
    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      { signal: AbortSignal.timeout(30000) }
    );

    if (!response.ok) {
      const err = await response.text();
      return emptyResult(`PageSpeed API error: ${response.status} ${err.slice(0, 200)}`);
    }

    const data = await response.json();
    const categories = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};

    const score = Math.round((categories.performance?.score ?? 0) * 100);
    const lcp = msFromAudit(audits['largest-contentful-paint']);
    const cls = audits['cumulative-layout-shift']?.numericValue ?? 0;
    const inp = msFromAudit(audits['interaction-to-next-paint'] ?? audits['max-potential-fid']);
    const ttfb = msFromAudit(audits['server-response-time']);
    const fcp = msFromAudit(audits['first-contentful-paint']);

    const opportunities = Object.values(audits as Record<string, {
      score: number | null;
      title: string;
      description: string;
      details?: { overallSavingsMs?: number; overallSavingsBytes?: number };
    }>)
      .filter(a => a.score !== null && a.score < 0.9 && a.details)
      .slice(0, 8)
      .map(a => ({
        id: a.title,
        title: a.title,
        description: a.description ?? '',
        savings: a.details?.overallSavingsMs
          ? `${Math.round(a.details.overallSavingsMs)}ms`
          : a.details?.overallSavingsBytes
          ? `${Math.round(a.details.overallSavingsBytes / 1024)}KB`
          : '',
      }));

    const diagnostics = Object.values(audits as Record<string, {
      score: number | null;
      title: string;
      description: string;
      type?: string;
      details?: unknown;
    }>)
      .filter(a => a.score !== null && a.score < 0.9 && !a.details)
      .slice(0, 5)
      .map(a => ({ id: a.title, title: a.title, description: a.description ?? '' }));

    return { performanceScore: score, lcp, cls, inp, ttfb, fcp, opportunities, diagnostics };
  } catch (err) {
    return emptyResult(err instanceof Error ? err.message : String(err));
  }
}

function msFromAudit(audit: { numericValue?: number } | undefined): number {
  return Math.round(audit?.numericValue ?? 0);
}

function emptyResult(error: string): GetPageSpeedOutput {
  return {
    performanceScore: 0, lcp: 0, cls: 0, inp: 0, ttfb: 0, fcp: 0,
    opportunities: [], diagnostics: [], error,
  };
}
