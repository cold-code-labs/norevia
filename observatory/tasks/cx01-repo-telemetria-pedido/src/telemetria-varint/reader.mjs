/**
 * Leitor NTEL v1: desserializa bytes em pacotes de telemetria.
 */
import { MAGIC, VERSION, MAX_UVARINT, unzigzag, dmToMeters } from './format.mjs';

/**
 * Cursor de leitura sobre um Uint8Array.
 */
export class ByteSource {
  constructor(bytes, offset = 0) {
    if (!(bytes instanceof Uint8Array)) throw new TypeError('bytes deve ser Uint8Array');
    this.bytes = bytes;
    this.pos = offset;
  }

  get remaining() {
    return this.bytes.length - this.pos;
  }

  next() {
    if (this.pos >= this.bytes.length) throw new RangeError(`fim inesperado dos dados na posição ${this.pos}`);
    return this.bytes[this.pos++];
  }

  take(n) {
    if (n > this.remaining) throw new RangeError(`faltam ${n - this.remaining} bytes na posição ${this.pos}`);
    const out = this.bytes.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
}

/**
 * Lê um uvarint a partir de `offset`.
 * @param {Uint8Array} bytes
 * @param {number} [offset=0]
 * @returns {{value:number, next:number}} valor e posição do primeiro byte seguinte
 */
export function decodeUVarint(bytes, offset = 0) {
  const src = new ByteSource(bytes, offset);
  const value = readUVarint(src);
  return { value, next: src.pos };
}

/** Lê um uvarint do cursor. */
export function readUVarint(src) {
  let value = 0;
  for (;;) {
    const b = src.next();
    value = value * 128 + (b & 0x7f);
    if (value > MAX_UVARINT) throw new RangeError('uvarint excede o limite');
    if ((b & 0x80) === 0) return value;
  }
}

/** Lê um svarint (zigzag) do cursor. */
export function readSVarint(src) {
  return unzigzag(readUVarint(src));
}

/**
 * Lê um pacote a partir do cursor.
 * @returns {{droneId:number, readings:{t:number, alt:number}[]}}
 */
export function readPacket(src) {
  const magic = src.next();
  if (magic !== MAGIC) throw new Error(`magic inválido: 0x${magic.toString(16)}`);
  const version = src.next();
  if (version !== VERSION) throw new Error(`versão não suportada: ${version}`);
  const droneId = readUVarint(src);
  const n = readUVarint(src);
  const readings = [];
  let t0 = 0;
  for (let i = 0; i < n; i++) {
    let t;
    if (i === 0) t = t0 = readUVarint(src);
    else t = t0 + readSVarint(src);
    const alt = dmToMeters(readSVarint(src));
    readings.push({ t, alt });
  }
  return { droneId, readings };
}

/**
 * Desserializa um pacote completo; bytes sobrando ao final são erro.
 * @param {Uint8Array} bytes
 */
export function decodePacket(bytes) {
  const src = new ByteSource(bytes);
  const packet = readPacket(src);
  if (src.remaining !== 0) throw new Error(`${src.remaining} bytes excedentes após o pacote`);
  return packet;
}

/**
 * Desserializa um lote produzido por `encodeBatch`.
 * @param {Uint8Array} bytes
 */
export function decodeBatch(bytes) {
  const src = new ByteSource(bytes);
  const count = readUVarint(src);
  const packets = [];
  for (let i = 0; i < count; i++) {
    const len = readUVarint(src);
    packets.push(decodePacket(src.take(len)));
  }
  if (src.remaining !== 0) throw new Error(`${src.remaining} bytes excedentes após o lote`);
  return packets;
}
