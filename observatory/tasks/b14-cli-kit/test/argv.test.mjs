import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/argv.mjs';

test('posicionais e terminador --', () => {
  assert.deepEqual(parseArgs(['a', '-', '--', '--b', '-c', 'd']), { _: ['a', '-', '--b', '-c', 'd'] });
  assert.deepEqual(parseArgs([]), { _: [] });
});

test('--nome=valor divide no primeiro =', () => {
  assert.deepEqual(parseArgs(['--define=a=b', '--empty=', '--url=http://h/?x=1&y=2']), {
    _: [], define: 'a=b', empty: '', url: 'http://h/?x=1&y=2',
  });
});

test('--nome consome o próximo token só se for valor', () => {
  assert.deepEqual(parseArgs(['--out', 'dist', '--force', 'src'], { boolean: ['force'] }), { _: ['src'], out: 'dist', force: true });
  assert.deepEqual(parseArgs(['--out']), { _: [], out: true });
  assert.deepEqual(parseArgs(['--out', '--x', '-']), { _: [], out: true, x: '-' });
});

test('números negativos', () => {
  assert.deepEqual(parseArgs(['--offset', '-2.5', '-3', '-n', '-1']), { _: ['-3'], offset: '-2.5', n: '-1' });
});

test('--no-nome e alias', () => {
  assert.deepEqual(parseArgs(['--no-color', '-v'], { alias: { v: 'verbose' }, boolean: ['verbose'] }), { _: [], color: false, verbose: true });
  assert.deepEqual(parseArgs(['--no-v'], { alias: { v: 'verbose' } }), { _: [], verbose: false });
  assert.deepEqual(parseArgs(['--no-x=1']), { _: [], 'no-x': '1' });
});

test('grupos de opções curtas', () => {
  assert.deepEqual(parseArgs(['-abc', 'file']), { _: [], a: true, b: true, c: 'file' });
  assert.deepEqual(parseArgs(['-abc', 'file'], { boolean: ['c'] }), { _: ['file'], a: true, b: true, c: true });
});

test('repetição: strings acumulam, demais substituem', () => {
  assert.deepEqual(parseArgs(['--tag', 'a', '--tag=b', '-t', 'c'], { alias: { t: 'tag' } }), { _: [], tag: ['a', 'b', 'c'] });
  assert.deepEqual(parseArgs(['--x', '--no-x']), { _: [], x: false });
  assert.deepEqual(parseArgs(['--v', '1', '--v']), { _: [], v: true });
});

test('defaults, imutabilidade e validação', () => {
  const argv = ['--host=y', 'p'];
  assert.deepEqual(parseArgs(argv, { defaults: { port: '80', host: 'x' } }), { _: ['p'], host: 'y', port: '80' });
  assert.deepEqual(argv, ['--host=y', 'p']);
  assert.throws(() => parseArgs('--x'), TypeError);
});
