/**
 * Réplica: relógio de Lamport + mapa LWW + OR-set, com sincronização por deltas.
 */
import { LamportClock, assertReplicaId, makeStamp, formatStamp, vvGet, vvObserve, vvMerge } from './clock.mjs';
import { createMap, lwwSet, lwwDelete, lwwGet, lwwHas, lwwKeys, lwwApply, lwwClone, assertKey, assertValue } from './lww.mjs';
import { createSet, assertElem, orAdd, orAddTag, orApplyTomb, orRemove, orHas, orValues, orTags, orClone } from './orset.mjs';

export class Replica {
  #clock = new LamportClock();
  #map = createMap();
  #set = createSet();
  #vv = {};

  constructor(id) {
    this.id = assertReplicaId(id);
  }

  get clock() {
    return this.#clock.value;
  }

  #next() {
    const s = makeStamp(this.#clock.tick(), this.id);
    this.#vv = vvObserve(this.#vv, s);
    return s;
  }

  set(key, value) {
    assertKey(key);
    assertValue(value);
    const s = this.#next();
    lwwSet(this.#map, key, value, s);
    return formatStamp(s);
  }

  delete(key) {
    assertKey(key);
    const s = this.#next();
    lwwDelete(this.#map, key, s);
    return formatStamp(s);
  }

  get(key) {
    return lwwGet(this.#map, key);
  }

  has(key) {
    return lwwHas(this.#map, key);
  }

  keys() {
    return lwwKeys(this.#map);
  }

  add(elem) {
    assertElem(elem);
    const s = this.#next();
    return orAdd(this.#set, elem, s);
  }

  remove(elem) {
    return orRemove(this.#set, elem);
  }

  contains(elem) {
    return orHas(this.#set, elem);
  }

  values() {
    return orValues(this.#set);
  }

  tags(elem) {
    return orTags(this.#set, elem);
  }

  versionVector() {
    return { ...this.#vv };
  }

  snapshot() {
    return { vv: { ...this.#vv }, map: lwwClone(this.#map), set: orClone(this.#set) };
  }

  /** Delta para um par cujo vetor de versão é `vv`. */
  deltaSince(vv) {
    const fresh = (s) => s.c > vvGet(vv, s.r);
    const map = createMap();
    for (const [k, e] of this.#map) if (fresh(e.stamp)) map.set(k, e);
    const set = createSet();
    for (const [elem, b] of this.#set.tombs) for (const s of b.values()) orApplyTomb(set, elem, s);
    for (const [elem, b] of this.#set.adds) for (const s of b.values()) if (fresh(s)) orAddTag(set, elem, s);
    return { vv: { ...this.#vv }, map, set };
  }

  applyDelta(delta) {
    let hi = 0;
    for (const [k, e] of delta.map) {
      lwwApply(this.#map, k, e);
      if (e.stamp.c > hi) hi = e.stamp.c;
    }
    for (const [elem, b] of delta.set.tombs) {
      for (const s of b.values()) {
        orApplyTomb(this.#set, elem, s);
        if (s.c > hi) hi = s.c;
      }
    }
    for (const [elem, b] of delta.set.adds) {
      for (const s of b.values()) {
        orAddTag(this.#set, elem, s);
        if (s.c > hi) hi = s.c;
      }
    }
    for (const c of Object.values(delta.vv)) if (c > hi) hi = c;
    this.#vv = vvMerge(this.#vv, delta.vv);
    this.#clock.observe(hi);
  }

  syncWith(other) {
    if (other === this) return;
    const toOther = this.deltaSince(other.versionVector());
    const toThis = other.deltaSince(this.versionVector());
    other.applyDelta(toOther);
    this.applyDelta(toThis);
  }

  static fromSnapshot(id, snap) {
    const r = new Replica(id);
    r.applyDelta(snap);
    return r;
  }
}
