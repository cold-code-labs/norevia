import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/validate.mjs';

test('defaults and required', () => {
  const schema = { port: { type: 'integer', default: 3000 }, host: { type: 'string', required: true } };
  assert.deepEqual(validate({}, schema), { ok: false, value: { port: 3000 }, errors: ['host: required'] });
});
test('string conversion', () => {
  const schema = { port: { type: 'integer' }, debug: { type: 'boolean' }, ratio: { type: 'number' }, off: { type: 'boolean' } };
  assert.deepEqual(validate({ port: '8080', debug: '1', ratio: '0.5', off: 'false' }, schema), {
    ok: true, value: { port: 8080, debug: true, ratio: 0.5, off: false }, errors: [],
  });
});
test('type errors', () => {
  const r = validate({ a: 'abc', b: '1.5', c: 'yes', d: 5, e: '' }, {
    a: { type: 'integer' }, b: { type: 'integer' }, c: { type: 'boolean' }, d: { type: 'string' }, e: { type: 'number' },
  });
  assert.deepEqual(r.errors, ['a: expected integer', 'b: expected integer', 'c: expected boolean', 'd: expected string', 'e: expected number']);
  assert.deepEqual(r.value, {});
});
test('min and max are inclusive', () => {
  const schema = { n: { type: 'integer', min: 1, max: 10 } };
  assert.deepEqual(validate({ n: 1 }, schema), { ok: true, value: { n: 1 }, errors: [] });
  assert.deepEqual(validate({ n: '10' }, schema), { ok: true, value: { n: 10 }, errors: [] });
  assert.deepEqual(validate({ n: 0 }, schema).errors, ['n: must be >= 1']);
  assert.deepEqual(validate({ n: 11 }, schema).errors, ['n: must be <= 10']);
});
test('oneOf', () => {
  const schema = { mode: { type: 'string', oneOf: ['dev', 'prod'] } };
  assert.deepEqual(validate({ mode: 'test' }, schema).errors, ['mode: must be one of dev, prod']);
  assert.equal(validate({ mode: 'prod' }, schema).ok, true);
});
test('unknown keys after the schema errors', () => {
  const r = validate({ extra: 1, a: 'x' }, { a: { type: 'number' }, b: { type: 'string', required: true } });
  assert.deepEqual(r.errors, ['a: expected number', 'b: required', 'extra: unknown key']);
});
test('one error per key; absent optional key is left out', () => {
  assert.deepEqual(validate({ n: 3 }, { n: { type: 'integer', min: 5, oneOf: [1, 2] } }).errors, ['n: must be >= 5']);
  assert.deepEqual(validate({}, { a: { type: 'string' } }), { ok: true, value: {}, errors: [] });
});
