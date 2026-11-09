import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeVarint } from '../src/varint.mjs';
import { crc32, crc32Continue } from '../src/crc32.mjs';
import { utf8Decode } from '../src/utf8.mjs';
import { decode as decodeBase64url } from '../src/base64url.mjs';

test('a canonical varint can be decoded from a nonzero offset', () => {
  assert.deepEqual(decodeVarint(Uint8Array.of(99, 0), 1), { value: 0n, length: 1 });
});

test('CRC-32 continuation matches hashing the concatenated input', () => {
  assert.equal(crc32Continue(crc32('swarm '), 'systems'), crc32('swarm systems'));
});

test('UTF-8 accepts valid U+FFFD and rejects surrogate encodings', () => {
  assert.equal(utf8Decode(Uint8Array.of(0xef, 0xbf, 0xbd)), '�');
  assert.throws(() => utf8Decode(Uint8Array.of(0xed, 0xa0, 0x80)), RangeError);
});

test('Base64url rejects impossible one-character quanta', () => {
  assert.throws(() => decodeBase64url('A'), RangeError);
});
