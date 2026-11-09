import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Heap } from '../src/heap.mjs';
import { Scheduler } from '../src/scheduler.mjs';
import { loadPlan, formatLog } from '../src/plan.mjs';

test('heap numérico devolve do menor para o maior', () => {
  const h = new Heap((a, b) => a - b);
  h.push(5, 1, 4, 2);
  assert.equal(h.peek(), 1);
  assert.deepEqual([h.pop(), h.pop(), h.pop(), h.pop(), h.pop()], [1, 2, 4, 5, undefined]);
});

test('agendador: instante, prioridade e ordem de inserção', () => {
  const s = new Scheduler();
  s.schedule('c', { at: 100 });
  s.schedule('a', { at: 50 });
  s.schedule('b', { at: 50, priority: 2 });
  assert.deepEqual(s.runUntil(100).map((r) => r.name), ['b', 'a', 'c']);
});

test('plano de missão simples', () => {
  const s = new Scheduler();
  loadPlan(s, 'ping every 1s\npouso at 2.5s prio 3');
  assert.equal(formatLog(s.runUntil(3000)), '0.000s ping\n1.000s ping\n2.000s ping\n2.500s pouso\n3.000s ping');
});
