import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeUVarint, encodeSVarint, encodePacket, encodeBatch } from '../src/telemetria-varint/writer.mjs';
import { decodeUVarint, decodePacket, decodeBatch } from '../src/telemetria-varint/reader.mjs';
import { toHex, fromHex } from '../src/telemetria-varint/format.mjs';

const GOLD3 = { droneId: 7, readings: [{ t: 1000, alt: 12.5 }, { t: 1250, alt: 12 }, { t: 1200, alt: -0.3 }] };
const GOLD3_HEX = '4e 01 07 03 e8 07 fa 01 f4 03 f0 01 63 05';
const GOLD300 = { droneId: 300, readings: [{ t: 5, alt: 1.5 }, { t: 70, alt: -1 }] };
const GOLD300_HEX = '4e 01 ac 02 02 05 1e 82 01 13';

test('writer: uvarint e svarint seguem o formato de fio', () => {
  assert.equal(toHex(encodeUVarint(0)), '00');
  assert.equal(toHex(encodeUVarint(127)), '7f');
  assert.equal(toHex(encodeUVarint(128)), '80 01');
  assert.equal(toHex(encodeUVarint(300)), 'ac 02');
  assert.equal(toHex(encodeUVarint(16384)), '80 80 01');
  assert.equal(toHex(encodeUVarint(2 ** 35 + 5)), '85 80 80 80 80 01');
  assert.equal(toHex(encodeSVarint(-1)), '01');
  assert.equal(toHex(encodeSVarint(-50)), '63');
  assert.equal(toHex(encodeSVarint(250)), 'f4 03');
});

test('writer: pacotes dourados', () => {
  assert.equal(toHex(encodePacket(GOLD3)), GOLD3_HEX);
  assert.equal(toHex(encodePacket(GOLD300)), GOLD300_HEX);
});

test('reader: decodeUVarint com exemplos do formato e offset', () => {
  assert.deepEqual(decodeUVarint(fromHex('ac 02')), { value: 300, next: 2 });
  assert.deepEqual(decodeUVarint(fromHex('ff 80 01 05'), 1), { value: 128, next: 3 });
  assert.deepEqual(decodeUVarint(fromHex('85 80 80 80 80 01')), { value: 2 ** 35 + 5, next: 6 });
});

test('reader: pacotes dourados', () => {
  assert.deepEqual(decodePacket(fromHex(GOLD3_HEX)), GOLD3);
  assert.deepEqual(decodePacket(fromHex(GOLD300_HEX)), GOLD300);
});

test('reader: lote vindo do firmware com quatro leituras', () => {
  // droneId 1, leituras t=10,20,15,40 com altitudes 0, 0.1, -0.1, 25.6
  const hex = '01 0d 4e 01 01 04 0a 00 14 02 09 01 32 80 04';
  assert.deepEqual(decodeBatch(fromHex(hex)), [
    { droneId: 1, readings: [{ t: 10, alt: 0 }, { t: 20, alt: 0.1 }, { t: 15, alt: -0.1 }, { t: 40, alt: 25.6 }] },
  ]);
});

test('lote dourado nos dois sentidos', () => {
  const batch = [{ droneId: 1, readings: [] }, { droneId: 2, readings: [{ t: 0, alt: 0 }] }];
  const hex = '02 04 4e 01 01 00 06 4e 01 02 01 00 00';
  assert.equal(toHex(encodeBatch(batch)), hex);
  assert.deepEqual(decodeBatch(fromHex(hex)), batch);
});

test('round-trip de uvarint em várias magnitudes', () => {
  for (const n of [0, 1, 127, 128, 255, 300, 16383, 16384, 2 ** 21 + 3, 2 ** 31, 2 ** 45 + 17, Number.MAX_SAFE_INTEGER]) {
    const bytes = Uint8Array.from(encodeUVarint(n));
    assert.deepEqual(decodeUVarint(bytes), { value: n, next: bytes.length });
  }
});

test('round-trip de pacote com tempos não monotônicos', () => {
  const p = { droneId: 9, readings: [{ t: 50000, alt: 0 }, { t: 49000, alt: 100.4 }, { t: 51000, alt: 99.9 }, { t: 50500, alt: -7 }] };
  assert.deepEqual(decodePacket(encodePacket(p)), p);
});

test('round-trip de lote com vários drones', () => {
  const batch = [];
  for (let d = 0; d < 5; d++) {
    const readings = [];
    for (let i = 0; i < 6; i++) readings.push({ t: 1000 * d + ((i * 7919) % 1300), alt: (((i * 37 + d * 11) % 400) - 50) / 10 });
    batch.push({ droneId: 150 * d + 1, readings });
  }
  assert.deepEqual(decodeBatch(encodeBatch(batch)), batch);
});

test('erros: dados truncados, magic inválido e domínio', () => {
  assert.throws(() => decodePacket(fromHex('4e 01 07 01 e8')), RangeError);
  assert.throws(() => decodePacket(fromHex('4f 01 07 00')), /magic/);
  assert.throws(() => encodeUVarint(-1), RangeError);
});
