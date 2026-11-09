import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from '../src/env.mjs';
import { deepMerge } from '../src/merge.mjs';
import { validate } from '../src/validate.mjs';

test('DATABASE_URL with query string', () => {
  assert.deepEqual(parseEnv('DATABASE_URL=postgres://db/app?sslmode=require'), { DATABASE_URL: 'postgres://db/app?sslmode=require' });
});
test('nested deepMerge', () => {
  assert.deepEqual(deepMerge({ log: { level: 'info', json: true } }, { log: { level: 'debug' } }), { log: { level: 'debug', json: true } });
});
test('workers at the minimum limit is valid', () => {
  assert.deepEqual(validate({ workers: '1' }, { workers: { type: 'integer', min: 1, max: 64 } }), { ok: true, value: { workers: 1 }, errors: [] });
});
