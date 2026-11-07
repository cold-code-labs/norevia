---
id: lit-debate-or-vote
title: "Debate or Vote (Choi, Zhu & Li, NeurIPS 2025) — majority voting explains most of the gain from debate"
area: literature
evidence: author-reported
tags: [debate, majority-voting, martingale, theory, conformity, ensemble]
sources:
  - "Choi, H. K., Zhu, X. & Li, S. (2025). Debate or Vote: Which Yields Better Decisions in Multi-Agent Large Language Models? arXiv:2508.17536v2 (23 Oct 2025; v1 24 Aug 2025). arXiv comment: 'NeurIPS 2025 Spotlight'. doi:10.48550/arXiv.2508.17536. https://arxiv.org/abs/2508.17536v2"
related: [lit-multiagent-debate-du, lit-stop-overvaluing-mad, lit-should-we-be-going-mad, lit-debate-routing-matched-ceiling]
updated: 2026-11-07
primary_opened: true
version: "v2 (2025-10-23)"
summary: Decomposing debate into voting + interaction, 5-agent majority voting beats every debate variant tested, and a theoretical model shows that debate alone is a martingale — it does not increase expected correctness.
---

## Question
Does the gain of multi-agent debate (MAD) come from the exchange of arguments between agents or simply from the ensemble (majority vote) of several answers?

## Method
- Decomposition: majority voting (MV) is the T=0 case of debate; debate adds T update rounds (T = 2, 3, 5).
- N = 5 agents; Qwen2.5-7B-Instruct and Llama3.1-8B-Instruct (Table 1); Qwen2.5-32B on GSM8K and HellaSwag (Table 3); temperature 1.0, top-p 0.9, max. 512 tokens (Appendix A.1).
- 7 benchmarks: Arithmetics, GSM8K, MMLU Professional Medicine, MMLU Formal Logic, HellaSwag, CommonsenseQA, HH-RLHF.
- Debate topologies: decentralized, sparse, centralized.
- Theory: agents as Dirichlet-Compound-Multinomial; debate as Bayesian updating of counts.

## Reported result
Table 1 (mean over the 7 benchmarks):

| Model | Single agent | Majority vote | Best MAD |
|---|---|---|---|
| Qwen2.5-7B | 0.7205 | **0.7691** | 0.7377 (Decentralized T=2) |
| Llama3.1-8B | 0.6203 | **0.7242** | 0.6990 (Sparse T=2) |

- MV beats every MAD variant on average for both models; MAD wins in isolated cases (e.g., Formal Logic 0.5556 vs 0.5397). Centralized MAD is the worst (Qwen 0.6551–0.6672).
- More rounds tend to worsen vanilla MAD (Table 2, Qwen, decentralized: T=2 0.7332; T=3 0.7112; T=5 0.7084).
- Qwen2.5-32B (Table 3): GSM8K MV 0.9433 vs best MAD 0.9400; HellaSwag tie 0.8667.
- **Theorem 2 (martingale):** under the condition that the neighbors' mean belief equals the agent's, the expected belief in the correct answer is constant across rounds — debate alone does not improve expected correctness. Fig. 4 shows essentially flat mean-accuracy trajectories.
- **Theorem 1:** if N > K/Δ², P(MV correct) ≥ 1 − exp(−N(Δ/√K − 1/√N)²) — voting improves exponentially with N when there is a margin Δ.
- Interventions that bias toward correctness (Table 2, Qwen, mean): vanilla Dec. T=2 0.7332 → Conformist 0.7625 → Follower 0.7629 → Oracle 0.8236 (oracle uses the answer key; not deployable). Neither Conformist nor Follower beats MV (0.7691).
- Different personas on the same model (Table 4): MV 0.9367 on GSM8K (best); on MMLU Pro. Med., decentralized MAD 0.8419 > MV 0.8235 — the only signal of value from diversity.

## Cost/compute considered?
Not explicitly. The paper does not match tokens/generations. Given the protocol (MV = round 0 of debate), MAD with T rounds uses ~(T+1)×N generations versus N for voting — **our inference from the design**, not a number from the paper. Hence, voting wins while using less compute.

## Threats to validity
- Small models (7–8B) and one 32B; no frontier models or reasoning models.
- Theorem 2 depends on a homogeneity condition (Eq. 1); the paper claims an extension to heterogeneous agents in Appendix D.4 (not verified by us).
- Heterogeneity tested only as personas, not as different models.
- Internal inconsistency: MAD Dec. T=2 = 0.7377 in Table 1 and 0.7332 in Table 2; the text speaks of "six" tasks and the abstract of seven.

## Relevance to the central question
Perhaps the most direct result against "interaction between agents generates collective intelligence" for homogeneous agents: **the value comes from aggregating independent samples, not from the conversation**. For Norevia: a homogeneous micro-swarm should start as sampling + voting; interaction only if there is a signal that biases toward correctness (verifier, test, partial oracle). The theorem gives mathematical form to "debate without new information is a random walk in belief".

## Candidate hypotheses
- candidate: for homogeneous agents without a verifier, iterative cooperation has an expected gain of ~0 over voting; every gain requires a source of asymmetry (external verifier, different model, tool).
- candidate: the return from voting follows the Hoeffding bound — it depends on the individual agent's margin Δ; when Δ ≤ 0 (wrong majority), more agents make it worse.
- candidate: extra debate rounds without a correctness signal degrade (T=2 > T=3 > T=5).

## Verification
- Opened on 2026-11-07: https://arxiv.org/abs/2508.17536 and https://arxiv.org/abs/2508.17536v2 (versions, comment "NeurIPS 2025 Spotlight"); https://arxiv.org/html/2508.17536v2 (first 100 thousand characters: setup, Tables 1–5, theorems).
- Gap: the last ~21 thousand characters of the HTML (probably final appendices/limitations) were not read; NeurIPS proceedings page not checked; Appendix D.4 not verified.
