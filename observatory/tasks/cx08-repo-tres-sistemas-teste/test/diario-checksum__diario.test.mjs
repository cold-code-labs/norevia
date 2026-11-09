import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adler32, hex8, checksumHex } from '../src/diario-checksum/checksum.mjs';
import { formatRecord, JournalWriter } from '../src/diario-checksum/writer.mjs';
import { parseRecord, verifyRecord, verifyJournal, readPayloads } from '../src/diario-checksum/verify.mjs';

const GOLD = [
  'NVJ1|1|7|decolar|2e5205d6',
  'NVJ1|2|6|ação|2cca069c',
  'NVJ1|12|3|a|b|1cb90469',
  'NVJ1|3|0||0e2b02f7',
];
const GOLD_JOURNAL = 'NVJ1|7|4|alfa|1e340493\nNVJ1|8|13|pouso às 10h|61170845\nNVJ1|9|5|x|y|z|247c0565\n';

test('checksum: Adler-32 e hex8', () => {
  assert.equal(hex8(adler32('Wikipedia')), '11e60398');
  assert.equal(checksumHex(''), '00000001');
  assert.equal(checksumHex('ação'), '0cb503a1');
});

test('writer: registros e diário dourados', () => {
  assert.equal(formatRecord(1, 'decolar'), GOLD[0]);
  assert.equal(formatRecord(2, 'ação'), GOLD[1]);
  assert.equal(formatRecord(12, 'a|b'), GOLD[2]);
  assert.equal(formatRecord(3, ''), GOLD[3]);
  const w = new JournalWriter({ startSeq: 7 });
  w.appendAll(['alfa', 'pouso às 10h', 'x|y|z']);
  assert.equal(w.toString(), GOLD_JOURNAL);
  assert.equal(w.nextSeq, 10);
});

test('verificador: aceita os registros dourados', () => {
  for (const line of GOLD) assert.equal(verifyRecord(line).ok, true, line);
  assert.deepEqual(parseRecord(GOLD[2]), { seq: 12, len: 3, payload: 'a|b', checksum: '1cb90469', body: 'NVJ1|12|3|a|b' });
  assert.deepEqual(verifyJournal(GOLD_JOURNAL), { ok: true, count: 3, firstBad: null });
  assert.deepEqual(readPayloads(GOLD_JOURNAL), ['alfa', 'pouso às 10h', 'x|y|z']);
});

test('verificador: detecta adulteração de seq, payload e tamanho', () => {
  assert.deepEqual(verifyRecord('NVJ1|5|7|decolar|2e5205d6'), { ok: false, reason: 'checksum', seq: 5 });
  assert.deepEqual(verifyRecord('NVJ1|1|7|decolaR|2e5205d6'), { ok: false, reason: 'checksum', seq: 1 });
  assert.deepEqual(verifyRecord('NVJ1|2|4|ação|2cca069c'), { ok: false, reason: 'length', seq: 2 });
  assert.deepEqual(verifyRecord('NVJ1|x|7|decolar|2e5205d6'), { ok: false, reason: 'syntax', seq: null });
  assert.deepEqual(verifyRecord('NVJ0|1|7|decolar|2e5205d6'), { ok: false, reason: 'syntax', seq: null });
});

test('verificador: primeiro registro ruim de um diário', () => {
  const lines = GOLD_JOURNAL.split('\n');
  const gap = [lines[0], lines[2]].join('\n');
  assert.deepEqual(verifyJournal(gap), { ok: false, count: 1, firstBad: { index: 1, seq: 9, reason: 'sequence' } });
  const tampered = [lines[0], lines[1].replace('10h', '11h'), lines[2]].join('\n');
  assert.deepEqual(verifyJournal(tampered), { ok: false, count: 1, firstBad: { index: 1, seq: 8, reason: 'checksum' } });
  assert.throws(() => readPayloads(tampered), Error);
});

test('round-trip: writer → verificador com payloads variados', () => {
  const payloads = ['decolar', 'ação de pouso', 'a|b|c', '', 'temperatura 21,5 °C', 'drone 7 → base'];
  const w = new JournalWriter({ startSeq: 41 });
  w.appendAll(payloads);
  const text = w.toString();
  assert.deepEqual(verifyJournal(text), { ok: true, count: payloads.length, firstBad: null });
  assert.deepEqual(readPayloads(text), payloads);
  for (const line of text.trimEnd().split('\n')) assert.equal(verifyRecord(line).ok, true);
});

test('round-trip: payload adulterado é apontado no índice certo', () => {
  const w = new JournalWriter({ startSeq: 3 });
  w.appendAll(['norte', 'sul', 'leste', 'oeste']);
  const lines = w.toString().split('\n');
  lines[2] = lines[2].replace('leste', 'lesta');
  assert.deepEqual(verifyJournal(lines.join('\n')), { ok: false, count: 2, firstBad: { index: 2, seq: 5, reason: 'checksum' } });
});

test('round-trip: diários concatenados e lacuna de sequência', () => {
  const a = new JournalWriter();
  a.appendAll(['início', 'meio']);
  const b = new JournalWriter({ startSeq: a.nextSeq });
  b.appendAll(['fim|ok']);
  assert.deepEqual(verifyJournal(a.toString() + b.toString()), { ok: true, count: 3, firstBad: null });
  const c = new JournalWriter({ startSeq: a.nextSeq + 1 });
  c.append('pulou');
  assert.deepEqual(verifyJournal(a.toString() + c.toString()), { ok: false, count: 2, firstBad: { index: 2, seq: 4, reason: 'sequence' } });
});

test('round-trip: adulterar só o seq de um registro é detectado', () => {
  const w = new JournalWriter();
  w.appendAll(['um', 'dois', 'tres']);
  const lines = w.toString().trimEnd().split('\n');
  assert.equal(verifyRecord(lines[1]).ok, true);
  const forged = lines[1].replace(/^NVJ1\|2\|/, 'NVJ1|20|');
  assert.deepEqual(verifyRecord(forged), { ok: false, reason: 'checksum', seq: 20 });
});

test('erros de entrada', () => {
  assert.throws(() => formatRecord(0, 'x'), RangeError);
  assert.throws(() => formatRecord(1, 'a\nb'), SyntaxError);
  assert.throws(() => parseRecord('NVJ1|1|7'), SyntaxError);
  assert.throws(() => new JournalWriter({ startSeq: 0 }), RangeError);
});
