import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundHalfEven, defineUnits, factorOf, toBase, convert, split, format } from '../src/inventory-kit/units.mjs';

const T = defineUnits('g', { kg: 1000, cx: 12000, meia: 500 });

test('roundHalfEven: empates para o par, inclusive negativos', () => {
  assert.equal(roundHalfEven(0.5), 0);
  assert.equal(roundHalfEven(1.5), 2);
  assert.equal(roundHalfEven(2.5), 2);
  assert.equal(roundHalfEven(2.6), 3);
  assert.equal(roundHalfEven(-1.5), -2);
  assert.equal(roundHalfEven(-2.5), -2);
  assert.equal(roundHalfEven(-3.5), -4);
  assert.equal(roundHalfEven(-2.4), -2);
  assert.equal(roundHalfEven(7), 7);
});

test('defineUnits: validações e unidade-base com fator 1', () => {
  assert.equal(factorOf('g', T), 1);
  assert.equal(factorOf('cx', T), 12000);
  assert.throws(() => factorOf('lb', T), RangeError);
  assert.throws(() => defineUnits('g', { kg: 0 }), RangeError);
  assert.throws(() => defineUnits('g', { kg: 1.5 }), RangeError);
  assert.throws(() => defineUnits('g', { g: 2 }), RangeError);
  assert.throws(() => defineUnits('', {}), TypeError);
  assert.equal(factorOf('g', defineUnits('g', { g: 1 })), 1);
});

test('toBase: inteiro na unidade-base com meio-par', () => {
  assert.equal(toBase(1.5, 'kg', T), 1500);
  assert.equal(toBase(2.5, 'g', T), 2);
  assert.equal(toBase(3.5, 'g', T), 4);
  assert.equal(toBase(-2.5, 'g', T), -2);
  assert.equal(toBase(-1, 'cx', T), -12000);
  assert.throws(() => toBase('1', 'g', T), TypeError);
  assert.throws(() => toBase(Infinity, 'g', T), TypeError);
  assert.throws(() => toBase(1, 'lb', T), RangeError);
});

test('convert: resultado inteiro com meio-par', () => {
  assert.equal(convert(2500, 'g', 'kg', T), 2);
  assert.equal(convert(3500, 'g', 'kg', T), 4);
  assert.equal(convert(1.25, 'kg', 'meia', T), 2);
  assert.equal(convert(-2500, 'g', 'kg', T), -2);
  assert.equal(convert(-1500, 'g', 'kg', T), -2);
  assert.equal(convert(2, 'cx', 'kg', T), 24);
});

test('split e format: maior fator primeiro, empate pelo nome', () => {
  assert.deepEqual(split(25500, T), [['cx', 2], ['kg', 1], ['meia', 1]]);
  assert.equal(format(25501, T), '2 cx 1 kg 1 meia 1 g');
  assert.equal(format(0, T), '0 g');
  const D = defineUnits('un', { dz: 12, duzia: 12 });
  assert.deepEqual(split(25, D), [['duzia', 2], ['un', 1]]);
  assert.throws(() => split(-1, T), RangeError);
  assert.throws(() => split(1.5, T), RangeError);
});
