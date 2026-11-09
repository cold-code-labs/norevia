---
pivot: adapt
pivot_reason: "Communication graph is a candidate containment surface; efficiency results do not demonstrate cyber containment."
id: oss-agentprune
title: AgentPrune — periodic pruning of spatial/temporal edges by learned logit magnitude
area: oss
evidence: observed-implementation
tags: [communication-pruning, edge-mask, reinforce, spatio-temporal-graph, explicit-termination, fixed-rounds, no-license, inactive-token-accounting]
sources:
  - "https://github.com/yanweiyue/AgentPrune/tree/c544dd6a1858c02c6d5d371d23c6e6ff55e0be21 (inspected commit, shallow clone on 2026-11-07)"
  - "Zhang et al., Cut the Crap: An Economical Communication Pipeline for LLM-based Multi-Agent Systems, arXiv:2410.02506v1; ICLR 2025 (https://openreview.net/forum?id=LkzuPorQ5L, cited in the README)"
related: [oss-gptswarm, oss-agentnet, oss-autogen, oss-matrix]
updated: 2026-11-07
summary: "Derived from GPTSwarm, it learns logits for spatial (intra-round) and temporal (between-round) edges via REINFORCE and periodically zeroes those with the lowest logit; token counting exists but is not called in the inspected code."
---

## Identification

- Repository: https://github.com/yanweiyue/AgentPrune
- Commit: `c544dd6a1858c02c6d5d371d23c6e6ff55e0be21`
- Commit date (`git log -1 --format=%cI`): 2025-03-23T21:10:20+08:00
- License: **no license file.** Search: `find -iname "*licen*" -o -iname "COPYING*"` across the entire repository, no result. The README also declares no license (read in full, 90 lines). It says "This code refers to GPTSwarm" (`README.md:L89`), which is MIT, but that does not grant a license to this repository. Status: **gap**, i.e., no explicit permission for reuse.
- Files read: `README.md`, `AgentPrune/graph/graph.py`, `AgentPrune/graph/node.py`, `AgentPrune/graph/autogen_graph.py`, `AgentPrune/agents/final_decision.py`, `AgentPrune/agents/analyze_agent.py`, `AgentPrune/llm/gpt_chat.py`, `AgentPrune/llm/price.py` (L1–L45), `AgentPrune/llm/llm.py` (grep), `AgentPrune/utils/globals.py`, `AgentPrune/graph/autogen_node.py` (grep), `experiments/run_mmlu.py`, `experiments/train_mmlu.py`, `experiments/evaluate_mmlu.py`, `experiments/accuracy.py`, `experiments/run_humaneval.py` (L30–L228), `dataset/mmlu_dataset.py` (L73–L85), and greps in `experiments/run_gsm8k.py` and `experiments_autogen/*`.

## Mechanism

1. **Communication topology.**
   - **[code]** There are two graphs over the same N agents. The **spatial** one is a DAG within the round: the node reads the current outputs of its predecessors (`AgentPrune/graph/node.py:L114-L128`). The **temporal** one links rounds: the node reads the output of the previous round via `last_memory` (`node.py:L130-L143`).
   - **[code]** The potential edges are all N×N pairs (`AgentPrune/graph/graph.py:L135-L142`), filtered by fixed masks. The spatial default is complete without self-loops and the temporal one is complete (`graph.py:L47-L50`).
   - **[example]** The scripts define the topologies Chain, Star, Mesh, Layered, Debate, Random and FullConnected as masks (`experiments/run_mmlu.py:L87-L149`).
   - **[code]** At the end, all nodes (`"all connected"`) or only the last one (`"last connected"`) connect to the decision node (`graph.py:L162-L167`, `L295-L298`).
2. **Who decides who acts.** **[code]** Kahn topological order over the spatial graph sampled in each round (`graph.py:L273-L291`), with no LLM selector. Each unmasked edge is drawn by Bernoulli with `sigmoid(logit/temperature)` (`graph.py:L182-L190`, `L209-L216`). If optimization is off, the initial logit is 10, i.e., the edge stays practically always on (`graph.py:L71`, `L76`).
3. **Termination criterion.**
   - **[code]** The number of rounds is fixed: `num_rounds` has default 3 in `Graph.run`/`arun` (`graph.py:L221-L228`, `L264-L270`). **[example]** The scripts use 1 (MMLU, GSM8K) or 2 (HumanEval, AutoGen) (`run_mmlu.py:L38`; `run_humaneval.py:L50`).
   - **[code]** Per node: `max_tries=3`, timeout `max_time=600` s (`graph.py:L276-L285`).
   - **[example]** Training runs a fixed `num_iterations`, default 10 (`run_mmlu.py:L34`; `train_mmlu.py:L35`).
4. **Mechanical verification/acceptance.**
   - **[code]** `FinalWriteCode` runs `PyExecutor` on asserts extracted from the `>>>` examples in the problem statement for each received code, and puts "passes internal testing? True/False" into the decider LLM's prompt (`AgentPrune/agents/final_decision.py:L16-L46`). The test **informs** the LLM, but does not block the answer.
   - **[code]** `FinalMajorVote` is a deterministic majority vote over post-processed answers (`final_decision.py:L142-L169`). The default in the MMLU scripts is `FinalRefer`, LLM aggregation (`run_mmlu.py:L46`; `final_decision.py:L68-L105`).
   - **[example]** The training utility is exact-match (`experiments/accuracy.py`; `train_mmlu.py:L62-L66`) or the official HumanEval tests (`run_humaneval.py:L125-L131`).
5. **Cost/budget control.**
   - **[code]** `cost_count` counts tokens with `tiktoken` and accumulates them in singletons (`AgentPrune/llm/price.py:L7-L44`), **but it is never called**. It is imported in `gpt_chat.py:L10`, and `achat` does not call it (`gpt_chat.py:L23-L30`; search `cost_count(` finds only the definition). The scripts import `Cost/PromptTokens/CompletionTokens` without reading them (search: `Cost.instance`, no occurrence outside `price.py`).
   - **[code]** `GPTChat.agen` computes `max_tokens` (default 1000, `AgentPrune/llm/llm.py:L8`), but does not pass it to the API (`gpt_chat.py:L47-L56` → `achat(self.model_name, messages)`).
   - Conclusion: there is no technical budget and no active token measurement in this commit.
6. **Memory.** **[code]** Each node keeps only the last round (`last_memory`, which is overwritten in `update_memory`: `node.py:L64`, `L109-L112`), a structural window of 1 round. In the AutoGen variant, `conversation_history` is rebuilt by concatenating the neighbor's history at each step, with no explicit limit (`AgentPrune/graph/autogen_node.py:L38-L39`, via grep only). `GraphAutoGen.chain_idx_list/chain_str_list` only grow (`autogen_graph.py:L22-L23`, `L31-L32`, `L44-L45`).
7. **Failures/retry.**
   - **[code]** The LLM has `@retry(wait_random_exponential(max=300), stop_after_attempt(3))` (`gpt_chat.py:L23`).
   - **[code]** In the graph, any exception is caught and the node is retried up to 3 times. After that, execution continues with the node producing no output (`graph.py:L278-L285`).
   - **[code]** `GPTChat.gen` (synchronous) is `pass` and returns `None` (`gpt_chat.py:L58-L65`), so only the `arun` path is functional.
8. **Communication pruning (core of the project).**
   - **[code]** `update_masks(pruning_rate)` sorts the logits (already-masked edges are forced to the end, with `min-1`) and zeroes the `round(active_edges × rate)` with the lowest logit, with a minimum of 1, in both the spatial and temporal graphs (`graph.py:L317-L339`). Pruning is **cumulative and irreversible**: a zeroed mask is never restored (search: `spatial_masks\[.*\] = 1`, no occurrences).
   - **[example]** **When:** every `imp_per_iters` training iterations (`train_mmlu.py:L82-L83`), default 5, with `pruning_rate` default 0.25 (`run_mmlu.py:L36-L41`). The argument's help says "Default 0.05" (`run_mmlu.py:L41`), but the actual value is 0.25. The signature of `train()` has `pruning_rate=0.05` and `imp_per_iters=1` (`train_mmlu.py:L20-L21`), overridden by the script. In the HumanEval and GSM8K scripts, pruning only occurs while `i_batch < num_iterations`, after which optimization is turned off (`run_humaneval.py:L159-L163`).
   - With the MMLU defaults (10 iterations, pruning every 5), there are **2 pruning events**: periodic, not one-shot. I did not confirm whether this corresponds to the "one-shot" procedure described in the paper (paper not read).
   - **[code]** At inference, unmasked edges continue to be drawn stochastically from the logits (`arun` calls `construct_spatial_connection()` without `threshold`, `graph.py:L271`).
   - **[code]** **Inconsistency:** `GraphAutoGen.construct_spatial_connection` does not consult `spatial_masks` (`autogen_graph.py:L25-L49`), so mask pruning has no effect on the spatial graph of the AutoGen variant.
   - Low-rank or sparsity regularization: not found in the inspected code (search: `nuclear|svd|low.?rank|regulari|sparsit|one.?shot`).
9. **Swarm size.** **[code]** It is fixed: nodes come from `agent_names × agent_nums` (`graph.py:L124-L133`; `run_mmlu.py:L63`). Pruning can isolate an agent (no edges), but the node keeps being executed every round (Kahn traverses all nodes with in-degree 0, `graph.py:L273-L274`). This does not cut the agent's cost, only the communication.
10. **Cost vs quality benchmark.** **[code/example]** Absent as code: only accuracy is recorded (`run_humaneval.py:L133-L145`; `evaluate_mmlu.py:L60-L71`). The README gives no numbers. Author report, provided in the task context (paper not read here): token reduction of 28.1% to 72.8%. This value is **not reproducible with the code of this commit**, because the token counter is disconnected (item 5).

## Evidence

- **Observed implementation:** spatial and temporal masks, REINFORCE over logits (`train_mmlu.py:L57-L73`), periodic magnitude pruning, fixed rounds, retry with backoff, token accounting present but not called.
- **Author report:** ICLR 2025 (`README.md:L8`); "prune redundant or even malicious communication messages to improve the reasoning accuracy and efficiency" (`README.md:L15`); token reduction of 28.1% to 72.8% (paper, via context).
- **Gaps:** I did not read the prompt sets, the GSM8K and HumanEval datasets, or `agents/*_ag.py` in full. I did not verify how the authors measured the paper's tokens; they possibly did so with code that is not in this commit.
- No code was run; no benchmark reproduced.

## Engineering analogue

*Hypothesis.* `update_masks` is a simple and auditable pruning mechanism (top-k by logit, cumulative) that could become an Observatory condition: "N agents, communication pruned after a warm-up of K tasks". Two engineering lessons come out of the reading. First, pruning **edges** does not reduce the fixed cost of **nodes**, since every agent keeps being called; for cost per accepted task, nodes would also need to be pruned. Second, the token metric needs active instrumentation in the LLM wrapper, which here is switched off.

## Testable hypothesis

- *Hypothesis H1:* with N=5 agents and the same number of rounds, applying `update_masks` until edge density drops to ≤50% reduces input tokens per accepted task by at least 25% relative to FullConnected, with no accuracy drop greater than 2 p.p. Metric: prompt tokens per accepted item, measured in the wrapper. The hypothesis is false if the reduction is less than 25%.
- *Hypothesis H2:* since isolated nodes keep being called, the reduction in **output** tokens per task is less than 10%. The hypothesis is false if the reduction is greater than or equal to 10%.

## Limits/gaps

- No license: code reuse is not authorized. For now, only the idea can be cited.
- Token counting is disconnected and `max_tokens` is not passed through, so the repository itself does not support cost figures.
- In the AutoGen variant, the masks do not affect the spatial graph.
- In HumanEval, training and evaluation are online over the same data stream, and the recorded accuracy is cumulative over all batches, including training ones (`run_humaneval.py:L93-L163`).
- Pruning is irreversible and depends on logits trained with few batches (10 iterations × 4 by default).

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ fixed `num_rounds` (default 3, `graph.py:L264-L270`) + `max_tries=3`/600 s | ✓ exact-match/HumanEval tests as training utility (example, `run_humaneval.py:L125`); in the core, tests only inform the LLM (`final_decision.py:L42-L43`) | — `cost_count` never called (`gpt_chat.py:L23-L30`); `max_tokens` not passed through | ✓ `update_masks` zeroes the lowest logits every `imp_per_iters` (`graph.py:L317-L339`; `train_mmlu.py:L82-L83`) | — fixed agents; isolated node still executes (`graph.py:L273`) | ✓ 1-round window (`node.py:L109-L112`); AutoGen variant unbounded | — no LICENSE file nor declaration in the README |
