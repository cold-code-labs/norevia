// Norevia — landing page (/). Standalone document with its own stylesheet and script
// (src/home.css, src/js/home.js); the research archive pages keep the shared layout.
// Positioning: Social Immunity for Agentic Systems. Copy is research positioning,
// never a claim of results: the archive (/explore/, /method/) carries the evidence levels.
import { esc } from './text.mjs';
import { ARR, topBar, footer } from './chrome.mjs';

const STAGES = [
  ['Detect', 'Agents identify suspicious evidence and preserve its provenance before it enters shared memory or action.', 'Social immunity: recognition and early containment'],
  ['Signal', 'A local alarm recruits targeted review; inhibition applies only to the implicated source, tool or action.', 'Honeybee alarm and inhibitory signals'],
  ['Reconfigure', 'The system can narrow who reads what, quarantine a source and verify claims independently.', 'Contact-network plasticity in ant colonies'],
  ['Recover', 'After containment is verified, the response stands down; only validated evidence persists.', 'Wound resolution and selective memory'],
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
${topBar({ nav: [['#containment', 'Try containment'], ['#unfold', 'Defence model'], ['#nature', 'Mechanisms and baselines'], ['/journal/', 'Journal'], ['/explore/', 'Research'], ['/contact/', 'Contact']] })}

<main id="main" tabindex="-1">
<section class="hero" aria-labelledby="hero-title">
<canvas data-swarm="hero" aria-hidden="true"></canvas>
<div class="wrap hero-in">
<div class="hero-copy">
<p class="pill hero-pill u" style="--d:200ms"><span class="pulse" aria-hidden="true"></span>Agent security research · <b>Collective defence</b></p>
<h1 id="hero-title" data-words data-em="Immunity">Social Immunity for Agentic Systems</h1>
<p class="lede u" style="--d:550ms">Defend the system that thinks together. We study how agents can contain poisoned evidence, compromised memory and prompt injection while legitimate work continues.</p>
<p class="ctas u" style="--d:750ms"><a class="btn" href="/explore/">Explore the research ${ARR}</a><a class="btn ghost" href="#unfold">See the defence model <span class="arr down" aria-hidden="true">↓</span></a></p>
</div>
</div>
<div class="wrap hero-foot" aria-hidden="true"><span class="scrollcue"><i></i>Scroll</span><span class="made">Illustrative agent network · not experimental data</span></div>
</section>

<section class="sec manifesto" aria-label="Why nature">
<div class="wrap" data-scrub>
<p class="kicker">Why social immunity</p>
<p data-em="collective|integrity|defence">Social insect colonies limit disease spread through recognition, selective response and changes to contact patterns. We test whether bounded analogues can protect information integrity in agent systems.</p>
</div>
</section>

<section class="defence-demo sec" id="containment" aria-labelledby="demo-title">
<div class="wrap">
<div class="demo-heading"><div><p class="kicker">Interactive mechanism sketch</p><h2 id="demo-title">One poisoned source.<br>Many possible paths.</h2></div><p class="lead">Follow a claim through an agent network. Advance one step at a time, contain its descendants, then verify recovery. The rules are deliberately simple and explicit.</p></div>
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
<canvas aria-hidden="true"></canvas>
<div class="stage-copy">
<p class="kicker" id="unfold-title">How collective defence could work</p>
<ol class="stage-list">
${STAGES.map(([h, p, bio], i) => `<li class="stage${i === 0 ? ' on' : ''}"><span class="n">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(p)}</p><span class="bio">Inspired by <em>${esc(bio.charAt(0).toLowerCase() + bio.slice(1))}</em></span></li>`).join('\n')}
</ol>
<div class="stage-controls" aria-label="Defence stages">${STAGES.map(([h], i) => `<button type="button" data-stage="${i}" aria-pressed="${i === 0}">${h}</button>`).join('')}</div>
</div>
<span class="stage-count" aria-hidden="true">01 / 04</span>
</div>
</section>

<section class="sec realms" id="nature" aria-labelledby="nature-title">
<div class="wrap">
<div class="realms-head">
<div><p class="kicker">Mechanisms and baselines</p><h2 id="nature-title" data-words data-em="evidence.">What evidence exists?</h2></div>
<div><p class="lead u">Social-insect studies establish natural phenomena, not software security. Existing agent-security benchmarks supply useful baselines. How poisoned evidence propagates across a swarm needs explicit evaluation.</p></div>
</div>
<div class="crossings">
<ul class="specs">
<li class="spec u"><h4>Social-network plasticity</h4><p>Pathogen exposure altered contact-network properties in <em>Lasius niger</em>. Transfer to agent communication is a hypothesis.</p><a class="sp-tag pub" href="https://doi.org/10.1126/science.aat4793" rel="noopener noreferrer">Stroeymeyt et al., <em>Science</em> 2018 ${ARR}</a></li>
<li class="spec u"><h4>Alarm and inhibitory signals</h4><p>Honeybee stop signals vary with threat context; the study reports inhibited waggle dancing and nest departures. The engineering analogue still needs a controlled test.</p><a class="sp-tag pub" href="https://doi.org/10.1371/journal.pbio.1002423" rel="noopener noreferrer">Tan et al., <em>PLoS Biology</em> 2016 ${ARR}</a></li>
<li class="spec u"><h4>Strong security baseline</h4><p>Track provenance, apply least privilege, verify independently, quarantine implicated sources, and rate-limit actions. Adaptive biology-inspired controls must beat this at matched cost.</p><a class="sp-tag arc" href="/method/">Evaluation rules ${ARR}</a></li>
<li class="spec u"><h4>Benchmark gap</h4><p>Our current survey has not established a standard licensed benchmark for agent-to-agent poison propagation. Coverage of this fast-moving area remains incomplete.</p><a class="sp-tag arc" href="/explore/">Browse the research archive ${ARR}</a></li>
</ul>
</div>
</div>
</section>

<section class="sec principles" id="principles" aria-labelledby="pr-title">
<div class="wrap">
<p class="kicker">What makes a defence trustworthy</p>
<h2 id="pr-title" data-words data-em="not|agreement.">Trust evidence, not agreement.</h2>
<p class="lead u">A biological analogy is not evidence of security. Every proposed mechanism faces provenance-aware, least-privilege and quarantine baselines at matched cost.</p>
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
<p class="kicker" id="soon-title">Research status</p>
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
