// Norevia — shared identity behaviour, prepended to the landing-page script and to core.js.
// Word-by-word titles ([data-words]), blocks that unfold on enter (.u / .rv), the top bar and the
// mobile menu. Without JS everything stays visible (html.no-js).
(() => {
  const doc = document.documentElement;
  doc.classList.remove('no-js');
  doc.classList.add('js');
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rm) doc.classList.add('rm');

  for (const el of document.querySelectorAll('[data-words]')) {
    const text = el.textContent.trim();
    const emph = new Set((el.dataset.em || '').split('|').filter(Boolean));
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}"${emph.has(w) ? ' class="it"' : ''}>${w.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)}</span></span>`).join(' ');
    el.classList.add('words');
  }

  const targets = [...document.querySelectorAll('.u, .rv, .words')];
  if (rm || !('IntersectionObserver' in window)) targets.forEach((el) => el.classList.add('in'));
  else {
    const io = new IntersectionObserver((es) => {
      let k = 0;
      for (const e of es) if (e.isIntersecting) {
        if (e.target.classList.contains('rv') && !e.target.style.getPropertyValue('--d')) e.target.style.setProperty('--d', Math.min(k++ * 70, 350) + 'ms');
        e.target.classList.add('in'); io.unobserve(e.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((el) => io.observe(el));
  }

  const bar = document.querySelector('.bar');
  if (bar && !bar.hasAttribute('data-always-solid')) {
    const solid = () => bar.classList.toggle('solid', scrollY > 40 || bar.querySelector('nav.open') !== null);
    addEventListener('scroll', solid, { passive: true }); solid();
  }

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    const set = (open) => {
      toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open);
      if (bar && !bar.hasAttribute('data-always-solid')) bar.classList.toggle('solid', open || scrollY > 40);
    };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); toggle.focus(); } });
  }
})();
