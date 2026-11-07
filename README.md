# Norevia

**A Cold Code Labs research project on collective computational intelligence.**
Live archive: https://norevia.coldcodelabs.com

> What is the least computation, reasoning and coordination needed to produce a verifiably correct result — and how can a system discover that configuration by itself?

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
| `research/theory` | Formal model of a candidate "law of collective efficiency" (`model.mjs`, tests) |
| `hypotheses` | Official hypothesis registry with refutation criteria and status |
| `sims` | Agent-based simulations (Node.js, deterministic by seed, preregistered) |
| `observatory` | Swarm Efficiency Observatory — benchmarks with real LLMs |
| `results` | Versioned results of simulations and benchmarks |
| `site` | Source and deploy tooling of norevia.coldcodelabs.com |
| `docs` | Conventions and working briefs |

## Reproduce
```bash
node sims/run-all.mjs                       # all simulations, deterministic
node --test research/theory/model.test.mjs  # theory checks
node site/build.mjs                         # build the site into site/dist
```
Observatory runs call Claude models and cost money; see `observatory/README.md`.

## License
Research content CC BY 4.0; code MIT.
