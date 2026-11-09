import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandBraces, compile, makeMatcher, isMatch, filter, escapeGlob, hasMagic } from '../src/glob.mjs';

test('expandBraces: exemplos do contrato', () => {
  assert.deepEqual(expandBraces('a{b,c}d{e,f}'), ['abde', 'abdf', 'acde', 'acdf']);
  assert.deepEqual(expandBraces('{a,{b,c}d}x'), ['ax', 'bdx', 'cdx']);
  assert.deepEqual(expandBraces('a{,b}'), ['a', 'ab']);
  assert.deepEqual(expandBraces('{a}{b,c}'), ['{a}b', '{a}c']);
  assert.deepEqual(expandBraces('{a,{b}'), ['{a,{b}']);
  assert.deepEqual(expandBraces('{a,b}}'), ['a}', 'b}']);
  assert.deepEqual(expandBraces('\\{a,b}'), ['\\{a,b}']);
  assert.deepEqual(expandBraces('{a\\,b,c}'), ['a\\,b', 'c']);
  assert.deepEqual(expandBraces('{x,x}'), ['x', 'x']);
  assert.deepEqual(expandBraces('[{a,b}]'), ['[a]', '[b]']);
  assert.deepEqual(expandBraces(''), ['']);
  assert.throws(() => expandBraces(3), TypeError);
});

test('curingas de segmento', () => {
  assert.equal(isMatch('abc', 'a*c'), true);
  assert.equal(isMatch('ac', 'a*c'), true);
  assert.equal(isMatch('abcbd', 'a*b?'), true);
  assert.equal(isMatch('abcbdx', 'a*b?'), false);
  assert.equal(isMatch('aaa', 'a**a'), true);
  assert.equal(isMatch('mississippi', '*ss*ss*'), true);
  assert.equal(isMatch('mississippi', '*ss*ss*ss*'), false);
  assert.equal(isMatch('ab', '?'), false);
  assert.equal(isMatch('', '*'), true);
  assert.equal(isMatch('a//b', 'a/*/b'), true);
  assert.equal(isMatch('a/b', 'a*b'), false);
});

test('classes', () => {
  assert.equal(isMatch(']', '[!]a]'), false);
  assert.equal(isMatch('a', '[!]a]'), false);
  assert.equal(isMatch('b', '[!]a]'), true);
  assert.equal(isMatch('^', '[]-a]'), true);
  assert.equal(isMatch('b', '[]-a]'), false);
  assert.equal(isMatch('-', '[a-]'), true);
  assert.equal(isMatch('-', '[-z]'), true);
  assert.equal(isMatch('m', '[a-]'), false);
  assert.equal(isMatch(']', '[\\]]'), true);
  assert.equal(isMatch('x', '[^x]'), false);
  assert.equal(isMatch('[abc', '[abc'), true);
  assert.equal(isMatch('a', '[abc'), false);
  assert.equal(isMatch('b', '[z-a]'), false);
  assert.equal(isMatch('[a]/b', '[a/b'), false);
  assert.equal(isMatch('[a/b', '[a/b'), true);
  assert.equal(isMatch('c3', '[a-c][0-9]'), true);
  assert.equal(isMatch('d3', '[a-c][0-9]'), false);
});

test('escapes', () => {
  assert.equal(isMatch('a*b', 'a\\*b'), true);
  assert.equal(isMatch('axb', 'a\\*b'), false);
  assert.equal(isMatch('{a,b}', '\\{a,b}'), true);
  assert.equal(isMatch('a', '\\{a,b}'), false);
  assert.equal(isMatch('**', '\\*\\*'), true);
  assert.equal(isMatch('x/y', '\\*\\*/y'), false);
  assert.throws(() => isMatch('a', 'a\\'), SyntaxError);
  assert.equal(isMatch('a/b', 'a\\/b'), false);
});

test('globstar no meio e no fim', () => {
  for (const p of ['a/b', 'a/x/b', 'a/x/y/b']) assert.equal(isMatch(p, 'a/**/b'), true, p);
  assert.equal(isMatch('a/x/c', 'a/**/b'), false);
  assert.equal(isMatch('a', 'a/**'), true);
  assert.equal(isMatch('a/b/c', 'a/**'), true);
  assert.equal(isMatch('b/a', 'a/**'), false);
  assert.equal(isMatch('a/b/c/b', 'a/**/b'), true);
});

test('globstar no início e repetido', () => {
  assert.equal(isMatch('a', '**'), true);
  assert.equal(isMatch('a/b/c', '**'), true);
  assert.equal(isMatch('', '**'), true);
  assert.equal(isMatch('README.md', '**/*.md'), true);
  assert.equal(isMatch('docs/x.md/notes/y.md', '**/*.md'), true);
  assert.equal(isMatch('a/x/a', '**/a'), true);
  assert.equal(isMatch('src/a/src/b/src', '**/src'), true);
  assert.equal(isMatch('a/b/a', '**/**/a'), true);
  assert.equal(isMatch('x/a/y/b', '**/a/**/b'), true);
  assert.equal(isMatch('b/a/b/a/c', '**/a/**/b'), false);
  assert.equal(isMatch('lib/test/test/a.js', '**/test/*.js'), true);
  assert.equal(isMatch('test/a.js/test/b.js', '**/test/*.js'), true);
});

test('pontos', () => {
  assert.equal(isMatch('.eslintrc.js', '*.js'), false);
  assert.equal(isMatch('.eslintrc.js', '.*.js'), true);
  assert.equal(isMatch('.eslintrc.js', '*.js', { dot: true }), true);
  assert.equal(isMatch('a/.git/c', '**'), false);
  assert.equal(isMatch('a/.git/c', '**', { dot: true }), true);
  assert.equal(isMatch('a/.git/c', 'a/**/c'), false);
  assert.equal(isMatch('a/.git/c', 'a/.git/*'), true);
  assert.equal(isMatch('.a', '?a'), false);
  assert.equal(isMatch('.a', '[.]a'), false);
  assert.equal(isMatch('.a', '\\.a'), true);
  assert.equal(isMatch('x/.cache/y/z', '**/.cache/**'), true);
});

test('nocase', () => {
  assert.equal(isMatch('README.MD', '*.md', { nocase: true }), true);
  assert.equal(isMatch('README.MD', '*.md'), false);
  assert.equal(isMatch('Q', '[a-z]', { nocase: true }), true);
  assert.equal(isMatch('q', '[A-Z]', { nocase: true }), true);
  assert.equal(isMatch('Q', '[!q]', { nocase: true }), false);
  assert.equal(isMatch('Src/A.JS', '{src,lib}/**/*.js', { nocase: true }), true);
});

test('alternativas com chaves', () => {
  assert.equal(isMatch('lib/a.ts', '{src,lib}/*.{js,ts}'), true);
  assert.equal(isMatch('lib/a.css', '{src,lib}/*.{js,ts}'), false);
  assert.equal(isMatch('x/b/y', '**/{a,b}/**'), true);
  assert.equal(isMatch('pkg/a/b/index.ts', '**/index.{js,ts}'), true);
  assert.equal(isMatch('a/x', '{a,b/**}/x'), true);
  assert.equal(isMatch('b/c/d/x', '{a,b/**}/x'), true);
});

test('filter e makeMatcher', () => {
  const paths = ['src/a.js', 'src/a/b.js', 'test/a.test.js', 'src/.hidden.js', 'docs/src/c.js', 'src/b.ts'];
  assert.deepEqual(filter(paths, 'src/**/*.js'), ['src/a.js', 'src/a/b.js']);
  assert.deepEqual(filter(paths, '**/src/*.js'), ['src/a.js', 'docs/src/c.js']);
  assert.deepEqual(filter(paths, '**/*.{ts,js}', { dot: true }), paths);
  const m = makeMatcher('**/a/**');
  assert.deepEqual(['a', 'x/a', 'a/a/a', 'x/y', 'b/a/c/a'].map(m), [true, true, true, false, true]);
  assert.throws(() => filter('src', '*'), TypeError);
  assert.throws(() => isMatch(1, '*'), TypeError);
  assert.throws(() => isMatch('a', '*', 'dot'), TypeError);
  assert.throws(() => isMatch('a', '*', null), TypeError);
  assert.equal(compile('{a,b}/c').alternatives.length, 2);
});

test('escapeGlob e hasMagic', () => {
  assert.equal(escapeGlob('a*b?[c]{d,e}\\'), 'a\\*b\\?\\[c\\]\\{d\\,e\\}\\\\');
  for (const t of ['a*b?[c]{d,e}', 'x\\y', '**', '[!]', 'plain']) assert.equal(isMatch(t, escapeGlob(t)), true, t);
  assert.equal(isMatch('ab', escapeGlob('a?')), false);
  assert.equal(hasMagic('a\\*b'), false);
  assert.equal(hasMagic('{a}'), false);
  assert.equal(hasMagic('[abc'), false);
  assert.equal(hasMagic('a/b'), false);
  assert.equal(hasMagic('a/**'), true);
  assert.equal(hasMagic('{a,b}'), true);
  assert.equal(hasMagic('[ab]'), true);
  assert.equal(hasMagic('a?'), true);
});
