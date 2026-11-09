// Norevia — flag registry page, rendered from research/FLAGS.md (the file stays the source of truth).
import fs from 'node:fs';
import path from 'node:path';
import { esc, markdown, inline } from './text.mjs';

export const FLAG_STATUS = {
  'positive-eng': { label: 'Positive, but engineering', desc: 'Helped in an LLM test, but an equivalent non-bio engineering control explains it.' },
  'null-llm': { label: 'Null with LLMs', desc: 'Tested with LLM agents, no gain over baselines.' },
  'sim-support': { label: 'Simulation support', desc: 'Preliminary support only in abstract simulations.' },
  untested: { label: 'Untested', desc: 'Mapped, never run.' },
  lens: { label: 'Lens', desc: 'Diagnostic or analysis idea, not a runtime flag.' },
};

function splitRow(l) {
  let t = l.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  const cells = []; let cur = '', code = false;
  for (const ch of t) { if (ch === '`') code = !code; if (ch === '|' && !code) { cells.push(cur.trim()); cur = ''; } else cur += ch; }
  cells.push(cur.trim());
  return cells;
}

export function readFlags(root) {
  const file = path.join(root, 'research/FLAGS.md');
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const title = (lines.find((l) => /^#\s/.test(l)) || '# Flag registry').replace(/^#\s+/, '');
  const groups = [];
  let cur = null, intro = [], summary = [], inSummary = false, summaryTitle = 'Summary';
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const h = l.match(/^##\s+(.+)$/);
    if (h) {
      inSummary = /^summary/i.test(h[1]);
      if (inSummary) summaryTitle = h[1];
      cur = inSummary ? null : { name: h[1], rows: [] };
      if (cur) groups.push(cur);
      continue;
    }
    if (inSummary) { summary.push(l); continue; }
    if (!cur) { if (!/^#\s/.test(l)) intro.push(l); continue; }
    if (l.includes('|') && !/^\s*\|?\s*:?-{2,}/.test(l) && !/^\|\s*Flag\s*\|/i.test(l)) {
      const c = splitRow(l);
      if (c.length >= 6) cur.rows.push({ flag: c[0].replace(/`/g, ''), card: c[1], signal: c[2], action: c[3], hyp: c[4], status: c.slice(5).join(' | ') });
    }
  }
  const rows = groups.flatMap((g) => g.rows);
  for (const r of rows) {
    const m = r.status.match(/`([a-z-]+)`/);
    r.key = m && FLAG_STATUS[m[1]] ? m[1] : 'untested';
    r.note = r.status.replace(/^\s*`[a-z-]+`\s*/, '').replace(/^[—–-]\s*/, '').replace(/^;\s*/, '');
  }
  return { title, intro: intro.join('\n').trim(), summary: summary.join('\n').trim(), summaryTitle, groups, rows, rel: 'research/FLAGS.md', text };
}

export function pageFlagsBody(F, deps) {
  const { pageHead, ctx, repoUrl } = deps;
  const md = (s) => markdown(s, ctx).html;
  const count = (k) => F.rows.filter((r) => r.key === k).length;
  const c2 = { ...ctx };
  const cell = (s) => inline(s, c2);
  const headline = `${F.rows.length} rows in ${F.groups.length} groups`;
  // intro without the status legend: the legend is rendered from FLAG_STATUS with live counts
  const introClean = F.intro.replace(/\*\*Status legend\*\*[\s\S]*?(?=\n\n|$)/, '').trim();
  const legend = `<ul class="flag-legend">${Object.entries(FLAG_STATUS).map(([k, v]) => `<li><span class="flag-st fs-${k}">${esc(v.label)}</span> <strong>${count(k)}</strong><span class="muted small block">${esc(v.desc)}</span></li>`).join('')}</ul>`;
  const tables = F.groups.map((g, gi) => `<section class="flag-group" aria-labelledby="fg-${gi}"><h2 id="fg-${gi}">${esc(g.name)} <span class="count">${g.rows.length}</span></h2>
<div class="table-wrap" tabindex="0"><table class="flag-table"><thead><tr><th scope="col">Flag</th><th scope="col">Mechanism card</th><th scope="col">Signal</th><th scope="col">Runtime action</th><th scope="col">Hypotheses</th><th scope="col">Status</th></tr></thead><tbody>${g.rows.map((r) => `<tr id="flag-${esc(r.flag.split(/[\s/]/)[0])}">
<th scope="row"><code>${esc(r.flag)}</code></th><td>${cell(r.card)}</td><td>${cell(r.signal)}</td><td>${cell(r.action)}</td><td>${r.hyp && r.hyp !== '—' ? cell(r.hyp) : '<span class="muted">—</span>'}</td>
<td><span class="flag-st fs-${r.key}">${esc(FLAG_STATUS[r.key].label)}</span>${r.note ? `<span class="flag-note">${cell(r.note)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n');
  return `${pageHead({
    eyebrow: 'Registry',
    title: 'Flag registry',
    lead: 'Each bio-inspired mechanism in the archive, turned into a runtime flag for an agent swarm: the signal it reads, the action it takes, the hypotheses it touches and what local tests have shown so far. Most flags are still untested; the tested ones are mostly null results or explained by plain engineering.',
    extra: `<p class="ctas"><a class="btn small" href="/journal/">Journal: the runs behind the statuses</a><a class="btn small ghost" href="/hypotheses/">Hypothesis board</a><a class="btn small ghost" href="${repoUrl}/blob/main/${F.rel}" rel="noopener noreferrer">Source: ${esc(F.rel)}</a></p>`,
    seed: 6,
  })}
<section><div class="wrap">
<div class="prose flag-intro">${md(introClean)}</div>
<h2 class="sr">Status legend</h2>${legend}
</div></section>
<section><div class="wrap">${tables}</div></section>
<section><div class="wrap prose"><h2 id="summary">${esc(F.summaryTitle)}</h2>${md(F.summary)}<p class="muted small">${esc(headline)}. Statuses change only with evidence recorded in the repository; the sources are the result reports linked from the <a href="/journal/">journal</a>.</p></div></section>`;
}
