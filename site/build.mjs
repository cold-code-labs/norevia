#!/usr/bin/env node
// Norevia Labs — gerador do acervo vivo (zero dependências; Node >= 20).
//
//   node site/build.mjs   -> gera site/dist/ (estático) e site/deploy/ (manifest, worker, headers, step1-session.js)
//
// Lê os cartões Markdown (frontmatter) do repositório e os resultados (JSON/JSONL/CSV),
// e produz páginas estáticas. Funciona com pastas vazias ou parciais.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { esc, slug, norm, parseFrontmatter, markdown, inline, plain } from './lib/text.mjs';
import { parseDataFile, chartSpecs, renderChart, scalarMetrics, resultSummary, fmt } from './lib/charts.mjs';
import * as LAB from './lab.config.mjs';

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
];
const DATA_DIRS = ['results/sims', 'results/observatory'];
// Dados brutos/operacionais não viram gráfico (execuções individuais, ledgers, status, pré-registros).
const DATA_SKIP = [/(^|\/)raw\//, /(^|\/)runs?\//, /ledger/i, /(^|\/)status[-_.]/i, /(^|\/)runs[-_]/i, /preregistro/i, /\.tmp\//];

export const AREAS = {
  nature: { label: 'Natureza', plural: 'Mecanismos naturais', prefix: 'nat-' },
  theory: { label: 'Teoria', plural: 'Teoria', prefix: 'th-' },
  hypothesis: { label: 'Hipótese', plural: 'Hipóteses', prefix: 'H-' },
  literature: { label: 'Literatura', plural: 'Literatura', prefix: 'lit-' },
  oss: { label: 'Open source', plural: 'Open source', prefix: 'oss-' },
  simulation: { label: 'Simulação', plural: 'Simulações', prefix: 'sim-' },
  observatory: { label: 'Observatory', plural: 'Observatory', prefix: 'obs-' },
};
const AREA_ALIASES = {
  natureza: 'nature', natural: 'nature', theory: 'theory', teoria: 'theory', hypotheses: 'hypothesis', hipotese: 'hypothesis', hipoteses: 'hypothesis', hypothesis: 'hypothesis',
  literatura: 'literature', paper: 'literature', papers: 'literature', open_source: 'oss', 'open-source': 'oss', sims: 'simulation', sim: 'simulation', simulacao: 'simulation', simulacoes: 'simulation', simulation: 'simulation', benchmark: 'observatory', observatorio: 'observatory',
};

export const EVIDENCE = {
  'fenomeno-natural': { label: 'Fenômeno natural', short: 'Natureza', desc: 'Mecanismo descrito em fonte primária de biologia ou física. Inspira mecanismos; analogia não prova eficácia em LLMs.' },
  'relato-autores': { label: 'Relato dos autores', short: 'Autores', desc: 'Resultado publicado por terceiros e ainda não reproduzido aqui. Não é validação local.' },
  'implementacao-observada': { label: 'Implementação observada', short: 'Código', desc: 'Código open source inspecionado diretamente, com versão ou commit registrado.' },
  hipotese: { label: 'Hipótese', short: 'Hipótese', desc: 'Proposta falsificável, com critério de refutação, ainda sem teste local.' },
  'validacao-local': { label: 'Validação local', short: 'Validado', desc: 'Resultado produzido neste repositório, com script, dados e seed reproduzíveis.' },
  lacuna: { label: 'Lacuna', short: 'Lacuna', desc: 'O que ainda não sabemos — ou uma fonte que não conseguimos abrir e verificar.' },
};
const EV_ALIASES = {
  'fenomeno-natural': 'fenomeno-natural', fenomeno: 'fenomeno-natural', natural: 'fenomeno-natural',
  'relato-autores': 'relato-autores', 'relato-dos-autores': 'relato-autores', relato: 'relato-autores', autores: 'relato-autores',
  'implementacao-observada': 'implementacao-observada', implementacao: 'implementacao-observada', codigo: 'implementacao-observada',
  hipotese: 'hipotese', hipoteses: 'hipotese', hypothesis: 'hipotese',
  'validacao-local': 'validacao-local', validacao: 'validacao-local', validado: 'validacao-local',
  lacuna: 'lacuna', gap: 'lacuna', lacunas: 'lacuna',
};
const STATUS = {
  proposta: ['Proposta', 'open'], aberta: ['Proposta', 'open'], proposed: ['Proposta', 'open'], open: ['Proposta', 'open'], rascunho: ['Rascunho', 'open'], draft: ['Rascunho', 'open'],
  'em-teste': ['Em teste', 'testing'], testando: ['Em teste', 'testing'], testing: ['Em teste', 'testing'], 'em-andamento': ['Em teste', 'testing'], planejada: ['Teste planejado', 'testing'], 'teste-planejado': ['Teste planejado', 'testing'],
  suportada: ['Suportada (local)', 'good'], corroborada: ['Suportada (local)', 'good'], supported: ['Suportada (local)', 'good'], 'parcialmente-suportada': ['Parcialmente suportada', 'partial'], parcial: ['Parcialmente suportada', 'partial'],
  refutada: ['Refutada', 'bad'], 'suportada-preliminar': ['Suportada (preliminar)', 'good'], 'refutada-preliminar': ['Refutada (preliminar)', 'bad'], refuted: ['Refutada', 'bad'], falsificada: ['Refutada', 'bad'],
  inconclusiva: ['Inconclusiva', 'partial'], inconclusive: ['Inconclusiva', 'partial'],
  arquivada: ['Arquivada', 'muted'], abandonada: ['Arquivada', 'muted'], descartada: ['Arquivada', 'muted'],
};

const warnings = [];
const warn = (file, msg) => warnings.push({ file, msg });

// ------------------------------------------------------------------ leitura

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
    return [s.title || s.titulo || s.name, s.authors || s.autores, s.year || s.ano, s.venue, s.doi ? `doi:${s.doi}` : '', s.arxiv ? `arXiv:${s.arxiv}` : '', s.url, s.commit ? `commit ${s.commit}` : '', s.version || s.versao ? `versão ${s.version || s.versao}` : '', s.note || s.nota]
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
      try { text = fs.readFileSync(file, 'utf8'); } catch { warn(r, 'não foi possível ler'); continue; }
      const { fm, body } = parseFrontmatter(text);
      if (!fm) { warn(r, 'sem frontmatter — ignorado'); continue; }
      if (fm.__error) { warn(r, `frontmatter inválido: ${fm.__error}`); continue; }
      let id = String(fm.id ?? '').trim();
      if (!id) { id = path.basename(file).replace(/\.[^.]+$/, ''); warn(r, `sem id — usando "${id}"`); }
      if (seen.has(id)) { warn(r, `id duplicado "${id}" (já em ${seen.get(id)}) — ignorado`); continue; }
      seen.set(id, r);
      let area = norm(fm.area || '');
      area = AREA_ALIASES[area] || area;
      if (!AREAS[area]) { if (fm.area) warn(r, `área desconhecida "${fm.area}" — usando ${src.area}`); area = src.area; }
      const evRaw = norm(fm.evidence || fm.evidencia || '');
      let evidence = EV_ALIASES[evRaw] || null;
      if (!evidence) { warn(r, fm.evidence ? `nível de evidência desconhecido "${fm.evidence}"` : 'sem nível de evidência'); evidence = 'indefinido'; }
      let title = String(fm.title || fm.titulo || '').trim();
      if (!title) { const h = body.match(/^#\s+(.+)$/m); title = h ? h[1].trim() : id; warn(r, 'sem title'); }
      let summary = String(fm.summary || fm.resumo || '').trim();
      if (!summary) { summary = plain(body.replace(/^#.*$/gm, ''), 200); warn(r, 'sem summary'); }
      const statusRaw = fm.status != null ? String(fm.status) : '';
      const st = STATUS[norm(statusRaw)] || STATUS[norm(statusRaw).split('-')[0]];
      const sources = asList(fm.sources ?? fm.fontes).map(srcText);
      const card = {
        id,
        title,
        area,
        evidence,
        tags: asList(fm.tags).map((t) => norm(t)).filter(Boolean),
        sources,
        related: asList(fm.related ?? fm.relacionados).map(String),
        updated: fm.updated ? String(fm.updated) : '',
        summary,
        status: statusRaw ? { raw: statusRaw, label: st ? st[0] : statusRaw, kind: st ? st[1] : 'other' } : null,
        fm,
        body,
        file: r,
        abs: file,
        url: '',
        data: [],
      };
      if (evidence === 'relato-autores' && !sources.length) warn(r, 'relato dos autores sem fonte registrada');
      if (area === 'hypothesis' && !statusRaw) warn(r, 'hipótese sem status');
      cards.push(card);
    }
  }
  // URLs estáveis por id
  const used = new Set();
  for (const c of cards) {
    let s = slug(c.id) || 'cartao';
    while (used.has(s)) s += '-2';
    used.add(s);
    c.url = `/c/${s}/`;
  }
  return cards;
}

function readData(cards) {
  const files = DATA_DIRS.flatMap((d) => walk(d, ['.json', '.jsonl', '.ndjson', '.csv', '.tsv'])).filter((f) => !DATA_SKIP.some((re) => re.test(rel(f))));
  const datasets = [];
  for (const f of files) {
    const r = rel(f);
    let size = 0;
    try { size = fs.statSync(f).size; } catch {}
    if (size > 8 * 1024 * 1024) { warn(r, 'arquivo de dados > 8 MB — não plotado'); datasets.push({ file: r, abs: f, error: 'grande demais', specs: [], metrics: [] }); continue; }
    let data;
    try { data = parseDataFile(fs.readFileSync(f, 'utf8'), path.extname(f).toLowerCase()); } catch (e) { warn(r, `dados ilegíveis: ${e.message}`); datasets.push({ file: r, abs: f, error: 'ilegível', specs: [], metrics: [] }); continue; }
    datasets.push({ file: r, abs: f, data, specs: [], metrics: scalarMetrics(data), summary: resultSummary(data), owner: null });
  }
  // associação dados -> cartão
  const byFile = new Map(datasets.map((d) => [d.file, d]));
  for (const c of cards) {
    const explicit = asList(c.fm.data ?? c.fm.results ?? c.fm.dados ?? c.fm.resultados).map(String);
    for (const p of explicit) {
      const cand = [path.join(path.dirname(c.abs), p), path.join(ROOT, p)].map(rel);
      const ds = cand.map((x) => byFile.get(x)).find(Boolean);
      if (ds) { if (!ds.owner) ds.owner = c; c.data.push(ds); }
      else warn(c.file, `arquivo de dados não encontrado: ${p}`);
    }
  }
  for (const c of cards) {
    if (c.area !== 'simulation' && c.area !== 'observatory') continue;
    const stem = path.basename(c.file).replace(/\.[^.]+$/, '').toLowerCase();
    const cdir = path.dirname(c.file);
    const sameDirCards = cards.filter((o) => path.dirname(o.file) === cdir).length;
    for (const ds of datasets) {
      if (ds.owner) continue;
      const dstem = path.basename(ds.file).replace(/\.[^.]+$/, '').toLowerCase();
      const ddir = path.dirname(ds.file);
      const match = dstem.startsWith(c.id.toLowerCase()) || dstem.startsWith(stem) ||
        (ddir === cdir && sameDirCards === 1 && cdir !== 'results/sims' && cdir !== 'results/observatory') ||
        (ddir.startsWith(cdir + '/') && sameDirCards === 1 && cdir !== 'results/sims' && cdir !== 'results/observatory');
      if (match) { ds.owner = c; c.data.push(ds); }
    }
  }
  for (const ds of datasets) {
    if (!ds.data) continue;
    const hint = ds.owner?.fm.chart && typeof ds.owner.fm.chart === 'object' ? ds.owner.fm.chart : {};
    try { ds.specs = chartSpecs(ds.data, hint); } catch (e) { warn(ds.file, `falha ao extrair séries: ${e.message}`); }
  }
  return datasets;
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

// ------------------------------------------------------------------ componentes

const SHAPES = {
  'fenomeno-natural': '<path d="M7 1.2l5 2.9v5.8l-5 2.9-5-2.9V4.1z"/>',
  'relato-autores': '<rect x="2" y="2" width="10" height="10" rx="1.5"/>',
  'implementacao-observada': '<path d="M7 1.2l5.8 5.8L7 12.8 1.2 7z"/>',
  hipotese: '<path d="M7 1.6l5.6 10H1.4z"/>',
  'validacao-local': '<circle cx="7" cy="7" r="5.6"/><path class="ck" d="M4.4 7.2l1.8 1.8 3.5-3.7"/>',
  lacuna: '<circle class="ring" cx="7" cy="7" r="5"/>',
  indefinido: '<circle class="ring" cx="7" cy="7" r="5"/><path class="ck" d="M7 4.5v3M7 9.4v.1"/>',
};
const evLabel = (k) => (EVIDENCE[k] ? EVIDENCE[k].label : 'Sem nível declarado');
const icon = (k) => `<svg class="ico" viewBox="0 0 14 14" aria-hidden="true" focusable="false">${SHAPES[k] || SHAPES.indefinido}</svg>`;
const seal = (k, extra = '') => `<span class="seal ev-${k}${extra}" title="${esc(EVIDENCE[k]?.desc || 'Cartão sem nível de evidência válido')}">${icon(k)}<span>${esc(evLabel(k))}</span></span>`;
const areaChip = (a) => `<span class="area area-${a}">${esc(AREAS[a]?.label || a)}</span>`;
const statusChip = (s) => (s ? `<span class="status st-${s.kind}">${esc(s.label)}</span>` : '');

const LOGO = `<svg class="logo" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><ellipse cx="20" cy="20" rx="17" ry="7.5" transform="rotate(-24 20 20)"/><ellipse cx="20" cy="20" rx="11" ry="16" transform="rotate(32 20 20)"/><circle class="core" cx="20" cy="20" r="3.2"/><circle class="p1" cx="34.8" cy="13.6" r="2"/><circle class="p2" cx="11.6" cy="5.9" r="1.6"/><circle class="p3" cx="27.4" cy="34.2" r="1.4"/></svg>`;

const NAV = [
  ['/', 'Início'],
  ['/conceitos/', 'Conceitos'],
  ['/hipoteses/', 'Hipóteses'],
  ['/experimentos/', 'Experimentos'],
  ['/literatura/', 'Literatura & OSS'],
  ['/metodo/', 'Método'],
];

let ASSETS = { css: '', js: '' };
let BUILD = {};

function layout({ title, desc, path: p, body, cls = '' }) {
  const full = p === '/' ? `${LAB.SITE.name} — ${LAB.SITE.kind}` : `${title} · ${LAB.SITE.name}`;
  const section = NAV.slice(1).find(([href]) => p.startsWith(href))?.[0] || (p.startsWith('/c/') ? null : '/');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc || LAB.SITE.description)}">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#06100d">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc || LAB.SITE.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${LAB.SITE.url}${p}">
<link rel="canonical" href="${LAB.SITE.url}${p}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${ASSETS.css}">
<script src="${ASSETS.js}" defer></script>
</head>
<body class="${cls}">
<a class="skip" href="#main">Pular para o conteúdo</a>
<header class="top">
<div class="wrap top-in">
<a class="brand" href="/" aria-label="Norevia Labs — início">${LOGO}<span class="wm">NOREVIA</span><span class="wm-sub">LABS</span></a>
<nav aria-label="Principal"><ul>${NAV.map(([href, label]) => `<li><a href="${href}"${href === section && !p.startsWith('/c/') ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul></nav>
</div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="foot">
<div class="wrap foot-in">
<div><p class="foot-brand">${LOGO}<span><strong>Norevia Labs</strong> · ${esc(LAB.SITE.kind)}</span></p>
<p class="muted">${esc(LAB.SITE.tagline)}</p></div>
<div class="foot-meta">
<p>Acervo gerado de <code>norevia/</code> em ${esc(BUILD.dateHuman)}${BUILD.commit ? ` · commit <code>${esc(BUILD.commit)}</code>` : ''} · ${BUILD.cards} cartões.</p>
<p>Conteúdo de pesquisa CC BY 4.0 · código MIT · sem rastreadores, cookies ou fontes externas.</p>
<p><a href="/acervo.json">Dados abertos (acervo.json)</a> · <a href="/metodo/">Disciplina de evidência</a></p>
</div>
</div>
</footer>
</body>
</html>
`;
}

function cardItem(c, opts = {}) {
  const dataAttrs = ` data-area="${c.area}" data-ev="${c.evidence}" data-text="${esc([c.id, c.title, c.summary, c.tags.join(' ')].join(' ').toLowerCase())}"`;
  return `<li class="card-item ev-${c.evidence}"${dataAttrs}>
<a class="card-link" href="${c.url}">
<span class="card-top">${seal(c.evidence)}${opts.hideArea ? '' : areaChip(c.area)}${statusChip(c.status)}</span>
<span class="card-title"><span class="cid">${esc(c.id)}</span> ${esc(c.title)}</span>
<span class="card-sum">${esc(c.summary)}</span>
${c.tags.length ? `<span class="card-tags">${c.tags.slice(0, 5).map((t) => `<span>#${esc(t)}</span>`).join('')}</span>` : ''}
</a>
</li>`;
}

function cardList(list, opts = {}) {
  if (!list.length) return `<p class="empty">${opts.empty || 'Nenhum cartão ainda.'}</p>`;
  return `<ul class="cards${opts.cls ? ' ' + opts.cls : ''}"${opts.id ? ` id="${opts.id}"` : ''}>${list.map((c) => cardItem(c, opts)).join('')}</ul>`;
}

function pageHead({ eyebrow, title, lead, extra = '' }) {
  return `<section class="phead"><div class="wrap">${orbitsSvg('phead-orbit')}<p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}${extra}</div></section>`;
}

// motivo generativo determinístico (SVG estático; o canvas da home anima por cima)
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function orbitsSvg(cls, seed = 7) {
  const r = rng(seed);
  const rings = [];
  for (let k = 0; k < 5; k++) {
    const rx = 90 + k * 46, ry = 26 + k * 15, rot = -18 + k * 9;
    rings.push(`<ellipse cx="300" cy="150" rx="${rx}" ry="${ry}" transform="rotate(${rot} 300 150)"/>`);
  }
  const dots = [];
  for (let k = 0; k < 46; k++) {
    const ring = k % 5, a = r() * Math.PI * 2;
    const rx = 90 + ring * 46, ry = 26 + ring * 15, rot = ((-18 + ring * 9) * Math.PI) / 180;
    const x0 = Math.cos(a) * rx, y0 = Math.sin(a) * ry;
    const x = 300 + x0 * Math.cos(rot) - y0 * Math.sin(rot), y = 150 + x0 * Math.sin(rot) + y0 * Math.cos(rot);
    dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + r() * 2.2).toFixed(1)}" class="d${k % 3}"/>`);
  }
  return `<svg class="${cls}" viewBox="0 0 600 300" aria-hidden="true" focusable="false"><g class="rings">${rings.join('')}</g><g class="dots">${dots.join('')}<circle cx="300" cy="150" r="5" class="core"/></g></svg>`;
}

// barra segmentada da distribuição de evidência
function evidenceBar(cards) {
  const keys = [...Object.keys(EVIDENCE), 'indefinido'];
  const counts = keys.map((k) => [k, cards.filter((c) => c.evidence === k).length]).filter(([, n]) => n > 0);
  const total = cards.length;
  if (!total) return `<div class="evbar empty-bar"><p class="muted">Distribuição por nível de evidência aparece aqui quando os primeiros cartões chegarem.</p></div>`;
  let x = 0;
  const W = 1000;
  const gap = 4;
  const segs = counts.map(([k, n]) => {
    const w = (n / total) * W;
    const seg = `<rect class="seg ev-${k}" x="${(x + (x ? gap / 2 : 0)).toFixed(1)}" y="0" width="${Math.max(2, w - (x ? gap / 2 : 0) - (x + w < W - 0.5 ? gap / 2 : 0)).toFixed(1)}" height="28" rx="4"><title>${esc(evLabel(k))}: ${n} (${Math.round((n / total) * 100)}%)</title></rect>`;
    x += w;
    return seg;
  });
  return `<figure class="evbar"><figcaption class="sr">Distribuição dos ${total} cartões por nível de evidência</figcaption>
<svg viewBox="0 0 ${W} 28" preserveAspectRatio="none" role="img" aria-label="${esc(counts.map(([k, n]) => `${evLabel(k)}: ${n}`).join('; '))}">${segs.join('')}</svg>
<ul class="evlegend">${counts.map(([k, n]) => `<li>${seal(k)}<span class="n">${n}</span><span class="pct">${Math.round((n / total) * 100)}%</span></li>`).join('')}</ul></figure>`;
}

// constelação: cartões agrupados por área em órbitas; arestas = related
function constellation(cards) {
  const W = 1000, H = 560, cx = W / 2, cy = H / 2;
  const areas = Object.keys(AREAS);
  const anchors = {};
  areas.forEach((a, k) => {
    const ang = (k / areas.length) * Math.PI * 2 - Math.PI / 2;
    anchors[a] = { x: cx + Math.cos(ang) * 300, y: cy + Math.sin(ang) * 170 };
  });
  const r = rng(42);
  const nodes = cards.map((c) => ({ c, x: anchors[c.area].x + (r() - 0.5) * 60, y: anchors[c.area].y + (r() - 0.5) * 60, vx: 0, vy: 0 }));
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
  }
  for (let it = 0; it < 260; it++) {
    const alpha = 1 - it / 260;
    for (const n of nodes) {
      const a = anchors[n.c.area];
      n.vx += (a.x - n.x) * 0.012 * alpha;
      n.vy += (a.y - n.y) * 0.012 * alpha;
    }
    for (const [p, q] of edges) {
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
      const f = ((d - 120) / d) * 0.004 * alpha;
      p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f;
    }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const p = nodes[i], q = nodes[j];
      const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy || 1;
      if (d2 > 6400) continue;
      const f = (180 / d2) * alpha;
      p.vx -= dx * f; p.vy -= dy * f; q.vx += dx * f; q.vy += dy * f;
    }
    for (const n of nodes) {
      n.x = Math.max(24, Math.min(W - 24, n.x + n.vx));
      n.y = Math.max(24, Math.min(H - 24, n.y + n.vy));
      n.vx *= 0.6; n.vy *= 0.6;
    }
  }
  const rings = [1, 0.72, 0.44].map((s) => `<ellipse class="orb" cx="${cx}" cy="${cy}" rx="${(380 * s).toFixed(0)}" ry="${(228 * s).toFixed(0)}"/>`).join('');
  const labels = areas.map((a) => {
    const n = cards.filter((c) => c.area === a).length;
    const an = anchors[a];
    const ang = Math.atan2(an.y - cy, an.x - cx);
    const lx = cx + Math.cos(ang) * 455, ly = cy + Math.sin(ang) * 262 + 4;
    const anchor = Math.abs(Math.cos(ang)) < 0.3 ? 'middle' : Math.cos(ang) > 0 ? 'end' : 'start';
    return `<text class="alabel" x="${Math.max(8, Math.min(W - 8, lx)).toFixed(0)}" y="${Math.max(18, Math.min(H - 8, ly)).toFixed(0)}" text-anchor="${anchor}">${esc(AREAS[a].plural)} · ${n}</text>`;
  }).join('');
  const shape = (k, x, y) => {
    const s = 9;
    switch (k) {
      case 'fenomeno-natural': return `<path d="M${x},${y - s}l${s * 0.87},${s / 2}v${s}l${-s * 0.87},${s / 2}l${-s * 0.87},${-s / 2}v${-s}z"/>`;
      case 'relato-autores': return `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="2"/>`;
      case 'implementacao-observada': return `<path d="M${x},${y - 9}l9,9l-9,9l-9,-9z"/>`;
      case 'hipotese': return `<path d="M${x},${y - 9}l9,15h-18z"/>`;
      case 'validacao-local': return `<circle cx="${x}" cy="${y}" r="8"/>`;
      default: return `<circle class="hollow" cx="${x}" cy="${y}" r="7"/>`;
    }
  };
  const nodeSvg = nodes.map((n) => {
    const x = n.x.toFixed(1), y = n.y.toFixed(1);
    return `<a href="${n.c.url}" class="node ev-${n.c.evidence}" data-area="${n.c.area}" data-ev="${n.c.evidence}" aria-label="${esc(`${n.c.id}: ${n.c.title} — ${evLabel(n.c.evidence)}`)}"><title>${esc(`${n.c.id} · ${n.c.title} (${evLabel(n.c.evidence)})`)}</title><circle class="halo" cx="${x}" cy="${y}" r="16"/>${shape(n.c.evidence, +x, +y)}</a>`;
  }).join('');
  const edgeSvg = edges.map(([p, q]) => `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}"/>`).join('');
  return `<figure class="constellation"><svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Mapa do acervo: ${cards.length} cartões agrupados por área; linhas indicam relações declaradas">${rings}<g class="edges">${edgeSvg}</g>${labels}<g class="nodes">${nodeSvg}</g>${cards.length ? '' : `<text class="alabel big" x="${cx}" y="${cy + 6}" text-anchor="middle">Aguardando os primeiros cartões</text>`}</svg>
<figcaption class="muted">Cada ponto é um cartão; a forma e a cor indicam o nível de evidência; as linhas são relações declaradas em <code>related</code>. Posições são só organização visual — não medem nada.</figcaption></figure>`;
}

function filters(cards, { areas = true } = {}) {
  const areaKeys = Object.keys(AREAS).filter((a) => cards.some((c) => c.area === a));
  const evKeys = [...Object.keys(EVIDENCE), 'indefinido'].filter((k) => cards.some((c) => c.evidence === k));
  return `<form class="filters" data-filters role="search" aria-label="Filtrar cartões" hidden>
<label class="search"><span class="sr">Buscar</span><input type="search" name="q" placeholder="Buscar por título, id ou tag…" autocomplete="off"></label>
${areas && areaKeys.length > 1 ? `<fieldset><legend>Área</legend>${areaKeys.map((a) => `<button type="button" class="chip" data-filter="area" data-value="${a}" aria-pressed="false">${esc(AREAS[a].plural)} <span class="n">${cards.filter((c) => c.area === a).length}</span></button>`).join('')}</fieldset>` : ''}
${evKeys.length ? `<fieldset><legend>Evidência</legend>${evKeys.map((k) => `<button type="button" class="chip chip-ev ev-${k}" data-filter="ev" data-value="${k}" aria-pressed="false">${icon(k)}${esc(evLabel(k))} <span class="n">${cards.filter((c) => c.evidence === k).length}</span></button>`).join('')}</fieldset>` : ''}
<p class="fcount" aria-live="polite"></p>
</form>`;
}

// ------------------------------------------------------------------ páginas

function sortCards(list) {
  return [...list].sort((a, b) => a.id.localeCompare(b.id, 'pt', { numeric: true }));
}
function recent(list, n) {
  return [...list].sort((a, b) => (b.updated || '').localeCompare(a.updated || '') || fs.statSync(b.abs).mtimeMs - fs.statSync(a.abs).mtimeMs).slice(0, n);
}
function matchTags(cards, tags) {
  const set = new Set(tags.map(norm));
  return cards.filter((c) => c.tags.some((t) => set.has(t) || [...set].some((s) => t.includes(s))));
}

function pageHome(cards, datasets) {
  const n = (a) => cards.filter((c) => c.area === a).length;
  const hyp = n('hypothesis');
  const exps = n('simulation') + n('observatory');
  const srcCount = new Set(cards.flatMap((c) => c.sources)).size;
  const latest = recent(cards, 6);
  const body = `
<section class="hero">
<canvas class="field" aria-hidden="true"></canvas>
${orbitsSvg('hero-orbit', 11)}
<div class="wrap hero-in">
<p class="eyebrow">${esc(LAB.SITE.kind)}</p>
<h1 class="wordmark"><span>NOREVIA</span> <span class="labs">LABS</span></h1>
<p class="hero-q">Quando, como e por que múltiplos agentes computacionais devem cooperar — em vez de concentrar recursos em um único agente?</p>
<p class="tagline" lang="en">${esc(LAB.SITE.tagline)}</p>
<p class="ctas"><a class="btn" href="/conceitos/">Explorar o acervo</a><a class="btn ghost" href="/metodo/">Como lemos evidência</a></p>
</div>
<p class="field-note wrap">Motivo generativo: agentes simples seguem e reforçam trilhas que evaporam (estigmergia). É ilustração — não é evidência.</p>
</section>

<section class="stats" aria-label="Estado do acervo">
<div class="wrap">
<dl class="statrow">
<div><dt>Cartões no acervo</dt><dd>${cards.length}</dd></div>
<div><dt>Hipóteses registradas</dt><dd>${hyp}</dd></div>
<div><dt>Experimentos</dt><dd>${exps}</dd></div>
<div><dt>Conjuntos de dados</dt><dd>${datasets.length}</dd></div>
<div><dt>Fontes citadas</dt><dd>${srcCount}</dd></div>
</dl>
${evidenceBar(cards)}
</div>
</section>

<section class="manifesto">
<div class="wrap narrow">
<p class="eyebrow">Manifesto</p>
${LAB.MANIFESTO.map((p, k) => `<p${k === 0 ? ' class="big"' : ''}>${esc(p)}</p>`).join('')}
</div>
</section>

<section class="question">
<div class="wrap">
<p class="eyebrow">Pergunta central</p>
<blockquote class="q"><p>${esc(LAB.QUESTION)}</p></blockquote>
<ol class="subq">${LAB.SUBQUESTIONS.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>
<p class="muted narrow">Não presumimos que swarms vencem. Procuramos fronteiras previsíveis de eficiência entre capacidade individual, esforço de raciocínio, especialização, comunicação, custo e qualidade.</p>
</div>
</section>

<section class="pillars">
<div class="wrap">
<p class="eyebrow">Pilares</p>
<h2>Cinco perguntas, um programa de pesquisa</h2>
<ol class="pillar-grid">
${LAB.PILLARS.map((p, k) => {
  const linked = matchTags(cards, p.match);
  return `<li class="pillar"><span class="pnum">${String(k + 1).padStart(2, '0')}</span><h3>${esc(p.name)}</h3><p class="pq">${esc(p.question)}</p><p class="prole">${esc(p.role)}</p>
<p class="plinks">${linked.length ? `${linked.length} cartão(ões): ${linked.slice(0, 3).map((c) => `<a href="${c.url}">${esc(c.id)}</a>`).join(', ')}${linked.length > 3 ? '…' : ''}` : '<span class="muted">Sem cartões ligados ainda.</span>'}</p></li>`;
}).join('')}
</ol>
</div>
</section>

<section class="evidence">
<div class="wrap">
<p class="eyebrow">Como lemos evidência</p>
<h2>Todo cartão declara o quanto sabemos</h2>
<ul class="ev-grid">
${Object.entries(EVIDENCE).map(([k, e]) => `<li>${seal(k)}<p>${esc(e.desc)}</p><p class="n">${cards.filter((c) => c.evidence === k).length} cartão(ões)</p></li>`).join('')}
</ul>
<ul class="rules">${LAB.RULES.slice(0, 3).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
<p><a class="more" href="/metodo/">Método completo e o que ainda falta provar →</a></p>
</div>
</section>

<section class="families">
<div class="wrap">
<p class="eyebrow">Natureza como fonte de hipóteses</p>
<h2>Três famílias de sistemas naturais</h2>
<ul class="fam-grid">
${LAB.FAMILIES.map((f) => {
  const linked = matchTags(cards.filter((c) => ['nature', 'theory', 'hypothesis'].includes(c.area)), f.match);
  return `<li><h3>${esc(f.name)}</h3><p>${esc(f.principle)}</p><p class="muted">Aplicação potencial: ${esc(f.use)}</p><p class="plinks">${linked.length ? linked.slice(0, 4).map((c) => `<a href="${c.url}">${esc(c.title)}</a>`).join(' · ') : '<span class="muted">Cartões em preparação.</span>'}</p></li>`;
}).join('')}
</ul>
</div>
</section>

<section class="latest">
<div class="wrap">
<p class="eyebrow">Acervo vivo</p>
<h2>Entradas recentes</h2>
${cardList(latest, { empty: 'Os agentes de pesquisa estão escrevendo os primeiros cartões. Volte em breve.' })}
<p><a class="more" href="/conceitos/">Ver todo o acervo →</a></p>
</div>
</section>`;
  return layout({ title: 'Início', path: '/', body, cls: 'home' });
}

function pageConceitos(cards) {
  const nature = cards.filter((c) => c.area === 'nature');
  const body = `${pageHead({
    eyebrow: 'Conceitos & mecanismos',
    title: 'Mapa do acervo',
    lead: 'Mecanismos naturais, formalização teórica, hipóteses, fontes e experimentos — cada um com seu selo de evidência. Filtre por área e pelo quanto sabemos.',
  })}
<section><div class="wrap">
${constellation(cards)}
</div></section>
<section><div class="wrap">
<h2 id="natureza">Natureza: mecanismos candidatos</h2>
<p class="muted narrow">Formigas e colmeias, corpo humano, sistemas celestes. Cada mecanismo aponta um análogo de engenharia e uma hipótese testável — e seus limites.</p>
${cardList(sortCards(nature), { hideArea: true, empty: 'Nenhum mecanismo natural catalogado ainda.' })}
</div></section>
<section><div class="wrap">
<h2 id="acervo">Acervo completo</h2>
${filters(cards)}
${cardList(sortCards(cards), { id: 'all-cards', cls: 'filterable', empty: 'Nenhum cartão ainda. O gerador está pronto e vai publicar assim que os primeiros chegarem.' })}
<p class="empty filtered-empty" hidden>Nenhum cartão corresponde aos filtros.</p>
</div></section>`;
  return layout({ title: 'Conceitos', desc: 'Mapa de mecanismos e conceitos da Norevia Labs, com filtros por área e nível de evidência.', path: '/conceitos/', body });
}

function pageHipoteses(cards) {
  const hyps = sortCards(cards.filter((c) => c.area === 'hypothesis'));
  const kinds = ['open', 'testing', 'partial', 'good', 'bad', 'muted', 'other'];
  const kindLabel = { open: 'Propostas', testing: 'Em teste', partial: 'Parciais / inconclusivas', good: 'Suportadas localmente', bad: 'Refutadas', muted: 'Arquivadas', other: 'Outro status' };
  const counts = kinds.map((k) => [k, hyps.filter((h) => (h.status?.kind || 'other') === k).length]).filter(([, n]) => n);
  const expsFor = (h) => cards.filter((c) => ['simulation', 'observatory'].includes(c.area) && (c.related.includes(h.id) || h.related.includes(c.id)));
  const rows = hyps.map((h) => {
    const ex = expsFor(h);
    return `<tr data-ev="${h.evidence}"><th scope="row"><a href="${h.url}">${esc(h.id)}</a></th><td><a href="${h.url}">${esc(h.title)}</a><p class="muted small">${esc(h.summary)}</p></td><td>${statusChip(h.status) || '<span class="muted">—</span>'}</td><td>${seal(h.evidence)}</td><td>${ex.length ? ex.map((e) => `<a href="${e.url}">${esc(e.id)}</a>`).join(', ') : '<span class="muted">nenhum</span>'}</td><td class="nowrap">${esc(h.updated)}</td></tr>`;
  });
  const body = `${pageHead({
    eyebrow: 'Registro oficial',
    title: 'Hipóteses',
    lead: 'Cada hipótese é falsificável: declara variáveis, previsão e o que a refutaria. Status muda só com evidência registrada no repositório.',
    extra: counts.length ? `<ul class="statuslist">${counts.map(([k, n]) => `<li><span class="status st-${k}">${kindLabel[k]}</span> <strong>${n}</strong></li>`).join('')}</ul>` : '',
  })}
<section><div class="wrap">
${hyps.length ? `<div class="table-wrap" tabindex="0"><table class="htable"><thead><tr><th scope="col">ID</th><th scope="col">Hipótese</th><th scope="col">Status</th><th scope="col">Evidência</th><th scope="col">Experimentos</th><th scope="col">Atualizada</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '<p class="empty">Nenhuma hipótese registrada ainda. O registro vive em <code>hypotheses/</code> (H-01, H-02…).</p>'}
<p class="muted small">"Suportada (local)" exige validação local com script, dados e seed. Resultados de autores, sozinhos, nunca mudam o status para suportada.</p>
</div></section>`;
  return layout({ title: 'Hipóteses', desc: 'Registro de hipóteses falsificáveis da Norevia Labs, com status e experimentos ligados.', path: '/hipoteses/', body });
}

const VERDICT = { suporta: ['Suporta', 'good'], 'nao-suporta': ['Não suporta', 'bad'], refuta: ['Refuta', 'bad'], parcial: ['Parcial', 'partial'], inconclusivo: ['Inconclusivo', 'partial'], inconclusiva: ['Inconclusivo', 'partial'] };
function summaryBlock(ds, ctx = {}) {
  const s = ds.summary;
  if (!s) return '';
  return `<div class="rsummary"><p class="eyebrow">Do arquivo <code>${esc(ds.file)}</code></p>
${s.headline.length ? `<ul class="headline">${s.headline.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
${s.tests.length ? `<div class="table-wrap" tabindex="0"><table class="small"><thead><tr><th scope="col">Predição</th><th scope="col">Veredito do teste</th><th scope="col">Detalhe</th></tr></thead><tbody>${s.tests.map((t) => { const v = VERDICT[norm(t.verdict)] || [String(t.verdict ?? '—'), 'other']; return `<tr><th scope="row">${esc(t.id ?? '')}</th><td><span class="status st-${v[1]}">${esc(v[0])}</span></td><td>${esc(t.detail ?? '')}</td></tr>`; }).join('')}</tbody></table></div>` : ''}
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

function pageExperimentos(cards, datasets) {
  const sims = sortCards(cards.filter((c) => c.area === 'simulation'));
  const obs = sortCards(cards.filter((c) => c.area === 'observatory'));
  const orphan = datasets.filter((d) => !d.owner);
  const block = (c) => {
    const charts = chartsFor(c, 1);
    return `<article class="exp ev-${c.evidence}"><header><p class="card-top">${seal(c.evidence)}${statusChip(c.status)}</p><h3><a href="${c.url}"><span class="cid">${esc(c.id)}</span> ${esc(c.title)}</a></h3><p>${esc(c.summary)}</p></header>${charts.slice(0, 2).join('')}${charts.length > 2 ? `<p><a class="more" href="${c.url}#resultados">Todos os gráficos e dados →</a></p>` : ''}${c.data.length ? `<p class="muted small">Dados: ${c.data.map((d) => `<code>${esc(d.file)}</code>`).join(', ')}</p>` : '<p class="muted small">Sem arquivo de dados associado.</p>'}</article>`;
  };
  const body = `${pageHead({
    eyebrow: 'Swarm Efficiency Observatory',
    title: 'Experimentos',
    lead: 'Um túnel de vento para swarms: a mesma tarefa em arquiteturas diferentes, com orçamentos comparáveis, múltiplas execuções e critérios de aceitação objetivos.',
  })}
<section><div class="wrap">
<ol class="abc">${LAB.OBSERVATORY_DESIGN.map((a) => `<li><span class="k">${a.k}</span><strong>${esc(a.name)}</strong><span>${esc(a.d)}</span></li>`).join('')}</ol>
<p class="muted">Métricas: ${LAB.OBSERVATORY_METRICS.map(esc).join(' · ')}. O objetivo é localizar pontos de transição: quando o agente único deixa de ser a melhor escolha, quando um micro-swarm agrega valor e quando expandir desperdiça.</p>
</div></section>
<section><div class="wrap">
<h2 id="simulacoes">Simulações baseadas em agentes</h2>
<p class="muted narrow">Modelos determinísticos por seed (<code>sims/</code> → <code>results/sims/</code>). Simulação explora dinâmica; não substitui benchmark com LLMs reais.</p>
${sims.length ? sims.map(block).join('') : '<p class="empty">Nenhuma simulação publicada ainda.</p>'}
</div></section>
<section><div class="wrap">
<h2 id="observatory">Observatory: benchmarks com LLMs reais</h2>
${obs.length ? obs.map(block).join('') : '<p class="empty">Nenhum benchmark publicado ainda. Quando houver, cada resultado traz tarefas, orçamento, número de execuções e critério de aceite.</p>'}
</div></section>
${orphan.length ? `<section><div class="wrap"><h2 id="dados">Dados ainda sem cartão interpretativo</h2><p class="muted narrow">Arquivos em <code>results/</code> sem cartão associado. São dados brutos: sem leitura, sem conclusão.</p>${orphan.map((d) => `<article class="exp"><h3><code>${esc(d.file)}</code></h3>${summaryBlock(d)}${d.error ? `<p class="muted">Não plotado: ${esc(d.error)}.</p>` : d.specs.slice(0, 3).map(renderChart).join('') || (d.metrics.length ? metricsTable(d) : '<p class="muted">Formato não reconhecido para gráfico.</p>')}</article>`).join('')}</div></section>` : ''}`;
  return layout({ title: 'Experimentos', desc: 'Simulações e benchmarks do Swarm Efficiency Observatory, com gráficos gerados dos dados.', path: '/experimentos/', body });
}

function pageLiteratura(cards) {
  const lit = sortCards(cards.filter((c) => c.area === 'literature'));
  const oss = sortCards(cards.filter((c) => c.area === 'oss'));
  const both = [...lit, ...oss];
  const item = (c) => `<li class="ref-item ev-${c.evidence}" data-area="${c.area}" data-ev="${c.evidence}" data-text="${esc([c.id, c.title, c.summary, c.tags.join(' '), c.sources.join(' ')].join(' ').toLowerCase())}"><p class="card-top">${seal(c.evidence)}${statusChip(c.status)}</p><h3><a href="${c.url}">${esc(c.title)}</a> <span class="cid">${esc(c.id)}</span></h3><p>${esc(c.summary)}</p>${c.sources.length ? `<p class="src small">${inline(c.sources[0])}${c.sources.length > 1 ? ` <span class="muted">+${c.sources.length - 1}</span>` : ''}</p>` : '<p class="src small muted">Fonte não registrada — tratar como lacuna.</p>'}</li>`;
  const body = `${pageHead({
    eyebrow: 'Fontes',
    title: 'Literatura & open source',
    lead: 'Papers sobre sistemas multiagente, escalonamento, debate e roteamento; projetos open source inspecionados com commit. O que os autores relatam não é o que nós validamos.',
  })}
<section><div class="wrap">
${filters(both, { areas: true })}
<h2 id="papers">Literatura <span class="count">${lit.length}</span></h2>
${lit.length ? `<ul class="refs filterable">${lit.map(item).join('')}</ul>` : '<p class="empty">Nenhum paper catalogado ainda.</p>'}
<h2 id="oss">Open source <span class="count">${oss.length}</span></h2>
${oss.length ? `<ul class="refs filterable">${oss.map(item).join('')}</ul>` : '<p class="empty">Nenhum projeto inspecionado ainda.</p>'}
<p class="empty filtered-empty" hidden>Nenhuma fonte corresponde aos filtros.</p>
</div></section>`;
  return layout({ title: 'Literatura & OSS', desc: 'Papers e projetos open source catalogados pela Norevia Labs, com nível de evidência.', path: '/literatura/', body });
}

function pageMetodo(cards, datasets) {
  const lac = sortCards(cards.filter((c) => c.evidence === 'lacuna'));
  const untested = cards.filter((c) => c.area === 'hypothesis' && ['open', 'other'].includes(c.status?.kind || 'other'));
  const lenses = [
    ['Continuidade', 'A tarefa mantém estado, responsável e histórico mesmo após delegações?'],
    ['Aceite verificável', 'Existe critério objetivo que diga se o resultado está correto?'],
    ['Memória limitada', 'O mecanismo funciona com memória finita e esquecimento deliberado?'],
    ['Custo', 'Quanto custa cada acerto — tokens, tempo, coordenação, retrabalho?'],
    ['Reparo delimitado', 'O sistema detecta e repara falhas sabendo quando parar?'],
  ];
  const quality = warnings.filter((w) => !/ignorado/.test(w.msg) || true);
  const body = `${pageHead({
    eyebrow: 'Disciplina de evidência',
    title: 'Método',
    lead: 'Distinguimos fenômeno natural, relato dos autores, implementação observada, hipótese, validação local e lacuna. Ambição grande exige contabilidade honesta.',
  })}
<section><div class="wrap">
<h2 id="niveis">Níveis de evidência</h2>
<ol class="ladder">${Object.entries(EVIDENCE).map(([k, e]) => {
  const list = cards.filter((c) => c.evidence === k);
  return `<li class="ev-${k}"><div>${seal(k)}</div><div><p>${esc(e.desc)}</p><p class="muted small">${list.length} cartão(ões)${list.length ? ': ' + sortCards(list).slice(0, 4).map((c) => `<a href="${c.url}">${esc(c.id)}</a>`).join(', ') + (list.length > 4 ? '…' : '') : ''}</p></div></li>`;
}).join('')}</ol>
<h2 id="regras">Regras do laboratório</h2>
<ul class="rules">${LAB.RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
<h2 id="lentes">Lentes de avaliação</h2>
<dl class="lenses">${lenses.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
<p class="muted small">Propostas de pesquisa descritas aqui não autorizam implantação nem mudanças em sistemas ou equipes.</p>
</div></section>
<section class="gaps"><div class="wrap">
<h2 id="falta-provar">O que ainda falta provar</h2>
<ul class="notyet">${LAB.NOT_YET_PROVEN.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
<h3>Lacunas registradas no acervo <span class="count">${lac.length}</span></h3>
${cardList(lac, { empty: 'Nenhum cartão marcado como lacuna ainda.' })}
<h3>Hipóteses sem teste <span class="count">${untested.length}</span></h3>
${untested.length ? `<ul class="plainlist">${sortCards(untested).map((h) => `<li><a href="${h.url}">${esc(h.id)}</a> — ${esc(h.title)}</li>`).join('')}</ul>` : '<p class="muted">Nenhuma hipótese em aberto registrada.</p>'}
</div></section>
<section><div class="wrap">
<h2 id="saude">Saúde do acervo</h2>
<p class="muted narrow">Verificações automáticas do gerador neste build: campos ausentes, ids duplicados, relações quebradas, fontes não registradas. ${quality.length} aviso(s).</p>
${quality.length ? `<div class="table-wrap" tabindex="0"><table class="small"><thead><tr><th scope="col">Arquivo</th><th scope="col">Aviso</th></tr></thead><tbody>${quality.slice(0, 200).map((w) => `<tr><td><code>${esc(w.file)}</code></td><td>${esc(w.msg)}</td></tr>`).join('')}</tbody></table></div>` : '<p>Nenhum aviso.</p>'}
<h2 id="cartao">Formato de um cartão</h2>
<pre><code>---
id: nat-response-threshold
title: Limiar de resposta em insetos sociais
area: nature
evidence: fenomeno-natural
tags: [divisao-de-trabalho, elastic-swarm]
sources:
  - "Autor (ano). Periódico. doi:…"
related: [H-03, sim-response-threshold]
updated: 2026-11-07
summary: Uma frase para a LP.
---
Mecanismo · Evidência · Análogo de engenharia · Hipótese testável · Limites/lacunas</code></pre>
<p class="muted small">Opcional para experimentos: <code>data: arquivo.json</code> (relativo ao cartão ou à raiz) e <code>chart: { x: n_agents, y: [accuracy], group: arch }</code>. Hipóteses usam <code>status</code>.</p>
</div></section>`;
  return layout({ title: 'Método', desc: 'Níveis de evidência, regras e o que ainda falta provar na Norevia Labs.', path: '/metodo/', body });
}

function pageCard(c, cards, ctx) {
  const { html, headings } = markdown(c.body.replace(/^\s*#\s+.*\n/, ''), { ...ctx, selfId: c.id, resolvePath: (href) => ctx.resolvePath(href, c) });
  const related = c.related.map((id) => ctx.byId.get(id) || { missing: id });
  const backlinks = cards.filter((o) => o !== c && o.related.includes(c.id) && !c.related.includes(o.id));
  const charts = chartsFor(c);
  const pillars = LAB.PILLARS.filter((p) => matchTags([c], p.match).length);
  const toc = headings.filter((h) => h.level <= 3);
  const extraMeta = Object.entries(c.fm).filter(([k, v]) => !['id', 'title', 'titulo', 'area', 'evidence', 'evidencia', 'tags', 'sources', 'fontes', 'related', 'relacionados', 'updated', 'summary', 'resumo', 'status', 'chart', 'data', 'dados', 'results', 'resultados'].includes(k) && v !== '' && v != null && (typeof v !== 'object' || Array.isArray(v)));
  const body = `
<article class="cardpage ev-${c.evidence}">
<header class="phead card-head"><div class="wrap">
${orbitsSvg('phead-orbit', c.id.length * 13)}
<nav class="crumbs" aria-label="Trilha"><a href="/">Início</a> / <a href="${areaHref(c.area)}">${esc(AREAS[c.area].plural)}</a> / <span>${esc(c.id)}</span></nav>
<p class="card-top">${seal(c.evidence, ' seal-lg')}${areaChip(c.area)}${statusChip(c.status)}</p>
<h1>${esc(c.title)}</h1>
<p class="lead">${inline(c.summary, { ...ctx, selfId: c.id })}</p>
</div></header>
<div class="wrap card-grid">
<aside class="meta" aria-label="Metadados">
<dl>
<div><dt>ID</dt><dd><code>${esc(c.id)}</code></dd></div>
<div><dt>Evidência</dt><dd>${esc(evLabel(c.evidence))}<span class="muted small block">${esc(EVIDENCE[c.evidence]?.desc || 'Nível não declarado ou inválido no frontmatter.')}</span></dd></div>
${c.status ? `<div><dt>Status</dt><dd>${statusChip(c.status)}</dd></div>` : ''}
${c.updated ? `<div><dt>Atualizado</dt><dd>${esc(c.updated)}</dd></div>` : ''}
${c.tags.length ? `<div><dt>Tags</dt><dd class="tags">${c.tags.map((t) => `<span>#${esc(t)}</span>`).join(' ')}</dd></div>` : ''}
${pillars.length ? `<div><dt>Pilares</dt><dd>${pillars.map((p) => esc(p.name)).join('<br>')}</dd></div>` : ''}
${extraMeta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${Array.isArray(v) ? v.map((x) => inline(typeof x === 'object' ? JSON.stringify(x) : String(x), ctx)).join('<br>') : inline(String(v), ctx)}</dd></div>`).join('')}
<div><dt>Arquivo</dt><dd><code class="path">${esc(c.file)}</code></dd></div>
</dl>
${toc.length >= 3 ? `<nav class="toc" aria-label="Nesta página"><p>Nesta página</p><ol>${toc.map((h) => `<li class="l${h.level}"><a href="#${h.id}">${esc(h.text)}</a></li>`).join('')}</ol></nav>` : ''}
</aside>
<div class="prose">
${html || '<p class="muted">Cartão sem corpo de texto.</p>'}
${charts.length ? `<section class="card-charts"><h2 id="resultados">Resultados</h2><p class="muted small">Gráficos gerados automaticamente a partir de ${c.data.map((d) => `<code>${esc(d.file)}</code>`).join(', ')}. ${c.evidence === 'validacao-local' ? '' : 'O nível de evidência do cartão vale para a leitura destes dados.'}</p>${charts.join('')}</section>` : ''}
<section class="sources"><h2 id="fontes">Fontes</h2>
${c.sources.length ? `<ol>${c.sources.map((s) => `<li>${inline(s, ctx)}</li>`).join('')}</ol>` : '<p class="muted">Nenhuma fonte registrada no frontmatter. Trate as afirmações deste cartão como lacuna até haver fonte primária.</p>'}
</section>
${related.length || backlinks.length ? `<section class="related"><h2 id="relacionados">Relacionados</h2><ul class="rel">${related.map((r) => (r.missing ? `<li class="missing"><span class="cid">${esc(r.missing)}</span> <span class="muted">— cartão ainda não publicado</span></li>` : `<li><a href="${r.url}">${seal(r.evidence)}<span class="cid">${esc(r.id)}</span> ${esc(r.title)}</a></li>`)).join('')}${backlinks.map((r) => `<li><a href="${r.url}">${seal(r.evidence)}<span class="cid">${esc(r.id)}</span> ${esc(r.title)}</a> <span class="muted small">(cita este)</span></li>`).join('')}</ul></section>` : ''}
</div>
</div>
</article>`;
  return layout({ title: `${c.id} · ${c.title}`, desc: c.summary, path: c.url, body });
}

function areaHref(a) {
  return { nature: '/conceitos/#natureza', theory: '/conceitos/#acervo', hypothesis: '/hipoteses/', literature: '/literatura/#papers', oss: '/literatura/#oss', simulation: '/experimentos/#simulacoes', observatory: '/experimentos/#observatory' }[a] || '/conceitos/';
}

function page404() {
  return layout({ title: 'Não encontrado', path: '/404', body: `${pageHead({ eyebrow: '404 · lacuna', title: 'Esta trilha evaporou', lead: 'A página não existe (ainda). Talvez o cartão esteja sendo escrito agora.' })}<section><div class="wrap"><p><a class="btn" href="/conceitos/">Ir para o acervo</a></p></div></section>` });
}

// ------------------------------------------------------------------ build

function main() {
  const cards = readCards();
  const byId = new Map(cards.map((c) => [c.id, c]));
  const byIdLower = new Map(cards.map((c) => [c.id.toLowerCase(), c]));
  for (const c of cards) for (const r of c.related) if (!byId.has(r)) warn(c.file, `related aponta para "${r}", que ainda não existe`);
  const datasets = readData(cards);
  const git = gitInfo();
  const now = new Date();
  BUILD = {
    date: now.toISOString(),
    dateHuman: now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) + ' (BRT)',
    commit: git.commit,
    cards: cards.length,
  };
  const ids = cards.map((c) => c.id).filter((id) => id.length >= 4).sort((a, b) => b.length - a.length).map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const ctx = {
    byId,
    resolveId: (id) => byId.get(id) || byIdLower.get(String(id).toLowerCase()),
    idRegex: ids.length ? new RegExp(`(^|[^\\w/#-])(${ids.join('|')})(?![\\w-])`, 'g') : null,
    resolvePath: (href, card) => {
      const clean = href.split('#')[0];
      if (!card || !clean) return null;
      const target = rel(path.resolve(path.dirname(card.abs), clean));
      const hit = cards.find((o) => o.file === target);
      return hit ? hit.url : null;
    },
  };

  // assets
  const css = fs.readFileSync(path.join(SITE_DIR, 'src/style.css'), 'utf8');
  const js = fs.readFileSync(path.join(SITE_DIR, 'src/site.js'), 'utf8');
  const h = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
  ASSETS = { css: `/assets/site.${h(css)}.css`, js: `/assets/site.${h(js)}.js` };

  const files = new Map(); // urlPath -> {type, body}
  const put = (p, body, type = 'text/html; charset=utf-8') => files.set(p, { type, body });
  put(ASSETS.css, css, 'text/css; charset=utf-8');
  put(ASSETS.js, js, 'text/javascript; charset=utf-8');
  put('/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#06100d"/><g fill="none" stroke="#5fe3b4" stroke-width="1.6"><ellipse cx="20" cy="20" rx="15" ry="6.5" transform="rotate(-24 20 20)"/><ellipse cx="20" cy="20" rx="9.5" ry="14" transform="rotate(32 20 20)" stroke="#f0b75a"/></g><circle cx="20" cy="20" r="3" fill="#eaf3ee"/><circle cx="33" cy="14.2" r="2" fill="#5fe3b4"/></svg>`, 'image/svg+xml');
  put('/', pageHome(cards, datasets));
  put('/conceitos/', pageConceitos(cards));
  put('/hipoteses/', pageHipoteses(cards));
  put('/experimentos/', pageExperimentos(cards, datasets));
  put('/literatura/', pageLiteratura(cards));
  for (const c of cards) put(c.url, pageCard(c, cards, ctx));
  // Método por último: inclui os avisos gerados durante a renderização
  put('/metodo/', pageMetodo(cards, datasets));
  put('/404.html', page404());
  put('/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${LAB.SITE.url}/sitemap.xml\n`, 'text/plain; charset=utf-8');
  const htmlPaths = [...files.keys()].filter((p) => p.endsWith('/'));
  put('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${htmlPaths.map((p) => `<url><loc>${LAB.SITE.url}${p}</loc></url>`).join('\n')}\n</urlset>\n`, 'application/xml; charset=utf-8');
  put('/acervo.json', JSON.stringify({
    lab: LAB.SITE.name, generated: BUILD.date, commit: BUILD.commit || null,
    evidence_levels: EVIDENCE,
    cards: sortCards(cards).map((c) => ({ id: c.id, title: c.title, area: c.area, evidence: c.evidence, status: c.status?.raw || null, tags: c.tags, sources: c.sources, related: c.related, updated: c.updated || null, summary: c.summary, url: LAB.SITE.url + c.url, file: c.file, data: c.data.map((d) => d.file) })),
    datasets: datasets.map((d) => ({ file: d.file, card: d.owner?.id || null, charts: d.specs.length })),
    warnings,
  }, null, 1), 'application/json; charset=utf-8');

  // dist/ (exatamente o que vai para Workers Static Assets)
  fs.rmSync(DIST, { recursive: true, force: true });
  for (const [p, f] of files) {
    const out = p.endsWith('/') ? path.join(DIST, p, 'index.html') : path.join(DIST, p);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, f.body);
  }

  // artefatos de deploy (Workers Static Assets): manifest + worker + _headers + código do passo 1
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
  fs.rmSync(DEPLOY, { recursive: true, force: true });
  fs.mkdirSync(DEPLOY, { recursive: true });
  fs.writeFileSync(path.join(DEPLOY, 'manifest.json'), JSON.stringify(manifest, null, 1));
  fs.writeFileSync(path.join(DEPLOY, 'headers.txt'), HEADERS);
  fs.copyFileSync(path.join(SITE_DIR, 'src/worker.js'), path.join(DEPLOY, 'worker.js'));
  const step1 = fs.readFileSync(path.join(SITE_DIR, 'src/step1-session.template.js'), 'utf8')
    .replace('"__MANIFEST__"', () => JSON.stringify(manifest))
    .replace('__BUILD_ID__', () => `${BUILD.date} ${BUILD.commit || ''}`.trim());
  fs.writeFileSync(path.join(DEPLOY, 'step1-session.js'), step1);
  const distBytes = Object.values(manifest).reduce((s, m) => s + m.size, 0);
  fs.writeFileSync(path.join(SITE_DIR, 'build-report.json'), JSON.stringify({ generated: BUILD.date, commit: BUILD.commit || null, cards: cards.length, pages: htmlPaths.length, files: files.size, dist_bytes: distBytes, datasets: datasets.length, warnings }, null, 2));

  const byArea = Object.keys(AREAS).map((a) => `${a}=${cards.filter((c) => c.area === a).length}`).join(' ');
  console.log(`norevia build ok · ${cards.length} cartões (${byArea}) · ${datasets.length} datasets · ${htmlPaths.length} páginas HTML · ${files.size} arquivos`);
  console.log(`dist ${(distBytes / 1024).toFixed(0)} KB em ${Object.keys(manifest).length} arquivos · manifest ${(JSON.stringify(manifest).length / 1024).toFixed(1)} KB · ${warnings.length} aviso(s) · ${Date.now() - t0} ms`);
  if (warnings.length) for (const w of warnings.slice(0, 30)) console.log(`  ! ${w.file}: ${w.msg}`);
}

main();
