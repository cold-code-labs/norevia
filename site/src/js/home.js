// Norevia — landing page interactions. Vanilla, dependency-free.
// Three particle swarms share one tiny engine: the hero formation, the pinned "how a swarm unfolds"
// sequence and the closing "Soon" word. Everything is a generative illustration, not a result.
(() => {
  'use strict';
  // html.js / html.rm, [data-words], .u and the menu come from src/js/unfold.js (prepended at build time)
  const doc = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

  // ------------------------------------------------------------ engine
  class Swarm {
    constructor(canvas, { n, ink, accent, size = 1.7, spring = 0.014, damp = 0.86, cursor = 110 }) {
      this.c = canvas; this.x = canvas.getContext('2d');
      this.ink = ink; this.accent = accent; this.size = size;
      this.spring = spring; this.damp = damp; this.cursorR = cursor;
      this.mouse = { x: -1e4, y: -1e4 };
      this.p = [];
      this.alive = false; this.visible = true; this.frame = null; this.links = [];
      this.resize(); this.setN(n);
      const move = (e) => { const r = this.c.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; };
      canvas.addEventListener('pointermove', move, { passive: true });
      canvas.addEventListener('pointerleave', () => { this.mouse.x = this.mouse.y = -1e4; });
      new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; if (this.visible) this.kick(); }, { rootMargin: '80px' }).observe(canvas);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.kick(); });
    }
    setN(n) {
      while (this.p.length < n) this.p.push({ x: rand(0, this.w), y: rand(0, this.h), vx: 0, vy: 0, tx: this.w / 2, ty: this.h / 2, a: 0, ta: 1, acc: false, s: rand(0.7, 1.3), j: rand(0, TAU) });
      this.p.length = n;
    }
    resize() {
      const r = this.c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height;
      this.c.width = Math.round(r.width * d); this.c.height = Math.round(r.height * d);
      this.x.setTransform(d, 0, 0, d, 0, 0);
    }
    burst(cx, cy, f = 16) {
      for (const p of this.p) { const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1; const k = f * (0.4 + Math.random()) * Math.min(1, 260 / d); p.vx += (dx / d) * k; p.vy += (dy / d) * k; }
      this.kick();
    }
    step(t) {
      const { mouse: m, cursorR: R } = this;
      for (const p of this.p) {
        const wob = Math.sin(t * 0.0011 + p.j) * 0.6;
        p.vx = p.vx * this.damp + (p.tx + wob - p.x) * this.spring;
        p.vy = p.vy * this.damp + (p.ty + Math.cos(t * 0.0013 + p.j) * 0.6 - p.y) * this.spring;
        const dx = p.x - m.x, dy = p.y - m.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R) { const d = Math.sqrt(d2) || 1, k = (1 - d / R) * 2.2; p.vx += (dx / d) * k; p.vy += (dy / d) * k; }
        p.x += p.vx; p.y += p.vy;
        p.a += (p.ta - p.a) * 0.06;
      }
    }
    draw() {
      const g = this.x; g.clearRect(0, 0, this.w, this.h);
      if (this.links.length) {
        g.lineWidth = 1;
        for (const l of this.links) { g.strokeStyle = l.c; g.globalAlpha = l.a; g.beginPath(); g.moveTo(l.x1, l.y1); g.lineTo(l.x2, l.y2); g.stroke(); }
      }
      for (const pass of [false, true]) {
        g.fillStyle = pass ? this.accent : this.ink;
        for (const p of this.p) {
          if (p.acc !== pass || p.a < 0.02) continue;
          const s = this.size * p.s * (p.big || 1);
          g.globalAlpha = p.a;
          if (s > 3) { g.beginPath(); g.arc(p.x, p.y, s / 2, 0, TAU); g.fill(); } else g.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        }
      }
      g.globalAlpha = 1;
    }
    settle() { for (const p of this.p) { p.x = p.tx; p.y = p.ty; p.a = p.ta; p.vx = p.vy = 0; } }
    kick() {
      if (RM) { this.update?.(performance.now()); this.settle(); this.draw(); return; }
      if (this.frame || !this.visible || document.hidden) return;
      const loop = (t) => {
        this.frame = null;
        if (!this.visible || document.hidden) return;
        this.update?.(t); this.step(t); this.draw();
        this.frame = requestAnimationFrame(loop);
      };
      this.frame = requestAnimationFrame(loop);
    }
  }
  const css = (k) => getComputedStyle(doc).getPropertyValue(k).trim();
  const INK = css('--ink') || '#101312', ACC = css('--accent') || '#0e7a62', PAPER = css('--paper') || '#f4f3ee';
  const small = () => innerWidth < 860;

  // ------------------------------------------------------------ hero: rings that orbit, scatter and re-form
  const heroC = document.querySelector('[data-swarm="hero"]');
  if (heroC) {
    const n = small() ? 520 : 900;
    const copy = document.querySelector('.hero-copy');
    const S = new Swarm(heroC, { n, ink: INK, accent: ACC });
    const roles = S.p.map((_, i) => { const f = i / n; return f < 0.46 ? 0 : f < 0.76 ? 1 : f < 0.86 ? 2 : 3; });
    S.p.forEach((p, i) => {
      p.r = roles[i]; p.ang = rand(0, TAU); p.off = rand(-1, 1); p.sat = Math.floor(rand(0, 3));
      p.acc = p.r === 2 || (p.r === 3 && p.sat === 0); p.big = p.r === 2 ? 1.25 : 1;
      p.x = rand(-0.1, 1.1) * S.w; p.y = rand(-0.1, 1.1) * S.h; p.a = 0;
    });
    const start = performance.now();
    S.update = (t) => {
      const sm = small();
      // on small screens the formation lives in the free space above the title
      const room = sm ? Math.max(120, copy.offsetTop + copy.parentNode.offsetTop - 68) : 0;
      const cx = sm ? S.w * 0.5 : S.w * 0.72, cy = sm ? 68 + room / 2 : S.h * 0.53;
      const R = sm ? Math.min(S.w * 0.3, room / 2 / 1.45) : Math.min(S.w * 0.2, S.h * 0.32);
      const k = (t - start) / 1000, rot = RM ? 0 : k;
      S.spring = 0.006 + 0.012 * ease(k / 2.4);
      for (const p of S.p) {
        let a, r;
        if (p.r === 0) { a = p.ang + rot * 0.06; r = R + p.off * R * 0.05; }
        else if (p.r === 1) { a = p.ang - rot * 0.1; r = R * 0.58 + p.off * R * 0.04; }
        else if (p.r === 2) { a = p.ang; r = Math.sqrt(Math.abs(p.off)) * R * 0.13; }
        else { const sa = [0.15, 2.3, 4.1][p.sat] + rot * 0.03 * (p.sat + 1), sr = R * [1.32, 1.5, 1.24][p.sat]; p.tx = cx + Math.cos(sa) * sr + Math.cos(p.ang) * Math.abs(p.off) * R * 0.07; p.ty = cy + Math.sin(sa) * sr + Math.sin(p.ang) * Math.abs(p.off) * R * 0.07; p.ta = 0.9; continue; }
        p.tx = cx + Math.cos(a) * r; p.ty = cy + Math.sin(a) * r;
        p.ta = p.r === 0 ? 0.55 + 0.35 * Math.sin(a * 3 + rot * 0.8) ** 2 : 0.85;
      }
    };
    heroC.addEventListener('pointerdown', (e) => { const r = heroC.getBoundingClientRect(); S.burst(e.clientX - r.left, e.clientY - r.top); });
    addEventListener('resize', () => { S.resize(); S.kick(); });
    S.kick();
  }

  // ------------------------------------------------------------ pinned stages: sense → recruit → decide → dissolve
  const stSec = document.querySelector('[data-stages]');
  if (stSec) {
    const canvas = stSec.querySelector('canvas');
    const steps = [...stSec.querySelectorAll('.stage')];
    const bars = [...stSec.querySelectorAll('.stage-dots b')];
    const count = stSec.querySelector('.stage-count');
    const N = small() ? 220 : 340;
    const S = new Swarm(canvas, { n: N, ink: PAPER, accent: '#7fdcc2', size: 2, spring: 0.03, damp: 0.82, cursor: 70 });
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
    S.update = (t) => {
      const sm = small();
      const cx = sm ? S.w * 0.5 : S.w * 0.66, cy = sm ? S.h * 0.32 : S.h * 0.5;
      const R = sm ? Math.min(S.w * 0.38, S.h * 0.22) : Math.min(S.w * 0.2, S.h * 0.3);
      const s = Math.min(3, Math.floor(prog * 4)), lt = clamp(prog * 4 - s, 0, 1), k = t / 1000;
      S.links = [];
      const groups = [0, 1, 2].map((g) => { const a = -Math.PI / 2 + g * TAU / 3 + 0.4; return { x: cx + Math.cos(a) * R * 0.95, y: cy + Math.sin(a) * R * 0.95 }; });
      for (const p of S.p) {
        p.acc = p.i === 0; p.big = p.i === 0 ? 5 : 1;
        if (p.i === 0) { p.tx = cx; p.ty = cy; p.ta = 1; continue; }
        if (s === 0) {
          // one agent; the rest of the colony is latent
          const a = p.ang + k * 0.05, r = R * (1.3 + p.rr * 0.9);
          p.tx = cx + Math.cos(a) * r; p.ty = cy + Math.sin(a) * r; p.ta = p.i < 40 ? 0.12 + 0.1 * lt : 0.04;
        } else if (s === 1) {
          // recruitment grows with the stimulus: more agents cross their threshold as you scroll
          const active = p.i < 12 + lt * N * 0.42;
          const G = groups[p.g], a = p.ang + k * 0.4, r = R * 0.2 * p.rr;
          if (active) { p.tx = G.x + Math.cos(a) * r; p.ty = G.y + Math.sin(a) * r; p.ta = 0.9; }
          else { const a2 = p.ang + k * 0.05, r2 = R * (1.3 + p.rr * 0.9); p.tx = cx + Math.cos(a2) * r2; p.ty = cy + Math.sin(a2) * r2; p.ta = 0.07; }
        } else if (s === 2) {
          // parallel exploration, then quorum: groups pull into one shared answer
          const q = ease(lt * 1.25), G = groups[p.g];
          const gx = G.x + (cx - G.x) * q, gy = G.y + (cy - G.y) * q;
          const a = p.ang + k * (0.4 + q * 0.5), r = R * (0.24 * p.rr * (1 - q) + q * (0.5 + p.rr * 0.12));
          p.tx = gx + Math.cos(a) * r; p.ty = gy + Math.sin(a) * r; p.ta = 0.92;
          p.acc = q > 0.85 && p.i % 4 === 0;
        } else {
          // dissolve: the swarm releases itself; a few traces remain as memory
          const out = ease(lt * 1.4), a = p.ang + k * 0.12, r = R * (0.5 + p.rr * 0.12) + out * R * (1.2 + p.rr * 2.2);
          p.tx = cx + Math.cos(a) * r; p.ty = cy + Math.sin(a) * r;
          p.ta = p.mem ? 0.75 : 0.9 * (1 - out);
          p.acc = p.mem && out > 0.6; p.big = p.mem && out > 0.6 ? 2.2 : 1;
          if (p.mem && out > 0.6) { p.tx = cx + Math.cos(p.ang) * R * (0.9 + p.rr * 0.5); p.ty = cy + Math.sin(p.ang) * R * (0.9 + p.rr * 0.5); }
        }
      }
      if (s === 1) for (const G of groups) S.links.push({ x1: cx, y1: cy, x2: G.x, y2: G.y, a: 0.25 * ease(lt * 3), c: '#7fdcc2' });
      if (s === 2) { const q = ease(lt * 1.25); for (const G of groups) S.links.push({ x1: cx, y1: cy, x2: G.x + (cx - G.x) * q, y2: G.y + (cy - G.y) * q, a: 0.25 * (1 - q), c: '#7fdcc2' }); }
    };
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', () => { S.resize(); measure(); });
    measure();
  }

  // ------------------------------------------------------------ closing: the swarm spells "Soon"
  const soonC = document.querySelector('[data-swarm="soon"]');
  if (soonC) {
    const S = new Swarm(soonC, { n: 10, ink: INK, accent: ACC, size: 1.9, spring: 0.02, cursor: 90 });
    let formed = false, pts = [];
    const sample = () => {
      const w = S.w, h = S.h, o = document.createElement('canvas'); o.width = Math.round(w); o.height = Math.round(h);
      const g = o.getContext('2d'), fs = Math.min(w * 0.3, h * 0.5);
      g.font = `600 ${fs}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Soon', w / 2, h * (small() ? 0.36 : 0.4));
      const data = g.getImageData(0, 0, o.width, o.height).data, step = Math.max(5, Math.round(fs / 34));
      pts = [];
      for (let y = 0; y < o.height; y += step) for (let x = 0; x < o.width; x += step) if (data[(y * o.width + x) * 4 + 3] > 128) pts.push([x + rand(-1, 1), y + rand(-1, 1)]);
      pts.sort(() => Math.random() - 0.5);
      S.setN(pts.length + Math.round(pts.length * 0.12));
      S.p.forEach((p, i) => { p.pt = pts[i] || null; p.ang = rand(0, TAU); p.rr = rand(0.6, 1.4); p.acc = i % 9 === 0; if (!p.pt) p.acc = false; });
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
  const darkSec = document.querySelector('[data-stages]');
  const onScroll = () => {
    if (darkSec) { const r = darkSec.getBoundingClientRect(); bar.classList.toggle('dark', r.top <= 34 && r.bottom >= 34); }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
