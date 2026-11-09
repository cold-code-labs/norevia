// Site-wide progressive enhancement. The site works without JS; this adds filters, tooltips and micro-interactions.
const RMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;

// .js class, .rv/.u unfold, [data-words] titles and the mobile menu: src/js/unfold.js (prepended at build time).

// ---------------------------------------------------------------- "/" focuses the page search
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
  const s = document.querySelector('input[type="search"]:not([hidden])');
  if (s && s.offsetParent !== null) { e.preventDefault(); s.focus(); }
});

// ---------------------------------------------------------------- filters (lists + graph)
for (const form of document.querySelectorAll('form[data-filters]')) {
  // one filter form per page drives every list on it (the Explore list sits in its own section)
  const single = document.querySelectorAll('form[data-filters]').length === 1;
  const scope = (single ? form.closest('main') : form.closest('section')) || document;
  const items = [...scope.querySelectorAll('.filterable > li')];
  const empty = scope.querySelector('.filtered-empty');
  const count = form.querySelector('.fcount');
  const q = form.querySelector('input[name="q"]');
  const state = { area: new Set(), ev: new Set(), st: new Set(), pivot: new Set() };
  form.hidden = false;
  form.addEventListener('submit', (e) => e.preventDefault());
  const match = (d) => {
    if (state.pivot.size && !state.pivot.has(d.pivot)) return false;
    if (state.area.size && !state.area.has(d.area)) return false;
    if (state.ev.size && !state.ev.has(d.ev)) return false;
    if (state.st.size && !state.st.has(d.st)) return false;
    const t = (q.value || '').trim().toLowerCase();
    if (t && d.text && !t.split(/\s+/).every((w) => d.text.includes(w))) return false;
    return true;
  };
  const apply = () => {
    let n = 0;
    for (const li of items) { const ok = match(li.dataset); li.hidden = !ok; if (ok) n++; }
    if (empty) empty.hidden = n > 0 || !items.length;
    const active = state.pivot.size || state.area.size || state.ev.size || state.st.size || q.value.trim();
    count.textContent = active ? `${n} of ${items.length} cards match` : `${items.length} cards`;
    document.nrvFilterState = { match, active: !!active };
    document.dispatchEvent(new CustomEvent('nrv:filter', { detail: document.nrvFilterState }));
    const params = new URLSearchParams();
    for (const k of ['area', 'ev', 'st', 'pivot']) if (state[k].size) params.set(k, [...state[k]].join(','));
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
  const params = new URLSearchParams(location.search);
  for (const key of ['area', 'ev', 'st', 'pivot']) {
    for (const v of (params.get(key) || '').split(',').filter(Boolean)) {
      const b = form.querySelector(`button[data-filter="${key}"][data-value="${CSS.escape(v)}"]`);
      if (b) { b.setAttribute('aria-pressed', 'true'); state[key].add(v); }
    }
  }
  if (params.get('q')) q.value = params.get('q');
  // let the graph (deferred script) register its listener first
  setTimeout(apply, 0);
}

// ---------------------------------------------------------------- static chart tooltips
for (const box of document.querySelectorAll('.chart-box')) {
  const tip = box.querySelector('.tip');
  if (!tip) continue;
  const show = (e) => {
    const pt = e.target.closest('.pt');
    if (!pt) return;
    const b = box.getBoundingClientRect();
    const r = (pt.querySelector('.dot, path') || pt).getBoundingClientRect();
    tip.textContent = pt.dataset.tip;
    tip.hidden = false;
    tip.style.left = Math.min(Math.max(r.left + r.width / 2 - b.left, 90), b.width - 90) + 'px';
    tip.style.top = r.top - b.top + 'px';
  };
  const hide = () => { tip.hidden = true; };
  box.addEventListener('pointerover', show);
  box.addEventListener('focusin', show);
  box.addEventListener('pointerleave', hide);
  box.addEventListener('focusout', hide);
  box.querySelectorAll('.pt title').forEach((t) => t.remove());
}

// ---------------------------------------------------------------- card spotlight follows the pointer
if (!RMQ.matches && window.matchMedia('(hover: hover)').matches) {
  document.addEventListener('pointermove', (e) => {
    const a = e.target.closest && e.target.closest('.card-link');
    if (!a) return;
    const r = a.getBoundingClientRect();
    a.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
    a.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
  }, { passive: true });
}
