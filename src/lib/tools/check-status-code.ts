import type { CheckStatusCodeInput, CheckStatusCodeOutput } from '@/types/tools';

export async function checkStatusCode(input: CheckStatusCodeInput): Promise<CheckStatusCodeOutput> {
  const redirectChain: string[] = [input.url];

  try {
    // Follow redirects manually to capture chain
    let currentUrl = input.url;
    let finalStatus = 0;

    for (let i = 0; i < 10; i++) {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOOptimizer/1.0)',
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });

      finalStatus = response.status;

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          const nextUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
          redirectChain.push(nextUrl);
          currentUrl = nextUrl;
          continue;
        }
      }
      break;
    }

    return {
      statusCode: finalStatus,
      redirectChain,
      finalUrl: currentUrl,
    };
  } catch (err) {
    return {
      statusCode: 0,
      redirectChain,
      finalUrl: input.url,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
