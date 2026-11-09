// Norevia — journal: article pages (one per run), the journal index and the number check.
// Pages are built from the Markdown report of each run (sections rendered verbatim) plus the editorial layer in journal-data.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { esc, markdown, inline } from './text.mjs';
import { RUNS } from './journal-data.mjs';
import { RUN_ART, artPicture } from './motifs.mjs';

export const dateLong = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });

function splitReport(body) {
  const pre = [], secs = [];
  let cur = null;
  for (const line of body.replace(/\r\n?/g, '\n').split('\n')) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) { cur = { title: m[1], lines: [] }; secs.push(cur); continue; }
    (cur ? cur.lines : pre).push(line);
  }
  const quote = pre.filter((l) => /^\s*>/.test(l)).join('\n');
  const prov = pre.filter((l) => !/^\s*>/.test(l) && !/^#\s/.test(l)).join('\n').trim();
  return { quote, prov, secs: secs.map((s) => ({ title: s.title, text: s.lines.join('\n').trim() })) };
}

// numbers in text, ignoring numbers glued to words (lab001, H-06, k2) and HTML entities
const NUM = /(?<![\w.\-–−])\d+(?:[,.]\d+)*/g;
function numbersIn(htmlOrText) {
  const t = String(htmlOrText).replace(/<!--charts-->[\s\S]*?<!--\/charts-->/g, ' ').replace(/<(figure|svg|script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&#?\w+;/g, ' ');
  return [...t.matchAll(NUM)].map((m) => m[0].replace(/[.,]$/, ''));
}

export function renderRun(run, c, deps) {
  const { ctx, chartsFor, seal, root, repoUrl, byId } = deps;
  const rep = splitReport(c.body);
  const md = (text) => markdown(text, { ...ctx, selfId: c.id, resolvePath: (href) => ctx.resolvePath(href, c) }).html;
  const find = (name) => {
    const s = rep.secs.find((x) => x.title.toLowerCase().startsWith(name.toLowerCase()));
    if (!s) throw new Error(`journal: ${c.file} has no section starting with "${name}"`);
    return s;
  };
  const part = (names, { heads = names.length > 1 } = {}) => names.map((n) => { const s = find(n); return md(heads ? `## ${s.title}\n\n${s.text}` : s.text); }).join('\n');
  const li = (arr) => `<ul>${arr.map((t) => `<li>${inline(t, { ...ctx, selfId: c.id })}</li>`).join('')}</ul>`;

  const sec = run.sections;
  const testedHtml = `<p>${inline(run.tested, { ...ctx, selfId: c.id })}</p>${sec.tested.length ? part(sec.tested) : ''}${rep.prov ? `<div class="provenance-note">${md(rep.prov)}</div>` : ''}`;
  const charts = chartsFor(c);
  const resultsHtml = `${part(sec.results)}${charts.length ? `<h3 id="charts">Charts</h3>${rep.quote ? md(rep.quote) : ''}<!--charts--><div class="post-charts">${charts.join('')}</div><!--/charts-->` : ''}`;
  const meansHtml = sec.means.length ? part(sec.means, { heads: false }) : li(run.means);
  const limitsHtml = sec.limits.length ? part(sec.limits, { heads: false }) : li(run.limits);

  const files = run.files.filter((f) => fs.existsSync(path.join(root, f)));
  for (const raw of [`results/${run.report.split('/')[1]}/raw.tar.gz`]) if (fs.existsSync(path.join(root, raw)) && run.key !== 'lab004-sim') files.push(raw);
  const chartFiles = c.data.map((d) => d.file);
  const blob = (f) => `${repoUrl}/blob/main/${f}`;
  const preCards = run.prereg.map((id) => byId.get(id)).filter(Boolean);
  const hyps = c.related.map((id) => byId.get(id)).filter((x) => x && x.area === 'hypothesis');
  const others = [run.parent, run.companion].map((id) => id && byId.get(id)).filter(Boolean);
  const linksHtml = `<div class="post-links">
<div><h3>Pre-registration</h3>${preCards.length ? `<ul>${preCards.map((p) => `<li><a href="${p.url}">${esc(p.title)}</a> <span class="cid">${esc(p.id)}</span></li>`).join('')}</ul>` : '<p class="muted">No separate pre-registration card for this document.</p>'}</div>
<div><h3>Data</h3><ul>${[...chartFiles, ...files].map((f) => `<li><a href="${blob(f)}" rel="noopener noreferrer"><code class="path">${esc(f)}</code></a></li>`).join('')}</ul></div>
<div><h3>Report and related</h3><ul><li><a href="${blob(run.report)}" rel="noopener noreferrer">Full report on GitHub: <code class="path">${esc(run.report)}</code></a></li>${others.map((o) => `<li><a href="${o.url}">${esc(o.title)}</a></li>`).join('')}${hyps.map((h) => `<li><a href="${h.url}">${esc(h.id)} — ${esc(h.title)}</a></li>`).join('')}<li><a href="/flags/">Flag registry: status of every bio-inspired mechanism</a></li><li><a href="/archive.json">The whole archive as open data (archive.json)</a></li></ul></div>
</div>`;

  const tldrHtml = `<ul class="tldr">${run.tldr.map((t) => `<li>${inline(t, { ...ctx, selfId: c.id })}</li>`).join('')}</ul>`;
  const body = `<section id="tldr" aria-labelledby="h-tldr"><h2 id="h-tldr">TL;DR</h2>${tldrHtml}</section>
<section id="tested" aria-labelledby="h-tested"><h2 id="h-tested">What we tested</h2>${testedHtml}</section>
<section id="results" aria-labelledby="h-results"><h2 id="h-results">Results</h2>${resultsHtml}</section>
<section id="means" aria-labelledby="h-means"><h2 id="h-means">What it means</h2>${meansHtml}</section>
<section id="limits" aria-labelledby="h-limits"><h2 id="h-limits">Limits</h2>${limitsHtml}</section>
<section id="data" aria-labelledby="h-data"><h2 id="h-data">Pre-registration and data</h2>${linksHtml}</section>`;

  // ---- number check: every number written in the article must appear in the run's report
  const src = run.checkAgainst.map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  const srcNums = new Set(numbersIn(src));
  const missing = [...new Set(numbersIn(body.replace(/<section id="data"[\s\S]*$/, '')).filter((n) => !srcNums.has(n)))];
  const text = body.replace(/<(figure|svg)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&#?\w+;/g, ' ');
  const words = (text.match(/\S+/g) || []).length;
  return { body, missing, words, readMin: Math.max(1, Math.round(words / 220)), files: [...chartFiles, ...files], sections: [['tldr', 'TL;DR'], ['tested', 'What we tested'], ['results', 'Results'], ['means', 'What it means'], ['limits', 'Limits'], ['data', 'Pre-registration and data']] };
}

export function pagePost(run, c, art, deps) {
  const { layout, SITE, formationless, seal, byId } = deps;
  const accent = RUN_ART[run.key].accent;
  const url = `${SITE.url}${c.url}`;
  const date = c.updated;
  const header = `<header class="phead post-head" style="--run:${accent}">
<div class="wrap post-head-in">
<div class="post-head-copy">
<nav class="crumbs u" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/journal/">Journal</a> / <span>${esc(run.num)}${run.key === 'lab004-sim' ? ' simulation' : ''}</span></nav>
<p class="card-top u post-meta" style="--d:120ms">${seal(c.evidence, ' seal-lg')}<span class="area ar-observatory">Journal</span><time datetime="${date}">${dateLong(date)}</time><span>${art.readMin} min read</span></p>
<h1 data-words>${esc(c.title)}</h1>
<p class="lead u" style="--d:350ms">${esc(run.dek)}</p>
<p class="key-finding u" style="--d:450ms"><strong>Key finding.</strong> ${esc(run.finding)}</p>
</div>
<div class="post-hero">${artPicture(run.key, { cls: 'run-art hero-art', loading: 'eager' })}</div>
</div>
</header>`;
  const meta = `<aside class="meta" aria-label="Article details"><dl>
<div><dt>Run</dt><dd><code>${esc(c.id)}</code></dd></div>
<div><dt>Published</dt><dd><time datetime="${date}">${dateLong(date)}</time></dd></div>
<div><dt>Reading time</dt><dd>${art.readMin} min</dd></div>
<div><dt>Evidence</dt><dd>${esc(deps.evLabel(c.evidence))}<span class="muted small block">${esc(deps.EVIDENCE[c.evidence]?.desc || '')}</span></dd></div>
${c.tags.length ? `<div><dt>Tags</dt><dd class="tags">${c.tags.map((t) => `<span>#${esc(t)}</span>`).join(' ')}</dd></div>` : ''}
</dl>
<nav class="toc" aria-label="In this article"><p>In this article</p><ol>${art.sections.map(([id, t]) => `<li class="l2"><a href="#${id}">${esc(t)}</a></li>`).join('')}</ol></nav>
</aside>`;
  const page = `<article class="cardpage post ev-${c.evidence}" style="--run:${accent}">
${header}
<div class="wrap card-grid">
${meta}
<div class="prose post-body">
${art.body}
</div>
</div>
</article>`;
  return { page, url };
}

export function pageJournalIndex(posts, deps) {
  const { pageHead, seal } = deps;
  const items = posts.map(({ run, c, art }) => {
    const accent = RUN_ART[run.key].accent;
    return `<li class="post-card" style="--run:${accent}"><article>
<a class="post-card-art" href="${c.url}" tabindex="-1" aria-hidden="true">${artPicture(run.key, { cls: 'run-art', alt: false })}</a>
<div class="post-card-body">
<p class="post-meta"><time datetime="${c.updated}">${dateLong(c.updated)}</time><span>${esc(run.code)}</span><span>${art.readMin} min read</span></p>
<h2><a href="${c.url}">${esc(c.title)}</a></h2>
<p class="dek">${esc(run.dek)}</p>
<p class="key-finding"><strong>Key finding.</strong> ${esc(run.finding)}</p>
<p class="post-card-foot">${seal(c.evidence)}<a class="more" href="${c.url}">Read the ${esc(run.num)}${run.key === 'lab004-sim' ? ' simulation' : ''} article</a></p>
</div></article></li>`;
  }).join('');
  return `${pageHead({
    eyebrow: 'Journal',
    title: 'Experiment runs, one article each',
    lead: 'Every run of the Swarm Efficiency Observatory is written up as an article, newest first: what was tested, the numbers, what they mean and the limits. All text and numbers come from the run reports, which stay the source of truth.',
    extra: `<p class="ctas"><a class="btn small" href="/journal/feed.xml">Atom feed</a><a class="btn small ghost" href="/flags/">Flag registry</a><a class="btn small ghost" href="/experiments/">All experiments and simulations</a></p>`,
    seed: 4,
  })}
<section><div class="wrap">
<h2 class="sr">Articles</h2>
<ol class="post-list">${items}</ol>
<p class="muted small narrow">The pre-registration and calibration documents of each run are cards in the archive; each article links to them. Results here are for one small model (Claude Haiku 5.5) and say nothing yet about other models or domains.</p>
</div></section>`;
}
