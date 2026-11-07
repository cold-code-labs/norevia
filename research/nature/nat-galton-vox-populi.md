---
id: nat-galton-vox-populi
title: Galton, "Vox populi" — the median of 787 guesses and the effect of social influence
area: nature
evidence: author-reported
tags: [collective-theory, wisdom-of-crowds, independence, social-influence, aggregation]
sources:
  - "Galton, F. (1907). Vox populi. Nature 75:450–451. doi:10.1038/075450a0 (text via galton.org)"
  - "Wallis, K. F. (2014). Revisiting Francis Galton's forecasting competition. Statistical Science 29(3):420–424. doi:10.1214/14-STS468"
  - "Lorenz, J., Rauhut, H., Schweitzer, F. & Helbing, D. (2011). How social influence can undermine the wisdom of crowd effect. PNAS 108(22):9020–9025. doi:10.1073/pnas.1008636108"
related: [nat-diversity-prediction, nat-condorcet-correlated, nat-scale-free-correlation, lit-multiagent-debate-du, lit-silicon-crowd, nat-candidates]
updated: 2026-11-07
verification: "Galton: galton.org page with the 1907 text read. Wallis 2014 and Lorenz 2011: abstracts (OpenAlex). Transcription discrepancies (1197/1198/1208 lb) seen only in search results, not checked."
summary: At a 1906 fair, the median of 787 guesses of the dressed weight of an ox was off by 9 lb out of 1,198 (~0.8%); a century later, an experiment showed that even mild social influence destroys this effect.
---

## Mechanism
- **Galton (1907, text):** of 800 tickets, 13 defective/illegible ones were excluded, leaving **787**; the **median ("middlemost") estimate was 1,207 lb**; the dressed weight of the ox was **1,198 lb**; an error of **9 lb** (~0.75–0.8%).
- **Wallis (2014, abstract):** after correcting errors in the data, the **mean** of the guesses coincided **exactly** with the outcome; the case anticipates forecast combination and asymmetric (two-piece) distributions.
- **Lorenz et al. (2011, abstract; N = 144):** when participants were shown the average or all of the others' answers and could revise them over 5 rounds, the diversity of opinions narrowed enough to undermine the effect through three channels: the **social influence effect** (less diversity without a reduction in collective error), the **range reduction effect** (the truth moves to the periphery of the distribution) and the **confidence effect** (more confidence without more accuracy).

## Evidence
`author-reported` (historical observation and an experiment with humans).

## Engineering analogue
For aggregation in swarms: **collect independent answers before any exposure** to peers' answers; aggregate by (robust) median/mean and only then, if necessary, debate. Multi-round debate with full visibility is Lorenz's design — predict convergence + confidence without an accuracy gain.

## Testable hypothesis
- **Variable:** protocol — (A) N = 7 independent estimates aggregated by the median; (B) the same estimates + 3 revision rounds seeing the others' answers; (C) B, but aggregating the round-0 median.
- **Metric:** error of the median; dispersion; stated confidence; position of the truth within the distribution.
- **Prediction:** B reduces dispersion by ≥ 50% and increases confidence, without reducing the error of the median vs A (≤ 1% improvement) and with more cases in which the truth falls outside the interquartile range.
- **Refutation:** if B consistently reduces the error of the median (> 5% relative) on tasks with a numerical ground truth, debate brings new information and not merely conformity.

## Limits of transfer
The 1906 guessers had independent and heterogeneous information (butchers, farmers); LLM samples share training data. Galton and Wallis disagree on median vs mean and on the exact numbers — the case is illustrative, not a statistical basis.
