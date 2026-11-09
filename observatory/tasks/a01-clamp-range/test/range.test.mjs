import { test } from 'node:test';
import assert from 'node:assert/strict';
import { range } from '../src/range.mjs';
test('ascending with step', () => assert.deepEqual(range(1, 8, 3), [1, 4, 7]));
test('descending with step', () => assert.deepEqual(range(10, 1, -4), [10, 6, 2]));
test('empty', () => { assert.deepEqual(range(2, 2), []); assert.deepEqual(range(2, 2, -1), []); });
test('step 0', () => assert.throws(() => range(0, 1, 0), RangeError));
