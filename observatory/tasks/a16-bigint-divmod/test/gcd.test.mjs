import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gcd, lcm, toString } from '../src/bignum.mjs';

test('gcd e lcm', () => {
  assert.equal(toString(gcd('0', '0')), '0');
  assert.equal(toString(gcd('-12', '0')), '12');
  assert.equal(toString(gcd('18446744073709551616', '221073919720733357899776')), '1073741824');
  assert.equal(toString(gcd('12' + '0'.repeat(30), '-18' + '0'.repeat(25))), '6' + '0'.repeat(25));
  assert.equal(toString(gcd(String(1234567n * 98765432109876n), String(7654321n * 98765432109876n))), '98765432109876');
  assert.equal(toString(gcd('98765432109876', '98765432109876')), '98765432109876');
  assert.equal(toString(lcm('-4', '6')), '12');
  assert.equal(toString(lcm('0', '6')), '0');
  assert.equal(toString(lcm('123456789012', '987654321098')), '60966315568292943087588');
});
