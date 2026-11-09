import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from '../src/env.mjs';

test('simple pairs, trimmed values', () => {
  assert.deepEqual(parseEnv('A=1\nB = hello world \n'), { A: '1', B: 'hello world' });
});
test('comments, blank lines, export and CRLF', () => {
  assert.deepEqual(parseEnv('# c\n\n  export PORT=8080\r\nNAME=x\r\n'), { PORT: '8080', NAME: 'x' });
});
test("value may contain '='", () => {
  assert.deepEqual(parseEnv('URL=postgres://u:p@h/db?ssl=true&x=1\nEMPTY=\nK==v'), {
    URL: 'postgres://u:p@h/db?ssl=true&x=1', EMPTY: '', K: '=v',
  });
});
test('double quotes with escapes and literal single quotes', () => {
  const env = parseEnv(['A="linha1\\nlinha2\\t\\"x\\""', "B='sem \\n escape'", 'C="tem # dentro"'].join('\n'));
  assert.equal(env.A, 'linha1\nlinha2\t"x"');
  assert.equal(env.B, 'sem \\n escape');
  assert.equal(env.C, 'tem # dentro');
});
test('inline comment only after a space', () => {
  assert.deepEqual(parseEnv('A=abc # comentario\nB=a#b'), { A: 'abc', B: 'a#b' });
});
test('last occurrence wins', () => {
  assert.deepEqual(parseEnv('A=1\nA=2'), { A: '2' });
});
test('syntax errors with line number', () => {
  assert.throws(() => parseEnv('INVALID LINE'), { name: 'SyntaxError', message: /line 1/ });
  assert.throws(() => parseEnv('OK=1\n1KEY=x'), { name: 'SyntaxError', message: /line 2/ });
  assert.throws(() => parseEnv('A="abc'), SyntaxError);
});
