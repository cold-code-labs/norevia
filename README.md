# Norevia — Social Immunity for Agentic Systems

**Collective defence for agent systems** — testing whether social-immunity mechanisms can contain compromised information while preserving legitimate work.

A [Cold Code Labs](https://coldcodelabs.com) research project · **Collective defence research programme** · [norevia.coldcodelabs.com](https://norevia.coldcodelabs.com)

## How collective defence could work
1. **Detect** — identify suspicious evidence and preserve its provenance before it enters shared memory or action.
2. **Signal** — recruit targeted review and inhibit only the implicated source, tool or action.
3. **Reconfigure** — narrow information flow, quarantine sources and independently verify claims.
4. **Recover** — stand down after containment is verified and retain only validated evidence.

These are engineering hypotheses. Each must beat well-implemented security controls at matched cost in owned or isolated environments. Consensus alone is not evidence that a claim is safe.

## The research behind it
> When does adaptive collective defence contain compromised information better than strong conventional security controls, at matched cost and utility?

We study whether collective organisation inspired by social immunity can help LLM-based agent systems detect, contain and recover from compromised or misleading information. We measure propagation, containment, benign-work disruption, false alarms, missed incidents, latency and cost. The aim is a falsifiable account of when local alarms, selective inhibition, contact-network plasticity and bounded memory add value beyond conventional security engineering.

**Scope.** First experimental object: information integrity in LLM-based agent systems, evaluated with synthetic cases or licensed data in owned or isolated environments. No third-party targets. Generalising beyond this scope requires evidence.

**Reading the title.** *Social immunity* names collective defences observed in social organisms; it does not establish an equivalence with software security. *Agentic systems* are LLM-based agents, their tools, state, memory and communication paths. *Collective defence* is an empirical question: adaptive biology-inspired controls must be compared with provenance, least privilege, independent verification, quarantine and rate limits. Fixed scripts and central controls remain baselines.

Norevia studies **when, how and why** agent systems should coordinate to preserve their own information integrity. Social-insect immunity supplies candidate mechanisms; experimental security engineering is the instrument of validation.

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
| `research/theory` | Formal models and simulations; current model needs extensions for propagation, adversaries, trust decay and cost-asymmetric defence losses |
| `hypotheses` | Official hypothesis registry with refutation criteria and status |
| `sims` | Agent-based simulations (Node.js, deterministic by seed, preregistered) |
| `observatory` | Reusable benchmark harness and historical LAB-001…006 results; LAB-007 defence study is a draft and has not run |
| `results` | Versioned results of simulations |
| `site` | Zero-dependency generator and deploy tooling of norevia.coldcodelabs.com (landing page: `site/lib/home.mjs`) |
| `docs` | Conventions and working briefs |

## Reproduce
```bash
node sims/run-all.mjs                       # all simulations, deterministic
node --test research/theory/model.test.mjs  # theory checks
node site/build.mjs                         # build the site into site/dist
```
Observatory runs call Claude models and cost money; each LAB run has its own budget cap and ledger; read the pre-registration and limits in each report before citing a result.

## License
Research content CC BY 4.0; code MIT.
