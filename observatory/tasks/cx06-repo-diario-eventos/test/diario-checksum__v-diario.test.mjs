import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatRecord, JournalWriter } from '../src/diario-checksum/writer.mjs';
import { verifyJournal, readPayloads } from '../src/diario-checksum/verify.mjs';

test('formatRecord segue o formato de registro', () => {
  assert.equal(formatRecord(1, 'decolar'), 'NVJ1|1|7|decolar|2e5205d6');
});

test('diário escrito pelo writer é aceito pelo verificador', () => {
  const w = new JournalWriter();
  w.appendAll(['decolar', 'subir até 120 m', 'pairar']);
  assert.deepEqual(verifyJournal(w.toString()), { ok: true, count: 3, firstBad: null });
  assert.deepEqual(readPayloads(w.toString()), ['decolar', 'subir até 120 m', 'pairar']);
});
