import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, formatDuration } from '../src/cli-kit/duration.mjs';

test('parseDuration: segmentos', () => {
  assert.equal(parseDuration('1h30m'), 5_400_000);
  assert.equal(parseDuration('2d'), 172_800_000);
  assert.equal(parseDuration('1m30s500ms'), 90_500);
  assert.equal(parseDuration('1.5h'), 5_400_000);
  assert.equal(parseDuration('250ms'), 250);
  assert.equal(parseDuration('1d1ms'), 86_400_001);
});

test('parseDuration: inteiro puro, espaços nas pontas e arredondamento', () => {
  assert.equal(parseDuration('500'), 500);
  assert.equal(parseDuration(' 2m '), 120_000);
  assert.equal(parseDuration('2.5ms'), 3);
  assert.equal(parseDuration('0.25ms'), 0);
});

test('parseDuration: erros', () => {
  for (const s of ['', '   ', '1x', '1h 30m', 'h', '-5s', '30m1h', '1.s', '5.']) {
    assert.throws(() => parseDuration(s), SyntaxError, s);
  }
  assert.throws(() => parseDuration(5), TypeError);
});

test('parseDuration: unidade repetida é erro', () => {
  assert.throws(() => parseDuration('1h1h'), SyntaxError);
  assert.throws(() => parseDuration('1m1m30s'), SyntaxError);
  assert.throws(() => parseDuration('5ms5ms'), SyntaxError);
});

test('formatDuration: básicos', () => {
  assert.equal(formatDuration(5_400_000), '1h30m');
  assert.equal(formatDuration(0), '0ms');
  assert.equal(formatDuration(999), '999ms');
  assert.equal(formatDuration(172_800_000), '2d');
  assert.equal(formatDuration(93_784_005, { largest: 5 }), '1d2h3m4s5ms');
});

test('formatDuration: janela, arredondamento e transporte', () => {
  assert.equal(formatDuration(90_500), '1m31s');
  assert.equal(formatDuration(90_500, { largest: 3 }), '1m30s500ms');
  assert.equal(formatDuration(3_630_000), '1h1m');
  assert.equal(formatDuration(3_600_005), '1h');
  assert.equal(formatDuration(86_399_999), '1d');
  assert.equal(formatDuration(59_999, { largest: 1 }), '1m');
  assert.equal(formatDuration(93_784_005, { largest: 3 }), '1d2h3m');
});

test('formatDuration: validação', () => {
  for (const ms of [-1, 1.5, NaN, '10']) assert.throws(() => formatDuration(ms), RangeError);
  assert.throws(() => formatDuration(10, { largest: 0 }), RangeError);
  assert.throws(() => formatDuration(10, { largest: 6 }), RangeError);
});
