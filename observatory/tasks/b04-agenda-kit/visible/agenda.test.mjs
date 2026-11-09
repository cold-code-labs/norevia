import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createManualClock } from '../src/clock.mjs';
import { PriorityQueue } from '../src/priority-queue.mjs';
import { createScheduler } from '../src/scheduler.mjs';
import { createTokenBucket } from '../src/rate-limiter.mjs';

test('equal priorities come out in arrival order', () => {
  const q = new PriorityQueue((a, b) => a.prio - b.prio);
  q.push({ id: 1, prio: 0 });
  q.push({ id: 2, prio: 0 });
  q.push({ id: 3, prio: 0 });
  assert.deepEqual(q.drain().map((j) => j.id), [1, 2, 3]);
});
test('scheduler runs due tasks', () => {
  const clock = createManualClock();
  const s = createScheduler(clock);
  const log = [];
  s.schedule(() => log.push('b'), 20);
  s.schedule(() => log.push('a'), 10);
  clock.advance(30);
  assert.equal(s.runDue(), 2);
  assert.deepEqual(log, ['a', 'b']);
});
test('token bucket after long inactivity', () => {
  const clock = createManualClock();
  const b = createTokenBucket({ capacity: 3, refillPerSecond: 1, clock });
  b.tryRemove(3);
  clock.advance(60_000);
  let ok = 0;
  while (b.tryRemove()) ok++;
  assert.equal(ok, 3);
});
