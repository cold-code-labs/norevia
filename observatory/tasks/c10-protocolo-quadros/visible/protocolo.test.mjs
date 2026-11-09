import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sender, fragment } from '../src/sender.mjs';
import { Receiver } from '../src/receiver.mjs';
import { encodeFrame, decodeFrame } from '../src/frame.mjs';
import { encodeUtf8 } from '../src/utf8.mjs';
import { toHex } from '../src/slip.mjs';

test('ida e volta: Sender → Receiver, quadro a quadro', () => {
  const texts = ['', 'ola', 'ação e café', 'preço: 10€', 'emoji 😀 ok', 'a'.repeat(100)];
  for (const text of texts) {
    for (const maxPayload of [1, 2, 3, 5, 64]) {
      const s = new Sender({ maxPayload });
      const r = new Receiver();
      const got = [];
      for (const wire of s.send(text)) got.push(...r.push(wire));
      assert.deepEqual(got, [text], JSON.stringify({ text, maxPayload }));
    }
  }
});

test('quadro dourado do firmware', () => {
  assert.equal(toHex(encodeFrame({ seq: 0, more: false, payload: encodeUtf8('oi') })), 'c0 00 00 00 02 6f 69 86 eb c0');
});

test('fragmentação dourada: cortes a cada maxPayload bytes', () => {
  assert.deepEqual(fragment('aé€', 2).map(toHex), ['61 c3', 'a9 e2', '82 ac']);
  const frames = new Sender({ maxPayload: 2 }).send('aé€').map(decodeFrame);
  assert.deepEqual(frames.map((f) => [f.seq, f.more, toHex(f.payload)]), [[0, true, '61 c3'], [1, true, 'a9 e2'], [2, false, '82 ac']]);
});
