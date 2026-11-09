import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIni, getIni } from '../src/cli-kit/ini.mjs';

test('chaves na raiz e em seções', () => {
  assert.deepEqual(parseIni('name = app\n[server]\nport = 8080\nhost=localhost\n'), {
    name: 'app', server: { port: '8080', host: 'localhost' },
  });
  assert.deepEqual(parseIni(''), {});
});

test('comentários só no início da linha', () => {
  const ini = '; c1\n   # c2\n\nurl = http://x/#frag ; não é comentário\n';
  assert.deepEqual(parseIni(ini), { url: 'http://x/#frag ; não é comentário' });
});

test('divisão no primeiro =, trim e valor vazio', () => {
  assert.deepEqual(parseIni('  expr =  a = b  \nempty =\na.b = 1\n'), { expr: 'a = b', empty: '', 'a.b': '1' });
});

test('valores entre aspas', () => {
  const ini = [
    'pad = "  x  "',
    'q = "diz \\"oi\\""',
    'path = "C:\\\\dir\\\\"',
    'other = "a\\nb"',
    'half = "abc',
    'one = "',
  ].join('\n');
  assert.deepEqual(parseIni(ini), {
    pad: '  x  ', q: 'diz "oi"', path: 'C:\\dir\\', other: 'a\\nb', half: '"abc', one: '"',
  });
});

test('seções pontuadas e seções repetidas são mescladas', () => {
  assert.deepEqual(parseIni('[a]\nx=1\n[ a . b ]\ny=2\n[a]\nz=3\n'), { a: { x: '1', b: { y: '2' }, z: '3' } });
  assert.deepEqual(parseIni('[a.b]\ny=2\n[a]\nx=1\n[a.b]\nw=4\n'), { a: { b: { y: '2', w: '4' }, x: '1' } });
});

test('chave duplicada: a última vence; CRLF', () => {
  assert.deepEqual(parseIni('a=1\r\n[s]\r\nk = v1\r\nk = v2\r\na=2\r\n'), { a: '1', s: { k: 'v2', a: '2' } });
});

test('erros com número da linha', () => {
  assert.throws(() => parseIni('[a\n'), { name: 'SyntaxError', message: /linha 1/ });
  assert.throws(() => parseIni('x=1\njunk\n'), { name: 'SyntaxError', message: /linha 2/ });
  assert.throws(() => parseIni('= v'), SyntaxError);
  assert.throws(() => parseIni('[]'), SyntaxError);
  assert.throws(() => parseIni('[a..b]'), SyntaxError);
  assert.throws(() => parseIni('[a]\nb=1\n[a.b]\n'), { name: 'SyntaxError', message: /linha 3/ });
  assert.throws(() => parseIni('[a.b]\n[a]\nb=1\n'), { name: 'SyntaxError', message: /linha 3/ });
  assert.throws(() => parseIni(null), TypeError);
});

test('getIni', () => {
  const data = parseIni('top=1\n[a.b]\nc = x\n');
  assert.equal(getIni(data, 'a.b.c'), 'x');
  assert.equal(getIni(data, 'top'), '1');
  assert.equal(getIni(data, 'a.z', 'def'), 'def');
  assert.equal(getIni(data, 'top.x', 'def'), 'def');
  assert.equal(getIni(data, 'toString', null), null);
});
