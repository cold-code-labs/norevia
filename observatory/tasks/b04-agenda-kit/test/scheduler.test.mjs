import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createManualClock } from '../src/clock.mjs';
import { createScheduler } from '../src/scheduler.mjs';

test('sequential ids and pending', () => {
  const s = createScheduler(createManualClock());
  assert.deepEqual([s.schedule(() => {}, 5), s.schedule(() => {}, 1), s.schedule(() => {})], [1, 2, 3]);
  assert.equal(s.pending(), 3);
});
test('task runs exactly at the scheduled time', () => {
  const clock = createManualClock(1000);
  const s = createScheduler(clock);
  let ran = 0;
  s.schedule(() => ran++, 100);
  clock.advance(99);
  assert.equal(s.runDue(), 0);
  clock.advance(1);
  assert.equal(s.runDue(), 1);
  assert.equal(ran, 1);
  assert.equal(s.pending(), 0);
});
test('default delay 0 runs on the next runDue', () => {
  const s = createScheduler(createManualClock(7));
  const seen = [];
  const id = s.schedule((x) => seen.push(x));
  assert.equal(s.runDue(), 1);
  assert.deepEqual(seen, [id]);
});
test('order by time and, on a tie, by scheduling', () => {
  const clock = createManualClock();
  const s = createScheduler(clock);
  const log = [];
  s.schedule(() => log.push('A'), 50);
  s.schedule(() => log.push('B'), 10);
  s.schedule(() => log.push('C'), 10);
  clock.advance(60);
  assert.equal(s.runDue(), 3);
  assert.deepEqual(log, ['B', 'C', 'A']);
});
test('cancel', () => {
  const clock = createManualClock();
  const s = createScheduler(clock);
  let ran = false;
  const id = s.schedule(() => { ran = true; }, 5);
  assert.equal(s.cancel(id), true);
  assert.equal(s.cancel(id), false);
  clock.advance(10);
  assert.equal(s.runDue(), 0);
  assert.equal(ran, false);
});
test('tasks scheduled during runDue are left for the next call', () => {
  const clock = createManualClock();
  const s = createScheduler(clock);
  let inner = 0;
  s.schedule(() => s.schedule(() => inner++), 10);
  clock.advance(20);
  assert.equal(s.runDue(), 1);
  assert.equal(s.pending(), 1);
  assert.equal(inner, 0);
  assert.equal(s.runDue(), 1);
  assert.equal(inner, 1);
});
test('nextDue and invalid delay', () => {
  const clock = createManualClock(100);
  const s = createScheduler(clock);
  assert.equal(s.nextDue(), null);
  s.schedule(() => {}, 30);
  s.schedule(() => {}, 20);
  assert.equal(s.nextDue(), 120);
  assert.throws(() => s.schedule(() => {}, -1), RangeError);
});
