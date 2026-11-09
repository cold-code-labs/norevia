/**
 * Planos de missão em texto → chamadas ao Scheduler.
 */

const UNITS = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
const DURATION = /^(\d+(?:\.\d+)?)(ms|s|m|h)$/;

/**
 * Converte uma duração textual em milissegundos inteiros (arredondados).
 * Ex.: '250ms' → 250, '1.5s' → 1500, '2m' → 120000.
 * @param {string} text
 * @returns {number}
 */
export function parseDuration(text) {
  const m = DURATION.exec(String(text).trim());
  if (!m) throw new SyntaxError(`duração inválida: ${text}`);
  return Math.round(Number(m[1]) * UNITS[m[2]]);
}

/**
 * Interpreta uma linha de plano em `{ name, opts }` para `Scheduler.schedule`.
 * Formato: `<nome> [at <dur> | in <dur>] [every <dur>] [prio <inteiro>]`.
 */
export function parsePlanLine(line, now = 0) {
  const tokens = line.trim().split(/\s+/);
  const name = tokens.shift();
  const opts = {};
  let when = null;
  while (tokens.length) {
    const key = tokens.shift();
    const value = tokens.shift();
    if (value === undefined) throw new SyntaxError(`valor faltando após ${key}`);
    if (key === 'at' || key === 'in') {
      if (when !== null) throw new SyntaxError('use at OU in, uma vez');
      when = key === 'at' ? parseDuration(value) : now + parseDuration(value);
    } else if (key === 'every') {
      opts.every = parseDuration(value) / 1000;
    } else if (key === 'prio') {
      if (!/^-?\d+$/.test(value)) throw new SyntaxError(`prioridade inválida: ${value}`);
      opts.priority = Number(value);
    } else {
      throw new SyntaxError(`palavra-chave desconhecida: ${key}`);
    }
  }
  opts.at = when ?? now;
  return { name, opts };
}

/**
 * Carrega um plano (uma tarefa por linha; linhas vazias e iniciadas por '#'
 * são ignoradas) no agendador. Devolve os ids na ordem das linhas.
 */
export function loadPlan(scheduler, text) {
  const ids = [];
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;
    let parsed;
    try {
      parsed = parsePlanLine(line, scheduler.now);
    } catch (e) {
      if (e instanceof SyntaxError) throw new SyntaxError(`linha ${i + 1}: ${e.message}`);
      throw e;
    }
    ids.push(scheduler.schedule(parsed.name, parsed.opts));
  });
  return ids;
}

/** Formata um registro de execução: uma linha `<segundos com 3 casas>s <nome>` por item. */
export function formatLog(log) {
  return log.map((r) => `${(r.time / 1000).toFixed(3)}s ${r.name}`).join('\n');
}
