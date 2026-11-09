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
  title: 'Social Immunity for Agentic Systems',
  subtitle: 'Collective Defence for Agent Systems',
  scope: 'First experimental object: LLM-based agents defending their own information integrity in owned or isolated environments. We study defensive coordination and containment, not operations against third-party systems.',
  definition: 'Norevia studies when collective, bioinspired organisation helps agent systems detect, contain and recover from compromised or misleading information. Social immunity supplies hypotheses; security engineering baselines and controlled experiments decide whether they help.',
  tagline: 'Collective defence, measured against strong baselines.',
  description:
    'Norevia — Social Immunity for Agentic Systems. A Cold Code Labs research project on collective defence, information integrity and bounded recovery in LLM-based agent systems.',
};

// How to read the title. Social immunity is the natural source of hypotheses; efficacy in agents remains unproven.
export const TITLE_READING = [
  ['Social immunity', 'Collective defences observed in social organisms. These observations suggest hypotheses; they do not establish equivalence with software security.'],
  ['Agentic systems', 'LLM-based agents together with their tools, state, memory and communication paths — the system whose information integrity we study.'],
  ['Collective defence', 'A measurable research question. Adaptive mechanisms must be compared with strong conventional security controls at matched cost and utility.'],
];

export const QUESTION =
  'When does adaptive collective defence contain compromised information better than strong conventional security controls, at matched cost and utility?';

export const SUBQUESTIONS = [
  'How far does a poisoned claim propagate through an agent network, and which controls stop it?',
  'When do provenance, least privilege, quarantine and independent verification outperform adaptive signalling or network rewiring?',
  'How can a system contain a specific source or action without suppressing benign work?',
  'What evidence is sufficient to escalate, inhibit, recover and stand down?',
  'How do false positives, missed incidents, latency and cost trade off under matched budgets?',
  'Which biological mechanisms add measurable value beyond conventional controls?',
];

export const MANIFESTO = [
    'Social immunity is the biological starting point: colonies combine prevention, detection, selective response and recovery to limit disease spread. Transfer to software agents is an engineering hypothesis, not a demonstrated equivalence.',
    'Our first target is agent-system integrity: malicious or misleading content entering shared context, memory or tool workflows. All evaluation uses synthetic cases or licensed datasets in owned or isolated environments.',
    'Every adaptive defence is compared with strong conventional controls, including provenance tracking, least privilege, independent verification, quarantine and rate limits, at matched cost.',
    'We measure propagation, containment, benign-work disruption, false alarms, missed incidents, recovery, latency and cost. Consensus alone is not proof that a claim is safe.',
    'The contribution we seek is a falsifiable account of when local signals, selective inhibition, contact-network plasticity and bounded memory improve collective defence — and when they do not.',
    'Biological sources suggest mechanisms; implementation records show what software does; author-reported results are not local validation. Every claim in the archive keeps its evidence level and provenance.',
];

// Pillars and the tags that connect them to cards (counts computed at build time).
// Tags are matched in both the legacy Portuguese and the new English form during the translation.
export const PILLARS = [
  {
    key: 'theory',
    name: 'Collective Defence',
    question: 'When does adaptive coordination improve containment?',
    role: 'Scientific discovery',
    match: ['collective-defence', 'social-immunity', 'information-integrity', 'poisoned-evidence', 'containment', 'propagation', 'defense-core', 'defense-bio'],
  },
  {
    key: 'observatory',
    name: 'Defence Evaluation',
    question: 'How do we measure containment and harm?',
    role: 'Experimental validation',
    match: ['observatory', 'benchmark', 'defensive-evaluation', 'false-positive', 'false-negative', 'cost-per-accepted-result'],
  },
  {
    key: 'adaptive',
    name: 'Signals and Recruitment',
    question: 'How should alarms recruit targeted review?',
    role: 'Orchestration',
    match: ['alarm-signal', 'danger-signal', 'response-threshold', 'recruitment', 'quorum', 'defense-bio'],
  },
  {
    key: 'elastic',
    name: 'Containment and Recovery',
    question: 'How do we restrict spread and stand down safely?',
    role: 'Operational mechanism',
    match: ['quarantine', 'cross-inhibition', 'network-plasticity', 'contact-network', 'wound-resolution', 'bounded-recovery'],
  },
  {
    key: 'responsibility',
    name: 'Evidence and Memory Integrity',
    question: 'What may be trusted, shared and retained?',
    role: 'Reliability',
    match: ['provenance', 'verification', 'memory-poisoning', 'bounded-memory', 'evidence-tracking', 'least-privilege', 'self-healing'],
  },
];

export const FAMILIES = [
  { name: 'Social-insect immunity', principle: 'Recognition, alarm, inhibition, guarding and contact-network change', use: 'Selective, local containment hypotheses', match: ['social-immunity', 'social-insects', 'ants', 'bees', 'alarm', 'inhibition', 'network-plasticity', 'sanitary-care'] },
  { name: 'Agent-system security', principle: 'Provenance, least privilege, independent verification and quarantine', use: 'Conventional baseline and external validity', match: ['prompt-injection', 'memory-poisoning', 'provenance', 'zero-trust', 'quarantine', 'agent-security'] },
  { name: 'Immune and recovery mechanisms', principle: 'Danger signals, selective response, contraction and bounded memory', use: 'Escalation, recovery and safe stand-down hypotheses', match: ['danger-theory', 'clonal-expansion', 'wound-resolution', 'bounded-memory', 'self-healing'] },
];

export const OBSERVATORY_DESIGN = [
  { k: 'A', name: 'No sharing', d: 'Each agent keeps its evidence local' },
  { k: 'B', name: 'Conventional security', d: 'Provenance, least privilege, verification and quarantine' },
  { k: 'C', name: 'Adaptive collective defence', d: 'Local alarm, targeted inhibition and bounded rewiring' },
];

export const OBSERVATORY_METRICS = ['Propagation and containment', 'Benign-work disruption', 'False alarms and missed incidents', 'Recovery, latency and cost'];

export const NOT_YET_PROVEN = [
  'No local experiment has shown that social-immunity mechanisms improve defence in agent systems.',
  'The proposed LAB-007 has not run; all listed outcomes are hypotheses and design targets.',
  'No standard licensed benchmark for agent-to-agent poisoning propagation was confirmed in the survey.',
  'Coding and general swarm-efficiency results do not establish cyber-defence efficacy.',
  'The literature harvest is a discovery set, not an exhaustive systematic review or human-verified inclusion set.',
];

export const RULES = [
  'Results published by authors are not local validation.',
  'A natural analogy does not prove security efficacy in LLM agents.',
  'Use only owned or isolated defensive environments; do not target third parties.',
  'Compare against strong conventional security controls at matched cost.',
  'Treat consensus as evidence to inspect, not as proof of correctness or safety.',
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
