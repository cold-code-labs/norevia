import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Fraction, fraction, parse, fromNumber } from '../src/fraction.mjs';

const F = (s) => parse(s);

test('normalização no construtor', () => {
  const x = new Fraction(-6, -4);
  assert.equal(x.num, 3n);
  assert.equal(x.den, 2n);
  assert.equal(new Fraction(3n, -9n).toString(), '-1/3');
  assert.equal(new Fraction(0, -5).toString(), '0');
  assert.equal(new Fraction(0, -5).den, 1n);
  assert.equal(fraction(10).toString(), '10');
  assert.throws(() => new Fraction(1, 0), RangeError);
  assert.throws(() => new Fraction(1.5, 2), RangeError);
  assert.throws(() => new Fraction('1', 2), TypeError);
  assert.ok(Object.isFrozen(x));
});

test('parse', () => {
  const cases = [['-1.25', '-5/4'], ['.5', '1/2'], ['2.', '2'], ['1.5e-3', '3/2000'], ['-12e2', '-1200'], ['+0.000', '0'], ['-6/4', '-3/2'], ['007', '7'], ['2.50E+1', '25'], ['1e-2', '1/100']];
  for (const [s, want] of cases) assert.equal(F(s).toString(), want, s);
  for (const bad of ['', '.', '1/0', '1/-2', '1.2.3', ' 1', '1/2.5', 'e5', '1e', '--1', '1/']) assert.throws(() => F(bad), RangeError, bad);
  assert.throws(() => parse(3), TypeError);
});

test('aritmética', () => {
  assert.equal(F('1/6').add('1/3').toString(), '1/2');
  assert.equal(F('1/6').sub(1).toString(), '-5/6');
  assert.equal(F('-2/3').mul('9/4').toString(), '-3/2');
  assert.equal(F('1/2').div('-3/4').toString(), '-2/3');
  assert.equal(F('1/2').add(new Fraction(1, 2)).toString(), '1');
  assert.equal(F('1/2').add(2n).toString(), '5/2');
  assert.throws(() => F('1/2').div(0), RangeError);
  assert.throws(() => F('0').inv(), RangeError);
  assert.equal(F('-3/7').inv().toString(), '-7/3');
  assert.equal(F('-3/7').abs().toString(), '3/7');
  assert.equal(F('-3/7').neg().toString(), '3/7');
  assert.equal(F('-2/3').pow(-3).toString(), '-27/8');
  assert.equal(F('-2/3').pow(2).toString(), '4/9');
  assert.equal(F('0').pow(0).toString(), '1');
  assert.throws(() => F('0').pow(-1), RangeError);
});

test('comparação', () => {
  assert.equal(F('1/3').compare('0.333'), 1);
  assert.equal(F('-1/3').compare('-0.333'), -1);
  assert.ok(F('2/4').equals('0.5'));
  assert.equal(F('-0').sign(), 0);
  assert.equal(F('-1/9').sign(), -1);
});

test('fromNumber é exato', () => {
  assert.equal(fromNumber(0.1).toString(), '3602879701896397/36028797018963968');
  assert.equal(fromNumber(-2.5).toString(), '-5/2');
  assert.equal(fromNumber(5e-324).den, 2n ** 1074n);
  assert.equal(fromNumber(-0).toString(), '0');
  assert.throws(() => fromNumber(NaN), RangeError);
  assert.throws(() => fromNumber('1'), TypeError);
});
