---
id: nat-hong-page-critique
title: "Does diversity trump ability?" — Hong & Page (2004) and its critiques
area: nature
realm: seen
evidence: author-reported
tags: [collective-theory, diversity, group-composition, identical-copies, critique]
sources:
  - "Hong, L. & Page, S. E. (2004). Groups of diverse problem solvers can outperform groups of high-ability problem solvers. PNAS 101(46):16385–16389. doi:10.1073/pnas.0403723101"
  - "Thompson, A. (2014). Does diversity trump ability? An example of the misuse of mathematics in the social sciences. Notices of the AMS 61(9):1024ff. doi:10.1090/noti1163"
  - "Grim, P., Singer, D. J., Bramson, A., Holman, B., McGeehan, S. & Berger, W. J. (2019). Diversity, ability, and expertise in epistemic communities. Philosophy of Science 86(1):98–123. doi:10.1086/701070"
related: [lit-hong-page-diversity, nat-diversity-prediction, nat-condorcet-correlated, lit-great-models-think-alike, nat-candidates]
updated: 2026-11-07
verification: "Hong & Page: abstract. Thompson 2014: text extracted from PDF (copy at users.wfu.edu; ams.org returned 403). Grim 2019: abstract. Page's reply ('Ability can trump diversity…') seen only in search results — not read."
summary: Hong & Page found, in a model, that random teams outperform teams of the "best" problem solvers; Thompson showed that the theorem depends on copies of the best agent being identical and that the maximally diverse group did worse than the median of the random ones — the useful lesson concerns redundant copies, not diversity per se.
---

## Mechanism
- **Hong & Page (2004, abstract):** agents with representations and search heuristics; when a team is selected from a large, diverse population, a **random** team outperforms a team of the **individually best** agents, because the best become **similar** in the space of problem solvers — their greater ability is more than offset by their lack of diversity.
- **Thompson (2014, text):** (i) "Theorem 1" concerns maximising a function on a finite set and requires the assumption that **multiple copies of an agent act identically to a single copy**; hence "we should not be surprised" that a group containing the best agent plus others outperforms a group of **identical copies** of the best; (ii) the theorem is said to be **unrelated** to the computational experiment and **without real-world application**; (iii) in Thompson's reanalysis, a **maximally diverse** group performed **worse than the median of 200 random groups of 10 agents** — the advantage comes from random selection, not from measured "diversity".
- **Grim et al. (2019, abstract):** extending the model to landscapes with different degrees of randomness, the "diversity trumps ability" result is **sensitive** to the conditions; the authors caution against broad interpretation.

## Evidence
`author-reported` (models and mathematical critiques; an open dispute). See also `lit-hong-page-diversity` (literature agent).

## Engineering analogue
The assumption criticised by Thompson is **literally true** for deterministic LLMs: N copies of the same model, prompt and temperature 0 = 1 agent. The transferable lesson is narrow and useful: **redundant copies do not add up**; what adds up is coverage of distinct heuristics/paths. It does not follow that "more diverse" is always better (Thompson's reanalysis contradicts this).

## Testable hypothesis
- **Variable:** a team of 5 agents — (A) 5 copies of the best agent (same model/prompt, low temperature); (B) 5 drawn at random from a pool of configurations; (C) 5 chosen to maximise an output-diversity metric; (D) top 5 by individual performance on calibration.
- **Metric:** fraction of search tasks (e.g. finding a failing input, optimisation) solved by at least one member (coverage), and cost.
- **Prediction:** A ≈ 1 agent (gain < 2 pp); B and D outperform A; C does **not** systematically outperform B (consistent with Thompson).
- **Refutation:** if C outperforms B and D by a wide margin (> 5 pp) across several domains, Thompson's critique does not transfer to LLMs; if A outperforms 1 agent by > 5 pp, the copies are not redundant (useful stochasticity).

## Limits of transfer
Hong & Page's model uses a ring of 2,000 positions and step heuristics; its generality is disputed. Public discussion of the topic is highly politically charged — this card deals only with the mathematics and with the transfer to agent composition.
