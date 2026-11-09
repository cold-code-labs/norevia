import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createManualClock } from '../src/clock.mjs';
import { createTokenBucket } from '../src/rate-limiter.mjs';

test('starts full', () => {
  const b = createTokenBucket({ capacity: 3, refillPerSecond: 1, clock: createManualClock() });
  assert.deepEqual([b.tryRemove(), b.tryRemove(), b.tryRemove(), b.tryRemove()], [true, true, true, false]);
});
test('continuous and fractional refill', () => {
  const clock = createManualClock();
  const b = createTokenBucket({ capacity: 2, refillPerSecond: 2, clock });
  assert.equal(b.tryRemove(2), true);
  clock.advance(250);
  assert.equal(b.available(), 0.5);
  assert.equal(b.tryRemove(), false);
  clock.advance(250);
  assert.equal(b.tryRemove(), true);
});
test('refill never exceeds the capacity', () => {
  const clock = createManualClock();
  const b = createTokenBucket({ capacity: 2, refillPerSecond: 1, clock });
  b.tryRemove(2);
  clock.advance(10_000);
  assert.equal(b.available(), 2);
  assert.equal(b.tryRemove(2), true);
  assert.equal(b.tryRemove(), false);
});
test('full idle bucket stays at capacity', () => {
  const clock = createManualClock();
  const b = createTokenBucket({ capacity: 5, refillPerSecond: 3, clock });
  clock.advance(5000);
  assert.equal(b.available(), 5);
});
test('msUntil', () => {
  const clock = createManualClock();
  const b = createTokenBucket({ capacity: 4, refillPerSecond: 2, clock });
  assert.equal(b.msUntil(4), 0);
  b.tryRemove(4);
  assert.equal(b.msUntil(1), 500);
  clock.advance(250);
  assert.equal(b.msUntil(1), 250);
  assert.equal(b.msUntil(3), 1250);
});
test('errors', () => {
  const b = createTokenBucket({ capacity: 2, refillPerSecond: 1, clock: createManualClock() });
  assert.throws(() => b.tryRemove(3), RangeError);
  assert.throws(() => createTokenBucket({ capacity: 0, refillPerSecond: 1, clock: createManualClock() }), RangeError);
  assert.throws(() => createTokenBucket({ capacity: 1, refillPerSecond: 0, clock: createManualClock() }), RangeError);
});
