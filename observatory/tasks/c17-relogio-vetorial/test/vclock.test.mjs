import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertId, get, normalize, tick, merge, compare, happenedBefore, isConcurrent, coveredExcept, weight, format, parse } from '../src/vclock.mjs';

test('normalize, tick, merge, format e parse', () => {
  assert.deepEqual(normalize({ c: 1, a: 0, b: 2 }), { b: 2, c: 1 });
  assert.deepEqual(Object.keys(normalize({ c: 1, b: 2 })), ['b', 'c']);
  assert.throws(() => normalize({ a: -1 }), RangeError);
  assert.throws(() => normalize({ a: 1.5 }), RangeError);
  assert.throws(() => normalize({ A: 1 }), RangeError);
  assert.throws(() => normalize(null), TypeError);
  assert.throws(() => assertId(3), TypeError);
  const v = { a: 1 };
  assert.deepEqual(tick(v, 'b'), { a: 1, b: 1 });
  assert.deepEqual(v, { a: 1 });
  assert.deepEqual(merge({ a: 3, c: 1 }, { a: 1, b: 2 }), { a: 3, b: 2, c: 1 });
  assert.deepEqual(merge({}, { b: 0 }), {});
  assert.equal(get({ a: 2 }, 'z'), 0);
  assert.equal(format({ c: 1, a: 2, b: 0 }), 'a:2,c:1');
  assert.equal(format({}), '');
  assert.deepEqual(parse('a:2,c:1'), { a: 2, c: 1 });
  assert.deepEqual(parse('c:1,a:0'), { c: 1 });
  assert.deepEqual(parse(''), {});
  for (const bad of ['a', 'a:1,a:2', 'a:-1', 'A:1', 'a:1,']) assert.throws(() => parse(bad), RangeError, bad);
  assert.equal(weight({ a: 2, c: 3 }), 5);
});

test('compare: ordem parcial com chaves ausentes valendo 0', () => {
  assert.equal(compare({ a: 1 }, { a: 1 }), 'equal');
  assert.equal(compare({}, {}), 'equal');
  assert.equal(compare({ a: 1 }, { a: 1, b: 1 }), 'before');
  assert.equal(compare({ a: 1, b: 1 }, { a: 1 }), 'after');
  assert.equal(compare({ a: 2 }, { a: 1, b: 1 }), 'concurrent');
  assert.equal(compare({ a: 1 }, { b: 1 }), 'concurrent');
  assert.equal(compare({}, { c: 1 }), 'before');
  assert.equal(compare({ a: 1, c: 2 }, { a: 1, b: 5 }), 'concurrent');
  assert.equal(happenedBefore({ a: 1 }, { a: 2, b: 1 }), true);
  assert.equal(happenedBefore({ a: 1 }, { a: 1 }), false);
  assert.equal(isConcurrent({ a: 1, b: 0 }, { b: 1 }), true);
});

test('coveredExcept: todas as componentes de a, exceto skip, cobertas por b', () => {
  assert.equal(coveredExcept({ a: 1, b: 3 }, { a: 1 }, 'b'), true);
  assert.equal(coveredExcept({ b: 2, c: 1 }, { b: 1 }, 'b'), false);
  assert.equal(coveredExcept({ c: 1 }, {}, 'a'), false);
  assert.equal(coveredExcept({ b: 1, c: 1 }, { a: 4, c: 1 }, 'b'), true);
  assert.equal(coveredExcept({}, { a: 1 }, 'a'), true);
  assert.equal(coveredExcept({ a: 2 }, { a: 1 }, 'b'), false);
});
