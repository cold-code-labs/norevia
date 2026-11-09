// Norevia — a Cold Code Labs research project. Companion Worker for Static Assets.
// Matching assets are served directly by the platform. This Worker normalises paths, returns 404s and handles POST /api/contact
// (contact form -> email through the Cloudflare `send_email` binding `EMAIL`).
import { EmailMessage } from 'cloudflare:email';

const SECURITY = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

const TO = 'norevia@coldcodelabs.com';
const FROM = 'norevia@mail.coldcodelabs.com';
const MAX_BODY = 10 * 1024;
const LIM = { name: 120, email: 254, org: 160, message: 5000 };

const redirect = (url, path) => new Response(null, { status: 303, headers: { location: new URL(path, url).toString(), 'cache-control': 'no-store', ...SECURITY } });
const clean = (v) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').normalize('NFC');
const oneLine = (v) => clean(v).replace(/[\r\n\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim();
const EMAIL_RE = /^[^\s@<>(),;:"\\]+@[^\s@<>(),;:"\\]+\.[^\s@<>(),;:"\\]{2,}$/;
const b64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const wrap76 = (s) => s.replace(/.{1,76}/g, (m) => m + '\r\n').trimEnd();
const encWord = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + b64(new TextEncoder().encode(s)) + '?=');

// Read at most MAX_BODY bytes of the request body; null when it is larger.
async function readLimited(request) {
  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_BODY) return null;
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = []; let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > MAX_BODY) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const out = new Uint8Array(n); let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

export function buildMime({ name, email, org, message }, now = new Date(), id = crypto.randomUUID()) {
  const body = ['Name: ' + name, 'Email: ' + email, 'Organisation: ' + (org || '-'), '', message, '', '--', 'Sent from the contact form at https://norevia.coldcodelabs.com/contact/'].join('\r\n');
  const headers = [
    'From: Norevia website <' + FROM + '>',
    'To: ' + TO,
    'Reply-To: ' + encWord(name.replace(/["<>\\]/g, '')) + ' <' + email + '>',
    'Subject: ' + encWord('[Norevia contact] ' + name),
    'Date: ' + now.toUTCString().replace('GMT', '+0000'),
    'Message-ID: <' + id + '@mail.coldcodelabs.com>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  return headers.join('\r\n') + '\r\n\r\n' + wrap76(b64(new TextEncoder().encode(body))) + '\r\n';
}

async function handleContact(request, env) {
  const url = new URL(request.url);
  const fail = () => redirect(url, '/contact/error/');
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) return fail();
    const type = (request.headers.get('content-type') || '').toLowerCase();
    if (!type.startsWith('application/x-www-form-urlencoded') && !type.startsWith('multipart/form-data')) return fail();
    const bytes = await readLimited(request);
    if (!bytes) return fail();
    const form = await new Response(bytes, { headers: { 'content-type': type } }).formData();
    // honeypot: bots fill it; answer as if it worked, send nothing
    if (String(form.get('website') ?? '').trim() !== '') return redirect(url, '/contact/thanks/');
    const name = oneLine(form.get('name')), email = oneLine(form.get('email')), org = oneLine(form.get('organisation'));
    const message = clean(form.get('message')).replace(/\r\n?/g, '\n').trim().replace(/\n/g, '\r\n');
    if (!name || name.length > LIM.name || !email || email.length > LIM.email || !EMAIL_RE.test(email) || org.length > LIM.org || !message || message.length > LIM.message) return fail();
    await env.EMAIL.send(new EmailMessage(FROM, TO, buildMime({ name, email, org, message })));
    return redirect(url, '/contact/thanks/');
  } catch {
    return fail();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/api/contact') return handleContact(request, env);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { allow: url.pathname === '/api/contact' ? 'POST' : 'GET, HEAD', ...SECURITY } });
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
