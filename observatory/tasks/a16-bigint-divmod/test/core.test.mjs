import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BigNum, parse, fromNumber, from, toString, toNumber, compare, equals, neg, abs, sign, add, sub, mul } from '../src/bignum.mjs';

let seed = 4242;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
function rint(maxLen) {
  const n = 1 + Math.floor(rnd() * maxLen);
  let t = String(1 + Math.floor(rnd() * 9));
  for (let i = 1; i < n; i++) t += rnd() < 0.3 ? '0' : String(Math.floor(rnd() * 10));
  const k = rnd();
  return k < 0.08 ? '0' : k < 0.5 ? '-' + t : t;
}

test('parse e toString', () => {
  assert.equal(toString(parse('000123')), '123');
  assert.equal(toString(parse('-0')), '0');
  assert.equal(toString(parse('+42')), '42');
  assert.equal(parse('-0').sign, 0);
  assert.equal(toString(parse('-100000000000000000000')), '-100000000000000000000');
  assert.equal(parse('10000000').toString(), '10000000');
  assert.ok(parse('5') instanceof BigNum);
  for (const bad of ['', '-', '1.5', ' 1', '1e3', '0x10', '--1']) assert.throws(() => parse(bad), RangeError, bad);
  assert.throws(() => parse(12), TypeError);
});

test('fromNumber, from e toNumber', () => {
  assert.equal(toString(fromNumber(-9007199254740991)), '-9007199254740991');
  assert.equal(toString(fromNumber(0)), '0');
  assert.throws(() => fromNumber(1.5), RangeError);
  assert.throws(() => fromNumber(2 ** 53), RangeError);
  assert.throws(() => fromNumber('1'), TypeError);
  assert.throws(() => from(null), TypeError);
  assert.throws(() => from(1n), TypeError);
  assert.equal(toNumber('9007199254740991'), 9007199254740991);
  assert.equal(toNumber('-123'), -123);
  assert.throws(() => toNumber('9007199254740992'), RangeError);
  const x = parse('77');
  assert.equal(from(x), x);
});

test('compare, equals, neg, abs, sign', () => {
  assert.equal(compare('-5', '3'), -1);
  assert.equal(compare('-5', '-30'), 1);
  assert.equal(compare('100000000', '99999999'), 1);
  assert.equal(compare('0', '-0'), 0);
  assert.ok(equals('0012', 12));
  assert.equal(toString(neg('0')), '0');
  assert.equal(toString(neg('-8')), '8');
  assert.equal(toString(abs('-80000000000')), '80000000000');
  assert.equal(sign('-3'), -1);
  assert.equal(sign('0'), 0);
});

test('add, sub, mul com vai-um e empréstimos longos', () => {
  assert.equal(toString(add('99999999999999999999', '1')), '100000000000000000000');
  assert.equal(toString(sub('100000000000000000000', '1')), '99999999999999999999');
  assert.equal(toString(sub('100000000000000000000', '100000000000000000001')), '-1');
  assert.equal(toString(add('-5', '5')), '0');
  assert.equal(toString(mul('99999999999999', '99999999999999')), '9999999999999800000000000001');
  assert.equal(toString(mul('-3', '0')), '0');
});

test('add/sub/mul aleatórios contra BigInt', () => {
  for (let i = 0; i < 1500; i++) {
    const a = rint(45);
    const b = rint(45);
    const A = BigInt(a);
    const B = BigInt(b);
    assert.equal(toString(add(a, b)), String(A + B), `${a}+${b}`);
    assert.equal(toString(sub(a, b)), String(A - B), `${a}-${b}`);
    assert.equal(toString(mul(a, b)), String(A * B), `${a}*${b}`);
    assert.equal(compare(a, b), A < B ? -1 : A > B ? 1 : 0);
  }
});
