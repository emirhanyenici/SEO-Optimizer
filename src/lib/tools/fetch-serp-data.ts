import type { FetchSerpDataInput, FetchSerpDataOutput } from '@/types/tools';

export async function fetchSerpData(input: FetchSerpDataInput): Promise<FetchSerpDataOutput> {
  const key = process.env.SerpAPI_KEY;
  if (!key) {
    return { results: [], totalResults: 0, error: 'SerpAPI_KEY not configured' };
  }

  try {
    const params = new URLSearchParams({
      engine: 'google',
      q: input.keyword,
      api_key: key,
      num: String(input.numResults ?? 10),
      gl: input.location ?? 'us',
      hl: 'en',
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { results: [], totalResults: 0, error: `SerpAPI error: ${res.status}` };
    }

    const data = await res.json();
    const organicResults: Record<string, unknown>[] = data.organic_results ?? [];

    const results: FetchSerpDataOutput['results'] = organicResults.map((r, i) => ({
      position: (r.position as number) ?? i + 1,
      url: (r.link as string) ?? '',
      title: (r.title as string) ?? '',
      description: (r.snippet as string) ?? '',
      domain: (r.displayed_link as string) ?? (() => {
        try { return new URL(r.link as string).hostname; } catch { return ''; }
      })(),
    }));

    return { results, totalResults: results.length };
  } catch (err) {
    return {
      results: [],
      totalResults: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
