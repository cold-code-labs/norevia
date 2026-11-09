/**
 * Task scheduler with an injected clock (no real timers): the user calls
 * runDue() periodically.
 */
export function createScheduler(clock) {
  let tasks = [];
  let nextId = 1;

  return {
    /**
     * Schedules `fn` for `clock.now() + delay` (delay >= 0, default 0; otherwise RangeError).
     * Returns a numeric id (1, 2, 3, ...).
     */
    schedule(fn, delay = 0) {
      if (!(delay >= 0)) throw new RangeError('delay must be >= 0');
      const id = nextId++;
      tasks.push({ id, fn, due: clock.now() + delay });
      return id;
    },

    /** Cancels a pending task; returns true if it existed. */
    cancel(id) {
      const before = tasks.length;
      tasks = tasks.filter((t) => t.id !== id);
      return tasks.length < before;
    },

    /** Number of pending tasks. */
    pending() {
      return tasks.length;
    },

    /** Smallest pending time, or null. */
    nextDue() {
      return tasks.length ? Math.min(...tasks.map((t) => t.due)) : null;
    },

    /**
     * Runs all due tasks (due <= now), in order of time and, on a
     * tie, in the order in which they were scheduled. Each fn receives its own id.
     * Tasks scheduled during execution are left for a later call.
     * Returns how many tasks were run.
     */
    runDue() {
      const now = clock.now();
      const due = tasks.filter((t) => t.due < now).sort((a, b) => a.due - b.due || a.id - b.id);
      const ids = new Set(due.map((t) => t.id));
      tasks = tasks.filter((t) => !ids.has(t.id));
      for (const t of due) t.fn(t.id);
      return due.length;
    },
  };
}
