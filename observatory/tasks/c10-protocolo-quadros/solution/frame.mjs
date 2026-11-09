/**
 * Codificação e decodificação de quadros do enlace.
 */
import { END, stuff, unstuff, concatBytes } from './slip.mjs';

export const SEQ_MAX = 0xff;
export const FLAG_MORE = 0x01;
export const HEADER_SIZE = 4;
export const CRC_SIZE = 2;
export const MAX_PAYLOAD = 0xffff;

export class FrameError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FrameError';
    this.code = code;
  }
}

/** CRC-16/CCITT-FALSE: polinômio 0x1021, valor inicial 0xFFFF, sem reflexão, sem xor final. */
export function crc16(bytes) {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let k = 0; k < 8; k++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

/** { seq, more, payload } → bytes no fio (com os dois END). */
export function encodeFrame({ seq, more = false, payload } = {}) {
  if (!Number.isInteger(seq) || seq < 0 || seq > SEQ_MAX) throw new RangeError(`seq inválido: ${seq}`);
  if (typeof more !== 'boolean') throw new TypeError('more deve ser boolean');
  if (!(payload instanceof Uint8Array)) throw new TypeError('payload deve ser Uint8Array');
  if (payload.length > MAX_PAYLOAD) throw new RangeError('payload grande demais');
  const len = payload.length;
  const body = new Uint8Array(HEADER_SIZE + len + CRC_SIZE);
  body[0] = seq;
  body[1] = more ? FLAG_MORE : 0;
  body[2] = len >> 8;
  body[3] = len & 0xff;
  body.set(payload, HEADER_SIZE);
  const crc = crc16(body.subarray(0, HEADER_SIZE + len));
  body[HEADER_SIZE + len] = crc >> 8;
  body[HEADER_SIZE + len + 1] = crc & 0xff;
  return concatBytes([[END], stuff(body), [END]]);
}

/**
 * Bytes de um quadro → { seq, more, payload }. Aceita o quadro com ou sem os
 * END das pontas (como sai de encodeFrame ou de FrameSplitter).
 */
export function decodeFrame(wire) {
  if (!(wire instanceof Uint8Array)) throw new TypeError('decodeFrame: esperado Uint8Array');
  let start = 0;
  let end = wire.length;
  if (end > start && wire[start] === END) start++;
  if (end > start && wire[end - 1] === END) end--;
  let body;
  try {
    body = unstuff(wire.subarray(start, end));
  } catch (e) {
    throw new FrameError('ESCAPE', e.message);
  }
  if (body.length < HEADER_SIZE + CRC_SIZE) throw new FrameError('SHORT', `quadro curto: ${body.length} bytes`);
  const len = (body[2] << 8) | body[3];
  if (len !== body.length - HEADER_SIZE - CRC_SIZE) throw new FrameError('LENGTH', `len ${len} não confere`);
  const crcAt = HEADER_SIZE + len;
  const expected = (body[crcAt] << 8) | body[crcAt + 1];
  if (crc16(body.subarray(0, crcAt)) !== expected) throw new FrameError('CRC', 'CRC não confere');
  if (body[1] & ~FLAG_MORE) throw new FrameError('FLAGS', `flags desconhecidas: ${body[1]}`);
  return { seq: body[0], more: (body[1] & FLAG_MORE) !== 0, payload: body.slice(HEADER_SIZE, crcAt) };
}
