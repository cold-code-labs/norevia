// Norevia — shared page chrome (top bar + footer) for the landing page and the research archive.
// Styles: src/base.css. Behaviour (menu, solid-on-scroll): src/js/unfold.js.
import { esc } from './text.mjs';

export const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.3" opacity=".55"><circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="8.6"/></g><circle cx="20" cy="20" r="3.2" fill="#0e7a62"/><g fill="currentColor"><circle cx="35" cy="20" r="2"/><circle cx="9.4" cy="9.4" r="1.7"/><circle cx="25" cy="34.2" r="1.5"/><circle cx="28.6" cy="20" r="1.2"/></g></svg>`;
export const ARR = '<span class="arr" aria-hidden="true">→</span>';

// nav: [[href, label], ...]; current: href marked aria-current; solid: bar is solid from the top (no hero behind it)
export function topBar({ nav, current = null, solid = false }) {
  return `<header class="bar${solid ? ' solid' : ''}"${solid ? ' data-always-solid' : ''}>
<div class="wrap bar-in">
<a class="brand" href="/" aria-label="Norevia — home">${LOGO}<span>Norevia</span></a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu <i aria-hidden="true"></i></button>
<nav id="site-nav" aria-label="Main"><ul>${nav.map(([href, label]) => `<li><a href="${href}"${href === current ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`).join('')}</ul></nav>
<a class="pill" href="/defence/"><span class="pulse" aria-hidden="true"></span><span class="pl">Open</span> <b>Research</b></a>
</div>
</header>`;
}

// links: [[href, label], ...]; meta: optional HTML line under a hairline
export function footer({ site, links, meta = '' }) {
  return `<footer class="foot">
<div class="wrap foot-in">
<span><strong>Norevia</strong> — a <a href="${site.companyUrl}" rel="noopener noreferrer">Cold Code Labs</a> research project</span>
<ul>${links.map(([href, label]) => `<li><a href="${href}"${/^https?:/.test(href) ? ' rel="noopener noreferrer"' : ''}>${esc(label)}</a></li>`).join('')}</ul>
<span>No trackers, cookies or external fonts.</span>
${meta ? `<p class="foot-meta">${meta}</p>` : ''}
</div>
</footer>`;
}
