/**
 * Escritor do diário NVJ1 (um registro por linha).
 */
import { utf8Length, checksumHex } from './checksum.mjs';

export const PREFIX = 'NVJ1';

function checkPayload(payload) {
  if (typeof payload !== 'string') throw new TypeError('payload deve ser string');
  if (/[\r\n]/.test(payload)) throw new SyntaxError('payload não pode conter quebra de linha');
}

/**
 * Monta uma linha de registro (sem '\n' no fim).
 * @param {number} seq número de sequência (inteiro >= 1)
 * @param {string} payload
 * @returns {string}
 */
export function formatRecord(seq, payload) {
  if (!Number.isSafeInteger(seq) || seq < 1) throw new RangeError(`seq inválido: ${seq}`);
  checkPayload(payload);
  const body = `${PREFIX}|${seq}|${utf8Length(payload)}|${payload}`;
  return `${body}|${checksumHex(body)}`;
}

/**
 * Acumula registros com números de sequência consecutivos.
 */
export class JournalWriter {
  /** @param {{startSeq?: number}} [opts] */
  constructor({ startSeq = 1 } = {}) {
    if (!Number.isSafeInteger(startSeq) || startSeq < 1) throw new RangeError(`startSeq inválido: ${startSeq}`);
    this.seq = startSeq;
    this.lines = [];
  }

  /** Próximo número de sequência a ser usado. */
  get nextSeq() {
    return this.seq;
  }

  /** Acrescenta um registro e devolve a linha gerada. */
  append(payload) {
    const line = formatRecord(this.seq, payload);
    this.lines.push(line);
    this.seq += 1;
    return line;
  }

  /** Acrescenta vários payloads, na ordem. */
  appendAll(payloads) {
    return payloads.map((p) => this.append(p));
  }

  /** Texto do diário: cada linha terminada por '\n'; diário vazio → ''. */
  toString() {
    return this.lines.map((l) => l + '\n').join('');
  }
}
