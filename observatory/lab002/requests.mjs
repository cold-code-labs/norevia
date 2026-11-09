// LAB-002 requests: 7 user requests of different size. Checks: `visible` ones are fed back to agents (the probe signal); the rest are hidden (scoring only).
const html = (t) => { const m = t.match(/```(?:html)?\s*\n([\s\S]*?)```/); return (m ? m[1] : t).trim(); };
const lpChecks = (kw) => [
  { id: 'doctype', visible: true, advice: 'Start the file with <!doctype html>.', fn: (h) => /^\s*<!doctype html>/i.test(h) },
  { id: 'lang', visible: true, advice: 'Set a language: <html lang="…">.', fn: (h) => /<html[^>]*\blang=/i.test(h) },
  { id: 'viewport', visible: true, advice: 'Include <meta name="viewport" content="width=device-width, initial-scale=1">.', fn: (h) => /<meta[^>]*name=["']viewport/i.test(h) },
  { id: 'one-h1', visible: true, advice: 'Exactly one <h1>.', fn: (h) => (h.match(/<h1[\s>]/gi) || []).length === 1 },
  { id: 'cta', visible: true, advice: 'House standard: exactly one primary call-to-action, written as <a class="cta" href="#contato"> (or href="mailto:…").', fn: (h) => (h.match(/<a[^>]*class=["'][^"']*\bcta\b[^"']*["'][^>]*>/gi) || []).length === 1 && /<a[^>]*class=["'][^"']*\bcta\b[^"']*["'][^>]*href=["'](#|mailto:)/i.test(h) },
  { id: 'self-contained', visible: true, advice: 'House standard: self-contained — no http(s):// URLs in any src or href (inline CSS only, no external fonts/scripts/images).', fn: (h) => !/(src|href)=["']https?:/i.test(h) },
  { id: 'footer', visible: false, fn: (h) => /<footer[\s>]/i.test(h) },
  { id: 'sections', visible: false, fn: (h) => (h.match(/<section[\s>]/gi) || []).length >= 4 },
  { id: 'img-alt', visible: false, fn: (h) => (h.match(/<img\b[^>]*>/gi) || []).every((i) => /\balt=["'][^"']+["']/i.test(i)) },
  { id: 'size', visible: false, fn: (h) => h.length < 30000 },
  { id: 'no-placeholder', visible: false, fn: (h) => !(/lorem ipsum|\[[^\]]{2,40}\]|\bxxx\b/i.test(h) || /\bTODO\b/.test(h)) },
  { id: 'facts', visible: false, fn: (h) => kw.every((k) => new RegExp(k, 'i').test(h)) },
];
const qaChecks = [
  { id: 'short', visible: true, advice: 'At most 700 characters.', fn: (t) => t.length <= 700 },
  { id: 'pt', visible: true, advice: 'Answer in Portuguese.', fn: (t) => /\b(não|que|é|um|uma|para)\b/i.test(t) },
  { id: 'mentions-context', visible: false, fn: (t) => /contexto/i.test(t) },
  { id: 'mentions-cost', visible: false, fn: (t) => /custo|barat|caro|gasto/i.test(t) },
  { id: 'max-4-sentences', visible: false, fn: (t) => (t.split(/[.!?]+\s/).filter((s) => s.trim().length > 3).length) <= 4 },
  { id: 'mentions-team', visible: false, fn: (t) => /equipe|time|delegar|agentes/i.test(t) },
];
export const REQUESTS = [
  { id: 'Q1', type: 'qa', after: null, extract: (t) => t.trim(), checks: qaChecks, prompt: 'Explique em no máximo 4 frases por que um agente único costuma ser mais barato que uma equipe de agentes quando o trabalho cabe em um contexto, e quando vale delegar mesmo assim.' },
  { id: 'LP1', type: 'lp', after: null, extract: html, checks: lpChecks(['Norevia', 'enxame|swarm', 'Cold Code Labs']), prompt: 'Crie uma landing page (um único arquivo HTML, CSS inline) para a Norevia: projeto de pesquisa em enxames agênticos bioinspirados da Cold Code Labs. Público: pesquisadores e engenheiros de agentes. Mostre a pergunta central (quando investir em raciocínio individual ou em organização coletiva), o que o projeto entrega e como acompanhar. Siga os padrões de LP da casa. Responda só com o HTML.' },
  { id: 'R-lm03', type: 'repo', taskId: 'lm03', after: null },
  { id: 'R-lm04', type: 'repo', taskId: 'lm04', after: null },
  { id: 'R-lx10', type: 'repo', taskId: 'lx10', after: null },
  { id: 'R-lx11', type: 'repo', taskId: 'lx11', after: null },
  { id: 'LP2', type: 'lp', after: 'LP1', extract: html, checks: lpChecks(['OpenBot', 'thread', 'controlador|controller']), prompt: 'Crie uma landing page (um único arquivo HTML, CSS inline) para o OpenBot: agentes que trabalham em threads, com um único ponto de contato (o controlador) que mantém a conversa principal livre. Público: líderes de times técnicos. Mostre o problema, a ideia e como começar. Siga os padrões de LP da casa. Responda só com o HTML.' },
];
