import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, compile, parse, escapeHtml, TemplateError } from '../src/template.mjs';

test('escapeHtml escapes the six characters, in a single pass', () => {
  assert.equal(escapeHtml(`<a href="x">'&'\`</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&#96;&lt;/a&gt;');
  assert.equal(escapeHtml('&amp;'), '&amp;amp;');
  assert.equal(escapeHtml(12), '12');
});

test('variables: escaped, unescaped, nulls and conversion with String()', () => {
  assert.equal(render('{{{v}}}|{{& v}}|{{v}}', { v: '<i>&' }), '<i>&|<i>&|&lt;i&gt;&amp;');
  assert.equal(render('[{{a}}][{{{b}}}][{{c}}][{{f}}][{{xs}}]', { a: null, c: 0, f: false, xs: [1, 2] }), '[][][0][false][1,2]');
  assert.equal(render('{{ nome }}/{{ #a}}', { nome: 'Ana', '#a': 'x' }), 'Ana/x');
});

test('sections and inverted sections: empty values', () => {
  const tpl = '{{#v}}S{{/v}}{{^v}}I{{/v}}';
  for (const v of [false, 0, '', null, undefined, NaN, []]) assert.equal(render(tpl, { v }), 'I', String(v));
  for (const v of [true, 1, 'x', {}, [0]]) assert.equal(render(tpl, { v }), 'S', String(v));
  assert.equal(render(tpl, {}), 'I');
});

test('array iteration, {{.}} and {{@index}} of the innermost iteration', () => {
  assert.equal(render('{{#xs}}{{@index}}:{{.}};{{/xs}}', { xs: ['a', 'b'] }), '0:a;1:b;');
  const rows = [{ cells: [1, 1] }, { cells: [1] }];
  assert.equal(render('{{#rows}}{{#cells}}{{@index}}{{/cells}}|{{@index}} {{/rows}}', { rows }), '01|0 0|1 ');
  assert.equal(render('{{#xs}}{{#meta}}{{@index}}{{/meta}}{{/xs}}', { xs: [{ meta: {} }, { meta: { a: 1 } }] }), '01');
  assert.equal(render('[{{@index}}]', {}), '[]');
});

test('objects push context; dotted paths', () => {
  const view = { site: 'X', user: { name: 'Ana', address: { city: 'Recife' } } };
  assert.equal(render('{{#user}}{{name}} ({{address.city}}) @{{site}}{{/user}}', view), 'Ana (Recife) @X');
  assert.equal(render('[{{a.b.c}}]', { a: { b: null } }), '[]');
  assert.equal(render('{{s.length}}', { s: 'abc' }), '3');
  assert.equal(render('{{#a}}[{{b.c}}]{{/a}}', { b: { c: 'X' }, a: { b: {} } }), '[]');
  assert.equal(render('{{#tags}}{{.}}-{{sep}}{{/tags}}', { sep: '|', tags: ['a', 'b'] }), 'a-|b-|');
});

test('key present with value null hides the one from outer contexts', () => {
  assert.equal(render('{{#item}}[{{nota}}]{{/item}}', { nota: 'global', item: { nota: null } }), '[]');
  assert.equal(render('{{#p}}[{{cupom.codigo}}]{{/p}}', { cupom: { codigo: 'X' }, p: { cupom: null } }), '[]');
});

test('key present with value undefined also hides the outer one', () => {
  const tpl = '{{#item}}{{#flag}}F{{/flag}}{{^flag}}-{{/flag}}{{/item}}';
  assert.equal(render(tpl, { flag: true, item: { flag: undefined } }), '-');
  assert.equal(render(tpl, { flag: true, item: { other: 1 } }), 'F');
});

test('properties inherited through the prototype count as present', () => {
  const herda = Object.create({ tema: 'escuro' });
  assert.equal(render('{{#item}}{{tema}}{{/item}}', { tema: 'claro', item: herda }), 'escuro');
  const herdaNulo = Object.create({ tema: null });
  assert.equal(render('{{#item}}[{{tema}}]{{/item}}', { tema: 'claro', item: herdaNulo }), '[]');
});

test('standalone lines: LF, CRLF, last line, indentation and comments', () => {
  assert.equal(render('{{#a}}\nx\n{{/a}}\n', { a: true }), 'x\n');
  assert.equal(render('a\r\n  {{#s}}\r\nb\r\n  {{/s}}\r\nc', { s: 1 }), 'a\r\nb\r\nc');
  assert.equal(render('x\n  {{! fim }}', {}), 'x\n');
  assert.equal(render('\t{{^none}}\nvazio\n\t{{/none}}\n', {}), 'vazio\n');
});

test('lines that are not standalone preserve spaces and line breaks', () => {
  assert.equal(render('  {{#a}}x{{/a}}\n', { a: true }), '  x\n');
  assert.equal(render('a\n  {{v}}\nb', { v: '' }), 'a\n  \nb');
  assert.equal(render('  {{>p}}\n', {}, { p: 'X' }), '  X\n');
  assert.equal(render('{{#a}} . \n{{/a}}', { a: true }), ' . \n');
});

test('syntax errors with position', () => {
  const pos = (tpl) => {
    try { parse(tpl); } catch (e) {
      assert.ok(e instanceof TemplateError);
      assert.equal(e.name, 'TemplateError');
      assert.match(e.message, new RegExp(`posição ${e.pos}\\b`));
      return e.pos;
    }
    return null;
  };
  assert.equal(pos('abc {{nome'), 4);
  assert.equal(pos('{{#a}}{{#b}}{{/a}}{{/b}}'), 12);
  assert.equal(pos('x{{/a}}'), 1);
  assert.equal(pos('{{#a}}{{#b}}{{/b}}'), 0);
  assert.equal(pos('{{#a}}{{^b}}'), 6);
  assert.equal(pos('ok {{ }}'), 3);
  assert.equal(pos('{{{x}}'), 0);
  assert.throws(() => render(42, {}), TypeError);
});

test('partials', () => {
  assert.equal(render('<{{>item}}>', { nome: 'Ana' }, { item: '{{nome}}!' }), '<Ana!>');
  assert.equal(render('{{#xs}}{{> li }}{{/xs}}', { xs: [{ n: 1 }, { n: 2 }] }, { li: '<li>{{n}}</li>' }), '<li>1</li><li>2</li>');
  assert.equal(render('[{{>nada}}][{{>toString}}]', {}, {}), '[][]');
  assert.throws(() => render('{{>p}}', {}, { p: 'x{{>p}}' }), RangeError);
});

test('reusable compile and view is not changed', () => {
  const f = compile('{{#xs}}{{.}}{{/xs}}');
  const view = Object.freeze({ xs: Object.freeze([1, 2]) });
  assert.equal(f(view), '12');
  assert.equal(f({ xs: [] }), '');
  assert.deepEqual(view, { xs: [1, 2] });
  assert.throws(() => compile('{{#a}}'), TemplateError);
});
