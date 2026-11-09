import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createManualClock } from '../src/agenda-kit/clock.mjs';
import { createScheduler } from '../src/agenda-kit/scheduler.mjs';

test('ids sequenciais e pending', () => {
  const s = createScheduler(createManualClock());
  assert.deepEqual([s.schedule(() => {}, 5), s.schedule(() => {}, 1), s.schedule(() => {})], [1, 2, 3]);
  assert.equal(s.pending(), 3);
});
test('tarefa roda exatamente no horário', () => {
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
test('delay padrão 0 roda na próxima runDue', () => {
  const s = createScheduler(createManualClock(7));
  const seen = [];
  const id = s.schedule((x) => seen.push(x));
  assert.equal(s.runDue(), 1);
  assert.deepEqual(seen, [id]);
});
test('ordem por horário e, no empate, por agendamento', () => {
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
test('tarefas agendadas durante runDue ficam para a próxima chamada', () => {
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
test('nextDue e delay inválido', () => {
  const clock = createManualClock(100);
  const s = createScheduler(clock);
  assert.equal(s.nextDue(), null);
  s.schedule(() => {}, 30);
  s.schedule(() => {}, 20);
  assert.equal(s.nextDue(), 120);
  assert.throws(() => s.schedule(() => {}, -1), RangeError);
});
