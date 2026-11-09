import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeVarint, decodeVarint } from '../src/varint.mjs';
import { crc32, crc32Continue } from '../src/crc32.mjs';
import { encode as encodeBytes, decode as decodeBytes } from '../src/base64url.mjs';
import { utf8Encode, utf8Decode } from '../src/utf8.mjs';

test('varints preserve offsets, values, and canonical form', () => {
  assert.deepEqual(decodeVarint(Uint8Array.of(99, 0), 1), { value: 0n, length: 1 });
  const bytes = encodeVarint((1n << 63n) + 17n);
  const input = Uint8Array.from([7, ...bytes, 8]);
  assert.deepEqual(decodeVarint(input, 1), { value: (1n << 63n) + 17n, length: bytes.length });
  assert.throws(() => decodeVarint(Uint8Array.of(0x80, 0)), RangeError);
});

test('CRC-32 can be continued over multiple chunks', () => {
  const first = crc32('alpha');
  const second = crc32Continue(first, ' beta');
  assert.equal(second, crc32('alpha beta'));
  assert.equal(crc32Continue(crc32(''), 'payload'), crc32('payload'));
});

test('strict UTF-8 round-trips supplementary and boundary code points', () => {
  const text = 'A𐀀�';
  assert.equal(utf8Decode(utf8Encode(text)), text);
  assert.throws(() => utf8Decode(Uint8Array.of(0xed, 0xa0, 0x80)), RangeError);
  assert.throws(() => utf8Decode(Uint8Array.of(0xef, 0xbf)), RangeError);
});

test('Base64url handles every residual length and rejects impossible forms', () => {
  for (const n of [0, 1, 2, 3, 4, 5, 6, 127]) {
    const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37) & 255);
    assert.deepEqual(decodeBytes(encodeBytes(bytes)), bytes);
  }
  assert.throws(() => decodeBytes('A'), RangeError);
});
