import { test } from 'node:test';
import assert from 'node:assert/strict';
import { divmod, quotRem, div, mod, toString } from '../src/bignum.mjs';

let seed = 777;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
function rdigits(n) {
  let t = String(1 + Math.floor(rnd() * 9));
  for (let i = 1; i < n; i++) t += rnd() < 0.3 ? '0' : String(Math.floor(rnd() * 10));
  return t;
}
const sgn = (t) => (rnd() < 0.5 ? '-' + t : t);
const floorDM = (a, b) => {
  let q = a / b;
  let r = a % b;
  if (r !== 0n && (r < 0n) !== (b < 0n)) { q -= 1n; r += b; }
  return [String(q), String(r)];
};
const S = (p) => p.map(toString);

test('sinais: piso e truncamento', () => {
  assert.deepEqual(S(divmod('7', '2')), ['3', '1']);
  assert.deepEqual(S(divmod('-7', '2')), ['-4', '1']);
  assert.deepEqual(S(divmod('7', '-2')), ['-4', '-1']);
  assert.deepEqual(S(divmod('-7', '-2')), ['3', '-1']);
  assert.deepEqual(S(divmod('-8', '2')), ['-4', '0']);
  assert.deepEqual(S(quotRem('-7', '2')), ['-3', '-1']);
  assert.deepEqual(S(quotRem('7', '-2')), ['-3', '1']);
  assert.deepEqual(S(divmod('0', '-5')), ['0', '0']);
  assert.deepEqual(S(divmod('3', '100000000000000000000')), ['0', '3']);
  assert.deepEqual(S(divmod('-3', '100000000000000000000')), ['-1', '99999999999999999997']);
  assert.throws(() => divmod('1', '0'), RangeError);
  assert.throws(() => quotRem('1', '-0'), RangeError);
});

test('exemplos do enunciado', () => {
  assert.deepEqual(S(divmod('123456789012345678901234567890', '-9876543210')), ['-12499999887343749991', '-8314043220']);
  assert.deepEqual(S(divmod('-100000000000000000000', '30000001')), ['-3333333222223', '23222223']);
});

test('dividir por si mesmo e divisões exatas', () => {
  for (const x of ['12345678', '99999999999999', '10000000000000', '123456789012345678901', '-98765432109876']) {
    assert.equal(toString(div(x, x)), '1', x);
    assert.equal(toString(mod(x, x)), '0', x);
  }
  assert.deepEqual(S(divmod('1219326311370217952237463801111263526900', '12345678901234567890')), ['98765432109876543210', '0']);
  assert.deepEqual(S(divmod('121932631137021795226185032733622923332237463801111263526900', '98765432109876')), ['1234567890123463579149629482823284104883440387', '24636183564888']);
});

test('divisões exatas aleatórias (divisor de 2 a 5 limbs)', () => {
  for (let i = 0; i < 600; i++) {
    const b = sgn(rdigits(8 + Math.floor(rnd() * 28)));
    const q = sgn(rdigits(1 + Math.floor(rnd() * 40)));
    const a = String(BigInt(b) * BigInt(q));
    assert.deepEqual(S(divmod(a, b)), floorDM(BigInt(a), BigInt(b)), `${a} / ${b}`);
    assert.deepEqual(S(quotRem(a, b)), [String(BigInt(a) / BigInt(b)), String(BigInt(a) % BigInt(b))], `${a} quotRem ${b}`);
  }
});

test('restos parciais nulos no meio da divisão', () => {
  for (let i = 0; i < 300; i++) {
    const b = rdigits(8 + Math.floor(rnd() * 20));
    const B = BigInt(b);
    const k = BigInt(1 + Math.floor(rnd() * 30));
    const c = BigInt(Math.floor(rnd() * 1e9)) % B;
    const A = B * BigInt(rdigits(1 + Math.floor(rnd() * 6))) * 10n ** k + c;
    assert.deepEqual(S(divmod(String(A), b)), floorDM(A, B), `${A} / ${b}`);
    assert.deepEqual(S(divmod(String(-A), b)), floorDM(-A, B), `${-A} / ${b}`);
  }
});

test('divisões aleatórias contra BigInt', () => {
  for (let i = 0; i < 3000; i++) {
    const a = sgn(rdigits(1 + Math.floor(rnd() * 70)));
    const b = sgn(rdigits(1 + Math.floor(rnd() * 35)));
    assert.deepEqual(S(divmod(a, b)), floorDM(BigInt(a), BigInt(b)), `${a} / ${b}`);
    assert.equal(toString(div(a, b)), floorDM(BigInt(a), BigInt(b))[0]);
    assert.equal(toString(mod(a, b)), floorDM(BigInt(a), BigInt(b))[1]);
  }
});
