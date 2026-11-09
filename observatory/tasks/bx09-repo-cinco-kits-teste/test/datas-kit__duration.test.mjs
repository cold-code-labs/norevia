import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, formatDuration } from '../src/datas-kit/duration.mjs';

test('parseDuration: unidades d, h, m, s', () => {
  assert.equal(parseDuration('1h30m'), 5_400_000);
  assert.equal(parseDuration('90s'), 90_000);
  assert.equal(parseDuration('2d'), 172_800_000);
});
test('parseDuration: milissegundos', () => {
  assert.equal(parseDuration('250ms'), 250);
  assert.equal(parseDuration('1s 500ms'), 1500);
  assert.equal(parseDuration('1m2s3ms'), 62_003);
});
test('parseDuration: espaços opcionais', () => {
  assert.equal(parseDuration(' 1 h 30 m '), 5_400_000);
});
test('parseDuration: entradas inválidas', () => {
  for (const bad of ['', '   ', '10', '1x', 'h1', '1.5h']) assert.throws(() => parseDuration(bad), SyntaxError, bad);
});
test('formatDuration', () => {
  assert.equal(formatDuration(0), '0ms');
  assert.equal(formatDuration(999), '999ms');
  assert.equal(formatDuration(1000), '1s');
  assert.equal(formatDuration(3_600_000), '1h');
  assert.equal(formatDuration(3_723_000), '1h 2m 3s');
  assert.equal(formatDuration(90_061_001), '1d 1h 1m 1s');
});
test('formatDuration: entradas inválidas', () => {
  assert.throws(() => formatDuration(-1), RangeError);
  assert.throws(() => formatDuration(1.5), RangeError);
});
test('ida e volta', () => {
  assert.equal(parseDuration(formatDuration(5_400_000)), 5_400_000);
  assert.equal(parseDuration(formatDuration(420)), 420);
});
