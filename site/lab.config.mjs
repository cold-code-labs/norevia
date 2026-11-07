// Identidade e textos institucionais da Norevia Labs.
// Fonte: documento norteador "NOREVIA LABS — Consolidação do estudo (2026-11-07)"
// e docs/SWARM-BRIEF.md. O CONHECIMENTO (cartões, hipóteses, resultados) NÃO fica aqui:
// ele é lido do repositório por build.mjs a cada build.

export const SITE = {
  name: 'Norevia Labs',
  wordmark: 'NOREVIA',
  sub: 'LABS',
  kind: 'Collective Intelligence Research Lab',
  url: 'https://norevia.coldcodelabs.com',
  lang: 'pt-BR',
  tagline: 'Where nature proposes and experiments decide.',
  description:
    'Laboratório de pesquisa em inteligência coletiva: quando, como e por que múltiplos agentes computacionais devem cooperar em vez de concentrar recursos em um único agente.',
};

export const QUESTION =
  'Qual é a menor quantidade de computação, raciocínio e coordenação necessária para produzir um resultado verificavelmente correto, e como um sistema pode descobrir essa configuração autonomamente?';

export const SUBQUESTIONS = [
  'Quando 1 agente com reasoning alto vence N agentes?',
  'Quando um micro-swarm de 2 ou 3 agentes agrega valor?',
  'Quando expandir passa a desperdiçar recursos?',
];

export const MANIFESTO = [
  'Nossa ambição é descobrir os princípios que governam a eficiência computacional coletiva, usando a natureza como fonte de hipóteses e a engenharia experimental como instrumento de validação.',
  'Não queremos apenas construir um swarm eficiente. Queremos entender por que ele é eficiente, em quais condições e quais limites fundamentais governam essa eficiência — sem presumir que swarms sempre vencem.',
  'Organização eficiente não exige inteligência humana em cada componente. Mas analogias naturais inspiram mecanismos; não demonstram eficácia computacional. Por isso cada entrada deste acervo carrega o seu nível de evidência.',
];

// Pilares e as tags que os conectam aos cartões (contagem calculada no build).
export const PILLARS = [
  {
    key: 'teoria',
    name: 'Teoria da eficiência coletiva',
    question: 'Por que cooperar?',
    role: 'Descoberta científica',
    match: ['eficiencia-coletiva', 'lei-da-eficiencia', 'teoria', 'ganho-marginal', 'escalonamento', 'scaling'],
  },
  {
    key: 'observatory',
    name: 'Swarm Efficiency Observatory',
    question: 'Como demonstrar?',
    role: 'Validação experimental',
    match: ['observatory', 'benchmark', 'custo-por-acerto'],
  },
  {
    key: 'adaptive',
    name: 'Adaptive Swarm Activation',
    question: 'Quando e quanto cooperar?',
    role: 'Orquestração',
    match: ['adaptive-activation', 'adaptive-swarm-activation', 'roteamento', 'routing', 'reasoning-effort', 'ativacao-adaptativa'],
  },
  {
    key: 'elastic',
    name: 'Elastic Swarm',
    question: 'Como expandir e contrair?',
    role: 'Mecanismo operacional',
    match: ['elastic-swarm', 'micro-swarm', 'divisao-de-trabalho', 'recrutamento', 'quorum'],
  },
  {
    key: 'responsabilidade',
    name: 'Responsabilidade persistente',
    question: 'Como garantir a entrega?',
    role: 'Confiabilidade',
    match: ['responsabilidade-persistente', 'healing', 'reparo', 'self-healing', 'verificacao', 'aceite', 'memoria-limitada'],
  },
];

export const FAMILIES = [
  { name: 'Formigas e colmeias', principle: 'Estigmergia, especialização e reforço com decaimento', use: 'Coordenação com menos comunicação', match: ['insetos-sociais', 'formigas', 'abelhas', 'colmeia', 'estigmergia', 'feromonio'] },
  { name: 'Corpo humano', principle: 'Reflexos, imunidade, homeostase e memória seletiva', use: 'Reação rápida e recuperação limitada', match: ['corpo', 'imunidade', 'homeostase', 'reflexo', 'sistema-imune'] },
  { name: 'Sistemas celestes', principle: 'Equilíbrio, ressonância, dependências e contenção de cascatas', use: 'Controle de capacidade e estabilidade', match: ['celeste', 'celestes', 'orbita', 'ressonancia', 'cascata', 'astros'] },
];

export const OBSERVATORY_DESIGN = [
  { k: 'A', name: 'Agente único', d: 'Reasoning alto' },
  { k: 'B', name: 'Swarm fixo', d: 'Especialistas predefinidos' },
  { k: 'C', name: 'Swarm elástico', d: 'Ativação sob demanda' },
];

export const OBSERVATORY_METRICS = ['Conclusão verificável', 'Custo por acerto', 'Latência', 'Comunicação e retrabalho'];

export const NOT_YET_PROVEN = [
  'Ainda não descobrimos uma lei universal. Formulamos a pergunta e hipóteses candidatas.',
  'Ainda não demonstramos superioridade do swarm adaptativo. Ele pode perder para arquiteturas simples em diversas condições.',
  'Ainda não temos uma função validada de ganho marginal. Precisamos estimá-lo sem gastar mais recursos do que economizamos.',
  'Ainda não demonstramos generalização. Resultados em tarefas de código podem não se transferir para pesquisa, planejamento ou outros domínios.',
  'Ainda não estabelecemos novidade científica. É necessária revisão sistemática da literatura e reprodução dos principais resultados existentes.',
];

export const RULES = [
  'Resultados publicados por autores não são validação local.',
  'Analogia natural não prova eficácia em LLMs.',
  'Astros não têm intenção: metáforas celestes descrevem dinâmica, não propósito.',
  'Nunca inventamos fontes, números, DOIs, IDs arXiv, commits ou citações. O que não foi aberto vira lacuna.',
  'Preferimos fonte primária: paper, DOI, arXiv com versão, commit SHA.',
];
