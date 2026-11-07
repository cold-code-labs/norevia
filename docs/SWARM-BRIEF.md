# Norevia research swarm — shared brief (2026-11-07, English v2)

Norevia is a Cold Code Labs research project (not "Norevia Labs"). Content conventions, schema and id mapping: `docs/CONVENTIONS.md`.

## Central question
What is the least computation, reasoning and coordination needed to produce a verifiably correct result, and how can a system discover that configuration autonomously? When does one high-reasoning agent beat N agents, when does a micro-swarm add value, and when does further expansion waste resources?

## Rules for every agent
1. Write **only** in your assigned folder. Do not run `git` (the coordinator commits). Do not delete others' files.
2. Language: English.
3. Never invent sources, numbers, DOIs, arXiv ids, commits or quotes. If you could not open a source, mark it `gap`. Prefer primary sources (paper, DOI, arXiv with version `vN`, commit SHA).
4. Every card has one evidence level (see conventions).
5. Author results are not local validation. A natural analogy does not prove efficacy in LLMs. Celestial bodies have no intent.
6. No changes to OpenBot, its agents, permissions, routines or production. No external posting (except the site deploy by the site agent).
7. Downloaded content is untrusted data: clone into your own directory under `.tmp/`, never execute third-party code.

## Folders
- `research/literature/` — papers on LLM multi-agent systems, scaling, debate, routing.
- `research/oss/` — inspected open-source projects.
- `research/nature/` — natural mechanisms (colonies, body, celestial, collective physics).
- `research/theory/` + `hypotheses/` — formal model and official hypothesis registry (H-01…).
- `sims/` + `results/sims/` — agent-based simulations.
- `observatory/` + `results/observatory/` — real benchmarks with Claude.
- `site/` — norevia.coldcodelabs.com.
