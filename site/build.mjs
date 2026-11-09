#!/usr/bin/env node
// Norevia — a Cold Code Labs research project. Static generator for the living archive (zero dependencies; Node >= 20).
//
//   node site/build.mjs   -> writes site/dist/ (static site) and site/deploy/ (manifest, worker, headers, step1-session.js)
//
// Reads the Markdown cards (frontmatter) and the results (JSON/JSONL/CSV) from the repository and renders
// static pages plus small vanilla-JS bundles (live swarm hero, knowledge graph, model playgrounds).
// Works with empty or partial folders. Accepts both the legacy Portuguese slugs/ids and the new English
// ones during the translation (see lib/compat.mjs and docs/CONVENTIONS.md).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { esc, slug, norm, parseFrontmatter, markdown, inline, plain } from './lib/text.mjs';
import { parseDataFile, chartSpecs, renderChart, scalarMetrics, resultSummary, fmt } from './lib/charts.mjs';
import { ID_MAP, mapId, EVIDENCE_ALIASES, STATUS_ALIASES, VERDICT_ALIASES, AREA_ALIASES, PATH_REDIRECTS } from './lib/compat.mjs';
import * as LAB from './lab.config.mjs';
import { pageLanding } from './lib/home.mjs';
import { topBar, footer } from './lib/chrome.mjs';
import * as MODELS from './src/js/models.js';

const SITE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SITE_DIR, '..');
const DIST = path.join(SITE_DIR, 'dist');
const DEPLOY = path.join(SITE_DIR, 'deploy');
const t0 = Date.now();

const SOURCES = [
  { dir: 'research/literature', area: 'literature' },
  { dir: 'research/oss', area: 'oss' },
  { dir: 'research/nature', area: 'nature' },
  { dir: 'research/theory', area: 'theory' },
  { dir: 'hypotheses', area: 'hypothesis' },
  { dir: 'results/sims', area: 'simulation' },
  { dir: 'results/observatory', area: 'observatory' },
  // LAB-001…004 (Norevia Lab): one report card plus pre-registration cards per lab; flat chart tables live in results/charts (exported by observatory/export-charts.mjs)
  { dir: 'results/lab001', area: 'observatory' }, { dir: 'results/lab002', area: 'observatory' }, { dir: 'results/lab003', area: 'observatory' }, { dir: 'results/lab004', area: 'observatory' },
];
const DATA_DIRS = ['results/sims', 'results/observatory', 'results/charts'];
// Raw/operational data is not charted (individual runs, ledgers, status files, preregistration records).
const DATA_SKIP = [/(^|\/)raw\//, /(^|\/)runs?\//, /ledger/i, /(^|\/)status[-_.]/i, /(^|\/)runs[-_]/i, /preregist/i, /\.tmp\//];

export const AREAS = {
  nature: { label: 'Nature', plural: 'Natural mechanisms', prefix: 'nat-' },
  theory: { label: 'Theory', plural: 'Theory', prefix: 'th-' },
  hypothesis: { label: 'Hypothesis', plural: 'Hypotheses', prefix: 'H-' },
  literature: { label: 'Literature', plural: 'Literature', prefix: 'lit-' },
  oss: { label: 'Open source', plural: 'Open source', prefix: 'oss-' },
  simulation: { label: 'Simulation', plural: 'Simulations', prefix: 'sim-' },
  observatory: { label: 'Observatory', plural: 'Observatory', prefix: 'obs-' },
};

export const EVIDENCE = {
  'natural-phenomenon': { label: 'Natural phenomenon', desc: 'Mechanism described in a primary biology or physics source. It inspires mechanisms; an analogy does not prove efficacy in LLMs.' },
  'author-reported': { label: 'Author-reported', desc: 'Result published by third parties and not yet reproduced here. It is not local validation.' },
  'observed-implementation': { label: 'Observed implementation', desc: 'Open-source code inspected directly, with version or commit recorded.' },
  hypothesis: { label: 'Hypothesis', desc: 'A falsifiable proposal with a refutation criterion, not yet tested locally.' },
  'local-validation': { label: 'Local validation', desc: 'Result produced in this repository, with reproducible script, data and seed. Inside a model, it validates the model — not LLMs or real insects.' },
  gap: { label: 'Gap', desc: 'What we do not know yet — or a source we could not open and verify.' },
};

// Hypothesis status board order (CONVENTIONS.md) + legacy statuses kept readable.
const STATUS = {
  open: { label: 'Open', desc: 'Registered, falsifiable, not yet tested.' },
  testing: { label: 'Testing', desc: 'An experiment is designed or running.' },
  'preliminary-support': { label: 'Preliminary support', desc: 'Supported by a local experiment (often inside a model); not yet confirmed with LLMs.' },
  'preliminary-refuted': { label: 'Preliminary refuted', desc: 'A local experiment contradicted the prediction.' },
  inconclusive: { label: 'Inconclusive', desc: 'Evidence is mixed or underpowered.' },
  supported: { label: 'Supported', desc: 'Supported by local validation.' },
  refuted: { label: 'Refuted', desc: 'Refuted by local validation.' },
  archived: { label: 'Archived', desc: 'No longer pursued.' },
};
const BOARD = ['open', 'testing', 'preliminary-support', 'preliminary-refuted', 'inconclusive'];
const VERDICT = { supports: 'Supports', partial: 'Partially supports', 'not-supported': 'Does not support', refutes: 'Refutes', inconclusive: 'Inconclusive' };

// Playgrounds: browser ports of the repository's own models. Links resolve only if the cards exist.
const PLAYGROUNDS = [
  { slug: 'correlated-voting', key: 'a', title: 'Correlated voting', short: 'How correlated errors put a ceiling on majority voting — and when one strong agent wins.', sim: 'sim-correlated-vote', hyps: ['H-01', 'H-15'], extra: ['th-model', 'nat-condorcet-correlated', 'lit-correlated-errors'], script: 'play-vote', origin: 'sims/sim-correlated-vote.mjs (analyticVote, Gaussian-copula latent factor) · research/theory/model.mjs §2' },
  { slug: 'verifier', key: 'b', title: 'Verifier best-of-N', short: 'An imperfect verifier lowers false success — but every extra attempt is another chance to accept an error.', sim: 'sim-verifier', hyps: ['H-02', 'H-13'], extra: ['th-model'], script: 'play-verifier', origin: 'research/theory/model.mjs §2–§3 (bestOfN, majorityAccuracy; beta-binomial correlation) · sims/sim-verifier.mjs (fsFormula)' },
  { slug: 'elastic-swarm', key: 'c', title: 'Elastic swarm', short: 'As the value of a task grows relative to cost, the optimal team size moves 1 → micro → macro.', sim: 'sim-elastic', hyps: ['H-05', 'H-04'], extra: ['th-model', 'nat-recruitment-benefit-conditions'], script: 'play-elastic', origin: 'sims/sim-elastic.mjs (fixedExact, bestFixedN; three difficulty classes; acceptance test spec 0.98)' },
  { slug: 'stigmergy', key: 'd', title: 'Stigmergy & evaporation', short: 'Agents coordinate through a fading trail instead of messages. Too little or too much evaporation hurts.', sim: 'sim-stigmergy', hyps: ['H-07', 'H-25'], extra: ['nat-stigmergy', 'nat-pheromone-evaporation-aco'], script: 'play-stigmergy', origin: 'sims/sim-stigmergy.mjs (simulateRun, 24×24 grid, deposit +1, decay (1−ε)^Δt) — exact rules, stepped for display' },
  { slug: 'response-thresholds', key: 'e', title: 'Response thresholds', short: 'Demand spikes and idle agents switch on by themselves — no dispatcher, no messages.', sim: 'sim-response-threshold', hyps: ['H-06', 'H-26'], extra: ['nat-response-threshold', 'nat-inactive-reserve'], script: 'play-threshold', origin: 'sims/sim-response-threshold.mjs (40 agents, 2 task types, θ~U[5,50], P(engage)=s²/(s²+θ²), quit 0.1/step, μ=0.5)' },
];

const warnings = [];
const warn = (file, msg) => warnings.push({ file, msg });

// ------------------------------------------------------------------ reading

function walk(dir, exts) {
  const abs = path.join(ROOT, dir);
  const out = [];
  if (!fs.existsSync(abs)) return out;
  const stack = [abs];
  while (stack.length) {
    const d = stack.pop();
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'tmp') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && exts.includes(path.extname(e.name).toLowerCase())) out.push(p);
    }
  }
  return out.sort();
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const asList = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : String(v).includes(',') && !String(v).includes(' ') ? String(v).split(',') : [v]).map((x) => (typeof x === 'object' && x ? x : String(x).trim())).filter((x) => x !== '');

function srcText(s) {
  if (s && typeof s === 'object') {
    return [s.title || s.titulo || s.name, s.authors || s.autores, s.year || s.ano, s.venue, s.doi ? `doi:${s.doi}` : '', s.arxiv ? `arXiv:${s.arxiv}` : '', s.url, s.commit ? `commit ${s.commit}` : '', s.version || s.versao ? `version ${s.version || s.versao}` : '', s.note || s.nota]
      .filter(Boolean).join(' · ') || JSON.stringify(s);
  }
  return String(s);
}

function readCards() {
  const cards = [];
  const seen = new Map();
  for (const src of SOURCES) {
    for (const file of walk(src.dir, ['.md', '.markdown'])) {
      const r = rel(file);
      const base = path.basename(file).toLowerCase();
      if (['readme.md', 'index.md', '_template.md', 'template.md'].includes(base) || base.startsWith('_')) continue;
      let text;
      try { text = fs.readFileSync(file, 'utf8'); } catch { warn(r, 'could not be read'); continue; }
      const { fm, body } = parseFrontmatter(text);
      if (!fm) { warn(r, 'no frontmatter — skipped'); continue; }
      if (fm.__error) { warn(r, `invalid frontmatter: ${fm.__error}`); continue; }
      let rawId = String(fm.id ?? '').trim();
      if (!rawId) { rawId = path.basename(file).replace(/\.[^.]+$/, ''); warn(r, `no id — using "${rawId}"`); }
      const id = mapId(rawId);
      if (seen.has(id)) { warn(r, `duplicate id "${id}" (already in ${seen.get(id)}) — skipped`); continue; }
      seen.set(id, r);
      let area = norm(fm.area || '');
      area = AREA_ALIASES[area] || area;
      if (!AREAS[area]) { if (fm.area) warn(r, `unknown area "${fm.area}" — using ${src.area}`); area = src.area; }
      const evRaw = norm(fm.evidence || fm.evidencia || '');
      let evidence = EVIDENCE_ALIASES[evRaw] || null;
      if (!evidence) { warn(r, fm.evidence ? `unknown evidence level "${fm.evidence}"` : 'no evidence level'); evidence = 'unknown'; }
      let title = String(fm.title || fm.titulo || '').trim();
      if (!title) { const h = body.match(/^#\s+(.+)$/m); title = h ? h[1].trim() : id; warn(r, 'no title'); }
      let summary = String(fm.summary || fm.resumo || '').trim();
      if (!summary) { summary = plain(body.replace(/^#.*$/gm, ''), 200); warn(r, 'no summary'); }
      const statusRaw = fm.status != null ? String(fm.status) : '';
      const stKey = STATUS_ALIASES[norm(statusRaw)] || null;
      const sources = asList(fm.sources ?? fm.fontes).map(srcText);
      const card = {
        id, rawId, title, area, evidence,
        tags: asList(fm.tags).map((t) => norm(t)).filter(Boolean),
        sources,
        related: [...new Set(asList(fm.related ?? fm.relacionados).map((x) => mapId(String(x))))],
        updated: fm.updated ? String(fm.updated) : '',
        summary,
        status: statusRaw ? { raw: statusRaw, key: stKey || 'other', label: stKey ? STATUS[stKey].label : statusRaw } : null,
        fm, body, file: r, abs: file, url: '', data: [],
      };
      if (statusRaw && !stKey) warn(r, `unknown status "${statusRaw}"`);
      if (evidence === 'author-reported' && !sources.length) warn(r, 'author-reported card without a recorded source');
      if (area === 'hypothesis' && !statusRaw) warn(r, 'hypothesis without status');
      cards.push(card);
    }
  }
  const used = new Set();
  for (const c of cards) {
    let s = slug(c.id) || 'card';
    while (used.has(s)) s += '-2';
    used.add(s);
    c.url = `/c/${s}/`;
  }
  return cards;
}

const OLD_IDS_OF = Object.entries(ID_MAP).reduce((m, [o, n]) => ((m[n] ||= []).push(o), m), {});

function readData(cards) {
  const files = DATA_DIRS.flatMap((d) => walk(d, ['.json', '.jsonl', '.ndjson', '.csv', '.tsv'])).filter((f) => !DATA_SKIP.some((re) => re.test(rel(f))));
  const datasets = [];
  for (const f of files) {
    const r = rel(f);
    let size = 0;
    try { size = fs.statSync(f).size; } catch {}
    if (size > 8 * 1024 * 1024) { warn(r, 'data file > 8 MB — not charted'); datasets.push({ file: r, abs: f, error: 'too large', specs: [], metrics: [] }); continue; }
    let data;
    try { data = parseDataFile(fs.readFileSync(f, 'utf8'), path.extname(f).toLowerCase()); } catch (e) { warn(r, `unreadable data: ${e.message}`); datasets.push({ file: r, abs: f, error: 'unreadable', specs: [], metrics: [] }); continue; }
    datasets.push({ file: r, abs: f, data, specs: [], metrics: scalarMetrics(data), summary: resultSummary(data), owner: null });
  }
  const byFile = new Map(datasets.map((d) => [d.file, d]));
  for (const c of cards) {
    const explicit = asList(c.fm.data ?? c.fm.results ?? c.fm.dados ?? c.fm.resultados).map(String);
    for (const p of explicit) {
      const cand = [path.join(path.dirname(c.abs), p), path.join(ROOT, p)].map(rel);
      const ds = cand.map((x) => byFile.get(x)).find(Boolean);
      if (ds) { if (!ds.owner) ds.owner = c; c.data.push(ds); }
      else warn(c.file, `data file not found: ${p}`);
    }
  }
  for (const c of cards) {
    if (c.area !== 'simulation' && c.area !== 'observatory') continue;
    const stem = path.basename(c.file).replace(/\.[^.]+$/, '').toLowerCase();
    const prefixes = [c.id.toLowerCase(), c.rawId.toLowerCase(), stem, ...(OLD_IDS_OF[c.id] || [])];
    const cdir = path.dirname(c.file);
    const sameDirCards = cards.filter((o) => path.dirname(o.file) === cdir).length;
    for (const ds of datasets) {
      if (ds.owner) continue;
      const dstem = path.basename(ds.file).replace(/\.[^.]+$/, '').toLowerCase();
      const ddir = path.dirname(ds.file);
      const match = prefixes.some((p) => dstem === p || dstem.startsWith(p + '-') || dstem.startsWith(p + '_') || dstem.startsWith(p + '.')) ||
        (ddir === cdir && sameDirCards === 1 && cdir !== 'results/sims' && cdir !== 'results/observatory') ||
        (ddir.startsWith(cdir + '/') && sameDirCards === 1 && cdir !== 'results/sims' && cdir !== 'results/observatory');
      if (match) { ds.owner = c; c.data.push(ds); }
    }
  }
  for (const ds of datasets) {
    if (!ds.data) continue;
    const hint = ds.owner?.fm.chart && typeof ds.owner.fm.chart === 'object' ? ds.owner.fm.chart : {};
    try { ds.specs = chartSpecs(ds.data, hint); } catch (e) { warn(ds.file, `could not extract series: ${e.message}`); }
  }
  return datasets;
}

function readObservatoryStatus() {
  const dir = path.join(ROOT, 'results/observatory');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^status[-_].*\.json$/i.test(f)).sort().map((f) => {
    try { return { file: `results/observatory/${f}`, ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }; } catch { return null; }
  }).filter(Boolean);
}

function gitInfo() {
  try {
    const gitDir = path.join(ROOT, '.git');
    const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
    if (!head.startsWith('ref:')) return { commit: head.slice(0, 12), branch: '' };
    const ref = head.slice(5).trim();
    let sha = '';
    const refFile = path.join(gitDir, ref);
    if (fs.existsSync(refFile)) sha = fs.readFileSync(refFile, 'utf8').trim();
    else if (fs.existsSync(path.join(gitDir, 'packed-refs'))) {
      const line = fs.readFileSync(path.join(gitDir, 'packed-refs'), 'utf8').split('\n').find((l) => l.endsWith(' ' + ref));
      if (line) sha = line.split(' ')[0];
    }
    return { commit: sha.slice(0, 12), branch: ref.replace('refs/heads/', '') };
  } catch {
    return { commit: '', branch: '' };
  }
}

// ------------------------------------------------------------------ components

const SHAPES = {
  'natural-phenomenon': '<path d="M7 1.2l5 2.9v5.8l-5 2.9-5-2.9V4.1z"/>',
  'author-reported': '<rect x="2" y="2" width="10" height="10" rx="1.5"/>',
  'observed-implementation': '<path d="M7 1.2l5.8 5.8L7 12.8 1.2 7z"/>',
  hypothesis: '<path d="M7 1.6l5.6 10H1.4z"/>',
  'local-validation': '<circle cx="7" cy="7" r="5.6"/><path class="ck" d="M4.4 7.2l1.8 1.8 3.5-3.7"/>',
  gap: '<circle class="ring" cx="7" cy="7" r="5"/>',
  unknown: '<circle class="ring" cx="7" cy="7" r="5"/><path class="ck" d="M7 4.5v3M7 9.4v.1"/>',
};
const STATUS_ICONS = {
  open: '<circle cx="6" cy="6" r="4.2" fill="none" stroke-width="1.6"/>',
  testing: '<circle cx="6" cy="6" r="4.2" fill="none" stroke-width="1.6"/><path d="M6 1.8a4.2 4.2 0 0 1 0 8.4z" stroke="none"/>',
  'preliminary-support': '<path d="M2 6.3l2.6 2.6L10 3.4" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  'preliminary-refuted': '<path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke-width="2" stroke-linecap="round"/>',
  inconclusive: '<path d="M6 1.5l4.5 4.5L6 10.5 1.5 6z" fill="none" stroke-width="1.6"/>',
  supported: '<path d="M2 6.3l2.6 2.6L10 3.4" fill="none" stroke-width="2" stroke-linecap="round"/>',
  refuted: '<path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke-width="2" stroke-linecap="round"/>',
  archived: '<rect x="2" y="3" width="8" height="6" rx="1" fill="none" stroke-width="1.5"/>',
  other: '<circle cx="6" cy="6" r="2"/>',
};
const evLabel = (k) => (EVIDENCE[k] ? EVIDENCE[k].label : 'No level declared');
const icon = (k) => `<svg class="ico" viewBox="0 0 14 14" aria-hidden="true" focusable="false">${SHAPES[k] || SHAPES.unknown}</svg>`;
const seal = (k, extra = '') => `<span class="seal ev-${k}${extra}" title="${esc(EVIDENCE[k]?.desc || 'Card without a valid evidence level')}">${icon(k)}<span>${esc(evLabel(k))}</span></span>`;
const areaChip = (a) => `<span class="area ar-${a}">${esc(AREAS[a]?.label || a)}</span>`;
const stIcon = (k) => `<svg class="sico" viewBox="0 0 12 12" aria-hidden="true" focusable="false">${STATUS_ICONS[k] || STATUS_ICONS.other}</svg>`;
const statusChip = (s) => (s ? `<span class="status st-${s.key}">${stIcon(s.key)}${esc(s.label)}</span>` : '');
const statusChipKey = (k, label) => `<span class="status st-${k}">${stIcon(k)}${esc(label || STATUS[k]?.label || k)}</span>`;
const ARROW = '<span class="arr" aria-hidden="true">→</span>';



const NAV = [
  ['/', 'Home'],
  ['/explore/', 'Research'],
  ['/playgrounds/', 'Playgrounds'],
  ['/hypotheses/', 'Hypotheses'],
  ['/experiments/', 'Experiments'],
  ['/literature/', 'Literature & OSS'],
  ['/method/', 'Method'],
  ['/about/', 'About'],
];

let ASSETS = { base: '', css: '', js: {}, preload: '' };
let BUILD = {};

function layout({ title, desc, path: p, body, cls = '', scripts = [] }) {
  const full = p === '/' ? `Norevia — ${LAB.SITE.title}: ${LAB.SITE.subtitle}` : `${title} · Norevia`;
  const section = NAV.slice(1).find(([href]) => p.startsWith(href))?.[0] || (p === '/' ? '/' : null);
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc || LAB.SITE.description)}">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#f4f3ee">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc || LAB.SITE.description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(LAB.SITE.full)}">
<meta property="og:url" content="${LAB.SITE.url}${p}">
<link rel="canonical" href="${LAB.SITE.url}${p}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${ASSETS.preload}
<link rel="stylesheet" href="${ASSETS.base}">
<link rel="stylesheet" href="${ASSETS.css}">
<script src="${ASSETS.js.core}" defer></script>
${scripts.map((s) => `<script src="${ASSETS.js[s]}" defer></script>`).join('\n')}
</head>
<body class="has-main-offset${cls ? ` ${cls}` : ''}">
<a class="skip" href="#main">Skip to content</a>
${topBar({ nav: NAV.slice(1), current: section, solid: true })}
<main id="main" tabindex="-1">
${body}
</main>
${footer({ site: LAB.SITE, links: [...NAV.slice(1).filter(([h]) => ['/explore/', '/method/', '/about/'].includes(h)), ['/archive.json', 'Open data'], [LAB.SITE.repo, 'GitHub']], meta: `Archive generated from the <code>norevia/</code> repository on ${esc(BUILD.dateHuman)}${BUILD.commit ? ` · commit <code>${esc(BUILD.commit)}</code>` : ''} · ${BUILD.cards} cards · research content CC BY 4.0 · code MIT.` })}
</body>
</html>
`;
}

function cardItem(c, opts = {}) {
  const dataAttrs = ` data-area="${c.area}" data-ev="${c.evidence}"${c.status ? ` data-st="${c.status.key}"` : ''} data-text="${esc([c.id, c.rawId, c.title, c.summary, c.tags.join(' ')].join(' ').toLowerCase())}"`;
  return `<li class="card-item ev-${c.evidence}"${dataAttrs}>
<a class="card-link" href="${c.url}">
<span class="card-top">${seal(c.evidence)}${opts.hideArea ? '' : areaChip(c.area)}${statusChip(c.status)}</span>
<span class="card-title">${esc(c.title)}</span>
<span class="card-sum">${esc(c.summary)}</span>
<span class="cid">${esc(c.id)}</span>
</a>
</li>`;
}

function cardList(list, opts = {}) {
  if (!list.length) return `<p class="empty">${opts.empty || 'No cards yet.'}</p>`;
  return `<ul class="cards${opts.cls ? ' ' + opts.cls : ''}"${opts.id ? ` id="${opts.id}"` : ''}>${list.map((c) => cardItem(c, opts)).join('')}</ul>`;
}

function pageHead({ eyebrow, title, lead, extra = '', seed = 7 }) {
  return `<section class="phead">${formationSvg(seed)}<div class="wrap"><p class="eyebrow u">${eyebrow}</p><h1${/</.test(title) ? '' : ' data-words'}>${title}</h1>${lead ? `<p class="lead u" style="--d:350ms">${lead}</p>` : ''}${extra ? `<div class="phead-extra u" style="--d:500ms">${extra}</div>` : ''}</div></section>`;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
// Deterministic "swarm cluster" motif for page heads: a few agents with nearest-neighbour links.
// Page-head mark: the landing-page colony in miniature — a nest with a breathing membrane, pheromone trails
// out to seed clusters and ants walking them (SMIL, so it animates inside a cached <img>). Six deterministic
// variants are written once; pages only reference them. Static under reduced motion.
const FORMATIONS = 6;
function formationFile(seed) {
  const r = rng(seed * 7919 + 13), C = 200, TAU = Math.PI * 2, f1 = (v) => v.toFixed(1);
  const memb = (R, k) => Array.from({ length: 41 }, (_, i) => { const t = (i / 40) * TAU, rr = R * (1 + 0.06 * Math.sin(3 * t + k) + 0.04 * Math.sin(5 * t - k)); return (i ? 'L' : 'M') + f1(C + Math.cos(t) * rr) + ' ' + f1(C + Math.sin(t) * rr); }).join('') + 'Z';
  const a0 = r() * TAU, trails = [], foods = [], ants = [];
  for (let k = 0; k < 3; k++) {
    const t = a0 + k * 2.1 + r() * 0.5, d = 150 + r() * 22, fx = C + Math.cos(t) * d, fy = C + Math.sin(t) * d;
    const sx = C + Math.cos(t) * 44, sy = C + Math.sin(t) * 44, bend = (r() - 0.5) * 120;
    const mx = (sx + fx) / 2 - Math.sin(t) * bend, my = (sy + fy) / 2 + Math.cos(t) * bend;
    const path = 'M' + f1(sx) + ' ' + f1(sy) + 'Q' + f1(mx) + ' ' + f1(my) + ' ' + f1(fx) + ' ' + f1(fy);
    trails.push('<path class="tr" d="' + path + '"/>');
    for (let q = 0; q < 9; q++) { const u = r() * TAU, dd = Math.sqrt(r()) * 13; foods.push('<ellipse class="sd" cx="' + f1(fx + Math.cos(u) * dd) + '" cy="' + f1(fy + Math.sin(u) * dd) + '" rx="3.2" ry="2.1" transform="rotate(' + Math.round(u * 57) + ' ' + f1(fx + Math.cos(u) * dd) + ' ' + f1(fy + Math.sin(u) * dd) + ')"/>'); }
    for (let q = 0; q < 4; q++) ants.push('<g><path class="ant" d="M-5 0a2.8 1.7 0 1 0 5.6 0a2.8 1.7 0 1 0-5.6 0M1.4 0a1.4 1 0 1 0 2.8 0a1.4 1 0 1 0-2.8 0M4.6 0a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0"/><animateMotion dur="' + (7 + r() * 3).toFixed(1) + 's" begin="-' + (q * 2.1 + r()).toFixed(1) + 's" repeatCount="indefinite" rotate="auto" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" path="' + path + '"/></g>');
  }
  const cyto = Array.from({ length: 26 }, () => { const t = r() * TAU, d = Math.sqrt(r()) * 34; return '<circle class="cy" cx="' + f1(C + Math.cos(t) * d) + '" cy="' + f1(C + Math.sin(t) * d) + '" r="' + f1(1 + r() * 1.6) + '"/>'; }).join('');
  const css = '.tr{fill:none;stroke:#0e7a62;stroke-width:5;stroke-linecap:round;opacity:.16}.sd{fill:#c98a00}.ant{fill:#101312}.cy{fill:#101312;opacity:.18}.mb{fill:rgba(16,19,18,.04);stroke:#101312;stroke-opacity:.35;stroke-width:1.2}.nu{fill:#0e7a62;opacity:.85}@media (prefers-reduced-motion:reduce){animateMotion,animate{display:none}}';
  const breathe = (R, k1, k2, cls) => '<path class="' + cls + '" d="' + memb(R, k1) + '"><animate attributeName="d" dur="6s" repeatCount="indefinite" values="' + memb(R, k1) + ';' + memb(R, k2) + ';' + memb(R, k1) + '"/></path>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><style>' + css + '</style>' + trails.join('') + foods.join('') + breathe(48, 0, 2.2, 'mb') + cyto + breathe(15, 1, 3.4, 'nu') + ants.join('') + '</svg>';
}
function formationSvg(seed = 7) {
  return `<img class="formation" src="/assets/formation-${Math.abs(Math.round(seed)) % FORMATIONS}.svg" alt="" aria-hidden="true" width="400" height="400" decoding="async">`;
}

function graphLayout(cards) {
  const W = 1000, H = 640, cx = W / 2, cy = H / 2;
  const areas = Object.keys(AREAS).filter((a) => cards.some((c) => c.area === a));
  const anchors = {};
  areas.forEach((a, k) => {
    const ang = (k / Math.max(1, areas.length)) * Math.PI * 2 - Math.PI / 2;
    anchors[a] = { x: cx + Math.cos(ang) * 290, y: cy + Math.sin(ang) * 205 };
  });
  const r = rng(42);
  const nodes = cards.map((c) => ({ c, x: anchors[c.area].x + (r() - 0.5) * 80, y: anchors[c.area].y + (r() - 0.5) * 80, vx: 0, vy: 0, deg: 0 }));
  const idx = new Map(nodes.map((n) => [n.c.id, n]));
  const edges = [];
  const seenE = new Set();
  for (const n of nodes) for (const t of n.c.related) {
    const m = idx.get(t);
    if (!m || m === n) continue;
    const key = [n.c.id, m.c.id].sort().join('|');
    if (seenE.has(key)) continue;
    seenE.add(key);
    edges.push([n, m]);
    n.deg++; m.deg++;
  }
  for (let it = 0; it < 320; it++) {
    const alpha = 1 - it / 320;
    for (const n of nodes) { const a = anchors[n.c.area]; n.vx += (a.x - n.x) * 0.01 * alpha; n.vy += (a.y - n.y) * 0.01 * alpha; }
    for (const [p, q] of edges) {
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
      const f = ((d - 110) / d) * 0.003 * alpha;
      p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f;
    }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const p = nodes[i], q = nodes[j];
      const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy || 1;
      if (d2 > 6400) continue;
      const f = (220 / d2) * alpha;
      p.vx -= dx * f; p.vy -= dy * f; q.vx += dx * f; q.vy += dy * f;
    }
    for (const n of nodes) {
      n.x = Math.max(26, Math.min(W - 26, n.x + n.vx));
      n.y = Math.max(26, Math.min(H - 26, n.y + n.vy));
      n.vx *= 0.6; n.vy *= 0.6;
    }
  }
  return { W, H, cx, cy, nodes, edges, anchors, areas };
}

function nodeShape(k, s) {
  switch (k) {
    case 'natural-phenomenon': return `<path class="sh" d="M0,${-s}L${s * 0.87},${-s / 2}V${s / 2}L0,${s}L${-s * 0.87},${s / 2}V${-s / 2}Z"/>`;
    case 'author-reported': return `<rect class="sh" x="${-s * 0.8}" y="${-s * 0.8}" width="${s * 1.6}" height="${s * 1.6}" rx="1.5"/>`;
    case 'observed-implementation': return `<path class="sh" d="M0,${-s}L${s},0L0,${s}L${-s},0Z"/>`;
    case 'hypothesis': return `<path class="sh" d="M0,${-s * 1.05}L${s},${s * 0.7}H${-s}Z"/>`;
    case 'local-validation': return `<circle class="sh" r="${s * 0.9}"/>`;
    default: return `<circle class="sh hollow" r="${s * 0.75}"/>`;
  }
}

function graphSvg(cards, G, { mini = false } = {}) {
  const { W, H, nodes, edges, anchors, areas, cx, cy } = G;
  const edgeSvg = edges.map(([p, q]) => `<line class="edge" data-s="${esc(p.c.id)}" data-t="${esc(q.c.id)}" x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}"/>`).join('');
  const labels = areas.map((a) => {
    const an = anchors[a];
    const ang = Math.atan2(an.y - cy, an.x - cx);
    const lx = cx + Math.cos(ang) * 440, ly = cy + Math.sin(ang) * 300 + 4;
    const anchor = Math.abs(Math.cos(ang)) < 0.3 ? 'middle' : Math.cos(ang) > 0 ? 'end' : 'start';
    return `<text class="alabel" data-area="${a}" x="${Math.max(10, Math.min(W - 10, lx)).toFixed(0)}" y="${Math.max(18, Math.min(H - 10, ly)).toFixed(0)}" text-anchor="${anchor}">${esc(AREAS[a].plural)} · ${cards.filter((c) => c.area === a).length}</text>`;
  }).join('');
  const nodeSvg = nodes.map((n) => {
    const s = (mini ? 4 : 6) + Math.min(6, Math.sqrt(n.deg) * (mini ? 0.8 : 1.3));
    const c = n.c;
    const attrs = mini ? '' : ` data-id="${esc(c.id)}" data-area="${c.area}" data-ev="${c.evidence}"${c.status ? ` data-st="${c.status.key}"` : ''} data-title="${esc(c.title)}" data-sum="${esc(c.summary.length > 260 ? c.summary.slice(0, 257) + '…' : c.summary)}" data-text="${esc([c.id, c.rawId, c.title, c.tags.join(' ')].join(' ').toLowerCase())}"`;
    return `<a href="${c.url}" class="node n-${c.area}"${attrs} transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})" aria-label="${esc(`${c.id}: ${c.title} — ${AREAS[c.area].label}, ${evLabel(c.evidence)}${c.status ? ', ' + c.status.label : ''}`)}"><circle class="halo" r="${(s + 9).toFixed(1)}"/>${nodeShape(c.evidence, s)}${mini ? '' : `<text class="lbl" y="${(-s - 6).toFixed(1)}" text-anchor="middle">${esc(c.id)}</text>`}</a>`;
  }).join('');
  return `<svg class="graph${mini ? ' mini' : ''}" viewBox="0 0 ${W} ${H}" role="group" aria-label="Knowledge graph: ${cards.length} cards; colour = area, shape = evidence level, lines = declared relations">${labels}<g class="edges">${edgeSvg}</g><g class="nodes">${nodeSvg}</g>${cards.length ? '' : `<text class="alabel" x="${cx}" y="${cy}" text-anchor="middle">Waiting for the first cards</text>`}</svg>`;
}

function graphLegend(cards) {
  const areaKeys = Object.keys(AREAS).filter((a) => cards.some((c) => c.area === a));
  const evKeys = Object.keys(EVIDENCE).filter((k) => cards.some((c) => c.evidence === k));
  const shp = (k) => `<svg viewBox="-8 -8 16 16" aria-hidden="true">${nodeShape(k, 6).replace('class="sh hollow"', 'class="shp hollow"').replace('class="sh"', 'class="shp"')}</svg>`;
  return `<ul class="legend-row" aria-label="Colour: area">${areaKeys.map((a) => `<li><span class="sw n-${a}" aria-hidden="true"></span>${esc(AREAS[a].plural)}</li>`).join('')}</ul>
<ul class="legend-row" aria-label="Shape: evidence level">${evKeys.map((k) => `<li>${shp(k)}${esc(evLabel(k))}</li>`).join('')}</ul>`;
}

function filters(cards, { areas = true, status = false } = {}) {
  const areaKeys = Object.keys(AREAS).filter((a) => cards.some((c) => c.area === a));
  const evKeys = [...Object.keys(EVIDENCE), 'unknown'].filter((k) => cards.some((c) => c.evidence === k));
  const stKeys = Object.keys(STATUS).filter((k) => cards.some((c) => c.status?.key === k));
  return `<form class="filters" data-filters role="search" aria-label="Filter cards" hidden>
<label class="search"><span class="sr">Search</span><input type="search" name="q" placeholder="Search by title, id or tag…  (press / to focus)" autocomplete="off"></label>
${areas && areaKeys.length > 1 ? `<fieldset><legend>Area</legend>${areaKeys.map((a) => `<button type="button" class="chip ar ar-${a}" data-filter="area" data-value="${a}" aria-pressed="false">${esc(AREAS[a].plural)} <span class="n">${cards.filter((c) => c.area === a).length}</span></button>`).join('')}</fieldset>` : ''}
${evKeys.length ? `<fieldset><legend>Evidence</legend>${evKeys.map((k) => `<button type="button" class="chip ev-${k}" data-filter="ev" data-value="${k}" aria-pressed="false">${icon(k)}${esc(evLabel(k))} <span class="n">${cards.filter((c) => c.evidence === k).length}</span></button>`).join('')}</fieldset>` : ''}
${status && stKeys.length ? `<fieldset><legend>Status</legend>${stKeys.map((k) => `<button type="button" class="chip st-${k}" data-filter="st" data-value="${k}" aria-pressed="false">${esc(STATUS[k].label)} <span class="n">${cards.filter((c) => c.status?.key === k).length}</span></button>`).join('')}</fieldset>` : ''}
<p class="fcount" aria-live="polite"></p>
</form>`;
}

// ------------------------------------------------------------------ helpers

function sortCards(list) {
  return [...list].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
}
function recent(list, n) {
  return [...list].sort((a, b) => (b.updated || '').localeCompare(a.updated || '') || fs.statSync(b.abs).mtimeMs - fs.statSync(a.abs).mtimeMs).slice(0, n);
}
function matchTags(cards, tags) {
  const set = new Set(tags.map(norm));
  return cards.filter((c) => c.tags.some((t) => set.has(t) || [...set].some((s) => t.includes(s))));
}
let CTX = null;
const card = (id) => CTX.resolveId(id);
const cardLink = (id, cls = '') => { const c = card(id); return c ? `<a class="${cls}" href="${c.url}">${seal(c.evidence)} <span class="cid">${esc(c.id)}</span> ${esc(c.title)}</a>` : ''; };
const expsFor = (h, cards) => cards.filter((c) => ['simulation', 'observatory'].includes(c.area) && (c.related.includes(h.id) || h.related.includes(c.id)));
const playFor = (id) => PLAYGROUNDS.filter((p) => p.sim === id || p.hyps.includes(id) || p.extra.includes(id));

// ------------------------------------------------------------------ playground previews (build-time, same model code)

function pvPath(pts, X, Y) { return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(''); }
function playPreview(key, ctx) {
  const W = 320, H = 160, m = 14;
  const X = (x0, x1) => (x) => m + ((x - x0) / (x1 - x0)) * (W - 2 * m);
  const Y = (y0, y1) => (y) => H - m - ((y - y0) / (y1 - y0)) * (H - 2 * m);
  const grid = [0.25, 0.5, 0.75].map((f) => `<line class="pg" x1="${m}" x2="${W - m}" y1="${(m + f * (H - 2 * m)).toFixed(0)}" y2="${(m + f * (H - 2 * m)).toFixed(0)}"/>`).join('');
  let body = '';
  if (key === 'a') {
    const x = X(1, 41), y = Y(0.5, 1);
    const g = MODELS.latentGrid(201, 8);
    const a0 = [], a3 = [];
    for (let N = 1; N <= 41; N += 2) { a0.push([N, MODELS.analyticVote(N, 0.6, 0)]); a3.push([N, MODELS.analyticVote(N, 0.6, 0.3, g)]); }
    const pH = MODELS.pOf(4, 0.5, 0.4), ceil = MODELS.voteCeilingCopula(0.6, 0.3);
    body = `<path class="pl3" d="${pvPath(a0, x, y)}"/><path class="pl" d="${pvPath(a3, x, y)}"/><line class="pl2" x1="${m}" x2="${W - m}" y1="${y(pH).toFixed(1)}" y2="${y(pH).toFixed(1)}"/><line class="pl2" x1="${m}" x2="${W - m}" y1="${y(ceil).toFixed(1)}" y2="${y(ceil).toFixed(1)}" style="stroke:#d03b3b"/>`;
  } else if (key === 'b') {
    const x = X(1, 33), y = Y(0, 0.45);
    const s1 = [], s2 = [];
    for (let N = 1; N <= 33; N++) { s1.push([N, MODELS.fsFormula(0.6, 0.95, 0.95, N)]); s2.push([N, MODELS.fsFormula(0.6, 0.95, 0.5, N)]); }
    body = `<path class="pl" d="${pvPath(s1, x, y)}"/><path class="pl2" d="${pvPath(s2, x, y)}"/>`;
  } else if (key === 'c') {
    const Vs = Array.from({ length: 60 }, (_, i) => Math.pow(10, (i / 59) * Math.log10(200)));
    const cols = { 'do-not-try': 'rgba(16, 19, 18,0.12)', single: '#2a78d6', micro: '#1baf7a', macro: '#c98a00' };
    body = MODELS.ELASTIC.classes.map((cl, r) => {
      const table = [null]; for (let N = 1; N <= 32; N++) table.push(MODELS.fixedExact(cl, N));
      const bw = (W - 2 * m) / Vs.length, y0 = 24 + r * 40;
      return Vs.map((V, i) => `<rect x="${(m + i * bw).toFixed(1)}" y="${y0}" width="${(bw + 0.5).toFixed(1)}" height="28" fill="${cols[MODELS.sizeClass(MODELS.bestFixedN(cl, V, { table }).N)]}"/>`).join('');
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${body}</svg>`;
  } else if (key === 'd') {
    const curve = ctx.stigCurve?.find((s) => s.K === 4);
    if (curve) {
      const ys = curve.pts.map((p) => p[1]);
      const x = X(0, curve.pts.length - 1), y = Y(0, Math.max(...ys) * 1.05);
      body = `<path class="pl" d="${pvPath(curve.pts.map((p, i) => [i, p[1]]), x, y)}"/>${curve.pts.map((p, i) => `<circle class="pc${i === curve.bestIdx ? ' b' : ''}" cx="${x(i).toFixed(1)}" cy="${y(p[1]).toFixed(1)}" r="${i === curve.bestIdx ? 5 : 3}"/>`).join('')}`;
    } else {
      const r = rng(5); body = Array.from({ length: 60 }, () => `<circle class="pc o" cx="${(m + r() * (W - 2 * m)).toFixed(0)}" cy="${(m + r() * (H - 2 * m)).toFixed(0)}" r="3"/>`).join('');
    }
  } else if (key === 'e') {
    const x = X(0, 80), y = Y(0, 1);
    body = [5, 20, 50].map((th, i) => `<path class="${['pl', 'pl2', 'pl3'][i]}" d="${pvPath(Array.from({ length: 81 }, (_, s) => [s, MODELS.thresholdResponse(s, th, 2)]), x, y)}"/>`).join('');
  }
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${grid}${body}</svg>`;
}

// ------------------------------------------------------------------ pages

function pageExplore(cards, G) {
  const body = `${pageHead({
    eyebrow: 'Explore',
    title: 'The knowledge swarm',
    lead: 'Every card is an agent. Colour is the area, shape is the evidence level, lines are relations declared in <code>related</code>. Hover or focus a node to preview it; click to open. Positions are visual organisation only — they measure nothing.',
    seed: 3,
  })}
<section><div class="wrap">
${filters(cards, { status: true })}
<div class="explorer">
<div>
<div class="graph-stage" data-graph>${graphSvg(cards, G)}
<div class="graph-tools" hidden><button type="button" data-act="labels" aria-pressed="false">Show labels</button><button type="button" data-act="motion" aria-pressed="true">Motion on</button><button type="button" data-act="reset">Reset view</button></div>
<p class="graph-note">Drag nodes · scroll/pinch to zoom · arrow keys move between neighbours</p>
</div>
${graphLegend(cards)}
</div>
<aside class="preview" aria-live="polite" aria-label="Card preview" data-preview>
<p class="eyebrow">Preview</p>
<p class="muted">Hover, focus or tap a node to see its card here. Relations light up in amber.</p>
<p class="muted small">Keyboard: Tab into the graph, arrows to move to a related card, Enter to open.</p>
</aside>
</div>
</div></section>
<section><div class="wrap">
<h2 id="archive">The whole archive as a list <span class="count">${cards.length}</span></h2>
<p class="muted">The same filters apply to this accessible list and to the graph.</p>
${cardList(sortCards(cards), { id: 'all-cards', cls: 'filterable', empty: 'No cards yet. The generator is ready and will publish as soon as the first ones arrive.' })}
<p class="empty filtered-empty" hidden>No card matches the filters.</p>
</div></section>`;
  return layout({ title: 'Explore', desc: 'Interactive force-directed knowledge graph of every Norevia card, with search and filters by area, evidence and status.', path: '/explore/', body, scripts: ['graph'] });
}

function playLinks(p) {
  const ids = [p.sim, ...p.hyps, ...p.extra];
  const items = ids.map((id) => { const c = card(id); return c ? `<li><a href="${c.url}">${seal(c.evidence)}<span class="cid">${esc(c.id)}</span></a></li>` : ''; }).join('');
  return items ? `<ul class="links-row" aria-label="Related cards">${items}</ul>` : '';
}

const DISCLAIMER = `<p class="disclaimer" role="note"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2l8 15H2z"/><path d="M10 8v4M10 14.5v.5"/></svg><span><strong>Model illustration, not an LLM result.</strong> Everything on this page is computed in your browser from the repository's own formulas. It shows what the model implies under its assumptions — it says nothing yet about real language-model agents.</span></p>`;

function pagePlaygrounds(ctx) {
  const body = `${pageHead({
    eyebrow: 'Playgrounds',
    title: 'Models you can touch',
    lead: 'Five small worlds ported from the repository’s simulations and theory. Move the sliders, break the assumptions, watch the frontier move. Then follow the links to the simulation card and the hypothesis it tests.',
    seed: 5,
  })}
<section><div class="wrap">
${DISCLAIMER}
<ul class="play-grid">${PLAYGROUNDS.map((p) => `<li class="play-tile rv"><a href="/playgrounds/${p.slug}/"><span class="pv">${playPreview(p.key, ctx)}</span><span class="pb"><span class="pk">PLAYGROUND ${p.key.toUpperCase()}</span><h3>${esc(p.title)}</h3><p>${esc(p.short)}</p></span></a></li>`).join('')}</ul>
</div></section>`;
  return layout({ title: 'Playgrounds', desc: 'Interactive in-browser playgrounds ported from the Norevia simulations: correlated voting, verifier best-of-N, elastic swarm, stigmergy and response thresholds.', path: '/playgrounds/', body });
}

const RANGE = (id, label, { min, max, step, value, hint = '', fmtAttr = '' }) => `<div class="ctl"><label for="${id}">${label} <output for="${id}" data-out="${id}">${value}</output></label><input type="range" id="${id}" name="${id}" min="${min}" max="${max}" step="${step}" value="${value}"${fmtAttr}>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;

const PLAY_BODY = {
  'correlated-voting': (ctx) => ({
    controls: `${RANGE('p', 'Accuracy of each low-effort agent <i>p</i>', { min: 0.35, max: 0.95, step: 0.01, value: 0.6 })}
${RANGE('rho', 'Error correlation <i>ρ</i> (shared latent factor)', { min: 0, max: 0.8, step: 0.005, value: 0.3, hint: 'ρ = 0: independent errors. Higher ρ: agents fail on the same tasks.' })}
${RANGE('n', 'Voters <i>N</i> (highlighted)', { min: 1, max: 63, step: 2, value: 9 })}
${RANGE('k', 'Effort of the single strong agent <i>k</i>', { min: 1, max: 32, step: 1, value: 4, hint: 'p<sub>H</sub> = 1 − (1 − p)·k<sup>−β</sup> with β = 0.5 (the simulation’s effort model).' })}
<div class="btnrow"><button class="btn small" type="button" data-act="sample">Sample a task</button><button class="btn small ghost" type="button" data-act="reset">Reset</button></div>`,
    viz: `<div class="panel"><h3>Accuracy of the majority vote vs N</h3><p class="sub">Exact integral over the latent factor (Simpson grid), as in <code>analyticVote</code>.</p><div class="lc-host" data-chart="acc"></div>
<ul class="legend-inline"><li><span class="k" style="--c:var(--mint)"></span>Majority vote, current ρ</li><li><span class="k dot" style="--c:var(--ev-author)"></span>Same agents, ρ = 0</li><li><span class="k dash" style="--c:var(--amber)"></span>Single strong agent (cost k)</li><li><span class="k dash" style="--c:var(--rose)"></span>Ceiling Φ(z<sub>p</sub>/√ρ)</li></ul></div>
<div class="readout" aria-live="polite" data-readout></div>
<div class="panel"><h3>One task, N agents</h3><p class="sub">All agents share the task’s latent difficulty: with high ρ they are right together — or wrong together.</p><div class="agents-row" data-agents aria-hidden="true"></div><p class="verdict" data-verdict aria-live="polite"></p></div>`,
    notice: ['With ρ = 0 the curve climbs toward 1 (Condorcet). With any ρ > 0 it flattens below a ceiling that no N can break.', 'Above the critical correlation ρ<sub>c</sub> = (z<sub>L</sub>/z<sub>H</sub>)² the single strong agent beats every N.', 'Cost is N for the vote and k for the single agent: compare accuracy per unit of effort, not just accuracy.'],
  }),
  verifier: () => ({
    controls: `${RANGE('p', 'Generator accuracy <i>p</i>', { min: 0.05, max: 0.95, step: 0.01, value: 0.6 })}
${RANGE('sens', 'Verifier sensitivity (accepts a correct answer)', { min: 0.5, max: 1, step: 0.01, value: 0.95 })}
${RANGE('spec', 'Verifier specificity (rejects a wrong answer)', { min: 0.5, max: 0.999, step: 0.001, value: 0.95 })}
${RANGE('rho', 'Correlation between candidates <i>ρ</i>', { min: 0, max: 0.6, step: 0.01, value: 0, hint: 'ρ = 0 reproduces the closed form FS(N) of the simulation exactly.' })}
${RANGE('n', 'Attempts budget <i>N</i> (highlighted)', { min: 1, max: 33, step: 1, value: 9 })}
<div class="btnrow"><button class="btn small ghost" type="button" data-act="reset">Reset</button></div>`,
    viz: `<div class="panel"><h3>False success vs N</h3><p class="sub">A wrong answer delivered as a success. Best-of-N abstains honestly when nothing passes; the vote always delivers.</p><div class="lc-host" data-chart="fs"></div>
<ul class="legend-inline"><li><span class="k" style="--c:var(--mint)"></span>Best-of-N with verifier (sequential)</li><li><span class="k dash" style="--c:var(--amber)"></span>Majority vote of N</li></ul></div>
<div class="panel"><h3>Correct deliveries and abstentions vs N</h3><div class="lc-host" data-chart="acc"></div>
<ul class="legend-inline"><li><span class="k" style="--c:var(--mint)"></span>Best-of-N: correct</li><li><span class="k dot" style="--c:var(--ev-impl)"></span>Best-of-N: abstains</li><li><span class="k dash" style="--c:var(--amber)"></span>Vote: correct</li></ul></div>
<div class="readout" aria-live="polite" data-readout></div>`,
    notice: ['Each extra attempt is a new chance to accept an error: the false-success curve of best-of-N never goes down as N grows.', 'Specificity matters far more than sensitivity for false success. Drop it to 0.5 and the verifier can be worse than the vote.', 'Correlated candidates (ρ > 0) waste the budget: retries fail on the same tasks.'],
  }),
  'elastic-swarm': () => ({
    controls: `<div class="ctl"><label for="v">Value of a correct result / cost of one attempt <i>V</i> <output for="v" data-out="v">20</output></label><input type="range" id="v" name="v" min="0" max="1000" step="1" value="565"><span class="hint">Log scale, 1 → 200. A false acceptance costs V (as in the simulation).</span></div>
${RANGE('spec', 'Acceptance-test specificity', { min: 0.8, max: 1, step: 0.005, value: 0.98, hint: 'Simulation default 0.98: 2% of wrong attempts pass the test.' })}
<div class="btnrow"><button class="btn small" type="button" data-act="sweep">Sweep V</button><button class="btn small ghost" type="button" data-act="reset">Reset</button></div>`,
    viz: `<div class="panel"><h3>Optimal team size by task class as V grows</h3><p class="sub">Each strip is one difficulty class; colour and label give the regime of the utility-maximising fixed N. The yellow marker is the current V.</p><div class="regime" data-regime></div>
<ul class="legend-inline"><li><span class="k sq" style="--c:#d9d8d1"></span>Do not try (N = 0)</li><li><span class="k sq" style="--c:var(--a-literature)"></span>Single (N = 1)</li><li><span class="k sq" style="--c:var(--mint-d)"></span>Micro (2–5)</li><li><span class="k sq" style="--c:var(--amber)"></span>Macro (≥ 6)</li></ul></div>
<div class="panel"><h3>Net utility U(N) at the current V</h3><p class="sub">U = V·P(correct accepted) − N·(attempt + test) − V·P(wrong accepted). Dots mark each class’s optimum.</p><div class="lc-host" data-chart="u"></div>
<ul class="legend-inline"><li><span class="k" style="--c:var(--mint)"></span>Easy (p 0.9, ρ 0.2)</li><li><span class="k dash" style="--c:var(--amber)"></span>Medium (p 0.5, ρ 0.3)</li><li><span class="k dot" style="--c:var(--ev-author)"></span>Coupled (p 0.15, ρ 0.5)</li></ul></div>
<div class="readout" aria-live="polite" data-readout></div>`,
    notice: ['Easy tasks almost never justify more than one agent; coupled tasks are not worth trying until the value is high — then they need a macro swarm.', 'The transition 1 → micro → macro is driven by value/cost and difficulty, not by a fixed recipe.', 'The simulation’s elastic controller adds agents one at a time while P(next correct)·V ≥ cost — see the card for how it compares with these fixed N.'],
  }),
  stigmergy: () => ({
    controls: `<div class="ctl"><span class="lab" id="eps-l">Evaporation per step <i>ε</i> <output for="eps" data-out="eps">0.1</output></span><input type="range" id="eps" name="eps" aria-labelledby="eps-l" min="0" max="7" step="1" value="5"><span class="hint">The eight values of the simulation: 0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1.</span></div>
<div class="ctl"><span class="lab">Agents <i>K</i></span><div class="seg-ctl" role="group" aria-label="Number of agents"><button type="button" data-k="4" aria-pressed="true">4</button><button type="button" data-k="16" aria-pressed="false">16</button></div></div>
<div class="ctl"><span class="lab">Coordination</span><div class="seg-ctl" role="group" aria-label="Coordination mode"><button type="button" data-mode="stigmergy" aria-pressed="true">Shared trail</button><button type="button" data-mode="none" aria-pressed="false">None</button></div></div>
${RANGE('speed', 'Speed (steps per frame)', { min: 1, max: 60, step: 1, value: 6 })}
<div class="btnrow"><button class="btn small" type="button" data-act="play">Pause</button><button class="btn small ghost" type="button" data-act="turbo">Run 50 episodes now</button><button class="btn small ghost" type="button" data-act="reset">Reset</button></div>`,
    viz: `<div class="panel"><h3>The grid</h3><p class="sub">24 × 24 cells. Agents move to the neighbour with the least trail (“I was already here”), deposit +1, and the trail decays by (1 − ε) per step. A target appears; when an agent steps on it a new one appears — agents never learn that an episode ended.</p><canvas data-grid width="480" height="480" role="img" aria-label="Foraging grid simulation"></canvas>
<ul class="legend-inline"><li><span class="k ci" style="--c:var(--ink)"></span>Agent</li><li><span class="k sq" style="--c:var(--mint-d)"></span>Trail (brighter = fresher)</li><li><span class="k ci" style="--c:var(--amber)"></span>Target</li></ul></div>
<div class="readout" aria-live="polite" data-readout></div>
<div class="panel"><h3>The U-shaped optimum (from the simulation’s results)</h3><p class="sub" data-ucap>Mean steps to find a target vs ε, 500 runs × 10 episodes per point, from the results file.</p><div class="lc-host" data-chart="u"></div>
<ul class="legend-inline"><li><span class="k" style="--c:var(--mint)"></span>Shared trail (stigmergy)</li><li><span class="k dash" style="--c:var(--amber)"></span>All-to-all messages</li><li><span class="k dot" style="--c:var(--rose)"></span>No coordination</li><li><span class="k ci" style="--c:var(--focus)"></span>Your live run</li></ul></div>`,
    notice: ['ε = 0: the trail never fades, old episodes pollute the map and search slows down (memory without forgetting).', 'ε = 1: the trail vanishes immediately — the swarm is back to blind wandering.', 'In between, a shared fading trail matches all-to-all messaging with zero messages.'],
  }),
  'response-thresholds': () => ({
    controls: `${RANGE('thmin', 'Lowest threshold θ<sub>min</sub>', { min: 1, max: 40, step: 1, value: 5 })}
${RANGE('thmax', 'Highest threshold θ<sub>max</sub>', { min: 5, max: 120, step: 1, value: 50, hint: 'Each agent draws θ ~ U[θmin, θmax] per task type. P(engage) = s²/(s² + θ²), s = backlog.' })}
${RANGE('quit', 'Quit probability per step', { min: 0.01, max: 0.5, step: 0.01, value: 0.1 })}
<div class="ctl"><span class="lab">Demand</span><div class="btnrow"><button class="btn small" type="button" data-spike="0">Spike A ×4</button><button class="btn small" type="button" data-spike="1">Spike B ×4</button></div><span class="hint">A spike multiplies arrivals of one task type by 4 for 50 steps (as in the simulation).</span></div>
<div class="btnrow"><button class="btn small ghost" type="button" data-act="play">Pause</button><button class="btn small ghost" type="button" data-act="reset">Reset</button></div>`,
    viz: `<div class="panel"><h3>40 agents</h3><p class="sub">Idle agents watch the backlog of each task type. Nobody tells them what to do.</p><div class="agent-grid" data-agents aria-hidden="true"></div>
<ul class="legend-inline"><li><span class="k ci" style="--c:var(--a-literature)"></span>Working on A (circle)</li><li><span class="k sq" style="--c:var(--a-simulation)"></span>Working on B (square)</li><li><span class="k sq" style="--c:transparent;border:1.5px solid var(--line2)"></span>Idle</li></ul></div>
<div class="panel"><h3>Backlog (tasks waiting)</h3><p class="sub">Same arrivals for both strategies.</p><div class="lc-host" data-chart="backlog"></div>
<ul class="legend-inline"><li><span class="k" style="--c:var(--mint)"></span>Response thresholds</li><li><span class="k dash" style="--c:var(--amber)"></span>Fixed roles 3 + 3</li></ul></div>
<div class="panel"><h3>Active agents</h3><div class="lc-host" data-chart="active"></div>
<ul class="legend-inline"><li><span class="k" style="--c:var(--mint)"></span>Response thresholds</li><li><span class="k dash" style="--c:var(--amber)"></span>Fixed roles 3 + 3</li></ul></div>
<div class="readout" aria-live="polite" data-readout></div>`,
    notice: ['After a spike, idle agents with low thresholds switch on first; once the backlog drains, agents quit and the swarm contracts.', 'Fixed roles sized for the average demand cannot absorb spikes: the backlog piles up.', 'Zero messages are exchanged: the backlog itself is the signal (a form of stigmergy).'],
  }),
};

function pagePlayground(p, ctx) {
  const spec = PLAY_BODY[p.slug](ctx);
  const sim = card(p.sim);
  const body = `${pageHead({
    eyebrow: `Playground ${p.key.toUpperCase()} · <a href="/playgrounds/">all playgrounds</a>`,
    title: esc(p.title),
    lead: esc(p.short),
    extra: playLinks(p),
    seed: p.key.charCodeAt(0),
  })}
<section><div class="wrap">
${DISCLAIMER}
<div class="pg" data-play="${p.slug}"${p.slug === 'stigmergy' && ctx.stigCurve ? ` data-curve="${esc(JSON.stringify(ctx.stigCurve))}"` : ''}>
<form class="controls" aria-label="Model parameters">
${spec.controls}
</form>
<div class="viz">
<p class="pg-static js-hide">This playground needs JavaScript. The static results are on the ${sim ? `<a href="${sim.url}">simulation card</a>` : 'simulation card'}.</p>
${spec.viz}
<div class="panel"><h3>What to notice</h3><ul class="notice-list">${spec.notice.map((n) => `<li>${n}</li>`).join('')}</ul>
<p class="provenance">Ported from <code>${esc(p.origin)}</code>. Same formulas and parameters; nothing here is a new result. ${sim ? `Full results, confidence intervals and the preregistered predictions: <a href="${sim.url}">${esc(sim.id)}</a>.` : 'The simulation card will be linked here when it is published.'}</p></div>
</div>
</div>
</div></section>`;
  return layout({ title: `${p.title} — playground`, desc: `${p.short} Interactive model illustration (not an LLM result).`, path: `/playgrounds/${p.slug}/`, body, scripts: [p.script] });
}

function pageHypotheses(cards) {
  const hyps = sortCards(cards.filter((c) => c.area === 'hypothesis'));
  const extra = [...new Set(hyps.map((h) => h.status?.key || 'other'))].filter((k) => !BOARD.includes(k));
  const cols = [...BOARD, ...extra];
  const tile = (h) => {
    const ex = expsFor(h, cards);
    const pl = playFor(h.id);
    return `<li class="htile ev-${h.evidence}" data-text="${esc([h.id, h.title, h.summary, h.tags.join(' ')].join(' ').toLowerCase())}" data-ev="${h.evidence}"><span class="hid">${esc(h.id)}</span><h3><a href="${h.url}">${esc(h.title)}</a></h3><p>${esc(h.summary)}</p>
<div class="exps">${ex.length ? ex.map((e) => `<a href="${e.url}" title="${esc(e.title)}">⟶ ${esc(e.id)}</a>`).join('') : '<span class="none">No linked experiment yet</span>'}${pl.map((x) => `<a href="/playgrounds/${x.slug}/" title="Interactive playground">▶ ${esc(x.title)}</a>`).join('')}</div></li>`;
  };
  const board = `<div class="board" role="list">${cols.map((k) => {
    const list = hyps.filter((h) => (h.status?.key || 'other') === k);
    const label = STATUS[k]?.label || 'Other status';
    return `<section class="col st-${k}" role="listitem" aria-labelledby="col-${k}"><h2 id="col-${k}"><span>${stIcon(k)} ${esc(label)}</span><span class="n">${list.length}</span></h2>${STATUS[k] ? `<p class="muted small">${esc(STATUS[k].desc)}</p>` : ''}${list.length ? `<ol>${list.map(tile).join('')}</ol>` : '<p class="colempty">None yet.</p>'}</section>`;
  }).join('')}</div>`;
  const body = `${pageHead({
    eyebrow: 'Official register',
    title: 'Hypothesis board',
    lead: 'Every hypothesis is falsifiable: it declares variables, a prediction and what would refute it. Status changes only with evidence recorded in the repository. Each tile links to the experiments that test it.',
    extra: `<ul class="statuslist">${cols.map((k) => `<li>${statusChipKey(k, STATUS[k]?.label || 'Other')} <strong>${hyps.filter((h) => (h.status?.key || 'other') === k).length}</strong></li>`).join('')}</ul>`,
    seed: 9,
  })}
<section><div class="wrap">
${hyps.length ? `<div class="board-tools" hidden data-board-tools><label class="search" style="flex:1;min-width:240px"><span class="sr">Search hypotheses</span><input type="search" placeholder="Search hypotheses…  (press / to focus)" data-board-q autocomplete="off"></label><p class="fcount" aria-live="polite" data-board-count></p></div>${board}` : '<p class="empty">No hypotheses registered yet. The register lives in <code>hypotheses/</code> (H-01, H-02…).</p>'}
<p class="muted small" style="margin-top:1.4rem">“Preliminary support” usually means support inside a simulated model (local validation of the model), not with LLM agents. Author-reported results alone never move a status to supported.</p>
</div></section>`;
  return layout({ title: 'Hypotheses', desc: 'Live board of the Norevia falsifiable hypotheses by status, each linked to the experiments that test it.', path: '/hypotheses/', body, scripts: ['board'] });
}

function summaryBlock(ds) {
  const s = ds.summary;
  if (!s) return '';
  return `<div class="rsummary"><p class="eyebrow">From the file <code>${esc(ds.file)}</code></p>
${s.headline.length ? `<ul class="headline">${s.headline.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
${s.tests.length ? `<div class="table-wrap" tabindex="0"><table class="small"><thead><tr><th scope="col">Prediction</th><th scope="col">Test verdict</th><th scope="col">Detail</th></tr></thead><tbody>${s.tests.map((t) => { const k = VERDICT_ALIASES[norm(t.verdict)]; return `<tr><th scope="row">${esc(t.id ?? '')}</th><td>${k ? `<span class="status st-${k}">${esc(VERDICT[k])}</span>` : `<span class="status st-other">${esc(String(t.verdict ?? '—'))}</span>`}</td><td>${esc(t.detail ?? '')}</td></tr>`; }).join('')}</tbody></table></div>` : ''}
${s.meta.length ? `<p class="muted small">${s.meta.map(([k, v]) => `${esc(k)}: <code>${esc(v)}</code>`).join(' · ')}</p>` : ''}</div>`;
}
function chartsFor(c, max = 6) {
  const out = [];
  for (const ds of c.data) {
    if (ds.summary) out.push(summaryBlock(ds));
    for (const s of ds.specs.slice(0, max)) out.push(renderChart(s));
    if (!ds.specs.length && ds.metrics.length) out.push(metricsTable(ds));
  }
  return out;
}
function metricsTable(ds) {
  return `<figure class="metrics"><figcaption><code>${esc(ds.file)}</code></figcaption><div class="table-wrap" tabindex="0"><table><tbody>${ds.metrics.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td class="num">${esc(typeof v === 'number' ? fmt(v) : String(v))}</td></tr>`).join('')}</tbody></table></div></figure>`;
}

// Observatory summaries (summary-*.json written by observatory/analyze.mjs): Pareto scatter + table.
const ARCH_COL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6', '#008300', '#e34948', '#2f8f1f'];
function observatorySummary(ds) {
  const d = ds.data;
  if (!d || typeof d !== 'object' || !d.overall || typeof d.overall !== 'object') return null;
  const rows = Object.entries(d.overall).filter(([, v]) => v && typeof v === 'object' && Number.isFinite(v.meanCost) && Number.isFinite(v.acceptRate));
  if (!rows.length) return null;
  const archs = (Array.isArray(d.archs) ? d.archs : rows.map(([a]) => a));
  const colOf = (a) => ARCH_COL[Math.max(0, archs.indexOf(a)) % ARCH_COL.length];
  const W = 640, H = 300, m = { t: 16, r: 24, b: 46, l: 56 };
  const xs = rows.map(([, v]) => v.meanCost);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const logx = x0 > 0 && x1 / x0 > 8;
  const tx = (v) => (logx ? Math.log10(v) : v);
  const a = tx(logx ? x0 / 1.3 : 0), b = tx(x1 * 1.15);
  const X = (v) => m.l + ((tx(v) - a) / (b - a || 1)) * (W - m.l - m.r);
  const Y = (v) => m.t + (1 - v) * (H - m.t - m.b);
  const parts = [];
  for (const t of [0, 0.25, 0.5, 0.75, 1]) parts.push(`<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/><text class="tick" x="${m.l - 8}" y="${Y(t) + 4}" text-anchor="end">${Math.round(t * 100)}%</text>`);
  const xt = logx ? [-4, -3, -2, -1, 0, 1].map((e) => 10 ** e).filter((v) => tx(v) >= a && tx(v) <= b) : [0, x1 / 2, x1];
  for (const t of xt) parts.push(`<text class="tick" x="${X(t).toFixed(1)}" y="${H - m.b + 18}" text-anchor="middle">$${fmt(t)}</text>`);
  const pts = rows.map(([arch, v]) => {
    const ci = Array.isArray(v.ci95) ? ` [95% CI ${Math.round(v.ci95[0] * 100)}–${Math.round(v.ci95[1] * 100)}%]` : '';
    const tip = `${arch} · n=${v.n} · accepted ${Math.round(v.acceptRate * 100)}%${ci} · mean cost $${fmt(v.meanCost)}${Number.isFinite(v.falseSuccessRate) ? ` · false success ${Math.round(v.falseSuccessRate * 1000) / 10}%` : ''}`;
    const cx = X(v.meanCost).toFixed(1), cy = Y(v.acceptRate).toFixed(1);
    const err = Array.isArray(v.ci95) ? `<line class="ci" x1="${cx}" x2="${cx}" y1="${Y(v.ci95[0]).toFixed(1)}" y2="${Y(v.ci95[1]).toFixed(1)}" stroke="${colOf(arch)}"/>` : '';
    return `${err}<g class="pt" tabindex="0" role="img" aria-label="${esc(tip)}" data-tip="${esc(tip)}"><circle class="hit" cx="${cx}" cy="${cy}" r="12"/><circle class="dot" cx="${cx}" cy="${cy}" r="5.5" fill="${colOf(arch)}"/></g><text class="endlabel" x="${(+cx + 9).toFixed(1)}" y="${(+cy - 7).toFixed(1)}">${esc(arch)}</text>`;
  }).join('');
  parts.push(`<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}"/>`, pts, `<text class="axlabel" x="${m.l + (W - m.l - m.r) / 2}" y="${H - 6}" text-anchor="middle">mean cost per task (USD${logx ? ', log scale' : ''})</text>`);
  const table = `<details class="datatable"><summary>View data (${rows.length} architectures)</summary><div class="table-wrap" tabindex="0"><table><thead><tr><th scope="col">Architecture</th><th scope="col" class="num">n</th><th scope="col" class="num">Accepted</th><th scope="col" class="num">95% CI</th><th scope="col" class="num">False success</th><th scope="col" class="num">Mean cost</th><th scope="col" class="num">Cost / accepted</th><th scope="col" class="num">Mean latency (s)</th></tr></thead><tbody>${rows.map(([arch, v]) => `<tr><th scope="row">${esc(arch)}</th><td class="num">${v.n ?? ''}</td><td class="num">${Math.round(v.acceptRate * 1000) / 10}%</td><td class="num">${Array.isArray(v.ci95) ? `${Math.round(v.ci95[0] * 100)}–${Math.round(v.ci95[1] * 100)}%` : ''}</td><td class="num">${Number.isFinite(v.falseSuccessRate) ? Math.round(v.falseSuccessRate * 1000) / 10 + '%' : ''}</td><td class="num">$${fmt(v.meanCost)}</td><td class="num">${Number.isFinite(v.costPerAccepted) ? '$' + fmt(v.costPerAccepted) : ''}</td><td class="num">${Number.isFinite(v.meanLatencyS) ? fmt(v.meanLatencyS) : ''}</td></tr>`).join('')}</tbody></table></div></details>`;
  const phase = (Array.isArray(d.phases) ? d.phases.join(', ') : '') || path.basename(ds.file).replace(/^summary-|\.json$/g, '');
  return `<article class="exp"><p class="card-top">${seal('gap')}<span class="status st-testing">${stIcon('testing')}Preliminary run data</span></p><h3>Phase: ${esc(phase)}</h3><p>${esc(String(d.nRuns ?? '?'))} runs · ${archs.length} architectures · generated ${esc(String(d.generated || ''))}. Raw summary from <code>${esc(ds.file)}</code> — no interpretive card yet, so no conclusion is drawn here.</p>
<figure class="chart scatter" aria-labelledby="obs-${esc(phase)}"><figcaption id="obs-${esc(phase)}"><strong>Accepted rate vs mean cost, by architecture</strong><span class="muted"> · vertical lines: 95% CI from the file · up-and-left is better</span></figcaption><div class="chart-box"><svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Scatter of accepted rate against mean cost for ${rows.length} architectures">${parts.join('')}</svg><div class="tip" hidden></div></div>${table}</figure></article>`;
}

function pageExperiments(cards, datasets, obsStatus) {
  const sims = sortCards(cards.filter((c) => c.area === 'simulation'));
  const obs = sortCards(cards.filter((c) => c.area === 'observatory'));
  const orphan = datasets.filter((d) => !d.owner);
  const obsSummaries = orphan.filter((d) => /^results\/observatory\//.test(d.file)).map((d) => ({ d, html: observatorySummary(d) })).filter((x) => x.html);
  const shown = new Set(obsSummaries.map((x) => x.d));
  const rest = orphan.filter((d) => !shown.has(d));
  const block = (c) => {
    const charts = chartsFor(c, 1);
    const pl = playFor(c.id).filter((p) => p.sim === c.id);
    return `<article class="exp ev-${c.evidence}"><p class="card-top">${seal(c.evidence)}${statusChip(c.status)}</p><h3><a href="${c.url}">${esc(c.title)}</a> <span class="cid">${esc(c.id)}</span></h3><p>${esc(c.summary)}</p>${pl.length ? `<p>${pl.map((p) => `<a class="btn small" href="/playgrounds/${p.slug}/">▶ Try the ${esc(p.title.toLowerCase())} playground</a>`).join(' ')}</p>` : ''}${charts.slice(0, 2).join('')}${charts.length > 2 ? `<p><a class="more" href="${c.url}#results">All charts and data</a></p>` : ''}${c.data.length ? `<p class="muted small">Data: ${c.data.map((d) => `<code>${esc(d.file)}</code>`).join(', ')}</p>` : '<p class="muted small">No data file associated.</p>'}</article>`;
  };
  const running = obsStatus.filter((s) => Number(s.pending) > 0 || (s.finished != null && s.total != null && s.finished < s.total));
  const body = `${pageHead({
    eyebrow: 'Swarm Efficiency Observatory',
    title: 'Experiments',
    lead: 'A wind tunnel for swarms: the same task under different architectures, comparable budgets, multiple runs and objective acceptance criteria. Simulations explore dynamics; the Observatory measures real LLM agents.',
    seed: 11,
  })}
<section><div class="wrap">
<ol class="abc">${LAB.OBSERVATORY_DESIGN.map((a) => `<li><span class="k">${a.k}</span><strong>${esc(a.name)}</strong><span class="muted">${esc(a.d)}</span></li>`).join('')}</ol>
<p class="muted">Metrics: ${LAB.OBSERVATORY_METRICS.map(esc).join(' · ')}. The goal is to locate transition points: when the single agent stops being the best choice, when a micro-swarm adds value and when expanding wastes resources.</p>
</div></section>
<section><div class="wrap">
<h2 id="simulations">Agent-based simulations <span class="count">${sims.length}</span></h2>
<p class="muted narrow">Seed-deterministic models (<code>sims/</code> → <code>results/sims/</code>). A simulation explores dynamics; it does not replace benchmarks with real LLMs. “Local validation” here means validation inside the model.</p>
${sims.length ? sims.map(block).join('') : '<p class="empty">No simulation published yet.</p>'}
</div></section>
<section><div class="wrap">
<h2 id="observatory">Observatory: benchmarks with real LLMs</h2>
${obsStatus.length ? `<p class="obs-status">${running.length ? '<span class="pulse" aria-hidden="true"></span>' : ''}${obsStatus.map((s) => `Phase <strong>${esc(String(s.phase ?? '?'))}</strong>: ${esc(String(s.finished ?? '?'))}/${esc(String(s.total ?? '?'))} task runs finished${Number(s.pending) ? `, ${esc(String(s.pending))} pending` : ''}`).join(' · ')}${running.length ? ' — still running; results will appear as cards.' : ''}</p>` : ''}
${obs.length ? obs.map(block).join('') : '<p class="empty">No interpreted Observatory result published yet. When there is one, each result card states the tasks, budget, number of runs and acceptance criterion.</p>'}
${obsSummaries.length ? `<h3 style="margin-top:2rem">Preliminary run summaries</h3><p class="muted narrow">Automatically charted from the Observatory’s summary files. These are calibration/pilot phases with small samples: read them as instrument checks, not findings.</p><div class="exp-grid">${obsSummaries.map((x) => x.html).join('')}</div>` : ''}
</div></section>
${rest.length ? `<section><div class="wrap"><h2 id="data">Data without an interpretive card yet</h2><p class="muted narrow">Files in <code>results/</code> with no associated card. Raw data: no reading, no conclusion.</p>${rest.map((d) => `<article class="exp"><h3><code>${esc(d.file)}</code></h3>${summaryBlock(d)}${d.error ? `<p class="muted">Not charted: ${esc(d.error)}.</p>` : d.specs.slice(0, 3).map(renderChart).join('') || (d.metrics.length ? metricsTable(d) : '<p class="muted">Format not recognised for charting.</p>')}</article>`).join('')}</div></section>` : ''}`;
  return layout({ title: 'Experiments', desc: 'Simulations and Swarm Efficiency Observatory benchmarks, with charts generated from the data files.', path: '/experiments/', body });
}

function pageLiterature(cards) {
  const lit = sortCards(cards.filter((c) => c.area === 'literature'));
  const oss = sortCards(cards.filter((c) => c.area === 'oss'));
  const both = [...lit, ...oss];
  const item = (c) => `<li class="ref-item ev-${c.evidence}" data-area="${c.area}" data-ev="${c.evidence}" data-text="${esc([c.id, c.rawId, c.title, c.summary, c.tags.join(' '), c.sources.join(' ')].join(' ').toLowerCase())}"><p class="card-top">${seal(c.evidence)}${statusChip(c.status)}</p><h3><a href="${c.url}">${esc(c.title)}</a> <span class="cid">${esc(c.id)}</span></h3><p>${esc(c.summary)}</p>${c.sources.length ? `<p class="src small">${inline(c.sources[0])}${c.sources.length > 1 ? ` <span class="muted">+${c.sources.length - 1}</span>` : ''}</p>` : '<p class="src small muted">No source recorded — treat as a gap.</p>'}</li>`;
  const body = `${pageHead({
    eyebrow: 'Sources',
    title: 'Literature & open source',
    lead: 'Papers on multi-agent systems, scaling, debate and routing; open-source projects inspected at a recorded commit. What authors report is not what we validate.',
    seed: 13,
  })}
<section><div class="wrap">
${filters(both, { areas: true })}
<h2 id="papers">Literature <span class="count">${lit.length}</span></h2>
${lit.length ? `<ul class="refs filterable">${lit.map(item).join('')}</ul>` : '<p class="empty">No paper catalogued yet.</p>'}
<h2 id="oss">Open source <span class="count">${oss.length}</span></h2>
${oss.length ? `<ul class="refs filterable">${oss.map(item).join('')}</ul>` : '<p class="empty">No project inspected yet.</p>'}
<p class="empty filtered-empty" hidden>No source matches the filters.</p>
</div></section>`;
  return layout({ title: 'Literature & OSS', desc: 'Papers and open-source projects catalogued by Norevia, each with its evidence level.', path: '/literature/', body });
}

function pageMethod(cards) {
  const gaps = sortCards(cards.filter((c) => c.evidence === 'gap'));
  const untested = cards.filter((c) => c.area === 'hypothesis' && ['open', 'other'].includes(c.status?.key || 'other'));
  const body = `${pageHead({
    eyebrow: 'Evidence discipline',
    title: 'Method',
    lead: 'We distinguish natural phenomenon, author-reported result, observed implementation, hypothesis, local validation and gap. A big ambition demands honest bookkeeping.',
    seed: 17,
  })}
<section><div class="wrap">
<h2 id="levels">Evidence levels</h2>
<p class="muted narrow">Every badge carries a shape, a colour and a text label — never colour alone.</p>
<ol class="ladder">${Object.entries(EVIDENCE).map(([k, e]) => {
  const list = cards.filter((c) => c.evidence === k);
  return `<li class="ev-${k}"><div>${seal(k, ' seal-lg')}</div><div><p>${esc(e.desc)}</p><p class="muted small">${list.length} card(s)${list.length ? ': ' + sortCards(list).slice(0, 4).map((c) => `<a href="${c.url}">${esc(c.id)}</a>`).join(', ') + (list.length > 4 ? ` … <a href="/explore/?ev=${k}">all</a>` : '') : ''}</p></div></li>`;
}).join('')}</ol>
<h2 id="rules">Research rules</h2>
<ul class="rules">${LAB.RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
<h2 id="lenses">Evaluation lenses</h2>
<dl class="lenses">${LAB.LENSES.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
<p class="muted small">Research proposals described here do not authorise deployment or changes to systems or teams.</p>
</div></section>
<section class="gaps"><div class="wrap">
<h2 id="not-yet-proven">What remains to be proven</h2>
<ul class="notyet">${LAB.NOT_YET_PROVEN.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
<h3>Gaps recorded in the archive <span class="count">${gaps.length}</span></h3>
${cardList(gaps, { empty: 'No card is marked as a gap yet.' })}
<h3>Untested hypotheses <span class="count">${untested.length}</span></h3>
${untested.length ? `<ul class="plainlist">${sortCards(untested).map((h) => `<li><a href="${h.url}">${esc(h.id)}</a> — ${esc(h.title)}</li>`).join('')}</ul>` : '<p class="muted">No open hypothesis registered.</p>'}
</div></section>
<section><div class="wrap">
<h2 id="health">Archive health</h2>
<p class="muted narrow">Automatic checks run by the generator on this build: missing fields, duplicate ids, broken relations, unrecorded sources. ${warnings.length} warning(s).</p>
${warnings.length ? `<div class="table-wrap" tabindex="0"><table class="small"><thead><tr><th scope="col">File</th><th scope="col">Warning</th></tr></thead><tbody>${warnings.slice(0, 200).map((w) => `<tr><td><code>${esc(w.file)}</code></td><td>${esc(w.msg)}</td></tr>`).join('')}</tbody></table></div>` : '<p>No warnings.</p>'}
<h2 id="card-format">Card format</h2>
<pre><code>---
id: nat-response-threshold
title: Response thresholds in social insects
area: nature
evidence: natural-phenomenon
tags: [division-of-labor, elastic-swarm]
sources:
  - "Author (year). Journal. doi:…"
related: [H-03, sim-response-threshold]
updated: 2026-11-07
summary: One sentence for the site.
---
Mechanism · Evidence · Engineering analogue · Testable hypothesis · Limits / gaps</code></pre>
<p class="muted small">Optional for experiments: <code>data: file.json</code> (relative to the card or the repo root) and <code>chart: { x: n_agents, y: [accuracy], group: arch }</code>. Hypotheses use <code>status: open | testing | preliminary-support | preliminary-refuted | inconclusive</code>. During the translation the generator also accepts the legacy Portuguese values.</p>
</div></section>`;
  return layout({ title: 'Method', desc: 'Evidence levels, research rules and what remains to be proven in Norevia.', path: '/method/', body });
}

function pageAbout(cards, datasets) {
  const body = `${pageHead({
    eyebrow: 'About',
    title: 'Bioinspired Agentic Swarms',
    lead: 'Norevia is a Cold Code Labs research project on AI agents that organise the way living systems do — gathering around hard problems, staying lean on easy ones, and dissolving when the work is done. First release soon.',
    seed: 19,
  })}
<section><div class="wrap">
<div class="about-grid">
<div id="norevia"><h3>The project</h3><p>${esc(LAB.SITE.definition)}</p><p>${esc(LAB.SITE.scope)} Nature proposes mechanisms; experiments decide.</p><p><a href="/method/">How we read evidence</a></p></div>
<div id="cold-code-labs"><h3>Cold Code Labs</h3><p>Cold Code Labs is the company behind Norevia. It funds and runs the research and publishes the archive, code and data openly.</p><p><a href="${LAB.SITE.companyUrl}" rel="noopener noreferrer">coldcodelabs.com</a></p></div>
<div id="open-data"><h3>Open data</h3><p>The whole archive — ${cards.length} cards, ${datasets.length} datasets, evidence levels, relations and build warnings — is one JSON file.</p><p><a class="btn small" href="/archive.json">archive.json</a></p></div>
<div id="code"><h3>Source code</h3><p>Cards, simulations, the Observatory harness and this site’s generator live in one repository.</p><p><a class="btn small ghost" href="${LAB.SITE.repo}" rel="noopener noreferrer">github.com/cold-code-labs/norevia</a></p></div>
</div>
<h2>How this site is made</h2>
<ul class="rules">
<li>A zero-dependency Node generator (<code>site/build.mjs</code>) reads the Markdown cards and result files on every build. Nothing on the site is written by hand except the institutional copy.</li>
<li>The playgrounds run ported model code in your browser (<code>site/src/js/models.js</code>), with the same formulas as <code>sims/</code> and <code>research/theory/model.mjs</code>.</li>
<li>No frameworks, trackers, cookies, external fonts or CDNs. A strict Content-Security-Policy allows only same-origin scripts.</li>
<li>Motion respects <code>prefers-reduced-motion</code>: the swarms hold still, the graph stops moving, and playgrounds wait for you.</li>
</ul>
<h2>Licences</h2>
<p>Research content CC BY 4.0 · code MIT.</p>
</div></section>`;
  return layout({ title: 'About', desc: 'Norevia is a Cold Code Labs research project. Open data, source code and how the site is built.', path: '/about/', body });
}

// Small radial neighbourhood graph on a card page.
function neighbourhood(c, related, backlinks) {
  const others = [...related.filter((r) => !r.missing), ...backlinks].slice(0, 14);
  if (!others.length) return '';
  const W = 520, H = 240, cx = W / 2, cy = H / 2;
  const col = (a) => ({ nature: '#1baf7a', theory: '#6250d6', hypothesis: '#eda100', literature: '#2a78d6', oss: '#e87ba4', simulation: '#eb6834', observatory: '#008300' }[a] || '#7d837f');
  const pts = others.map((o, i) => { const ang = (i / others.length) * Math.PI * 2 - Math.PI / 2; return { o, x: cx + Math.cos(ang) * 200, y: cy + Math.sin(ang) * 90 }; });
  return `<div class="mini-graph" aria-label="Neighbourhood of ${esc(c.id)}"><svg viewBox="0 0 ${W} ${H}" role="group">${pts.map((p) => `<line class="e" x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}"/>`).join('')}${pts.map((p) => `<a href="${p.o.url}" aria-label="${esc(`${p.o.id}: ${p.o.title}`)}"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" fill="${col(p.o.area)}"/><text x="${p.x.toFixed(1)}" y="${(p.y + (p.y > cy ? 18 : -11)).toFixed(1)}" text-anchor="middle">${esc(p.o.id)}</text></a>`).join('')}<circle cx="${cx}" cy="${cy}" r="10" fill="${col(c.area)}" stroke="#c98a00" stroke-width="2"/><text x="${cx}" y="${cy + 26}" text-anchor="middle">${esc(c.id)}</text></svg></div>`;
}

function pageCard(c, cards, ctx) {
  const { html, headings } = markdown(c.body.replace(/^\s*#\s+.*\n/, ''), { ...ctx, selfId: c.id, resolvePath: (href) => ctx.resolvePath(href, c) });
  const related = c.related.map((id) => ctx.byId.get(id) || { missing: id });
  const backlinks = cards.filter((o) => o !== c && o.related.includes(c.id) && !c.related.includes(o.id));
  const charts = chartsFor(c);
  const pillars = LAB.PILLARS.filter((p) => matchTags([c], p.match).length);
  const toc = headings.filter((h) => h.level <= 3);
  const pl = playFor(c.id);
  const skip = ['id', 'title', 'titulo', 'area', 'evidence', 'evidencia', 'tags', 'sources', 'fontes', 'related', 'relacionados', 'updated', 'summary', 'resumo', 'status', 'chart', 'data', 'dados', 'results', 'resultados'];
  const metaKey = (k) => ({ verificacao: 'verification', origem: 'origin', experimento: 'experiment' }[k] || k);
  const extraMeta = Object.entries(c.fm).filter(([k, v]) => !skip.includes(k) && v !== '' && v != null && (typeof v !== 'object' || Array.isArray(v)));
  const exps = c.area === 'hypothesis' ? expsFor(c, cards) : [];
  const body = `
<article class="cardpage ev-${c.evidence}">
<header class="phead card-head">${formationSvg(c.id.length * 13 + c.id.charCodeAt(c.id.length - 1))}<div class="wrap">
<nav class="crumbs u" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${areaHref(c.area)}">${esc(AREAS[c.area].plural)}</a> / <span>${esc(c.id)}</span></nav>
<p class="card-top u" style="--d:120ms">${seal(c.evidence, ' seal-lg')}${areaChip(c.area)}${statusChip(c.status)}</p>
<h1 data-words>${esc(c.title)}</h1>
<p class="lead u" style="--d:350ms">${inline(c.summary, { ...ctx, selfId: c.id })}</p>
${pl.length ? `<p>${pl.map((p) => `<a class="btn small" href="/playgrounds/${p.slug}/">▶ Interactive: ${esc(p.title)}</a>`).join(' ')}</p>` : ''}
</div></header>
<div class="wrap card-grid">
<aside class="meta" aria-label="Metadata">
<dl>
<div><dt>ID</dt><dd><code>${esc(c.id)}</code>${c.rawId !== c.id ? ` <span class="muted small">(legacy id <code>${esc(c.rawId)}</code>)</span>` : ''}</dd></div>
<div><dt>Evidence</dt><dd>${esc(evLabel(c.evidence))}<span class="muted small block">${esc(EVIDENCE[c.evidence]?.desc || 'Level not declared or invalid in the frontmatter.')}</span></dd></div>
${c.status ? `<div><dt>Status</dt><dd>${statusChip(c.status)}</dd></div>` : ''}
${exps.length ? `<div><dt>Tested by</dt><dd>${exps.map((e) => `<a href="${e.url}">${esc(e.id)}</a>`).join('<br>')}</dd></div>` : ''}
${c.updated ? `<div><dt>Updated</dt><dd>${esc(c.updated)}</dd></div>` : ''}
${c.tags.length ? `<div><dt>Tags</dt><dd class="tags">${c.tags.map((t) => `<span>#${esc(t)}</span>`).join(' ')}</dd></div>` : ''}
${pillars.length ? `<div><dt>Pillars</dt><dd>${pillars.map((p) => esc(p.name)).join('<br>')}</dd></div>` : ''}
${extraMeta.map(([k, v]) => `<div><dt>${esc(metaKey(k))}</dt><dd>${Array.isArray(v) ? v.map((x) => inline(typeof x === 'object' ? JSON.stringify(x) : String(x), ctx)).join('<br>') : inline(String(v), ctx)}</dd></div>`).join('')}
<div><dt>File</dt><dd><a href="${LAB.SITE.repo}/blob/main/${esc(c.file)}" rel="noopener noreferrer"><code class="path">${esc(c.file)}</code></a></dd></div>
</dl>
${toc.length >= 3 ? `<nav class="toc" aria-label="On this page"><p>On this page</p><ol>${toc.map((h) => `<li class="l${h.level}"><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol></nav>` : ''}
</aside>
<div class="prose">
${html || '<p class="muted">Card without body text.</p>'}
${charts.length ? `<section class="card-charts"><h2 id="results">Results</h2><p class="muted small">Charts generated automatically from ${c.data.map((d) => `<code>${esc(d.file)}</code>`).join(', ')}. ${c.evidence === 'local-validation' ? '' : 'The card’s evidence level applies to the reading of these data.'}</p>${charts.join('')}</section>` : ''}
<section class="sources"><h2 id="sources">Sources</h2>
${c.sources.length ? `<ol>${c.sources.map((s) => `<li>${inline(s, ctx)}</li>`).join('')}</ol>` : '<p class="muted">No source recorded in the frontmatter. Treat this card’s claims as a gap until there is a primary source.</p>'}
</section>
${related.length || backlinks.length ? `<section class="related"><h2 id="related">Related</h2>${neighbourhood(c, related, backlinks)}<ul class="rel" style="margin-top:1rem">${related.map((r) => (r.missing ? `<li class="missing"><span class="cid">${esc(r.missing)}</span> <span class="muted">— card not published yet</span></li>` : `<li><a href="${r.url}">${seal(r.evidence)}<span class="cid">${esc(r.id)}</span> ${esc(r.title)}</a></li>`)).join('')}${backlinks.map((r) => `<li><a href="${r.url}">${seal(r.evidence)}<span class="cid">${esc(r.id)}</span> ${esc(r.title)} <span class="muted small">(cites this card)</span></a></li>`).join('')}</ul></section>` : ''}
</div>
</div>
</article>`;
  return layout({ title: `${c.id} · ${c.title}`, desc: c.summary, path: c.url, body, scripts: ['card'] });
}

function areaHref(a) {
  return { nature: '/explore/?area=nature', theory: '/explore/?area=theory', hypothesis: '/hypotheses/', literature: '/literature/#papers', oss: '/literature/#oss', simulation: '/experiments/#simulations', observatory: '/experiments/#observatory' }[a] || '/explore/';
}

function page404() {
  return layout({ title: 'Not found', path: '/404', body: `${pageHead({ eyebrow: '404 · gap', title: 'This trail has evaporated', lead: 'The page does not exist (yet). Maybe the card is being written right now — or it was renamed during the English translation.' })}<section><div class="wrap"><p class="ctas"><a class="btn" href="/explore/">Explore the archive</a><a class="btn ghost" href="/">Home</a></p></div></section>` });
}

// ------------------------------------------------------------------ assets: tiny bundler (models.js inlined into each entry)

function bundle(entry, { withModels = false } = {}) {
  const entryPath = path.join(SITE_DIR, 'src/js', entry + '.js');
  const src = fs.readFileSync(fs.existsSync(entryPath) ? entryPath : path.join(SITE_DIR, 'src/js/playground.js'), 'utf8');
  const shared = fs.readFileSync(path.join(SITE_DIR, 'src/js/ui.js'), 'utf8').replace(/^export /gm, '');
  const models = withModels ? fs.readFileSync(path.join(SITE_DIR, 'src/js/models.js'), 'utf8').replace(/^export /gm, '') : '';
  const unfold = entry === 'core' ? fs.readFileSync(path.join(SITE_DIR, 'src/js/unfold.js'), 'utf8') + '\n' : '';
  return `/* Norevia — ${entry}.js (built ${BUILD.date}). Source: site/src/js/. */\n${unfold}(() => {\n'use strict';\n${models}\n${entry === 'core' ? '' : shared}\n${src}\n})();\n`;
}

// Stigmergy U-curve for the playground, read from the simulation's own results file (English or legacy name).
function stigmergyCurve() {
  const f = ['results/sims/sim-stigmergy.json', 'results/sims/sim-estigmergia.json'].map((p) => path.join(ROOT, p)).find((p) => fs.existsSync(p));
  if (!f) return null;
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const cfg = j.results?.configs || [];
    const isStig = (x) => /^(estigmergia|stigmergy)$/.test(x.strategy) || /^(estigmergia|stigmergy)-e/.test(x.label || '');
    const isMsg = (x) => /mensagens|messages/.test(x.strategy || x.label || '');
    const isNone = (x) => /sem-coord|no-coord|none/.test(x.strategy || x.label || '');
    return [...new Set(cfg.map((x) => x.K))].map((K) => {
      const st = cfg.filter((x) => x.K === K && isStig(x)).sort((a, b) => a.epsilon - b.epsilon);
      const pts = st.map((x) => [x.epsilon, +x.time_to_solution.mean.toFixed(1), +x.time_to_solution.lo.toFixed(1), +x.time_to_solution.hi.toFixed(1)]);
      const best = pts.reduce((bi, p, i) => (p[1] < pts[bi][1] ? i : bi), 0);
      const msg = cfg.find((x) => x.K === K && isMsg(x)), none = cfg.find((x) => x.K === K && isNone(x));
      return { K, pts, bestIdx: best, messages: msg ? +msg.time_to_solution.mean.toFixed(1) : null, none: none ? +none.time_to_solution.mean.toFixed(1) : null, file: rel(f) };
    }).filter((c) => c.pts.length);
  } catch (e) { warn(rel(f), `stigmergy curve unreadable: ${e.message}`); return null; }
}

// ------------------------------------------------------------------ build

function main() {
  const cards = readCards();
  const byId = new Map(cards.map((c) => [c.id, c]));
  const byIdLower = new Map(cards.map((c) => [c.id.toLowerCase(), c]));
  for (const c of cards) for (const r of c.related) if (!byId.has(r)) warn(c.file, `related points to "${r}", which does not exist yet`);
  const datasets = readData(cards);
  const obsStatus = readObservatoryStatus();
  const git = gitInfo();
  const now = new Date();
  BUILD = {
    date: now.toISOString(),
    dateHuman: now.toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC',
    commit: git.commit,
    cards: cards.length,
  };
  // id regex: new ids + legacy ids (so Portuguese bodies still link to the renamed cards)
  const aliasIds = Object.keys(ID_MAP).filter((o) => byId.has(ID_MAP[o]));
  const ids = [...cards.map((c) => c.id), ...aliasIds].filter((id) => id.length >= 4).sort((a, b) => b.length - a.length).map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const ctx = {
    byId,
    resolveId: (id) => { const m = mapId(id); return byId.get(m) || byIdLower.get(String(m).toLowerCase()); },
    idRegex: ids.length ? new RegExp(`(^|[^\\w/#-])(${ids.join('|')})(?![\\w-])`, 'g') : null,
    resolvePath: (href, c) => {
      const clean = href.split('#')[0];
      if (!c || !clean) return null;
      const target = rel(path.resolve(path.dirname(c.abs), clean));
      const hit = cards.find((o) => o.file === target);
      return hit ? hit.url : null;
    },
    stigCurve: stigmergyCurve(),
  };
  CTX = ctx;
  const G = graphLayout(cards);

  // assets
  const h = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
  const css = fs.readFileSync(path.join(SITE_DIR, 'src/style.css'), 'utf8');
  const entries = { core: {}, graph: {}, board: {}, card: {}, 'play-vote': { withModels: true }, 'play-verifier': { withModels: true }, 'play-elastic': { withModels: true }, 'play-stigmergy': { withModels: true }, 'play-threshold': { withModels: true } };
  const jsBodies = {};
  // self-hosted typefaces: hashed file names (immutable cache), referenced from base.css placeholders
  const FONTS = {};
  for (const name of fs.readdirSync(path.join(SITE_DIR, 'src/fonts')).filter((n) => n.endsWith('.woff2'))) {
    const buf = fs.readFileSync(path.join(SITE_DIR, 'src/fonts', name));
    FONTS[name] = { url: `/assets/fonts/${name.replace(/\.woff2$/, '')}.${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10)}.woff2`, buf };
  }
  const baseCss = fs.readFileSync(path.join(SITE_DIR, 'src/base.css'), 'utf8').replace(/__FONT:([\w.-]+)__/g, (m, n) => { if (!FONTS[n]) throw new Error('font missing: ' + n); return FONTS[n].url; });
  const preload = ['Fraunces-normal-latin.woff2', 'HankenGrotesk-normal-latin.woff2'].map((n) => `<link rel="preload" href="${FONTS[n].url}" as="font" type="font/woff2" crossorigin>`).join('\n');
  ASSETS = { base: `/assets/base.${h(baseCss)}.css`, css: `/assets/site.${h(css)}.css`, js: {}, preload };
  for (const [name, opt] of Object.entries(entries)) {
    const body = bundle(name, opt);
    jsBodies[name] = body;
    ASSETS.js[name] = `/assets/${name}.${h(body)}.js`;
  }

  const files = new Map();
  const put = (p, body, type = 'text/html; charset=utf-8') => files.set(p, { type, body });
  put(ASSETS.base, baseCss, 'text/css; charset=utf-8');
  for (const { url, buf } of Object.values(FONTS)) put(url, buf, 'font/woff2');
  put(ASSETS.css, css, 'text/css; charset=utf-8');
  // landing page: standalone stylesheet + script (lib/home.mjs)
  const homeCss = fs.readFileSync(path.join(SITE_DIR, 'src/home.css'), 'utf8');
  const homeJs = `/* Norevia — home.js (built ${BUILD.date}). Source: site/src/js/unfold.js + home.js. */\n` + fs.readFileSync(path.join(SITE_DIR, 'src/js/unfold.js'), 'utf8') + '\n' + fs.readFileSync(path.join(SITE_DIR, 'src/js/home.js'), 'utf8');
  const HOME = { base: ASSETS.base, preload, css: `/assets/home.${h(homeCss)}.css`, js: `/assets/home.${h(homeJs)}.js` };
  put(HOME.css, homeCss, 'text/css; charset=utf-8');
  put(HOME.js, homeJs, 'text/javascript; charset=utf-8');
  for (const name of Object.keys(entries)) put(ASSETS.js[name], jsBodies[name], 'text/javascript; charset=utf-8');
  for (let k = 0; k < FORMATIONS; k++) put(`/assets/formation-${k}.svg`, formationFile(k + 1), 'image/svg+xml');
  put('/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#101312"/><g fill="none" stroke="#f4f3ee" stroke-width="1.4" opacity=".6"><circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="8"/></g><circle cx="20" cy="20" r="3.4" fill="#7fdcc2"/><g fill="#f4f3ee"><circle cx="34" cy="20" r="2.2"/><circle cx="10" cy="10" r="1.8"/><circle cx="26" cy="33" r="1.6"/></g></svg>`, 'image/svg+xml');
  put('/', pageLanding({ LAB, assets: HOME, build: BUILD }));
  put('/explore/', pageExplore(cards, G));
  put('/playgrounds/', pagePlaygrounds(ctx));
  for (const p of PLAYGROUNDS) put(`/playgrounds/${p.slug}/`, pagePlayground(p, ctx));
  put('/hypotheses/', pageHypotheses(cards));
  put('/experiments/', pageExperiments(cards, datasets, obsStatus));
  put('/literature/', pageLiterature(cards));
  put('/about/', pageAbout(cards, datasets));
  for (const c of cards) put(c.url, pageCard(c, cards, ctx));
  put('/method/', pageMethod(cards)); // last: includes warnings raised while rendering
  put('/404.html', page404());
  put('/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${LAB.SITE.url}/sitemap.xml\n`, 'text/plain; charset=utf-8');
  const htmlPaths = [...files.keys()].filter((p) => p.endsWith('/'));
  put('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${htmlPaths.map((p) => `<url><loc>${LAB.SITE.url}${p}</loc></url>`).join('\n')}\n</urlset>\n`, 'application/xml; charset=utf-8');
  put('/archive.json', JSON.stringify({
    project: LAB.SITE.name, publisher: LAB.SITE.company, description: LAB.SITE.full, generated: BUILD.date, commit: BUILD.commit || null,
    evidence_levels: EVIDENCE, hypothesis_statuses: STATUS,
    cards: sortCards(cards).map((c) => ({ id: c.id, legacy_id: c.rawId !== c.id ? c.rawId : undefined, title: c.title, area: c.area, evidence: c.evidence, status: c.status?.key || null, tags: c.tags, sources: c.sources, related: c.related, updated: c.updated || null, summary: c.summary, url: LAB.SITE.url + c.url, file: c.file, data: c.data.map((d) => d.file) })),
    datasets: datasets.map((d) => ({ file: d.file, card: d.owner?.id || null, charts: d.specs.length })),
    warnings,
  }, null, 1), 'application/json; charset=utf-8');

  fs.rmSync(DIST, { recursive: true, force: true });
  for (const [p, f] of files) {
    const out = p.endsWith('/') ? path.join(DIST, p, 'index.html') : path.join(DIST, p);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, f.body);
  }

  // deploy artefacts (Workers Static Assets): manifest + worker + _headers + step-1 code
  const HEADERS = [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  X-Frame-Options: DENY',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()',
    "  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    '  Strict-Transport-Security: max-age=31536000',
    `  X-Norevia-Build: ${BUILD.date}${BUILD.commit ? ' ' + BUILD.commit : ''}`,
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
  ].join('\n');
  const manifest = {};
  for (const [p] of files) {
    const out = p.endsWith('/') ? path.join(DIST, p, 'index.html') : path.join(DIST, p);
    const buf = fs.readFileSync(out);
    const relp = '/' + path.relative(DIST, out).split(path.sep).join('/');
    const ext = path.extname(out).slice(1);
    manifest[relp] = { hash: crypto.createHash('sha256').update(buf.toString('base64') + ext).digest('hex').slice(0, 32), size: buf.length };
  }
  // legacy paths -> 301 (served by the companion Worker only when no asset matches)
  const redirects = { ...PATH_REDIRECTS };
  for (const [o, n] of Object.entries(ID_MAP)) { const c = byId.get(n); if (c && slug(o) !== slug(n)) redirects[`/c/${slug(o)}/`] = c.url; }
  fs.rmSync(DEPLOY, { recursive: true, force: true });
  fs.mkdirSync(DEPLOY, { recursive: true });
  fs.writeFileSync(path.join(DEPLOY, 'manifest.json'), JSON.stringify(manifest, null, 1));
  fs.writeFileSync(path.join(DEPLOY, 'headers.txt'), HEADERS);
  fs.writeFileSync(path.join(DEPLOY, 'worker.js'), fs.readFileSync(path.join(SITE_DIR, 'src/worker.js'), 'utf8').replace('"__REDIRECTS__"', () => JSON.stringify(redirects)));
  const step1 = fs.readFileSync(path.join(SITE_DIR, 'src/step1-session.template.js'), 'utf8')
    .replace('"__MANIFEST__"', () => JSON.stringify(manifest))
    .replace('__BUILD_ID__', () => `${BUILD.date} ${BUILD.commit || ''}`.trim());
  fs.writeFileSync(path.join(DEPLOY, 'step1-session.js'), step1);
  const distBytes = Object.values(manifest).reduce((s, m) => s + m.size, 0);
  const legacy = cards.filter((c) => c.rawId !== c.id || /^(fenomeno|relato|implementacao|hipotese|validacao|lacuna)/.test(norm(c.fm.evidence || ''))).length;
  fs.writeFileSync(path.join(SITE_DIR, 'build-report.json'), JSON.stringify({ generated: BUILD.date, commit: BUILD.commit || null, cards: cards.length, legacy_cards: legacy, pages: htmlPaths.length, files: files.size, dist_bytes: distBytes, datasets: datasets.length, edges: G.edges.length, warnings }, null, 2));

  const byArea = Object.keys(AREAS).map((a) => `${a}=${cards.filter((c) => c.area === a).length}`).join(' ');
  console.log(`norevia build ok · ${cards.length} cards (${byArea}) · ${legacy} still on legacy slugs · ${datasets.length} datasets · ${htmlPaths.length} HTML pages · ${files.size} files`);
  console.log(`dist ${(distBytes / 1024).toFixed(0)} KB in ${Object.keys(manifest).length} files · manifest ${(JSON.stringify(manifest).length / 1024).toFixed(1)} KB · ${warnings.length} warning(s) · ${Date.now() - t0} ms`);
  if (warnings.length) for (const w of warnings.slice(0, 30)) console.log(`  ! ${w.file}: ${w.msg}`);
}

main();
