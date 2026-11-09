import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Replica } from '../src/replica.mjs';
import { encodeState, decodeState, parseStamp } from '../src/codec.mjs';
import { formatStamp, compareStamps, makeStamp, LamportClock, vvMerge, vvObserve } from '../src/clock.mjs';

const enc = (r) => encodeState(r.snapshot());

test('parseStamp/formatStamp: dourados, @ no id e erros', () => {
  assert.equal(formatStamp(makeStamp(7, 'x@y')), '7@x@y');
  assert.deepEqual(parseStamp('7@x@y'), { c: 7, r: 'x@y' });
  assert.deepEqual(parseStamp('120@n@1'), { c: 120, r: 'n@1' });
  assert.deepEqual(parseStamp('1@@'), { c: 1, r: '@' });
  for (const s of ['0@a', '01@a', '@a', '1@', 'a@1', '1@a b', '12', '-1@a', '1.5@a', 'b@12']) {
    assert.throws(() => parseStamp(s), RangeError, s);
  }
  assert.throws(() => parseStamp(12), TypeError);
  assert.throws(() => makeStamp(0, 'a'), RangeError);
  assert.throws(() => makeStamp(1, ''), RangeError);
});

test('compareStamps: contador, depois id maior vence', () => {
  assert.equal(compareStamps({ c: 2, r: 'a' }, { c: 1, r: 'z' }), 1);
  assert.equal(compareStamps({ c: 1, r: 'z' }, { c: 2, r: 'a' }), -1);
  assert.equal(compareStamps({ c: 1, r: 'b' }, { c: 1, r: 'a' }), 1);
  assert.equal(compareStamps({ c: 1, r: 'a' }, { c: 1, r: 'b' }), -1);
  assert.equal(compareStamps({ c: 1, r: 'B' }, { c: 1, r: 'a' }), -1);
  assert.equal(compareStamps({ c: 3, r: 'ab' }, { c: 3, r: 'a' }), 1);
  assert.equal(compareStamps({ c: 3, r: 'q' }, { c: 3, r: 'q' }), 0);
});

test('LWW: escritas concorrentes com o mesmo contador — id maior vence', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  assert.equal(a.set('cor', 'azul'), '1@a');
  assert.equal(b.set('cor', 'verde'), '1@b');
  a.syncWith(b);
  assert.equal(a.get('cor'), 'verde');
  assert.equal(b.get('cor'), 'verde');
  const up = new Replica('B');
  const low = new Replica('a');
  low.set('k', 'minúsculo');
  up.set('k', 'maiúsculo');
  up.syncWith(low);
  assert.equal(up.get('k'), 'minúsculo');
  const r = ['a', 'b', 'c'].map((id) => new Replica(id));
  r.forEach((x, i) => x.set('k', i));
  r[0].syncWith(r[1]);
  r[2].syncWith(r[0]);
  r[1].syncWith(r[2]);
  for (const x of r) assert.equal(x.get('k'), 2);
});

test('relógio de Lamport, lápides e carimbos devolvidos', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  assert.equal(a.set('cor', 'azul'), '1@a');
  assert.equal(a.add('x'), '2@a');
  assert.equal(b.add('x'), '1@b');
  assert.equal(b.set('n', 3), '2@b');
  assert.equal(b.delete('cor'), '3@b');
  assert.equal(b.set('10', true), '4@b');
  a.syncWith(b);
  assert.equal(a.clock, 4);
  assert.deepEqual(a.remove('x'), ['1@b', '2@a']);
  assert.equal(a.clock, 4);
  assert.equal(a.add('y'), '5@a');
  assert.equal(a.get('cor'), undefined);
  assert.equal(a.has('cor'), false);
  assert.deepEqual(a.keys(), ['10', 'n']);
  assert.deepEqual(a.versionVector(), { a: 5, b: 4 });
  const c = new LamportClock();
  assert.equal(c.tick(), 1);
  assert.equal(c.observe(7), 7);
  assert.equal(c.observe(3), 7);
  assert.equal(c.tick(), 8);
  assert.deepEqual(vvMerge({ a: 3, c: 1 }, { a: 2, b: 5 }), { a: 3, b: 5, c: 1 });
  assert.deepEqual(vvObserve({ a: 3 }, { c: 2, r: 'a' }), { a: 3 });
});

test('encodeState: texto canônico dourado', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  a.set('cor', 'azul');
  a.add('x');
  b.add('x');
  b.set('n', 3);
  b.delete('cor');
  b.set('10', true);
  a.syncWith(b);
  assert.equal(enc(b), '{"map":{"10":["4@b",true],"cor":["3@b"],"n":["2@b",3]},"set":{"x":["1@b","2@a"]},"tombs":{},"vv":{"a":2,"b":4}}');
  a.remove('x');
  a.add('y');
  assert.equal(enc(a), '{"map":{"10":["4@b",true],"cor":["3@b"],"n":["2@b",3]},"set":{"y":["5@a"]},"tombs":{"x":["1@b","2@a"]},"vv":{"a":5,"b":4}}');
  a.syncWith(b);
  assert.equal(enc(b), enc(a));
});

test('encodeState: etiquetas com o mesmo contador em ordem de carimbo', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  const z = new Replica('Z');
  b.add('x');
  a.add('x');
  z.add('x');
  a.syncWith(b);
  a.syncWith(z);
  assert.deepEqual(a.tags('x'), ['1@Z', '1@a', '1@b']);
  assert.equal(enc(a), '{"map":{},"set":{"x":["1@Z","1@a","1@b"]},"tombs":{},"vv":{"Z":1,"a":1,"b":1}}');
  {
    const a = new Replica('a');
    const b = new Replica('b');
    for (let i = 0; i < 9; i++) a.set('s' + i, i);
    for (let i = 0; i < 8; i++) b.set('t' + i, i);
    assert.equal(a.add('x'), '10@a');
    assert.equal(b.add('x'), '9@b');
    a.syncWith(b);
    assert.deepEqual(a.tags('x'), ['9@b', '10@a']);
    const text = enc(a);
    assert.ok(text.includes('"set":{"x":["9@b","10@a"]}'), text);
    assert.equal(encodeState(decodeState(text)), text);
    assert.equal(enc(b), text);
  }
});

test('OR-set: readição de elemento já presente acumula etiquetas e a remoção enterra todas', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  b.add('x');
  a.syncWith(b);
  assert.equal(a.add('x'), '2@a');
  assert.deepEqual(a.tags('x'), ['1@b', '2@a']);
  assert.deepEqual(a.remove('x'), ['1@b', '2@a']);
  assert.deepEqual(a.remove('x'), []);
  a.syncWith(b);
  assert.equal(a.contains('x'), false);
  assert.equal(b.contains('x'), false);
  assert.equal(enc(a), enc(b));
});

test('OR-set: adição concorrente vence remoção', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  a.add('y');
  a.syncWith(b);
  a.remove('y');
  assert.equal(b.add('y'), '2@b');
  a.syncWith(b);
  assert.equal(a.contains('y'), true);
  assert.deepEqual(a.tags('y'), ['2@b']);
  assert.deepEqual(b.tags('y'), ['2@b']);
  b.remove('y');
  b.syncWith(a);
  assert.deepEqual(a.values(), []);
});

test('três réplicas em cadeia (a — b — c) convergem', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  const c = new Replica('c');
  b.set('k1', 1);
  b.set('k2', 2);
  a.syncWith(b);
  c.set('k3', 3);
  c.add('e');
  b.syncWith(c);
  a.syncWith(b);
  assert.deepEqual(a.keys(), ['k1', 'k2', 'k3']);
  assert.deepEqual(a.values(), ['e']);
  assert.deepEqual(a.versionVector(), { b: 2, c: 2 });
  assert.equal(enc(a), enc(b));
  b.syncWith(c);
  assert.equal(enc(c), enc(a));
});

test('deltaSince é suficiente mesmo para o que a réplica só retransmite', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  const c = new Replica('c');
  b.set('k1', 1);
  b.set('k2', 2);
  a.applyDelta(b.deltaSince(a.versionVector()));
  c.set('k3', 3);
  c.add('e');
  b.syncWith(c);
  const d = b.deltaSince(a.versionVector());
  assert.deepEqual(d.vv, { b: 2, c: 2 });
  a.applyDelta(d);
  assert.equal(enc(a), enc(b));
  assert.equal(a.clock, 2);
  const fresh = new Replica('z');
  fresh.applyDelta(b.deltaSince({}));
  assert.equal(enc(fresh), enc(b));
});

test('relógio observa lápides e o vetor de versão recebidos', () => {
  const a = new Replica('a');
  const b = new Replica('b');
  b.add('x');
  assert.deepEqual(b.remove('x'), ['1@b']);
  a.syncWith(b);
  assert.equal(a.clock, 1);
  assert.equal(a.set('k', 1), '2@a');
  const c = new Replica('c');
  c.applyDelta({ vv: { q: 7 }, map: new Map(), set: { adds: new Map(), tombs: new Map() } });
  assert.equal(c.clock, 7);
  assert.equal(c.add('y'), '8@c');
});

test('convergência: três réplicas, operações intercaladas e ordens de sincronização diferentes', () => {
  let seed = 12345;
  const rnd = (n) => ((seed = (seed * 1103515245 + 12345) % 2147483648) % n);
  const run = (order) => {
    seed = 777;
    const rs = ['a', 'b', 'c'].map((id) => new Replica(id));
    const pairs = [[0, 1], [1, 2], [0, 2]];
    for (let step = 0; step < 60; step++) {
      const r = rs[rnd(3)];
      const op = rnd(5);
      const k = 'k' + rnd(4);
      const e = 'e' + rnd(3);
      if (op === 0) r.set(k, rnd(100));
      else if (op === 1) r.delete(k);
      else if (op === 2) r.add(e);
      else if (op === 3) r.remove(e);
      else {
        const [i, j] = pairs[order[step % 3]];
        if (i !== 0 && j !== 0) rs[i].syncWith(rs[j]);
        else if (rnd(2)) rs[i].syncWith(rs[j]);
      }
    }
    for (let round = 0; round < 2; round++) { rs[0].syncWith(rs[1]); rs[1].syncWith(rs[2]); }
    const texts = rs.map(enc);
    assert.equal(texts[1], texts[0]);
    assert.equal(texts[2], texts[0]);
    return rs.map((x) => [x.keys(), x.values()]);
  };
  run([0, 1, 2]);
  run([2, 1, 0]);
  run([1, 1, 1]);
});

test('decodeState: ids com @, ordem de chaves e erros', () => {
  const text = '{"map":{"10":["2@n@1",false],"9":["3@x@y",null]},"set":{"w":["1@n@1"]},"tombs":{"v":["2@x@y"]},"vv":{"n@1":2,"x@y":3}}';
  const s = decodeState(text);
  assert.equal(encodeState(s), text);
  const r = Replica.fromSnapshot('x@y', s);
  assert.equal(r.get('9'), null);
  assert.equal(r.get('10'), false);
  assert.deepEqual(r.tags('w'), ['1@n@1']);
  assert.equal(r.set('9', 'novo'), '4@x@y');
  assert.equal(enc(r), '{"map":{"10":["2@n@1",false],"9":["4@x@y","novo"]},"set":{"w":["1@n@1"]},"tombs":{"v":["2@x@y"]},"vv":{"n@1":2,"x@y":4}}');
  assert.throws(() => decodeState('{"map":'), SyntaxError);
  assert.throws(() => decodeState('{"map":{"k":["0@a",1]},"vv":{}}'), RangeError);
  assert.throws(() => decodeState('{"map":{"k":["a@1",1]},"vv":{}}'), RangeError);
  assert.throws(() => decodeState(null), TypeError);
});

test('validação de entradas e ids que coincidem com nomes de propriedades', () => {
  assert.throws(() => new Replica(''), RangeError);
  assert.throws(() => new Replica('a b'), RangeError);
  assert.throws(() => new Replica(3), TypeError);
  const a = new Replica('a');
  assert.throws(() => a.set('', 1), RangeError);
  assert.throws(() => a.set('k', undefined), TypeError);
  assert.throws(() => a.set('k', NaN), TypeError);
  assert.throws(() => a.set('k', { x: 1 }), TypeError);
  assert.throws(() => a.add(''), RangeError);
  assert.equal(a.clock, 0);
  const p = new Replica('constructor');
  const q = new Replica('toString');
  assert.equal(p.set('k', 1), '1@constructor');
  assert.equal(p.add('e'), '2@constructor');
  assert.equal(q.set('j', 2), '1@toString');
  assert.deepEqual(q.versionVector(), { toString: 1 });
  p.syncWith(q);
  assert.deepEqual(q.keys(), ['j', 'k']);
  assert.deepEqual(q.values(), ['e']);
  assert.deepEqual(q.versionVector(), { constructor: 2, toString: 1 });
  assert.equal(enc(p), enc(q));
});
