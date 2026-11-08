// Norevia — landing page (/). Standalone document with its own stylesheet and script
// (src/home.css, src/js/home.js); the research archive pages keep the shared layout.
// Positioning: Bioinspired Agentic Swarms, first release "Soon". Copy is research positioning,
// never a claim of results: the archive (/explore/, /method/) carries the evidence levels.
import { esc } from './text.mjs';
import { ARR, topBar, footer } from './chrome.mjs';

const STAGES = [
  ['Sense', 'One agent takes the task. Most work never needs more than that — and a swarm that knows it stays quiet.', 'A forager scouting before the colony moves'],
  ['Recruit', 'When difficulty rises, signals spread and specialists join — each one answering only once the stimulus crosses its own threshold.', 'Response thresholds in honeybee division of labour'],
  ['Decide', 'Agents explore in parallel and commit only when a quorum converges on an answer that can be checked.', 'Quorum sensing in nest-site selection'],
  ['Dissolve', 'Once the result is verified, the swarm releases itself. Only what is worth remembering stays behind.', 'Pheromone trails that evaporate unless reinforced'],
];

// Card art: small looping SVG illustrations of living systems (CSS-animated, static under reduced motion).
const r1 = (v) => v.toFixed(1);
function prng(seed) { let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; }
const ART = {
  // a honeycomb with bees flying in along a curved path
  colonies: () => {
    const R = 15, hexes = [];
    for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) {
      const x = 205 + col * R * 1.74 + (row % 2) * R * 0.87, y = 18 + row * R * 1.5;
      const fill = (row * 7 + col * 3) % 5 === 0 ? 'honey' : (row + col) % 4 === 0 ? 'brood' : '';
      hexes.push('<path class="comb ' + fill + '" d="' + Array.from({ length: 6 }, (_, i) => { const t = (i / 6) * Math.PI * 2 + Math.PI / 6; return (i ? 'L' : 'M') + r1(x + Math.cos(t) * R) + ' ' + r1(y + Math.sin(t) * R); }).join('') + 'Z"/>');
    }
    const path = 'M-20 160 C 40 120, 90 170, 140 110 S 210 60, 250 80';
    const bee = (i) => '<g class="bee" style="offset-path:path(\'' + path + '\');--t:' + (-i * 1.6).toFixed(1) + 's"><ellipse class="wing" cx="-1" cy="-4" rx="4" ry="2.6"/><ellipse class="wing" cx="-1" cy="4" rx="4" ry="2.6"/><ellipse class="body" rx="5.4" ry="3.2"/><path class="stripe" d="M-2 -3V3M1 -3V3"/><circle class="head" cx="5.6" r="2"/></g>';
    return '<svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + hexes.join('') + '<path class="flight" d="' + path + '"/>' + [0, 1, 2, 3].map(bee).join('') + '</svg>';
  },
  // cells with membranes and nuclei; immune cells close in on a pathogen
  bodies: () => {
    const cells = [[70, 60, 34, 0], [130, 140, 28, -1.4], [330, 52, 30, -2.2], [345, 145, 24, -0.7], [40, 150, 20, -3]];
    const cell = ([x, y, r, t]) => '<g class="cell" style="--t:' + t + 's"><circle class="mem" cx="' + x + '" cy="' + y + '" r="' + r + '"/><circle class="nuc" cx="' + (x + r * 0.15) + '" cy="' + (y - r * 0.1) + '" r="' + r1(r * 0.36) + '"/></g>';
    const spikes = Array.from({ length: 12 }, (_, i) => { const t = (i / 12) * Math.PI * 2; return 'M' + r1(220 + Math.cos(t) * 11) + ' ' + r1(95 + Math.sin(t) * 11) + 'L' + r1(220 + Math.cos(t) * 17) + ' ' + r1(95 + Math.sin(t) * 17); }).join('');
    const immune = [[170, 60, 0], [262, 140, -1.5], [176, 138, -3]].map(([x, y, t]) => '<g class="immune" style="--dx:' + r1((220 - x) * 0.42) + 'px;--dy:' + r1((95 - y) * 0.42) + 'px;--t:' + t + 's"><circle cx="' + x + '" cy="' + y + '" r="10"/><circle class="in" cx="' + (x - 2) + '" cy="' + (y - 1) + '" r="4"/></g>').join('');
    return '<svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + cells.map(cell).join('') + '<g class="pathogen"><circle cx="220" cy="95" r="11"/><path d="' + spikes + '"/></g>' + immune + '</svg>';
  },
  // a murmuration: three layers of birds that drift apart and fold back together
  flocks: () => {
    const rnd = prng(7), birds = (n, cls) => '<g class="flock ' + cls + '">' + Array.from({ length: n }, () => {
      const t = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.6), x = 200 + Math.cos(t) * d * 150, y = 95 + Math.sin(t) * d * 60 + Math.sin(x / 40) * 10, w = 2 + rnd() * 1.6;
      return 'M' + r1(x - w) + ' ' + r1(y - w * 0.4) + 'Q' + r1(x - w * 0.4) + ' ' + r1(y) + ' ' + r1(x) + ' ' + r1(y + w * 0.25) + 'Q' + r1(x + w * 0.4) + ' ' + r1(y) + ' ' + r1(x + w) + ' ' + r1(y - w * 0.4);
    }).join('') + '"/></g>';
    return '<svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + [birds(90, 'f1'), birds(80, 'f2'), birds(70, 'f3')].map((g) => g.replace('">M', '"><path d="M')).join('') + '</svg>';
  },
  skies: () => {
    const orbits = [[44, 14, 0], [72, 24, 1], [96, 38, 2]];
    return '<svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + orbits.map(([r]) => '<circle class="ring" cx="200" cy="95" r="' + r + '"/>').join('') + '<circle class="acc" cx="200" cy="95" r="7"/>' + orbits.map(([r, sp, i]) => '<g class="orb" style="--s:' + sp + 's"><circle class="dot' + (i === 1 ? ' acc' : '') + '" cx="' + (200 + r) + '" cy="95" r="' + (3.2 - i * 0.5) + '"/><circle class="dot" cx="' + r1(200 - r * 0.7) + '" cy="' + r1(95 - r * 0.71) + '" r="1.6" opacity=".5"/></g>').join('') + '</svg>';
  },
};

const NATURE = [
  { key: 'colonies', name: 'Colonies', sub: 'Ants and bees coordinate thousands of workers without a manager.', rows: [['Principle', 'Stigmergy, specialisation, recruitment and quorum.'], ['For agents', '<strong>Coordination with less communication</strong> — agents leave traces in shared work instead of talking to everyone.']] },
  { key: 'bodies', name: 'Bodies', sub: 'Reflexes, immunity and homeostasis keep an organism stable.', rows: [['Principle', 'Fast local reaction, selective memory, regulation around a set point.'], ['For agents', '<strong>Bounded recovery</strong> — detect failure, repair it, and know when to stop trying.']] },
  { key: 'flocks', name: 'Flocks', sub: 'Each starling follows six or seven neighbours — not the whole flock.', rows: [['Principle', 'Topological neighbourhoods; a disturbance still crosses the whole flock.'], ['For agents', '<strong>Bounded attention</strong> — each agent reads a few peers, and the group still moves as one.']] },
  { key: 'skies', name: 'Skies', sub: 'Orbits, resonance and cascades govern stable systems at scale.', rows: [['Principle', 'Equilibrium, dependencies and cascade containment.'], ['For agents', '<strong>Capacity and stability</strong> — keep the swarm in balance and stop one failure from becoming many.']] },
];

// Principle pictograms: an ant, a dividing cell, comb cells with a check, a healing leaf.
const PRINCIPLES = [
  ['Local autonomy', 'Each agent acts on what it senses — not on a central script.', '<ellipse cx="14" cy="23" rx="7" ry="5"/><ellipse cx="24" cy="23" rx="3.6" ry="3"/><circle cx="31" cy="23" r="3.2" class="a"/><path d="M33 20.5l5-6M33 25.5l5 6M21 21l-3-7M25 21l2-7M21 25l-3 7M25 25l2 7M15 19l-4-5M15 27l-4 5"/>'],
  ['Elastic by default', 'Collective effort grows with the problem and shrinks with it.', '<path d="M23 9c-7.5 0-13 6-13 14s5.5 14 13 14M23 9c7.5 0 13 6 13 14s-5.5 14-13 14M23 9c-2.5 4.5-2.5 23.5 0 28"/><circle cx="16" cy="23" r="3" class="a"/><circle cx="30" cy="23" r="3" class="a"/>'],
  ['Verifiable acceptance', 'A result only counts when it can be checked, not when agents agree.', '<path d="M15 9l7 4v8l-7 4-7-4v-8zM31 9l7 4v8l-7 4-7-4v-8zM23 23l7 4v8l-7 4-7-4v-8z"/><path class="a-s" d="M19.5 31l2.5 2.5 5-5"/>'],
  ['Bounded repair', 'Failures are contained and healed — with a known point to stop.', '<path d="M10 37C10 20 20 9 37 9c0 17-11 28-27 28z"/><path d="M10 37L33 13M17 30l-1-7M23 24l-1-7M17 30l7 0M23 24l7 0"/><circle cx="27" cy="19" r="2.6" class="a"/>'],
];

const glyph = (inner) => '<svg class="glyph" viewBox="0 0 46 46" aria-hidden="true">' + inner + '</svg>';

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
<link rel="stylesheet" href="${assets.base}">
<link rel="stylesheet" href="${assets.css}">
<script src="${assets.js}" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${topBar({ nav: [['#slime', 'Living models'], ['#unfold', 'How it unfolds'], ['#nature', 'Nature'], ['/explore/', 'Research']] })}

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
<div class="wrap hero-foot" aria-hidden="true"><span class="scrollcue"><i></i>Scroll</span><span class="made">Click anywhere to drop food — the colony will find it</span></div>
</section>

<section class="sec manifesto" aria-label="Why nature">
<div class="wrap" data-scrub>
<p class="kicker">Why nature</p>
<p data-em="central|simple|AI">Nature has no central controller. Ant colonies, immune systems and flocks coordinate thousands of simple agents through local signals alone. Norevia brings those principles to AI agents.</p>
</div>
</section>

<section class="slime" id="slime" aria-labelledby="slime-title">
<div class="wrap slime-head">
<div><p class="kicker">Live model · slime mould</p><h2 id="slime-title" data-words data-em="brain.">No brain. Still a network.</h2></div>
<p class="lead u">A single-celled slime mould links food sources with tubes that thicken with use and fade without it. On a map of the Tokyo region, <em>Physarum polycephalum</em> grew a network comparable to the rail system in cost, efficiency and fault tolerance.</p>
</div>
<canvas data-slime role="img" aria-label="A slime-mould network growing between food sources"></canvas>
<div class="wrap slime-foot"><span>Click to place food. An agent-based approximation running in your browser — an illustration, not the published model.</span><a href="/c/nat-physarum-network/">Tero et al., <em>Science</em> 2010 ${ARR}</a></div>
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
<p class="lead u">Colonies, bodies, flocks and skies give us the mechanisms. Experiments decide which ones earn a place in the swarm.</p>
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

${footer({ site: S, links: [['/explore/', 'Research archive'], ['/method/', 'Method'], ['/about/', 'About'], [S.repo, 'GitHub']] })}
</body>
</html>
`;
}
