/**
 * Relógios injetáveis. Todo componente do kit recebe um objeto com `now()` em ms.
 */

/**
 * Relógio manual para testes e simulações.
 * - now(): tempo atual em ms;
 * - advance(ms): avança ms >= 0 (senão RangeError) e devolve o novo tempo.
 */
export function createManualClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    advance(ms) {
      if (!(ms >= 0)) throw new RangeError('cannot go back in time');
      t += ms;
      return t;
    },
  };
}

export const systemClock = { now: () => Date.now() };
