import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchGlob, filterGlob, globToRegExp } from '../src/glob.mjs';

const yes = (p, s) => assert.equal(matchGlob(p, s), true, `${p} ~ ${s}`);
const no = (p, s) => assert.equal(matchGlob(p, s), false, `${p} !~ ${s}`);

test('* não atravessa /', () => {
  yes('*.js', 'a.js'); yes('*.js', 'x.min.js'); no('*.js', 'a/b.js'); yes('a*', 'a'); no('a*', 'ba');
  yes('a**b', 'axyb'); no('a**b', 'ax/yb');
});

test('? casa exatamente um caractere que não é /', () => {
  yes('a?c', 'abc'); no('a?c', 'a/c'); no('a?c', 'ac'); no('a?c', 'abbc');
});

test('classes, intervalos e negação', () => {
  yes('[abc].txt', 'b.txt'); no('[abc].txt', 'd.txt');
  yes('[a-c]x', 'bx'); no('[a-c]x', 'dx');
  yes('[!a-c]x', 'dx'); no('[!a-c]x', 'ax');
  no('a[!x]b', 'a/b'); yes('a[!x]b', 'a-b');
  yes('[]a]', ']'); yes('[]a]', 'a'); yes('[!]]x', 'ax'); no('[!]]x', ']x');
  yes('[ab', '[ab'); no('[ab', 'a');
});

test('escapes e caracteres especiais de regex são literais', () => {
  yes('\\*.js', '*.js'); no('\\*.js', 'a.js');
  yes('a+b(1).txt', 'a+b(1).txt'); no('a.b', 'axb'); yes('x$^|{y}', 'x$^|{y}');
});

test('arquivos ocultos exigem ponto literal no padrão', () => {
  no('*', '.env'); yes('.*', '.env'); no('?env', '.env'); no('[.]env', '.env');
  no('src/*/x', 'src/.git/x'); yes('src/.git/*', 'src/.git/config'); yes('\\.env', '.env');
  no('[!a]env', '.env');
});

test('** como segmento inteiro', () => {
  yes('src/**/*.js', 'src/a.js'); yes('src/**/*.js', 'src/a/b/c.js');
  no('src/**/*.js', 'src/.cache/a.js'); no('src/**/*.js', 'srcx/a.js');
  yes('a/**', 'a'); yes('a/**', 'a/b/c'); no('a/**', 'ab'); no('a/**', 'a/.x');
  yes('**', 'a/b'); no('**', '.a'); yes('**/x', 'x'); yes('**/x', 'p/q/x');
  yes('a/**/**/b', 'a/b'); yes('a/**/**/b', 'a/q/b');
});

test('filterGlob e erros', () => {
  assert.deepEqual(filterGlob('x[!y]z', ['x/z', 'xaz', 'xyz', 'xbz']), ['xaz', 'xbz']);
  assert.deepEqual(filterGlob('*.md', ['b.md', 'a.md', 'c.txt']), ['b.md', 'a.md']);
  assert.throws(() => globToRegExp(3), TypeError);
  assert.throws(() => matchGlob('*', null), TypeError);
});
