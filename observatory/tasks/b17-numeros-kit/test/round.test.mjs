import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundDecimal, roundSignificant, MODES } from '../src/round.mjs';

test('modos de arredondamento', () => {
  assert.equal(roundDecimal('2.5'), '2');
  assert.equal(roundDecimal('3.5'), '4');
  assert.equal(roundDecimal('1.005', 2), '1.00');
  assert.equal(roundDecimal('1.015', 2), '1.02');
  assert.equal(roundDecimal('2.50001', 0), '3');
  assert.equal(roundDecimal('-2.5', 0, 'halfUp'), '-3');
  assert.equal(roundDecimal('-2.5', 0, 'halfDown'), '-2');
  assert.equal(roundDecimal('-1.21', 1, 'ceiling'), '-1.2');
  assert.equal(roundDecimal('-1.21', 1, 'floor'), '-1.3');
  assert.equal(roundDecimal('0.001', 2, 'up'), '0.01');
  assert.equal(roundDecimal('0.019', 2, 'down'), '0.01');
  assert.deepEqual(MODES, ['halfEven', 'halfUp', 'halfDown', 'up', 'down', 'ceiling', 'floor']);
});

test('preenchimento, zero sem sinal e validação', () => {
  assert.equal(roundDecimal('12', 3), '12.000');
  assert.equal(roundDecimal('-0.004', 2), '0.00');
  assert.equal(roundDecimal('-0.004', 2, 'floor'), '-0.01');
  assert.equal(roundDecimal('+7.25', 1), '7.2');
  assert.throws(() => roundDecimal('1.5', 21), RangeError);
  assert.throws(() => roundDecimal('1.5', 0, 'nearest'), RangeError);
  assert.throws(() => roundDecimal('1e3', 0), RangeError);
  assert.throws(() => roundDecimal(1.5, 0), TypeError);
});

test('vai-um que não atravessa todos os dígitos', () => {
  assert.equal(roundDecimal('19.99', 1, 'halfUp'), '20.0');
  assert.equal(roundDecimal('1.95', 1), '2.0');
});

test('vai-um que atravessa todos os dígitos mantidos', () => {
  assert.equal(roundDecimal('9.995', 2, 'halfUp'), '10.00');
  assert.equal(roundDecimal('0.995', 2), '1.00');
  assert.equal(roundDecimal('99.5', 0), '100');
  assert.equal(roundDecimal('-999.96', 1, 'halfUp'), '-1000.0');
  assert.equal(roundDecimal('0.6', 0), '1');
});

test('algarismos significativos', () => {
  assert.equal(roundSignificant('123456', 2), '120000');
  assert.equal(roundSignificant('0.000123456', 3), '0.000123');
  assert.equal(roundSignificant('1.25', 2), '1.2');
  assert.equal(roundSignificant('0', 3), '0');
  assert.equal(roundSignificant('999.5', 3), '1000');
  assert.equal(roundSignificant('-98765', 1), '-100000');
  assert.throws(() => roundSignificant('1', 0), RangeError);
});
