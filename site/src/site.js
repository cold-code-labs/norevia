// Norevia — a Cold Code Labs research project. Progressive enhancement; the site works without JavaScript.
(() => {
  'use strict';

  // ---------------------------------------------------------------- filtros
  for (const form of document.querySelectorAll('form[data-filters]')) {
    const scope = form.closest('section') || document;
    const items = [...scope.querySelectorAll('.filterable > li')];
    const nodes = [...document.querySelectorAll('.constellation .node')];
    const empty = scope.querySelector('.filtered-empty');
    const count = form.querySelector('.fcount');
    const q = form.querySelector('input[name="q"]');
    const state = { area: new Set(), ev: new Set() };
    form.hidden = false;
    form.addEventListener('submit', (e) => e.preventDefault());
    const match = (el) => {
      const a = el.dataset.area, v = el.dataset.ev;
      if (state.area.size && !state.area.has(a)) return false;
      if (state.ev.size && !state.ev.has(v)) return false;
      const t = (q.value || '').trim().toLowerCase();
      if (t && el.dataset.text && !t.split(/\s+/).every((w) => el.dataset.text.includes(w))) return false;
      return true;
    };
    const apply = () => {
      let n = 0;
      for (const li of items) { const ok = match(li); li.hidden = !ok; if (ok) n++; }
      for (const nd of nodes) nd.classList.toggle('dim', !match(nd));
      if (empty) empty.hidden = n > 0 || !items.length;
      const active = state.area.size || state.ev.size || q.value.trim();
      count.textContent = active ? `${n} de ${items.length} cartões` : `${items.length} cartões`;
      const params = new URLSearchParams();
      if (state.area.size) params.set('area', [...state.area].join(','));
      if (state.ev.size) params.set('ev', [...state.ev].join(','));
      if (q.value.trim()) params.set('q', q.value.trim());
      const s = params.toString();
      history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
    };
    form.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-filter]');
      if (!b) return;
      const set = state[b.dataset.filter];
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      on ? set.add(b.dataset.value) : set.delete(b.dataset.value);
      apply();
    });
    q.addEventListener('input', apply);
    // estado inicial via URL
    const params = new URLSearchParams(location.search);
    for (const key of ['area', 'ev']) {
      for (const v of (params.get(key) || '').split(',').filter(Boolean)) {
        const b = form.querySelector(`button[data-filter="${key}"][data-value="${CSS.escape(v)}"]`);
        if (b) { b.setAttribute('aria-pressed', 'true'); state[key].add(v); }
      }
    }
    if (params.get('q')) q.value = params.get('q');
    apply();
  }

  // ---------------------------------------------------------------- tooltips dos gráficos
  for (const box of document.querySelectorAll('.chart-box')) {
    const tip = box.querySelector('.tip');
    const show = (e) => {
      const pt = e.target.closest('.pt');
      if (!pt) return;
      const b = box.getBoundingClientRect();
      const r = (pt.querySelector('.dot, path') || pt).getBoundingClientRect();
      tip.textContent = pt.dataset.tip;
      tip.hidden = false;
      const x = Math.min(Math.max(r.left + r.width / 2 - b.left, 90), b.width - 90);
      tip.style.left = x + 'px';
      tip.style.top = r.top - b.top + 'px';
    };
    const hide = () => { tip.hidden = true; };
    box.addEventListener('pointerover', show);
    box.addEventListener('focusin', show);
    box.addEventListener('pointerleave', hide);
    box.addEventListener('focusout', hide);
    box.querySelectorAll('.pt title').forEach((t) => t.remove()); // evita tooltip duplicado
  }

  // ---------------------------------------------------------------- motivo generativo: estigmergia
  // Agentes simples seguem trilhas, depositam "feromônio" e o campo evapora (modelo tipo Physarum).
  const cv = document.querySelector('.hero .field');
  if (!cv || !cv.getContext) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = cv.getContext('2d', { alpha: true });
  let W = 0, H = 0, trail, next, agents, img, off, offCtx, running = false, visible = true, raf = 0;
  const SA = 0.45, RA = 0.38, SO = 7, SPEED = 1, DEP = 2.6, DECAY = 0.9;

  function setup() {
    const rect = cv.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(rect.width * dpr));
    cv.height = Math.max(1, Math.round(rect.height * dpr));
    const scale = rect.width > 900 ? 4 : 3;
    W = Math.max(60, Math.min(300, Math.round(rect.width / scale)));
    H = Math.max(40, Math.min(170, Math.round(rect.height / scale)));
    trail = new Float32Array(W * H);
    next = new Float32Array(W * H);
    const N = Math.min(4200, Math.round(W * H * 0.11));
    agents = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // nascem em anéis (órbitas) — a dinâmica reorganiza em rede
      const a = Math.random() * Math.PI * 2, r = (0.18 + 0.3 * Math.random()) * Math.min(W, H);
      agents[i * 3] = W * 0.68 + Math.cos(a) * r * 1.6;
      agents[i * 3 + 1] = H * 0.5 + Math.sin(a) * r;
      agents[i * 3 + 2] = a + Math.PI / 2 + (Math.random() - 0.5);
    }
    off = document.createElement('canvas');
    off.width = W; off.height = H;
    offCtx = off.getContext('2d');
    img = offCtx.createImageData(W, H);
  }

  const at = (x, y) => trail[((y + H) % H) * W + ((x + W) % W)];

  function step() {
    const n = agents.length / 3;
    for (let i = 0; i < n; i++) {
      const k = i * 3;
      let x = agents[k], y = agents[k + 1], a = agents[k + 2];
      const f = at(Math.round(x + Math.cos(a) * SO), Math.round(y + Math.sin(a) * SO));
      const l = at(Math.round(x + Math.cos(a - SA) * SO), Math.round(y + Math.sin(a - SA) * SO));
      const r = at(Math.round(x + Math.cos(a + SA) * SO), Math.round(y + Math.sin(a + SA) * SO));
      if (f < l && f < r) a += (Math.random() < 0.5 ? -1 : 1) * RA;
      else if (l > r) a -= RA;
      else if (r > l) a += RA;
      a += (Math.random() - 0.5) * 0.12;
      x += Math.cos(a) * SPEED; y += Math.sin(a) * SPEED;
      if (x < 0) x += W; if (x >= W) x -= W; if (y < 0) y += H; if (y >= H) y -= H;
      agents[k] = x; agents[k + 1] = y; agents[k + 2] = a;
      trail[(y | 0) * W + (x | 0)] += DEP;
    }
    // difusão 3x3 + evaporação
    for (let y = 0; y < H; y++) {
      const ym = ((y - 1 + H) % H) * W, y0 = y * W, yp = ((y + 1) % H) * W;
      for (let x = 0; x < W; x++) {
        const xm = (x - 1 + W) % W, xp = (x + 1) % W;
        const s = trail[ym + xm] + trail[ym + x] + trail[ym + xp] + trail[y0 + xm] + trail[y0 + x] + trail[y0 + xp] + trail[yp + xm] + trail[yp + x] + trail[yp + xp];
        next[y0 + x] = (s / 9) * DECAY;
      }
    }
    const t = trail; trail = next; next = t;
  }

  function draw() {
    const d = img.data;
    for (let i = 0; i < W * H; i++) {
      const v = Math.min(1, trail[i] / 12);
      const hot = Math.max(0, v - 0.82) / 0.18; // trilhas mais reforçadas tendem ao âmbar
      d[i * 4] = 95 + (240 - 95) * hot;
      d[i * 4 + 1] = 227 + (183 - 227) * hot;
      d[i * 4 + 2] = 180 + (90 - 180) * hot;
      d[i * 4 + 3] = Math.pow(v, 1.1) * 175;
    }
    offCtx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, cv.width, cv.height);
  }

  let last = 0;
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (ts - last < 33) return; // ~30 fps
    last = ts;
    step();
    draw();
  }
  function start() { if (!running && visible && !document.hidden && !reduce) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  setup();
  for (let i = 0; i < (reduce ? 160 : 40); i++) step();
  draw();
  if (!reduce) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { setup(); for (let i = 0; i < 40; i++) step(); draw(); }, 200); });
    start();
  }
})();
