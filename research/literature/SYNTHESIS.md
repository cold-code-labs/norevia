---
id: lit-synthesis
title: 'Literature synthesis — when N LLM agents outperform 1 agent with more reasoning, and at what cost'
area: literature
evidence: author-reported
tags: [synthesis, scaling, debate, routing, error-correlation, test-time-compute, novelty-gap]
sources:
  - "39 papers carded in research/literature/lit-*.md (primary source opened) + 1 gap (lit-bio-autonomic); full references in research/literature/BIBLIOGRAPHY.md"
related: [lit-scaling-agent-systems, lit-sas-equal-thinking-budget, lit-stop-overvaluing-mad, lit-debate-or-vote, lit-pareto-test-time-multiagent, lit-snell-test-time-compute, lit-debate-routing-matched-ceiling, lit-correlated-errors, lit-large-language-monkeys, lit-sas-vs-mas-hybrid]
updated: 2026-11-07
summary: 'With matched compute, a well-configured single agent usually ties or beats N agents. Cooperation pays off in narrow regimes: decomposable tasks, a weak individual agent, degraded context and weakly correlated errors. Scaling laws and routers for this already exist. The gap lies in a joint, online policy over reasoning × agents × verification, with cost per accepted result.'
---

# Literature synthesis (Norevia, 2026-11-07)

**Nature of this document.** The numbers below are *author-reported*, checked against the primary sources by the literature agents. None was reproduced locally. Sentences marked **[hypothesis]** are ours: they are test proposals, not results. The search **was not systematic** (it did not follow the PRISMA standard). It covered about 40 papers chosen for relevance to the central question, so "nobody has done X" means only "we did not find X in this search".

In the numbers, "pp" means percentage points.

## 1. What the literature already answers

### 1.1 With matched compute, the single-agent baseline is strong, and often wins
- **Debate loses to CoT or self-consistency (SC) in most cases.**
  - Across 36 settings (4 models × 9 benchmarks), none of the five debate methods tested beats CoT in more than 20% of cases. SC uses tokens better than all of them ([lit-stop-overvaluing-mad]).
  - Separating debate into voting and interaction, the 5-agent majority vote outperforms all debate variants. With Qwen2.5-7B, voting gives 0.7691 and the best debate 0.7377. Debate alone is a *martingale*: it does not increase expected correctness ([lit-debate-or-vote]).
  - On MedQA, SC reaches 0.63 for US$ 25.47 and Society of Mind reaches 0.64 for US$ 48.63 ([lit-should-we-be-going-mad]). Caveat: the headers of that table were reconstructed by the agent that read it.
- **A single agent with a strong prompt ties with discussion.** With demonstrations in the prompt, a single agent averages 75.63 against 74.46 for the best discussion method. Debate with 6 agents yields less than with 3 ([lit-rethinking-bounds-discussion]).
- **With the same *thinking tokens* budget, the single agent wins from about 500 tokens upward.** With 1k tokens, the single agent scores 0.418 and debate 0.388. The multi-agent system (MAS) wins only with a minimal budget (100 tokens: 0.370 against 0.290) or when the single agent's context is degraded. MAS also spend many more actual tokens: on Qwen3/FRAMES with a 10k cap, the Ensemble spent 5,571 tokens and the single agent 1,307 ([lit-sas-equal-thinking-budget]).
- **Per-token efficiency.** Across 260 configurations, the single agent yields 67.7 successes per 1K tokens. Multi-agent architectures range from 13.6 to 42.4 ([lit-scaling-agent-systems]).
- **The early advantage of debate did not match compute.** Du et al. report 85.0 for debate, 81.0 for voting and 77.0 for the single agent on GSM8K ([lit-multiagent-debate-du]). That gain did not match compute and did not hold up in the later studies cited above.

### 1.2 The gain from cooperation shrinks when the individual agent becomes strong
- **Above about 45% single-agent accuracy, adding agents yields less or makes things worse** (β = −0.236, p = 0.004). On the same scale, the result relative to the single agent ranges from +80.8% (Finance-Agent, central orchestration) to −70% (PlanCraft) ([lit-scaling-agent-systems]).
- **With stronger models, the MAS advantage drops.** MetaGPT/HumanEval goes from +10.7 to +3.0 pp and MathDebate/GSM8K from +9 to +0.8. About 80% of examples are ties ([lit-sas-vs-mas-hybrid]).
- **The relative gain from sampling and voting is larger for weak models.** On MATH, it was +200% with Llama2-13B and +34% with GPT-3.5 ([lit-more-agents]).
- **The savings from early stopping track model capability.** With GPT-4, the number of samples fell by 80.1% on GSM8K and 33.8% on MATH ([lit-early-stopping-sc]).

### 1.3 The gain saturates at small N and can even reverse
- **Self-consistency saturates quickly.** On AQuA with UL2-20B: 19.7 with 1 path, 24.9 with 5 and 26.9 with 40 ([lit-self-consistency]).
- **Reported saturation points:**
  - MacNet saturates at around 16 nodes. Voting stabilizes near 8 agents, and tokens grow 7.51× from 1 to 16 agents ([lit-macnet]).
  - SwarmSys peaks at 14 agents: 77.3 with 14 and 76.5 with 32 ([lit-swarmsys]).
  - With paired compute, SC saturates at about 10 samples and debate at about 4 agents ([lit-pareto-test-time-multiagent]).
  - In AgentPrune, going from 5 to 9 agents yields little ([lit-agentprune]).
- **The curve can be non-monotonic.** Voting improves "easy" questions and worsens "hard" ones, so the curve can rise and then fall. A formula predicts the optimal number of calls from a few samples ([lit-more-llm-calls]).

### 1.4 Task difficulty governs the best way to spend
- **Allocating test-time compute by difficulty matches best-of-N with up to about 4× less compute.**
  - With equal FLOPs, inference compute beats a model about 14× larger only on easy and medium questions.
  - On hard ones, the larger model wins.
  - The cost of estimating difficulty is not accounted for ([lit-snell-test-time-compute]).
- **Extra compute yields more on hard items.** With 15–20× the compute of CoT, easy items gain +2.2 pp and hard ones +9.0 pp. A scaled Llama 8B does not reach the 70B with plain CoT ([lit-pareto-test-time-multiagent]).

### 1.5 Verification is the bottleneck, not generation
- **Generating the right answer is not enough; it must be selected.** On MATH, coverage (fraction of problems in which some sample is correct) reaches 98.44% with 10,000 samples. Voting and the reward model, by contrast, stay at about 41% and stabilize near 100 samples. On SWE-bench Lite, accuracy goes from 15.9% to 56% with 250 samples, because the tests act as a verifier ([lit-large-language-monkeys]).
- **Short parallel beats long reasoning when there is a verifier.** On MiniF2F, NoThinking scores 36.38 against 34.84, with 6.47× lower latency ([lit-nothinking]). Search with a step verifier scaled better than sequential extension ([lit-s1-budget-forcing]).
- **Cascades save when there is a learned acceptance signal.** FrugalGPT, using a DistilBERT verifier, maintained accuracy with 98.3% less cost on HEADLINES ([lit-frugalgpt]).
- **Verification and termination failures dominate MAS.**
  - Across 1,642 runs of 7 frameworks, the failure rate ranges from 41% to 86.7%.
  - By failure mode: not recognizing when to stop 12.4%, premature termination 6.2%, missing verification 8.2% and incorrect verification 9.1% ([lit-mast]).

### 1.6 Correlated errors limit the "wisdom of crowds" among LLMs
- **When two LLMs are wrong, they tend to choose the same wrong answer.** The rate is about 0.6 on HELM (chance would give about 1/3) and 0.423 on HuggingFace (chance 0.127). More accurate models err in more similar ways. Being from the same provider adds only +0.022 to +0.066 ([lit-correlated-errors]).
- **Similarity between models grows with capability and contaminates oversight.** The LLM judge favors models similar to itself ([lit-great-models-think-alike]).
- **Shared bias appears even in forecasts.** The ensemble of 12 LLMs ties with 925 humans (Brier 0.20 against 0.19), but has a collective bias toward "yes": 57.35% mean forecast against 45% positive resolution ([lit-silicon-crowd]).
- **Quality matters more than diversity.** Aggregating 6 samples from the best model (Self-MoA) scores 65.7 on AlpacaEval, against 59.1 for the mixture of different models ([lit-self-moa]). In the original MoA, however, diversity helps with the same number of proposers: 61.3 against 56.7 ([lit-mixture-of-agents]).
- **Diversity of *approach* (prompts) can yield a lot with a verifier.** With GPT-4 on Graph Coloring, DIV-SE scores 97.0 against 23.0 for SC ([lit-diversity-of-thought]). But it does not help when base capability is lacking.
- **Weaker evidence:** the heterogeneous debate of [lit-diverse-debate-hegazy] and the classic abstract model of [lit-hong-page-diversity] (10 random agents score 94.53 against 92.56 for the 10 best).

### 1.7 More individual reasoning also saturates, and sometimes makes things worse
- **The first solution is usually already correct.** It is correct in more than 92% of cases. Reducing tokens from 2408 to 1331 on MATH500 left accuracy practically unchanged (93.0 → 92.8) ([lit-overthinking]).
- **Budget forcing has limited returns.** Forcing more reasoning takes AIME24 from 50% to 57%, and the gain stabilizes at about 6 extensions ([lit-s1-budget-forcing]).
- **There is inverse scaling on some tasks.** On Misleading Math, R1 drops from 70% to 30% with more reasoning ([lit-inverse-scaling-ttc]).
- **The idea of adaptive halting is old and fragile with respect to per-step cost** ([lit-adaptive-computation-time]).

### 1.8 Where cooperation demonstrably adds value, according to the authors
- **Decomposable tasks with a central orchestrator.** Finance-Agent reaches +80.8%. Central coordination contains error amplification: 4.4× against 17.2× for independent agents ([lit-scaling-agent-systems]).
- **Separate critic or validator in code repair.** SelfHeal (fixer + critic) resolves 22 of 37 bugs, against 13 for the same model without the framework (zero-shot). The critic alone adds only 3 cases; the fix rules weigh more ([lit-selfheal]).
- **Well-parameterized structures lie on the Pareto frontier.** With paired compute, single-model MoA outperforms SC by +2.7 pp and debate by +1.3 pp ([lit-pareto-test-time-multiagent]). These differences fall within the CI of ±2.8–3.0 pp.
- **Gain with much more latency.** On GAIA Level 1, GPTSwarm rises from 25.66 to 30.56, but time goes from about 71 s to 415 s ([lit-gptswarm]).
- **Trajectory memory yields more than extra agents.** In AgentNet, accumulated memory yields 7–10 points, while going from 3 to 9 agents yields 0.8 ([lit-agentnet]).

### 1.9 Routing and adaptive halting work, with known limits
- **RouteLLM saves a lot in conversation and little in reasoning.** The savings are 3.66× on MT Bench, but only 1.41× on MMLU and 1.49× on GSM8K ([lit-routellm]).
- **Adaptive-Consistency** uses on average 3.2× fewer samples, with an accuracy change of −0.07 points ([lit-adaptive-consistency]).
- **Cascade between single agent and MAS.** Running the single agent first and escalating to MAS only when it fails spends 1,056 tokens on GSM8K, against 8,837 for MAS (about 88% less) ([lit-sas-vs-mas-hybrid]).
- **Hard limit: cheap consensus signals do not detect when debate is needed.**
  - An oracle that picked the best protocol per example would gain about 14 pp on MuSiQue.
  - Vote entropy recovers only 11–19% of that gain, because 66% of the cases in which debate helps have a **unanimous and wrong** vote ([lit-debate-routing-matched-ceiling]).

## 2. Contradictions and tensions

1. **MAS on the Pareto frontier or not?**
   - For: [lit-pareto-test-time-multiagent] places MoA and debate on the frontier.
   - Against: [lit-stop-overvaluing-mad], [lit-debate-or-vote] and [lit-sas-equal-thinking-budget] conclude the opposite.
   - Method differences that explain part of the divergence:
     - Compute accounting: FLOPs with memory, number of calls or thinking tokens.
     - Models without extended reasoning (Llama 3.1) versus reasoning models (Qwen3, R1-distill, Gemini 2.5).
     - Effect size (1–3 pp) within the CI.
   - **Provisional conclusion:** the sign of the effect depends on the cost metric and the model type. Any Norevia experiment must fix these two choices and report them.
2. **Does diversity help?** MoA says yes (61.3 against 56.7). Self-MoA says quality dominates (65.7 against 59.1). Error correlation grows with capability ([lit-correlated-errors]). Reconciling reading **[hypothesis]**: diversity adds value only when it does not cost individual quality and when it reduces the correlation of *errors*, not just of style.
3. **Voting gain and difficulty.**
   - [lit-more-agents] shows the gain rising and then falling with difficulty.
   - [lit-more-llm-calls] shows voting getting worse on hard questions.
   - The two define "hard" in different ways. By the logic of Condorcet's jury theorem, voting helps when each item is answered correctly with probability above 0.5 and hurts below that. This reading is ours and has not been tested.
4. **Test-time compute versus a larger model.** [lit-snell-test-time-compute] says more inference compute substitutes for a 14× larger model on easy and medium questions. [lit-pareto-test-time-multiagent] says a scaled 8B does not reach the 70B. The two are compatible if MMLU-Pro is "hard" for the 8B; there is no direct conflict, but a common difficulty map is missing.
5. **Internal inconsistencies** in the papers themselves (recorded in the cards):
   - AgentPrune: Table 1 and GPTSwarm cost on MMLU.
   - MoA: 65.8 in the text against 65.1 in the table.
   - Snell: "more than 4×" against "up to 4×".
   - Overthinking: −48.6% attributed to the wrong dataset.
   - FrugalGPT, Silicon Crowd and Gao et al.: ranges in the abstract that we could not find in the tables.

## 3. Novelty gap for Norevia, with honesty about what has already been done

**Already exists, and Norevia must not claim it as new:**
- **Predictive law of when MAS helps.** [lit-scaling-agent-systems] models agent performance as a function of capability, coordination and task properties, with a saturation threshold at around 45%. The cross-validated R² is only 0.37–0.41. It is the work closest to the "law of collective efficiency" of the guiding document.
- **Law of the optimal number of calls** for voting and filtering ([lit-more-llm-calls]). **Collaborative scaling law** as a function of the number of nodes ([lit-macnet]).
- **Compute-optimal allocation of test-time compute by difficulty** for one agent ([lit-snell-test-time-compute]).
- **Routers and cascades:**
  - between models: [lit-frugalgpt], [lit-routellm];
  - between single agent and MAS: [lit-sas-vs-mas-hybrid];
  - between protocols (direct, vote, debate) with a matched token ceiling: [lit-debate-routing-matched-ceiling].
- **Adaptive halting:** [lit-adaptive-computation-time], [lit-adaptive-consistency], [lit-early-stopping-sc].
- **Comparison of single agent versus MAS with the same thinking budget:** [lit-sas-equal-thinking-budget].

**What appears open in this search** (opportunity, not proven originality):
1. **Joint, online policy.** The papers optimize one axis at a time:
   - Snell: search versus revision, in a single model.
   - Tran & Kiela: thinking budget versus MAS, statically.
   - Kim et al.: architecture choice, by static prediction.
   - Gao et al. and Hu et al.: discrete routing.

   We did not find a policy that chooses *at the same time* reasoning effort × number of agents × topology × verification, per task, expanding and contracting *during* execution. Nor did we find one that accounts for the cost of the controller itself.
2. **Cost per *accepted* result as the primary metric.** Almost everything measures accuracy against an answer key. Few papers address realistic verifiable acceptance: executable tests, false success and premature termination. MAST shows that these failures dominate; the SWE-bench tests in Monkeys show the value of a verifier.
3. **Cheap estimator of marginal gain.** Hu et al. show that consensus signals predict *safety*, not *need*. This is the hard problem and the point where Norevia can contribute or fail. Candidate signals outside consensus: test execution, external verifiers, conflict with tools.
4. **Error correlation as a decision variable.** It has been measured ([lit-correlated-errors]), but we did not find a policy that decides whether to expand the swarm based on an online estimate of ρ (the correlation between the agents' errors).
5. **Domain and current models.** The evidence is concentrated on QA and mathematics, with 2023–2025 models. There is little controlled evidence on multi-step agentic coding tasks, reasoning models and real prices. Partial exceptions: [lit-scaling-agent-systems], [lit-selfheal], [lit-large-language-monkeys].

## 4. Implications for the Observatory

These are design proposals; nothing has been deployed.
- **Minimum controls for any multi-agent arm:**
  - single agent with the same *actual* token budget (the nominal budget underestimates MAS, according to [lit-sas-equal-thinking-budget]);
  - SC or voting with the same number of calls ([lit-more-agents], [lit-debate-or-vote]);
  - single agent with a strong prompt ([lit-rethinking-bounds-discussion]).
- **Report** results by difficulty band and with CIs. Record actual tokens, latency, cost per acceptance, rate of "unanimous and wrong" and rate of reversal of correct answers.
- **Separate** the generation gain (coverage) from the selection and verification gain ([lit-large-language-monkeys]).

## 5. Consolidated candidate hypotheses (for the theory agent to register as H-xx)

All are **[hypothesis]**:
- **candidate 1 — saturation by capability and correlation:** the marginal gain of adding agent *k+1* falls with individual accuracy and with error correlation ρ. Below the threshold cooperation is worthwhile; above ~45% (Kim et al.) or with high ρ, it does not pay off.
- **candidate 2 — verifier:** with a cheap and reliable verifier, short parallel sampling dominates long sequential reasoning. Without a verifier, one agent with more reasoning, up to saturation, dominates N voting agents.
- **candidate 3 — decomposability:** MAS only pays off its cost on decomposable tasks (parallelizable subtasks with little coupling) or when a single agent's context degrades. On sequential tasks, it loses.
- **candidate 4 — activation signal:** agreement among agents predicts when expanding is safe, not when it is necessary. A useful controller needs signals outside consensus.
- **candidate 5 — cascade:** "single agent → verification → micro-swarm only if it fails" dominates a fixed MAS in cost per acceptance. The gain depends on the verifier's false-acceptance rate.
- **candidate 6 — memory:** memory of validated trajectories yields more per cost than adding agents (AgentNet).

## 6. Limits of this synthesis
- Non-systematic search.
- **Reading of the texts:** most were read with an automated reader over the arXiv HTML, without checking cell by cell against the PDF. Some PDFs were extracted locally.
- **Bio-Autonomic without verification:** the text did not open, and the card is marked as `gap`.
- **Venues not confirmed:**
  - Snell, Monkeys, Chen et al., Gao et al., Kim et al. (2512.08296), Tran & Kiela and NoThinking: arXiv does not declare a venue.
  - MAST: NeurIPS track not confirmed.
  - SelfHeal: EASE acceptance not confirmed.
- **Published versions not compared** (TMLR, Science Advances): numbers in the FrugalGPT and Silicon Crowd cards come from the arXiv versions.
- **Critiques of Hong & Page** (Thompson 2014) were not opened.
- **2025–2026 papers identified but not carded** on compute allocation across questions: arXiv 2509.09864, 2506.12721, 2604.14853, 2605.26849 and a paper called DIPA. The IDs were seen in search and not verified.
- **Nothing was reproduced locally.**
