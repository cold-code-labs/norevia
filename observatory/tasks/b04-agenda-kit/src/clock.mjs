/**
 * Injectable clocks. Every component of the kit receives an object with `now()` in ms.
 */

/**
 * Manual clock for tests and simulations.
 * - now(): current time in ms;
 * - advance(ms): advances ms >= 0 (otherwise RangeError) and returns the new time.
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
