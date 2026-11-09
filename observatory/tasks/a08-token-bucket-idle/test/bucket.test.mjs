import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTokenBucket } from '../src/bucket.mjs';

function clock(start = 0) {
  let t = start;
  return { now: () => t, set: (v) => { t = v; } };
}

test('continuous refill with fractions', () => {
  const c = clock();
  const b = createTokenBucket({ capacity: 1, refillPerSecond: 2, now: c.now });
  assert.equal(b.tryTake(), true);
  c.set(250);
  assert.equal(b.tryTake(), false); // 0.5 token
  c.set(500);
  assert.equal(b.tryTake(), true); // 1.0 token
});

test('after idleness, partial consumption followed by a new call', () => {
  const c = clock(1000);
  const b = createTokenBucket({ capacity: 4, refillPerSecond: 2, now: c.now });
  c.set(60000);
  assert.equal(b.tryTake(3), true);
  c.set(60001);
  assert.equal(b.available(), 1);
  assert.equal(b.tryTake(2), false);
  c.set(60499);
  assert.equal(b.available(), 1); // 1.998
  c.set(60501);
  assert.equal(b.available(), 2);
});

test('available after idleness and consumption', () => {
  const c = clock();
  const b = createTokenBucket({ capacity: 3, refillPerSecond: 1, now: c.now });
  c.set(10000);
  assert.equal(b.tryTake(3), true);
  assert.equal(b.available(), 0);
  c.set(10500);
  assert.equal(b.available(), 0);
  c.set(11001);
  assert.equal(b.available(), 1);
});

test('msUntil after idleness', () => {
  const c = clock();
  const b = createTokenBucket({ capacity: 2, refillPerSecond: 4, now: c.now });
  c.set(30000);
  assert.equal(b.msUntil(2), 0);
  assert.equal(b.tryTake(2), true);
  assert.equal(b.msUntil(1), 250);
  c.set(30125);
  assert.equal(b.msUntil(1), 125);
  assert.equal(b.msUntil(2), 375);
  assert.equal(b.msUntil(3), Infinity);
});

test('never exceeds capacity', () => {
  const c = clock();
  const b = createTokenBucket({ capacity: 2, refillPerSecond: 1, now: c.now });
  assert.equal(b.tryTake(), true);
  c.set(100000);
  assert.equal(b.available(), 2);
  assert.equal(b.tryTake(2), true);
  assert.equal(b.tryTake(), false);
});

test('denied request does not consume', () => {
  const c = clock();
  const b = createTokenBucket({ capacity: 3, refillPerSecond: 1, now: c.now });
  assert.equal(b.tryTake(4), false);
  assert.equal(b.available(), 3);
  assert.equal(b.tryTake(2), true);
  assert.equal(b.tryTake(2), false);
  assert.equal(b.available(), 1);
});

test('invalid inputs', () => {
  const now = () => 0;
  assert.throws(() => createTokenBucket({ capacity: 0, refillPerSecond: 1, now }), RangeError);
  assert.throws(() => createTokenBucket({ capacity: 1, refillPerSecond: -1, now }), RangeError);
  assert.throws(() => createTokenBucket({ capacity: 1, refillPerSecond: 1 }), TypeError);
  const b = createTokenBucket({ capacity: 1, refillPerSecond: 1, now });
  assert.throws(() => b.tryTake(0), RangeError);
  assert.throws(() => b.msUntil(-1), RangeError);
});
