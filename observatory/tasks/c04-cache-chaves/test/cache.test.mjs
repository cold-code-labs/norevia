import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../src/cache.mjs';

function clock(t = 0) {
  const c = { t, now: () => c.t };
  return c;
}

test('TtlCache: ttl em segundos sobre relógio em ms', () => {
  const c = clock(1000);
  const cache = new TtlCache({ now: c.now });
  cache.set('k', 'v', 2);
  c.t = 2999;
  assert.equal(cache.get('k'), 'v');
  c.t = 3000;
  assert.equal(cache.get('k'), undefined);
  assert.deepEqual(cache.stats, { hits: 1, misses: 1 });
});

test('TtlCache: invalidatePrefix não confunde recursos parecidos', () => {
  const cache = new TtlCache({ now: () => 0 });
  cache.set('user:1', 1, 10).set('user?', [], 10).set('user?role=a', [], 10).set('users?a=1', [], 10);
  assert.equal(cache.invalidatePrefix('user?'), 2);
  assert.deepEqual(cache.keys(), ['user:1', 'users?a=1']);
  assert.equal(cache.invalidate('user:1'), true);
  assert.equal(cache.invalidate('user:1'), false);
});

test('TtlCache: validação de ttl e Infinity', () => {
  const c = clock(0);
  const cache = new TtlCache({ now: c.now });
  assert.throws(() => cache.set('a', 1, 0), RangeError);
  assert.throws(() => cache.set('a', 1, -5), RangeError);
  assert.throws(() => cache.set('a', 1, NaN), RangeError);
  cache.set('a', 1, Infinity);
  c.t = 1e15;
  assert.equal(cache.has('a'), true);
});
