// The blog-writer is instructed to embed 3-15 relative internal links
// (e.g. <a href="/related-topic">). When that HTML is rendered live via
// dangerouslySetInnerHTML, a relative href resolves against the CURRENT origin
// (the dashboard, e.g. www.zenovaapp.com) — so clicking one hijacks the SPA and
// lands on a non-existent route ("This page couldn't load"). This neutralizes
// that: links are absolutized against the analyzed site and forced to open in a
// new tab, and any active content is stripped. Use it ONLY for the on-screen
// preview — keep the raw HTML for the "copy HTML" action so the user's CMS still
// receives the original relative links.
export function sanitizeBlogHtml(html: string, baseUrl: string): string {
  // DOMParser only exists in the browser; the preview never renders on the
  // server, so on SSR just return the input unchanged.
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return html;
  }

  let origin: string | null = null;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    origin = null;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Strip active/embedded content the model should never emit (defense-in-depth).
  doc.querySelectorAll('script, iframe, object, embed, style, link').forEach(el => el.remove());

  // Remove inline event handlers (onclick, onmouseover, …).
  doc.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    }
  });

  doc.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && origin && !/^(https?:|mailto:|tel:|#)/i.test(href)) {
      // Resolve relative links against the analyzed site, not the dashboard.
      try {
        a.setAttribute('href', new URL(href, origin).toString());
      } catch {
        /* leave as-is */
      }
    }
    // Always open in a new tab so the preview can never replace the dashboard.
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer nofollow');
  });

  return doc.body.innerHTML;
}
