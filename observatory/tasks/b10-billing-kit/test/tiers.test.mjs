import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTiers, tierFor, graduated, volume, quote, breakEven } from '../src/tiers.mjs';

const T = [
  { upTo: 100, unitCents: 50 },
  { upTo: 1000, unitCents: 40, flatCents: 500 },
  { upTo: null, unitCents: 30, flatCents: 1000 },
];

test('validateTiers', () => {
  assert.equal(validateTiers(T), T);
  assert.throws(() => validateTiers([]), RangeError);
  assert.throws(() => validateTiers([{ upTo: 10, unitCents: 1 }, { upTo: 10, unitCents: 1 }, { upTo: null, unitCents: 1 }]), RangeError);
  assert.throws(() => validateTiers([{ upTo: 10, unitCents: 1 }]), RangeError);
  assert.throws(() => validateTiers([{ upTo: null, unitCents: -1 }]), RangeError);
});

test('tierFor: inclusive limits', () => {
  assert.deepEqual([0, 1, 100, 101, 1000, 1001].map((q) => tierFor(q, T)), [-1, 0, 0, 1, 1, 2]);
});

test('graduated', () => {
  assert.deepEqual(graduated(0, T), { total: 0, breakdown: [] });
  assert.deepEqual(graduated(100, T), { total: 5000, breakdown: [{ tier: 0, units: 100, cents: 5000 }] });
  assert.deepEqual(graduated(101, T), { total: 5540, breakdown: [{ tier: 0, units: 100, cents: 5000 }, { tier: 1, units: 1, cents: 540 }] });
  assert.equal(graduated(1500, T).total, 57500);
});

test('volume: exact limit and flat fee', () => {
  assert.deepEqual(volume(100, T), { total: 5000, breakdown: [{ tier: 0, units: 100, cents: 5000 }] });
  assert.deepEqual(volume(1000, T), { total: 40500, breakdown: [{ tier: 1, units: 1000, cents: 40500 }] });
  assert.equal(volume(1001, T).total, 31030);
  assert.deepEqual(volume(0, T), { total: 0, breakdown: [] });
});

test('quote and quantity validation', () => {
  assert.equal(quote(10, T).total, 500);
  assert.equal(quote(150, T, 'volume').total, 6500);
  assert.throws(() => quote(10, T, 'tiered'), RangeError);
  assert.throws(() => quote(-1, T), RangeError);
  assert.throws(() => volume(1.5, T), RangeError);
});

test('breakEven', () => {
  assert.equal(breakEven(T), 101);
  assert.equal(breakEven([{ upTo: 10, unitCents: 100 }, { upTo: null, unitCents: 100 }]), null);
});
