// LAB-003 Step 0 calibration. node lab003/cal.mjs run [--share 0.6] [--reps 2] [--jobs 12] [--phase cal]  |  node lab003/cal.mjs analyze [--phase cal]
// Per package × rep: SOLO (≤ 2 probe repairs) on the single-package task. The first-pass candidate (before any probe feedback) is scored offline under
// probe designs 0.4/0.6/0.8 and under the visible-only (old) probe; the final candidate under the run's probe. Hidden = full original hidden suite.
import fs from 'node:fs'; import path from 'node:path';
import { loadPkgs, compose, loadTask3, specFor } from './build3.mjs'; import { runTask3 } from './testrun3.mjs'; import { runPolicy, SOLO, probe } from './engine3.mjs'; import { OUT, spentCounted, CAP } from './api.mjs';
const argv = process.argv.slice(2); const mode = argv[0]; const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const phase = opt('phase', 'cal'), share = Number(opt('share', 0.6)), reps = Number(opt('reps', 2)), jobs = Number(opt('jobs', 12));
const file = path.join(OUT, `runs-${phase}.jsonl`); const pk = loadPkgs();
const wilson = (x, n) => { if (!n) return [0, 1]; const z = 1.96, p = x / n, d = 1 + z * z / n, c = p + z * z / (2 * n), s = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - s) / d, (c + s) / d].map((v) => +Math.max(0, Math.min(1, v)).toFixed(3)); };
if (mode === 'run') {
  fs.mkdirSync(path.join(OUT, 'raw', phase), { recursive: true });
  const done = new Set(fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.pkg}|${r.rep}`; }) : []);
  const queue = []; for (let rep = 1; rep <= reps; rep++) for (const pkg of Object.keys(pk)) if (!done.has(`${pkg}|${rep}`)) queue.push({ pkg, rep });
  console.log(`${phase}: ${queue.length} runs; share ${share}; counted $${spentCounted().toFixed(3)} of $${CAP}`);
  for (const pkg of new Set(queue.map((q) => q.pkg))) compose(`cal-${pkg}`, [pkg], share, pk);
  const evalSpec = async (t, files, s) => { const spec = specFor(pk, [t.packages[0]], s); const expected = { ...t.expected }; for (const [k, v] of Object.entries(spec)) expected[k] = v.length; const r = await runTask3({ taskDir: t.dir, overlay: files, suites: ['probe'], spec, expected }); return { pass: r.probe.pass, total: r.probe.total, all: r.probe.allPass }; };
  const worker = async () => { while (queue.length) { const q = queue.shift(); const t = loadTask3(`cal-${q.pkg}`); let out;
    try { out = await runPolicy(t, `cal.${q.pkg}.r${q.rep}`, (run) => SOLO(run)); } catch (e) { console.log('STOP', e.message); queue.length = 0; return; }
    const { res, ev, rec } = out; const f1 = res.first.files; const [e1, o1, p40, p80, oL] = await Promise.all([runTask3({ taskDir: t.dir, overlay: f1, suites: ['final'], spec: t.spec, expected: t.expected }), probe(t, f1, (f) => /__v-/.test(f)), evalSpec(t, f1, 0.4), evalSpec(t, f1, 0.8), probe(t, res.files, (f) => /__v-/.test(f))]);
    const row = { phase, pkg: q.pkg, rep: q.rep, class: pk[q.pkg].class, share, first: { probeNew: res.first.p.allPass, probeNewFrac: `${res.first.p.pass}/${res.first.p.total}`, probeOld: o1.allPass, probe40: p40.all, probe80: p80.all, final: e1.final.allPass, finalFrac: `${e1.final.pass}/${e1.final.total}` }, last: { probeNew: ev.probe.allPass, probeOld: oL.allPass, final: ev.final.allPass, finalFrac: rec.final }, cost: rec.cost, calls: rec.calls, truncated: rec.truncated, error: rec.error };
    fs.appendFileSync(file, JSON.stringify(row) + '\n'); fs.writeFileSync(path.join(OUT, 'raw', phase, `${q.pkg}.r${q.rep}.json`), JSON.stringify({ first: f1, last: res.files }));
    console.log(`${q.pkg} r${q.rep}: first probe ${row.first.probeNew ? 'P' : '-'} old ${row.first.probeOld ? 'P' : '-'} final ${row.first.final ? 'A' : '-'} | last probe ${row.last.probeNew ? 'P' : '-'} final ${row.last.final ? 'A' : '-'} $${rec.cost} | counted $${spentCounted().toFixed(3)}`); } };
  await Promise.all(Array.from({ length: jobs }, worker)); console.log(`end; counted $${spentCounted().toFixed(3)} of $${CAP}`);
} else {
  const R = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(JSON.parse); const n = R.length;
  const fs_ = (rows, getP, getF) => { const pp = rows.filter(getP); const fail = pp.filter((r) => !getF(r)).length; return { runs: rows.length, probePass: pp.length, falseSuccess: fail, fsRate: pp.length ? +(fail / pp.length).toFixed(3) : null, ci: wilson(fail, pp.length) }; };
  const out = { runs: n, share: R[0]?.share, firstPass: { oldVisible: fs_(R, (r) => r.first.probeOld, (r) => r.first.final), share40: fs_(R, (r) => r.first.probe40, (r) => r.first.final), share60: fs_(R, (r) => r.first.probeNew, (r) => r.first.final), share80: fs_(R, (r) => r.first.probe80, (r) => r.first.final) }, afterRepair: { oldVisible: fs_(R, (r) => r.last.probeOld, (r) => r.last.final), newProbe: fs_(R, (r) => r.last.probeNew, (r) => r.last.final) }, accepted: { first: R.filter((r) => r.first.final).length, last: R.filter((r) => r.last.final).length }, cost: +R.reduce((s, r) => s + r.cost, 0).toFixed(4) };
  const a = out.firstPass.oldVisible.fsRate, b = out.firstPass.share60.fsRate; out.gate = { fsAfterRepairNew: out.afterRepair.newProbe.fsRate, cond1_le_020: out.afterRepair.newProbe.fsRate != null && out.afterRepair.newProbe.fsRate <= 0.20, firstPassReduction: a && b != null ? +(1 - b / a).toFixed(3) : null, cond2_reduction_ge_50: a && b != null && 1 - b / a >= 0.5 };
  out.gate.pass = out.gate.cond1_le_020 && out.gate.cond2_reduction_ge_50;
  // per package
  const pkgs = {}; for (const r of R) { const x = (pkgs[r.pkg] ||= { class: r.class, runs: 0, acceptedLast: 0, falseSuccessLast: 0, acceptedFirst: 0 }); x.runs++; x.acceptedLast += +r.last.final; x.falseSuccessLast += +(r.last.probeNew && !r.last.final); x.acceptedFirst += +r.first.final; }
  out.packages = pkgs; fs.writeFileSync(path.join(OUT, `calibration-${phase}.json`), JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ runs: out.runs, share: out.share, firstPass: Object.fromEntries(Object.entries(out.firstPass).map(([k, v]) => [k, `${v.falseSuccess}/${v.probePass} probe-pass → hidden-fail (${v.fsRate}) CI ${v.ci}`])), afterRepair: Object.fromEntries(Object.entries(out.afterRepair).map(([k, v]) => [k, `${v.falseSuccess}/${v.probePass} (${v.fsRate}) CI ${v.ci}`])), accepted: out.accepted, gate: out.gate, cost: out.cost }, null, 1));
}
