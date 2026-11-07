---
id: nat-colony-size-scaling
title: Colony size, per-capita efficiency and specialization
area: nature
evidence: natural-phenomenon
tags: [scaling, group-size, specialization, per-capita-efficiency, macro-swarm]
sources:
  - "Hou, C., Kaspari, M., Vander Zanden, H. B. & Gillooly, J. F. (2010). Energetic basis of colonial living in social insects. PNAS 107(8):3634–3638. doi:10.1073/pnas.0908071107 (PMC2840457)"
  - "Holbrook, C. T., Barden, P. M. & Fewell, J. H. (2011). Division of labor increases with colony size in the harvester ant Pogonomyrmex californicus. Behavioral Ecology 22(5):960–966. doi:10.1093/beheco/arr075"
  - "Dornhaus, A., Powell, S. & Bengston, S. (2012). Group size and its effects on collective organization. Annu. Rev. Entomol. 57:123–141. doi:10.1146/annurev-ento-120710-100604"
  - "Michener, C. D. (1964). Reproductive efficiency in relation to colony size in hymenopterous societies. Insectes Sociaux 11:317–341. doi:10.1007/BF02227433 (bibliography only)"
related: [nat-recruitment-benefit-conditions, nat-response-threshold, lit-scaling-agent-systems, lit-more-agents, nat-candidates]
updated: 2026-11-07
verification: "Hou 2010: text via PMC (numbers below). Holbrook 2011 and Dornhaus 2012: abstracts (OpenAlex). Michener 1964: metadata only — the idea that per-capita reproductive efficiency declines with colony size was NOT checked in the text."
summary: Whole-colony metabolism scales sublinearly with mass (exponent ≈ 0.75–0.81), and larger colonies show more division of labor — but clean data on per-capita efficiency are lacking.
---

## Mechanism
- **Metabolic scaling (Hou et al. 2010, PMC):** whole-colony metabolic rate (corrected) versus colony mass had an observed exponent of **0.81** (95% CI **0.55–1.08**; r² = 0.82; **12 colonies** of ants, termites, bees and wasps), statistically indistinguishable from the predicted **0.75** — but also from 1. Intraspecific exponents ranged from 0.44 to 0.94. The broader study covers 168 species. If the exponent is < 1, expenditure **per individual falls** with size (my inference, not a direct result: ∝ N^(−0.25) to N^(−0.19)).
- **Division of labor (Holbrook et al. 2011):** larger colonies of *P. californicus* showed **more individual specialization** and more division of labor, independently of colony age; **no effect of size on per-capita activity**; the changes correlated with the **encounter rate** among nestmates.
- **Review (Dornhaus et al. 2012):** there is a **surprising lack of data** on group sizes and many confounders; size may be to a colony what body size is to an organism, but rigorous controls are needed.

## Evidence
`natural-phenomenon` with mixed evidence and a wide CI; per-capita → partial `gap`.

## Engineering analogue
When moving from a micro-swarm (2–3) to a macro-swarm (10+), expect that: (i) **specialization** pays off only above a minimum size; (ii) coordination cost per agent may fall (sublinearly) **if** there is shared infrastructure (state, verifier), or rise if coordination is pairwise. The right measure is cost and acceptance **per agent and per task**, as a function of N.

## Testable hypothesis
- **Variable:** N ∈ {1, 2, 3, 5, 8, 13} and mode (identical generalists vs specialised roles) on multi-bug tasks.
- **Metric:** acceptances per 1M tokens; exponent b of total_cost ∝ N^b fitted on a log-log scale; specialization gain = acceptance(spec.) − acceptance(gen.).
- **Prediction:** (a) there is an N_e (≈ 3–5) below which specialization does not improve acceptance (|Δ| < 2 pp) and above which it does; (b) with coordination via shared state, b < 1; with pairwise coordination (everyone reads everyone), b > 1.
- **Refutation:** if specialization already helps at N = 2 or never helps up to N = 13; if b does not depend on the coordination mode.

## Limits of transfer
The metabolic exponent concerns steady-state energy, not decision quality; the CI (0.55–1.08) does not exclude linear scaling. Colonies grow through ontogeny; swarms are assembled instantaneously. Do not use 0.75 as a "law" for LLMs.
