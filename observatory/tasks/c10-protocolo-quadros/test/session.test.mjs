import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sender, fragment } from '../src/sender.mjs';
import { Receiver, WINDOW } from '../src/receiver.mjs';
import { encodeFrame, decodeFrame } from '../src/frame.mjs';
import { encodeUtf8 } from '../src/utf8.mjs';
import { toHex, fromHex, concatBytes } from '../src/slip.mjs';

const frameOf = (seq, more, hex) => encodeFrame({ seq, more, payload: fromHex(hex) });

test('fragment: cortes exatos em bytes', () => {
  assert.deepEqual(fragment('aé€', 2).map(toHex), ['61 c3', 'a9 e2', '82 ac']);
  assert.deepEqual(fragment('😀!', 3).map(toHex), ['f0 9f 98', '80 21']);
  assert.deepEqual(fragment('😀', 1).map(toHex), ['f0', '9f', '98', '80']);
  assert.deepEqual(fragment('', 5).map(toHex), ['']);
  assert.deepEqual(fragment('abc', 64).map(toHex), ['61 62 63']);
  assert.deepEqual(fragment('ação', 4).map(toHex), ['61 c3 a7 c3', 'a3 6f']);
  assert.throws(() => fragment('x', 0), RangeError);
  assert.throws(() => fragment('x', 1025), RangeError);
});

test('Sender: numeração com volta 255 → 0', () => {
  const s = new Sender({ initialSeq: 254, maxPayload: 1 });
  const fr = s.send('abc').map(decodeFrame);
  assert.deepEqual(fr.map((f) => [f.seq, f.more, toHex(f.payload)]), [[254, true, '61'], [255, true, '62'], [0, false, '63']]);
  assert.equal(s.nextSeq, 1);
  const t = new Sender({ maxPayload: 4 });
  t.send('abcdefghi');
  assert.equal(t.nextSeq, 3);
  assert.deepEqual(t.send('x').map((w) => decodeFrame(w).seq), [3]);
});

test('Receiver: fragmentos do firmware cortando caracteres', () => {
  const r = new Receiver();
  assert.deepEqual(r.push(frameOf(0, true, '61 c3')), []);
  assert.deepEqual(r.push(frameOf(1, true, 'a9 e2')), []);
  assert.deepEqual(r.push(frameOf(2, false, '82 ac')), ['aé€']);
  assert.deepEqual(r.push(frameOf(3, true, 'f0 9f')), []);
  assert.deepEqual(r.push(frameOf(4, false, '98 80')), ['😀']);
  assert.deepEqual(r.push(frameOf(5, false, 'ed a0 bd ed b8 80')), []);
  assert.equal(r.stats.invalid, 1);
  assert.equal(r.stats.delivered, 2);
});

test('Receiver: reordenação e duplicatas dentro da janela', () => {
  assert.equal(WINDOW, 127);
  const s = new Sender({ maxPayload: 2 });
  const frames = s.send('abcdef');
  const r = new Receiver();
  assert.deepEqual(r.push(frames[2]), []);
  assert.deepEqual(r.push(frames[1]), []);
  assert.deepEqual(r.push(frames[1]), []);
  assert.equal(r.buffered, 2);
  assert.equal(r.stats.duplicates, 1);
  assert.deepEqual(r.push(frames[0]), ['abcdef']);
  assert.equal(r.buffered, 0);
});

test('Receiver: retransmissão de quadro já entregue é duplicata', () => {
  const s = new Sender({ maxPayload: 1 });
  const frames = s.send('abcdef');
  const r = new Receiver();
  const got = [];
  for (const w of frames) got.push(...r.push(w));
  assert.deepEqual(got, ['abcdef']);
  assert.deepEqual(r.push(frames[3]), []);
  assert.deepEqual(r.push(frames[5]), []);
  assert.equal(r.stats.duplicates, 2);
  assert.equal(r.buffered, 0);
  assert.deepEqual(r.push(frameOf(6, false, '7a')), ['z']);
});

test('Receiver: volta da numeração com quadros fora de ordem e retransmissão', () => {
  const r = new Receiver({ initialSeq: 254 });
  assert.deepEqual(r.push(frameOf(0, true, '63')), []);
  assert.deepEqual(r.push(frameOf(255, true, '62')), []);
  assert.deepEqual(r.push(frameOf(254, true, '61')), []);
  assert.deepEqual(r.push(frameOf(1, false, '64')), ['abcd']);
  assert.deepEqual(r.push(frameOf(0, true, '63')), []);
  assert.deepEqual(r.push(frameOf(255, true, '62')), []);
  assert.equal(r.stats.duplicates, 2);
  assert.equal(r.buffered, 0);
  assert.deepEqual(r.push(frameOf(2, false, '21')), ['!']);
});

test('fluxo contínuo: pushBytes byte a byte e em pedaços, com quadro corrompido', () => {
  const s = new Sender({ maxPayload: 3 });
  const a = s.send('fim do lote');
  const b = s.send('bom dia');
  const bad = Uint8Array.from(b[0]);
  bad[3] ^= 0x01;
  const stream = concatBytes([fromHex('11 22'), ...a, bad, ...b]);
  for (const step of [1, 7, stream.length]) {
    const r = new Receiver();
    const got = [];
    for (let i = 0; i < stream.length; i += step) got.push(...r.pushBytes(stream.subarray(i, i + step)));
    assert.deepEqual(got, ['fim do lote', 'bom dia'], 'step ' + step);
    assert.equal(r.stats.corrupt, 1);
  }
});

test('ida e volta: emoji e acentos com vários tamanhos de fragmento', () => {
  const texts = ['😀', '😀😀x', 'a😀', 'pão 🍞 e café ☕', '𝄞 clave', 'çãõ€'.repeat(5)];
  for (const text of texts) {
    for (let maxPayload = 1; maxPayload <= 7; maxPayload++) {
      const s = new Sender({ maxPayload });
      const r = new Receiver();
      const got = [];
      for (const w of s.send(text)) got.push(...r.push(w));
      assert.deepEqual(got, [text], JSON.stringify({ text, maxPayload }));
      const total = fragment(text, maxPayload).reduce((n, p) => n + p.length, 0);
      assert.equal(total, encodeUtf8(text).length);
    }
  }
});

test('ida e volta atravessando a volta da numeração, via fluxo', () => {
  const s = new Sender({ maxPayload: 2, initialSeq: 240 });
  const r = new Receiver({ initialSeq: 240 });
  const msgs = ['mensagem número um', 'dois 😀', 'três ☕☕', 'quatro'];
  const got = [];
  for (const m of msgs) for (const w of s.send(m)) got.push(...r.pushBytes(w));
  assert.deepEqual(got, msgs);
  assert.equal(s.nextSeq, (240 + msgs.reduce((n, m) => n + fragment(m, 2).length, 0)) % 256);
});
