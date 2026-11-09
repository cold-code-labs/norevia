import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/template.mjs';

test('list with HTML escaping', () => {
  const out = render('{{#itens}}<li>{{nome}}</li>{{/itens}}', { itens: [{ nome: 'Pão & Café' }, { nome: '<b>' }] });
  assert.equal(out, '<li>Pão &amp; Café</li><li>&lt;b&gt;</li>');
});

test('order without coupon does not inherit the global coupon', () => {
  const tpl = '{{#pedido}}Pedido {{id}}{{#cupom}} (cupom {{codigo}}){{/cupom}}{{/pedido}}';
  const view = { cupom: { codigo: 'BEMVINDO' }, pedido: { id: 7, cupom: null } };
  assert.equal(render(tpl, view), 'Pedido 7');
});

test('lines with standalone section tags disappear', () => {
  const tpl = 'Itens:\n{{#xs}}\n- {{.}}\n{{/xs}}\nfim';
  assert.equal(render(tpl, { xs: ['a', 'b'] }), 'Itens:\n- a\n- b\nfim');
});
