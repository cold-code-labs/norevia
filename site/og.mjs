#!/usr/bin/env node
// Norevia — render the Open Graph images (PNG 1200 x 630) from lib/og.mjs into site/src/og/.
//
//   node site/og.mjs            re-renders every image whose specification changed
//   node site/og.mjs --force    re-renders all
//
// Needs a rasteriser: `rsvg-convert` from librsvg. By default the user-space copy in ../../tools/bin/rsvg-convert is used
// (see tools/README.md); override with RSVG_CONVERT=/path/to/rsvg-convert. build.mjs only copies the PNGs; it never needs the rasteriser.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ogSpecs, ogSvg, ogHash } from './lib/og.mjs';

const SITE_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(SITE_DIR, 'src/og');
const RSVG = process.env.RSVG_CONVERT || path.resolve(SITE_DIR, '../../tools/bin/rsvg-convert');
const force = process.argv.includes('--force');
fs.mkdirSync(OUT, { recursive: true });
const indexFile = path.join(OUT, 'index.json');
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {};
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'norevia-og-'));
let n = 0;
for (const spec of ogSpecs()) {
  const hash = ogHash(spec);
  const png = path.join(OUT, `${spec.key}.png`);
  if (!force && index[spec.key] === hash && fs.existsSync(png)) continue;
  const svg = path.join(tmp, `${spec.key}.svg`);
  fs.writeFileSync(svg, ogSvg(spec));
  execFileSync(RSVG, ['-w', '1200', '-h', '630', '-b', '#f4f3ee', svg, '-o', png]);
  const b = fs.readFileSync(png);
  if (b.readUInt32BE(16) !== 1200 || b.readUInt32BE(20) !== 630) throw new Error(`${spec.key}.png is not 1200x630`);
  index[spec.key] = hash;
  n++;
}
for (const k of Object.keys(index)) if (!ogSpecs().some((s) => s.key === k)) { delete index[k]; fs.rmSync(path.join(OUT, `${k}.png`), { force: true }); }
fs.writeFileSync(indexFile, JSON.stringify(index, null, 1));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`og: ${n} image(s) rendered, ${Object.keys(index).length} in ${path.relative(process.cwd(), OUT)}`);
