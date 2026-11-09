import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMatch, filter, expandBraces } from '../src/glob.mjs';

test('curingas dentro de um segmento', () => {
  assert.equal(isMatch('src/app.js', 'src/*.js'), true);
  assert.equal(isMatch('src/lib/app.js', 'src/*.js'), false);
  assert.equal(isMatch('img1.png', 'img[0-9].png'), true);
  assert.equal(isMatch('.eslintrc.js', '*.js'), false);
});

test('globstar no início do padrão', () => {
  const paths = ['node_modules', 'pkg/node_modules', 'node_modules/pkg/node_modules', 'node_modules/pkg'];
  assert.deepEqual(filter(paths, '**/node_modules'), ['node_modules', 'pkg/node_modules', 'node_modules/pkg/node_modules']);
});

test('expansão de chaves', () => {
  assert.deepEqual(expandBraces('a{b,c}d{e,f}'), ['abde', 'abdf', 'acde', 'acdf']);
});
