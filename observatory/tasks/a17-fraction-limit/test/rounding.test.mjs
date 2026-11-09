import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/fraction.mjs';

const F = (s) => parse(s);

test('floor, ceil, trunc, round (meio para o par)', () => {
  const rows = [['5/2', 2n, 2n, 3n, 2n], ['-5/2', -2n, -3n, -2n, -2n], ['7/2', 4n, 3n, 4n, 3n], ['-7/2', -4n, -4n, -3n, -3n], ['-1/2', 0n, -1n, 0n, 0n], ['1/2', 0n, 0n, 1n, 0n], ['-13/10', -1n, -2n, -1n, -1n], ['8', 8n, 8n, 8n, 8n]];
  for (const [s, r, fl, ce, tr] of rows) {
    const x = F(s);
    assert.equal(x.round(), r, s + ' round');
    assert.equal(x.floor(), fl, s + ' floor');
    assert.equal(x.ceil(), ce, s + ' ceil');
    assert.equal(x.trunc(), tr, s + ' trunc');
  }
});

test('toFixed', () => {
  const rows = [['2.5', 0, '2'], ['3.5', 0, '4'], ['-2.5', 0, '-2'], ['-0.005', 2, '0.00'], ['0.125', 2, '0.12'], ['0.135', 2, '0.14'], ['2/3', 4, '0.6667'], ['-2/3', 4, '-0.6667'], ['-1/3', 0, '0'], ['1234.5', 0, '1234'], ['-0.0049', 2, '0.00'], ['1/8', 5, '0.12500'], ['-0.015', 2, '-0.02']];
  for (const [s, d, want] of rows) assert.equal(F(s).toFixed(d), want, `${s} ${d}`);
  assert.throws(() => F('1').toFixed(-1), RangeError);
  assert.throws(() => F('1').toFixed(1.5), RangeError);
});

test('toRepeating', () => {
  const rows = [['1/6', '0.1(6)'], ['-1/6', '-0.1(6)'], ['1/7', '0.(142857)'], ['22/7', '3.(142857)'], ['5/4', '1.25'], ['-3', '-3'], ['1/30', '0.0(3)'], ['3227/555', '5.8(144)'], ['1/81', '0.(012345679)'], ['-7/12', '-0.58(3)'], ['0', '0']];
  for (const [s, want] of rows) assert.equal(F(s).toRepeating(), want, s);
});
