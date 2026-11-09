// Funnel of studies by realm (seen / unseen / beyond). No model calls: keyword + machine-extracted fields (not verified evidence).
// node triage.mjs  → FUNIL-realms.md, funil-realms.csv, funil-realms.json
import fs from 'node:fs';
const LIB = '/data/OpenBot/Shared/Norevia/library';
const ev = fs.readFileSync(`${LIB}/evidence/evidence.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
// abstracts from the catalogue (title join) for recall
const csv = fs.readFileSync(`${LIB}/catalog-agentic.csv`, 'utf8'); const rows = []; { let f = [], cur = '', q = false; for (let i = 0; i < csv.length; i++) { const c = csv[i]; if (q) { if (c === '"') { if (csv[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; } else if (c === '"') q = true; else if (c === ',') { f.push(cur); cur = ''; } else if (c === '\n') { f.push(cur); rows.push(f); f = []; cur = ''; } else cur += c; } }
const hdr = rows[0]; const ti = hdr.indexOf('title'), ai = hdr.indexOf('abstract'); const abs = new Map(rows.slice(1).map((r) => [(r[ti] || '').toLowerCase().trim(), r[ai] || '']));
// topics per realm: [topic, regex]. seen = swarm-literature mechanisms; unseen = biological phenomena outside swarm literature; beyond = non-biological natural analogies.
const TOPICS = {
  seen: [['stigmergy / pheromone', /stigmerg|pheromone|ant colony/], ['response threshold / division of labour', /response threshold|division of labou?r|task allocation/], ['recruitment / quorum (swarm)', /recruitment|quorum|waggle|honey ?bee|nest.?site/], ['foraging / collective motion', /foraging|flock|boids|collective motion|swarm intelligence|particle swarm/], ['voting / diversity / correlated errors', /condorcet|wisdom of crowds|correlated errors|diversity prediction/]],
  unseen: [['quorum sensing (bacterial)', /quorum sensing|autoinducer|bacterial (communication|quorum|signal)/], ['clonal expansion / immune', /clonal|immune|danger theory|lymphocyte/], ['chemotaxis / run-and-tumble', /chemotaxis|run.and.tumble|gradient (ascent|following)/], ['slime mould / Physarum / Dictyostelium', /physarum|slime mou?ld|dictyostelium|myxococc/], ['wound healing / bounded repair', /wound healing|bounded repair|self.limiting|resolution of inflammation/], ['sparse activation / energy budget', /sparse activation|sparse coding|energy budget|metabolic cost/], ['homeostasis / allostasis', /homeostasis|allostasis|negative feedback regulation/], ['neutrophil / relay recruitment', /neutrophil|relay signal/], ['context compaction / selective retention', /context compaction|selective retention|memory consolidation|forgetting/]],
  beyond: [['orbital resonance / scheduling', /orbital resonance|resonan(ce|t) (scheduling|cadence)/], ['Kessler cascade / orphaned work', /kessler|space debris|cascade of collisions/], ['Lagrange / station keeping', /lagrange point|station.?keeping/], ['thermostat / admission control', /stellar thermostat|admission control/], ['accretion / aggregation threshold', /planetesimal|accretion|streaming instability/], ['shepherd / confinement', /shepherd moon|resonant torque|planetary ring/], ['cosmic web / transport network', /cosmic web|transport network/], ['celestial analogy (generic)', /celestial|astrophys|orbital mechanics|gravitational/]],
};
const score = (r) => 3 * Number(r.relevance) + 2 * (r.compute_matched === 'yes') + (r.baseline_single_agent === true) + (r.reports_tokens_or_cost === true) + (r.reports_latency === true) + (['improves', 'mixed', 'worse'].includes(r.efficiency_result)) + (r.text_file ? 1 : 0) + (r.adaptive_activation === true) + (r.bio_inspired === true) + (r.priority === 'A');
const out = []; const funnel = {};
for (const r of ev) {
  const text = `${r.title} ${r.main_claim || ''} ${r.architecture || ''} ${(r.bio_mechanisms || []).join(' ')} ${abs.get((r.title || '').toLowerCase().trim()) || ''}`.toLowerCase();
  const mech = new Set([...(r.bio_mechanisms || [])]);
  for (const [realm, list] of Object.entries(TOPICS)) for (const [topic, re] of list) {
    let hit = re.test(text);
    if (realm === 'seen') hit ||= (topic.startsWith('stigmergy') && mech.has('stigmergy')) || (topic.startsWith('response') && (mech.has('division-of-labour') || mech.has('response-threshold'))) || (topic.startsWith('recruitment') && (mech.has('recruitment') || mech.has('quorum'))) || (topic.startsWith('foraging') && (mech.has('foraging') || mech.has('flocking-or-collective-motion')));
    if (realm === 'unseen') hit ||= (topic.startsWith('homeostasis') && mech.has('homeostasis-or-feedback-regulation'));
    if (hit) out.push({ realm, topic, score: score(r), id: r.id, title: r.title, year: r.year, relevance: Number(r.relevance), basis: r.text_file ? 'fulltext' : 'abstract', baseline: r.baseline_single_agent === true, computeMatched: r.compute_matched, cost: r.reports_tokens_or_cost === true, efficiency: r.efficiency_result, bio: r.bio_inspired === true, llm: r.llm_based === true, doi: r.doi, url: r.url, pdf: r.local_pdf || '' });
  }
}
// a study may match several topics; keep best-scoring topic per (realm, id)
const best = new Map(); for (const o of out) { const k = `${o.realm}|${o.id}`; const b = best.get(k); if (!b) best.set(k, { ...o, topics: [o.topic] }); else { b.topics.push(o.topic); } }
const all = [...best.values()].sort((a, b) => b.score - a.score);
const agg = (xs) => ({ n: xs.length, rel2plus: xs.filter((x) => x.relevance >= 2).length, textAvailable: xs.filter((x) => x.basis === 'fulltext').length, baseline: xs.filter((x) => x.baseline).length, computeMatchedYes: xs.filter((x) => x.computeMatched === 'yes').length, reportsCost: xs.filter((x) => x.cost).length, improves: xs.filter((x) => x.efficiency === 'improves').length, mixed: xs.filter((x) => x.efficiency === 'mixed').length, worse: xs.filter((x) => x.efficiency === 'worse').length });
const res = { generated: new Date().toISOString(), corpus: ev.length, note: 'Machine-extracted fields and keyword matches; an ordering aid, not verified evidence.', realms: {} };
for (const realm of Object.keys(TOPICS)) {
  const xs = all.filter((x) => x.realm === realm); const f = { matched: xs.length, 'relevance≥2': xs.filter((x) => x.relevance >= 2).length, '+baseline single agent or compute-matched': xs.filter((x) => x.relevance >= 2 && (x.baseline || x.computeMatched === 'yes')).length, '+full text or reports cost': xs.filter((x) => x.relevance >= 2 && (x.baseline || x.computeMatched === 'yes') && (x.basis === 'fulltext' || x.cost)).length, '+compute-matched yes': xs.filter((x) => x.computeMatched === 'yes').length };
  res.realms[realm] = { funnel: f, total: agg(xs), byTopic: Object.fromEntries(TOPICS[realm].map(([t]) => [t, agg(xs.filter((x) => x.topics.includes(t)))])), top: xs.slice(0, 20) };
}
fs.writeFileSync('funil-realms.json', JSON.stringify(res, null, 1));
const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
fs.writeFileSync('funil-realms.csv', ['realm,topics,score,relevance,basis,baseline,computeMatched,reportsCost,efficiency,bio,llm,year,title,doi,url,pdf', ...all.map((x) => [x.realm, esc(x.topics.join('; ')), x.score, x.relevance, x.basis, x.baseline, x.computeMatched, x.cost, x.efficiency, x.bio, x.llm, x.year, esc(x.title), esc(x.doi), esc(x.url), esc(x.pdf)].join(','))].join('\n'));
const md = [`# Funnel of studies by realm — seen / unseen / beyond`, ``, `Generated ${res.generated}. Corpus: ${ev.length} evidence cards (3,043 machine cards; 200 on full text, the rest on abstracts). **Ordering aid only: fields are machine-extracted, matches are keyword-based, nothing here is verified evidence.** No model spend.`, ``, `Score = 3×relevance + 2×compute-matched + baseline single agent + reports cost + reports latency + efficiency result reported + full text + adaptive activation + bio-inspired + priority A (max 18).`, ``];
for (const [realm, v] of Object.entries(res.realms)) {
  md.push(`## ${realm}`, ``, `Funnel: ${Object.entries(v.funnel).map(([k, n]) => `${k} **${n}**`).join(' → ')}`, ``, `| Topic | Studies | relevance ≥ 2 | text file | single-agent baseline | compute-matched | reports cost | improves / mixed / worse |`, `|---|---:|---:|---:|---:|---:|---:|---|`);
  for (const [t, a] of Object.entries(v.byTopic)) md.push(`| ${t} | ${a.n} | ${a.rel2plus} | ${a.textAvailable} | ${a.baseline} | ${a.computeMatchedYes} | ${a.reportsCost} | ${a.improves} / ${a.mixed} / ${a.worse} |`);
  md.push(``, `Top ${Math.min(15, v.top.length)} (priority order):`, ``, ...v.top.slice(0, 15).map((x, i) => `${i + 1}. [${x.score}] ${x.title} (${x.year}; ${x.basis}; ${x.topics.join(', ')}; baseline ${x.baseline ? 'yes' : 'no'}, matched ${x.computeMatched}, efficiency ${x.efficiency}) — ${x.doi ? 'doi:' + x.doi : x.url}${x.pdf ? ' · ' + x.pdf : ''}`), ``);
}
// verified sources already in the research cards, per realm
import('node:child_process').then(()=>{});
const R='/data/OpenBot/Shared/Norevia/norevia/research'; const cardSrc={}; for (const d of fs.readdirSync(R)) { const dir=`${R}/${d}`; if(!fs.statSync(dir).isDirectory()) continue; for (const f of fs.readdirSync(dir).filter((x)=>x.endsWith('.md'))) { const t=fs.readFileSync(`${dir}/${f}`,'utf8'); const realm=(t.match(/^realm: (\w+)/m)||[])[1]; if(!realm) continue; const src=(t.match(/^sources:\n((?:  - .*\n)+)/m)||['',''])[1].split('\n').filter(Boolean).length; (cardSrc[realm] ||= {cards:0,sources:0}); cardSrc[realm].cards++; cardSrc[realm].sources+=src; } }
res.cardSources=cardSrc; fs.writeFileSync('funil-realms.json', JSON.stringify(res, null, 1));
md.push('## Verified references already in the research cards (`norevia/research/**`, field `realm`)','',...Object.entries(cardSrc).map(([r,v])=>`- ${r}: ${v.cards} cards, ${v.sources} cited sources (DOI/abstract-checked by Library)`),'');
fs.writeFileSync('FUNIL-realms.md', md.join('\n'));
for (const [r, v] of Object.entries(res.realms)) console.log(r, JSON.stringify(v.funnel), JSON.stringify(v.total));
