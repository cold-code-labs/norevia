import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from '../src/config-kit/env.mjs';

test('pares simples, valores aparados', () => {
  assert.deepEqual(parseEnv('A=1\nB = hello world \n'), { A: '1', B: 'hello world' });
});
test('comentários, linhas em branco, export e CRLF', () => {
  assert.deepEqual(parseEnv('# c\n\n  export PORT=8080\r\nNAME=x\r\n'), { PORT: '8080', NAME: 'x' });
});
test("valor pode conter '='", () => {
  assert.deepEqual(parseEnv('URL=postgres://u:p@h/db?ssl=true&x=1\nEMPTY=\nK==v'), {
    URL: 'postgres://u:p@h/db?ssl=true&x=1', EMPTY: '', K: '=v',
  });
});
test('aspas duplas com escapes e aspas simples literais', () => {
  const env = parseEnv(['A="linha1\\nlinha2\\t\\"x\\""', "B='sem \\n escape'", 'C="tem # dentro"'].join('\n'));
  assert.equal(env.A, 'linha1\nlinha2\t"x"');
  assert.equal(env.B, 'sem \\n escape');
  assert.equal(env.C, 'tem # dentro');
});
test('comentário inline só após espaço', () => {
  assert.deepEqual(parseEnv('A=abc # comentario\nB=a#b'), { A: 'abc', B: 'a#b' });
});
test('última ocorrência vence', () => {
  assert.deepEqual(parseEnv('A=1\nA=2'), { A: '2' });
});
test('erros de sintaxe com número da linha', () => {
  assert.throws(() => parseEnv('INVALID LINE'), { name: 'SyntaxError', message: /line 1/ });
  assert.throws(() => parseEnv('OK=1\n1KEY=x'), { name: 'SyntaxError', message: /line 2/ });
  assert.throws(() => parseEnv('A="abc'), SyntaxError);
});
