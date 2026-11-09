import { test } from 'node:test';
import assert from 'node:assert/strict';
import { padEnd, padStart, center, justify, table, columns, justifyText } from '../src/align.mjs';

test('padEnd, padStart e center por largura', () => {
  assert.equal(padEnd('漢', 4), '漢  ');
  assert.equal(padStart('ab', 4), '  ab');
  assert.equal(padEnd('abcdef', 3), 'abcdef');
  assert.equal(center('ab', 5), ' ab  ');
  assert.equal(center('漢', 5), ' 漢  ');
  assert.throws(() => padEnd('a', -1), RangeError);
});

test('justify com sobra divisível', () => {
  assert.equal(justify('a b c', 7), 'a  b  c');
  assert.equal(justify('um dois', 10), 'um    dois');
  assert.equal(justify('sozinha', 9), 'sozinha  ');
  assert.equal(justify('longa demais', 5), 'longa demais');
  assert.equal(justify('', 3), '   ');
});

test('justify: lacunas da esquerda recebem os espaços extras', () => {
  assert.equal(justify('a b c d', 11), 'a   b  c  d');
  assert.equal(justify('a b c', 8), 'a   b  c');
  assert.equal(justify('aa bb cc dd ee', 17), 'aa  bb  cc  dd ee');
  assert.equal(justify('漢 字 か', 9), '漢  字 か');
});

test('justifyText', () => {
  assert.deepEqual(justifyText('o rato roeu a roupa do rei de roma\nfim', 12), ['o  rato roeu', 'a  roupa  do', 'rei de roma', 'fim']);
});

test('table e columns', () => {
  assert.deepEqual(table([['id', 'nome'], ['1', 'Ana'], ['22', '漢']], ['right'], { header: true }), ['id | nome', '---+-----', ' 1 | Ana ', '22 | 漢  ']);
  assert.deepEqual(table([['a'], ['b', 'cc']], ['left', 'center']), ['a |   ', 'b | cc']);
  assert.throws(() => table([['a']], ['meio']), RangeError);
  assert.deepEqual(columns(['a', 'bb', 'ccc', 'd', 'ee', 'f', 'g'], 12), ['a    d   g', 'bb   ee', 'ccc  f']);
  assert.deepEqual(columns(['alpha', 'b', 'c'], 5), ['alpha', 'b', 'c']);
  assert.deepEqual(columns([], 5), []);
});
