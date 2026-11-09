// Norevia — Open Graph images (1200 x 630). Specs and SVG layout live here; `node site/og.mjs` rasterises them to PNG
// (librsvg, tools/bin/rsvg-convert) into site/src/og/, and build.mjs copies the PNGs into the site.
import crypto from 'node:crypto';
import { natureArt } from './nature-art.mjs';
import { RUNS } from './journal-data.mjs';
import { artSvg, RUN_ART, PAL } from './motifs.mjs';
import { formationFile } from './formation.mjs';

export const AREA_LABELS = { nature: 'Natural mechanisms', theory: 'Theory', hypothesis: 'Hypotheses', literature: 'Literature', oss: 'Open source', simulation: 'Simulations', observatory: 'Observatory' };

export function ogSpecs() {
  const S = [
    { key: 'home', eyebrow: 'A Cold Code Labs research project', title: 'Social Immunity for Agentic Systems', dek: 'From living colonies to collective defence in agent systems. Nature inspires; evidence decides.', art: 'formation:2' },
    { key: 'journal', eyebrow: 'Journal', title: 'Experiment runs, one article each', dek: 'Newest first: what was tested, the numbers, what they mean and the limits.', art: 'formation:4' },
    { key: 'flags', eyebrow: 'Registry', title: 'Flag registry', dek: 'Every bio-inspired mechanism as a runtime flag: signal, action and test status.', art: 'formation:5' },
    { key: 'contact', eyebrow: 'Contact', title: 'Write to the Norevia team', dek: 'Questions, corrections, ideas for an experiment or a collaboration.', art: 'formation:1' },
    { key: 'explore', eyebrow: 'Explore', title: 'The defence research archive', dek: 'Mechanisms, evidence and historical results. Filter by relevance to collective defence.', art: 'formation:3' },
    { key: 'playgrounds', eyebrow: 'Playgrounds', title: 'Models you can touch', dek: 'Five small worlds ported from the simulations: voting, verifiers, elastic swarms, stigmergy and thresholds.', art: 'formation:5' },
    { key: 'hypotheses', eyebrow: 'Official register', title: 'Hypothesis board', dek: 'Falsifiable hypotheses by status, each linked to the experiments that test it.', art: 'formation:0' },
    { key: 'experiments', eyebrow: 'Swarm Efficiency Observatory', title: 'Experiments', dek: 'Simulations and benchmarks with real LLM agents, with charts from the data files.', art: 'formation:2' },
    { key: 'literature', eyebrow: 'Sources', title: 'Literature and open source', dek: 'Papers and projects, each with its evidence level and recorded source.', art: 'formation:4' },
    { key: 'method', eyebrow: 'Evidence discipline', title: 'Method', dek: 'Natural phenomenon, author-reported result, hypothesis, local validation and gap.', art: 'formation:1' },
    { key: 'about', eyebrow: 'About', title: 'About Norevia', dek: 'A research project on collective defence and information integrity in agent systems.', art: 'formation:3' },
    { key: 'default', eyebrow: 'Norevia', title: 'Social Immunity for Agentic Systems', dek: 'A Cold Code Labs research project.', art: 'formation:0' },
  ];
  Object.entries(AREA_LABELS).forEach(([a, label], i) => S.push({ key: `area-${a}`, eyebrow: 'Research card', title: label, dek: 'An entry of the Norevia archive with its evidence level, sources and relations.', art: `formation:${i % 6}` }));
  for (const r of RUNS) S.push({ key: `run-${r.key}`, eyebrow: `${r.code} · Journal`, title: r.short, dek: r.finding, art: r.key, accent: RUN_ART[r.key].accent });
  return S;
}

const wrap = (text, max, lines) => {
  const words = String(text).split(/\s+/), out = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  if (out.length > lines) { const k = out.slice(0, lines); k[lines - 1] = k[lines - 1].replace(/[\s,.;:]+\S*$/, '') + '…'; return k; }
  return out;
};
const x = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function ogSvg(spec) {
  const accent = spec.accent || PAL.sage;
  const titleSize = spec.title.length > 44 ? 46 : spec.title.length > 28 ? 54 : 62;
  const tl = wrap(spec.title, Math.floor(540 / (titleSize * 0.5)), 3);
  const dl = wrap(spec.dek, 40, 4);
  const ty = 250 - (tl.length - 1) * 8;
  let artInner = '', ax = 640, ay = 70, aw = 520, ah = 490;
  if (['home','default','about'].includes(spec.key)) {
    artInner = '<g transform="translate(655 130) scale(1.03)">' + natureArt('colony').replace('<svg ', '<svg width="480" height="330" ').replace('class="nature-plate nature-colony"', 'class="nature-plate nature-colony" style="color:#283c31"') + '</g>';
  } else if (['explore'].includes(spec.key)) {
    const points = Array.from({length:16}, (_,i) => [900+Math.cos(i*Math.PI/8)*170,310+Math.sin(i*Math.PI/8)*170]);
    const lines = points.map(([x,y],i) => {const [a,b]=points[(i+1)%16];return '<path d="M'+x+' '+y+'L'+a+' '+b+'" stroke="#0e7a62" opacity=".4"/>';}).join('');
    artInner=lines+points.map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="12" fill="#fbfaf6" stroke="'+(i===0?'#ba4343':'#0e7a62')+'" stroke-width="2"/>').join('')+'<path d="M730 310H1058" stroke="#b46637" stroke-dasharray="5 7"/><text x="900" y="525" text-anchor="middle" font-family="monospace" font-size="17" fill="#0e7a62">TRACE · CONTAIN · VERIFY</text>';
  } else if (spec.art.startsWith('formation:')) {
    const f = formationFile(Number(spec.art.split(':')[1]) + 1).replace(/<g><path class="ant"[\s\S]*?<\/g>/g, '');
    artInner = f.replace('<svg ', `<svg x="${ax + 60}" y="${ay + 45}" width="400" height="400" `);
  } else {
    const s = artSvg(spec.art, false);
    const w = 480, h = 300;
    artInner = s.replace('<svg ', `<svg x="${ax + 20}" y="${ay + 95}" width="${w}" height="${h}" `);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${PAL.paper}"/>
<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" rx="28" fill="#fbfaf6" stroke="${PAL.ink}" stroke-opacity=".12"/>
<style>.nature-ant{fill:#283c31;stroke:#283c31;stroke-width:1.1}.exposed-ant{fill:#a36535;stroke:#a36535}.chamber{fill:#e6e7db;stroke:#b3b9a0}.tunnel{fill:none;stroke:#c6c5b3;stroke-width:19;opacity:.55}.brood{fill:#fcfaf0;stroke:#a7b394}.boundary{fill:none;stroke:#a36535;stroke-dasharray:4 6}.soil-line,.root-line{fill:none;stroke:#788b69}.nature-plate text{fill:#6d7566;font:9px monospace}</style>
${artInner}
<rect x="64" y="64" width="44" height="6" rx="3" fill="${accent}"/>
<text x="64" y="110" font-family="Liberation Sans, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="${PAL.ink}" fill-opacity=".6">${x(spec.eyebrow.toUpperCase())}</text>
${tl.map((l, i) => `<text x="64" y="${ty + i * (titleSize * 1.08)}" font-family="Liberation Serif, Georgia, serif" font-size="${titleSize}" font-weight="700" fill="${PAL.ink}">${x(l)}</text>`).join('\n')}
${dl.map((l, i) => `<text x="64" y="${ty + (tl.length - 1) * titleSize * 1.08 + 62 + i * 36}" font-family="Liberation Sans, Arial, sans-serif" font-size="26" fill="#3d4340">${x(l)}</text>`).join('\n')}
<g transform="translate(64 548)"><g fill="none" stroke="${PAL.ink}" stroke-width="1.8" opacity=".55"><circle cx="18" cy="18" r="16"/><circle cx="18" cy="18" r="9"/></g><circle cx="18" cy="18" r="3.6" fill="${PAL.sage}"/><circle cx="34" cy="18" r="2.2" fill="${PAL.ink}"/><circle cx="8" cy="8" r="1.9" fill="${PAL.ink}"/></g>
<text x="116" y="574" font-family="Liberation Serif, Georgia, serif" font-size="30" font-weight="700" fill="${PAL.ink}">Norevia</text>
<text x="1136" y="574" text-anchor="end" font-family="Liberation Sans, Arial, sans-serif" font-size="20" fill="${PAL.ink}" fill-opacity=".6">a Cold Code Labs research project · norevia.coldcodelabs.com</text>
</svg>`;
}

export const ogHash = (spec) => crypto.createHash('sha256').update(ogSvg(spec)).digest('hex').slice(0, 12);
