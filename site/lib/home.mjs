// Norevia — landing page (/). Standalone document with its own stylesheet and script
// (src/home.css, src/js/home.js); the research archive pages keep the shared layout.
// Positioning: Bioinspired Agentic Swarms, first release "Soon". Copy is research positioning,
// never a claim of results: the archive (/explore/, /method/) carries the evidence levels.
import { esc } from './text.mjs';

const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.3" opacity=".55"><circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="8.6"/></g><circle cx="20" cy="20" r="3.2" fill="#0e7a62"/><g fill="currentColor"><circle cx="35" cy="20" r="2"/><circle cx="9.4" cy="9.4" r="1.7"/><circle cx="25" cy="34.2" r="1.5"/><circle cx="28.6" cy="20" r="1.2"/></g></svg>`;
const ARR = '<span class="arr" aria-hidden="true">→</span>';

const STAGES = [
  ['Sense', 'One agent takes the task. Most work never needs more than that — and a swarm that knows it stays quiet.', 'A forager scouting before the colony moves'],
  ['Recruit', 'When difficulty rises, signals spread and specialists join — each one answering only once the stimulus crosses its own threshold.', 'Response thresholds in honeybee division of labour'],
  ['Decide', 'Agents explore in parallel and commit only when a quorum converges on an answer that can be checked.', 'Quorum sensing in nest-site selection'],
  ['Dissolve', 'Once the result is verified, the swarm releases itself. Only what is worth remembering stays behind.', 'Pheromone trails that evaporate unless reinforced'],
];

// Card art: small looping SVGs (CSS-animated, static under reduced motion).
const ART = {
  colonies: () => {
    const path = 'M-10 150 C 60 40, 140 190, 210 90 S 330 30, 420 120';
    const ants = Array.from({ length: 9 }, (_, i) => `<circle class="dot ant${i % 3 === 0 ? ' acc' : ''}" r="${i % 3 === 0 ? 3 : 2.3}" style="offset-path:path('${path}');--t:${(-i * 0.78).toFixed(2)}s"/>`).join('');
    return `<svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="trail" d="${path}"/><path class="trail" style="opacity:.25" d="M-10 60 C 90 120, 160 20, 260 130 S 360 170, 420 60"/>${ants}<circle class="acc" cx="210" cy="90" r="5" opacity=".9"/></svg>`;
  },
  bodies: () => {
    const cells = [[200, 95, 70, 0], [200, 95, 48, -1.2], [200, 95, 28, -2.4], [92, 60, 26, -0.6], [318, 132, 30, -1.8], [110, 150, 18, -3], [300, 46, 16, -2]];
    return `<svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${cells.map(([x, y, r, t]) => `<circle class="cell" cx="${x}" cy="${y}" r="${r}" style="--t:${t}s"/>`).join('')}<circle class="acc" cx="200" cy="95" r="6"/>${[[92, 60], [318, 132], [110, 150], [300, 46], [160, 120], [246, 70]].map(([x, y]) => `<circle class="dot" cx="${x}" cy="${y}" r="2.4"/>`).join('')}</svg>`;
  },
  skies: () => {
    const orbits = [[44, 14, 0], [72, 24, 1], [96, 38, 2]];
    return `<svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${orbits.map(([r]) => `<circle class="ring" cx="200" cy="95" r="${r}"/>`).join('')}<circle class="acc" cx="200" cy="95" r="7"/>${orbits.map(([r, s, i]) => `<g class="orb" style="--s:${s}s"><circle class="dot${i === 1 ? ' acc' : ''}" cx="${200 + r}" cy="95" r="${3.2 - i * 0.5}"/><circle class="dot" cx="${200 - r * 0.7}" cy="${95 - r * 0.71}" r="1.6" opacity=".5"/></g>`).join('')}</svg>`;
  },
};

const NATURE = [
  { key: 'colonies', name: 'Colonies', sub: 'Ants and bees coordinate thousands of workers without a manager.', rows: [['Principle', 'Stigmergy, specialisation, recruitment and quorum.'], ['For agents', '<strong>Coordination with less communication</strong> — agents leave traces in shared work instead of talking to everyone.']] },
  { key: 'bodies', name: 'Bodies', sub: 'Reflexes, immunity and homeostasis keep an organism stable.', rows: [['Principle', 'Fast local reaction, selective memory, regulation around a set point.'], ['For agents', '<strong>Bounded recovery</strong> — detect failure, repair it, and know when to stop trying.']] },
  { key: 'skies', name: 'Skies', sub: 'Orbits, resonance and cascades govern stable systems at scale.', rows: [['Principle', 'Equilibrium, dependencies and cascade containment.'], ['For agents', '<strong>Capacity and stability</strong> — keep the swarm in balance and stop one failure from becoming many.']] },
];

const PRINCIPLES = [
  ['Local autonomy', 'Each agent acts on what it senses — not on a central script.', [[8, 10], [30, 6], [20, 24], [38, 30], [10, 36], [26, 40, 'a']]],
  ['Elastic by default', 'Collective effort grows with the problem and shrinks with it.', [[23, 23, 'a'], [13, 23], [33, 23], [23, 13], [23, 33], [6, 8], [40, 38]]],
  ['Verifiable acceptance', 'A result only counts when it can be checked, not when agents agree.', [[10, 24], [18, 32], [26, 24, 'a'], [32, 16], [38, 8]]],
  ['Bounded repair', 'Failures are contained and healed — with a known point to stop.', [[23, 8], [10, 18], [36, 18], [14, 34], [32, 34], [23, 23, 'a']]],
];

const glyph = (pts) => `<svg class="glyph" viewBox="0 0 46 46" aria-hidden="true">${pts.map(([x, y, a]) => `<circle${a ? ' class="a"' : ''} cx="${x}" cy="${y}" r="${a ? 4 : 2.6}"/>`).join('')}</svg>`;

export function pageLanding({ LAB, assets, build }) {
  const S = LAB.SITE;
  const title = `Norevia — ${S.title}`;
  const desc = `Norevia, a Cold Code Labs research project: bioinspired agentic swarms — AI agents that organise the way living systems do. First release soon.`;
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#f4f3ee">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(S.full)}">
<meta property="og:url" content="${S.url}/">
<link rel="canonical" href="${S.url}/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${assets.css}">
<script src="${assets.js}" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar">
<div class="wrap bar-in">
<a class="brand" href="/" aria-label="Norevia — home">${LOGO}<span>Norevia</span></a>
<nav aria-label="Main"><ul><li><a href="#unfold">How it unfolds</a></li><li><a href="#nature">Nature</a></li><li><a href="#principles">Principles</a></li><li><a href="/explore/">Research</a></li></ul></nav>
<a class="pill" href="#soon"><span class="pulse" aria-hidden="true"></span>Release <b>Soon</b></a>
</div>
</header>

<main id="main" tabindex="-1">
<section class="hero" aria-labelledby="hero-title">
<canvas data-swarm="hero" aria-hidden="true"></canvas>
<div class="wrap hero-in">
<div class="hero-copy">
<p class="pill hero-pill u" style="--d:200ms"><span class="pulse" aria-hidden="true"></span>First release · <b>Soon</b></p>
<h1 id="hero-title" data-words data-em="Agentic">Bioinspired Agentic Swarms</h1>
<p class="lede u" style="--d:550ms">AI agents that organise the way living systems do — gathering around hard problems, staying lean on easy ones, and dissolving when the work is done.</p>
<p class="ctas u" style="--d:750ms"><a class="btn" href="#soon">Follow the release ${ARR}</a><a class="btn ghost" href="#unfold">See how it unfolds <span class="arr down" aria-hidden="true">↓</span></a></p>
</div>
</div>
<div class="wrap hero-foot" aria-hidden="true"><span class="scrollcue"><i></i>Scroll</span><span class="made">Touch or click the swarm</span></div>
</section>

<section class="sec manifesto" aria-label="Why nature">
<div class="wrap" data-scrub>
<p class="kicker">Why nature</p>
<p data-em="central|simple|AI">Nature has no central controller. Ant colonies, immune systems and flocks coordinate thousands of simple agents through local signals alone. Norevia brings those principles to AI agents.</p>
</div>
</section>

<section class="stages" id="unfold" data-stages aria-labelledby="unfold-title">
<div class="stages-pin">
<canvas aria-hidden="true"></canvas>
<div class="stage-copy">
<p class="kicker" id="unfold-title">How a swarm unfolds</p>
<ol class="stage-list">
${STAGES.map(([h, p, bio], i) => `<li class="stage${i === 0 ? ' on' : ''}"><span class="n">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(p)}</p><span class="bio">Inspired by <em>${esc(bio.charAt(0).toLowerCase() + bio.slice(1))}</em></span></li>`).join('\n')}
</ol>
<div class="stage-dots" aria-hidden="true">${STAGES.map(() => '<i><b></b></i>').join('')}</div>
</div>
<span class="stage-count" aria-hidden="true">01 / 04</span>
</div>
</section>

<section class="sec nature" id="nature" aria-labelledby="nature-title">
<div class="wrap">
<div class="nature-head">
<div><p class="kicker">Sources of design</p><h2 id="nature-title" data-words data-em="nature,">Borrowed from nature, held to evidence</h2></div>
<p class="lead u">Three families of living and physical systems give us the mechanisms. Experiments decide which ones earn a place in the swarm.</p>
</div>
<ul class="nature-grid">
${NATURE.map((n, i) => `<li class="ncard u" style="--d:${i * 120}ms"><button type="button" aria-expanded="false" aria-controls="fold-${n.key}"><div class="art">${ART[n.key]()}</div><h3>${esc(n.name)}<span class="plus" aria-hidden="true"></span></h3><p class="sub">${esc(n.sub)}</p></button><div class="fold" id="fold-${n.key}"><div><dl>${n.rows.map(([k, v], j) => `<div style="--i:${j}"><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl></div></div></li>`).join('\n')}
</ul>
</div>
</section>

<section class="sec principles" id="principles" aria-labelledby="pr-title">
<div class="wrap">
<p class="kicker">What makes it a swarm</p>
<h2 id="pr-title" data-words data-em="not|label.">A swarm by behaviour, not by label.</h2>
<p class="lead u">Many agents following a fixed script — or a central orchestrator — is not a swarm. We count only what can be observed.</p>
<ol class="p-grid">
${PRINCIPLES.map(([h, p, g], i) => `<li class="u" style="--d:${i * 110}ms">${glyph(g)}<h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('\n')}
</ol>
<div class="honest u">
<span class="mark" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7.5"/><path d="M6.5 10.3l2.3 2.2 4.7-4.8"/></svg></span>
<p>Swarms don’t always win. <span>Every mechanism has to beat one strong agent on the same budget — or it stays out.</span></p>
<a href="/method/">How we measure ${ARR}</a>
</div>
</div>
</section>

<section class="soon" id="soon" aria-labelledby="soon-title">
<canvas data-swarm="soon" aria-hidden="true"></canvas>
<div class="soon-label"><p class="soon-word" aria-hidden="true">Soon</p></div>
<div class="wrap soon-in">
<div>
<p class="kicker" id="soon-title">First release · Soon</p>
<p>The first Norevia release is taking shape. Follow the work in the open while the swarm comes together.</p>
<p class="ctas"><a class="btn" href="${S.repo}" rel="noopener noreferrer">Watch on GitHub ${ARR}</a><a class="btn ghost" href="/explore/">Browse the research</a></p>
</div>
</div>
</section>
</main>

<footer class="foot">
<div class="wrap foot-in">
<span><strong style="color:var(--ink)">Norevia</strong> — a <a href="${S.companyUrl}" rel="noopener noreferrer">Cold Code Labs</a> research project</span>
<ul><li><a href="/explore/">Research archive</a></li><li><a href="/method/">Method</a></li><li><a href="/about/">About</a></li><li><a href="${S.repo}" rel="noopener noreferrer">GitHub</a></li></ul>
<span>No trackers, cookies or external fonts.${build.commit ? ` · <code>${esc(build.commit)}</code>` : ''}</span>
</div>
</footer>
</body>
</html>
`;
}
