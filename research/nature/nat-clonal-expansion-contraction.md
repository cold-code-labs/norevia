---
id: nat-clonal-expansion-contraction
title: Clonal selection — massive expansion, 90–95% contraction and a small memory pool
area: nature
realm: unseen
evidence: natural-phenomenon
tags: [elastic-swarm, expansion-contraction, bounded-memory, return-to-baseline]
sources:
  - "Murali-Krishna, K., Altman, J. D., Suresh, M., Sourdive, D. J. D., Zajac, A. J., Miller, J. D., Slansky, J. & Ahmed, R. (1998). Counting antigen-specific CD8 T cells: a reevaluation of bystander activation during viral infection. Immunity 8(2):177–187. doi:10.1016/S1074-7613(00)80470-7"
  - "Kaech, S. M. & Cui, W. (2012). Transcriptional control of effector and memory CD8+ T cell differentiation. Nat. Rev. Immunol. 12:749–761. doi:10.1038/nri3307 (PMC4137483)"
  - "Kaech, S. M., Wherry, E. J. & Ahmed, R. (2002). Effector and memory T-cell differentiation: implications for vaccine development. Nat. Rev. Immunol. 2:251–262. doi:10.1038/nri778 (abstract)"
related: [nat-danger-theory, nat-wound-healing-resolution, nat-inactive-reserve, lit-agentnet, nat-candidates, sim-clonal]
updated: 2026-11-07
verification: "Murali-Krishna 1998: abstract (OpenAlex). Kaech & Cui 2012: author manuscript text (PMC4137483 via E-utilities), the 5–10% sentence checked. Kaech 2002: abstract only. Burnet (clonal selection theory, 1957) not consulted."
summary: In acute infection, specific T lymphocytes expand to ~2×10⁷ per spleen and, once the virus is cleared, ~90–95% die; the remaining 5–10% become stable memory that re-expands rapidly upon reinfection.
---

## Mechanism
- **Expansion (Murali-Krishna et al. 1998, LCMV in mice):** **50–70%** of activated CD8 T cells were virus-specific — about **2 × 10⁷ specific cells per spleen** at the peak.
- **Contraction:** after viral clearance, the number fell to **10⁶ per spleen** and **remained at that level for the life of the animal**. Upon reinfection with the same virus, memory cells underwent **rapid expansion**; infection with a heterologous virus did not alter these cells.
- **Surviving fraction (Kaech & Cui 2012):** after the pathogen is cleared, effector cells undergo a **precipitous contraction** in which most die by apoptosis, but **typically ~5–10% survive** and mature into memory cells. (Hence a contraction of ~90–95%, consistent with 2×10⁷ → 10⁶.)
- Expansion and contraction are antigen-**specific**: only the relevant clone grows.

## Evidence
`natural-phenomenon` (experimental immunology in mice).

## Engineering analogue
**Elastic swarm with memory:** when a verified problem (an "antigen") appears, clone the agent/configuration that solved something similar and expand only that clone; once the problem is resolved, **contract by ~90–95%** (terminate agents, release context) and retain **a small residue** (5–10%: recipe, prompt, test cases, effort configuration) that re-expands rapidly on recurrence. Expansion is guided by the **type** of problem, not generic.

## Testable hypothesis
- **Variable:** policy — (A) large permanent swarm; (B) expand/contract without memory; (C) expand/contract while retaining a compact "memory" (≤ 10% of the generated context/artefacts) indexed by problem type.
- **Metric:** cost per acceptance in a sequence with recurring problems (≥ 30% recurrence); time to acceptance on the 2nd occurrence; size of the retained memory.
- **Prediction:** C reduces time to acceptance on recurrence by ≥ 40% vs B and total cost by ≥ 30% vs A, with memory ≤ 10% of the generated material.
- **Refutation:** if compact memory does not speed up recurrences (≥ 40%), or if re-expansions from it make more errors ("autoimmune" memory — applying an old recipe to a similar-looking new problem).

## Limits of transfer
Memory cells are physical copies of the selected clone; LLM "memory" is retrieved text, subject to faulty retrieval. Clonal selection has tolerance mechanisms (against self-reactivity) that have no automatic equivalent in agents.
