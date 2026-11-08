// Norevia — a Cold Code Labs research project. Companion Worker for Static Assets.
// Matching assets are served directly by the platform. This Worker only normalises paths and returns 404s.
const SECURITY = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD', ...SECURITY } });
    }
    const lower = url.pathname.toLowerCase();
    if (lower !== url.pathname) {
      const probe = await env.ASSETS.fetch(new Request(new URL(lower, url), { method: 'HEAD' }));
      if (probe.ok || (probe.status >= 300 && probe.status < 400)) return Response.redirect(new URL(lower + url.search, url).toString(), 301);
    }
    const page = await env.ASSETS.fetch(new Request(new URL('/404', url)));
    const headers = new Headers(page.headers);
    for (const [k, v] of Object.entries(SECURITY)) headers.set(k, v);
    headers.set('cache-control', 'no-store');
    return new Response(request.method === 'HEAD' ? null : page.body, { status: 404, headers });
  },
};
