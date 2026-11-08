// Transition layer: the content is being translated from Portuguese to English (docs/CONVENTIONS.md v2).
// The generator accepts BOTH the legacy Portuguese slugs/ids and the new English ones and maps old -> new,
// so URLs, links and badges are already the final English ones while the translation lands.

// Card ids renamed by CONVENTIONS.md (old -> new). H-xx and other lit-/oss-/nat- ids are unchanged.
export const ID_MAP = {
  'lit-bibliografia': 'lit-bibliography',
  'lit-sintese': 'lit-synthesis',
  'oss-matriz': 'oss-matrix',
  'oss-padroes': 'oss-patterns',
  'nat-mapa': 'nat-map',
  'nat-candidatas': 'nat-candidates',
  'th-modelo': 'th-model',
  'sim-relatorio': 'sim-report',
  'sim-voto-correlacionado': 'sim-correlated-vote',
  'sim-verificador': 'sim-verifier',
  'sim-limiar-resposta': 'sim-response-threshold',
  'sim-estigmergia': 'sim-stigmergy',
  'sim-elastico': 'sim-elastic',
};
export const mapId = (id) => {
  const s = String(id ?? '').trim();
  return ID_MAP[s] || ID_MAP[s.toLowerCase()] || s;
};

// Evidence levels: canonical English keys (CONVENTIONS.md) + legacy aliases.
export const EVIDENCE_ALIASES = {
  'natural-phenomenon': 'natural-phenomenon', 'fenomeno-natural': 'natural-phenomenon', fenomeno: 'natural-phenomenon', natural: 'natural-phenomenon', nature: 'natural-phenomenon',
  'author-reported': 'author-reported', 'authors-report': 'author-reported', 'relato-autores': 'author-reported', 'relato-dos-autores': 'author-reported', relato: 'author-reported', autores: 'author-reported', reported: 'author-reported',
  'observed-implementation': 'observed-implementation', 'implementacao-observada': 'observed-implementation', implementacao: 'observed-implementation', codigo: 'observed-implementation', implementation: 'observed-implementation', code: 'observed-implementation',
  hypothesis: 'hypothesis', hipotese: 'hypothesis', hipoteses: 'hypothesis', hypotheses: 'hypothesis',
  'local-validation': 'local-validation', 'validacao-local': 'local-validation', validacao: 'local-validation', validado: 'local-validation', validated: 'local-validation',
  gap: 'gap', lacuna: 'gap', lacunas: 'gap', gaps: 'gap',
};

// Hypothesis status: canonical English keys + legacy aliases.
export const STATUS_ALIASES = {
  open: 'open', aberta: 'open', aberto: 'open', proposta: 'open', proposed: 'open', rascunho: 'open', draft: 'open',
  testing: 'testing', 'em-teste': 'testing', testando: 'testing', 'em-andamento': 'testing', planejada: 'testing', 'teste-planejado': 'testing', planned: 'testing',
  'preliminary-support': 'preliminary-support', 'suportada-preliminar': 'preliminary-support', 'supported-preliminary': 'preliminary-support',
  'preliminary-refuted': 'preliminary-refuted', 'refutada-preliminar': 'preliminary-refuted', 'refuted-preliminary': 'preliminary-refuted',
  inconclusive: 'inconclusive', inconclusivo: 'inconclusive', inconclusiva: 'inconclusive', parcial: 'inconclusive', 'parcialmente-suportada': 'inconclusive', partial: 'inconclusive',
  supported: 'supported', suportada: 'supported', corroborada: 'supported',
  refuted: 'refuted', refutada: 'refuted', falsificada: 'refuted',
  archived: 'archived', arquivada: 'archived', abandonada: 'archived', descartada: 'archived',
};

// Verdicts written by the simulation scripts in results JSON (`tests[].verdict`).
export const VERDICT_ALIASES = {
  supports: 'supports', suporta: 'supports', support: 'supports',
  'partially-supports': 'partial', 'suporta-parcialmente': 'partial', parcial: 'partial', partial: 'partial',
  'does-not-support': 'not-supported', 'nao-suporta': 'not-supported', 'not-supported': 'not-supported',
  refutes: 'refutes', refuta: 'refutes',
  inconclusive: 'inconclusive', inconclusivo: 'inconclusive', inconclusiva: 'inconclusive',
};

// Area aliases.
export const AREA_ALIASES = {
  natureza: 'nature', natural: 'nature', teoria: 'theory', hypotheses: 'hypothesis', hipotese: 'hypothesis', hipoteses: 'hypothesis',
  literatura: 'literature', paper: 'literature', papers: 'literature', open_source: 'oss', 'open-source': 'oss',
  sims: 'simulation', sim: 'simulation', simulacao: 'simulation', simulacoes: 'simulation', simulations: 'simulation',
  benchmark: 'observatory', observatorio: 'observatory',
};

// Legacy site paths (v1/v2 were Portuguese) -> new English paths; served as 301 by the companion Worker.
export const PATH_REDIRECTS = {
  '/conceitos/': '/explore/',
  '/hipoteses/': '/hypotheses/',
  '/experimentos/': '/experiments/',
  '/literatura/': '/literature/',
  '/metodo/': '/method/',
  '/acervo.json': '/archive.json',
};
