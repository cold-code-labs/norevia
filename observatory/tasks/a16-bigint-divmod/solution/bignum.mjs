/**
 * Inteiros com sinal de precisão arbitrária, sem BigInt nativo.
 * Magnitude em "limbs" little-endian na base 10^7 (cada limb é um inteiro 0..9_999_999),
 * sem limbs zero no topo; zero é { sign: 0, limbs: [] }.
 */

const BASE = 10_000_000;
const BASE_DIGITS = 7;
const KARATSUBA_MIN = 24;

export class BigNum {
  constructor(sign, limbs) {
    this.sign = limbs.length === 0 ? 0 : sign;
    this.limbs = limbs;
    Object.freeze(this.limbs);
    Object.freeze(this);
  }

  toString() {
    if (this.sign === 0) return '0';
    const l = this.limbs;
    let s = String(l[l.length - 1]);
    for (let i = l.length - 2; i >= 0; i--) s += String(l[i]).padStart(BASE_DIGITS, '0');
    return this.sign < 0 ? '-' + s : s;
  }
}

const ZERO = new BigNum(0, []);
const ONE = new BigNum(1, [1]);

function trim(limbs) {
  let n = limbs.length;
  while (n > 0 && limbs[n - 1] === 0) n--;
  if (n !== limbs.length) limbs.length = n;
  return limbs;
}

function make(sign, limbs) {
  return new BigNum(sign, trim(limbs));
}

// ---------------------------------------------------------------- conversão

export function parse(text) {
  if (typeof text !== 'string') throw new TypeError('parse espera string');
  const m = /^([+-]?)(\d+)$/.exec(text);
  if (!m) throw new RangeError(`inteiro inválido: ${JSON.stringify(text)}`);
  const digits = m[2];
  const limbs = [];
  for (let end = digits.length; end > 0; end -= BASE_DIGITS) {
    const start = Math.max(0, end - BASE_DIGITS);
    limbs.push(Number(digits.slice(start, end)));
  }
  return make(m[1] === '-' ? -1 : 1, limbs);
}

export function fromNumber(n) {
  if (typeof n !== 'number') throw new TypeError('fromNumber espera number');
  if (!Number.isSafeInteger(n)) throw new RangeError(`não é inteiro seguro: ${n}`);
  const sign = n < 0 ? -1 : 1;
  let a = Math.abs(n);
  const limbs = [];
  while (a > 0) {
    limbs.push(a % BASE);
    a = Math.floor(a / BASE);
  }
  return make(sign, limbs);
}

export function from(x) {
  if (x instanceof BigNum) return x;
  if (typeof x === 'string') return parse(x);
  if (typeof x === 'number') return fromNumber(x);
  throw new TypeError('operando inválido');
}

export function toString(x) {
  return from(x).toString();
}

export function toNumber(x) {
  const a = from(x);
  if (a.limbs.length > 3) throw new RangeError('fora do intervalo seguro');
  let v = 0;
  for (let i = a.limbs.length - 1; i >= 0; i--) v = v * BASE + a.limbs[i];
  if (v > Number.MAX_SAFE_INTEGER) throw new RangeError('fora do intervalo seguro');
  return a.sign < 0 ? -v : v;
}

// ---------------------------------------------------------------- magnitudes

function cmpMag(a, b) {
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  for (let i = a.length - 1; i >= 0; i--) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

function addMag(a, b) {
  if (a.length < b.length) [a, b] = [b, a];
  const out = new Array(a.length + 1);
  let carry = 0;
  for (let i = 0; i < a.length; i++) {
    const s = a[i] + (i < b.length ? b[i] : 0) + carry;
    if (s >= BASE) {
      out[i] = s - BASE;
      carry = 1;
    } else {
      out[i] = s;
      carry = 0;
    }
  }
  out[a.length] = carry;
  return trim(out);
}

/** a - b, exige |a| >= |b|. */
function subMag(a, b) {
  const out = new Array(a.length);
  let borrow = 0;
  for (let i = 0; i < a.length; i++) {
    let t = a[i] - (i < b.length ? b[i] : 0) - borrow;
    if (t < 0) {
      t += BASE;
      borrow = 1;
    } else {
      borrow = 0;
    }
    out[i] = t;
  }
  return trim(out);
}

function mulSmall(a, k) {
  const out = new Array(a.length + 1);
  let carry = 0;
  for (let i = 0; i < a.length; i++) {
    const p = a[i] * k + carry;
    carry = Math.floor(p / BASE);
    out[i] = p - carry * BASE;
  }
  out[a.length] = carry;
  return trim(out);
}

function schoolMul(a, b) {
  if (a.length === 0 || b.length === 0) return [];
  const out = new Array(a.length + b.length).fill(0);
  for (let i = 0; i < a.length; i++) {
    let carry = 0;
    const ai = a[i];
    if (ai === 0) continue;
    for (let j = 0; j < b.length; j++) {
      const t = out[i + j] + ai * b[j] + carry;
      carry = Math.floor(t / BASE);
      out[i + j] = t - carry * BASE;
    }
    let k = i + b.length;
    while (carry > 0) {
      const t = out[k] + carry;
      carry = Math.floor(t / BASE);
      out[k] = t - carry * BASE;
      k++;
    }
  }
  return trim(out);
}

/** out[shift..] += x, propagando o vai-um. */
function addShiftedInPlace(out, x, shift) {
  let carry = 0;
  let i = 0;
  for (; i < x.length; i++) {
    const s = out[i + shift] + x[i] + carry;
    if (s >= BASE) {
      out[i + shift] = s - BASE;
      carry = 1;
    } else {
      out[i + shift] = s;
      carry = 0;
    }
  }
  for (let k = i + shift; carry > 0; k++) {
    const s = out[k] + carry;
    if (s >= BASE) {
      out[k] = s - BASE;
    } else {
      out[k] = s;
      carry = 0;
    }
  }
}

/** Karatsuba acima do limiar; schoolbook abaixo. */
function mulMag(a, b) {
  if (Math.min(a.length, b.length) < KARATSUBA_MIN) return schoolMul(a, b);
  const m = Math.floor(Math.max(a.length, b.length) / 2);
  const a0 = trim(a.slice(0, m));
  const a1 = a.slice(m);
  const b0 = trim(b.slice(0, m));
  const b1 = b.slice(m);
  const z0 = mulMag(a0, b0);
  const z2 = mulMag(a1, b1);
  const z1 = subMag(subMag(mulMag(addMag(a0, a1), addMag(b0, b1)), z0), z2);
  const out = new Array(a.length + b.length + 1).fill(0);
  for (let i = 0; i < z0.length; i++) out[i] = z0[i];
  for (let i = 0; i < z2.length; i++) out[i + 2 * m] = z2[i];
  addShiftedInPlace(out, z1, m);
  return trim(out);
}

/** Divide magnitude por um limb (0 < d < BASE): [quociente, resto numérico]. */
function divSmall(a, d) {
  const q = new Array(a.length);
  let r = 0;
  for (let i = a.length - 1; i >= 0; i--) {
    const cur = r * BASE + a[i];
    q[i] = Math.floor(cur / d);
    r = cur - q[i] * d;
  }
  return [trim(q), r];
}

/** Divisão de magnitudes (Knuth, vol. 2, 4.3.1, algoritmo D): [quociente, resto]. */
function divModMag(u, v) {
  if (cmpMag(u, v) < 0) return [[], u.slice()];
  if (v.length === 1) {
    const [q, r] = divSmall(u, v[0]);
    return [q, r === 0 ? [] : [r]];
  }
  const n = v.length;
  const m = u.length - n;
  const d = Math.floor(BASE / (v[n - 1] + 1));
  const un = mulSmall(u, d);
  while (un.length < u.length + 1) un.push(0);
  const vn = mulSmall(v, d);
  const vTop = vn[n - 1];
  const vNext = vn[n - 2];
  const q = new Array(m + 1).fill(0);

  for (let j = m; j >= 0; j--) {
    const num = un[j + n] * BASE + un[j + n - 1];
    let qhat = Math.floor(num / vTop);
    let rhat = num - qhat * vTop;
    while (qhat >= BASE || qhat * vNext > rhat * BASE + un[j + n - 2]) {
      qhat--;
      rhat += vTop;
      if (rhat >= BASE) break;
    }

    let carry = 0;
    let borrow = 0;
    for (let i = 0; i < n; i++) {
      const p = qhat * vn[i] + carry;
      carry = Math.floor(p / BASE);
      let t = un[i + j] - (p - carry * BASE) - borrow;
      if (t < 0) {
        t += BASE;
        borrow = 1;
      } else {
        borrow = 0;
      }
      un[i + j] = t;
    }
    const top = un[j + n] - carry - borrow;

    if (top < 0) {
      qhat--;
      let c = 0;
      for (let i = 0; i < n; i++) {
        const s = un[i + j] + vn[i] + c;
        if (s >= BASE) {
          un[i + j] = s - BASE;
          c = 1;
        } else {
          un[i + j] = s;
          c = 0;
        }
      }
      un[j + n] = top + c;
    } else {
      un[j + n] = top;
    }
    q[j] = qhat;
  }

  const [r] = divSmall(trim(un.slice(0, n)), d);
  return [trim(q), r];
}

// ---------------------------------------------------------------- operações

export function compare(a, b) {
  const x = from(a);
  const y = from(b);
  if (x.sign !== y.sign) return x.sign < y.sign ? -1 : 1;
  const c = cmpMag(x.limbs, y.limbs);
  return x.sign < 0 ? -c : c;
}

export function equals(a, b) {
  return compare(a, b) === 0;
}

export function neg(a) {
  const x = from(a);
  return new BigNum(-x.sign, x.limbs);
}

export function abs(a) {
  const x = from(a);
  return x.sign < 0 ? new BigNum(1, x.limbs) : x;
}

export function sign(a) {
  return from(a).sign;
}

function addSigned(x, y) {
  if (x.sign === 0) return y;
  if (y.sign === 0) return x;
  if (x.sign === y.sign) return make(x.sign, addMag(x.limbs, y.limbs));
  const c = cmpMag(x.limbs, y.limbs);
  if (c === 0) return ZERO;
  return c > 0 ? make(x.sign, subMag(x.limbs, y.limbs)) : make(y.sign, subMag(y.limbs, x.limbs));
}

export function add(a, b) {
  return addSigned(from(a), from(b));
}

export function sub(a, b) {
  const y = from(b);
  return addSigned(from(a), new BigNum(-y.sign, y.limbs));
}

export function mul(a, b) {
  const x = from(a);
  const y = from(b);
  if (x.sign === 0 || y.sign === 0) return ZERO;
  return make(x.sign * y.sign, mulMag(x.limbs, y.limbs));
}

/** Divisão truncada (quociente arredondado para zero; resto com o sinal do dividendo). */
export function quotRem(a, b) {
  const x = from(a);
  const y = from(b);
  if (y.sign === 0) throw new RangeError('divisão por zero');
  const [q, r] = divModMag(x.limbs, y.limbs);
  return [make(x.sign * y.sign, q), make(x.sign, r)];
}

/** Divisão com piso (quociente arredondado para -infinito; resto com o sinal do divisor). */
export function divmod(a, b) {
  const x = from(a);
  const y = from(b);
  let [q, r] = quotRem(x, y);
  if (r.sign !== 0 && r.sign !== y.sign) {
    q = sub(q, ONE);
    r = add(r, y);
  }
  return [q, r];
}

export function div(a, b) {
  return divmod(a, b)[0];
}

export function mod(a, b) {
  return divmod(a, b)[1];
}

export function pow(a, e) {
  const x = from(a);
  if (!Number.isSafeInteger(e) || e < 0) throw new RangeError(`expoente inválido: ${e}`);
  let result = ONE;
  let base = x;
  let k = e;
  while (k > 0) {
    if (k % 2 === 1) result = mul(result, base);
    k = Math.floor(k / 2);
    if (k > 0) base = mul(base, base);
  }
  return result;
}

export function gcd(a, b) {
  let x = abs(a);
  let y = abs(b);
  while (y.sign !== 0) {
    const r = mod(x, y);
    x = y;
    y = r;
  }
  return x;
}

export function lcm(a, b) {
  const x = abs(a);
  const y = abs(b);
  if (x.sign === 0 || y.sign === 0) return ZERO;
  return mul(div(x, gcd(x, y)), y);
}

/** Raiz quadrada inteira (piso) por Newton. */
export function isqrt(a) {
  const n = from(a);
  if (n.sign < 0) throw new RangeError('isqrt de negativo');
  if (n.sign === 0) return ZERO;
  let x = pow(fromNumber(10), Math.ceil(n.toString().length / 2));
  for (;;) {
    const y = div(add(x, div(n, x)), 2);
    if (compare(y, x) >= 0) return x;
    x = y;
  }
}

/** base^exp mod m, com m > 0 e exp >= 0; resultado em [0, m). */
export function modPow(b, e, m) {
  const base0 = from(b);
  let exp = from(e);
  const md = from(m);
  if (md.sign <= 0) throw new RangeError('módulo deve ser positivo');
  if (exp.sign < 0) throw new RangeError('expoente negativo');
  let result = mod(ONE, md);
  let base = mod(base0, md);
  const TWO = fromNumber(2);
  while (exp.sign !== 0) {
    const [q, r] = divmod(exp, TWO);
    if (r.sign !== 0) result = mod(mul(result, base), md);
    exp = q;
    if (exp.sign !== 0) base = mod(mul(base, base), md);
  }
  return result;
}
