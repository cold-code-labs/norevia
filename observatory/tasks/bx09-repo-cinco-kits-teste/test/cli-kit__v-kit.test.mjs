import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/cli-kit/argv.mjs';
import { formatDuration } from '../src/cli-kit/duration.mjs';
import { formatBytes } from '../src/cli-kit/bytes.mjs';
import { parseIni } from '../src/cli-kit/ini.mjs';
import { suggest } from '../src/cli-kit/suggest.mjs';

test('parseArgs: uso típico', () => {
  assert.deepEqual(
    parseArgs(['build', '--out=dist', '-vf', '--tag', 'a', '--tag', 'b', '--', '--x'], { alias: { v: 'verbose' } }),
    { _: ['build', '--x'], out: 'dist', verbose: true, f: true, tag: ['a', 'b'] },
  );
});

test('formatDuration e suggest básicos', () => {
  assert.equal(formatDuration(5_400_000), '1h30m');
  assert.deepEqual(suggest('isntall', ['install', 'uninstall', 'list']), ['install']);
});

test('formatBytes sem casas decimais', () => {
  assert.equal(formatBytes(10_000_000, { decimals: 0 }), '10 MB');
});

test('parseIni: seção repetida é mesclada', () => {
  const ini = '[db]\nhost = h1\n[cache]\nttl = 5\n[db]\nport = 5432\n';
  assert.deepEqual(parseIni(ini), { db: { host: 'h1', port: '5432' }, cache: { ttl: '5' } });
});
