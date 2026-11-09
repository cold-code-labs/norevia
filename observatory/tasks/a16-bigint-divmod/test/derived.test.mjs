import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pow, isqrt, modPow, toString } from '../src/bignum.mjs';

test('pow', () => {
  assert.equal(toString(pow('-3', 5)), '-243');
  assert.equal(toString(pow('0', 0)), '1');
  assert.equal(toString(pow('10', 30)), '1' + '0'.repeat(30));
  assert.equal(toString(pow('-2', 64)), String(2n ** 64n));
  assert.throws(() => pow('2', -1), RangeError);
  assert.throws(() => pow('2', 1.5), RangeError);
});

test('isqrt: exemplos e quadrados perfeitos', () => {
  assert.equal(toString(isqrt('0')), '0');
  assert.equal(toString(isqrt('1')), '1');
  assert.equal(toString(isqrt('99999999999999999999')), '9999999999');
  assert.equal(toString(isqrt('1' + '0'.repeat(41))), '316227766016837933199');
  assert.throws(() => isqrt('-1'), RangeError);
  for (const s of ['12345678901234', '10000000', '99999999999999', '31622776601683', '123456789012345678901', '4000000000000000000000000000']) {
    const n = BigInt(s) ** 2n;
    assert.equal(toString(isqrt(String(n))), s, s);
    assert.equal(toString(isqrt(String(n - 1n))), String(BigInt(s) - 1n), s + '-1');
    assert.equal(toString(isqrt(String(n + 1n))), s, s + '+1');
  }
});

test('modPow', () => {
  assert.equal(toString(modPow('5', '40', '1000000007')), '697814725');
  assert.equal(toString(modPow('-2', '3', '5')), '2');
  assert.equal(toString(modPow('7', '0', '1')), '0');
  assert.equal(toString(modPow('7', '0', '13')), '1');
  assert.equal(toString(modPow('123456789', '1000000000000', '98765432109876')), String(((b, e, m) => { let r = 1n; b %= m; while (e) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; })(123456789n, 1000000000000n, 98765432109876n)));
  assert.equal(toString(modPow('98765432109876', '2', '98765432109876')), '0');
  assert.throws(() => modPow('2', '3', '0'), RangeError);
  assert.throws(() => modPow('2', '-1', '7'), RangeError);
});
