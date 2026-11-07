---
id: nat-informed-leaders
title: A few informed individuals guide large groups; uninformed ones return control to the majority
area: nature
evidence: author-reported
tags: [leadership, asymmetric-information, verifier, opinionated-minority, how-much-to-cooperate]
sources:
  - "Couzin, I. D., Krause, J., Franks, N. R. & Levin, S. A. (2005). Effective leadership and decision-making in animal groups on the move. Nature 433:513–516. doi:10.1038/nature03236"
  - "Couzin, I. D., Ioannou, C. C., Demirel, G., Gross, T., Torney, C. J., Hartnett, A., Conradt, L., Levin, S. A. & Leonard, N. E. (2011). Uninformed individuals promote democratic consensus in animal groups. Science 334(6062):1578–1580. doi:10.1126/science.1210280"
related: [nat-small-groups-correlated-cues, nat-quorum-nest-bees, lit-debate-or-vote, lit-multiagent-debate-du, nat-candidates, sim-verifier]
updated: 2026-11-07
verification: "Couzin 2005: full text extracted from PDF (Princeton course archive cs/COS597C). Couzin 2011: abstract read (OpenAlex). Figure values (e.g. % informed by N) not extracted → gap."
summary: Without signalling and without knowing who knows, moving groups follow a small informed minority — one that is proportionally smaller the larger the group; and individuals without an opinion protect the majority against an extreme minority.
---

## Mechanism
- **Couzin et al. 2005 (model):** individuals follow repulsion/alignment/attraction rules; a proportion p receives a preferred direction g, with weight ω. Result (text): for a given group size, accuracy increases with p; **the larger the group, the smaller the proportion of informed individuals required** for a given accuracy; for sufficiently large groups, **a very small proportion** suffices for near-maximal accuracy. There is a **trade-off** between movement accuracy and the probability of group **fragmentation** as ω increases.
- With two informed subsets holding different preferences: if the preferences differ little, the group follows their average; if they differ greatly, it selects one of them; if one subset is larger, the group follows the **majority, even a small one**. Feedback on ω (reinforcement when the individual moves in its preferred direction, within 20°) allows consensus instead of averaging.
- **Couzin et al. 2011 (theory + experiment, abstract):** a strongly opinionated minority can dictate the group's choice, but the presence of **uninformed individuals spontaneously inhibits** this effect and **returns control to the numerical majority**.
- Exact percentages (e.g. the proportion of informed individuals for N = 200) are in figures → `gap`.

## Evidence
`author-reported` (2005 model; 2011 theory + experiment — the experiment was not checked).

## Engineering analogue
"Informed" = an agent with **verifiable evidence** (ran the test, read the log, has the tool); "uninformed" = an agent that only aggregates. (i) In a large swarm, a few agents with access to tools/a verifier can steer the decision without the others knowing who they are — it suffices that evidence carries weight. (ii) Neutral/aggregating agents can dilute an overconfident, wrong agent.

## Testable hypothesis
- **Variable:** fraction f ∈ {0, 1/12, 2/12, 4/12, 1} of agents with access to a verification tool in a swarm of N = 12; presence of 1 wrong, highly confident "stubborn" agent; with/without 4 neutral agents holding no initial opinion.
- **Metric:** accuracy of the group decision; cost (tools are expensive).
- **Prediction:** accuracy saturates at f ≤ 2/12 (≥ 90% of the gain of f = 1 at ≤ 17% of the tool cost); with the stubborn agent present, neutral agents reduce the rate of capture by the stubborn agent by ≥ 30%.
- **Refutation:** if accuracy grows linearly up to f = 1 (no saturation), or if neutral agents **increase** capture (neutral LLMs tend to follow the most confident one — a real risk of sycophancy).

## Limits of transfer
In the model, information is a continuous direction and influence is geometric; in LLMs, persuasion depends on rhetoric and stated confidence, not on the quality of the evidence — unless the protocol enforces verifiable evidence. The 2011 effect depends on the uninformed being unbiased; LLMs have shared biases.
