/**
 * Números racionais exatos sobre BigInt. Toda instância está normalizada:
 * gcd(|num|, den) = 1 e den > 0 (o zero é 0/1).
 */

function toBigIntStrict(x, what) {
  if (typeof x === 'bigint') return x;
  if (typeof x === 'number') {
    if (!Number.isSafeInteger(x)) throw new RangeError(`${what}: inteiro inválido ${x}`);
    return BigInt(x);
  }
  throw new TypeError(`${what}: esperado bigint ou number`);
}

function gcd(a, b) {
  if (a < 0n) a = -a;
  if (b < 0n) b = -b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function floorDiv(a, b) {
  const q = a / b;
  return a % b !== 0n && (a < 0n) !== (b < 0n) ? q - 1n : q;
}

function absBig(a) {
  return a < 0n ? -a : a;
}

const DECIMAL_RE = /^([+-]?)(\d+\.?\d*|\.\d+)(?:[eE]([+-]?\d+))?$/;
const RATIO_RE = /^([+-]?\d+)\/(\d+)$/;

export class Fraction {
  constructor(num, den = 1n) {
    let n = toBigIntStrict(num, 'numerador');
    let d = toBigIntStrict(den, 'denominador');
    if (d === 0n) throw new RangeError('denominador zero');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    if (g > 1n) {
      n /= g;
      d /= g;
    }
    this.num = n;
    this.den = d;
    Object.freeze(this);
  }

  static from(x) {
    if (x instanceof Fraction) return x;
    if (typeof x === 'string') return parse(x);
    return new Fraction(toBigIntStrict(x, 'operando'), 1n);
  }

  // ------------------------------------------------------------ aritmética

  add(other) {
    const o = Fraction.from(other);
    return new Fraction(this.num * o.den + o.num * this.den, this.den * o.den);
  }

  sub(other) {
    const o = Fraction.from(other);
    return new Fraction(this.num * o.den - o.num * this.den, this.den * o.den);
  }

  mul(other) {
    const o = Fraction.from(other);
    return new Fraction(this.num * o.num, this.den * o.den);
  }

  div(other) {
    const o = Fraction.from(other);
    if (o.num === 0n) throw new RangeError('divisão por zero');
    return new Fraction(this.num * o.den, this.den * o.num);
  }

  neg() {
    return new Fraction(-this.num, this.den);
  }

  abs() {
    return this.num < 0n ? this.neg() : this;
  }

  inv() {
    if (this.num === 0n) throw new RangeError('inverso de zero');
    return new Fraction(this.den, this.num);
  }

  pow(k) {
    const e = toBigIntStrict(k, 'expoente');
    if (e >= 0n) return new Fraction(this.num ** e, this.den ** e);
    if (this.num === 0n) throw new RangeError('zero elevado a expoente negativo');
    return new Fraction(this.den ** -e, this.num ** -e);
  }

  // ------------------------------------------------------------ comparação

  compare(other) {
    const o = Fraction.from(other);
    const l = this.num * o.den;
    const r = o.num * this.den;
    return l < r ? -1 : l > r ? 1 : 0;
  }

  equals(other) {
    return this.compare(other) === 0;
  }

  sign() {
    return this.num < 0n ? -1 : this.num > 0n ? 1 : 0;
  }

  // ------------------------------------------------------------ arredondamento

  floor() {
    return floorDiv(this.num, this.den);
  }

  ceil() {
    return -floorDiv(-this.num, this.den);
  }

  trunc() {
    return this.num / this.den;
  }

  /** Inteiro mais próximo; empates vão para o par. */
  round() {
    const q = floorDiv(this.num, this.den);
    const r2 = 2n * (this.num - q * this.den);
    if (r2 > this.den) return q + 1n;
    if (r2 < this.den) return q;
    return q % 2n === 0n ? q : q + 1n;
  }

  // ------------------------------------------------------------ formatação

  toString() {
    return this.den === 1n ? String(this.num) : `${this.num}/${this.den}`;
  }

  toFixed(digits) {
    if (!Number.isInteger(digits) || digits < 0 || digits > 100) throw new RangeError(`casas inválidas: ${digits}`);
    const scale = 10n ** BigInt(digits);
    const q = new Fraction(this.num * scale, this.den).round();
    const neg = q < 0n;
    let s = String(absBig(q));
    if (digits > 0) {
      s = s.padStart(digits + 1, '0');
      s = s.slice(0, s.length - digits) + '.' + s.slice(s.length - digits);
    }
    return neg ? '-' + s : s;
  }

  /** Expansão decimal exata; a parte periódica vai entre parênteses. */
  toRepeating() {
    const n = absBig(this.num);
    const d = this.den;
    const intPart = n / d;
    let rem = n % d;
    const sign = this.num < 0n ? '-' : '';
    if (rem === 0n) return sign + String(intPart);
    const digits = [];
    const seen = new Map();
    while (rem !== 0n && !seen.has(rem)) {
      seen.set(rem, digits.length);
      rem *= 10n;
      digits.push(String(rem / d));
      rem %= d;
    }
    let frac;
    if (rem === 0n) {
      frac = digits.join('');
    } else {
      const start = seen.get(rem);
      frac = digits.slice(0, start).join('') + '(' + digits.slice(start).join('') + ')';
    }
    return `${sign}${intPart}.${frac}`;
  }

  // ------------------------------------------------------------ aproximação

  /**
   * Fração mais próxima com denominador <= maxDen (empate: menor denominador).
   * Usa a expansão em frações contínuas: o resultado é o último convergente
   * admissível ou o melhor semiconvergente seguinte.
   */
  limitDenominator(maxDen) {
    let M;
    try {
      M = toBigIntStrict(maxDen, 'maxDen');
    } catch {
      throw new RangeError(`maxDen inválido: ${String(maxDen)}`);
    }
    if (M < 1n) throw new RangeError(`maxDen inválido: ${M}`);
    if (this.den <= M) return this;

    let p0 = 0n;
    let q0 = 1n;
    let p1 = 1n;
    let q1 = 0n;
    let n = this.num;
    let d = this.den;
    let a = 0n;
    for (;;) {
      const t = floorDiv(n, d);
      const q2 = q0 + t * q1;
      if (q2 > M) break;
      a = t;
      [p0, q0, p1, q1] = [p1, q1, p0 + t * p1, q2];
      [n, d] = [d, n - t * d];
    }

    const convergent = new Fraction(p1, q1);
    const k = (M - q0) / q1;
    if (2n * k < a) return convergent;
    const semi = new Fraction(p0 + k * p1, q0 + k * q1);
    const c = this.sub(semi).abs().compare(this.sub(convergent).abs());
    if (c < 0) return semi;
    if (c > 0) return convergent;
    return semi.den < convergent.den ? semi : convergent;
  }
}

export function parse(text) {
  if (typeof text !== 'string') throw new TypeError('parse espera string');
  let m = RATIO_RE.exec(text);
  if (m) {
    const den = BigInt(m[2]);
    if (den === 0n) throw new RangeError('denominador zero');
    return new Fraction(BigInt(m[1]), den);
  }
  m = DECIMAL_RE.exec(text);
  if (!m) throw new RangeError(`número inválido: ${JSON.stringify(text)}`);
  const [intDigits, fracDigits = ''] = m[2].split('.');
  const exp = m[3] === undefined ? 0 : Number(m[3]);
  if (!Number.isSafeInteger(exp) || Math.abs(exp) > 10000) throw new RangeError('expoente fora do intervalo');
  let num = BigInt((intDigits || '0') + fracDigits);
  if (m[1] === '-') num = -num;
  const shift = exp - fracDigits.length;
  return shift >= 0 ? new Fraction(num * 10n ** BigInt(shift), 1n) : new Fraction(num, 10n ** BigInt(-shift));
}

export function fraction(num, den = 1n) {
  return new Fraction(num, den);
}

/** Converte um texto decimal ou 'a/b' para a fração mais próxima com denominador <= maxDen. */
export function approximate(text, maxDen) {
  return parse(text).limitDenominator(maxDen);
}

/** Converte um `number` finito na fração exatamente igual ao valor binário dele. */
export function fromNumber(x) {
  if (typeof x !== 'number') throw new TypeError('fromNumber espera number');
  if (!Number.isFinite(x)) throw new RangeError('fromNumber espera número finito');
  if (Number.isInteger(x)) return new Fraction(BigInt(x), 1n);
  let den = 1n;
  let v = x;
  while (!Number.isInteger(v)) {
    v *= 2;
    den *= 2n;
  }
  return new Fraction(BigInt(v), den);
}
