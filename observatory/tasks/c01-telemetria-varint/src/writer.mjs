/**
 * Escritor NTEL v1: serializa pacotes de telemetria em bytes.
 */
import { MAGIC, VERSION, MAX_UVARINT, zigzag, metersToDm } from './format.mjs';

/**
 * Acumulador de bytes com crescimento automático.
 */
export class ByteSink {
  constructor() {
    this.buf = new Uint8Array(16);
    this.len = 0;
  }

  push(b) {
    if (this.len === this.buf.length) {
      const next = new Uint8Array(this.buf.length * 2);
      next.set(this.buf);
      this.buf = next;
    }
    this.buf[this.len++] = b & 0xff;
  }

  pushAll(bytes) {
    for (const b of bytes) this.push(b);
  }

  toBytes() {
    return this.buf.slice(0, this.len);
  }
}

/**
 * Codifica um inteiro não negativo como uvarint (grupos de 7 bits, com o bit
 * 0x80 indicando que há mais bytes).
 * @param {number} n
 * @returns {number[]}
 */
export function encodeUVarint(n) {
  if (!Number.isSafeInteger(n) || n < 0 || n > MAX_UVARINT) throw new RangeError(`uvarint fora do domínio: ${n}`);
  const groups = [];
  let rest = n;
  do {
    groups.unshift(rest % 128);
    rest = Math.floor(rest / 128);
  } while (rest > 0);
  return groups.map((g, i) => (i < groups.length - 1 ? g | 0x80 : g));
}

/** Codifica um inteiro com sinal como zigzag + uvarint. */
export function encodeSVarint(n) {
  return encodeUVarint(zigzag(n));
}

function checkReading(r, i) {
  if (!r || typeof r !== 'object') throw new TypeError(`leitura ${i} inválida`);
  if (!Number.isSafeInteger(r.t) || r.t < 0) throw new RangeError(`leitura ${i}: t deve ser inteiro >= 0`);
}

/**
 * Serializa um pacote.
 * @param {{droneId:number, readings:{t:number, alt:number}[]}} packet
 * @returns {Uint8Array}
 */
export function encodePacket(packet) {
  const { droneId, readings } = packet ?? {};
  if (!Array.isArray(readings)) throw new TypeError('readings deve ser um array');
  const sink = new ByteSink();
  sink.push(MAGIC);
  sink.push(VERSION);
  sink.pushAll(encodeUVarint(droneId));
  sink.pushAll(encodeUVarint(readings.length));
  let prevT = 0;
  readings.forEach((r, i) => {
    checkReading(r, i);
    if (i === 0) {
      sink.pushAll(encodeUVarint(r.t));
      prevT = r.t;
    } else {
      sink.pushAll(encodeSVarint(r.t - prevT));
    }
    sink.pushAll(encodeSVarint(metersToDm(r.alt)));
  });
  return sink.toBytes();
}

/**
 * Serializa um lote: uvarint com a quantidade de pacotes e, para cada pacote,
 * uvarint com o tamanho em bytes seguido dos bytes do pacote.
 * @param {Array<{droneId:number, readings:{t:number, alt:number}[]}>} packets
 * @returns {Uint8Array}
 */
export function encodeBatch(packets) {
  if (!Array.isArray(packets)) throw new TypeError('packets deve ser um array');
  const sink = new ByteSink();
  sink.pushAll(encodeUVarint(packets.length));
  for (const p of packets) {
    const bytes = encodePacket(p);
    sink.pushAll(encodeUVarint(bytes.length));
    sink.pushAll(bytes);
  }
  return sink.toBytes();
}
