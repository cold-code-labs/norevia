// Heuristic extraction of series from result JSON/CSV files and inline SVG rendering.
// Visual rules (dataviz skill): a single y-axis, 2px lines, r=4 markers with a surface ring,
// bars <= 24px with 4px rounded tops, hairline grid, legend for >= 2 series,
// data table always available, per-mark tooltip (data-tip + <title>).
import { esc } from './text.mjs';

// Categorical palette (light mode) — fixed order, validated with validate_palette.js (--mode light) against the #fbfaf6 chart surface.
// Three slots sit below 3:1 contrast: charts always ship a legend and a data table (relief rule).
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

const X_NAMES = ['x', 'n_agents', 'num_agents', 'agents', 'agentes', 'n_agentes', 'swarm_size', 'size', 'tamanho', 'k', 'budget', 'orcamento', 'effort', 'reasoning', 'reasoning_effort', 'difficulty', 'dificuldade', 'step', 'steps', 'tick', 't', 'time', 'tempo', 'round', 'rodada', 'iteration', 'iter', 'epoch', 'threshold', 'p', 'rate', 'taxa', 'noise', 'ruido'];
const GROUP_NAMES = ['arch', 'architecture', 'arquitetura', 'config', 'configuration', 'condition', 'condicao', 'strategy', 'estrategia', 'policy', 'politica', 'method', 'metodo', 'variant', 'variante', 'mode', 'modo', 'model', 'modelo', 'series', 'serie', 'group', 'grupo', 'name', 'nome', 'label', 'task', 'tarefa', 'scenario', 'cenario'];
const SKIP_Y = ['n', 'lo', 'hi', 'seed', 'id', 'idx', 'index', 'run', 'run_id', 'trial', 'rep', 'replica', 'timestamp', 'ts', 'date'];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const lc = (s) => String(s).toLowerCase();

export function parseDataFile(text, ext) {
  if (ext === '.json') return JSON.parse(text);
  if (ext === '.jsonl' || ext === '.ndjson') {
    return text.split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  }
  if (ext === '.csv' || ext === '.tsv') {
    const sep = ext === '.tsv' ? '\t' : ',';
    const rows = text.replace(/\r/g, '').split('\n').filter((l) => l.trim()).map((l) => splitCsv(l, sep));
    if (rows.length < 2) return [];
    const head = rows[0];
    return rows.slice(1).map((r) => Object.fromEntries(head.map((h, k) => [h, coerce(r[k])])));
  }
  return null;
}

function splitCsv(l, sep) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (q) {
      if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function coerce(v) {
  if (v === undefined || v === '') return null;
  if (/^-?\d+(\.\d+)?(e-?\d+)?$/i.test(v)) return Number(v);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

// Finds tables (arrays of objects) and parallel numeric columns inside the JSON.
const SKIP_PATH = /(^|\.)(params|parametros|parameters|configs?|settings|hypothesis|hipotese|tests|headline|meta|predictions)(\.|\[|$)/i;
function rowOf(r) {
  const f = flatten(r);
  const c = ['mean', 'p', 'value', 'est', 'media'].find((k) => isNum(r[k]));
  if (c && isNum(r.lo) && isNum(r.hi)) { f[c + '\u0001lo'] = r.lo; f[c + '\u0001hi'] = r.hi; delete f.lo; delete f.hi; }
  return f;
}
function findTables(data, path = '', depth = 0, out = []) {
  if (depth > 5 || out.length > 12 || data == null) return out;
  if (path && SKIP_PATH.test(path)) return out;
  if (Array.isArray(data)) {
    const objs = data.filter((d) => d && typeof d === 'object' && !Array.isArray(d));
    if (objs.length >= 2 && objs.length >= data.length * 0.8) {
      out.push({ path, rows: objs.map(rowOf) });
      return out;
    }
    if (data.length >= 2 && data.every(isNum)) {
      out.push({ path, rows: data.map((v, k) => ({ index: k, [path.split('.').pop() || 'valor']: v })) });
      return out;
    }
    data.slice(0, 20).forEach((d, k) => findTables(d, `${path}[${k}]`, depth + 1, out));
    return out;
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data);
    // parallel columns: { x: [..], acc: [..] }
    const arrs = entries.filter(([, v]) => Array.isArray(v) && v.length >= 2 && v.every((x) => isNum(x) || typeof x === 'string'));
    const lens = new Set(arrs.map(([, v]) => v.length));
    if (arrs.length >= 2 && lens.size === 1) {
      const n = arrs[0][1].length;
      out.push({ path, rows: Array.from({ length: n }, (_, r) => Object.fromEntries(arrs.map(([k, v]) => [k, v[r]]))) });
    }
    // map of homogeneous objects: { arch_a: {acc:..}, arch_b: {acc:..} }
    const objVals = entries.filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v));
    if (objVals.length >= 2 && objVals.length === entries.length) {
      const rows = objVals.map(([k, v]) => ({ configuration: k, ...flatten(v) }));
      const numericKeys = Object.keys(rows[0]).filter((k) => rows.every((r) => isNum(r[k])));
      if (numericKeys.length) out.push({ path, rows });
    }
    for (const [k, v] of entries) {
      if (v && typeof v === 'object') findTables(v, path ? `${path}.${k}` : k, depth + 1, out);
    }
  }
  return out;
}

function ciOf(v) {
  if (isNum(v)) return { v };
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const c = ['mean', 'p', 'value', 'est', 'estimate', 'media', 'rate'].find((k) => isNum(v[k]));
    if (c && (isNum(v.lo) || isNum(v.hi) || 'n' in v || 'ci95' in v)) {
      const ci = Array.isArray(v.ci95) ? v.ci95 : null;
      return { v: v[c], lo: isNum(v.lo) ? v.lo : ci?.[0], hi: isNum(v.hi) ? v.hi : ci?.[1] };
    }
  }
  return null;
}

function flatten(o, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    const ci = v && typeof v === 'object' && !Array.isArray(v) ? ciOf(v) : null;
    if (ci) { out[key] = ci.v; if (isNum(ci.lo)) out[key + '\u0001lo'] = ci.lo; if (isNum(ci.hi)) out[key + '\u0001hi'] = ci.hi; }
    else if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(out).length < 80) flatten(v, key, out);
    else if (k === 'ci95' && Array.isArray(v) && v.length === 2 && v.every(isNum)) { out['\u0001ci95'] = v; }
    else if (!Array.isArray(v)) out[key] = v;
  }
  // ci95 next to a rate (e.g. acceptRate + ci95)
  if (out['\u0001ci95']) {
    const rateKey = Object.keys(out).find((k) => /rate$|^p$|acc/i.test(k) && isNum(out[k]) && out[k] >= out['\u0001ci95'][0] - 1e-9 && out[k] <= out['\u0001ci95'][1] + 1e-9);
    if (rateKey) { out[rateKey + '\u0001lo'] = out['\u0001ci95'][0]; out[rateKey + '\u0001hi'] = out['\u0001ci95'][1]; }
    delete out['\u0001ci95'];
  }
  return out;
}

export function scalarMetrics(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  const flat = flatten(data);
  return Object.entries(flat).filter(([k, v]) => !k.includes('\u0001') && (isNum(v) || typeof v === 'string' || typeof v === 'boolean')).slice(0, 24);
}

// Curves: arrays aligned to a declared x axis (e.g. { N:[..], rhos:[..], acc_vote:[[..]..] } ou
// or { Ns:[..], cells:[{ rho, strategies:{ a:{ acc:[{p,lo,hi}..] } } }] }).
const isXName = (k) => X_NAMES.includes(lc(k)) || /^(n|ns|xs|ks|sizes|budgets|steps|rhos?|ps|thresholds)$/i.test(k);
function findCurves(data, xs = [], ctx = '', depth = 0, out = []) {
  if (depth > 6 || out.length >= 6 || !data || typeof data !== 'object') return out;
  if (Array.isArray(data)) {
    const objs = data.filter((d) => d && typeof d === 'object' && !Array.isArray(d));
    objs.slice(0, 2).forEach((d, k) => {
      const label = Object.entries(d).filter(([, v]) => isNum(v) || typeof v === 'string').slice(0, 5).map(([a, v]) => `${a}=${v}`).join(', ');
      findCurves(d, xs, label || `#${k + 1}`, depth + 1, out);
    });
    return out;
  }
  const entries = Object.entries(data);
  const localX = entries.filter(([k, v]) => Array.isArray(v) && v.length >= 2 && v.every(isNum) && isXName(k)).map(([k, v]) => ({ name: k, arr: v }));
  const X = [...localX, ...xs];
  const xFor = (n, not) => X.find((c) => c.arr.length === n && c.name !== not);
  for (const [k, v] of entries) {
    if (out.length >= 6) break;
    // m×n matrix (*_lo / *_hi pairs become the CI of the main series)
    if (/(_lo|_hi|Lo|Hi)$/.test(k) && entries.some(([kk]) => kk === k.replace(/(_lo|_hi|Lo|Hi)$/, ''))) continue;
    if (Array.isArray(v) && v.length >= 2 && v.every((r) => Array.isArray(r) && r.length >= 2 && r.every((c) => ciOf(c)))) {
      const n = v[0].length, m = v.length;
      const xa = xFor(n);
      const la = entries.find(([kk, vv]) => kk !== k && Array.isArray(vv) && vv.length === m && vv.every((c) => isNum(c) || typeof c === 'string') && kk !== xa?.name);
      if (xa) {
        const idx = pickIdx(m, 6);
        const rows = [];
        const LO = data[k + '_lo'] || data[k + 'Lo'], HI = data[k + '_hi'] || data[k + 'Hi'];
        for (const i of idx) v[i].forEach((c, j) => { const ci = ciOf(c); rows.push({ x: xa.arr[j], s: la ? `${la[0]}=${la[1][i]}` : `#${i + 1}`, y: ci.v, lo: ci.lo ?? LO?.[i]?.[j], hi: ci.hi ?? HI?.[i]?.[j] }); });
        out.push({ path: k, title: `${k} × ${xa.name}${ctx ? ` (${ctx})` : ''}`, x: xa.name, y: k, group: la ? la[0] : 'series', rows, note: idx.length < m ? `${idx.length} of ${m} series shown (evenly spaced values)` : '' });
      }
      continue;
    }
    // strategy map: { a: { acc:[..n] }, b: { acc:[..n] } }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const subs = Object.entries(v).filter(([, sv]) => sv && typeof sv === 'object' && !Array.isArray(sv));
      if (subs.length >= 2) {
        const metricKeys = Object.keys(subs[0][1]).filter((mk) => subs.every(([, sv]) => Array.isArray(sv[mk]) && sv[mk].length >= 2 && sv[mk].every((c) => ciOf(c))));
        let done = false;
        for (const mk of metricKeys.slice(0, 3)) {
          const n = subs[0][1][mk].length;
          const xa = xFor(n);
          if (!xa) continue;
          const rows = [];
          for (const [sn, sv] of subs.slice(0, 8)) sv[mk].forEach((c, j) => { const ci = ciOf(c); rows.push({ x: xa.arr[j], s: sn, y: ci.v, lo: ci.lo, hi: ci.hi }); });
          out.push({ path: `${k}.*.${mk}`, title: `${mk} × ${xa.name}${ctx ? ` (${ctx})` : ''}`, x: xa.name, y: mk, group: k, rows, note: subs.length > 8 ? `8 of ${subs.length} series shown` : '' });
          done = true;
          if (out.length >= 6) break;
        }
        if (done) continue;
      }
    }
    if (v && typeof v === 'object') findCurves(v, X, ctx, depth + 1, out);
  }
  return out;
}

function pickIdx(m, k) {
  if (m <= k) return [...Array(m).keys()];
  const s = new Set();
  for (let i = 0; i < k; i++) s.add(Math.round((i * (m - 1)) / (k - 1)));
  return [...s];
}

const Y_PRIORITY = /accept|acc|success|sucesso|rate|taxa|cost|custo|laten|false|fs$|quality|qualidade|score|win|vitoria|error|erro/i;
const Y_DEMOTE = /^(n|count|total.*|.*tok.*|.*calls?)$/i;

function toSpec(rows, x, y, group, opts) {
  const xNumeric = rows.every((r) => isNum(r[x]));
  const agg = new Map();
  for (const r of rows) {
    if (!isNum(r[y]) || r[x] == null) continue;
    const g = group ? String(r[group] ?? '—') : y;
    const key = g + '\u0001' + r[x];
    const a = agg.get(key) || { g, x: r[x], sum: 0, n: 0, min: Infinity, max: -Infinity, lo: r[y + '\u0001lo'], hi: r[y + '\u0001hi'] };
    a.sum += r[y]; a.n++; a.min = Math.min(a.min, r[y]); a.max = Math.max(a.max, r[y]);
    agg.set(key, a);
  }
  if (!agg.size) return null;
  const series = new Map();
  for (const a of agg.values()) {
    if (!series.has(a.g)) series.set(a.g, []);
    series.get(a.g).push({ x: a.x, y: a.sum / a.n, n: a.n, min: a.min, max: a.max, lo: a.n === 1 ? a.lo : undefined, hi: a.n === 1 ? a.hi : undefined });
  }
  let list = [...series.entries()].map(([name, pts]) => ({ name, pts: xNumeric ? pts.sort((p, q) => p.x - q.x) : pts }));
  let folded = 0;
  if (list.length > 8) { folded = list.length - 8; list = list.slice(0, 8); }
  const type = opts.type || (xNumeric && list.every((s) => s.pts.length >= 2) ? 'line' : 'bar');
  return { title: opts.title || `${y} × ${x}`, x, y, group, type, series: list, folded, source: opts.source || '(root)', aggregated: [...agg.values()].some((a) => a.n > 1), note: opts.note || '', ci: [...agg.values()].some((a) => isNum(a.lo) && isNum(a.hi)) };
}

// Builds chart specs. hint (frontmatter `chart`) may pin x, y, group, type, title.
export function chartSpecs(data, hint = {}) {
  const specs = [];
  const hy = hint.y ? (Array.isArray(hint.y) ? hint.y : [hint.y]) : null;
  if (!hint.x) {
    for (const c of findCurves(data)) {
      const rows = c.rows.map((r) => ({ [c.x]: r.x, [c.group]: r.s, [c.y]: r.y, [c.y + '\u0001lo']: r.lo, [c.y + '\u0001hi']: r.hi }));
      const sp = toSpec(rows, c.x, c.y, c.group, { title: c.title, source: c.path, note: c.note, type: hint.type });
      if (sp) specs.push(sp);
      if (specs.length >= 6) return specs;
    }
  }
  if (specs.length) return specs;
  const tables = findTables(data);
  for (const t of tables) {
    const rows = t.rows;
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => !k.includes('\u0001'));
    const numeric = keys.filter((k) => rows.filter((r) => isNum(r[k])).length >= rows.length * 0.8);
    const categorical = keys.filter((k) => !numeric.includes(k) && rows.every((r) => r[k] == null || typeof r[k] === 'string' || typeof r[k] === 'boolean'));
    if (hint.x && !keys.includes(hint.x)) continue;
    let x = hint.x || X_NAMES.map((n) => keys.find((k) => lc(k) === n)).find(Boolean);
    if (!x) x = numeric.find((k) => !SKIP_Y.includes(lc(k)) && new Set(rows.map((r) => r[k])).size === rows.length && isMonotone(rows.map((r) => r[k])));
    if (!x) x = categorical.find((k) => new Set(rows.map((r) => r[k])).size <= 24);
    if (!x) x = numeric.find((k) => lc(k) === 'index');
    if (!x) continue;
    let group = hint.group && keys.includes(hint.group) ? hint.group : null;
    if (!group) {
      group = GROUP_NAMES.map((n) => categorical.find((k) => lc(k) === n && k !== x)).find(Boolean) || null;
      if (group && new Set(rows.map((r) => r[group])).size > 8) group = null;
    }
    let ys = hy ? hy.filter((y) => numeric.includes(y)) : numeric.filter((k) => k !== x && !SKIP_Y.includes(lc(k)) && !SKIP_Y.includes(lc(k.split('.').pop())));
    if (!hy) ys.sort((a, b) => (Y_PRIORITY.test(b) - Y_PRIORITY.test(a)) || (Y_DEMOTE.test(a.split('.').pop()) - Y_DEMOTE.test(b.split('.').pop())));
    ys = ys.slice(0, hy ? 6 : 4);
    for (const y of ys) {
      const sp = toSpec(rows, x, y, group, { title: hint.title && ys.length === 1 ? hint.title : null, source: t.path || '(root)', type: hint.type });
      if (sp) specs.push(sp);
      if (specs.length >= 6) return specs;
    }
  }
  return specs;
}

// Standard text summary of result files: headline[] e tests[{id, verdict, detail}]
export function resultSummary(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const headline = Array.isArray(data.headline) ? data.headline.filter((h) => typeof h === 'string') : typeof data.headline === 'string' ? [data.headline] : [];
  const tests = Array.isArray(data.tests) ? data.tests.filter((t) => t && typeof t === 'object' && (t.id || t.verdict)) : [];
  const meta = ['id', 'version', 'seed', 'generated', 'nRuns', 'phases'].filter((k) => data[k] != null && typeof data[k] !== 'object' || Array.isArray(data[k]) && data[k].every((x) => typeof x !== 'object')).map((k) => [k, Array.isArray(data[k]) ? data[k].join(', ') : String(data[k])]);
  if (!headline.length && !tests.length) return null;
  return { headline, tests, meta };
}

function isMonotone(a) {
  let up = true, down = true;
  for (let i = 1; i < a.length; i++) { if (a[i] < a[i - 1]) up = false; if (a[i] > a[i - 1]) down = false; }
  return up || down;
}

function niceTicks(min, max, count = 5) {
  if (min === max) { const d = Math.abs(min) || 1; min -= d / 2; max += d / 2; }
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count + 0.5);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

export function fmt(v) {
  if (!isNum(v)) return String(v);
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
  if (a >= 1e4) return Math.round(v / 1e3).toLocaleString('en-US') + 'k';
  if (a >= 100) return Math.round(v).toLocaleString('en-US');
  if (a >= 1) return (+v.toFixed(2)).toLocaleString('en-US');
  if (a === 0) return '0';
  return (+v.toPrecision(3)).toLocaleString('en-US');
}

const ciTxt = (p) => (isNum(p.lo) && isNum(p.hi) ? ` [95% CI ${fmt(p.lo)}–${fmt(p.hi)}]` : '') + (p.n > 1 ? ` (mean of ${p.n}; ${fmt(p.min)}–${fmt(p.max)})` : '');
let uid = 0;
export function renderChart(spec) {
  const id = `ch${++uid}`;
  const catsAll = spec.type === 'bar' ? [...new Set(spec.series.flatMap((s) => s.pts.map((p) => String(p.x))))] : [];
  const rotate = spec.type === 'bar' && catsAll.some((k) => k.length * 6.5 > 560 / Math.max(1, catsAll.length) - 6);
  const longest = Math.min(22, Math.max(0, ...catsAll.map((k) => k.length)));
  const W = 640, H = rotate ? 300 + longest * 3 : 300, m = { t: 16, r: spec.type === 'line' && spec.series.length <= 4 ? 112 : 20, b: rotate ? 34 + longest * 4 : 46, l: 56 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const allY = spec.series.flatMap((s) => s.pts.flatMap((p) => [p.y, p.lo, p.hi].filter(isNum)));
  const yMin = Math.min(0, ...allY), yMax = Math.max(...allY) === 0 && yMin === 0 ? 1 : Math.max(...allY);
  const yt = niceTicks(yMin, yMax);
  const Y = (v) => m.t + ih - ((v - yt[0]) / (yt[yt.length - 1] - yt[0])) * ih;
  const parts = [];
  const multi = spec.series.length >= 2;
  // grid
  for (const t of yt) parts.push(`<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}"/><text class="tick" x="${m.l - 8}" y="${(Y(t) + 4).toFixed(1)}" text-anchor="end">${esc(fmt(t))}</text>`);
  if (spec.type === 'line') {
    const xs = spec.series.flatMap((s) => s.pts.map((p) => p.x));
    let x0 = Math.min(...xs), x1 = Math.max(...xs);
    const geometric = x0 > 0 && x1 / x0 >= 16 && new Set(xs).size >= 3 && [...new Set(xs)].every((v) => Number.isInteger(Math.log2(v)));
    const tx = geometric ? (v) => Math.log2(v) : (v) => v;
    const a = tx(x0), b = tx(x1) === tx(x0) ? tx(x0) + 1 : tx(x1);
    const X = (v) => m.l + ((tx(v) - a) / (b - a)) * iw;
    const xticks = geometric ? [...new Set(xs)].sort((p, q) => p - q) : niceTicks(x0, x1, 6).filter((v) => v >= x0 - 1e-9 && v <= x1 + 1e-9);
    for (const t of xticks) parts.push(`<text class="tick" x="${X(t).toFixed(1)}" y="${H - m.b + 18}" text-anchor="middle">${esc(fmt(t))}</text>`);
    parts.push(`<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${Y(yt[0])}" y2="${Y(yt[0])}"/>`);
    const ends = [];
    spec.series.forEach((s, k) => {
      const c = SERIES[k];
      const d = s.pts.map((p, j) => `${j ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
      parts.push(`<path class="line" d="${d}" stroke="${c}"/>`);
      for (const p of s.pts) if (isNum(p.lo) && isNum(p.hi)) parts.push(`<line class="ci" x1="${X(p.x).toFixed(1)}" x2="${X(p.x).toFixed(1)}" y1="${Y(p.lo).toFixed(1)}" y2="${Y(p.hi).toFixed(1)}" stroke="${c}"/>`);
      const every = Math.ceil(s.pts.length / 24);
      s.pts.forEach((p, j) => {
        if (j % every !== 0 && j !== s.pts.length - 1) return;
        const tip = `${multi ? s.name + ' · ' : ''}${spec.x} = ${fmt(p.x)} · ${spec.y} = ${fmt(p.y)}${ciTxt(p)}`;
        parts.push(`<g class="pt" tabindex="0" role="img" aria-label="${esc(tip)}" data-tip="${esc(tip)}"><title>${esc(tip)}</title><circle class="hit" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="11"/><circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${every > 1 ? 3 : 4}" fill="${c}" class="dot"/></g>`);
      });
      const last = s.pts[s.pts.length - 1];
      if (last) ends.push({ y: Y(last.y), x: X(last.x), name: s.name, v: last.y, c });
    });
    // direct labels at line ends (only when they do not collide)
    if (spec.series.length <= 4) {
      const sorted = [...ends].sort((p, q) => p.y - q.y);
      const ok = sorted.every((e, k) => k === 0 || e.y - sorted[k - 1].y >= 14);
      if (ok) for (const e of ends) parts.push(`<text class="endlabel" x="${(e.x + 10).toFixed(1)}" y="${(e.y + 4).toFixed(1)}">${esc(trunc(multi ? e.name : fmt(e.v), 16))}</text>`);
    }
  } else {
    const cats = [...new Set(spec.series.flatMap((s) => s.pts.map((p) => String(p.x))))];
    const band = iw / Math.max(1, cats.length);
    const ns = spec.series.length;
    const bw = Math.max(4, Math.min(24, (band * 0.7 - (ns - 1) * 2) / ns));
    const groupW = ns * bw + (ns - 1) * 2;
    cats.forEach((cat, ci) => {
      const cx = m.l + band * ci + band / 2;
      parts.push(rotate ? `<text class="tick" x="${cx.toFixed(1)}" y="${H - m.b + 14}" text-anchor="end" transform="rotate(-35 ${cx.toFixed(1)} ${H - m.b + 14})">${esc(trunc(cat, 22))}</text>` : `<text class="tick" x="${cx.toFixed(1)}" y="${H - m.b + 18}" text-anchor="middle">${esc(cat)}</text>`);
      spec.series.forEach((s, k) => {
        const p = s.pts.find((q) => String(q.x) === cat);
        if (!p) return;
        const x = cx - groupW / 2 + k * (bw + 2);
        const y0 = Y(Math.max(0, yt[0])), y1 = Y(p.y);
        const top = Math.min(y0, y1), h = Math.abs(y0 - y1);
        const r = Math.min(4, h, bw / 2);
        const up = p.y >= 0;
        const d = up
          ? `M${x},${y0}V${top + r}Q${x},${top} ${x + r},${top}H${x + bw - r}Q${x + bw},${top} ${x + bw},${top + r}V${y0}Z`
          : `M${x},${y0}V${top + h - r}Q${x},${top + h} ${x + r},${top + h}H${x + bw - r}Q${x + bw},${top + h} ${x + bw},${top + h - r}V${y0}Z`;
        const tip = `${multi ? s.name + ' · ' : ''}${spec.x} = ${cat} · ${spec.y} = ${fmt(p.y)}${ciTxt(p)}`;
        parts.push(`<g class="pt" tabindex="0" role="img" aria-label="${esc(tip)}" data-tip="${esc(tip)}"><title>${esc(tip)}</title><rect class="hit" x="${x - 2}" y="${Math.min(top, y0 - 12) - 4}" width="${bw + 4}" height="${Math.max(h, 12) + 8}"/><path d="${d}" fill="${SERIES[k]}"/></g>`);
        if (isNum(p.lo) && isNum(p.hi)) parts.push(`<line class="ci bar-ci" x1="${(x + bw / 2).toFixed(1)}" x2="${(x + bw / 2).toFixed(1)}" y1="${Y(p.lo).toFixed(1)}" y2="${Y(p.hi).toFixed(1)}"/>`);
        if (ns === 1 && cats.length <= 12 && !(isNum(p.lo) && isNum(p.hi))) parts.push(`<text class="barval" x="${(x + bw / 2).toFixed(1)}" y="${(up ? top - 6 : top + h + 14).toFixed(1)}" text-anchor="middle">${esc(fmt(p.y))}</text>`);
      });
    });
    parts.push(`<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${Y(Math.max(0, yt[0]))}" y2="${Y(Math.max(0, yt[0]))}"/>`);
  }
  parts.push(`<text class="axlabel" x="${m.l + iw / 2}" y="${H - 6}" text-anchor="middle">${esc(spec.x)}</text>`);
  const legend = multi
    ? `<ul class="legend" aria-label="Legend">${spec.series.map((s, k) => `<li><span class="key ${spec.type}" data-c="${k}" aria-hidden="true"><svg width="18" height="10"><${spec.type === 'line' ? `line x1="0" x2="18" y1="5" y2="5" stroke="${SERIES[k]}" stroke-width="2"` : `rect width="10" height="10" rx="2" fill="${SERIES[k]}"`}/></svg></span>${esc(s.name)}</li>`).join('')}${spec.folded ? `<li class="muted">+${spec.folded} series omitted (see the table/file)</li>` : ''}</ul>`
    : '';
  const tableRows = spec.series.flatMap((s) => s.pts.map((p) => `<tr>${multi ? `<td>${esc(s.name)}</td>` : ''}<td>${esc(fmt(p.x))}</td><td class="num">${esc(fmt(p.y))}</td>${spec.ci ? `<td class="num">${isNum(p.lo) ? esc(fmt(p.lo)) + '–' + esc(fmt(p.hi)) : ''}</td>` : ''}<td class="num">${p.n}</td></tr>`));
  const desc = `${spec.type === 'line' ? 'Line chart' : 'Bar chart'}: ${spec.y} as a function of ${spec.x}${spec.group ? `, by ${spec.group}` : ''}. ${spec.series.length} series.`;
  return `<figure class="chart" aria-labelledby="${id}-t">
<figcaption id="${id}-t"><strong>${esc(spec.title)}</strong><span class="muted"> · vertical axis: ${esc(spec.y)}${spec.aggregated ? ' (mean per point)' : ''}${spec.ci ? ' · vertical bars: 95% CI reported in the file' : ''}${spec.note ? ' · ' + esc(spec.note) : ''}</span></figcaption>
${legend}
<div class="chart-box"><svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(desc)}" preserveAspectRatio="xMidYMid meet">${parts.join('')}</svg><div class="tip" hidden></div></div>
<details class="datatable"><summary>View data (${tableRows.length} points · source <code>${esc(spec.source)}</code>)</summary><div class="table-wrap" tabindex="0"><table><thead><tr>${multi ? `<th scope="col">${esc(spec.group || 'series')}</th>` : ''}<th scope="col">${esc(spec.x)}</th><th scope="col" class="num">${esc(spec.y)}</th>${spec.ci ? '<th scope="col" class="num">95% CI</th>' : ''}<th scope="col" class="num">aggregated points</th></tr></thead><tbody>${tableRows.join('')}</tbody></table></div></details>
</figure>`;
}

function trunc(s, n) {
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
