import { test } from 'node:test';
import assert from 'node:assert/strict';
import { range } from '../src/range.mjs';
test('ascending', () => assert.deepEqual(range(0, 4), [0, 1, 2, 3]));
test('descending excludes end', () => assert.deepEqual(range(3, 0, -1), [3, 2, 1]));
