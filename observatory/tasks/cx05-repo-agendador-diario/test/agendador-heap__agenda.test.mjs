import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Heap } from '../src/agendador-heap/heap.mjs';
import { Scheduler } from '../src/agendador-heap/scheduler.mjs';
import { parseDuration, parsePlanLine, loadPlan, formatLog } from '../src/agendador-heap/plan.mjs';

test('heap: convenção de Array.prototype.sort', () => {
  const h = new Heap((a, b) => a - b);
  assert.equal(h.pop(), undefined);
  assert.equal(h.peek(), undefined);
  assert.equal(h.push(7, 3, 9, 3, 1, 8), 6);
  assert.equal(h.size, 6);
  assert.equal(h.peek(), 1);
  const out = [];
  while (!h.isEmpty()) out.push(h.pop());
  assert.deepEqual(out, [1, 3, 3, 7, 8, 9]);
  const d = new Heap();
  d.push('pera', 'abacaxi', 'uva');
  assert.equal(d.pop(), 'abacaxi');
});

test('heap: from, comparador customizado e toSortedArray', () => {
  const byLen = (a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
  const h = Heap.from(['drone', 'ir', 'base', 'enxame', 'eco'], byLen);
  assert.deepEqual(h.toSortedArray(), ['ir', 'eco', 'base', 'drone', 'enxame']);
  assert.equal(h.size, 5);
  assert.equal(h.pop(), 'ir');
  const desc = Heap.from([4, 9, 1, 7], (a, b) => b - a);
  assert.deepEqual(desc.toSortedArray(), [9, 7, 4, 1]);
  assert.throws(() => new Heap(42), TypeError);
});

test('agendador: ordem dourada por instante, prioridade e inserção', () => {
  const s = new Scheduler();
  s.schedule('c', { at: 100 });
  s.schedule('a', { at: 50, priority: 0 });
  s.schedule('b', { at: 50, priority: 2 });
  s.schedule('d', { at: 50, priority: 2 });
  s.schedule('e', { delay: 100, priority: -1 });
  assert.deepEqual(s.runUntil(100), [
    { time: 50, name: 'b' }, { time: 50, name: 'd' }, { time: 50, name: 'a' },
    { time: 100, name: 'c' }, { time: 100, name: 'e' },
  ]);
  assert.equal(s.now, 100);
});

test('agendador: muitas tarefas saem na ordem especificada', () => {
  const s = new Scheduler();
  const specs = [];
  for (let i = 0; i < 60; i++) {
    const at = (i * 37) % 23;
    const priority = ((i * 11) % 5) - 2;
    specs.push({ name: 't' + i, at, priority, i });
    s.schedule('t' + i, { at, priority });
  }
  const expected = specs.slice().sort((a, b) => a.at - b.at || b.priority - a.priority || a.i - b.i).map((x) => x.name);
  assert.deepEqual(s.runUntil(30).map((r) => r.name), expected);
});

test('agendador: every em segundos', () => {
  const s = new Scheduler();
  s.schedule('ping', { every: 2 });
  const log = s.runUntil(5000);
  assert.equal(log.map((r) => `${r.time} ${r.name}`).join(', '), '0 ping, 2000 ping, 4000 ping');
  assert.equal(s.now, 5000);
  assert.equal(s.pending, 1);
  const f = new Scheduler();
  f.schedule('tic', { at: 100, every: 0.25 });
  assert.equal(f.runUntil(900).map((r) => r.time).join(','), '100,350,600,850');
  assert.throws(() => f.schedule('x', { every: 0.0004 }), RangeError);
  assert.throws(() => f.schedule('x', { every: 0 }), RangeError);
});

test('agendador: tarefa periódica reinserida entra no fim da fila do instante', () => {
  const s = new Scheduler();
  s.schedule('A', { every: 1 });
  s.schedule('B', { at: 1000 });
  assert.equal(s.runUntil(1000).map((r) => `${r.time} ${r.name}`).join(', '), '0 A, 1000 B, 1000 A');
});

test('agendador: callbacks agendam e cancelam tarefas', () => {
  const s = new Scheduler({ now: 1000 });
  const idX = s.schedule('x', { at: 1050 });
  s.schedule('mae', { delay: 15 }, (sch) => { sch.schedule('filha', { delay: 5 }); sch.cancel(idX); });
  s.schedule('y', { at: 1020, priority: -1 });
  assert.deepEqual(s.runUntil(1100), [{ time: 1015, name: 'mae' }, { time: 1020, name: 'filha' }, { time: 1020, name: 'y' }]);
  assert.equal(s.pending, 0);
  assert.equal(s.now, 1100);
  assert.equal(s.cancel(idX), false);
});

test('agendador: periódica cancelada pelo próprio callback', () => {
  const s = new Scheduler({ now: 1000 });
  let n = 0;
  const id = s.schedule('bip', { every: 0.01 }, (sch, time, myId) => { if (++n === 3) sch.cancel(myId); });
  s.schedule('mae', { delay: 15 }, (sch) => sch.schedule('filha', { delay: 5 }));
  assert.deepEqual(s.runUntil(1100).map((r) => `${r.time} ${r.name}`), ['1000 bip', '1010 bip', '1015 mae', '1020 bip', '1020 filha']);
  assert.equal(s.cancel(id), false);
});

test('agendador: validação de argumentos', () => {
  const s = new Scheduler({ now: 10 });
  assert.throws(() => s.schedule('', {}), TypeError);
  assert.throws(() => s.schedule('a', { at: 20, delay: 1 }), TypeError);
  assert.throws(() => s.schedule('a', { at: 5 }), RangeError);
  assert.throws(() => s.schedule('a', { priority: 1.5 }), RangeError);
  assert.throws(() => s.runUntil(9), RangeError);
});

test('plano: durações e linhas', () => {
  assert.equal(parseDuration('250ms'), 250);
  assert.equal(parseDuration('1.5s'), 1500);
  assert.equal(parseDuration('2m'), 120000);
  assert.equal(parseDuration('1h'), 3600000);
  for (const bad of ['10', '1.5 s', '-1s', 's']) assert.throws(() => parseDuration(bad), SyntaxError);
  assert.deepEqual(parsePlanLine('foto in 1.5s every 1500ms prio -2', 1000), { name: 'foto', opts: { at: 2500, every: 1.5, priority: -2 } });
  assert.deepEqual(parsePlanLine('pouso'), { name: 'pouso', opts: { at: 0 } });
  assert.throws(() => loadPlan(new Scheduler(), 'a\n\nb every'), /linha 3/);
});

test('plano de missão completo com formatLog', () => {
  const s = new Scheduler();
  const ids = loadPlan(s, ['# missão 7', 'telemetria every 2s prio 1', 'radio every 3s prio 1', '', 'pouso at 5s prio 5', 'foto in 1.5s every 1500ms'].join('\n'));
  assert.deepEqual(ids, [1, 2, 3, 4]);
  assert.equal(formatLog(s.runUntil(6000)), [
    '0.000s telemetria', '0.000s radio', '1.500s foto', '2.000s telemetria', '3.000s radio', '3.000s foto',
    '4.000s telemetria', '4.500s foto', '5.000s pouso', '6.000s radio', '6.000s telemetria', '6.000s foto',
  ].join('\n'));
});

test('plano e API direta convivem no mesmo agendador', () => {
  const s = new Scheduler();
  loadPlan(s, 'a every 1s');
  s.schedule('b', { every: 1, priority: 1 });
  assert.equal(s.runUntil(2000).map((r) => `${r.time} ${r.name}`).join(', '), '0 b, 0 a, 1000 b, 1000 a, 2000 b, 2000 a');
});
