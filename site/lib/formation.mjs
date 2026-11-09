// Norevia — page-head formation: the landing-page colony in miniature (deterministic SMIL variants).
export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
// Deterministic "swarm cluster" motif for page heads: a few agents with nearest-neighbour links.
// Page-head mark: the landing-page colony in miniature — a nest with a breathing membrane, pheromone trails
// out to seed clusters and ants walking them (SMIL, so it animates inside a cached <img>). Six deterministic
// variants are written once; pages only reference them. Static under reduced motion.
export const FORMATIONS = 6;
export function formationFile(seed) {
  const r = rng(seed * 7919 + 13), C = 200, TAU = Math.PI * 2, f1 = (v) => v.toFixed(1);
  const memb = (R, k) => Array.from({ length: 41 }, (_, i) => { const t = (i / 40) * TAU, rr = R * (1 + 0.06 * Math.sin(3 * t + k) + 0.04 * Math.sin(5 * t - k)); return (i ? 'L' : 'M') + f1(C + Math.cos(t) * rr) + ' ' + f1(C + Math.sin(t) * rr); }).join('') + 'Z';
  const a0 = r() * TAU, trails = [], foods = [], ants = [];
  for (let k = 0; k < 3; k++) {
    const t = a0 + k * 2.1 + r() * 0.5, d = 150 + r() * 22, fx = C + Math.cos(t) * d, fy = C + Math.sin(t) * d;
    const sx = C + Math.cos(t) * 44, sy = C + Math.sin(t) * 44, bend = (r() - 0.5) * 120;
    const mx = (sx + fx) / 2 - Math.sin(t) * bend, my = (sy + fy) / 2 + Math.cos(t) * bend;
    const path = 'M' + f1(sx) + ' ' + f1(sy) + 'Q' + f1(mx) + ' ' + f1(my) + ' ' + f1(fx) + ' ' + f1(fy);
    trails.push('<path class="tr" d="' + path + '"/>');
    for (let q = 0; q < 9; q++) { const u = r() * TAU, dd = Math.sqrt(r()) * 13; foods.push('<ellipse class="sd" cx="' + f1(fx + Math.cos(u) * dd) + '" cy="' + f1(fy + Math.sin(u) * dd) + '" rx="3.2" ry="2.1" transform="rotate(' + Math.round(u * 57) + ' ' + f1(fx + Math.cos(u) * dd) + ' ' + f1(fy + Math.sin(u) * dd) + ')"/>'); }
    for (let q = 0; q < 4; q++) ants.push('<g><path class="ant" d="M-5 0a2.8 1.7 0 1 0 5.6 0a2.8 1.7 0 1 0-5.6 0M1.4 0a1.4 1 0 1 0 2.8 0a1.4 1 0 1 0-2.8 0M4.6 0a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0"/><animateMotion dur="' + (7 + r() * 3).toFixed(1) + 's" begin="-' + (q * 2.1 + r()).toFixed(1) + 's" repeatCount="indefinite" rotate="auto" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" path="' + path + '"/></g>');
  }
  const cyto = Array.from({ length: 26 }, () => { const t = r() * TAU, d = Math.sqrt(r()) * 34; return '<circle class="cy" cx="' + f1(C + Math.cos(t) * d) + '" cy="' + f1(C + Math.sin(t) * d) + '" r="' + f1(1 + r() * 1.6) + '"/>'; }).join('');
  const css = '.tr{fill:none;stroke:#0e7a62;stroke-width:5;stroke-linecap:round;opacity:.16}.sd{fill:#c98a00}.ant{fill:#101312}.cy{fill:#101312;opacity:.18}.mb{fill:rgba(16,19,18,.04);stroke:#101312;stroke-opacity:.35;stroke-width:1.2}.nu{fill:#0e7a62;opacity:.85}@media (prefers-reduced-motion:reduce){animateMotion,animate{display:none}}';
  const breathe = (R, k1, k2, cls) => '<path class="' + cls + '" d="' + memb(R, k1) + '"><animate attributeName="d" dur="6s" repeatCount="indefinite" values="' + memb(R, k1) + ';' + memb(R, k2) + ';' + memb(R, k1) + '"/></path>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><style>' + css + '</style>' + trails.join('') + foods.join('') + breathe(48, 0, 2.2, 'mb') + cyto + breathe(15, 1, 3.4, 'nu') + ants.join('') + '</svg>';
}
