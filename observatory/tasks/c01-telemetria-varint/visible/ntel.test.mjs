import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeUVarint, encodePacket } from '../src/writer.mjs';
import { decodePacket } from '../src/reader.mjs';

test('uvarint segue o formato de fio', () => {
  assert.deepEqual(encodeUVarint(1), [0x01]);
  assert.deepEqual(encodeUVarint(300), [0xac, 0x02]);
});

test('round-trip de pacote com duas leituras', () => {
  const p = { droneId: 42, readings: [{ t: 1000, alt: 12.5 }, { t: 2600, alt: -3.2 }] };
  assert.deepEqual(decodePacket(encodePacket(p)), p);
});
