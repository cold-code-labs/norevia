import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, mul, divmod, isqrt, lcm, toString } from '../src/bignum.mjs';

test('operações básicas com sinais', () => {
  assert.equal(toString(add('-9999999', '1')), '-9999998');
  assert.equal(toString(mul('-12345678', '10000000')), '-123456780000000');
  assert.deepEqual(divmod('-7', '2').map(toString), ['-4', '1']);
  assert.equal(toString(isqrt('152415787532374345526722756')), '12345678901234');
});

test('lcm de números grandes coprimos', () => {
  const a = '1' + '0'.repeat(84) + '9'.repeat(84);
  const b = '9'.repeat(168);
  assert.equal(toString(lcm(a, b)), String(BigInt(a) * BigInt(b)));
});
