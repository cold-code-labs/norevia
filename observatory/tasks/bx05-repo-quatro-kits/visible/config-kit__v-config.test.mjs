import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from '../src/config-kit/env.mjs';
import { deepMerge } from '../src/config-kit/merge.mjs';
import { validate } from '../src/config-kit/validate.mjs';

test('DATABASE_URL com query string', () => {
  assert.deepEqual(parseEnv('DATABASE_URL=postgres://db/app?sslmode=require'), { DATABASE_URL: 'postgres://db/app?sslmode=require' });
});
test('deepMerge aninhado', () => {
  assert.deepEqual(deepMerge({ log: { level: 'info', json: true } }, { log: { level: 'debug' } }), { log: { level: 'debug', json: true } });
});
test('workers no limite mínimo é válido', () => {
  assert.deepEqual(validate({ workers: '1' }, { workers: { type: 'integer', min: 1, max: 64 } }), { ok: true, value: { workers: 1 }, errors: [] });
});
