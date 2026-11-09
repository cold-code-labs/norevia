import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Fraction, parse, approximate } from '../src/fraction.mjs';

function brute(N, D, M) {
  // menor distância; empate → menor denominador
  let best = null;
  for (let q = 1n; q <= M; q++) {
    const base = (N * q - ((N * q) % D + D) % D) / D;
    for (const p of [base, base + 1n]) {
      const e = (N * q - p * D < 0n ? p * D - N * q : N * q - p * D);
      if (!best || e * best.q < best.e * q) best = { p, q, e };
    }
  }
  return new Fraction(best.p, best.q).toString();
}

test('exemplos do enunciado', () => {
  const rows = [['3.141592653589793', 1000, '355/113'], ['3.141592653589793', 100, '311/99'], ['3.141592653589793', 106, '333/106'], ['-3.141592653589793', 1000, '-355/113'], ['3.141592653589793', 7, '22/7'], ['3.141592653589793', 1, '3'], ['1.4142135623730951', 1000, '1393/985'], ['2.718281828459045', 1000, '1457/536'], ['0.3', 2, '1/2'], ['1/6', 3, '0'], ['-1/6', 3, '0'], ['0.75', 3, '2/3'], ['5/7', 7, '5/7'], ['2/17', 13, '1/9'], ['9/13', 7, '5/7']];
  for (const [s, m, want] of rows) assert.equal(approximate(s, m).toString(), want, `${s} ${m}`);
});

test('mais exemplos com semiconvergentes', () => {
  const rows = [['-12/7', 4, '-7/4'], ['-2/9', 6, '-1/5'], ['13/11', 7, '7/6'], ['15/13', 12, '8/7'], ['-7/16', 15, '-4/9'], ['32/17', 14, '17/9'], ['-3/19', 15, '-2/13'], ['0.1176470588', 13, '1/9']];
  for (const [s, m, want] of rows) assert.equal(approximate(s, m).toString(), want, `${s} ${m}`);
});

test('devolve a própria fração quando o denominador cabe; argumentos inválidos', () => {
  const x = parse('5/7');
  assert.equal(x.limitDenominator(7), x);
  assert.equal(x.limitDenominator(7n).toString(), '5/7');
  assert.throws(() => x.limitDenominator(0), RangeError);
  assert.throws(() => x.limitDenominator(2.5), RangeError);
  assert.throws(() => x.limitDenominator('3'), RangeError);
});

test('varredura exaustiva contra busca direta', () => {
  for (let D = 2n; D <= 36n; D++) {
    for (let N = -2n * D; N <= 2n * D; N++) {
      const x = new Fraction(N, D);
      if (x.den !== D) continue;
      for (let M = 1n; M < D; M++) assert.equal(x.limitDenominator(M).toString(), brute(N, D, M), `${N}/${D} M=${M}`);
    }
  }
});

test('valores grandes', () => {
  const x = parse('0.57721566490153286060651209008240243');
  for (const m of [10n, 1000n, 123456n, 10n ** 9n]) {
    const r = x.limitDenominator(m);
    assert.ok(r.den <= m);
  }
  assert.equal(x.limitDenominator(1000n).toString(), '228/395');
  assert.equal(parse('2.718281828459045').limitDenominator(30).toString(), '68/25');
});
