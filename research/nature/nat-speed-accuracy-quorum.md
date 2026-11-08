---
id: nat-speed-accuracy-quorum
title: Speed–accuracy trade-off with a tunable quorum threshold (Temnothorax ants)
area: nature
realm: seen
evidence: natural-phenomenon
tags: [quorum, speed-accuracy, tunable-parameter, urgency, how-much-to-cooperate]
sources:
  - "Franks, N. R., Dornhaus, A., Fitzsimmons, J. P. & Stevens, M. (2003). Speed versus accuracy in collective decision making. Proc. R. Soc. Lond. B 270:2457–2463. doi:10.1098/rspb.2003.2527"
  - "Pratt, S. C. & Sumpter, D. J. T. (2006). A tunable algorithm for collective decision-making. PNAS 103(43):15906–15910. doi:10.1073/pnas.0604801103 (PMC1635101)"
  - "Pratt, S. C. (2005). Quorum sensing by encounter rates in the ant Temnothorax albipennis. Behavioral Ecology 16(2):488–496. doi:10.1093/beheco/ari020"
  - "Pratt, S. C., Mallon, E. B., Sumpter, D. J. T. & Franks, N. R. (2002). Quorum sensing, recruitment, and collective decision-making during colony emigration by the ant Leptothorax albipennis. Behav. Ecol. Sociobiol. 52:117–127. doi:10.1007/s00265-002-0487-x (bibliography only)"
  - "Chittka, L., Skorupski, P. & Raine, N. E. (2009). Speed–accuracy tradeoffs in animal decision making. Trends Ecol. Evol. 24(7):400–407. doi:10.1016/j.tree.2009.02.010"
related: [nat-quorum-nest-bees, nat-reflex-vs-cortex, lit-early-stopping-sc, nat-candidates, sim-quorum]
updated: 2026-11-07
verification: "Abstracts of Franks 2003, Pratt 2005 and Chittka 2009 read. Pratt & Sumpter 2006: full text read via PMC (numbers below). Pratt 2002: metadata only."
summary: Ants lower the quorum when their nest has been destroyed (they decide in ~1/6 of the time, but are less accurate) and raise it when there is time — a single algorithm, with a parameter tuned to urgency.
---

## Mechanism
- *Temnothorax* colonies choose a new nest by **quorum**: only when a candidate site contains enough nestmates do recruiters switch from slow *tandem runs* to rapid transport of the colony (Pratt 2005).
- **The quorum is sensed through the encounter rate** (Pratt 2005): preventing tactile contact made the ants behave as if the nest were empty; reducing nest size (more encounters with the same population) brought the switch forward. The switch occurred at the **same encounter rate** regardless of nest size; after the switch, visits shorten by ~**2 min** — interpreted as the quorum-detection time.
- **Tuning to urgency (Franks 2003, abstract):** under adverse conditions colonies choose faster and discriminate less; the errors are errors of *judgment* (all alternatives had already been discovered), not of omission. The ants **lower the quorum threshold** and rely more on individual decision-making.
- **Numbers (Pratt & Sumpter 2006, *T. curvispinosus*, full text):** quorum in forced emigration (nest destroyed) **5.7 ± 0.5** ants vs **12.7 ± 0.6** in unforced emigration. Time predicted by the model to abandon the nest: **87 ± 77 min** (forced) vs **565 ± 314 min** (unforced). Fraction of the colony that ended up in the good nest (observed): **65 ± 32%** (forced) vs **90 ± 18%** (unforced). Search and acceptance rates were also higher in the forced case.
- Chittka et al. (2009) generalize: obtaining high-quality information requires more sampling time, especially under noise.

## Evidence
`natural-phenomenon` (laboratory experiments) + `author-reported` (model with fitted parameters).

## Engineering analogue
The **quorum threshold k** (and the exploration rate) as an explicit parameter of a single decision algorithm, tuned by the **urgency/cost of delay** and the **cost of error** declared in the task. A "hi" or an urgent task → low k (down to k = 1, individual decision); an irreversible change in production → high k. The encounter rate suggests estimating the quorum **by local sampling** instead of counting global votes.

## Testable hypothesis
- **Variable:** k ∈ {1, 2, 3, 5} and the task's cost ratio C_error/C_time.
- **Metric:** expected utility = accuracy × value − token cost − latency cost; accuracy × cost Pareto frontier.
- **Prediction:** the accuracy(k) curve is concave and saturates; the optimal k grows monotonically with C_error/C_time. A controller that chooses k by the declared ratio stays ≤ 5% below the a posteriori optimal k in utility.
- **Refutation:** if accuracy(k) does not saturate up to k = 5 (linear gain) or if the optimal k does not depend on the cost ratio, the parallel does not hold; if the controller stays > 10% below the optimum, the rule is useless in practice.

## Limits of transfer
In ants, deciding wrongly costs the nest, and the rule was selected by evolution; in LLMs, the cost of error has to be declared or estimated. Physical encounters are largely independent of one another; correlated LLM votes can inflate the perceived "quorum".
