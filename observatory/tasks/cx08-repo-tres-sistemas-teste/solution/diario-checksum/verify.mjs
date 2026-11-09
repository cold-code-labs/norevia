/**
 * Leitura e verificação do diário NVJ1.
 */
import { utf8Length, checksumHex } from './checksum.mjs';
import { PREFIX } from './writer.mjs';

const DECIMAL = /^(0|[1-9][0-9]*)$/;
const HEX8 = /^[0-9a-f]{8}$/;

/**
 * Decompõe uma linha em campos. O payload pode conter '|': ele vai do
 * terceiro separador até o ÚLTIMO '|' da linha.
 * @param {string} line
 * @returns {{seq:number, len:number, payload:string, checksum:string, body:string}}
 */
export function parseRecord(line) {
  if (typeof line !== 'string') throw new TypeError('linha deve ser string');
  const last = line.lastIndexOf('|');
  if (last < 0) throw new SyntaxError('registro sem separadores');
  const body = line.slice(0, last);
  const checksum = line.slice(last + 1);
  const parts = body.split('|');
  if (parts.length < 4) throw new SyntaxError('registro com campos faltando');
  const [prefix, seqTxt, lenTxt] = parts;
  if (prefix !== PREFIX) throw new SyntaxError(`prefixo inválido: ${prefix}`);
  if (!DECIMAL.test(seqTxt) || seqTxt === '0') throw new SyntaxError(`seq inválido: ${seqTxt}`);
  if (!DECIMAL.test(lenTxt)) throw new SyntaxError(`len inválido: ${lenTxt}`);
  if (!HEX8.test(checksum)) throw new SyntaxError(`checksum malformado: ${checksum}`);
  const payload = parts.slice(3).join('|');
  return { seq: Number(seqTxt), len: Number(lenTxt), payload, checksum, body };
}

/**
 * Verifica um registro isolado. Ordem das verificações: sintaxe, tamanho,
 * checksum.
 * @returns {{ok:true, seq:number} | {ok:false, reason:'syntax'|'length'|'checksum', seq:number|null}}
 */
export function verifyRecord(line) {
  let rec;
  try {
    rec = parseRecord(line);
  } catch (e) {
    if (e instanceof SyntaxError) return { ok: false, reason: 'syntax', seq: null };
    throw e;
  }
  if (rec.len !== utf8Length(rec.payload)) return { ok: false, reason: 'length', seq: rec.seq };
  if (rec.checksum !== checksumHex(rec.body)) return { ok: false, reason: 'checksum', seq: rec.seq };
  return { ok: true, seq: rec.seq };
}

/**
 * Verifica um diário inteiro. Um '\n' final é opcional; qualquer outra linha
 * (inclusive vazia) é um registro. Além de cada registro ser válido, cada seq
 * deve ser exatamente o anterior + 1.
 * @param {string} text
 * @returns {{ok:boolean, count:number, firstBad:null|{index:number, seq:number|null, reason:string}}}
 */
export function verifyJournal(text) {
  if (typeof text !== 'string') throw new TypeError('diário deve ser string');
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  let prevSeq = null;
  for (let i = 0; i < lines.length; i++) {
    const r = verifyRecord(lines[i]);
    if (!r.ok) return { ok: false, count: i, firstBad: { index: i, seq: r.seq, reason: r.reason } };
    if (prevSeq !== null && r.seq !== prevSeq + 1) {
      return { ok: false, count: i, firstBad: { index: i, seq: r.seq, reason: 'sequence' } };
    }
    prevSeq = r.seq;
  }
  return { ok: true, count: lines.length, firstBad: null };
}

/** Payloads de um diário válido, na ordem; lança Error se o diário for inválido. */
export function readPayloads(text) {
  const v = verifyJournal(text);
  if (!v.ok) throw new Error(`diário inválido na linha ${v.firstBad.index}: ${v.firstBad.reason}`);
  return text.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === '')).map((l) => parseRecord(l).payload);
}
