/**
 * Valores monetários em unidades mínimas (centavos) inteiras, taxas de câmbio
 * decimais e rateio proporcional.
 */
const AMOUNT_RE = /^(-?)(\d{1,13})(?:\.(\d{1,2}))?$/;
const RATE_RE = /^(\d{1,9})(?:\.(\d{1,6}))?$/;

function assertMinor(value) {
  if (!Number.isSafeInteger(value)) throw new RangeError(`valor em centavos inválido: ${value}`);
  return value;
}

/** Texto decimal ("-12.5", "3", "0.07") → centavos inteiros. */
export function parseAmount(text) {
  if (typeof text !== 'string') throw new TypeError('valor deve ser string');
  const m = AMOUNT_RE.exec(text);
  if (!m) throw new RangeError(`valor inválido: ${JSON.stringify(text)}`);
  const [, sign, whole, frac = ''] = m;
  const abs = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  if (abs === 0) return 0;
  return sign ? -abs : abs;
}

/** Centavos → texto decimal com exatamente duas casas ("-0.05", "1234.50"). */
export function formatAmount(minor) {
  assertMinor(minor);
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const cents = String(abs % 100).padStart(2, '0');
  return `${minor < 0 ? '-' : ''}${whole}.${cents}`;
}

/** n / d arredondado para o inteiro mais próximo; empates vão para o par. */
export function roundDiv(n, d) {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d <= 0) {
    throw new RangeError(`roundDiv(${n}, ${d}): argumentos inválidos`);
  }
  let q = Math.trunc(n / d);
  const r = n - q * d;
  const twice = 2 * Math.abs(r);
  if (twice > d || (twice === d && q % 2 !== 0)) q += n < 0 ? -1 : 1;
  return q === 0 ? 0 : q;
}

/** Taxa decimal positiva ("5.4321") → fração { num, den } com den = 10^casas. */
export function parseRate(text) {
  if (typeof text !== 'string') throw new TypeError('taxa deve ser string');
  const m = RATE_RE.exec(text);
  if (!m) throw new RangeError(`taxa inválida: ${JSON.stringify(text)}`);
  const frac = m[2] ?? '';
  const num = Number(m[1] + frac);
  if (num === 0) throw new RangeError('taxa deve ser positiva');
  return { num, den: 10 ** frac.length };
}

/** Converte centavos pela taxa (texto ou fração), com arredondamento bancário. */
export function convert(minor, rate) {
  assertMinor(minor);
  const { num, den } = typeof rate === 'string' ? parseRate(rate) : rate;
  const product = minor * num;
  if (!Number.isSafeInteger(product)) throw new RangeError('estouro na conversão');
  return roundDiv(product, den);
}

/**
 * Rateia `total` centavos proporcionalmente a `weights` pelo método dos maiores
 * restos: cada parte recebe o piso da sua cota e as unidades que sobram vão, uma
 * a uma, para as maiores frações (empate → menor índice). Totais negativos são
 * rateados pelo valor absoluto e devolvidos com sinal trocado.
 */
export function allocate(total, weights) {
  assertMinor(total);
  if (!Array.isArray(weights) || weights.length === 0) throw new RangeError('pesos vazios');
  let sum = 0;
  for (const w of weights) {
    if (!Number.isSafeInteger(w) || w < 0) throw new RangeError(`peso inválido: ${w}`);
    sum += w;
  }
  if (sum === 0) throw new RangeError('soma dos pesos deve ser positiva');
  const sign = total < 0 ? -1 : 1;
  const abs = Math.abs(total);
  const parts = weights.map((w, i) => {
    const p = abs * w;
    return { i, base: Math.floor(p / sum), rem: p % sum };
  });
  const left = abs - parts.reduce((s, p) => s + p.base, 0);
  const order = [...parts].sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (let k = 0; k < left; k++) order[k].base += 1;
  return parts.map((p) => (p.base === 0 ? 0 : sign * p.base));
}
