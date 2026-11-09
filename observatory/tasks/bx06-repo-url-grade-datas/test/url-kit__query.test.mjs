import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, stringifyQuery } from '../src/url-kit/query.mjs';

test('pares simples e ? opcional', () => {
  assert.deepEqual(parseQuery('?a=1&b=two'), { a: '1', b: 'two' });
  assert.deepEqual(parseQuery('a=1'), { a: '1' });
  assert.deepEqual(parseQuery(''), {});
  assert.deepEqual(parseQuery('?'), {});
});
test("'+' é espaço, mas %2B é '+'", () => {
  assert.deepEqual(parseQuery('q=a+b&r=a%2Bb&s=caf%C3%A9'), { q: 'a b', r: 'a+b', s: 'café' });
});
test('chaves também são decodificadas', () => {
  assert.deepEqual(parseQuery('full+name=Ana%20Lima'), { 'full name': 'Ana Lima' });
});
test("par sem '=', primeiro '=' separa, pares vazios ignorados", () => {
  assert.deepEqual(parseQuery('flag&x=1=2&&y='), { flag: '', x: '1=2', y: '' });
});
test('chave repetida vira array', () => {
  assert.deepEqual(parseQuery('t=a&t=b&u=1&t=c'), { t: ['a', 'b', 'c'], u: '1' });
});
test('escape malformado fica como está', () => {
  assert.deepEqual(parseQuery('p=100%&q=1+1%'), { p: '100%', q: '1 1%' });
});
test('stringifyQuery', () => {
  assert.equal(
    stringifyQuery({ a: 1, b: 'x y', c: undefined, d: null, e: ['p', 'q&r'], f: true }),
    'a=1&b=x%20y&d&e=p&e=q%26r&f=true',
  );
});
test('ida e volta preserva +', () => {
  assert.deepEqual(parseQuery(stringifyQuery({ msg: '1+1=2', tag: 'c++' })), { msg: '1+1=2', tag: 'c++' });
});
