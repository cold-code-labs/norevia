import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WINDOW, MIN_MATCH, MAX_MATCH, encodeVarint, decodeVarint, tokenize, serialize, compress, decompress,
  decodeTokens, formatTokens, toHex, fromHex, compressText, decompressText, stats,
} from '../src/lz77.mjs';

const enc = (s) => new TextEncoder().encode(s);
const fmt = (s) => formatTokens(tokenize(typeof s === 'string' ? enc(s) : s));

function prng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) >>> 24;
}
/** Bytes pseudoaleatórios cujos trigramas são todos distintos (não há cópias possíveis). */
function distinctTrigrams(n, seed) {
  const r = prng(seed);
  const seen = new Set();
  const out = [r(), r()];
  while (out.length < n) {
    for (;;) {
      const b = r();
      const k = (out[out.length - 2] << 16) | (out[out.length - 1] << 8) | b;
      if (!seen.has(k)) { seen.add(k); out.push(b); break; }
    }
  }
  return Uint8Array.from(out);
}

test('constantes', () => {
  assert.deepEqual([WINDOW, MIN_MATCH, MAX_MATCH], [4096, 3, 258]);
});

test('varints', () => {
  assert.equal(toHex(encodeVarint(0)), '00');
  assert.equal(toHex(encodeVarint(127)), '7f');
  assert.equal(toHex(encodeVarint(128)), '8001');
  assert.equal(toHex(encodeVarint(300)), 'ac02');
  assert.equal(toHex(encodeVarint(2 ** 32 - 1)), 'ffffffff0f');
  for (const bad of [-1, 1.5, 2 ** 32, NaN]) assert.throws(() => encodeVarint(bad), RangeError);
  assert.deepEqual(decodeVarint(fromHex('00ac02'), 1), { value: 300, next: 3 });
  assert.deepEqual(decodeVarint(fromHex('ffffffff0f')), { value: 2 ** 32 - 1, next: 5 });
  for (const bad of ['', '80', '8000', 'ffffffff1f', '8080808080', '808080808001']) assert.throws(() => decodeVarint(fromHex(bad)), RangeError, bad);
  assert.throws(() => decodeVarint(fromHex('00'), -1), RangeError);
  assert.throws(() => decodeVarint([0]), TypeError);
});

test('tokenize: exemplos do contrato', () => {
  assert.equal(fmt('abcabcabc'), 'a b c <6,3>');
  assert.equal(fmt('aaaaaaaaaa'), 'a <9,1>');
  assert.equal(fmt('abcbcbcbcabcab'), 'a b c <6,2> <3,9> a b');
  assert.equal(fmt('abcabcXabcabcabc'), 'a b c <3,3> X <6,7> <3,3>');
  assert.equal(fmt('aabaabbbb'), 'a a b <3,3> <3,1>');
  assert.equal(fmt('aaaaabbbbbbbb'), 'a <4,1> b <7,1>');
  assert.equal(fmt(new Uint8Array(300).fill(97)), 'a <258,1> <41,1>');
  assert.equal(fmt(''), '');
  assert.equal(fmt('ab'), 'a b');
  assert.throws(() => tokenize('abc'), TypeError);
});

test('tokenize: maior cópia e menor distância em textos', () => {
  assert.equal(fmt('banana bandana banana'), 'b a n <3,2> \\x20 <3,7> d <7,8> <3,2>');
  assert.equal(fmt('abcXabcYabcXabc'), 'a b c X <3,4> Y <7,8>');
  assert.equal(fmt('mississippi missouri mississippi'), 'm i s s <4,3> p p i \\x20 <4,12> o u r <6,9> <7,21>');
  assert.equal(fmt('aaaaabaabbababbbbaaa'), 'a <4,1> b <3,3> b <3,6> b <3,1> <3,15>');
  assert.equal(fmt('baaaaabbaabbabaaab'), 'b a <4,1> b <3,7> <3,4> <4,13> b');
  assert.equal(fmt('aabbbbbbbabab'), 'a a b <6,1> a <3,2>');
});

test('tokenize: limites da janela', () => {
  const x = distinctTrigrams(4097, 11);
  assert.equal(tokenize(x).every((t) => t.type === 'lit'), true);
  const inWindow = new Uint8Array(4096 + 10);
  inWindow.set(x.subarray(0, 4096));
  inWindow.set(x.subarray(0, 10), 4096);
  const t1 = tokenize(inWindow);
  assert.equal(t1.length, 4097);
  assert.deepEqual(t1[4096], { type: 'match', len: 10, dist: 4096 });
  const outWindow = new Uint8Array(4097 + 10);
  outWindow.set(x);
  outWindow.set(x.subarray(0, 10), 4097);
  assert.equal(tokenize(outWindow).every((t) => t.type === 'lit'), true);
  const twice = new Uint8Array(8192);
  twice.set(x.subarray(0, 4096));
  twice.set(x.subarray(0, 4096), 4096);
  const t2 = tokenize(twice).slice(4096);
  assert.deepEqual(t2.map((t) => t.len), [...Array(15).fill(258), 226]);
  assert.ok(t2.every((t) => t.dist === 4096));
});

test('compress: bytes de referência', () => {
  assert.equal(toHex(compressText('')), '00');
  assert.equal(toHex(compressText('ab')), '02026162');
  assert.equal(toHex(compressText('abcabcabc')), '09046162630702');
  assert.equal(toHex(compressText('aaaaaaaaaa')), '0a00610d00');
  assert.equal(toHex(compressText('abcabcXabcabcabc')), '10046162630102005807060102');
  assert.equal(toHex(compress(new Uint8Array(300).fill(97))), 'ac020061ff03004d00');
  assert.equal(toHex(compressText('banana bandana banana')), '150462616e010100200106006409070101');
  assert.equal(toHex(compressText('she sells sea shells by the sea shore')), '25107368652073656c6c730105026120010d030a066279207405170311046f7265');
  assert.equal(toHex(serialize([{ type: 'lit', byte: 1 }, { type: 'lit', byte: 2 }, { type: 'match', len: 4, dist: 2 }], 6)), '060201020301');
  assert.throws(() => compress([1, 2, 3]), TypeError);
});

test('decompress: fluxos válidos e ida e volta', () => {
  assert.equal(new TextDecoder().decode(decompress(fromHex('06046162630102'))), 'abcabc');
  assert.equal(new TextDecoder().decode(decompress(fromHex('0700610700'))), 'aaaaaaa');
  assert.deepEqual(decompress(fromHex('00')), new Uint8Array(0));
  const r = prng(5);
  for (let t = 0; t < 30; t++) {
    const n = 1 + (r() * 23) % 5000;
    const u = new Uint8Array(n);
    for (let k = 0; k < n; k++) u[k] = r() % (2 + (t % 6));
    assert.deepEqual(decompress(compress(u)), u);
  }
  for (const s of ['olá, olá, mundo! 🌍🌍🌍', 'x'.repeat(1000)]) assert.equal(decompressText(compressText(s)), s);
});

test('decompress: fluxos inválidos', () => {
  for (const bad of ['', '05', '0504616263', '04020102', '0601020061', '030200616263', '030061010000', '0400610501', '0300610300', '020061010000', '02006100', '01006100', '0180000061', '0102616263']) {
    assert.throws(() => decompress(fromHex(bad)), RangeError, bad);
  }
  assert.throws(() => decompress([0]), TypeError);
});

test('decodeTokens, formatTokens e stats', () => {
  assert.deepEqual(decodeTokens(fromHex('0700610700')), { length: 7, tokens: [{ type: 'lit', byte: 97 }, { type: 'match', len: 6, dist: 1 }] });
  const d = decodeTokens(compressText('abcabcXabcabcabc'));
  assert.equal(formatTokens(d.tokens), 'a b c <3,3> X <6,7> <3,3>');
  assert.equal(formatTokens([{ type: 'lit', byte: 0 }, { type: 'lit', byte: 0x7e }, { type: 'lit', byte: 0x7f }, { type: 'match', len: 3, dist: 9 }]), '\\x00 ~ \\x7f <3,9>');
  assert.deepEqual(stats(enc('banana bandana banana')), { literals: 5, matches: 4, copied: 16, compressedSize: 17 });
  assert.deepEqual(stats(enc('mississippi missouri mississippi')), { literals: 11, matches: 4, copied: 21, compressedSize: 23 });
  assert.deepEqual(stats(new Uint8Array(0)), { literals: 0, matches: 0, copied: 0, compressedSize: 1 });
});

test('hex e texto', () => {
  assert.deepEqual(fromHex('0A ff\n10'), Uint8Array.from([10, 255, 16]));
  assert.throws(() => fromHex('abc'), RangeError);
  assert.throws(() => fromHex('zz'), RangeError);
  assert.throws(() => fromHex(12), TypeError);
  assert.throws(() => compressText(12), TypeError);
  assert.equal(toHex(Uint8Array.from([0, 15, 255])), '000fff');
});
