/**
 * Índice ordenado em páginas (folhas encadeadas de um B+-tree simplificado).
 */
import { compareKeys, comparePos, formatPos, isValidId, LOW_ID, HIGH_ID } from './keys.mjs';
import { upperBound, insertEntry, splitPage, isSorted } from './page.mjs';

function assertCapacity(cap) {
  if (!Number.isInteger(cap) || cap < 2 || cap > 1024) throw new RangeError(`pageCapacity inválida: ${cap}`);
}

export class PagedIndex {
  constructor({ pageCapacity = 4 } = {}) {
    assertCapacity(pageCapacity);
    this.pageCapacity = pageCapacity;
    this.pages = [];
    this.nextId = 1;
    this.count = 0;
  }

  static fromSnapshot(snapshot, options = {}) {
    if (!Array.isArray(snapshot)) throw new TypeError('fromSnapshot: snapshot deve ser array');
    const index = new PagedIndex(options);
    let prev = null;
    const seen = new Set();
    for (const rows of snapshot) {
      if (!Array.isArray(rows) || rows.length < 1 || rows.length > index.pageCapacity) throw new RangeError('fromSnapshot: página com tamanho inválido');
      const page = [];
      for (const row of rows) {
        const [key, id, value] = row;
        compareKeys(key, key);
        if (!isValidId(id) || seen.has(id)) throw new RangeError(`fromSnapshot: id inválido ${id}`);
        const entry = { key, id, value };
        if (prev && comparePos(prev, entry) >= 0) throw new RangeError('fromSnapshot: entradas fora de ordem');
        seen.add(id);
        page.push(entry);
        prev = entry;
        if (id >= index.nextId) index.nextId = id + 1;
      }
      index.pages.push(page);
      index.count += page.length;
    }
    return index;
  }

  static bulkLoad(pairs, { pageCapacity = 4, fill = pageCapacity } = {}) {
    if (!Array.isArray(pairs)) throw new TypeError('bulkLoad: pares devem ser array');
    const index = new PagedIndex({ pageCapacity });
    if (!Number.isInteger(fill) || fill < 1 || fill > pageCapacity) throw new RangeError(`fill inválido: ${fill}`);
    let page = [];
    for (let i = 0; i < pairs.length; i++) {
      const [key, value] = pairs[i];
      if (i > 0 && compareKeys(pairs[i - 1][0], key) > 0) throw new RangeError('bulkLoad: chaves fora de ordem');
      compareKeys(key, key);
      page.push({ key, id: index.nextId++, value });
      if (page.length === fill) {
        index.pages.push(page);
        page = [];
      }
    }
    if (page.length > 0) index.pages.push(page);
    index.count = pairs.length;
    return index;
  }

  get size() {
    return this.count;
  }

  locate(pos, strict = true) {
    let lo = 0;
    let hi = this.pages.length - 1;
    let ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const c = comparePos(this.pages[mid][0], pos);
      if (c < 0 || (c === 0 && !strict)) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }

  insert(key, value) {
    compareKeys(key, key);
    const entry = { key, id: this.nextId++, value };
    if (this.pages.length === 0) {
      this.pages.push([entry]);
    } else {
      const p = this.locate(entry, false);
      const page = this.pages[p];
      insertEntry(page, entry);
      if (page.length > this.pageCapacity) this.pages.splice(p, 1, ...splitPage(page));
    }
    this.count++;
    return entry.id;
  }

  remove(id) {
    for (let p = 0; p < this.pages.length; p++) {
      const page = this.pages[p];
      const at = page.findIndex((e) => e.id === id);
      if (at < 0) continue;
      page.splice(at, 1);
      if (page.length === 0) this.pages.splice(p, 1);
      this.count--;
      return true;
    }
    return false;
  }

  entry(p, slot) {
    const page = this.pages[p];
    return page ? page[slot] : undefined;
  }

  get(key) {
    compareKeys(key, key);
    const out = [];
    if (this.pages.length === 0) return out;
    const hi = { key, id: HIGH_ID };
    let p = this.locate({ key, id: LOW_ID }, true);
    let slot = upperBound(this.pages[p], { key, id: LOW_ID });
    while (p < this.pages.length) {
      const page = this.pages[p];
      if (slot >= page.length) {
        p++;
        slot = 0;
        continue;
      }
      if (comparePos(page[slot], hi) > 0) break;
      out.push(page[slot].value);
      slot++;
    }
    return out;
  }

  compact() {
    let merges = 0;
    let p = 0;
    while (p + 1 < this.pages.length) {
      if (this.pages[p].length + this.pages[p + 1].length <= this.pageCapacity) {
        this.pages[p] = this.pages[p].concat(this.pages[p + 1]);
        this.pages.splice(p + 1, 1);
        merges++;
      } else {
        p++;
      }
    }
    return merges;
  }

  stats() {
    const sizes = this.pages.map((page) => page.length);
    return {
      pages: sizes.length,
      entries: this.count,
      minFill: sizes.length ? Math.min(...sizes) : 0,
      maxFill: sizes.length ? Math.max(...sizes) : 0,
    };
  }

  layout() {
    return this.pages.map((page) => page.map(formatPos));
  }

  check() {
    const all = this.pages.flat();
    if (!isSorted(all)) throw new Error('índice fora de ordem');
    for (const page of this.pages) if (page.length < 1 || page.length > this.pageCapacity) throw new Error('página com tamanho inválido');
    return true;
  }
}
