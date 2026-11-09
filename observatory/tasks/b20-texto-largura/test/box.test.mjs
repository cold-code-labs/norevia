import { test } from 'node:test';
import assert from 'node:assert/strict';
import { box, frameWidth } from '../src/box.mjs';

test('box simples e com título', () => {
  assert.deepEqual(box(['olá', '漢字']), ['┌──────┐', '│ olá  │', '│ 漢字 │', '└──────┘']);
  assert.deepEqual(box(['olá', '漢字'], { title: 'T' }), ['┌─ T ──┐', '│ olá  │', '│ 漢字 │', '└──────┘']);
  assert.deepEqual(box(['a'], { title: 'titulo longo', padding: 0 }), ['┌─┐', '│a│', '└─┘']);
  assert.deepEqual(box(['abcdefgh'], { title: 'titulo' }), ['┌─ titulo ─┐', '│ abcdefgh │', '└──────────┘']);
  assert.deepEqual(box(['abcdefgh'], { title: 'titulo longo' }), ['┌─ titulo… ┐', '│ abcdefgh │', '└──────────┘']);
});

test('box alinhado e frameWidth', () => {
  assert.deepEqual(box(['olá', '漢字 abc'], { align: 'center' }), ['┌──────────┐', '│   olá    │', '│ 漢字 abc │', '└──────────┘']);
  assert.deepEqual(box(['a', 'bbb'], { align: 'right', padding: 0 }), ['┌───┐', '│  a│', '│bbb│', '└───┘']);
  assert.equal(frameWidth(['漢字', 'a']), 8);
  assert.deepEqual(box(['ab'], { title: 'xyz', padding: 0 }), ['┌──┐', '│ab│', '└──┘']);
  assert.throws(() => box(['a'], { align: 'meio' }), RangeError);
  assert.throws(() => box('a'), TypeError);
});
