import { test } from 'node:test';
import assert from 'node:assert/strict';
import { easterSunday, easterOffset, movableFeast, MOVABLE } from '../src/easter.mjs';

const D = (y, m, d) => ({ y, m, d });

test('Páscoa em anos comuns', () => {
  assert.deepEqual(easterSunday(2024), D(2024, 3, 31));
  assert.deepEqual(easterSunday(2025), D(2025, 4, 20));
  assert.deepEqual(easterSunday(2000), D(2000, 4, 23));
  assert.deepEqual(easterSunday(2011), D(2011, 4, 24));
});

test('Páscoa nos extremos 22/03 e 25/04', () => {
  assert.deepEqual(easterSunday(2285), D(2285, 3, 22));
  assert.deepEqual(easterSunday(1818), D(1818, 3, 22));
  assert.deepEqual(easterSunday(1943), D(1943, 4, 25));
  assert.deepEqual(easterSunday(2038), D(2038, 4, 25));
});

test('Páscoa em 19/04 e 18/04', () => {
  assert.deepEqual(easterSunday(1981), D(1981, 4, 19));
  assert.deepEqual(easterSunday(2076), D(2076, 4, 19));
  assert.deepEqual(easterSunday(1954), D(1954, 4, 18));
  assert.deepEqual(easterSunday(2049), D(2049, 4, 18));
});

test('festas móveis', () => {
  assert.deepEqual(movableFeast(2024, 'carnaval'), D(2024, 2, 13));
  assert.deepEqual(movableFeast(2024, 'sextaSanta'), D(2024, 3, 29));
  assert.deepEqual(movableFeast(2025, 'corpusChristi'), D(2025, 6, 19));
  assert.deepEqual(easterOffset(2024, 49), D(2024, 5, 19));
  assert.equal(MOVABLE.ascensao, 39);
  assert.throws(() => movableFeast(2024, 'natal'), RangeError);
  assert.throws(() => easterSunday(1582), RangeError);
});

test('Páscoa em séculos distantes', () => {
  assert.deepEqual(easterSunday(4200), D(4200, 4, 20));
  assert.deepEqual(easterSunday(4213), D(4213, 3, 28));
  assert.deepEqual(easterSunday(4224), D(4224, 4, 25));
  assert.deepEqual(easterSunday(5000), D(5000, 3, 30));
  assert.deepEqual(easterSunday(9999), D(9999, 3, 28));
});
