import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, parseBytes } from '../src/cli-kit/bytes.mjs';

test('formatBytes: abaixo da base fica em B', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(999), '999 B');
  assert.equal(formatBytes(1023, { standard: 'iec' }), '1023 B');
});

test('formatBytes: SI e IEC', () => {
  assert.equal(formatBytes(1000), '1 kB');
  assert.equal(formatBytes(1536, { standard: 'iec' }), '1.5 KiB');
  assert.equal(formatBytes(1_048_576, { standard: 'iec' }), '1 MiB');
  assert.equal(formatBytes(1_234_567, { decimals: 1 }), '1.2 MB');
  assert.equal(formatBytes(9e15), '9 PB');
});

test('formatBytes: zeros à direita só da parte fracionária', () => {
  assert.equal(formatBytes(1_500_000), '1.5 MB');
  assert.equal(formatBytes(1_000_000), '1 MB');
  assert.equal(formatBytes(1_050_000), '1.05 MB');
  assert.equal(formatBytes(1_100, { decimals: 3 }), '1.1 kB');
  assert.equal(formatBytes(100_000_000), '100 MB');
  assert.equal(formatBytes(500_000, { decimals: 0 }), '500 kB');
  assert.equal(formatBytes(20_480, { standard: 'iec', decimals: 0 }), '20 KiB');
});

test('formatBytes: arredondamento e promoção de unidade', () => {
  assert.equal(formatBytes(999_999), '1 MB');
  assert.equal(formatBytes(999_499, { decimals: 0 }), '999 kB');
  assert.equal(formatBytes(999_500, { decimals: 0 }), '1 MB');
  assert.equal(formatBytes(1_048_575, { standard: 'iec' }), '1 MiB');
  assert.equal(formatBytes(2_345_678), '2.35 MB');
});

test('formatBytes: validação', () => {
  for (const n of [-1, 1.5, NaN, 2 ** 53, '10']) assert.throws(() => formatBytes(n), RangeError);
  assert.throws(() => formatBytes(1, { standard: 'x' }), RangeError);
  assert.throws(() => formatBytes(1, { decimals: -1 }), RangeError);
  assert.throws(() => formatBytes(1, { decimals: 1.5 }), RangeError);
});

test('parseBytes', () => {
  assert.equal(parseBytes('1.5 KiB'), 1536);
  assert.equal(parseBytes('2MB'), 2_000_000);
  assert.equal(parseBytes('10'), 10);
  assert.equal(parseBytes('1 kib'), 1024);
  assert.equal(parseBytes('3 b'), 3);
  assert.equal(parseBytes(' 4 GB '), 4e9);
  assert.equal(parseBytes('0.5 kB'), 500);
});

test('parseBytes: erros', () => {
  for (const s of ['', 'XB 5', '5 XB', '-1 kB', '1,5 kB', '.5 kB', '5 k B']) {
    assert.throws(() => parseBytes(s), SyntaxError, s);
  }
  assert.throws(() => parseBytes(5), TypeError);
});
