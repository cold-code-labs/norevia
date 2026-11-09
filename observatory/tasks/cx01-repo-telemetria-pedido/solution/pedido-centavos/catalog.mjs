/**
 * Catálogo de produtos carregado de texto.
 *
 * Formato: uma linha por produto, `SKU;Nome;Preço`, com o preço no formato
 * brasileiro (`19,90`, `1.234,56`, `5`). Linhas vazias e linhas que começam com
 * `#` são ignoradas. Espaços nas pontas de cada campo são descartados.
 */

const PRICE_RE = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

/**
 * Interpreta um valor monetário no formato brasileiro.
 * @param {string} raw ex.: "19,90", "1.234,56", "0,5", "7"
 * @returns {number} valor em centavos (inteiro)
 */
export function parsePrice(raw) {
  const s = String(raw).trim();
  const m = PRICE_RE.exec(s);
  if (!m) throw new SyntaxError(`valor monetário inválido: "${raw}"`);
  const reais = Number(m[1].replace(/\./g, ''));
  const cents = m[2] === undefined ? 0 : Number(m[2].padEnd(2, '0'));
  return reais * 100 + cents;
}

/**
 * Lê o catálogo.
 * @param {string} text
 * @returns {Map<string, {sku:string, name:string, priceCents:number}>}
 */
export function parseCatalog(text) {
  const catalog = new Map();
  const lines = String(text).split(/\r?\n/);
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;
    const parts = trimmed.split(';').map((p) => p.trim());
    if (parts.length !== 3) throw new SyntaxError(`linha ${i + 1}: esperado SKU;Nome;Preço`);
    const [sku, name, price] = parts;
    if (!sku) throw new SyntaxError(`linha ${i + 1}: SKU vazio`);
    if (catalog.has(sku)) throw new SyntaxError(`linha ${i + 1}: SKU duplicado ${sku}`);
    let priceCents;
    try {
      priceCents = parsePrice(price);
    } catch (e) {
      throw new SyntaxError(`linha ${i + 1}: ${e.message}`);
    }
    catalog.set(sku, { sku, name, priceCents });
  });
  return catalog;
}

/**
 * Preço unitário de um SKU, em centavos.
 * @throws {Error} se o SKU não existir
 */
export function priceOf(catalog, sku) {
  const entry = catalog.get(sku);
  if (!entry) throw new Error(`SKU desconhecido: ${sku}`);
  return entry.priceCents;
}
