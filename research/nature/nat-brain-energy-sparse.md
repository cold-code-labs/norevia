---
id: nat-brain-energy-sparse
title: The brain's energy budget and sparse coding
area: nature
realm: unseen
evidence: natural-phenomenon
tags: [sparsity, budget, sparse-activation, unit-cost, macro-swarm]
sources:
  - "Raichle, M. E. & Gusnard, D. A. (2002). Appraising the brain's energy budget. PNAS 99(16):10237–10239. doi:10.1073/pnas.172399499 (PMC124895)"
  - "Attwell, D. & Laughlin, S. B. (2001). An energy budget for signaling in the grey matter of the brain. J. Cereb. Blood Flow Metab. 21(10):1133–1145. doi:10.1097/00004647-200110000-00001"
  - "Lennie, P. (2003). The cost of cortical computation. Current Biology 13(6):493–497. doi:10.1016/S0960-9822(03)00135-0"
  - "Levy, W. B. & Baxter, R. A. (1996). Energy efficient neural codes. Neural Computation 8(3):531–543. doi:10.1162/neco.1996.8.3.531"
  - "Olshausen, B. A. & Field, D. J. (1996). Emergence of simple-cell receptive field properties by learning a sparse code for natural images. Nature 381:607–609. doi:10.1038/381607a0"
related: [nat-renal-filtration, nat-response-threshold, lit-mixture-of-agents, lit-routellm, nat-candidates]
updated: 2026-11-07
verification: "Raichle & Gusnard: PMC page read (OpenAlex returned a mismatched abstract — discarded). Attwell & Laughlin, Lennie, Levy & Baxter, Olshausen & Field: abstracts (OpenAlex/Europe PMC)."
summary: The brain accounts for ~2% of body weight and consumes ~20% of the oxygen; because every spike is costly, only a small fraction of neurons (≤15%, perhaps <1%) can be highly active at the same time.
---

## Mechanism
- **Budget (Raichle & Gusnard 2002):** in the average adult, the brain represents **~2% of body weight** and accounts for **~20% of the oxygen** and hence of the calories consumed. Local changes in blood flow during cognitive tasks are typically **≤ 5%** — most of the expenditure is ongoing activity.
- **Where the energy goes (Attwell & Laughlin 2001, rodent cortex):** action potentials **47%**, postsynaptic effects of glutamate **34%**, resting potential **13%**, glutamate recycling **3%**. +1 AP/neuron/s raises O₂ consumption by 145 mL/100 g/h. Prediction: distributed codes with **≤ 15% of neurons simultaneously active**.
- **Lennie (2003):** given the cost of each spike and the known energy consumption of the human cortex, possibly **fewer than 1%** of neurons can be substantially active at the same time; this requires codes with very few active neurons and **flexible allocation** of energy across regions according to demand (selective attention).
- **Levy & Baxter (1996):** codes with greater representational capacity are not optimal once energy is accounted for; a higher cost per neuron implies a **lower mean firing rate** for efficient transmission.
- **Olshausen & Field (1996):** maximising sparseness is sufficient for receptive fields resembling those of V1 to emerge; a sparse code has statistically more independent outputs.

## Evidence
`natural-phenomenon` + theoretical estimates (`author-reported`) for the fractions of active neurons.

## Engineering analogue
In a macro-swarm, **sparse activation**: many specialists available, **few active per task** (k ≪ N), selected by routing; the dominant cost is "firing" (each call), not "existing" (idle agents without context cost ~0). Selective attention = allocating budget to whoever the task requires. Sparsity also brings **independence** between outputs (a benefit for aggregation).

## Testable hypothesis
- **Variable:** k active out of N = 12 specialists per task (k ∈ {1, 2, 3, 6, 12}), routed by a cheap selector.
- **Metric:** acceptance; cost per acceptance; error correlation among the active agents.
- **Prediction:** k = 2–3 reaches acceptance ≥ (k = 12) − 2 pp at ≤ 25% of the cost; the mean error correlation among active agents is lower with a small routed k than with k = 12 (routed agents differ more from one another).
- **Refutation:** if acceptance grows approximately linearly up to k = 12, or if the selector errs so often that small k loses > 5 pp.

## Limits of transfer
Neural cost is metabolic and the brain cannot "pay more" on demand; token budgets can. The 15% and 1% fractions are theoretical estimates resting on strong assumptions. Neural sparsity is intra-system; LLM agents are whole systems.
