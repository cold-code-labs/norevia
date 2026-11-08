// Norevia — landing page interactions. Vanilla, dependency-free.
// Living illustrations, all generative and all illustrations (not results):
//   hero      — an ant colony that forages by stigmergy: pheromone trails emerge, reinforce and evaporate;
//   slime     — an agent-based approximation of a Physarum (slime mould) transport network;
//   stages    — sense → recruit (waggle dance) → decide (quorum) → dissolve, drawn as insects with trails;
//   soon      — the colony spells "Soon".
// html.js / html.rm, [data-words], .u and the menu come from src/js/unfold.js (prepended at build time).
(() => {
  'use strict';
  const doc = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const css = (k, d) => getComputedStyle(doc).getPropertyValue(k).trim() || d;
  const INK = css('--ink', '#101312'), ACC = css('--accent', '#0e7a62'), PAPER = css('--paper', '#f4f3ee'), HONEY = css('--honey', '#c98a00');
  const small = () => innerWidth < 860;

  // ------------------------------------------------------------ shared: canvas sizing + visibility-driven loop
  function fit(canvas) {
    const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d);
    const g = canvas.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    return { g, w: r.width, h: r.height };
  }
  function runWhileVisible(canvas, frame) {
    let raf = null, vis = true;
    const go = () => { if (raf || !vis || document.hidden || RM) return; const loop = (t) => { raf = null; if (!vis || document.hidden) return; frame(t); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; go(); }, { rootMargin: '100px' }).observe(canvas);
    document.addEventListener('visibilitychange', go);
    return go;
  }
  const pointer = (canvas) => { const m = { x: -1e4, y: -1e4 }; canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; }, { passive: true }); canvas.addEventListener('pointerleave', () => { m.x = m.y = -1e4; }); return m; };
  // an insect seen from above: abdomen, thorax, head, oriented along its heading
  function insect(g, x, y, a, s, col, carry) {
    const c = Math.cos(a), si = Math.sin(a);
    g.fillStyle = col;
    g.beginPath(); g.ellipse(x - c * s * 1.1, y - si * s * 1.1, s * 1.15, s * 0.62, a, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x, y, s * 0.55, s * 0.4, a, 0, TAU); g.fill();
    g.beginPath(); g.arc(x + c * s * 0.85, y + si * s * 0.85, s * 0.42, 0, TAU); g.fill();
    if (carry) { g.fillStyle = HONEY; g.beginPath(); g.arc(x + c * s * 1.7, y + si * s * 1.7, s * 0.55, 0, TAU); g.fill(); }
  }
  function blob(g, x, y, r, t, k = 1) { // a breathing membrane
    g.beginPath();
    for (let i = 0; i <= 48; i++) { const th = (i / 48) * TAU, rr = r * (1 + 0.05 * k * Math.sin(3 * th + t) + 0.035 * k * Math.sin(5 * th - 1.3 * t) + 0.02 * Math.sin(8 * th + 0.7 * t)); const px = x + Math.cos(th) * rr, py = y + Math.sin(th) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.closePath();
  }

  // ------------------------------------------------------------ hero: an ant colony foraging by stigmergy
  const heroC = document.querySelector('[data-swarm="hero"]');
  if (heroC) {
    const copy = document.querySelector('.hero-copy');
    const m = pointer(heroC);
    const CELL = 5, EVAP = 0.982;
    let V, gw, gh, toFood, toHome, off, offG, img, nest, foods, ants, t0 = performance.now(), delivered = 0;
    const layout = () => {
      V = fit(heroC);
      const sm = small(), room = sm ? Math.max(140, copy.offsetTop + copy.parentNode.offsetTop - 68) : 0;
      const R = sm ? Math.min(V.w * 0.12, room * 0.14) : Math.min(V.w * 0.05, V.h * 0.08);
      nest = { x: sm ? V.w * 0.5 : V.w * 0.72, y: sm ? 68 + room * 0.55 : V.h * 0.52, r: Math.max(18, R) };
      gw = Math.ceil(V.w / CELL); gh = Math.ceil(V.h / CELL);
      toFood = new Float32Array(gw * gh); toHome = new Float32Array(gw * gh);
      off = document.createElement('canvas'); off.width = gw; off.height = gh; offG = off.getContext('2d'); img = offG.createImageData(gw, gh);
      const spread = sm ? Math.min(V.w * 0.42, room * 0.45) : Math.min(V.w * 0.24, V.h * 0.38);
      foods = [0.2, 2.3, 4.2].map((a) => ({ x: nest.x + Math.cos(a) * spread * rand(0.9, 1.15), y: nest.y + Math.sin(a) * spread * rand(0.8, 1.05) * (sm ? 0.7 : 1), amount: 220, seeds: seeds() }));
      const n = sm ? 260 : 520;
      ants = Array.from({ length: n }, () => ({ x: nest.x + rand(-6, 6), y: nest.y + rand(-6, 6), a: rand(0, TAU), carry: false, str: 1 }));
      for (let i = 0; i < (RM ? 900 : 420); i++) step(i * 16);
    };
    function seeds() { return Array.from({ length: 16 }, () => [rand(0, TAU), Math.sqrt(Math.random()) * 11, rand(1.6, 3.2)]); }
    const idx = (x, y) => { const i = (x / CELL) | 0, j = (y / CELL) | 0; return i < 0 || j < 0 || i >= gw || j >= gh ? -1 : j * gw + i; };
    const sense = (map, x, y) => { const k = idx(x, y); return k < 0 ? -1 : map[k]; };
    function step(t) {
      for (const p of ants) {
        const map = p.carry ? toHome : toFood, D = 11;
        const l = sense(map, p.x + Math.cos(p.a - 0.6) * D, p.y + Math.sin(p.a - 0.6) * D);
        const c = sense(map, p.x + Math.cos(p.a) * D, p.y + Math.sin(p.a) * D);
        const r = sense(map, p.x + Math.cos(p.a + 0.6) * D, p.y + Math.sin(p.a + 0.6) * D);
        if (c >= l && c >= r) { /* keep heading */ } else if (l > r) p.a -= 0.28; else p.a += 0.28;
        p.a += rand(-0.22, 0.22);
        // goal-directed bias: the nest smell when carrying; food smell close to a source
        if (p.carry) { const ga = Math.atan2(nest.y - p.y, nest.x - p.x); p.a += Math.sin(ga - p.a) * 0.06; }
        else for (const f of foods) { const dx = f.x - p.x, dy = f.y - p.y; if (f.amount > 0 && dx * dx + dy * dy < 1800) { p.a += Math.sin(Math.atan2(dy, dx) - p.a) * 0.25; break; } }
        // a passing shadow (the pointer): ants steer away
        const mx = p.x - m.x, my = p.y - m.y; if (mx * mx + my * my < 3600) p.a += Math.sin(Math.atan2(my, mx) - p.a) * 0.3;
        p.x += Math.cos(p.a) * 1.15; p.y += Math.sin(p.a) * 1.15;
        if (p.x < 2 || p.x > V.w - 2) { p.a = Math.PI - p.a; p.x = clamp(p.x, 2, V.w - 2); }
        if (p.y < 80 || p.y > V.h - 2) { p.a = -p.a; p.y = clamp(p.y, 80, V.h - 2); } // stay below the top bar
        const k = idx(p.x, p.y);
        if (k >= 0) { if (p.carry) toFood[k] = Math.min(4, toFood[k] + p.str); else toHome[k] = Math.min(4, toHome[k] + p.str * 0.6); }
        p.str *= 0.993;
        if (!p.carry) for (const f of foods) { const dx = f.x - p.x, dy = f.y - p.y; if (f.amount > 0 && dx * dx + dy * dy < 160) { p.carry = true; f.amount--; p.a += Math.PI; p.str = 1; break; } }
        else { const dx = nest.x - p.x, dy = nest.y - p.y; if (dx * dx + dy * dy < nest.r * nest.r) { p.carry = false; p.a += Math.PI; p.str = 1; delivered++; } }
        if (!p.carry && Math.hypot(nest.x - p.x, nest.y - p.y) < nest.r) p.str = 1;
      }
      for (let i = 0; i < toFood.length; i++) { toFood[i] *= EVAP; toHome[i] *= EVAP; }
      // exhausted sources fade; the colony keeps three alive somewhere new
      for (const f of foods) if (f.amount <= 0) f.dead = (f.dead || 0) + 1;
      foods = foods.filter((f) => !(f.dead > 240));
      while (foods.length < 3) { const a = rand(0, TAU), d = Math.min(V.w, V.h) * rand(0.18, 0.34); foods.push({ x: clamp(nest.x + Math.cos(a) * d, 30, V.w - 30), y: clamp(nest.y + Math.sin(a) * d, 90, V.h - 30), amount: 220, seeds: seeds() }); }
    }
    function draw(t) {
      const g = V.g, k = (t - t0) / 1000; g.clearRect(0, 0, V.w, V.h);
      // pheromone field: trail to food in leaf green, trail home in honey
      const d = img.data;
      for (let i = 0; i < toFood.length; i++) {
        const f = Math.min(1, toFood[i] * 0.55), h = Math.min(1, toHome[i] * 0.35), a = Math.max(f, h * 0.55), o = i * 4;
        d[o] = f >= h ? 14 : 201; d[o + 1] = f >= h ? 122 : 138; d[o + 2] = f >= h ? 98 : 0; d[o + 3] = a * 150;
      }
      offG.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.filter = 'blur(2px)'; g.drawImage(off, 0, 0, V.w, V.h); g.filter = 'none';
      // food: clusters of seeds that shrink as the colony carries them home
      for (const f of foods) {
        const life = clamp(f.amount / 220, 0, 1), fade = f.dead ? 1 - f.dead / 240 : 1;
        g.globalAlpha = 0.85 * fade;
        for (const [a, r, s] of f.seeds) { if (Math.random() > life + 0.15 && f.amount < 200) continue; g.fillStyle = HONEY; g.beginPath(); g.ellipse(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, s, s * 0.65, a, 0, TAU); g.fill(); }
        g.globalAlpha = 1;
      }
      // nest: a breathing membrane with chambers
      g.fillStyle = 'rgba(16,19,18,0.05)'; g.strokeStyle = 'rgba(16,19,18,0.35)'; g.lineWidth = 1.2;
      blob(g, nest.x, nest.y, nest.r * 1.25, k * 0.9); g.fill(); g.stroke();
      g.fillStyle = 'rgba(14,122,98,0.85)'; blob(g, nest.x, nest.y, nest.r * 0.42, k * 1.4, 1.6); g.fill();
      // ants
      for (const p of ants) insect(g, p.x, p.y, p.a, 1.55, INK, p.carry);
    }
    heroC.addEventListener('pointerdown', (e) => {
      const r = heroC.getBoundingClientRect();
      foods.push({ x: e.clientX - r.left, y: e.clientY - r.top, amount: 220, seeds: seeds() });
      if (foods.length > 6) foods.shift();
      if (RM) { for (let i = 0; i < 300; i++) step(i); draw(performance.now()); }
    });
    layout();
    const go = runWhileVisible(heroC, (t) => { step(t); draw(t); });
    if (RM) draw(performance.now()); else go();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); RM ? draw(performance.now()) : go(); }, 200); });
  }

  // ------------------------------------------------------------ slime mould: agent-based approximation of a Physarum network
  const slimeC = document.querySelector('[data-slime]');
  if (slimeC) {
    let V, gw, gh, trail, tmp, off, offG, img, agents, nodes;
    const SCALE = 3, SA = 0.55, SO = 9, RA = 0.45, DEP = 0.6, DECAY = 0.86;
    const layout = () => {
      V = fit(slimeC); gw = Math.ceil(V.w / SCALE); gh = Math.ceil(V.h / SCALE);
      trail = new Float32Array(gw * gh); tmp = new Float32Array(gw * gh);
      off = document.createElement('canvas'); off.width = gw; off.height = gh; offG = off.getContext('2d'); img = offG.createImageData(gw, gh);
      const n = Math.min(14000, Math.round(gw * gh * 0.16));
            agents = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { agents[i * 3] = rand(1, gw - 2); agents[i * 3 + 1] = rand(1, gh - 2); agents[i * 3 + 2] = rand(0, TAU); } // spread like a plasmodium over the dish
      // food sources scattered like towns on a map
      const k = small() ? 7 : 11; nodes = [];
      for (let i = 0; i < k * 8 && nodes.length < k; i++) { const x = rand(0.07, 0.93) * gw, y = rand(0.12, 0.88) * gh; if (nodes.every((q) => Math.hypot(q.x - x, q.y - y) > Math.min(gw, gh) * 0.22)) nodes.push({ x, y }); }
      for (let i = 0; i < (RM ? 400 : 90); i++) step();
    };
    const at = (x, y) => { const i = x | 0, j = y | 0; return i < 0 || j < 0 || i >= gw || j >= gh ? 0 : trail[j * gw + i]; };
    function step() {
      const n = agents.length / 3;
      for (let i = 0; i < n; i++) {
        let x = agents[i * 3], y = agents[i * 3 + 1], a = agents[i * 3 + 2];
        const f = at(x + Math.cos(a) * SO, y + Math.sin(a) * SO), l = at(x + Math.cos(a - SA) * SO, y + Math.sin(a - SA) * SO), r = at(x + Math.cos(a + SA) * SO, y + Math.sin(a + SA) * SO);
        if (f > l && f > r) { /* straight */ } else if (f < l && f < r) a += Math.random() < 0.5 ? RA : -RA; else if (l > r) a -= RA; else if (r > l) a += RA;
        x += Math.cos(a); y += Math.sin(a);
        if (x < 1 || x > gw - 2 || y < 1 || y > gh - 2) { a = rand(0, TAU); x = clamp(x, 1, gw - 2); y = clamp(y, 1, gh - 2); }
        agents[i * 3] = x; agents[i * 3 + 1] = y; agents[i * 3 + 2] = a;
        trail[(y | 0) * gw + (x | 0)] += DEP;
      }
      for (const q of nodes) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const k = ((q.y | 0) + dy) * gw + (q.x | 0) + dx; if (k >= 0 && k < trail.length) trail[k] += 3; }
      // diffuse (3x3 mean) and decay
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const k = y * gw + x;
        tmp[k] = DECAY * (trail[k - gw - 1] + trail[k - gw] + trail[k - gw + 1] + trail[k - 1] + trail[k] + trail[k + 1] + trail[k + gw - 1] + trail[k + gw] + trail[k + gw + 1]) / 9;
      }
      const s = trail; trail = tmp; tmp = s;
    }
    function draw(t) {
      const d = img.data;
      for (let i = 0; i < trail.length; i++) { const v = Math.min(1, trail[i] / 6), o = i * 4; d[o] = 14 + (1 - v) * 40; d[o + 1] = 122 - (1 - v) * 20; d[o + 2] = 98 - (1 - v) * 30; d[o + 3] = Math.pow(v, 0.8) * 235; }
      offG.putImageData(img, 0, 0);
      const g = V.g; g.clearRect(0, 0, V.w, V.h); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, V.w, V.h);
      for (const q of nodes) { g.fillStyle = HONEY; blob(g, q.x * SCALE, q.y * SCALE, 7, (t || 0) / 700 + q.x, 1.4); g.fill(); }
    }
    slimeC.addEventListener('pointerdown', (e) => { const r = slimeC.getBoundingClientRect(); nodes.push({ x: (e.clientX - r.left) / SCALE, y: (e.clientY - r.top) / SCALE }); if (nodes.length > 18) nodes.shift(); if (RM) { for (let i = 0; i < 200; i++) step(); draw(0); } });
    let started = false;
    const go = runWhileVisible(slimeC, (t) => { step(); step(); draw(t); });
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; layout(); RM ? draw(0) : go(); } }, { rootMargin: '200px' }).observe(slimeC);
    let rt; addEventListener('resize', () => { if (!started) return; clearTimeout(rt); rt = setTimeout(() => { layout(); RM ? draw(0) : go(); }, 200); });
  }

  // ------------------------------------------------------------ spring-driven swarm for the stages and "Soon" (insects with fading trails)
  class Swarm {
    constructor(canvas, { n, ink, accent, size = 1.6, spring = 0.014, damp = 0.86, cursor = 110, fade }) {
      this.c = canvas; this.ink = ink; this.accent = accent; this.size = size; this.spring = spring; this.damp = damp; this.cursorR = cursor; this.fade = fade;
      this.mouse = pointer(canvas); this.p = []; this.links = []; this.marks = [];
      this.resize(); this.setN(n);
      this.go = runWhileVisible(canvas, (t) => { this.update?.(t); this.step(t); this.draw(); });
    }
    setN(n) { while (this.p.length < n) this.p.push({ x: rand(0, this.w), y: rand(0, this.h), vx: 0, vy: 0, tx: this.w / 2, ty: this.h / 2, a: 0, ta: 1, acc: false, s: rand(0.75, 1.25), j: rand(0, TAU), hd: rand(0, TAU) }); this.p.length = n; }
    resize() { Object.assign(this, (({ g, w, h }) => ({ g, w, h }))(fit(this.c))); }
    burst(cx, cy, f = 16) { for (const p of this.p) { const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1; const k = f * (0.4 + Math.random()) * Math.min(1, 260 / d); p.vx += (dx / d) * k; p.vy += (dy / d) * k; } this.kick(); }
    step(t) {
      const { mouse: m, cursorR: R } = this;
      for (const p of this.p) {
        p.vx = p.vx * this.damp + (p.tx + Math.sin(t * 0.0011 + p.j) * 0.7 - p.x) * this.spring;
        p.vy = p.vy * this.damp + (p.ty + Math.cos(t * 0.0013 + p.j) * 0.7 - p.y) * this.spring;
        const dx = p.x - m.x, dy = p.y - m.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R) { const d = Math.sqrt(d2) || 1, k = (1 - d / R) * 2.2; p.vx += (dx / d) * k; p.vy += (dy / d) * k; }
        p.x += p.vx; p.y += p.vy; p.a += (p.ta - p.a) * 0.06;
        const sp = p.vx * p.vx + p.vy * p.vy; if (sp > 0.004) { const h = Math.atan2(p.vy, p.vx); p.hd += Math.sin(h - p.hd) * 0.25; }
      }
    }
    draw() {
      const g = this.g;
      if (this.fade && !RM) { g.fillStyle = this.fade; g.fillRect(0, 0, this.w, this.h); } else g.clearRect(0, 0, this.w, this.h);
      for (const mk of this.marks) mk(g);
      g.lineWidth = 1;
      for (const l of this.links) { g.strokeStyle = l.c; g.globalAlpha = l.a; g.beginPath(); g.moveTo(l.x1, l.y1); g.quadraticCurveTo((l.x1 + l.x2) / 2 + (l.y2 - l.y1) * 0.2, (l.y1 + l.y2) / 2 - (l.x2 - l.x1) * 0.2, l.x2, l.y2); g.stroke(); }
      for (const p of this.p) { if (p.a < 0.02) continue; g.globalAlpha = p.a; insect(g, p.x, p.y, p.hd, this.size * p.s * (p.big || 1), p.acc ? this.accent : this.ink, p.carry); }
      g.globalAlpha = 1;
    }
    settle() { for (const p of this.p) { p.x = p.tx; p.y = p.ty; p.a = p.ta; p.vx = p.vy = 0; } }
    kick() { if (RM) { this.update?.(performance.now()); this.settle(); this.draw(); } else this.go(); }
  }

  // ------------------------------------------------------------ pinned stages
  const stSec = document.querySelector('[data-stages]');
  if (stSec) {
    const canvas = stSec.querySelector('canvas');
    const steps = [...stSec.querySelectorAll('.stage')];
    const bars = [...stSec.querySelectorAll('.stage-dots b')];
    const count = stSec.querySelector('.stage-count');
    const N = small() ? 200 : 300, LIGHT = '#7fdcc2';
    const S = new Swarm(canvas, { n: N, ink: PAPER, accent: LIGHT, size: 1.7, spring: 0.03, damp: 0.82, cursor: 70, fade: 'rgba(16,19,18,0.24)' });
    S.p.forEach((p, i) => { p.i = i; p.ang = rand(0, TAU); p.rr = Math.sqrt(Math.random()); p.g = i % 3; p.x = S.w * 0.65; p.y = S.h / 2; p.a = 0; p.mem = i % 23 === 5; });
    let prog = 0, cur = -1;
    const measure = () => {
      const r = stSec.getBoundingClientRect(), span = r.height - innerHeight;
      prog = clamp(-r.top / span, 0, 1);
      const s = Math.min(3, Math.floor(prog * 4));
      if (s !== cur) { cur = s; steps.forEach((el, i) => el.classList.toggle('on', i === s)); if (count) count.textContent = `0${s + 1} / 04`; }
      bars.forEach((b, i) => b.style.setProperty('--p', clamp(prog * 4 - i, 0, 1).toFixed(3)));
      S.kick();
    };
    const hex = (g, x, y, r, a) => { g.beginPath(); for (let i = 0; i <= 6; i++) { const th = i * TAU / 6 + Math.PI / 6; i ? g.lineTo(x + Math.cos(th) * r, y + Math.sin(th) * r) : g.moveTo(x + Math.cos(th) * r, y + Math.sin(th) * r); } g.globalAlpha = a; g.stroke(); g.globalAlpha = 1; };
    S.update = (t) => {
      const sm = small();
      const cx = sm ? S.w * 0.5 : S.w * 0.66, cy = sm ? S.h * 0.32 : S.h * 0.5;
      const R = sm ? Math.min(S.w * 0.38, S.h * 0.22) : Math.min(S.w * 0.2, S.h * 0.3);
      const s = Math.min(3, Math.floor(prog * 4)), lt = clamp(prog * 4 - s, 0, 1), k = t / 1000;
      S.links = []; S.marks = [];
      const groups = [0, 1, 2].map((g) => { const a = -Math.PI / 2 + g * TAU / 3 + 0.4; return { x: cx + Math.cos(a) * R * 0.95, y: cy + Math.sin(a) * R * 0.95 }; });
      // the hive: a comb of cells around the centre, always faintly present
      S.marks.push((g) => { g.strokeStyle = 'rgba(244,243,238,0.5)'; g.lineWidth = 1; const r = R * 0.075; for (let q = -2; q <= 2; q++) for (let w = -2; w <= 2; w++) { if (Math.abs(q + w) > 2) continue; hex(g, cx + (q + w / 2) * r * 1.75, cy + w * r * 1.52, r, 0.16); } });
      for (const p of S.p) {
        p.acc = p.i === 0; p.big = p.i === 0 ? 2.4 : 1; p.carry = false;
        if (p.i === 0) {
          if (s === 0) { p.tx = cx + Math.sin(k * 0.9) * R * 0.9 + Math.sin(k * 2.3) * R * 0.25; p.ty = cy + Math.cos(k * 0.7) * R * 0.55; }          // a scout wanders
          else if (s === 1) { const u = k * 2.4; p.tx = cx + Math.sin(u) * R * 0.22; p.ty = cy + Math.sin(2 * u) * R * 0.1; }                        // waggle dance (figure of eight)
          else { p.tx = cx; p.ty = cy; }
          p.ta = 1; continue;
        }
        if (s === 0) {
          const a = p.ang + k * 0.05, r = R * (0.15 + p.rr * 0.12);
          p.tx = cx + Math.cos(a) * r; p.ty = cy + Math.sin(a) * r; p.ta = 0.18;                      // the colony rests in the hive
        } else if (s === 1) {
          const active = p.i < 12 + lt * N * 0.42, G = groups[p.g];
          if (active) { const a = p.ang + k * 0.4, r = R * 0.2 * p.rr; p.tx = G.x + Math.cos(a) * r; p.ty = G.y + Math.sin(a) * r; p.ta = 0.9; p.carry = p.i % 5 === 0; }
          else { const a = p.ang + k * 0.05, r = R * (0.15 + p.rr * 0.12); p.tx = cx + Math.cos(a) * r; p.ty = cy + Math.sin(a) * r; p.ta = 0.18; }
        } else if (s === 2) {
          const q = ease(lt * 1.25), G = groups[p.g];
          const gx = G.x + (cx - G.x) * q, gy = G.y + (cy - G.y) * q;
          const a = p.ang + k * (0.4 + q * 0.5), r = R * (0.24 * p.rr * (1 - q) + q * (0.5 + p.rr * 0.12));
          p.tx = gx + Math.cos(a) * r; p.ty = gy + Math.sin(a) * r; p.ta = 0.92; p.acc = q > 0.85 && p.i % 4 === 0;
        } else {
          const out = ease(lt * 1.4), a = p.ang + k * 0.12, r = R * (0.5 + p.rr * 0.12) + out * R * (1.2 + p.rr * 2.2);
          p.tx = cx + Math.cos(a) * r; p.ty = cy + Math.sin(a) * r;
          p.ta = p.mem ? 0.75 : 0.9 * (1 - out); p.acc = p.mem && out > 0.6;
          if (p.mem && out > 0.6) { p.tx = cx + Math.cos(p.ang) * R * (0.9 + p.rr * 0.5); p.ty = cy + Math.sin(p.ang) * R * (0.9 + p.rr * 0.5); }
        }
      }
      if (s === 1) for (const G of groups) S.links.push({ x1: cx, y1: cy, x2: G.x, y2: G.y, a: 0.3 * ease(lt * 3), c: LIGHT });
      if (s === 2) { const q = ease(lt * 1.25); for (const G of groups) S.links.push({ x1: cx, y1: cy, x2: G.x + (cx - G.x) * q, y2: G.y + (cy - G.y) * q, a: 0.3 * (1 - q), c: LIGHT }); }
      // decide: candidate nest sites as comb cells that fill as the quorum forms
      if (s === 2) S.marks.push((g) => { g.strokeStyle = LIGHT; g.lineWidth = 1.2; const q = ease(lt * 1.25); for (const G of groups) hex(g, G.x + (cx - G.x) * q, G.y + (cy - G.y) * q, R * 0.24, 0.35 * (1 - q)); hex(g, cx, cy, R * 0.62, 0.45 * q); });
    };
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', () => { S.resize(); measure(); });
    measure();
  }

  // ------------------------------------------------------------ closing: the colony spells "Soon"
  const soonC = document.querySelector('[data-swarm="soon"]');
  if (soonC) {
    const S = new Swarm(soonC, { n: 10, ink: INK, accent: ACC, size: 1.25, spring: 0.02, cursor: 90, fade: 'rgba(244,243,238,0.3)' });
    let formed = false;
    const sample = () => {
      const w = S.w, h = S.h, o = document.createElement('canvas'); o.width = Math.round(w); o.height = Math.round(h);
      const g = o.getContext('2d'), fs = Math.min(w * 0.3, h * 0.5);
      g.font = `italic 500 ${fs}px Fraunces, Georgia, serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Soon', w / 2, h * (small() ? 0.36 : 0.4));
      const data = g.getImageData(0, 0, o.width, o.height).data, st = Math.max(6, Math.round(fs / 30));
      const pts = [];
      for (let y = 0; y < o.height; y += st) for (let x = 0; x < o.width; x += st) if (data[(y * o.width + x) * 4 + 3] > 128) pts.push([x + rand(-1, 1), y + rand(-1, 1)]);
      pts.sort(() => Math.random() - 0.5);
      S.setN(pts.length + Math.round(pts.length * 0.12));
      S.p.forEach((p, i) => { p.pt = pts[i] || null; p.ang = rand(0, TAU); p.rr = rand(0.6, 1.4); p.acc = !!p.pt && i % 9 === 0; p.carry = !!p.pt && i % 13 === 0; });
    };
    S.update = (t) => {
      const k = t / 1000;
      for (const p of S.p) {
        if (p.pt && formed) { p.tx = p.pt[0]; p.ty = p.pt[1]; p.ta = 0.9; }
        else { const a = p.ang + k * 0.04 * p.rr; p.tx = S.w / 2 + Math.cos(a) * S.w * 0.45 * p.rr; p.ty = S.h * 0.42 + Math.sin(a) * S.h * 0.3 * p.rr; p.ta = p.pt ? 0.3 : 0.18; }
      }
    };
    sample();
    S.p.forEach((p) => { p.x = rand(0, S.w); p.y = rand(0, S.h); p.a = 0; });
    // re-sample once the display face is ready (the first pass may have used the fallback)
    if (document.fonts) document.fonts.load('italic 500 100px Fraunces').then(() => { sample(); S.p.forEach((p) => { if (!p.x) { p.x = rand(0, S.w); p.y = rand(0, S.h); } }); S.kick(); }).catch(() => {});
    new IntersectionObserver(([en]) => { if (en.isIntersecting && !formed) { formed = true; S.kick(); } }, { threshold: 0.35 }).observe(soonC);
    soonC.addEventListener('pointerdown', (e) => { const r = soonC.getBoundingClientRect(); S.burst(e.clientX - r.left, e.clientY - r.top, 12); });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { S.resize(); sample(); S.kick(); }, 150); });
    S.kick();
  }

  // manifesto: words light up with scroll position
  const man = document.querySelector('[data-scrub]');
  if (man) {
    const ws = [];
    for (const p of man.querySelectorAll('p:not(.kicker)')) {
      const emph = new Set((p.dataset.em || '').split('|').filter(Boolean));
      p.setAttribute('aria-label', p.textContent.trim());
      p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="sw${emph.has(w.replace(/[.,]/g, '')) ? ' em' : ''}" aria-hidden="true">${w}</span>`).join(' ');
      ws.push(...p.querySelectorAll('.sw'));
    }
    const upd = () => {
      const r = man.getBoundingClientRect(), vh = innerHeight;
      const f = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25), 0, 1);
      const on = Math.round(f * ws.length);
      ws.forEach((w, i) => w.classList.toggle('on', i < on));
    };
    if (!RM) { addEventListener('scroll', upd, { passive: true }); upd(); }
  }

  // nature cards unfold
  for (const card of document.querySelectorAll('.ncard')) {
    const b = card.querySelector('button');
    b.addEventListener('click', () => { const open = !card.hasAttribute('data-open'); card.toggleAttribute('data-open', open); b.setAttribute('aria-expanded', String(open)); });
  }

  // top bar switches to its dark variant over the pinned stages (solid-on-scroll lives in unfold.js)
  const bar = document.querySelector('.bar');
  const darkSecs = [...document.querySelectorAll('[data-stages], .realm-beyond')];
  const onScroll = () => bar.classList.toggle('dark', darkSecs.some((d) => { const r = d.getBoundingClientRect(); return r.top <= 34 && r.bottom >= 34; }));
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
