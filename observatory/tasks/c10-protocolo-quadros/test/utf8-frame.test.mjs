import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeUtf8, decodeUtf8, utf8Length, codePoints } from '../src/utf8.mjs';
import { stuff, unstuff, toHex, fromHex, FrameSplitter, concatBytes } from '../src/slip.mjs';
import { crc16, encodeFrame, decodeFrame, FrameError } from '../src/frame.mjs';

const code = (fn) => {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof FrameError, 'esperado FrameError, veio ' + e);
    return e.code;
  }
  return 'sem erro';
};

test('encodeUtf8: vetores dourados', () => {
  assert.equal(toHex(encodeUtf8('aé€😀')), '61 c3 a9 e2 82 ac f0 9f 98 80');
  assert.equal(toHex(encodeUtf8('\uD800x')), 'ef bf bd 78');
  assert.equal(toHex(encodeUtf8('x\uD83D')), '78 ef bf bd');
  assert.equal(toHex(encodeUtf8('\uDE00\uD83D')), 'ef bf bd ef bf bd');
  assert.equal(toHex(encodeUtf8('𝄞')), 'f0 9d 84 9e');
  assert.equal(utf8Length('😀'), 4);
  assert.equal(utf8Length('aé€😀'), 10);
  assert.deepEqual([...codePoints('a😀b')], [0x61, 0x1f600, 0x62]);
  assert.throws(() => encodeUtf8(3), TypeError);
});

test('decodeUtf8: estrito', () => {
  assert.equal(decodeUtf8(fromHex('f0 9f 98 80')), '😀');
  assert.equal(decodeUtf8(fromHex('61 c3 a9 e2 82 ac')), 'aé€');
  assert.equal(decodeUtf8(new Uint8Array(0)), '');
  for (const bad of ['ed a0 bd ed b8 80', 'ed a0 80', 'ed bf bf', 'c0 80', 'c1 bf', 'e0 80 80', 'e2 82', '80', 'f4 90 80 80', 'f5 80 80 80', 'c3 41']) {
    assert.throws(() => decodeUtf8(fromHex(bad)), TypeError, bad);
  }
  assert.throws(() => decodeUtf8([0x61]), TypeError);
  for (const s of ['', 'abc', 'ação', '€😀𝄞', 'mistura 😀 é € x']) assert.equal(decodeUtf8(encodeUtf8(s)), s);
});

test('stuff/unstuff e FrameSplitter', () => {
  assert.equal(toHex(stuff(fromHex('01 c0 db 02'))), '01 db dc db dd 02');
  assert.equal(toHex(unstuff(fromHex('01 db dc db dd 02'))), '01 c0 db 02');
  assert.throws(() => unstuff(fromHex('db 01')), RangeError);
  assert.throws(() => unstuff(fromHex('01 db')), RangeError);
  assert.throws(() => unstuff(fromHex('01 c0')), RangeError);
  const sp = new FrameSplitter();
  assert.deepEqual(sp.push(fromHex('aa bb c0 01 02')).map(toHex), []);
  assert.deepEqual(sp.push(fromHex('c0 c0 03 c0 04')).map(toHex), ['01 02', '03']);
  assert.equal(sp.pending, 1);
  assert.equal(toHex(concatBytes([[1], fromHex('02 03')])), '01 02 03');
});

test('crc16 e encodeFrame: vetores dourados', () => {
  assert.equal(crc16(encodeUtf8('123456789')), 0x29b1);
  assert.equal(toHex(encodeFrame({ seq: 0, more: false, payload: encodeUtf8('oi') })), 'c0 00 00 00 02 6f 69 86 eb c0');
  assert.equal(toHex(encodeFrame({ seq: 192, more: true, payload: encodeUtf8('é') })), 'c0 db dc 01 00 02 c3 a9 13 d5 c0');
  assert.equal(toHex(encodeFrame({ seq: 4, more: false, payload: encodeUtf8('bom') })), 'c0 04 00 00 03 62 6f 6d f8 db dc c0');
  assert.equal(toHex(encodeFrame({ seq: 0, more: true, payload: encodeUtf8('fim') })), 'c0 00 01 00 03 66 69 6d 0a db dc c0');
  assert.equal(toHex(encodeFrame({ seq: 7, payload: new Uint8Array(0) })).split(' ').length, 2 + 6);
  assert.throws(() => encodeFrame({ seq: 256, more: false, payload: new Uint8Array(0) }), RangeError);
  assert.throws(() => encodeFrame({ seq: 1, more: false, payload: [1] }), TypeError);
});

test('decodeFrame: quadros do firmware e erros', () => {
  const f = decodeFrame(fromHex('c0 04 00 00 03 62 6f 6d f8 db dc c0'));
  assert.deepEqual([f.seq, f.more, toHex(f.payload)], [4, false, '62 6f 6d']);
  const g = decodeFrame(fromHex('00 01 00 03 66 69 6d 0a db dc'));
  assert.deepEqual([g.seq, g.more, toHex(g.payload)], [0, true, '66 69 6d']);
  const h = decodeFrame(fromHex('c0 db dc 01 00 02 c3 a9 13 d5 c0'));
  assert.deepEqual([h.seq, h.more, toHex(h.payload)], [192, true, 'c3 a9']);
  const body = (seq, flags, payload, lenDelta = 0) => {
    const b = [seq, flags, (payload.length + lenDelta) >> 8, (payload.length + lenDelta) & 0xff, ...payload];
    const c = crc16(Uint8Array.from(b));
    return concatBytes([[0xc0], stuff(Uint8Array.from([...b, c >> 8, c & 0xff])), [0xc0]]);
  };
  assert.equal(code(() => decodeFrame(body(1, 2, [0x61]))), 'FLAGS');
  assert.equal(code(() => decodeFrame(body(1, 0, [0x61], 1))), 'LENGTH');
  assert.equal(code(() => decodeFrame(fromHex('c0 00 00 00 02 6f 6a 86 eb c0'))), 'CRC');
  assert.equal(code(() => decodeFrame(fromHex('c0 00 00 00 02 6f 69 86 c0'))), 'LENGTH');
  assert.equal(code(() => decodeFrame(fromHex('c0 00 00 00 00 c0'))), 'SHORT');
  assert.equal(code(() => decodeFrame(fromHex('c0 00 00 db 00 02 6f 69 86 eb c0'))), 'ESCAPE');
  assert.equal(decodeFrame(body(9, 1, [])).more, true);
});
