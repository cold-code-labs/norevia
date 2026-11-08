# Norevia — Bioinspired Agentic Swarms

**AI agents that organise the way living systems do** — gathering around hard problems, staying lean on easy ones, and dissolving when the work is done.

A [Cold Code Labs](https://coldcodelabs.com) research project · **First release: soon** · [norevia.coldcodelabs.com](https://norevia.coldcodelabs.com)

## How a swarm unfolds
1. **Sense** — one agent takes the task. Most work never needs more.
2. **Recruit** — when difficulty rises, specialists join, each once the stimulus crosses its own threshold *(response thresholds in honeybee division of labour)*.
3. **Decide** — agents explore in parallel and commit only when a quorum converges on an answer that can be checked *(quorum sensing in nest-site selection)*.
4. **Dissolve** — once the result is verified, the swarm releases itself; only what is worth remembering stays *(pheromone trails that evaporate unless reinforced)*.

Swarms don't always win: every mechanism has to beat one strong agent on the same budget — or it stays out.

## The research behind it
> When is it better to invest more effort in individual reasoning, and when in collective organisation?

We investigate how biological principles of organisation and regulation can improve the efficiency of AI agent swarms. We start with LLM-based agents, seeking to predict when to concentrate reasoning, when to cooperate and how to adapt collective effort under constraints of cost, time and quality. The long-term goal is a General Theory of AI Swarm Efficiency — a research goal, not an established result.

**Scope.** First experimental object: LLM-based software agents — not robotics, and not every autonomous system. Generalising to other forms of AI is a result to demonstrate, not a premise.

**Reading the title.** *Bioinspired*: biological systems are where the organising principles come from (specialisation and recruitment, stigmergy, feedback regulation, regulated repair and termination) — they suggest mechanisms, they do not prove efficacy. *Agentic*: the LLM is the technology, the agent (model + state + tools + execution loop) is the unit of action, and the swarm is how agents divide work, share information and adapt participation. *Swarms*: not any multi-agent system — we count as swarm behaviour only observable local autonomy, adaptive interactions and distributed decisions; fixed scripts and central orchestrators are baselines. Being able to form a swarm does not oblige the system to form one on every request. The General Theory is a research goal, not an established result; comparing with the best single agent under the same budget is one test of it, not its definition.

Norevia studies **when, how and why** multiple computational agents should cooperate instead of concentrating resources in a single agent. Nature — insect colonies, the human body, celestial systems, collective physics — is used as a **source of hypotheses**; experimental engineering is the **instrument of validation**.

## Evidence discipline
Every card carries exactly one evidence level:
- **Natural phenomenon** — a mechanism described by a primary biology/physics source. An analogy does not prove efficacy in LLMs.
- **Author-reported** — published results, not reproduced here.
- **Observed implementation** — code we inspected, pinned to a version/commit and `file:line`.
- **Hypothesis** — a falsifiable proposal, not yet tested.
- **Local validation** — a result produced in this repo, with script, data and seed.
- **Gap** — what we do not know yet.

## Layout
| Folder | Contents |
|---|---|
| `research/literature` | Paper cards (arXiv/DOI version, claims, what we verified), synthesis and bibliography |
| `research/oss` | Inspected open-source projects (commit, license, coordination mechanism), comparison matrix and patterns |
| `research/nature` | Natural mechanisms → engineering analogue → testable hypothesis |
| `research/theory` | Formal model of a candidate "law of collective efficiency" — one component of the General Theory of Swarm Efficiency (`model.mjs`, tests) |
| `hypotheses` | Official hypothesis registry with refutation criteria and status |
| `sims` | Agent-based simulations (Node.js, deterministic by seed, preregistered) |
| `observatory` | Swarm Efficiency Observatory — benchmarks with real LLMs (harness and results land with the first release) |
| `results` | Versioned results of simulations |
| `site` | Zero-dependency generator and deploy tooling of norevia.coldcodelabs.com (landing page: `site/lib/home.mjs`) |
| `docs` | Conventions and working briefs |

## Reproduce
```bash
node sims/run-all.mjs                       # all simulations, deterministic
node --test research/theory/model.test.mjs  # theory checks
node site/build.mjs                         # build the site into site/dist
```
Observatory runs call Claude models and cost money; the harness is published with the first release.

## License
Research content CC BY 4.0; code MIT.
