import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PagedIndex } from '../src/index.mjs';
import { encodeCursor, decodeCursor } from '../src/keys.mjs';
import { paginate } from '../src/paginate.mjs';

test('cursor encoding uses the stable id.key form', () => {
  const pos = { id: 12, key: 'alpha.beta' };
  assert.equal(encodeCursor(pos), '12.alpha.beta');
  assert.deepEqual(decodeCursor(encodeCursor(pos)), pos);
});

test('duplicate-key positions paginate without skips or duplicates', () => {
  const index = new PagedIndex({ pageCapacity: 2 });
  for (const key of ['a', 'a', 'a', 'b', 'b', 'c']) index.insert(key, key);
  const seen = [];
  let cursor = null;
  do {
    const page = paginate(index, { pageSize: 2, cursor });
    seen.push(...page.items.map((e) => `${e.key}#${e.id}`));
    cursor = page.next;
  } while (cursor !== null);
  assert.deepEqual(seen, ['a#1', 'a#2', 'a#3', 'b#4', 'b#5', 'c#6']);
});

test('an exact final page has no next cursor', () => {
  const index = new PagedIndex();
  index.insert('a', 1); index.insert('b', 2);
  assert.equal(paginate(index, { pageSize: 2 }).next, null);
});
