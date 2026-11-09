// Norevia — SEO layer: <head> metadata (title, description, canonical, Open Graph, Twitter), JSON-LD graph, Atom feed.
// JSON-LD is a data block (type="application/ld+json"): it is never executed, so the CSP `script-src 'self'` does not apply to it.
import { esc } from './text.mjs';

export const OG_W = 1200, OG_H = 630;

// meta description: at most ~158 characters, cut at a word boundary
export function metaDesc(s, max = 158) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/[\s,;:(–—-]+\S*$/, '').replace(/[.,;:\s]+$/, '') + '…';
}

export const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')}</script>`;

const abs = (S, p) => (/^https?:/.test(p) ? p : S.url + p);

// Shared nodes, referenced by @id from every page.
export function baseNodes(S) {
  return [
    {
      '@type': 'Organization', '@id': `${S.companyUrl}/#organization`, name: S.company, url: S.companyUrl,
      email: 'norevia@coldcodelabs.com',
      contactPoint: { '@type': 'ContactPoint', contactType: 'research enquiries', email: 'norevia@coldcodelabs.com', url: `${S.url}/contact/`, availableLanguage: 'en' },
    },
    {
      '@type': 'WebSite', '@id': `${S.url}/#website`, url: `${S.url}/`, name: S.name, alternateName: S.full,
      description: S.description, inLanguage: 'en', publisher: { '@id': `${S.companyUrl}/#organization` },
    },
  ];
}

// crumbs: [[name, path], ...] (first is Home). Returns a BreadcrumbList node.
export function breadcrumbs(S, p, crumbs) {
  return {
    '@type': 'BreadcrumbList', '@id': `${S.url}${p}#breadcrumb`,
    itemListElement: crumbs.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(S, href) })),
  };
}

// Build the whole <head> metadata block (everything except charset/viewport/stylesheets/scripts).
export function headMeta(S, o) {
  const { title, desc, path: p, og, ogAlt, type = 'website', published, modified, noindex = false, nodes = [], crumbs, kind = 'WebPage', name } = o;
  const d = metaDesc(desc || S.description);
  const url = abs(S, p);
  const img = og ? abs(S, og) : '';
  const page = { '@type': kind, '@id': `${url}#webpage`, url, name: name || title, description: d, inLanguage: 'en', isPartOf: { '@id': `${S.url}/#website` }, publisher: { '@id': `${S.companyUrl}/#organization` } };
  if (modified) page.dateModified = modified;
  if (published) page.datePublished = published;
  if (crumbs?.length > 1) page.breadcrumb = { '@id': `${url}#breadcrumb` };
  if (img) page.primaryImageOfPage = { '@type': 'ImageObject', url: img, width: OG_W, height: OG_H };
  const graph = { '@context': 'https://schema.org', '@graph': [...baseNodes(S), page, ...(crumbs?.length > 1 ? [breadcrumbs(S, p, crumbs)] : []), ...nodes] };
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(d)}">`,
    noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">',
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:site_name" content="${esc(S.full)}">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(d)}">`,
    `<meta property="og:url" content="${url}">`,
    img ? `<meta property="og:image" content="${img}">\n<meta property="og:image:type" content="image/png">\n<meta property="og:image:width" content="${OG_W}">\n<meta property="og:image:height" content="${OG_H}">\n<meta property="og:image:alt" content="${esc(ogAlt || title)}">` : '',
    type === 'article' && published ? `<meta property="article:published_time" content="${published}">` : '',
    type === 'article' && modified ? `<meta property="article:modified_time" content="${modified}">` : '',
    type === 'article' ? `<meta property="article:author" content="${esc(S.company)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(d)}">`,
    img ? `<meta name="twitter:image" content="${img}">\n<meta name="twitter:image:alt" content="${esc(ogAlt || title)}">` : '',
    `<link rel="alternate" type="application/atom+xml" title="Norevia journal" href="/journal/feed.xml">`,
    jsonLd(graph),
  ].filter(Boolean).join('\n');
}

// Atom feed of the journal. posts: [{ id, url, title, summary, content (html), date (YYYY-MM-DD), updated }]
export function atomFeed(S, posts) {
  const iso = (d) => `${d}T00:00:00Z`;
  const latest = posts.map((x) => x.updated || x.date).sort().pop();
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
<id>${S.url}/journal/</id>
<title>Norevia journal</title>
<subtitle>${esc('Experiment runs from Norevia, a Cold Code Labs research project — one article per run, derived from the run reports.')}</subtitle>
<link rel="self" type="application/atom+xml" href="${S.url}/journal/feed.xml"/>
<link rel="alternate" type="text/html" href="${S.url}/journal/"/>
<updated>${iso(latest)}</updated>
<author><name>${esc(S.company)}</name><uri>${S.companyUrl}</uri></author>
<rights>Research content CC BY 4.0</rights>
${posts.map((x) => `<entry>
<id>${x.url}</id>
<title>${esc(x.title)}</title>
<link rel="alternate" type="text/html" href="${x.url}"/>
<published>${iso(x.date)}</published>
<updated>${iso(x.updated || x.date)}</updated>
<summary>${esc(x.summary)}</summary>
<content type="html">${esc(x.content)}</content>
</entry>`).join('\n')}
</feed>
`;
}
