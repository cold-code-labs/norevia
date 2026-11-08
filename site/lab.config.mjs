// Identity and institutional copy for Norevia — a Cold Code Labs research project.
// Source: the guiding document "Norevia — study consolidation (2026-11-07)", docs/SWARM-BRIEF.md
// and docs/CONVENTIONS.md. KNOWLEDGE (cards, hypotheses, results) does NOT live here:
// build.mjs reads it from the repository on every build.

export const SITE = {
  name: 'Norevia',
  company: 'Cold Code Labs',
  companyUrl: 'https://coldcodelabs.com',
  kind: 'a Cold Code Labs research project',
  full: 'Norevia — a Cold Code Labs research project',
  url: 'https://norevia.coldcodelabs.com',
  repo: 'https://github.com/cold-code-labs/norevia',
  lang: 'en',
  title: 'Bioinspired Agentic Swarms',
  subtitle: 'Toward a General Theory of AI Swarm Efficiency',
  scope: 'First experimental object: LLM-based software agents — not robotics, and not every autonomous system. Generalising to other forms of AI is a result to demonstrate later, not a premise.',
  definition: 'We investigate how biological principles of organisation and regulation can improve the efficiency of AI agent swarms. We start with LLM-based agents, seeking to predict when to concentrate reasoning, when to cooperate and how to adapt collective effort under constraints of cost, time and quality.',
  tagline: 'Where nature proposes and experiments decide.',
  description:
    'Norevia — Bioinspired Agentic Swarms. A Cold Code Labs research project on AI agents that organise the way living systems do: when to think alone, when to cooperate, and how much. First release soon.',
};

// How to read the title. "Agentic" names the level of organisation we want to understand; "LLM-based" bounds what we test first.
export const TITLE_READING = [
  ['Bioinspired', 'Where the organising principles come from: biological systems guide the design of mechanisms — not as copies of biology, and not as proof that they work.'],
  ['Agentic', 'The unit of action: an agent is a model plus state, tools and execution loops pursuing a goal. The LLM is the technology; the agent is what acts; the swarm is how agents divide work, share information and adapt their participation.'],
  ['Swarms', 'Not any multi-agent system. We count as swarm behaviour only what we can observe: local autonomy, adaptive interactions and distributed decisions. Agents following a fixed script — or a central orchestrator — are baselines, not swarms by label.'],
];

export const QUESTION =
  'When is it better to invest more effort in individual reasoning, and when in collective organisation?';

export const SUBQUESTIONS = [
  'Which principles of organisation make cooperation between AI agents computationally advantageous — and under which conditions?',
  'Given a hard task, which next action has the highest expected benefit net of cost and latency: think longer, call a specialist, fetch external information, or verify?',
  'What is the least computation, reasoning and coordination needed to produce a verifiably correct result — and can a system discover that configuration by itself?',
  'When does one agent with high reasoning effort beat N agents?',
  'When does a micro-swarm of 2 or 3 agents add value?',
  'When does expanding start to waste resources?',
];

export const MANIFESTO = [
  'We do not just say “we build swarms inspired by nature”. We ask which principles of organisation make computational cooperation efficient — and under which conditions. Nature is the source of hypotheses; experimental engineering is the instrument of validation.',
  'Being able to form a swarm does not oblige the system to form one on every request. A greeting can take a minimal path; a complex task may justify progressive mobilisation. Collective organisation becomes a variable of the execution, not a configuration chosen in advance.',
  'Our intended contribution is not “applying biology to agents”. It is explaining, predicting and measuring when these mechanisms improve efficiency — and when they only add complexity. An efficient AI swarm may need less generative reasoning in coordination, reserving it for where it adds value: a hypothesis to test, not a conclusion.',
  'The General Theory of AI Swarm Efficiency is a research goal, not an established result. “General” is earned only if the same relations survive tests across different domains — code, cybersecurity, spatial coordination — and their predictions can be refuted.',
  'We do not just want to build an efficient swarm. We want to understand why it is efficient, under which conditions, and which fundamental limits govern that efficiency — without assuming that swarms always win.',
  'Efficient organisation does not require human-level intelligence in every component. But natural analogies inspire mechanisms; they do not demonstrate computational efficacy. That is why every entry in this archive carries its evidence level.',
];

// Pillars and the tags that connect them to cards (counts computed at build time).
// Tags are matched in both the legacy Portuguese and the new English form during the translation.
export const PILLARS = [
  {
    key: 'theory',
    name: 'General Theory of AI Swarm Efficiency',
    question: 'Which principles make cooperation efficient?',
    role: 'Scientific discovery',
    match: ['swarm-efficiency', 'general-theory', 'collective-efficiency', 'law-of-collective-efficiency', 'theory', 'marginal-gain', 'scaling', 'scaling-law', 'eficiencia-coletiva', 'lei-da-eficiencia-coletiva', 'teoria', 'ganho-marginal', 'escalonamento'],
  },
  {
    key: 'observatory',
    name: 'Swarm Efficiency Observatory',
    question: 'How do we demonstrate it?',
    role: 'Experimental validation',
    match: ['observatory', 'benchmark', 'cost-per-correct', 'cost-per-success', 'custo-por-acerto'],
  },
  {
    key: 'adaptive',
    name: 'Adaptive Swarm Activation',
    question: 'When and how much to cooperate?',
    role: 'Orchestration',
    match: ['adaptive-activation', 'adaptive-swarm-activation', 'routing', 'reasoning-effort', 'when-to-cooperate', 'how-much-to-cooperate', 'roteamento', 'ativacao-adaptativa', 'quando-cooperar', 'quanto-cooperar'],
  },
  {
    key: 'elastic',
    name: 'Elastic Swarm',
    question: 'How to expand and contract?',
    role: 'Operational mechanism',
    match: ['elastic-swarm', 'micro-swarm', 'macro-swarm', 'division-of-labor', 'recruitment', 'quorum', 'expansion-contraction', 'divisao-de-trabalho', 'recrutamento'],
  },
  {
    key: 'responsibility',
    name: 'Persistent responsibility',
    question: 'How to guarantee delivery?',
    role: 'Reliability',
    match: ['persistent-responsibility', 'healing', 'bounded-repair', 'repair', 'self-healing', 'verification', 'verifiable-acceptance', 'bounded-memory', 'responsabilidade-persistente', 'reparo', 'reparo-delimitado', 'verificacao', 'aceite-verificavel', 'memoria-limitada'],
  },
];

export const FAMILIES = [
  { name: 'Ants and hives', principle: 'Stigmergy, specialisation and reinforcement with decay', use: 'Coordination with less communication', match: ['social-insects', 'ants', 'bees', 'hive', 'stigmergy', 'pheromone', 'quorum', 'insetos-sociais', 'formigas', 'abelhas', 'colmeia', 'estigmergia', 'feromonio'] },
  { name: 'The human body', principle: 'Reflexes, immunity, homeostasis and selective memory', use: 'Fast reaction and bounded recovery', match: ['body', 'immunity', 'homeostasis', 'reflex', 'immune-system', 'corpo', 'imunidade', 'homeostase', 'reflexo', 'sistema-imune'] },
  { name: 'Celestial systems', principle: 'Equilibrium, resonance, dependencies and cascade containment', use: 'Capacity control and stability', match: ['celestial', 'celestial-analogy', 'orbit', 'resonance', 'cascade', 'kessler', 'celeste', 'celeste-analogia', 'orbita', 'ressonancia', 'cascata'] },
];

export const OBSERVATORY_DESIGN = [
  { k: 'A', name: 'Single agent', d: 'High reasoning effort' },
  { k: 'B', name: 'Fixed swarm', d: 'Predefined specialists' },
  { k: 'C', name: 'Elastic swarm', d: 'On-demand activation' },
];

export const OBSERVATORY_METRICS = ['Verifiable completion', 'Cost per accepted result', 'Latency', 'Communication and rework'];

export const NOT_YET_PROVEN = [
  'We have not discovered a universal law. We have formulated the question and candidate hypotheses.',
  'We have not shown that the adaptive swarm is superior. It may lose to simple architectures under many conditions.',
  'We do not yet have a validated marginal-gain function. We need to estimate it without spending more than we save.',
  'We have not shown generalisation. Results on coding tasks may not transfer to research, planning or other domains.',
  'We have not established scientific novelty. A systematic literature review and reproduction of the main existing results are required.',
];

export const RULES = [
  'Results published by authors are not local validation.',
  'A natural analogy does not prove efficacy in LLMs.',
  'Celestial bodies have no intent: celestial metaphors describe dynamics, not purpose.',
  'We never invent sources, numbers, DOIs, arXiv ids, commits or quotations. What was not opened becomes a gap.',
  'We prefer primary sources: paper, DOI, versioned arXiv id, commit SHA.',
];

export const LENSES = [
  ['Continuity', 'Does the task keep its state, owner and history across delegations?'],
  ['Verifiable acceptance', 'Is there an objective criterion that says whether the result is correct?'],
  ['Bounded memory', 'Does the mechanism work with finite memory and deliberate forgetting?'],
  ['Cost', 'What does each accepted result cost — tokens, time, coordination, rework?'],
  ['Bounded repair', 'Does the system detect and repair failures while knowing when to stop?'],
];
