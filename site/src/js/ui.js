// Shared UI helpers for page bundles (inlined by build.mjs; `export` is stripped).
export const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const SVGNS = 'http://www.w3.org/2000/svg';
export const COLORS = { mint: '#0e7a62', amber: '#c98a00', rose: '#d03b3b', blue: '#2a78d6', violet: '#6250d6', focus: '#e2572b', ink2: '#3d4340' };
export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}
export function pct(x, d = 1) { return (100 * x).toFixed(d) + '%'; }
export function num(x, d = 2) { return Number(x).toFixed(d); }
// Paint the filled part of a range track (WebKit) through a CSS variable.
export function fillRange(input) {
  const f = ((+input.value - +input.min) / (+input.max - +input.min)) * 100;
  input.style.setProperty('--fill', f + '%');
}
export function bindRanges(form, onChange, fmts = {}) {
  const read = () => {
    const v = {};
    for (const inp of form.querySelectorAll('input[type=range]')) {
      v[inp.name] = +inp.value;
      fillRange(inp);
      const out = form.querySelector(`[data-out="${inp.name}"]`);
      if (out) out.textContent = fmts[inp.name] ? fmts[inp.name](+inp.value) : inp.value;
    }
    return v;
  };
  form.addEventListener('input', () => onChange(read()));
  form.addEventListener('submit', (e) => e.preventDefault());
  return read;
}
export function niceTicks(min, max, count = 5) {
  if (min === max) { const d = Math.abs(min) || 1; min -= d / 2; max += d / 2; }
  const span = max - min, step0 = span / count, mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count + 0.5);
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step / 1e6; v += step) out.push(+v.toFixed(10));
  return out;
}
// Minimal live line chart (one y-axis; thin marks; crosshair tooltip). Series: {name, pts:[[x,y]], color, cls}.
export function lineChart(host, { W = 640, H = 280, x: [x0, x1], y: [y0, y1], xLabel = '', yFmt = (v) => v, xFmt = (v) => v, xTicks, yTicks, logX = false, ariaLabel = '' }) {
  const m = { t: 14, r: 18, b: 40, l: 54 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  host.style.position = 'relative';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'live lc', role: 'img', 'aria-label': ariaLabel });
  host.appendChild(svg);
  const tip = document.createElement('div'); tip.className = 'ltip'; tip.hidden = true; host.appendChild(tip);
  const tx = (v) => (logX ? Math.log10(v) : v);
  let Y0 = y0, Y1 = y1;
  const X = (v) => m.l + ((tx(v) - tx(x0)) / (tx(x1) - tx(x0))) * iw;
  const Y = (v) => m.t + ih - ((v - Y0) / (Y1 - Y0)) * ih;
  const gAxes = el('g', {}, svg), gBand = el('g', {}, svg), gRef = el('g', {}, svg), gSer = el('g', {}, svg), gMk = el('g', {}, svg), gHl = el('g', {}, svg);
  const cross = el('line', { class: 'cross', y1: m.t, y2: m.t + ih, visibility: 'hidden' }, svg);
  const hit = el('rect', { class: 'hitzone', x: m.l, y: m.t, width: iw, height: ih }, svg);
  let last = { series: [] };
  function axes() {
    gAxes.textContent = '';
    for (const t of yTicks || niceTicks(Y0, Y1, 5)) {
      if (t < Y0 - 1e-9 || t > Y1 + 1e-9) continue;
      el('line', { class: 'gl', x1: m.l, x2: m.l + iw, y1: Y(t), y2: Y(t) }, gAxes);
      el('text', { class: 'tk', x: m.l - 8, y: Y(t) + 4, 'text-anchor': 'end' }, gAxes).textContent = yFmt(t);
    }
    for (const t of xTicks || niceTicks(x0, x1, 6)) {
      el('text', { class: 'tk', x: X(t), y: m.t + ih + 18, 'text-anchor': 'middle' }, gAxes).textContent = xFmt(t);
    }
    el('line', { class: 'ax', x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih }, gAxes);
    if (xLabel) el('text', { class: 'axl', x: m.l + iw / 2, y: H - 4, 'text-anchor': 'middle' }, gAxes).textContent = xLabel;
  }
  axes();
  const paths = new Map();
  function update({ series = [], refs = [], marks = [], hl = null, band = null, yDomain = null }) {
    if (yDomain && (yDomain[0] !== Y0 || yDomain[1] !== Y1)) { Y0 = yDomain[0]; Y1 = yDomain[1]; axes(); }
    last = { series };
    gBand.textContent = '';
    if (band) el('rect', { class: 'band', x: X(band[0]), width: Math.max(0, X(band[1]) - X(band[0])), y: m.t, height: ih }, gBand);
    gRef.textContent = '';
    for (const r of refs) {
      if (!Number.isFinite(r.y)) continue;
      const yy = Math.max(m.t, Math.min(m.t + ih, Y(r.y)));
      el('line', { class: 's ' + (r.cls || 'dash'), x1: m.l, x2: m.l + iw, y1: yy, y2: yy, stroke: r.color }, gRef);
      if (r.label) el('text', { class: 'lab', x: m.l + iw - 4, y: yy - 6, 'text-anchor': 'end' }, gRef).textContent = r.label;
    }
    const seen = new Set();
    for (const s of series) {
      seen.add(s.name);
      let p = paths.get(s.name);
      if (!p) { p = el('path', { class: 's ' + (s.cls || ''), stroke: s.color }, gSer); paths.set(s.name, p); }
      p.setAttribute('d', s.pts.filter((q) => Number.isFinite(q[1])).map((q, i) => `${i ? 'L' : 'M'}${X(q[0]).toFixed(1)},${Y(Math.max(Y0, Math.min(Y1, q[1]))).toFixed(1)}`).join(''));
    }
    for (const [k, p] of paths) if (!seen.has(k)) { p.remove(); paths.delete(k); }
    gMk.textContent = '';
    for (const mk of marks) {
      if (!Number.isFinite(mk.y)) continue;
      el('circle', { class: 'mk', cx: X(mk.x), cy: Y(Math.max(Y0, Math.min(Y1, mk.y))), r: mk.r || 5, fill: mk.color }, gMk);
      if (mk.label) el('text', { class: 'lab', x: X(mk.x) + (mk.dx ?? 9), y: Y(Math.max(Y0, Math.min(Y1, mk.y))) + (mk.dy ?? -8), 'text-anchor': mk.anchor || 'start' }, gMk).textContent = mk.label;
    }
    gHl.textContent = '';
    if (hl != null) el('line', { class: 'cross', x1: X(hl), x2: X(hl), y1: m.t, y2: m.t + ih, style: 'stroke:#e2572b;stroke-dasharray:none;opacity:.6' }, gHl);
  }
  function show(ev) {
    if (!last.series.length) return;
    const b = svg.getBoundingClientRect();
    const px = ((ev.clientX - b.left) / b.width) * W;
    let best = null;
    for (const s of last.series) for (const q of s.pts) { const d = Math.abs(X(q[0]) - px); if (!best || d < best.d) best = { d, x: q[0] }; }
    if (!best) return;
    const rows = last.series.map((s) => { const q = s.pts.find((p) => p[0] === best.x); return q && Number.isFinite(q[1]) ? `${s.name}: ${yFmt(q[1], true)}` : null; }).filter(Boolean);
    cross.setAttribute('x1', X(best.x)); cross.setAttribute('x2', X(best.x)); cross.setAttribute('visibility', 'visible');
    tip.innerHTML = '';
    const h = document.createElement('strong'); h.textContent = `${xLabel.split(' (')[0] || 'x'} = ${xFmt(best.x)}`; tip.appendChild(h);
    for (const r of rows) { tip.appendChild(document.createElement('br')); tip.appendChild(document.createTextNode(r)); }
    tip.hidden = false;
    tip.style.left = Math.min(Math.max((X(best.x) / W) * b.width, 80), b.width - 80) + 'px';
    tip.style.top = (m.t / H) * b.height + 'px';
  }
  hit.addEventListener('pointermove', show);
  hit.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); });
  return { update, svg, X, Y, setLabel: (t) => svg.setAttribute('aria-label', t) };
}
// requestAnimationFrame loop that pauses when the element is off-screen or the tab is hidden.
export function loop(elm, frame) {
  let visible = true, running = true, raf = 0;
  const tick = (t) => { raf = 0; if (!running || !visible || document.hidden) return; frame(t); raf = requestAnimationFrame(tick); };
  const kick = () => { if (!raf && running && visible && !document.hidden) raf = requestAnimationFrame(tick); };
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; kick(); }).observe(elm);
  document.addEventListener('visibilitychange', kick);
  kick();
  return { set running(v) { running = v; kick(); }, get running() { return running; } };
}
