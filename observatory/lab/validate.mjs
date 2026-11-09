// Validates lab tasks: buggy repo must fail final; reference must pass probe+final; records per-package signal (probe fail vs hidden fail on the buggy repo).
import fs from 'node:fs'; import path from 'node:path';
import { runTask } from '../lib/testrun.mjs';
const T = '/data/OpenBot/Shared/Norevia/norevia/observatory/lab/tasks'; const idx = JSON.parse(fs.readFileSync(path.join(T, 'index.json'), 'utf8'));
const only = process.argv[2] ? process.argv[2].split(',') : Object.keys(idx);
const perPkg = (res, suite, pkg) => { const e = Object.entries(res[suite].files).filter(([f]) => f.split('/')[1].startsWith(pkg + '__')); return { pass: e.reduce((s, [, v]) => s + v.pass, 0), total: e.reduce((s, [, v]) => s + v.total, 0) }; };
let ok = 0;
await Promise.all(only.map(async (id) => {
  const dir = path.join(T, id), expected = idx[id].expected;
  const [bug, ref] = await Promise.all([runTask({ taskDir: dir, suites: ['probe', 'final'], expected }), runTask({ taskDir: dir, suites: ['probe', 'final'], expected, useSolution: true })]);
  const pk = idx[id].packages.map((n) => ({ pkg: n, probe: perPkg(bug, 'probe', n), final: perPkg(bug, 'final', n), refProbe: perPkg(ref, 'probe', n), refFinal: perPkg(ref, 'final', n) }));
  const good = !bug.final.allPass && ref.probe.allPass && ref.final.allPass;
  idx[id].validation = { valid: good, buggy: { probe: `${bug.probe.pass}/${bug.probe.total}`, final: `${bug.final.pass}/${bug.final.total}` }, reference: { probe: `${ref.probe.pass}/${ref.probe.total}`, final: `${ref.final.pass}/${ref.final.total}` }, packages: pk };
  // signal: packages whose hidden suite fails on the buggy code but whose probe passes entirely (bugs invisible to agents)
  idx[id].blindPackages = pk.filter((p) => p.final.pass < p.final.total && p.probe.pass === p.probe.total).map((p) => p.pkg);
  if (good) ok++;
  console.log(good ? 'ok ' : 'BAD', id, `buggy probe ${bug.probe.pass}/${bug.probe.total} final ${bug.final.pass}/${bug.final.total} | ref probe ${ref.probe.pass}/${ref.probe.total} final ${ref.final.pass}/${ref.final.total} | blind pkgs ${idx[id].blindPackages.length}/${pk.length}`);
  if (!good) for (const p of pk.filter((p) => p.refProbe.pass < p.refProbe.total || p.refFinal.pass < p.refFinal.total)) console.log('   ref fails in', p.pkg, JSON.stringify(p.refProbe), JSON.stringify(p.refFinal));
}));
if (!process.argv[2]) fs.writeFileSync(path.join(T, 'index.json'), JSON.stringify(idx, null, 1));
console.log(`${ok}/${only.length} valid`);
