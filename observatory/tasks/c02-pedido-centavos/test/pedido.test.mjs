import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrice, parseCatalog, priceOf } from '../src/catalog.mjs';
import { parseCoupon, discountFor } from '../src/discount.mjs';
import { createCart } from '../src/cart.mjs';

const CAT = `# catálogo de teste
CAFE;Café especial 500g;39,90
FILTRO;Filtro de papel;7,5
MOEDOR;Moedor manual;1.249,00

CANECA ; Caneca 300ml ; 45
`;

function handCatalog(entries) {
  return new Map(entries.map(([sku, name, priceCents]) => [sku, { sku, name, priceCents }]));
}

test('parsePrice: formato brasileiro em centavos', () => {
  assert.equal(parsePrice('19,90'), 1990);
  assert.equal(parsePrice('7,5'), 750);
  assert.equal(parsePrice('0,05'), 5);
  assert.equal(parsePrice('1.234,56'), 123456);
  assert.equal(parsePrice(' 7 '), 700);
  assert.throws(() => parsePrice('1,234'), SyntaxError);
  assert.throws(() => parsePrice('12.34'), SyntaxError);
});

test('parseCatalog: comentários, linhas vazias e espaços', () => {
  const cat = parseCatalog(CAT);
  assert.deepEqual([...cat.keys()], ['CAFE', 'FILTRO', 'MOEDOR', 'CANECA']);
  assert.deepEqual(cat.get('MOEDOR'), { sku: 'MOEDOR', name: 'Moedor manual', priceCents: 124900 });
  assert.deepEqual(cat.get('CANECA'), { sku: 'CANECA', name: 'Caneca 300ml', priceCents: 4500 });
  assert.equal(priceOf(cat, 'FILTRO'), 750);
});

test('parseCoupon: percentual em %, fixo em centavos', () => {
  assert.deepEqual(parseCoupon('desc10:10%'), { code: 'DESC10', kind: 'percent', value: 10 });
  assert.deepEqual(parseCoupon('MEIO:12,5%'), { code: 'MEIO', kind: 'percent', value: 12.5 });
  assert.deepEqual(parseCoupon('MENOS15:15,00'), { code: 'MENOS15', kind: 'fixed', value: 1500 });
  assert.throws(() => parseCoupon('ZERO:0%'), RangeError);
});

test('discountFor: arredondamento e limite do cupom fixo', () => {
  assert.equal(discountFor(8730, { code: 'A', kind: 'percent', value: 10 }), 873);
  assert.equal(discountFor(13500, { code: 'B', kind: 'percent', value: 12.5 }), 1688);
  assert.equal(discountFor(10000, { code: 'C', kind: 'fixed', value: 1500 }), 1500);
  assert.equal(discountFor(1000, { code: 'C', kind: 'fixed', value: 1500 }), 1000);
  assert.equal(discountFor(5000, null), 0);
});

test('carrinho sobre catálogo montado em código', () => {
  const cart = createCart(handCatalog([['LIVRO', 'Livro', 5990], ['MARCADOR', 'Marcador', 350]]));
  cart.add('LIVRO');
  cart.add('MARCADOR', 4);
  cart.applyCoupon({ code: 'DEZ', kind: 'fixed', value: 1000 });
  assert.deepEqual(cart.summary(), {
    lines: [
      { sku: 'LIVRO', name: 'Livro', qty: 1, unitCents: 5990, totalCents: 5990 },
      { sku: 'MARCADOR', name: 'Marcador', qty: 4, unitCents: 350, totalCents: 1400 },
    ],
    subtotalCents: 7390,
    discountCents: 1000,
    shippingCents: 1990,
    totalCents: 8380,
  });
});

test('frete grátis exatamente no limite, após o desconto', () => {
  const cart = createCart(handCatalog([['KIT', 'Kit', 22111]]));
  cart.add('KIT');
  cart.applyCoupon({ code: 'K', kind: 'percent', value: 10 });
  const s = cart.summary();
  assert.equal(s.discountCents, 2211);
  assert.equal(s.shippingCents, 0);
  assert.equal(s.totalCents, 19900);
  cart.applyCoupon({ code: 'K2', kind: 'fixed', value: 2212 });
  assert.equal(cart.summary().shippingCents, 1990);
});

test('integração: recibo com cupom fixo e frete grátis', () => {
  const cart = createCart(parseCatalog(CAT));
  cart.add('MOEDOR');
  cart.applyCoupon('MENOS15:15,00');
  assert.equal(cart.receipt(), [
    '1x Moedor manual — R$ 1.249,00',
    'Subtotal: R$ 1.249,00',
    'Desconto (MENOS15): -R$ 15,00',
    'Frete: grátis',
    'Total: R$ 1.234,00',
  ].join('\n'));
});

test('integração: cupom de 12,5% com meio centavo', () => {
  const cart = createCart(parseCatalog(CAT));
  cart.add('CANECA', 3);
  cart.applyCoupon('MEIO:12,5%');
  const s = cart.summary();
  assert.equal(s.subtotalCents, 13500);
  assert.equal(s.discountCents, 1688);
  assert.equal(s.totalCents, 13802);
});

test('integração: vários itens, remoção e recibo sem cupom', () => {
  const cart = createCart(parseCatalog(CAT));
  cart.add('FILTRO', 3);
  cart.add('CAFE', 4);
  cart.add('FILTRO', 2);
  cart.remove('CAFE', 1);
  cart.remove('CANECA');
  assert.equal(cart.receipt(), [
    '5x Filtro de papel — R$ 37,50',
    '3x Café especial 500g — R$ 119,70',
    'Subtotal: R$ 157,20',
    'Frete: R$ 19,90',
    'Total: R$ 177,10',
  ].join('\n'));
});

test('erros e carrinho vazio', () => {
  const cart = createCart(parseCatalog(CAT));
  assert.throws(() => cart.add('NADA'), /SKU desconhecido/);
  assert.throws(() => cart.add('CAFE', 0), RangeError);
  cart.add('CAFE');
  cart.remove('CAFE');
  assert.deepEqual(cart.summary(), { lines: [], subtotalCents: 0, discountCents: 0, shippingCents: 0, totalCents: 0 });
});
