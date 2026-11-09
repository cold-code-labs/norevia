/**
 * Analisador de argumentos de linha de comando no estilo GNU.
 *
 * parseArgs(argv, { boolean, alias, defaults }) devolve `{ _: [...posicionais], ...opções }`.
 * Os nomes de opção no resultado são sempre os nomes canônicos (após `alias`).
 */

const NEGATIVE_NUMBER = /^-\d+(\.\d+)?$/;

/** Um token pode servir de valor para a opção anterior? */
function isValueToken(tok) {
  return tok !== undefined && (!tok.startsWith('-') || tok === '-' || NEGATIVE_NUMBER.test(tok));
}

export function parseArgs(argv, { boolean = [], alias = {}, defaults = {} } = {}) {
  if (!Array.isArray(argv)) throw new TypeError('argv deve ser um array de strings');
  const bools = new Set(boolean);
  const canon = (name) => (Object.hasOwn(alias, name) ? alias[name] : name);
  const out = { _: [] };

  // Strings repetidas acumulam em array; qualquer outra combinação substitui.
  const set = (key, value) => {
    const prev = Object.hasOwn(out, key) ? out[key] : undefined;
    if (typeof value === 'string' && typeof prev === 'string') out[key] = [prev, value];
    else if (typeof value === 'string' && Array.isArray(prev)) prev.push(value);
    else out[key] = value;
  };

  // `--nome` sem `=`: booleana, consome o próximo token como valor, ou vira true.
  const takeOption = (name, i) => {
    const key = canon(name);
    if (bools.has(key)) {
      set(key, true);
      return i;
    }
    if (isValueToken(argv[i + 1])) {
      set(key, argv[i + 1]);
      return i + 1;
    }
    set(key, true);
    return i;
  };

  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (typeof tok !== 'string') throw new TypeError(`argumento ${i} não é string`);
    if (tok === '--') {
      out._.push(...argv.slice(i + 1));
      break;
    }
    if (tok === '-' || !tok.startsWith('-') || NEGATIVE_NUMBER.test(tok)) {
      out._.push(tok);
      continue;
    }
    if (tok.startsWith('--')) {
      const body = tok.slice(2);
      if (body.includes('=')) {
        const [name, value] = body.split('=');
        set(canon(name), value);
      } else if (body.startsWith('no-') && body.length > 3) {
        set(canon(body.slice(3)), false);
      } else {
        i = takeOption(body, i);
      }
      continue;
    }
    // Grupo de opções curtas: `-abc` = `-a -b -c`; só a última pode receber valor.
    const letters = [...tok.slice(1)];
    for (const letter of letters.slice(0, -1)) set(canon(letter), true);
    i = takeOption(letters[letters.length - 1], i);
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (!Object.hasOwn(out, key)) out[key] = value;
  }
  return out;
}
