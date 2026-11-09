import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTokenBucket } from '../src/bucket.mjs';

function clock(start = 0) {
  let t = start;
  return { now: () => t, set: (v) => { t = v; } };
}

test('initial burst limited to capacity', () => {
  const c = clock();
  const b = createTokenBucket({ capacity: 2, refillPerSecond: 1, now: c.now });
  assert.equal(b.tryTake(), true);
  assert.equal(b.tryTake(), true);
  assert.equal(b.tryTake(), false);
});

test('idle time with a full bucket does not accumulate extra tokens', () => {
  const c = clock();
  const b = createTokenBucket({ capacity: 2, refillPerSecond: 1, now: c.now });
  c.set(5000);
  assert.equal(b.tryTake(), true);
  assert.equal(b.tryTake(), true);
  assert.equal(b.tryTake(), false);
});
