/**
 * Agendador de tarefas com relógio injetado (sem timers reais): quem usa chama
 * runDue() periodicamente.
 */
export function createScheduler(clock) {
  let tasks = [];
  let nextId = 1;

  return {
    /**
     * Agenda `fn` para `clock.now() + delay` (delay >= 0, padrão 0; senão RangeError).
     * Devolve um id numérico (1, 2, 3, ...).
     */
    schedule(fn, delay = 0) {
      if (!(delay >= 0)) throw new RangeError('delay must be >= 0');
      const id = nextId++;
      tasks.push({ id, fn, due: clock.now() + delay });
      return id;
    },

    /** Cancela uma tarefa pendente; devolve true se ela existia. */
    cancel(id) {
      const before = tasks.length;
      tasks = tasks.filter((t) => t.id !== id);
      return tasks.length < before;
    },

    /** Número de tarefas pendentes. */
    pending() {
      return tasks.length;
    },

    /** Menor horário pendente, ou null. */
    nextDue() {
      return tasks.length ? Math.min(...tasks.map((t) => t.due)) : null;
    },

    /**
     * Executa todas as tarefas vencidas (due <= agora), em ordem de horário e, no
     * empate, na ordem em que foram agendadas. Cada fn recebe o próprio id.
     * Tarefas agendadas durante a execução ficam para uma próxima chamada.
     * Devolve quantas tarefas foram executadas.
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
