// Norevia — landing page (/). Standalone document with its own stylesheet and script
// (src/home.css, src/js/home.js); the research archive pages keep the shared layout.
// Positioning: Social Immunity for Agentic Systems. Copy is research positioning,
// never a claim of results: the archive (/explore/, /method/) carries the evidence levels.
import { pageLenses } from './lenses.mjs';
import { natureArt } from './nature-art.mjs';
import { esc } from './text.mjs';
import { ARR, topBar, footer } from './chrome.mjs';

const STAGES = [
  ['Detect', 'Agents identify suspicious evidence and preserve its provenance before it enters shared memory or action.', 'Social immunity: recognition and early containment'],
  ['Signal', 'A local alarm recruits targeted review; inhibition applies only to the implicated source, tool or action.', 'Honeybee alarm and inhibitory signals'],
  ['Reconfigure', 'The system can narrow who reads what, quarantine a source and verify claims independently.', 'Contact-network plasticity in ant colonies'],
  ['Recover', 'After containment is verified, the response stands down; only validated evidence persists.', 'Engineering question: independently verified recovery'],
];

// Principle pictograms: provenance, targeted containment, independent verification and recovery.
const PRINCIPLES = [
  ['Track provenance', 'Keep the source and transformations attached to each claim as it moves.', '<ellipse cx="14" cy="23" rx="7" ry="5"/><ellipse cx="24" cy="23" rx="3.6" ry="3"/><circle cx="31" cy="23" r="3.2" class="a"/><path d="M33 20.5l5-6M33 25.5l5 6M21 21l-3-7M25 21l2-7M21 25l-3 7M25 25l2 7M15 19l-4-5M15 27l-4 5"/>'],
  ['Contain specifically', 'Quarantine the implicated source or action; avoid suppressing unrelated work.', '<path d="M23 9c-7.5 0-13 6-13 14s5.5 14 13 14M23 9c7.5 0 13 6 13 14s-5.5 14-13 14M23 9c-2.5 4.5-2.5 23.5 0 28"/><circle cx="16" cy="23" r="3" class="a"/><circle cx="30" cy="23" r="3" class="a"/>'],
  ['Verify independently', 'Agreement is not enough: check evidence against a trusted source or environment.', '<path d="M15 9l7 4v8l-7 4-7-4v-8zM31 9l7 4v8l-7 4-7-4v-8zM23 23l7 4v8l-7 4-7-4v-8z"/><path class="a-s" d="M19.5 31l2.5 2.5 5-5"/>'],
  ['Recover and stand down', 'Remove containment only after checking recovery; retain only validated memory.', '<path d="M10 37C10 20 20 9 37 9c0 17-11 28-27 28z"/><path d="M10 37L33 13M17 30l-1-7M23 24l-1-7M17 30l7 0M23 24l7 0"/><circle cx="27" cy="19" r="2.6" class="a"/>'],
];

const glyph = (inner) => '<svg class="glyph" viewBox="0 0 46 46" aria-hidden="true">' + inner + '</svg>';

export function pageLanding({ LAB, assets, build, head }) {
  const S = LAB.SITE;
  const title = `Norevia — ${S.title}`;
  const desc = `Norevia studies social immunity for agentic systems: collective defence, information integrity and bounded recovery in LLM-based agents.`;
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
${topBar({ nav: [['#lenses', 'Three lenses'], ['#containment', 'Try the translation'], ['#unfold', 'Research path'], ['/journal/', 'Journal'], ['/explore/', 'Research'], ['/contact/', 'Contact']] })}

<main id="main" tabindex="-1">
<section class="hero" aria-labelledby="hero-title">
<div class="hero-ecology">${natureArt('colony')}</div>
<div class="wrap hero-in">
<div class="hero-copy">
<p class="pill hero-pill u" style="--d:200ms"><span class="pulse" aria-hidden="true"></span>Nature inspires · <b>Evidence decides</b></p>
<h1 id="hero-title" data-words data-em="Immunity">Social Immunity for Agentic Systems</h1>
<p class="lede u" style="--d:550ms">How do living colonies defend the collective? We study social-insect colonies to ask how agent systems could recognise threats, contain compromised information and recover together.</p>
<p class="ctas u" style="--d:750ms"><a class="btn" href="#lenses">Start with nature ${ARR}</a><a class="btn ghost" href="#containment">Explore the agent hypothesis <span class="arr down" aria-hidden="true">↓</span></a></p>
</div>
</div>
<div class="wrap hero-foot" aria-hidden="true"><span class="scrollcue"><i></i>Scroll</span><span class="made">Illustrated ant colony · not a reconstruction of experimental data</span></div>
</section>

<section class="sec manifesto" aria-label="Why nature">
<div class="wrap" data-scrub>
<p class="kicker">Why social immunity</p>
<p data-em="collective|integrity|defence">A colony has no single immune centre. Defence emerges through local behaviour and interactions. We start with these natural mechanisms, translate them into bounded engineering hypotheses, and test where the analogy breaks.</p>
</div>
</section>

${pageLenses()}

<section class="sec bio-origins" id="nature" aria-labelledby="nature-title">
<div class="wrap"><div class="bio-heading"><div><p class="kicker">01 / Seen — the central thesis</p><h2 id="nature-title" data-words data-em="colony.">Begin with a living colony.</h2></div><p class="lead">Ants and bees are the scientific starting point. Each mechanism below connects an observation in a named species to a software hypothesis and a test that could reject it.</p></div>
<div class="bio-grid">
<article class="bio-card"><div class="bio-art">${natureArt('colony')}</div><p class="kicker">Ants / Contact-network plasticity</p><h3>Change the contacts.<br>Limit the spread.</h3><p><span class="bio-label">Natural observation</span>In <em>Lasius niger</em>, pathogen exposure changed behaviour in exposed ants and nestmates, reinforcing transmission-inhibitory properties of their contact network.</p><details><summary>Follow the translation to agents ${ARR}</summary><div class="bio-fold"><p><span class="bio-label">Engineering hypothesis</span>Change who reads a suspect source and where its descendants can travel. Keep unrelated communication available.</p><p><span class="bio-label">Test that could reject it</span>If static segmentation and provenance gating achieve equal or better containment at matched utility and cost, adaptive rewiring adds no demonstrated value.</p><a href="/c/h-d01/">H-D01 / Defensive plasticity →</a></div></details><a class="bio-source" href="https://doi.org/10.1126/science.aat4793" rel="noopener noreferrer">Stroeymeyt et al. / Science, 2018 ↗</a></article>
<article class="bio-card"><div class="bio-art">${natureArt('bees')}</div><p class="kicker">Bees / Inhibitory signals</p><h3>A signal can recruit.<br>It can also inhibit.</h3><p><span class="bio-label">Natural observation</span>In <em>Apis cerana</em>, stop signals vary with threat severity and attack context. They inhibit waggle dancing and can inhibit departures from the nest.</p><details><summary>Follow the translation to agents ${ARR}</summary><div class="bio-fold"><p><span class="bio-label">Engineering hypothesis</span>A local alarm recruits review. A specific inhibitory signal pauses the implicated tool or source, preserving unrelated work.</p><p><span class="bio-label">Test that could reject it</span>If a conventional per-tool deny rule using the same evidence matches the result, the biological signalling mechanism has not earned its complexity.</p><a href="/c/h-d04/">H-D04 / Alarm versus inhibition →</a></div></details><a class="bio-source" href="https://doi.org/10.1371/journal.pbio.1002423" rel="noopener noreferrer">Tan et al. / PLoS Biology, 2016 ↗</a></article>
<article class="bio-card"><div class="bio-art">${natureArt('care')}</div><p class="kicker">Ants / Sanitary intervention</p><h3>A local response.<br>A collective consequence.</h3><p><span class="bio-label">Natural observation</span>In <em>Lasius neglectus</em>, workers identify infected brood and perform destructive disinfection. The infected brood is sacrificed to prevent pathogen replication and spread.</p><details><summary>Follow the translation to agents ${ARR}</summary><div class="bio-fold"><p><span class="bio-label">Engineering hypothesis</span>Trace and quarantine an implicated evidence item and its copies. This is a selective information-control hypothesis, not a literal copy of destructive biological behaviour.</p><p><span class="bio-label">Test that could reject it</span>If targeted quarantine loses more legitimate evidence than it protects, or provenance tags alone match its containment, reject the added intervention.</p><a href="/c/h-d02/">H-D02 / Evidence containment →</a></div></details><a class="bio-source" href="https://doi.org/10.7554/eLife.32073" rel="noopener noreferrer">Pull et al. / eLife, 2018 ↗</a></article>
</div><p class="bio-evidence-note">Original schematic illustrations, not biological simulations or experimental reconstructions. Sources support the natural observations; transfer to software remains unproven. Source checks cover abstracts and selected sections, with limitations in our <a href="/defence/">research agenda</a>. The Tan paper has a <a href="https://doi.org/10.1371/journal.pbio.1002496" rel="noopener noreferrer">figure-quality correction</a>; it does not report a new behavioural result.</p>
</div></section>

<section class="defence-demo sec" id="containment" aria-labelledby="demo-title">
<div class="wrap">
<div class="demo-heading"><div><p class="kicker">02 / Translate the mechanism</p><h2 id="demo-title">One poisoned source.<br>Many possible paths.</h2></div><p class="lead">Now move from the colony to a software hypothesis. Follow a claim through an agent network. Advance one step at a time, contain its descendants, then verify recovery. The rules are deliberately simple and explicit.</p></div>
<div class="demo-shell" data-defence-demo>
<div class="demo-visual"><canvas data-defence-network role="img" aria-label="Illustrative network of 16 agents; the text alongside reports its current state"></canvas><div class="demo-legend"><span>○ Clean</span><span>× Exposed</span><span>□ Quarantined</span><span>✓ Verified</span></div></div>
<div class="demo-panel"><p class="kicker">Information integrity</p><h3 data-demo-title>Start with a clean network.</h3><p data-demo-description>Introduce one untrusted claim at agent 01. No data leaves your browser.</p><div class="demo-metrics" aria-live="polite" aria-atomic="true"><span><b data-exposed>0</b> exposed</span><span><b data-isolated>0</b> isolated</span><span><b data-available>16</b> available</span></div>
<div class="demo-actions"><button class="btn" type="button" data-demo-action="introduce">Introduce a claim</button><button class="btn ghost" type="button" data-demo-action="spread" disabled>Advance propagation</button><button class="btn ghost" type="button" data-demo-action="contain" disabled>Trace &amp; quarantine</button><button class="btn ghost" type="button" data-demo-action="recover" disabled>Verify &amp; restore</button><button class="demo-reset" type="button" data-demo-action="reset">Reset illustration</button></div>
<p class="small muted" data-demo-status role="status">Ready. 16 clean agents.</p></div></div>
<details class="demo-rules"><summary>Read the rules and limitations</summary><p>Sixteen nodes form a fixed ring with four cross-links. A propagation step copies the claim to immediate neighbours of exposed nodes. Quarantine blocks every exposed node using perfect provenance, so uninvolved nodes remain available. Recovery assumes an external trusted check rejects the claim and clears all traced copies. Real detection and verification are imperfect; this sketch does not model their error rates, latency or cost.</p><p><strong>Illustration, not a benchmark or a security guarantee.</strong> Both conventional and adaptive systems can implement these controls. The proposed LAB-007 must test whether adaptive policies add anything beyond a strong conventional baseline.</p></details>
<noscript><p>The interactive sketch requires JavaScript. Its sequence: untrusted claim → local copying → provenance-based quarantine → independent verification → restoration. The rules above remain readable.</p></noscript>
</div></section>

<section class="stages" id="unfold" data-stages aria-labelledby="unfold-title">
<div class="stages-pin">
<div class="stage-ecology" aria-hidden="true">${['care','bees','colony','colony'].map((kind,i)=>`<div data-stage-illustration="${i}"${i ? ' hidden' : ''}>${natureArt(kind)}</div>`).join('')}</div>
<div class="stage-copy">
<p class="kicker" id="unfold-title">03 / Form a hypothesis. Test the limits.</p>
<ol class="stage-list">
${STAGES.map(([h, p, bio], i) => `<li class="stage${i === 0 ? ' on' : ''}"><span class="n">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(p)}</p><span class="bio">Connection: <em>${esc(bio.charAt(0).toLowerCase() + bio.slice(1))}</em></span></li>`).join('\n')}
</ol>
<div class="stage-controls" aria-label="Defence stages">${STAGES.map(([h], i) => `<button type="button" data-stage="${i}" aria-pressed="${i === 0}">${h}</button>`).join('')}</div>
</div>
<span class="stage-count" aria-hidden="true">01 / 04</span>
</div>
</section>

<section class="sec principles" id="principles" aria-labelledby="pr-title">
<div class="wrap">
<p class="kicker">04 / Test against strong engineering</p>
<h2 id="pr-title" data-words data-em="not|agreement.">Trust evidence, not agreement.</h2>
<p class="lead u">A natural analogy is not evidence of security. Every proposed mechanism faces provenance-aware, least-privilege and quarantine baselines at matched cost.</p>
<ol class="p-grid">
${PRINCIPLES.map(([h, p, g], i) => `<li class="u" style="--d:${i * 110}ms">${glyph(g)}<h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('\n')}
</ol>
<div class="honest u">
<span class="mark" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7.5"/><path d="M6.5 10.3l2.3 2.2 4.7-4.8"/></svg></span>
<p>Collective defence must earn its place. <span>We measure containment and benign-work disruption against strong conventional controls at matched cost.</span></p>
<a href="/method/">How we measure ${ARR}</a>
</div>
</div>
</section>

<section class="soon" id="soon" aria-labelledby="soon-title">
<canvas data-swarm="soon" aria-hidden="true"></canvas>
<div class="soon-label"><p class="soon-word" aria-hidden="true">Verify.</p></div>
<div class="wrap soon-in">
<div>
<p class="kicker" id="soon-title">Nature → collective organisation → verifiable defence</p>
<p>The research programme is now centred on collective defence. Historical results remain available with their original scope. Defence hypotheses are open; LAB-007 has not run, and no security advantage has been demonstrated.</p>
<p class="ctas"><a class="btn" href="/explore/">Browse the research ${ARR}</a><a class="btn ghost" href="/method/">Read the evidence rules</a></p>
</div>
</div>
</section>
</main>

${footer({ site: S, links: [['/journal/', 'Journal'], ['/explore/', 'Research archive'], ['/flags/', 'Flag registry'], ['/method/', 'Method'], ['/about/', 'About'], ['/contact/', 'Contact'], [S.repo, 'GitHub']] })}
</body>
</html>
`;
}
