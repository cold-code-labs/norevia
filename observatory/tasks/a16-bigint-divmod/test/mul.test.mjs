import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mul, pow, lcm, toString } from '../src/bignum.mjs';

let seed = 31337;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
function structured(limbs) {
  // muitos limbs 9999999, alguns zeros e alguns aleatórios
  let x = 0n;
  for (let j = 0; j < limbs; j++) {
    const r = rnd();
    x = x * 10000000n + BigInt(r < 0.7 ? 9999999 : r < 0.85 ? 0 : Math.floor(rnd() * 1e7));
  }
  return x === 0n ? 1n : x;
}

test('o módulo não usa BigInt nativo', () => {
  const src = fs.readFileSync(new URL('../src/bignum.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /BigInt\s*\(|\b\d+n\b|typeof\s+\w+\s*===\s*'bigint'/);
});

test('produtos grandes com longas sequências de 9', () => {
  const T = 10n;
  const pairs = [
    [T ** 168n + T ** 84n - 1n, T ** 168n - 1n],
    [T ** 200n + T ** 100n - 1n, T ** 210n - 1n],
    [T ** 175n + T ** 84n - 1n, T ** 180n - 1n],
    [T ** 400n - 1n, T ** 333n - 1n],
    [T ** 300n + 1n, T ** 300n - 1n],
  ];
  for (const [a, b] of pairs) {
    assert.equal(toString(mul(String(a), String(b))), String(a * b));
    assert.equal(toString(mul(String(-b), String(a))), String(-b * a));
  }
});

test('produtos grandes estruturados aleatórios', () => {
  for (let i = 0; i < 400; i++) {
    const a = structured(20 + Math.floor(rnd() * 50));
    const b = structured(20 + Math.floor(rnd() * 50));
    assert.equal(toString(mul(String(a), String(b))), String(a * b), `${a} * ${b}`);
  }
});

test('produtos grandes aleatórios e potências', () => {
  for (let i = 0; i < 60; i++) {
    let a = '';
    let b = '';
    const la = 1 + Math.floor(rnd() * 900);
    const lb = 1 + Math.floor(rnd() * 900);
    for (let k = 0; k < la; k++) a += k === 0 ? 1 + Math.floor(rnd() * 9) : Math.floor(rnd() * 10);
    for (let k = 0; k < lb; k++) b += k === 0 ? 1 + Math.floor(rnd() * 9) : Math.floor(rnd() * 10);
    assert.equal(toString(mul(a, b)), String(BigInt(a) * BigInt(b)));
  }
  assert.equal(toString(pow('9999999', 40)), String(9999999n ** 40n));
  assert.equal(toString(pow('2', 2000)), String(2n ** 2000n));
  assert.equal(toString(pow(String(10n ** 200n + 10n ** 100n - 1n), 3)), String((10n ** 200n + 10n ** 100n - 1n) ** 3n));
});

test('lcm de grandes coprimos', () => {
  const a = '1' + '0'.repeat(84) + '9'.repeat(84);
  const b = '9'.repeat(168);
  assert.equal(toString(lcm(a, b)), String(BigInt(a) * BigInt(b)));
  const c = String(10n ** 200n + 10n ** 100n - 1n);
  const d = String(10n ** 210n - 1n);
  assert.equal(toString(lcm(c, d)), String(BigInt(c) * BigInt(d)));
});
