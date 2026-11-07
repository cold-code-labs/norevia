---
id: lit-routellm
title: 'RouteLLM — learned router between a strong and a weak model'
area: literature
evidence: author-reported
tags: [routing, cost, adaptive-activation, human-preferences]
sources:
  - "Ong, I., Almahairi, A., Wu, V., Chiang, W.-L., Wu, T., Gonzalez, J. E., Kadous, M. W. & Stoica, I. (2025). RouteLLM: Learning to Route LLMs from Preference Data. ICLR 2025. https://proceedings.iclr.cc/paper_files/paper/2025/hash/5503a7c69d48a2f86fc00b3dc09de686-Abstract-Conference.html"
  - "Preprint: arXiv:2406.18665v4 (23 Feb 2025), title 'RouteLLM: Learning to Route LLMs with Preference Data'. https://arxiv.org/abs/2406.18665v4 · doi:10.48550/arXiv.2406.18665"
related: [lit-frugalgpt, lit-nothinking]
updated: 2026-11-07
primary_opened: true
version: "v4 (23 Feb 2025); v1 26 Jun 2024"
summary: A cheap router trained on human preferences decides before generation whether the query goes to GPT-4 or to Mixtral, cutting calls to the strong model by up to ~3.7× on MT Bench, but with small gains on MMLU/GSM8K.
---

## Question
Can one predict, **before** generating, whether a query needs the strong (expensive) model or whether the weak one suffices, and thereby reduce cost while maintaining quality?

## Method
Binary routing (strong = gpt-4-1106-preview; weak = Mixtral-8x7B) with a threshold on the predicted probability that the strong model wins (Sec. 3–5). Four routers: similarity-weighted (SW) ranking, matrix factorization (MF), BERT classifier, causal LLM classifier (Sec. 4.2). Training on Chatbot Arena preferences + augmentations (≈1,500 MMLU validation samples; ≈120 thousand labels judged by GPT-4, cost ≈US$700). Metrics (Sec. 3.2): PGR (fraction of the weak→strong gap recovered), APGR (average over 10 cost points), CPT(x%) (minimum % of calls to the strong model to reach x% PGR). Baseline: random router.

## Reported result
- MT Bench (Table 1): CPT(50%) random 49.03% vs MF (Arena+Judge) 13.40%; APGR 0.802 (+60.4%). CPT(80%): 78.08% → 31.31%. Caption: cost reduction "up to 75%" vs random.
- MMLU (Table 2): CPT(50%) 50.07% → ~35.4% (Arena+Gold); with Arena only, routers are ≈ or below random.
- GSM8K (Table 3): CPT(50%) 50.00% → 33.64% (causal LLM, Arena+Judge); APGR 0.622.
- Savings vs random (Table 6): MT Bench 3.66× (CPT50) / 2.49× (CPT80); MMLU 1.41× / 1.14×; GSM8K 1.49× / 1.27×.
- Transfer without retraining (Table 4): Claude 3 Opus/Sonnet APGR 0.772; Llama 3.1 70B/8B APGR 0.767.
- Overhead (Table 7): MF US$3.32 per million requests; SW ranking ≤0.4% of GPT-4 generation cost.

## Cost/compute considered?
Yes: calls to the strong model as a cost proxy, plus the router's own cost/throughput. Router latency measured; cost of generating labels (≈US$700) reported.

## Threats to validity
Only two models (multi-model routing is future work, Sec. 6); sparse preference labels (<0.1% per pair); no router is best on all benchmarks, without a clear explanation; the real query distribution may differ; gains depend heavily on in-distribution data (MMLU-golden, GPT-4-judge). Venue: arXiv does not state ICLR; the ICLR 2025 record was confirmed in the proceedings with a slightly different title ("from" vs "with").

## Relevance to the central question
It is the simplest form of "Adaptive Swarm Activation": deciding **how much model** to use before spending. It shows that the routing gain depends on the domain (large in open chat, small on MMLU/GSM8K) and on in-distribution training data. It does not address N agents or reasoning effort, but the design (cheap router + adjustable cost threshold) is directly transferable to choosing between "1 agent / micro-swarm / high reasoning".

## Candidate hypotheses
- candidate: the advantage of a pre-generation router over random grows with the difficulty heterogeneity of the queries and shrinks on benchmarks of homogeneous difficulty.
- candidate: pre-generation routers (without seeing the answer) have a lower ceiling than post-generation cascades (with a verifier), but ~0 decision cost; the optimal choice depends on the relative cost of the first attempt.
- candidate: a "configuration" router (1 agent vs N vs high reasoning) requires per-configuration win labels — the Norevia Observatory can produce them.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2406.18665 (metadata), https://arxiv.org/html/2406.18665v4 (text, tables 1–7), ICLR 2025 proceedings page above. Code not inspected.
