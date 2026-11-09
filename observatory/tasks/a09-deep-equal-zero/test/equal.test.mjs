import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deepEqual, indexOfDeep, uniqueDeep } from '../src/equal.mjs';

test('primitives with Object.is semantics', () => {
  assert.equal(deepEqual(0, -0), false);
  assert.equal(deepEqual(-0, -0), true);
  assert.equal(deepEqual(0, 0), true);
  assert.equal(deepEqual(NaN, NaN), true);
  assert.equal(deepEqual(1, '1'), false);
  assert.equal(deepEqual(null, undefined), false);
});

test('negative zero inside nested arrays', () => {
  assert.equal(deepEqual([[1, 0]], [[1, -0]]), false);
  assert.equal(deepEqual([[1, -0]], [[1, -0]]), true);
});

test('Date with the same rule', () => {
  assert.equal(deepEqual(new Date(5), new Date(5)), true);
  assert.equal(deepEqual(new Date(5), new Date(6)), false);
  assert.equal(deepEqual(new Date(NaN), new Date(NaN)), true);
  assert.equal(deepEqual(new Date(0), { }), false);
});

test('keys: order irrelevant, absent != undefined', () => {
  assert.equal(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
  assert.equal(deepEqual({ a: undefined }, { b: undefined }), false);
  assert.equal(deepEqual({ a: 1 }, { a: 1, b: undefined }), false);
});

test('prototypes and arrays vs objects', () => {
  assert.equal(deepEqual([], {}), false);
  assert.equal(deepEqual({ 0: 'x', length: 1 }, ['x']), false);
  assert.equal(deepEqual(Object.create(null), {}), false);
  assert.equal(deepEqual([1, 2], [1, 2, 3]), false);
});

test('functions only equal to themselves', () => {
  const f = () => 1;
  assert.equal(deepEqual({ f }, { f }), true);
  assert.equal(deepEqual({ f }, { f: () => 1 }), false);
});

test('uniqueDeep and indexOfDeep distinguish 0 and -0', () => {
  assert.equal(uniqueDeep([[0], [-0], [0], [NaN], [NaN]]).length, 3);
  assert.equal(indexOfDeep([{ v: 0 }, { v: -0 }], { v: -0 }), 1);
  assert.equal(indexOfDeep([{ v: 1 }], { v: 2 }), -1);
});
