// Explore: the knowledge swarm. Server renders a static layout (works without JS); this adds gentle agent-like
// motion (springs along `related`, repulsion, weak area anchors, Brownian drift), zoom/pan, drag, hover previews,
// keyboard navigation between neighbours and the shared filters.
const stage = $('[data-graph]');
const svg = stage && $('svg.graph', stage);
const preview = $('[data-preview]');
if (svg) init();

function init() {
  const VB = svg.viewBox.baseVal;
  const W0 = VB.width, H0 = VB.height;
  let view = { x: 0, y: 0, w: W0, h: H0 };
  const nodes = $$('a.node', svg).map((el) => {
    const m = /translate\(([-\d.]+)[ ,]([-\d.]+)\)/.exec(el.getAttribute('transform')) || [0, W0 / 2, H0 / 2];
    return { el, id: el.dataset.id, area: el.dataset.area, x: +m[1], y: +m[2], hx: +m[1], hy: +m[2], vx: 0, vy: 0, nb: new Set(), pin: false, dim: false };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = $$('line.edge', svg).map((el) => ({ el, s: byId.get(el.dataset.s), t: byId.get(el.dataset.t) })).filter((e) => e.s && e.t);
  for (const e of edges) { e.s.nb.add(e.t); e.t.nb.add(e.s); }
  // area anchors = centroid of the server layout
  const anchors = {};
  for (const n of nodes) { const a = (anchors[n.area] ||= { x: 0, y: 0, k: 0 }); a.x += n.x; a.y += n.y; a.k++; }
  for (const a of Object.values(anchors)) { a.x /= a.k; a.y /= a.k; }

  const tools = $('.graph-tools', stage);
  tools.hidden = false;
  let motion = !RM;
  const motionBtn = $('[data-act="motion"]', tools);
  const setMotionBtn = () => { motionBtn.setAttribute('aria-pressed', String(motion)); motionBtn.textContent = motion ? 'Motion on' : 'Motion off'; };
  setMotionBtn();

  // ---------------------------------------------------------------- physics
  let alpha = 0.35;
  function tick() {
    const a = Math.max(alpha, 0.04);
    for (const e of edges) {
      const dx = e.t.x - e.s.x, dy = e.t.y - e.s.y, d = Math.hypot(dx, dy) || 1;
      const f = ((d - 95) / d) * 0.012 * a;
      e.s.vx += dx * f; e.s.vy += dy * f; e.t.vx -= dx * f; e.t.vy -= dy * f;
    }
    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const q = nodes[j];
        const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy || 1;
        if (d2 > 9000) continue;
        const f = (260 / d2) * a;
        p.vx -= dx * f; p.vy -= dy * f; q.vx += dx * f; q.vy += dy * f;
      }
      const an = anchors[p.area];
      p.vx += (an.x - p.x) * 0.0016 + (p.hx - p.x) * 0.0012;
      p.vy += (an.y - p.y) * 0.0016 + (p.hy - p.y) * 0.0012;
      // Brownian drift: each card keeps moving a little, like an agent
      p.vx += (Math.random() - 0.5) * 0.09; p.vy += (Math.random() - 0.5) * 0.09;
    }
    for (const n of nodes) {
      if (n.pin) { n.vx = n.vy = 0; continue; }
      n.vx *= 0.82; n.vy *= 0.82;
      n.x = Math.max(16, Math.min(W0 - 16, n.x + n.vx));
      n.y = Math.max(16, Math.min(H0 - 16, n.y + n.vy));
    }
    alpha *= 0.995;
  }
  function draw() {
    for (const n of nodes) n.el.setAttribute('transform', `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
    for (const e of edges) { e.el.setAttribute('x1', e.s.x.toFixed(1)); e.el.setAttribute('y1', e.s.y.toFixed(1)); e.el.setAttribute('x2', e.t.x.toFixed(1)); e.el.setAttribute('y2', e.t.y.toFixed(1)); }
  }
  const L = loop(stage, () => { if (motion || drag) { tick(); draw(); } });

  // ---------------------------------------------------------------- view (zoom/pan)
  const applyView = () => svg.setAttribute('viewBox', `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`);
  const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(); return { x: view.x + ((cx - r.left) / r.width) * view.w, y: view.y + ((cy - r.top) / r.height) * view.h }; };
  function zoomAt(cx, cy, k) {
    const p = toSvg(cx, cy);
    const w = Math.max(W0 / 6, Math.min(W0 * 1.2, view.w * k)), h = w * (H0 / W0);
    view = { x: p.x - (p.x - view.x) * (w / view.w), y: p.y - (p.y - view.y) * (h / view.h), w, h };
    applyView();
  }
  stage.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 4) return; e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  const ptrs = new Map();
  let drag = null, pinch = null, moved = false;
  svg.addEventListener('pointerdown', (e) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; drag = null; return; }
    const nodeEl = e.target.closest('a.node');
    const p = toSvg(e.clientX, e.clientY);
    if (nodeEl) { const n = nodes.find((x) => x.el === nodeEl); drag = { n, ox: n.x - p.x, oy: n.y - p.y }; n.pin = true; }
    else drag = { pan: true, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return;
    const prev = ptrs.get(e.pointerId);
    if (Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > 4) moved = true;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.d / d); pinch.d = d; return;
    }
    if (!drag || !moved) return;
    if (drag.pan) { const r = svg.getBoundingClientRect(); view.x = drag.vx - ((e.clientX - drag.sx) / r.width) * view.w; view.y = drag.vy - ((e.clientY - drag.sy) / r.height) * view.h; applyView(); }
    else { const p = toSvg(e.clientX, e.clientY); drag.n.x = drag.n.hx = p.x + drag.ox; drag.n.y = drag.n.hy = p.y + drag.oy; alpha = Math.max(alpha, 0.2); if (!motion) draw(); }
  });
  const end = (e) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (drag && drag.n) drag.n.pin = false;
    drag = null;
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  // a drag must not follow the link; on touch, the first tap selects and the second opens
  let armed = null;
  svg.addEventListener('click', (e) => {
    const a = e.target.closest('a.node');
    if (!a) return;
    if (moved) { e.preventDefault(); return; }
    if (e.pointerType === 'touch' || (window.matchMedia('(hover: none)').matches)) {
      if (armed !== a) { e.preventDefault(); armed = a; focusNode(nodes.find((n) => n.el === a)); }
    }
  });

  // ---------------------------------------------------------------- highlight + preview
  let sel = null;
  function focusNode(n) {
    if (sel) { sel.el.classList.remove('sel'); for (const m of sel.nb) m.el.classList.remove('nb'); }
    for (const e of edges) e.el.classList.remove('hot');
    sel = n;
    svg.classList.toggle('focus', !!n);
    if (!n) return;
    n.el.classList.add('sel');
    for (const m of n.nb) m.el.classList.add('nb');
    for (const e of edges) if (e.s === n || e.t === n) e.el.classList.add('hot');
    if (preview) renderPreview(n);
  }
  function renderPreview(n) {
    const d = n.el.dataset;
    preview.textContent = '';
    const eb = document.createElement('p'); eb.className = 'eyebrow'; eb.textContent = 'Preview'; preview.appendChild(eb);
    const top = document.createElement('p'); top.className = 'card-top';
    const evBtn = document.querySelector(`.filters button[data-filter="ev"][data-value="${CSS.escape(d.ev)}"]`);
    const seal = document.createElement('span'); seal.className = `seal ev-${d.ev}`;
    if (evBtn) { const ic = evBtn.querySelector('svg'); if (ic) seal.appendChild(ic.cloneNode(true)); }
    const sl = document.createElement('span'); sl.textContent = evBtn ? evBtn.childNodes[1]?.textContent.trim() || d.ev : d.ev; seal.appendChild(sl);
    top.appendChild(seal);
    const ar = document.createElement('span'); ar.className = `area ar-${d.area}`; ar.textContent = ($(`.filters button[data-filter="area"][data-value="${CSS.escape(d.area)}"]`)?.firstChild?.textContent || d.area).trim(); top.appendChild(ar);
    if (d.st) { const st = document.createElement('span'); st.className = `status st-${d.st}`; st.textContent = ($(`.filters button[data-filter="st"][data-value="${CSS.escape(d.st)}"]`)?.firstChild?.textContent || d.st).trim(); top.appendChild(st); }
    preview.appendChild(top);
    const h = document.createElement('h3'); const a = document.createElement('a'); a.href = n.el.getAttribute('href'); a.textContent = d.title; h.appendChild(a); preview.appendChild(h);
    const p = document.createElement('p'); p.textContent = d.sum; preview.appendChild(p);
    const cid = document.createElement('span'); cid.className = 'cid'; cid.textContent = d.id; preview.appendChild(cid);
    if (n.nb.size) {
      const lab = document.createElement('p'); lab.className = 'muted small'; lab.style.margin = '1rem 0 0'; lab.textContent = `${n.nb.size} related card(s):`; preview.appendChild(lab);
      const ul = document.createElement('ul'); ul.className = 'rel-list';
      for (const m of [...n.nb].slice(0, 18)) { const li = document.createElement('li'); const ma = document.createElement('a'); ma.href = m.el.getAttribute('href'); ma.textContent = m.id; ma.title = m.el.dataset.title; li.appendChild(ma); ul.appendChild(li); }
      preview.appendChild(ul);
    }
    const open = document.createElement('p'); open.style.marginTop = '1rem'; const oa = document.createElement('a'); oa.className = 'btn small'; oa.href = n.el.getAttribute('href'); oa.textContent = 'Open card →'; open.appendChild(oa); preview.appendChild(open);
  }
  svg.addEventListener('pointerover', (e) => { const a = e.target.closest('a.node'); if (a && !drag) focusNode(nodes.find((n) => n.el === a)); });
  svg.addEventListener('focusin', (e) => { const a = e.target.closest('a.node'); if (a) focusNode(nodes.find((n) => n.el === a)); });
  stage.addEventListener('pointerleave', () => { if (!sel || document.activeElement?.closest?.('a.node') !== sel.el) { svg.classList.remove('focus'); } });
  // arrow keys: jump to the neighbour (or nearest visible card) in that direction
  svg.addEventListener('keydown', (e) => {
    const a = e.target.closest('a.node');
    if (!a) return;
    const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
    if (!dir) return;
    e.preventDefault();
    const n = nodes.find((x) => x.el === a);
    const pick = (pool) => {
      let best = null;
      for (const m of pool) {
        if (m === n || m.dim) continue;
        const dx = m.x - n.x, dy = m.y - n.y, d = Math.hypot(dx, dy) || 1;
        const cos = (dx * dir[0] + dy * dir[1]) / d;
        if (cos < 0.3) continue;
        const score = d / (cos * cos);
        if (!best || score < best.s) best = { m, s: score };
      }
      return best && best.m;
    };
    const next = pick(n.nb) || pick(nodes);
    if (next) next.el.focus();
  });

  // ---------------------------------------------------------------- filters + tools
  const applyFilter = ({ match }) => {
    for (const n of nodes) { n.dim = !match(n.el.dataset); n.el.classList.toggle('dim', n.dim); n.el.setAttribute('tabindex', n.dim ? '-1' : '0'); }
    for (const e of edges) e.el.classList.toggle('dim', e.s.dim || e.t.dim);
  };
  document.addEventListener('nrv:filter', (ev) => applyFilter(ev.detail));
  if (document.nrvFilterState) applyFilter(document.nrvFilterState);
  tools.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'labels') { const on = !svg.classList.contains('labels'); svg.classList.toggle('labels', on); b.setAttribute('aria-pressed', String(on)); }
    if (b.dataset.act === 'motion') { motion = !motion; alpha = 0.3; setMotionBtn(); }
    if (b.dataset.act === 'reset') { view = { x: 0, y: 0, w: W0, h: H0 }; applyView(); for (const n of nodes) { n.hx = n.x; n.hy = n.y; } focusNode(null); }
  });
  L.running = true;
}
