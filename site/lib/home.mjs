// Norevia — landing page (/). Standalone document with its own stylesheet and script
// (src/home.css, src/js/home.js); the research archive pages keep the shared layout.
// Positioning: Bioinspired Agentic Swarms, first release "Soon". Copy is research positioning,
// never a claim of results: the archive (/explore/, /method/) carries the evidence levels.
import { esc } from './text.mjs';
import { ARR, topBar, footer } from './chrome.mjs';
import { REALMS, CROSSINGS } from './realms.mjs';

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

// Realm plates. Unseen: a microscope field with drifting bacteria and cells. Beyond: a night sky whose
// galaxies are joined into filaments (the cosmic web). Seen reuses the colony/flock art above.
const PLATES = {
  unseen: () => {
    const rnd = prng(11), bugs = [];
    for (let i = 0; i < 26; i++) {
      const x = 30 + rnd() * 340, y = 30 + rnd() * 340, a = Math.round(rnd() * 180), L = 9 + rnd() * 9;
      if (Math.hypot(x - 200, y - 200) > 160) continue;
      bugs.push('<g class="bug" style="--t:' + (-rnd() * 8).toFixed(1) + 's;--dx:' + r1((rnd() - 0.5) * 30) + 'px;--dy:' + r1((rnd() - 0.5) * 30) + 'px"><rect x="' + r1(x - L / 2) + '" y="' + r1(y - 3) + '" width="' + r1(L) + '" height="6" rx="3" transform="rotate(' + a + ' ' + r1(x) + ' ' + r1(y) + ')"/></g>');
    }
    const cells = [[140, 150, 30], [262, 236, 24], [196, 300, 18]].map(([x, y, r], i) => '<g class="cell" style="--t:' + -i * 1.4 + 's"><circle class="mem" cx="' + x + '" cy="' + y + '" r="' + r + '"/><circle class="nuc" cx="' + (x + 4) + '" cy="' + (y - 3) + '" r="' + r1(r * 0.38) + '"/></g>').join('');
    return '<svg viewBox="0 0 400 400" aria-hidden="true"><defs><clipPath id="lens"><circle cx="200" cy="200" r="170"/></clipPath><radialGradient id="vig"><stop offset="70%" stop-color="#101312" stop-opacity="0"/><stop offset="100%" stop-color="#101312" stop-opacity=".22"/></radialGradient></defs><circle cx="200" cy="200" r="170" class="lens-bg"/><g clip-path="url(#lens)">' + cells + bugs.join('') + '</g><circle cx="200" cy="200" r="170" fill="url(#vig)"/><circle cx="200" cy="200" r="170" class="lens-rim"/><path class="tick" d="M200 22v14M200 364v14M22 200h14M364 200h14"/></svg>';
  },
  seen: () => ART.colonies().replace('viewBox="0 0 400 190"', 'viewBox="40 0 320 190"'),
  beyond: () => {
    const rnd = prng(29), pts = [];
    for (let i = 0; i < 70; i++) { const c = [[110, 120], [290, 110], [200, 250], [320, 300], [80, 300]][i % 5]; pts.push([c[0] + (rnd() - 0.5) * 150, c[1] + (rnd() - 0.5) * 110]); }
    const edges = [];
    pts.forEach((p, i) => pts.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1])]).filter(([j]) => j > i).sort((a, b) => a[1] - b[1]).slice(0, 2).forEach(([j, d]) => { if (d < 80) edges.push('<path class="fil" d="M' + r1(p[0]) + ' ' + r1(p[1]) + 'Q' + r1((p[0] + pts[j][0]) / 2 + (rnd() - 0.5) * 20) + ' ' + r1((p[1] + pts[j][1]) / 2 + (rnd() - 0.5) * 20) + ' ' + r1(pts[j][0]) + ' ' + r1(pts[j][1]) + '"/>'); }));
    const stars = Array.from({ length: 90 }, () => '<circle class="st" cx="' + r1(rnd() * 400) + '" cy="' + r1(rnd() * 400) + '" r="' + r1(0.4 + rnd() * 0.9) + '" style="--t:' + (-rnd() * 5).toFixed(1) + 's"/>').join('');
    const gal = pts.map(([x, y], i) => '<circle class="gal' + (i % 9 === 0 ? ' hot' : '') + '" cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(1.2 + rnd() * 2.2) + '"/>').join('');
    return '<svg viewBox="0 0 400 400" aria-hidden="true">' + stars + edges.join('') + gal + '</svg>';
  },
};
// a small hunting pack: five predators encircling one prey
const PACK = '<svg viewBox="0 0 120 120" aria-hidden="true" class="pack"><circle cx="60" cy="60" r="40" class="ring"/><g class="circle">' + [0, 1, 2, 3, 4].map((i) => { const t = (i / 5) * Math.PI * 2; return '<circle cx="' + r1(60 + Math.cos(t) * 40) + '" cy="' + r1(60 + Math.sin(t) * 40) + '" r="5"/>'; }).join('') + '</g><circle cx="60" cy="60" r="6" class="prey"/></svg>';


// Principle pictograms: an ant, a dividing cell, comb cells with a check, a healing leaf.
const PRINCIPLES = [
  ['Local autonomy', 'Each agent acts on what it senses — not on a central script.', '<ellipse cx="14" cy="23" rx="7" ry="5"/><ellipse cx="24" cy="23" rx="3.6" ry="3"/><circle cx="31" cy="23" r="3.2" class="a"/><path d="M33 20.5l5-6M33 25.5l5 6M21 21l-3-7M25 21l2-7M21 25l-3 7M25 25l2 7M15 19l-4-5M15 27l-4 5"/>'],
  ['Elastic by default', 'Collective effort grows with the problem and shrinks with it.', '<path d="M23 9c-7.5 0-13 6-13 14s5.5 14 13 14M23 9c7.5 0 13 6 13 14s-5.5 14-13 14M23 9c-2.5 4.5-2.5 23.5 0 28"/><circle cx="16" cy="23" r="3" class="a"/><circle cx="30" cy="23" r="3" class="a"/>'],
  ['Verifiable acceptance', 'A result only counts when it can be checked, not when agents agree.', '<path d="M15 9l7 4v8l-7 4-7-4v-8zM31 9l7 4v8l-7 4-7-4v-8zM23 23l7 4v8l-7 4-7-4v-8z"/><path class="a-s" d="M19.5 31l2.5 2.5 5-5"/>'],
  ['Bounded repair', 'Failures are contained and healed — with a known point to stop.', '<path d="M10 37C10 20 20 9 37 9c0 17-11 28-27 28z"/><path d="M10 37L33 13M17 30l-1-7M23 24l-1-7M17 30l7 0M23 24l7 0"/><circle cx="27" cy="19" r="2.6" class="a"/>'],
];

const glyph = (inner) => '<svg class="glyph" viewBox="0 0 46 46" aria-hidden="true">' + inner + '</svg>';

export function pageLanding({ LAB, assets, build, head }) {
  const S = LAB.SITE;
  const title = `Norevia — ${S.title}`;
  const desc = `Norevia, a Cold Code Labs research project: bioinspired agentic swarms — AI agents that organise the way living systems do. First release soon.`;
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${head}
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#f4f3ee">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${assets.preload || ''}
<link rel="stylesheet" href="${assets.base}">
<link rel="stylesheet" href="${assets.css}">
<script src="${assets.js}" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${topBar({ nav: [['#slime', 'Living models'], ['#unfold', 'How it unfolds'], ['#nature', 'Unseen · Seen · Beyond'], ['/journal/', 'Journal'], ['/explore/', 'Research'], ['/contact/', 'Contact']] })}

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

<section class="sec realms" id="nature" aria-labelledby="nature-title">
<div class="wrap">
<div class="realms-head">
<div><p class="kicker">From cell to cosmos</p><h2 id="nature-title" data-words data-em="Seen">Unseen · Seen · Beyond</h2></div>
<div><p class="lead u">We look for organising principles at every scale — below the naked eye, within its reach, and beyond the planet. Biology gives mechanisms; physics gives analogies; experiments decide which ones earn a place in the swarm.</p>
<nav class="realm-tabs u" aria-label="Realms">${REALMS.map((r) => `<a href="#realm-${r.key}"><span>${r.n}</span>${esc(r.name)}<b>${r.items.length}</b></a>`).join('')}</nav></div>
</div>
</div>
${REALMS.map((r) => `<div class="realm realm-${r.key}" id="realm-${r.key}">
<div class="wrap realm-in">
<div class="realm-side">
<p class="realm-n">${r.n} · ${esc(r.scale)}</p>
<h3 class="realm-name">${esc(r.name)}</h3>
<p class="realm-lead">${esc(r.lead)}</p>
<div class="plate art plate-${r.key}">${PLATES[r.key]()}</div>
${r.key === 'beyond' ? '<p class="realm-flag">Physical analogy · no agents, no intent</p>' : ''}
</div>
<ul class="specs">
${r.items.map(([name, does, agents, st], i) => {
  const tag = typeof st === 'string' ? `<a class="sp-tag arc" href="/c/${st}/">Archive card ${ARR}</a>` : st ? `<a class="sp-tag pub" href="${esc(st.url)}" rel="noopener noreferrer">${esc(st.pub)} ${ARR}</a>` : '<span class="sp-tag cand">Candidate · sources in progress</span>';
  return `<li class="spec u" style="--d:${(i % 2) * 90}ms"><h4>${esc(name)}</h4><p>${esc(does)}</p><p class="for"><span aria-hidden="true">→</span> ${esc(agents)}</p>${tag}</li>`;
}).join('\n')}
${r.teams ? `<li class="spec teams u">${PACK}<div><h4>${esc(r.teams.title)}</h4><p>${esc(r.teams.text)}</p><a class="sp-tag arc" href="/c/${r.teams.card}/">Counter-model · archive card ${ARR}</a></div></li>` : ''}
</ul>
</div>
</div>`).join('\n')}
<div class="wrap crossings">
<p class="kicker">Rules that cross realms</p>
<h3 class="cross-h">The same mechanism, three scales apart.</h3>
<ol class="cross-list">
${CROSSINGS.map(([rule, ...cells]) => `<li class="u"><span class="cross-rule">${esc(rule)}</span>${cells.map(([t, k]) => `<span class="cross-cell c-${k}"><i>${k === 'unseen' ? 'Unseen' : k === 'seen' ? 'Seen' : 'Beyond'}</i>${esc(t)}</span>`).join('')}</li>`).join('\n')}
</ol>
<p class="cross-note">Every entry links to an archive card with its primary sources and evidence level. Beyond is analogy by definition.</p>
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

${footer({ site: S, links: [['/journal/', 'Journal'], ['/explore/', 'Research archive'], ['/flags/', 'Flag registry'], ['/method/', 'Method'], ['/about/', 'About'], ['/contact/', 'Contact'], [S.repo, 'GitHub']] })}
</body>
</html>
`;
}
