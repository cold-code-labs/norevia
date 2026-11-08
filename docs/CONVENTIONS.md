# Norevia — content conventions (English, v2 · 2026-11-07)

Norevia is a **research project by Cold Code Labs**. Never write "Norevia Labs" or "NOREVIA LABS". Preferred forms: "Norevia", "Norevia — a Cold Code Labs research project". Project title: **"Bioinspired Agentic Swarms"**, subtitle **"Toward a General Theory of AI Swarm Efficiency"** (adopted 2026-11-08; replaces "Bioinspired Artificial Swarms"). First experimental object: LLM-based software agents. Do not call any multi-agent system a swarm: swarm behaviour requires observable local autonomy, adaptive interactions and distributed decisions. Always present the theory as a research goal, never as an established law.

All research content, code comments, user-facing strings and filenames are in **English**. Translations may come later; English is canonical.

## Translation rules
- Translate faithfully. Do not add, drop or "improve" claims, numbers, confidence intervals, caveats or evidence levels. Keep every source, DOI, arXiv id/version, commit SHA and `file:line` anchor byte-identical.
- Quotations from Portuguese sources stay in the original with an English translation in brackets.
- Keep the epistemic hedging exactly as strong as in the original.
- Proper names stay as they are. Biblical/religious references keep standard English names.
- Preregistration records (`results/sims/PREREGISTRATION.jsonl`) are historical: keep entries byte-identical (they contain the original Portuguese text and old ids).

## Frontmatter schema
```
---
id: nat-response-threshold
title: Response thresholds in social insects
area: nature | literature | oss | theory | hypothesis | simulation | observatory
evidence: natural-phenomenon | author-reported | observed-implementation | hypothesis | local-validation | gap
status: open | testing | preliminary-support | preliminary-refuted | inconclusive   # hypotheses only
tags: [division-of-labor, elastic-swarm]
sources: [...]
related: [H-03, sim-response-threshold]
updated: 2026-11-07
verification: ...        # was `verificacao`
summary: One sentence for the site.
---
```
Body sections (when present): Mechanism · Evidence · Engineering analogue · Testable hypothesis · Limits / gaps.

### Evidence level mapping
| old (pt) | new (en) | label on site |
|---|---|---|
| fenomeno-natural | natural-phenomenon | Natural phenomenon |
| relato-autores | author-reported | Author-reported |
| implementacao-observada | observed-implementation | Observed implementation |
| hipotese | hypothesis | Hypothesis |
| validacao-local | local-validation | Local validation |
| lacuna | gap | Gap |

Note: purely analytical results computed here (e.g. a closed-form Condorcet calculation) use `local-validation` only if a script in the repo produced them; the card body must say "analytical, not empirical".

### Hypothesis status mapping
aberta → open · em-teste → testing · suportada-preliminar → preliminary-support · refutada-preliminar → preliminary-refuted · inconclusivo → inconclusive.

## Id and file renames (apply everywhere: `id`, `related`, links, paths in text, code)
| old id | new id | old file | new file |
|---|---|---|---|
| lit-bibliografia | lit-bibliography | research/literature/BIBLIOGRAFIA.md | research/literature/BIBLIOGRAPHY.md |
| lit-sintese | lit-synthesis | research/literature/SINTESE.md | research/literature/SYNTHESIS.md |
| oss-matriz | oss-matrix | research/oss/MATRIZ.md | research/oss/MATRIX.md |
| oss-padroes | oss-patterns | research/oss/PADROES.md | research/oss/PATTERNS.md |
| nat-mapa | nat-map | research/nature/MAPA.md | research/nature/MAP.md |
| nat-candidatas | nat-candidates | research/nature/CANDIDATAS.md | research/nature/CANDIDATES.md |
| th-modelo | th-model | research/theory/MODELO.md | research/theory/MODEL.md |
| sim-relatorio | sim-report | results/sims/RELATORIO.md | results/sims/REPORT.md |
| sim-voto-correlacionado | sim-correlated-vote | sims/sim-voto-correlacionado.mjs, results/sims/sim-voto-correlacionado.{md,json} | sim-correlated-vote.* |
| sim-verificador | sim-verifier | sim-verificador.* | sim-verifier.* |
| sim-limiar-resposta | sim-response-threshold | sim-limiar-resposta.* | sim-response-threshold.* |
| sim-estigmergia | sim-stigmergy | sim-estigmergia.* | sim-stigmergy.* |
| sim-elastico | sim-elastic | sim-elastico.* | sim-elastic.* |
| sim-quorum | sim-quorum | (unchanged) | |
| sim-clonal | sim-clonal | (unchanged) | |
| H-xx | H-xx (ids unchanged) | hypotheses/H-01-correlacao-limita-voto.md … | English slug, e.g. H-01-correlation-caps-voting.md |
| — | — | results/sims/PREREGISTRO.jsonl | results/sims/PREREGISTRATION.jsonl (content unchanged) |
| — | — | research/theory/SAIDA-model.txt, SAIDA-testes.txt | MODEL-OUTPUT.txt, TEST-OUTPUT.txt |
| — | — | research/nature/calc/teoria-coletiva.js, saida-teoria-coletiva.txt | collective-theory.js, collective-theory-output.txt |

Other `lit-*`, `oss-*`, `nat-*` ids are already English and stay. Any Portuguese tag becomes an English kebab-case tag.

Renames are done with plain `mv` (the coordinator commits; agents do not run git).
