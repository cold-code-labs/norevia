// Norevia — one visual identity per experiment run (LAB-001 … LAB-004, simulation).
// Each scene encodes what the run tested, in the site palette (paper, sage, ochre, near-black) plus one accent.
// Animation is SMIL <animate> with values computed here, so it runs inside a cached <img> without JavaScript.
// Every scene is written twice: animated, and a static frame (used through <picture> when the visitor
// prefers reduced motion, and for the Open Graph images). Deterministic: same input, same bytes.
import { rng } from './formation.mjs';

export const PAL = { plum: '#7b4b6a', teal: '#0b6b73', paper: '#f4f3ee', paper2: '#ecebe4', ink: '#101312', sage: '#0e7a62', mint: '#7fdcc2', ochre: '#c98a00', clay: '#c4552d', moss: '#5b7f3a', spruce: '#2f4a46' };
const PS = 0.8; // phase of the static frame
const W = 640, H = 400;
const f1 = (v) => Math.round(v * 10) / 10;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const tri = (x) => { const w = ((x % 1) + 1) % 1; return w < 0.5 ? w * 2 : 2 - w * 2; };
const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u));
const lerp = (a, b, u) => a + (b - a) * u;
const bz2 = (P, Q, R, u) => [lerp(lerp(P[0], Q[0], u), lerp(Q[0], R[0], u), u), lerp(lerp(P[1], Q[1], u), lerp(Q[1], R[1], u), u)];
const bz3 = (P, Q, R, S, u) => { const a = bz2(P, Q, R, u), b = bz2(Q, R, S, u); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
function polyAt(pts, u) {
  const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const t = clamp(u) * len[len.length - 1];
  let i = 1; while (i < pts.length - 1 && len[i] < t) i++;
  const k = (t - len[i - 1]) / (len[i] - len[i - 1] || 1);
  return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
}

// Element factory. props: { attr: (p) => value }, p in [0,1) is the loop phase.
function maker(animated, dur, n = 48) {
  const attrStr = (a) => Object.entries(a).map(([k, v]) => ` ${k}="${v}"`).join('');
  const el = (tag, attrs = {}, props = {}, kids = '', opt = {}) => {
    const d = opt.dur || dur, nn = opt.n || n;
    const base = {}, anims = [];
    for (const [k, fn] of Object.entries(props)) {
      const v = (p) => { const x = fn(p); return typeof x === 'number' ? f1(x) : x; };
      base[k] = v(PS);
      if (animated) anims.push(`<animate attributeName="${k}" begin="-${f1(PS * d)}s" dur="${d}s" repeatCount="indefinite" values="${Array.from({ length: nn + 1 }, (_, i) => v(i / nn)).join(';')}"/>`);
    }
    const a = attrStr({ ...attrs, ...base });
    const inner = kids + anims.join('');
    return inner ? `<${tag}${a}>${inner}</${tag}>` : `<${tag}${a}/>`;
  };
  // discrete step: value changes at time t (0..1 of the loop), back to the first value at the end
  const step = (tag, attrs, attr, from, to, t, kids = '', opt = {}) => {
    const d = opt.dur || dur;
    const a = attrStr({ ...attrs, [attr]: PS >= t && PS < 0.96 ? to : from });
    const an = animated ? `<animate attributeName="${attr}" calcMode="discrete" begin="-${f1(PS * d)}s" dur="${d}s" repeatCount="indefinite" values="${from};${to};${from}" keyTimes="0;${f1(t * 1000) / 1000};0.96"/>` : '';
    return kids || an ? `<${tag}${a}>${kids}${an}</${tag}>` : `<${tag}${a}/>`;
  };
  return { el, step };
}
const svgWrap = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>`;
const line = (d, stroke, w, o, extra = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"${extra}/>`;

// ------------------------------------------------------------------ LAB-001: organic colony vs rigid orchestrated grid, same budget
function lab001(animated) {
  const { el } = maker(animated, 9, 54);
  const r = rng(101), out = [];
  const C = [160, 178], TAU = Math.PI * 2;
  // divider and matched budget meters
  out.push(line('M320 34V330', PAL.ink, 1.2, 0.22, ' stroke-dasharray="3 6"'));
  out.push(`<rect x="60" y="364" width="200" height="6" rx="3" fill="${PAL.ink}" opacity=".1"/><rect x="380" y="364" width="200" height="6" rx="3" fill="${PAL.ink}" opacity=".1"/>`);
  const fill = (x, col) => el('rect', { x, y: 364, height: 6, rx: 3, fill: col }, { width: (p) => 200 * clamp(p / 0.86) });
  out.push(fill(60, PAL.sage), fill(380, PAL.ink));
  // left: the colony
  const trails = [];
  const a0 = -2.55;
  for (let k = 0; k < 3; k++) {
    const t = a0 + k * 2.15 + (r() - 0.5) * 0.3, d = 118 + r() * 24;
    const S = [C[0] + Math.cos(t) * 40, C[1] + Math.sin(t) * 40], F = [C[0] + Math.cos(t) * d, C[1] + Math.sin(t) * d], bend = (r() - 0.5) * 110;
    const M = [(S[0] + F[0]) / 2 - Math.sin(t) * bend, (S[1] + F[1]) / 2 + Math.cos(t) * bend];
    trails.push({ S, M, F, t });
    out.push(line(`M${f1(S[0])} ${f1(S[1])}Q${f1(M[0])} ${f1(M[1])} ${f1(F[0])} ${f1(F[1])}`, PAL.sage, 5, 0.17));
    for (let q = 0; q < 9; q++) { const u = r() * TAU, dd = Math.sqrt(r()) * 14; const x = F[0] + Math.cos(u) * dd, y = F[1] + Math.sin(u) * dd; out.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="3.4" ry="2.2" fill="${PAL.ochre}" transform="rotate(${Math.round(u * 57)} ${f1(x)} ${f1(y)})"/>`); }
  }
  const memb = (R, k) => Array.from({ length: 41 }, (_, i) => { const t = (i / 40) * TAU, rr = R * (1 + 0.06 * Math.sin(3 * t + k) + 0.04 * Math.sin(5 * t - k)); return (i ? 'L' : 'M') + f1(C[0] + Math.cos(t) * rr) + ' ' + f1(C[1] + Math.sin(t) * rr); }).join('') + 'Z';
  out.push(`<path d="${memb(34, 0)}" fill="rgba(16,19,18,.04)" stroke="${PAL.ink}" stroke-opacity=".35" stroke-width="1.2"/>`);
  for (let q = 0; q < 16; q++) { const t = r() * TAU, d = Math.sqrt(r()) * 24; out.push(`<circle cx="${f1(C[0] + Math.cos(t) * d)}" cy="${f1(C[1] + Math.sin(t) * d)}" r="${f1(1 + r() * 1.3)}" fill="${PAL.ink}" opacity=".2"/>`); }
  out.push(el('circle', { cx: C[0], cy: C[1], fill: PAL.sage, opacity: 0.88 }, { r: (p) => 11 + 1.6 * Math.sin(p * TAU * 3) }));
  for (const T of trails) for (let q = 0; q < 4; q++) {
    const ph = q * 0.23 + r() * 0.06;
    const at = (p) => { const u = ease(tri(p + ph)); return bz2(T.S, T.M, T.F, u); };
    out.push(el('circle', { r: 2.6, fill: PAL.ink }, { cx: (p) => at(p)[0], cy: (p) => at(p)[1] }));
  }
  // right: rigid grid orchestrated from one hub, everything pulses in lock-step
  const Hb = [480, 178], gx = 104, gy = 92;
  const nodes = [];
  for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) if (dx || dy) nodes.push([dx * gx, dy * gy]);
  for (const [dx, dy] of nodes) {
    const pts = dx && dy ? [Hb, [Hb[0] + dx, Hb[1]], [Hb[0] + dx, Hb[1] + dy]] : [Hb, [Hb[0] + dx, Hb[1] + dy]];
    out.push(line('M' + pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join('L'), PAL.ink, 1.6, 0.34));
  }
  for (const [dx, dy] of nodes) {
    const pts = dx && dy ? [Hb, [Hb[0] + dx, Hb[1]], [Hb[0] + dx, Hb[1] + dy]] : [Hb, [Hb[0] + dx, Hb[1] + dy]];
    const at = (p) => polyAt(pts, ease(tri(p * 1)) );
    out.push(el('rect', { x: f1(Hb[0] + dx - 7), y: f1(Hb[1] + dy - 7), width: 14, height: 14, rx: 2, fill: PAL.ochre }, { 'fill-opacity': (p) => 0.28 + 0.62 * clamp((tri(p) - 0.85) / 0.15) }));
    out.push(el('rect', { width: 5, height: 5, fill: PAL.ink }, { x: (p) => at(p)[0] - 2.5, y: (p) => at(p)[1] - 2.5 }));
  }
  out.push(`<rect x="${Hb[0] - 16}" y="${Hb[1] - 16}" width="32" height="32" rx="3" fill="${PAL.ink}"/><rect x="${Hb[0] - 6}" y="${Hb[1] - 6}" width="12" height="12" rx="1.5" fill="${PAL.paper}"/>`);
  return svgWrap(out.join(''));
}

// ------------------------------------------------------------------ LAB-002: a controller that never blocks; threads fork only past a threshold
function lab002(animated) {
  const { el } = maker(animated, 9, 72);
  const out = [], C = [150, 200], TAU = Math.PI * 2, TH = 410;
  out.push(line(`M${TH} 40V362`, PAL.ink, 1.2, 0.3, ' stroke-dasharray="3 6"'));
  out.push(`<path d="M${TH - 6} 30h12l-6 10z" fill="${PAL.ink}" opacity=".5"/>`);
  // chat lane: messages flow in continuously and are never held back
  out.push(line('M10 200H122', PAL.ochre, 1.6, 0.35, ' stroke-dasharray="2 6"'));
  for (let q = 0; q < 4; q++) {
    const ph = q / 4;
    const w = (p) => ((p * 2 + ph) % 1 + 1) % 1;
    out.push(el('rect', { y: 196.5, width: 11, height: 7, rx: 3.5, fill: PAL.ochre }, { x: (p) => 10 + 104 * w(p), opacity: (p) => clamp(Math.min(w(p) / 0.12, (1 - w(p)) / 0.12)) }, '', { n: 96 }));
  }
  // acknowledgement pulses leave the controller at once
  for (let q = 0; q < 2; q++) out.push(el('circle', { cx: C[0], cy: C[1], fill: 'none', stroke: PAL.sage, 'stroke-width': 1.6 }, { r: (p) => 28 + 26 * ((p * 3 + q / 2) % 1), opacity: (p) => 0.6 * (1 - ((p * 3 + q / 2) % 1)) }, '', { n: 96 }));
  out.push(`<circle cx="${C[0]}" cy="${C[1]}" r="28" fill="${PAL.paper}" stroke="${PAL.ink}" stroke-width="1.8"/>`);
  out.push(el('circle', { cx: C[0], cy: C[1], fill: PAL.sage }, { r: (p) => 11 + 1.4 * Math.sin(p * TAU * 6) }, '', { n: 96 }));
  const lanes = [
    { y: 76, end: 330, long: false, t0: 0.10 },
    { y: 148, end: 560, long: true, t0: 0.04 },
    { y: 252, end: 560, long: true, t0: 0.14 },
    { y: 324, end: 360, long: false, t0: 0.22 },
  ];
  for (const L of lanes) {
    const S = [C[0] + 28, C[1]], c1 = [C[0] + 70, C[1]], c2 = [226, L.y], E = [240, L.y];
    out.push(line(`M${S[0]} ${S[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${E[0]} ${E[1]}H${L.long ? TH : L.end}`, PAL.sage, 2.6, 0.28));
    const run = L.long ? 0.26 : 0.30; // loop fraction a head needs to reach the threshold / its end
    const head = (p) => {
      const u = clamp((p - L.t0) / run);
      if (u < 0.2) return bz3(S, c1, c2, E, u / 0.2);
      return [lerp(E[0], L.long ? TH : L.end, ease((u - 0.2) / 0.8)), L.y];
    };
    const vis = (p) => (p < L.t0 ? 0 : p > 0.9 ? clamp((0.97 - p) / 0.07) : 1);
    if (!L.long) {
      out.push(el('circle', { r: 4.2, fill: PAL.sage }, { cx: (p) => head(p)[0], cy: (p) => head(p)[1], opacity: (p) => (p > L.t0 + run ? 0 : vis(p)) }));
      out.push(el('g', { transform: `translate(${L.end} ${L.y})` }, { opacity: (p) => (p > L.t0 + run ? vis(p) : 0) }, `<circle r="8" fill="${PAL.paper}" stroke="${PAL.sage}" stroke-width="2"/><path d="M-3.6 .2l2.4 2.6 4.6-5.2" fill="none" stroke="${PAL.sage}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`));
    } else {
      const tc = L.t0 + run; // crossing time
      out.push(el('circle', { r: 4.2, fill: PAL.sage }, { cx: (p) => head(p)[0], cy: (p) => head(p)[1], opacity: (p) => (p > tc ? 0 : vis(p)) }));
      out.push(`<circle cx="${TH}" cy="${L.y}" r="5.5" fill="${PAL.paper}" stroke="${PAL.sage}" stroke-width="2"/>`);
      [-34, 0, 34].forEach((off, i) => {
        const pts = [[TH, L.y], [TH + 34, L.y + off], [L.end, L.y + off]];
        const fade = (p) => (p < tc ? 0 : p > 0.9 ? clamp((0.97 - p) / 0.07) : clamp((p - tc) / 0.04));
        out.push(el('path', { d: 'M' + pts.map((q) => `${q[0]} ${q[1]}`).join('L'), fill: 'none', stroke: PAL.sage, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, { opacity: (p) => 0.34 * fade(p) }));
        const run2 = 0.2, t2 = tc + 0.03 + i * 0.015;
        out.push(el('circle', { r: 3.4, fill: i === 1 ? PAL.ochre : PAL.sage }, { cx: (p) => polyAt(pts, ease((p - t2) / run2))[0], cy: (p) => polyAt(pts, ease((p - t2) / run2))[1], opacity: (p) => (p < t2 ? 0 : p > 0.9 ? clamp((0.97 - p) / 0.07) : 1) }));
      });
    }
  }
  return svgWrap(out.join(''));
}

// ------------------------------------------------------------------ LAB-003: one agent vs package owners, k = 1, 3, 8, 15
function lab003(animated) {
  const { el } = maker(animated, 10, 60);
  const out = [], TAU = Math.PI * 2;
  const clusters = [
    { k: 1, cx: 78, cols: 1 },
    { k: 3, cx: 212, cols: 3 },
    { k: 8, cx: 372, cols: 4 },
    { k: 15, cx: 548, cols: 5 },
  ];
  const SZ = 16, GAP = 9, CAP = 6; // a single agent can emit only about CAP packages before its answer is cut
  out.push(line('M30 336H610', PAL.ink, 1, 0.18));
  let order = 0;
  for (const c of clusters) {
    const rows = Math.ceil(c.k / c.cols), wd = c.cols * SZ + (c.cols - 1) * GAP, x0 = c.cx - wd / 2, y0 = 168;
    const rowH = SZ + 34;
    const pos = Array.from({ length: c.k }, (_, i) => [x0 + (i % c.cols) * (SZ + GAP) + SZ / 2, y0 + Math.floor(i / c.cols) * rowH + SZ / 2]);
    // the single agent on top
    const A = [c.cx, 74];
    pos.forEach((q, i) => { if (i < CAP) out.push(line(`M${A[0]} ${A[1] + 12}L${f1(q[0])} ${f1(q[1] - SZ / 2)}`, PAL.ink, 1, 0.3, ' stroke-dasharray="2 4"')); });
    out.push(`<circle cx="${A[0]}" cy="${A[1]}" r="12" fill="${PAL.paper}" stroke="${PAL.ink}" stroke-width="1.8"/><circle cx="${A[0]}" cy="${A[1]}" r="4.4" fill="${PAL.ink}"/>`);
    if (c.k > CAP) out.push(line(`M${A[0] - 18} ${A[1] + 26}h36`, PAL.clay, 2, 0.8));
    // packages and their owners
    pos.forEach((q, i) => {
      const t = 0.1 + ((order++ * 0.61803) % 1) * 0.48;
      out.push(`<rect x="${f1(q[0] - SZ / 2)}" y="${f1(q[1] - SZ / 2)}" width="${SZ}" height="${SZ}" rx="3" fill="none" stroke="${PAL.ink}" stroke-opacity=".5" stroke-width="1.3"/>`);
      out.push(el('rect', { x: f1(q[0] - SZ / 2 + 1.6), y: f1(q[1] - SZ / 2 + 1.6), width: SZ - 3.2, height: SZ - 3.2, rx: 2, fill: PAL.clay }, { opacity: (p) => (p < t ? 0 : p > 0.9 ? clamp((0.97 - p) / 0.07) : clamp((p - t) / 0.03)) }));
      out.push(line(`M${f1(q[0])} ${f1(q[1] + SZ / 2)}v14`, PAL.sage, 1.4, 0.55));
      out.push(el('circle', { cx: f1(q[0]), cy: f1(q[1] + SZ / 2 + 20), fill: PAL.sage }, { r: (p) => 3.2 + 2.2 * clamp(1 - Math.abs(p - t) / 0.05) }));
    });
  }
  // k markers: as many dots as packages
  for (const c of clusters) for (let i = 0; i < c.k; i++) out.push(`<circle cx="${f1(c.cx + (i - (c.k - 1) / 2) * 6)}" cy="362" r="1.8" fill="${PAL.ink}" opacity=".45"/>`);
  return svgWrap(out.join(''));
}

// ------------------------------------------------------------------ LAB-004: hundreds of agents cover tasks, coverage saturates, then duplicates pile up
function lab004(animated) {
  const { el, step } = maker(animated, 12, 24);
  const r = rng(404), out = [];
  const COLS = 26, ROWS = 12, N = COLS * ROWS, X0 = 30, DX = 22.4, Y0 = 22, DY = 21.6;
  const order = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const solvable = Array.from({ length: N }, () => r() < 0.45);
  const covFrac = (u) => (1 - Math.exp(-3 * u)) / (1 - Math.exp(-3));
  const tOf = (k) => 0.04 + 0.6 * (-Math.log(1 - 0.999 * (k / N) * (1 - Math.exp(-3))) / 3);
  const pos = (i) => [X0 + (i % COLS) * DX, Y0 + Math.floor(i / COLS) * DY];
  const cellT = new Array(N);
  order.forEach((cell, k) => { cellT[cell] = tOf(k + 1); });
  for (let i = 0; i < N; i++) {
    const [x, y] = pos(i);
    out.push(step('circle', { cx: f1(x), cy: f1(y), r: 3.6 }, 'fill', 'rgba(16,19,18,.1)', solvable[i] ? PAL.moss : 'rgba(16,19,18,.55)', cellT[i]));
  }
  // duplicates: rings pile up on cells that are already covered
  const layers = new Array(N).fill(0);
  for (let d = 0; d < 130; d++) {
    const t = 0.56 + (d / 130) * 0.38 + r() * 0.01;
    const cell = order[Math.floor(r() * 220)];
    const [x, y] = pos(cell), rr = 6.2 + layers[cell]++ * 1.9;
    out.push(step('circle', { cx: f1(x), cy: f1(y), r: f1(rr), fill: 'none', 'stroke-width': 1.2, stroke: PAL.clay }, 'stroke-opacity', 0, 0.75, t));
  }
  // curves: coverage (moss) saturates; duplicate calls (clay) keep climbing; dashed line = about 300 agents
  const Lx = 30, Rx = 610, By = 388, Ty = 296;
  const SATX = f1(Lx + (Rx - Lx) * 0.64);
  out.push(line(`M${SATX} 14V${By}`, PAL.ink, 1.1, 0.28, ' stroke-dasharray="3 6"'));
  out.push(line(`M${Lx} ${By}H${Rx}`, PAL.ink, 1, 0.2));
  const cov = Array.from({ length: 49 }, (_, i) => { const u = i / 48, p = 0.04 + u * 0.6; return `${f1(Lx + (Rx - Lx) * p)} ${f1(By - (By - Ty) * covFrac(u))}`; });
  const dup = Array.from({ length: 49 }, (_, i) => { const p = 0.04 + (i / 48) * 0.9; const u = clamp((p - 0.56) / 0.38); return `${f1(Lx + (Rx - Lx) * p)} ${f1(By - 2 - 56 * u * u)}`; });
  const draw = (pts, col, wd) => {
    const L = 760, d = 'M' + pts.join('L');
    const base = `<path d="${d}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${L}"`;
    return animated ? `${base} stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" begin="-9.6s" dur="12s" repeatCount="indefinite" values="${L};0;0;${L}" keyTimes="0;0.94;0.97;1"/></path>` : `${base}/>`;
  };
  out.push(draw(cov, PAL.moss, 3), draw(dup, PAL.clay, 2.4));
  return svgWrap(out.join(''));
}

// ------------------------------------------------------------------ LAB-004 simulation: the swarm scaled from 1k to 100k agents, density turning to heat
function lab004sim(animated) {
  const { el } = maker(animated, 8, 40);
  const r = rng(1000), out = [];
  const lo = [47, 74, 70], mid = [201, 138, 0], hi = [196, 85, 45];
  const mix = (a, b, u) => a.map((v, i) => Math.round(lerp(v, b[i], u)));
  const heat = (u) => { const c = u < 0.55 ? mix(lo, mid, u / 0.55) : mix(mid, hi, (u - 0.55) / 0.45); return `rgb(${c[0]},${c[1]},${c[2]})`; };
  const defs = `<linearGradient id="scan" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${PAL.mint}" stop-opacity="0"/><stop offset=".7" stop-color="${PAL.mint}" stop-opacity=".12"/><stop offset="1" stop-color="${PAL.mint}" stop-opacity=".3"/></linearGradient>` +
    [['hc', PAL.clay], ['ho', PAL.ochre]].map(([id, c]) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".34"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('');
  // heat blooms behind the dense end
  out.push(`<circle cx="560" cy="150" r="150" fill="url(#hc)"/><circle cx="500" cy="262" r="120" fill="url(#ho)"/><circle cx="430" cy="110" r="95" fill="url(#ho)"/>`);
  const pts = [];
  for (let i = 0; i < 640; i++) {
    const u = Math.sqrt(r()), x = 20 + 600 * u, y = 24 + r() * 316;
    pts.push({ x, y, u, rr: 0.9 + u * 1.5 + r() * 0.6 });
  }
  pts.forEach((q, i) => out.push(`<circle cx="${f1(q.x)}" cy="${f1(q.y)}" r="${f1(q.rr)}" fill="${heat(q.u)}" opacity="${f1(0.55 + 0.4 * r())}"/>`));
  // twinkle: a share of the particles flickers
  for (let i = 0; i < 90; i++) {
    const q = pts[Math.floor(r() * pts.length)], ph = r();
    out.push(el('circle', { cx: f1(q.x), cy: f1(q.y), fill: heat(q.u) }, { r: (p) => q.rr * (1 + 0.9 * Math.max(0, Math.sin((p + ph) * Math.PI * 2 * 2))), opacity: (p) => 0.35 + 0.65 * Math.max(0, Math.sin((p + ph) * Math.PI * 2 * 2)) }, '', { n: 32 }));
  }
  out.push(el('rect', { y: 14, width: 90, height: 336, fill: 'url(#scan)' }, { x: (p) => -90 + 740 * p }, '', { n: 40 }));
  // log axis: 1k, 10k, 100k
  out.push(line('M20 372H620', PAL.ink, 1, 0.22));
  [20, 320, 620].forEach((x, i) => out.push(`<path d="M${x} 366v12" stroke="${PAL.ink}" stroke-width="1.6" opacity=".55"/><circle cx="${x}" cy="372" r="${3 + i}" fill="${heat(i / 2)}"/>`));
  return svgWrap(out.join(''), defs);
}


// ------------------------------------------------------------------ LAB-005: five bio mechanisms, each mirrored by a plain engineering twin, converging on the same outcome
function lab005(animated) {
  const { el } = maker(animated, 10, 60);
  const r = rng(505), out = [];
  const CX = 320, ys = [52, 128, 204, 280, 354].map((y) => y - 8);
  out.push(line('M320 18V374', PAL.ink, 1.1, 0.16, ' stroke-dasharray="3 6"'));
  ys.forEach((y, i) => {
    const t0 = 0.04 + i * 0.06, amp = 20 + r() * 18, sgn = i % 2 ? -1 : 1;
    const A = [56, y], B = [CX - 26, y], M = [(A[0] + B[0]) / 2, y + sgn * amp * 2.2];
    const C = [584, y], D = [CX + 26, y];
    // bio twin: curved, organic trail (width varies with the mechanism); engineering twin: straight, uniform
    out.push(line(`M${A[0]} ${A[1]}Q${f1(M[0])} ${f1(M[1])} ${B[0]} ${B[1]}`, PAL.plum, 3 + (i % 3) * 1.6, 0.22));
    out.push(line(`M${C[0]} ${C[1]}H${D[0]}`, PAL.ink, 1.8, 0.3));
    for (let q = 0; q < 6; q++) { const u = r() * TAU2, d = 4 + r() * 10; out.push(`<ellipse cx="${f1(A[0] - 14 + Math.cos(u) * d)}" cy="${f1(A[1] + Math.sin(u) * d)}" rx="3" ry="2" fill="${PAL.ochre}" transform="rotate(${Math.round(u * 57)} ${f1(A[0] - 14 + Math.cos(u) * d)} ${f1(A[1] + Math.sin(u) * d)})"/>`); }
    out.push(`<circle cx="${A[0]}" cy="${A[1]}" r="8" fill="${PAL.plum}" opacity=".85"/><rect x="${C[0] - 8}" y="${C[1] - 8}" width="16" height="16" rx="2.5" fill="${PAL.ink}"/>`);
    const u = (p) => ease((p - t0) / 0.42);
    const vis = (p) => (p < t0 ? 0 : p > 0.9 ? clamp((0.97 - p) / 0.07) : 1);
    out.push(el('circle', { r: 4.2, fill: PAL.plum }, { cx: (p) => bz2(A, M, B, u(p))[0], cy: (p) => bz2(A, M, B, u(p))[1], opacity: vis }));
    out.push(el('rect', { y: C[1] - 3.5, width: 7, height: 7, fill: PAL.ink }, { x: (p) => lerp(C[0], D[0], u(p)) - 3.5, opacity: vis }));
    // the shared outcome: both twins arrive, an equality mark appears
    out.push(`<circle cx="${CX}" cy="${y}" r="15" fill="${PAL.paper}" stroke="${PAL.ink}" stroke-opacity=".4" stroke-width="1.4"/>`);
    out.push(el('g', {}, { opacity: (p) => (p < t0 + 0.42 ? 0.18 : p > 0.9 ? clamp((0.97 - p) / 0.07) * 1 : 1) }, `<path d="M${CX - 6} ${y - 3}h12M${CX - 6} ${y + 3}h12" stroke="${PAL.ink}" stroke-width="2" stroke-linecap="round"/>`));
    out.push(el('circle', { cx: CX, cy: y, fill: 'none', stroke: PAL.plum, 'stroke-width': 1.6 }, { r: (p) => 15 + 16 * clamp((p - t0 - 0.42) / 0.12), opacity: (p) => (p < t0 + 0.42 || p > t0 + 0.54 ? 0 : 0.7 * (1 - (p - t0 - 0.42) / 0.12)) }));
  });
  return svgWrap(out.join(''));
}
const TAU2 = Math.PI * 2;

// ------------------------------------------------------------------ LAB-006: the Allocator as a decision tree that splits only when it pays, plus the cost-per-accepted frontier
function lab006(animated) {
  const { el } = maker(animated, 11, 88);
  const out = [], T = PAL.teal;
  const pts = (P, Q, R, S, n = 14) => Array.from({ length: n + 1 }, (_, i) => bz3(P, Q, R, S, i / n));
  const R0 = [40, 200], D1 = [112, 200];
  const up = pts([128, 200], [168, 200], [168, 96], [212, 96]), dn = pts([128, 200], [168, 200], [168, 300], [212, 300]);
  const SOLO = [236, 96], OWN = [232, 300], REP = [304, 300], STOP = [364, 300];
  // panel for the frontier
  out.push(`<rect x="396" y="30" width="232" height="340" rx="18" fill="#fbfaf6" stroke="${PAL.ink}" stroke-opacity=".12"/>`);
  // tree: edges
  const edge = (d, o = 0.3, w = 2.2) => line(d, T, w, o);
  out.push(edge('M47 200H96'), edge('M128 200C168 200 168 96 212 96'), edge('M128 200C168 200 168 300 212 300'), edge('M252 96H318'), edge('M256 300H287'), edge('M321 300H348'));
  // budget ceiling bracket above the team path, and the gate before the end
  out.push(line('M196 258V250H384V258', T, 1.5, 0.55, ' stroke-dasharray="4 5"'));
  // decision diamond: parts < 3 ?
  out.push(`<path d="M${D1[0]} ${D1[1] - 17}L${D1[0] + 17} ${D1[1]}L${D1[0]} ${D1[1] + 17}L${D1[0] - 17} ${D1[1]}Z" fill="${PAL.paper}" stroke="${PAL.ink}" stroke-width="1.8"/><circle cx="${D1[0]}" cy="${D1[1]}" r="3.4" fill="${PAL.ink}"/>`);
  out.push(`<circle cx="${R0[0]}" cy="${R0[1]}" r="7" fill="${PAL.ink}"/>`);
  // solo leaf: one agent
  out.push(`<circle cx="${SOLO[0]}" cy="${SOLO[1]}" r="20" fill="${PAL.paper}" stroke="${T}" stroke-width="2"/><circle cx="${SOLO[0]}" cy="${SOLO[1]}" r="6" fill="${T}"/>`);
  // owners: one per part, in parallel
  const own = [[-9, 8], [9, 8], [0, -10]].map(([dx, dy]) => [OWN[0] + dx, OWN[1] + dy]);
  out.push(`<circle cx="${OWN[0]}" cy="${OWN[1]}" r="24" fill="${PAL.paper}" stroke="${T}" stroke-width="2"/>`);
  own.forEach(([x, y], i) => out.push(el('circle', { cx: x, cy: y, r: 5.4, fill: T }, { 'fill-opacity': (p) => 0.25 + 0.75 * clamp((p - 0.34 - i * 0.015) / 0.04) * (p > 0.92 ? clamp((0.99 - p) / 0.07) : 1) })));
  // repair loop: a spinning arc that ends in a check
  out.push(`<circle cx="${REP[0]}" cy="${REP[1]}" r="19" fill="${PAL.paper}" stroke="${T}" stroke-opacity=".45" stroke-width="1.6"/>`);
  out.push(el('g', {}, { transform: (p) => `rotate(${f1(900 * clamp((p - 0.44) / 0.22))} ${REP[0]} ${REP[1]})`, opacity: (p) => (p > 0.66 && p < 0.9 ? 0.12 : 1) }, `<path d="M${REP[0] + 12} ${REP[1]}A12 12 0 1 1 ${REP[0]} ${REP[1] - 12}" fill="none" stroke="${T}" stroke-width="2.4" stroke-linecap="round"/><path d="M${REP[0] - 3} ${REP[1] - 16}l5 4-5 4" fill="none" stroke="${T}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`));
  out.push(el('path', { d: `M${REP[0] - 6} ${REP[1] + 0.5}l4.4 4.6 8-9.4`, fill: 'none', stroke: PAL.moss, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, { opacity: (p) => (p < 0.66 ? 0 : p > 0.92 ? clamp((0.99 - p) / 0.07) : 1) }));
  // active stop
  out.push(el('circle', { cx: STOP[0], cy: STOP[1], fill: 'none', stroke: T, 'stroke-width': 1.8 }, { r: (p) => 16 + 18 * clamp((p - 0.74) / 0.14), opacity: (p) => (p < 0.74 || p > 0.88 ? 0 : 0.7 * (1 - (p - 0.74) / 0.14)) }));
  out.push(`<path d="M${STOP[0] - 7} ${STOP[1] - 17}h14l10 10v14l-10 10h-14l-10-10v-14z" fill="${T}"/><rect x="${STOP[0] - 6}" y="${STOP[1] - 6}" width="12" height="12" rx="1.5" fill="${PAL.paper}"/>`);
  // solo done
  out.push(el('g', { transform: 'translate(334 96)' }, { opacity: (p) => (p < 0.46 ? 0 : p > 0.92 ? clamp((0.99 - p) / 0.07) : 1) }, `<circle r="9" fill="${PAL.paper}" stroke="${PAL.moss}" stroke-width="2"/><path d="M-4 .4l2.8 3 5.6-6.4" fill="none" stroke="${PAL.moss}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`));
  // tokens: a small task (solo path) and a large task (team path)
  const poly = [[R0[0], 200], [128, 200], ...dn.slice(1), [256, 300], [321, 300], [STOP[0] - 14, 300]];
  const polyS = [[R0[0], 200], [128, 200], ...up.slice(1), [252, 96], [318, 96]];
  const vis = (a, b) => (p) => (p < a ? 0 : p > 0.9 ? clamp((0.97 - p) / 0.07) : p > b ? 0 : 1);
  out.push(el('circle', { r: 4, fill: PAL.ink }, { cx: (p) => polyAt(polyS, ease((p - 0.04) / 0.4))[0], cy: (p) => polyAt(polyS, ease((p - 0.04) / 0.4))[1], opacity: vis(0.04, 0.45) }));
  out.push(el('rect', { width: 11, height: 11, rx: 2.5, fill: PAL.ochre }, { x: (p) => polyAt(poly, ease((p - 0.1) / 0.66))[0] - 5.5, y: (p) => polyAt(poly, ease((p - 0.1) / 0.66))[1] - 5.5, opacity: vis(0.1, 0.78) }));
  // frontier: cost per accepted (left = cheaper) against acceptance (up = better)
  const gx = 412, gy = 330;
  [90, 170, 250].forEach((y) => out.push(line(`M${gx} ${y}H612`, PAL.ink, 1, 0.08)));
  out.push(line(`M${gx} 56V${gy}H612`, PAL.ink, 1.4, 0.35));
  out.push(`<path d="M${gx - 4} 64l4-8 4 8M604 ${gy - 4}l8 4-8 4" fill="none" stroke="${PAL.ink}" stroke-width="1.4" opacity=".35"/>`);
  const P = { team: [577, 257], solo: [494, 282], orch: [453, 70], alloc: [440, 132], split: [446, 128] };
  const show = (t) => (p) => (p < t ? 0 : p > 0.94 ? clamp((1.0 - p) / 0.06) : 1);
  out.push(el('path', { d: `M${gx + 2} 330V132H440V70H453`, fill: 'none', stroke: T, 'stroke-width': 2, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, { opacity: (p) => 0.7 * show(0.62)(p) }));
  out.push(el('circle', { cx: P.team[0], cy: P.team[1], r: 6.5, fill: PAL.paper, stroke: PAL.ink, 'stroke-width': 2 }, { opacity: show(0.5) }));
  out.push(el('circle', { cx: P.solo[0], cy: P.solo[1], r: 6.5, fill: PAL.paper, stroke: PAL.ink, 'stroke-width': 2 }, { opacity: show(0.54) }));
  out.push(el('circle', { cx: P.orch[0], cy: P.orch[1], r: 6.5, fill: PAL.paper, stroke: PAL.ink, 'stroke-width': 2 }, { opacity: show(0.58) }));
  out.push(el('circle', { cx: P.split[0], cy: P.split[1], r: 3.4, fill: PAL.ink, 'fill-opacity': 0.5 }, { opacity: show(0.62) }));
  out.push(el('g', {}, { opacity: show(0.66) }, `<circle cx="${P.alloc[0]}" cy="${P.alloc[1]}" r="14" fill="${T}" opacity=".18"/><circle cx="${P.alloc[0]}" cy="${P.alloc[1]}" r="8" fill="${T}"/>`));
  return svgWrap(out.join(''));
}

export const RUN_ART = {
  lab001: {
    accent: PAL.ochre, build: lab001,
    alt: 'Two formations at the same budget: on the left an organic colony whose ants walk curved trails to seed clusters; on the right a rigid grid where a central hub sends synchronised pulses to fixed nodes. Two equal bars below show the matched budget.',
  },
  lab002: {
    accent: PAL.sage, build: lab002,
    alt: 'A central controller receives a continuous stream of chat messages that is never blocked; it starts one thread per request. Short threads finish before a dashed threshold line, long threads fork into three child threads only after crossing it.',
  },
  lab003: {
    accent: PAL.clay, build: lab003,
    alt: 'One agent against package owners for k = 1, 3, 8 and 15 packages. The single agent reaches only the first few packages with dashed lines while a separate owner takes each package, so every package is filled as k grows.',
  },
  lab005: {
    accent: PAL.plum, build: lab005,
    alt: 'Five mirrored pairs. In each row a curved, organic bio-inspired trail on the left and a straight engineering control on the right converge on the same outcome in the middle, marked by an equality sign.',
  },
  lab006: {
    accent: PAL.teal, build: lab006,
    alt: 'The Norevia Allocator as a decision tree: a task reaches a decision diamond; a small task goes solo, a large task is split into one owner per part, repaired while checks fail and stopped as soon as everything passes, under a budget ceiling. On the right, a cost-per-accepted and acceptance frontier with the Allocator at its cheap end.',
  },
  lab004: {
    accent: PAL.moss, build: lab004,
    alt: 'A field of about 300 tasks fills with green as agents cover them, then stops growing as coverage saturates; later agents land on tasks that are already covered and pile up duplicate rings. A curve below shows coverage flattening while duplicates keep climbing.',
  },
  'lab004-sim': {
    accent: PAL.spruce, build: lab004sim,
    alt: 'A particle field that grows denser and hotter from left to right, from 1,000 to 100,000 simulated agents on a log axis, with a light band scanning across it.',
  },
};

// URLs of the written files (hashed names), filled in by build.mjs
export const ART_URLS = {};

export function artSvg(key, animated = true) {
  const a = RUN_ART[key];
  if (!a) throw new Error('unknown run art: ' + key);
  return a.build(animated);
}

// <picture>: animated SVG, static frame for prefers-reduced-motion. `cls` goes on the <img>.
export function artPicture(key, { cls = 'run-art', alt = true, w = 640, h = 400, loading = 'lazy' } = {}) {
  const a = RUN_ART[key];
  const altText = alt ? a.alt.replace(/"/g, '&quot;') : '';
  return `<picture><source media="(prefers-reduced-motion: reduce)" srcset="${ART_URLS[key]?.stat || `/assets/run-${key}.static.svg`}"><img class="${cls}" src="${ART_URLS[key]?.anim || `/assets/run-${key}.svg`}" alt="${altText}"${alt ? '' : ' aria-hidden="true"'} width="${w}" height="${h}" decoding="async" loading="${loading}"></picture>`;
}
