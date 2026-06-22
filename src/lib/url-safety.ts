// SSRF guard for every server-side fetch of a user-supplied URL.
//
// The analysis pipeline fetches arbitrary URLs the user enters (target page,
// competitor pages, robots.txt, sitemap.xml, and whatever the sub-agents decide
// to WebFetch). Without validation an attacker could point us at internal
// services or, on our Oracle Cloud host, the cloud metadata endpoint
// (169.254.169.254) and exfiltrate credentials. This module rejects non-public
// targets before any request is made.
//
// TS port of the core checks in claude-seo's scripts/url_safety.py. Note: this
// resolves DNS and validates the resolved IPs, but does NOT pin the IP for the
// actual request, so a determined DNS-rebinding attacker could still race the
// resolution. Full DNS-pinning would require a custom http(s).Agent lookup; the
// resolve-and-check below closes the common cases.

import { promises as dns } from 'dns';
import net from 'net';

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
]);

// Convert a decimal/hex/octal IPv4 (e.g. "2130706433", "0x7f000001") to dotted
// form so obfuscated loopback/private addresses can't slip past the IP checks.
function canonicalizeIpv4(host: string): string {
  // Already dotted-quad → leave as-is.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host;
  let n: number | null = null;
  if (/^\d+$/.test(host)) n = Number(host);
  else if (/^0x[0-9a-f]+$/i.test(host)) n = parseInt(host, 16);
  else if (/^0o?[0-7]+$/i.test(host)) n = parseInt(host.replace(/^0o?/i, ''), 8);
  if (n === null || !Number.isInteger(n) || n < 0 || n > 0xffffffff) return host;
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function ipv4IsPrivate(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((o) => Number.isNaN(o) || o < 0 || o > 255)) return true; // malformed → treat as unsafe
  const [a, b] = p;
  return (
    a === 0 ||                         // 0.0.0.0/8 "this host"
    a === 10 ||                        // 10.0.0.0/8 private
    a === 127 ||                       // loopback
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 CGNAT
    (a === 169 && b === 254) ||        // link-local incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 private
    (a === 192 && b === 168) ||        // 192.168.0.0/16 private
    (a === 192 && b === 0) ||          // 192.0.0.0/24 + 192.0.2.0/24
    (a === 198 && (b === 18 || b === 19)) || // benchmark
    a >= 224                           // multicast + reserved
  );
}

function ipv6IsPrivate(ip: string): boolean {
  const norm = ip.toLowerCase().split('%')[0]; // strip zone id
  if (norm === '::1' || norm === '::') return true;            // loopback / unspecified
  if (norm.startsWith('fe80')) return true;                    // link-local
  if (norm.startsWith('fc') || norm.startsWith('fd')) return true; // ULA fc00::/7
  if (norm.startsWith('ff')) return true;                      // multicast
  // IPv4-mapped (::ffff:a.b.c.d) → check the embedded v4.
  const mapped = norm.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4IsPrivate(mapped[1]);
  return false;
}

export function isPrivateOrReserved(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return ipv4IsPrivate(ip);
  if (family === 6) return ipv6IsPrivate(ip);
  return true; // not a valid IP → unsafe
}

/**
 * Throws UnsafeUrlError if the URL is not a public http(s) target. Resolves the
 * hostname and rejects when any resolved address is private/reserved.
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError(`Invalid URL: ${rawUrl}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError(`Blocked scheme: ${url.protocol}`);
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('Credentials in URL are not allowed');
  }
  // Backslashes / encoded authority are parser-disagreement vectors.
  if (/[\\]/.test(rawUrl) || /%2f|%5c/i.test(url.host)) {
    throw new UnsafeUrlError('Malformed authority');
  }

  const host = canonicalizeIpv4(url.hostname.replace(/^\[|\]$/g, '').toLowerCase());
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new UnsafeUrlError(`Blocked host: ${host}`);
  }

  // If the host is already a literal IP, check it directly (no DNS).
  if (net.isIP(host)) {
    if (isPrivateOrReserved(host)) throw new UnsafeUrlError(`Blocked private/reserved IP: ${host}`);
    return url;
  }

  // Otherwise resolve and verify every returned address is public.
  let addrs: { address: string }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new UnsafeUrlError(`DNS resolution failed: ${host}`);
  }
  if (addrs.length === 0) throw new UnsafeUrlError(`No DNS records: ${host}`);
  for (const { address } of addrs) {
    if (isPrivateOrReserved(address)) {
      throw new UnsafeUrlError(`Host ${host} resolves to private/reserved IP ${address}`);
    }
  }
  return url;
}

/** Boolean convenience wrapper that never throws. */
export async function isSafeUrl(rawUrl: string): Promise<boolean> {
  try {
    await assertSafeUrl(rawUrl);
    return true;
  } catch {
    return false;
  }
}
