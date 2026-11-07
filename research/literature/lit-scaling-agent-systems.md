---
id: lit-scaling-agent-systems
title: Towards a Science of Scaling Agent Systems — when multi-agent architectures help or hurt
area: literature
evidence: author-reported
tags: [scaling-law, single-vs-multi, capability-saturation, error-amplification, overhead, architecture]
sources:
  - "Kim, Y., Gu, K., Park, C., Park, C., Schmidgall, S., Heydari, A. A., Yan, Y., Zhang, Z., Zhuang, Y., Liu, Y., Malhotra, M., Liang, P. P., Park, H. W., Yang, Y., Xu, X., Du, Y., Patel, S., Althoff, T., McDuff, D. & Liu, X. (2025/2026). Towards a Science of Scaling Agent Systems. arXiv:2512.08296v3. doi:10.48550/arXiv.2512.08296. https://arxiv.org/abs/2512.08296v3"
  - "Authors' blog (secondary, not used for numbers): https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/"
related: [lit-macnet, lit-sas-vs-mas-hybrid, lit-sas-equal-thinking-budget, lit-more-llm-calls]
updated: 2026-11-07
primary_opened: true
version: "v3 (8 Apr 2026); v1 9 Dec 2025; v2 17 Dec 2025"
summary: Across 260 configurations with a matched token budget, multi-agent ranges from +80.8% to −70% relative to the single agent depending on the task, with negative returns when the single agent already exceeds about 45% accuracy.
---

## Question
Are there quantitative principles that predict when a multi-agent architecture outperforms the single agent (SAS), given model capability, task and coordination?

## Method
Six agentic benchmarks: BrowseComp-Plus, Finance-Agent, PlanCraft, WorkBench, SWE-bench Verified and Terminal-Bench (the last two on subsets of 20 instances). Nine models from three families: GPT-5-nano/mini/5, Gemini-2.0 Flash/2.5 Flash/2.5 Pro and Claude Sonnet 3.7/4/4.5. Five architectures: SAS, Independent (parallel, synthesis only), Centralized (orchestrator), Decentralized (all-to-all debate) and Hybrid. There are 260 configurations with 50–100 instances each on the four main benchmarks. Budget matched in total reasoning tokens (mean of 4,800 per attempt) and equal tool access (Sec. 4.1, 4.4, Table 5). Regression with standardized predictors: capability, no. of tools, SAS baseline, overhead, message density, redundancy, efficiency and error amplification (Tables 3–4).

## Reported result
- Task dependence (Sec. 4.2, Fig. 2): Finance-Agent Centralized +80.8% (0.631 vs 0.349 for the SAS). PlanCraft Independent −70.0%, Centralized −50.3%, Hybrid −39.1%. BrowseComp-Plus Decentralized +9.2%. SWE-bench Verified: all MAS negative (−2.1% to −14.9%). Terminal-Bench Centralized −19.2%. Overall MAS mean −0.3% (95% CI from −58.7% to +77.2%).
- Capability saturation: "coordination yields diminishing returns beyond ∼45% single-agent baselines" (Conclusion). The interaction P_SA × log(1+n_a) has β = −0.236 (p = 0.004; Table 4). The authors call it "the most robustly supported result"; in Sec. 4.5, the threshold is correct for 94% of the 16 SWE-bench and Terminal-Bench configurations.
- Trace-level error amplification (Table 5): SAS 1.0; Independent 17.2; Decentralized 7.8; Hybrid 5.1; Centralized 4.4. The main effect is not significant after controls (p = 0.658).
- Efficiency (Table 5): successes per 1K tokens: SAS 67.7; Independent 42.4; Decentralized 23.9; Centralized 21.5; Hybrid 13.6. Turn overhead: 0% (SAS), 58%, 263%, 285% and 515%. Turns grow as T = 2.72·(n+0.5)^1.724 (R² = 0.974).
- Model fit: R²_CV = 0.373 (±0.170) with Intelligence Index and 0.413 with a task-anchored capability metric (Table 3). It selects the best architecture in 87% of held-out configurations.
- Out of sample (GPT-5.2, Gemini-3.0 Pro/Flash on BrowseComp-Plus): MAE = 0.077 over 15 predictions; 11 of 15 finding-model pairs validated.
- Number of agents: preliminary exploration up to 9 (n_a ∈ {1,3,5,7,9}; Fig. 5). Above 3–4 agents, per-agent quality drops sharply under a fixed budget.
- Heterogeneous models (13 configurations on BrowseComp-Plus): mixing models does not circumvent saturation. Heterogeneous Centralized is on average 12.6 pp below the strong homogeneous one.

## Cost/compute considered?
Yes, and it is the strong point: token budget matched across architectures, plus metrics of overhead, turns and success per 1K tokens.

## Threats to validity
- R²_CV of about 0.37–0.41: the model explains less than half of the variance and predicts absolute values across domains poorly. The authors say relative selection is more stable.
- Subsets of 20 instances on SWE-bench and Terminal-Bench; high variability on BrowseComp-Plus (CV = 0.32).
- Homogeneous agents within each configuration; agent scale only up to 9.
- The automated reader flagged a possible sign inconsistency in the threshold derivation (Sec. 4.3 vs Table 4); I did not check it manually.
- Preprint with no declared venue.

## Relevance to the central question
It is the work closest to Norevia's question: it compares SAS and MAS under a matched budget and proposes predictors (base capability, task type, tools, central verification) of the optimal architecture. It indicates that a good part of the "law" has already begun to be formulated by others. Norevia's possible novelty lies in dynamic allocation during execution and in including individual reasoning effort as a continuous variable; here the architectures are fixed choices per configuration.

## Candidate hypotheses
- candidate: above about 45% single-agent accuracy, adding agents has negative marginal return; the controller should treat this as a contraction threshold.
- candidate: tasks decomposable into parallel subproblems gain from central orchestration; sequential, state-dependent tasks lose with any MAS.
- candidate: a central verification step limits error amplification; without it, independent agents propagate errors.
- candidate: turn overhead grows superlinearly in n (exponent about 1.7), setting a practical ceiling of about 3–4 agents under a fixed budget.

## Verification
Opened on 2026-11-07: https://arxiv.org/abs/2512.08296 (v3, 20 authors, arXiv DOI) and https://arxiv.org/html/2512.08296v3 (read in full in two parts). Numbers extracted by an automated reader, without cell-by-cell manual checking. Publication venue not identified (gap).
