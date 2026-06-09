import type { FetchSerpDataInput, FetchSerpDataOutput } from '@/types/tools';

export async function fetchSerpData(input: FetchSerpDataInput): Promise<FetchSerpDataOutput> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    return { results: [], totalResults: 0, error: 'APIFY_API_TOKEN not configured' };
  }

  try {
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/apify~google-search-scraper/runs?token=${apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: input.keyword,
          maxPagesPerQuery: 1,
          resultsPerPage: input.numResults ?? 10,
          countryCode: input.location ?? 'us',
          languageCode: 'en',
          mobileResults: false,
          includeIcons: false,
          ads: false,
          aiMode: false,
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!runResponse.ok) {
      return { results: [], totalResults: 0, error: `Apify run failed: ${runResponse.status}` };
    }

    const runData = await runResponse.json();
    const runId = runData.data?.id;
    if (!runId) return { results: [], totalResults: 0, error: 'No run ID returned' };

    // Poll for completion (max 20s)
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const statusData = await statusRes.json();
      if (statusData.data?.status === 'SUCCEEDED') break;
      if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(statusData.data?.status)) {
        return { results: [], totalResults: 0, error: `Run ${statusData.data.status}` };
      }
    }

    const datasetId = runData.data?.defaultDatasetId;
    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}&limit=20`,
      { signal: AbortSignal.timeout(10000) }
    );
    const items = await itemsRes.json();

    const results: FetchSerpDataOutput['results'] = [];
    for (const item of Array.isArray(items) ? items : []) {
      for (const result of item.organicResults ?? []) {
        results.push({
          position: result.position ?? results.length + 1,
          url: result.url ?? '',
          title: result.title ?? '',
          description: result.description ?? '',
          domain: result.domain ?? '',
        });
      }
    }

    return { results, totalResults: results.length };
  } catch (err) {
    return {
      results: [],
      totalResults: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
