import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCatalog } from '../src/pedido-centavos/catalog.mjs';
import { createCart } from '../src/pedido-centavos/cart.mjs';

const CAT = 'CAFE;Café especial 500g;39,90\nFILTRO;Filtro de papel;7,5\n';

test('recibo de pedido com cupom percentual', () => {
  const cart = createCart(parseCatalog(CAT));
  cart.add('CAFE', 2);
  cart.add('FILTRO');
  cart.applyCoupon('desc10:10%');
  assert.equal(cart.receipt(), [
    '2x Café especial 500g — R$ 79,80',
    '1x Filtro de papel — R$ 7,50',
    'Subtotal: R$ 87,30',
    'Desconto (DESC10): -R$ 8,73',
    'Frete: R$ 19,90',
    'Total: R$ 98,47',
  ].join('\n'));
});

test('parseCatalog guarda preços em centavos', () => {
  const cat = parseCatalog(CAT);
  assert.deepEqual(cat.get('CAFE'), { sku: 'CAFE', name: 'Café especial 500g', priceCents: 3990 });
});
