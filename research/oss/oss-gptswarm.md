---
id: oss-gptswarm
title: GPTSwarm — agents as a computational graph with edges optimized by REINFORCE
area: oss
evidence: observed-implementation
tags: [optimizable-graph, dag, reinforce, communication-pruning, explicit-termination, verifiable-acceptance, cost-tracking, unbounded-memory]
sources:
  - "https://github.com/metauto-ai/GPTSwarm/tree/c23a827f561c934ce21dd950408f7606aa4a8821 (inspected commit, shallow clone on 2026-11-07)"
  - "Zhuge et al., GPTSwarm: Language Agents as Optimizable Graphs, ICML 2024, https://proceedings.mlr.press/v235/zhuge24a.html (the README cites arXiv:2402.16823; version not verified)"
related: [oss-agentprune, oss-agentnet, oss-matrix]
updated: 2026-11-07
summary: "Library that represents agents as subgraphs of a DAG and learns, via REINFORCE with an exact-match utility, the probability of each edge between agents; it measures cost but does not limit it."
---

## Identification

- Repository: https://github.com/metauto-ai/GPTSwarm
- Commit: `c23a827f561c934ce21dd950408f7606aa4a8821`
- Commit date (`git log -1 --format=%cI`): 2026-02-05T13:39:09+03:00
- License: **MIT** (file read: `LICENSE`, L1 "MIT License", "Copyright (c) 2024 metauto.ai"). The README also shows an MIT badge (`README.md:L3`), but the file is what counts.
- Files read: `swarm/graph/graph.py`, `swarm/graph/node.py`, `swarm/graph/composite_graph.py`, `swarm/graph/swarm.py`, `swarm/optimizer/edge_optimizer/parameterization.py`, `swarm/optimizer/edge_optimizer/optimization.py`, `swarm/optimizer/node_optimizer/node_optimization.py`, `swarm/optimizer/node_optimizer/prompt_optimizer.py` (L40–L130), `swarm/memory/memory.py`, `swarm/llm/price.py` (L1–L60), `swarm/llm/gpt_chat.py` (L25–L114), `swarm/llm/llm.py` (via grep), `swarm/utils/globals.py`, `swarm/environment/operations/final_decision.py`, `swarm/environment/operations/humaneval/code_writing.py` (L55–L120), `swarm/environment/tools/coding/python_executor.py`, `swarm/environment/tools/coding/executor_utils.py`, `swarm/environment/domain/crosswords/evaluator.py`, `experiments/evaluator/evaluator.py` (L90–L309), `experiments/evaluator/accuracy.py`, `experiments/run_mmlu.py` (grep), `experiments/run_humaneval.py` (L60–L115), `experiments/run_gaia.py` (L95–L175), `README.md` (grep).

## Mechanism

1. **Communication topology.** **[code]** It is a composite DAG (`CompositeGraph`) in which each agent is a subgraph of nodes (operations) and there is a final decision node (`swarm/graph/composite_graph.py:L13-L37`). With `edge_optimize=True`, the set of *potential* edges includes all pairs of nodes between different agents, in both directions, plus edges from each node to the decision node (`swarm/graph/swarm.py:L79-L95`). Without optimization, only each agent's outputs connect to the decision node, which forms an aggregation star (`swarm/graph/swarm.py:L97-L102`). Each node reads the outputs of its predecessors (`swarm/graph/node.py:L113-L126`). Edges that would close a cycle are rejected during sampling (`swarm/optimizer/edge_optimizer/parameterization.py:L104-L106`).
2. **Who decides who acts.** **[code]** It is a deterministic topological order (Kahn's algorithm over in-degrees), with no LLM selector (`swarm/graph/graph.py:L125-L152`). *Which* edges exist in each execution is drawn by Bernoulli from `sigmoid(edge_logit/temperature)` (`parameterization.py:L107-L115`). There is an option to also learn the node order (`realize_ranks`, `parameterization.py:L62-L82`).
3. **Termination criterion.**
   - **[code]** A graph's execution terminates when the topological queue empties (`graph.py:L133`). The DAG is guaranteed by the cycle check.
   - **[code]** Each node has a timeout `max_time=600` s and up to `max_tries=3` attempts, only on `TimeoutError`. Any other exception stops the attempts and the flow continues (`graph.py:L111-L146`).
   - **[code]** The edge optimization loop has a fixed number of iterations: `num_iter=100` by default in `optimize()` (`swarm/optimizer/edge_optimizer/optimization.py:L8-L13`). **[example]** `--num-iterations` has default 200 in `experiments/run_mmlu.py:L22`. There is no early stopping on convergence (search: `early|converge|patience` in `swarm/optimizer` and `experiments/evaluator`; the only hit is the word "clearly" in a prompt text in `prompt_optimizer.py:L185`).
4. **Mechanical verification/acceptance.**
   - **[code]** The `CodeWriting` node (HumanEval domain) extracts asserts from the `>>>` examples in the problem statement and runs `PyExecutor` on the generated code, storing `is_solved` and `feedback` (`swarm/environment/operations/humaneval/code_writing.py:L77-L91`). The executor does `exec` in `globals()`, with a per-thread timeout and no sandbox (`swarm/environment/tools/coding/python_executor.py:L34-L56`, `executor_utils.py:L37-L48`).
   - **[code]** The final `FinalDecision` node has deterministic strategies (`MajorityVote`, `RandomChoice`) and LLM strategies (`OutputsAsReferences`, `SelfConsistency`, `SelectBest`) (`swarm/environment/operations/final_decision.py:L19-L130`). The default is `OutputsAsReferences`, i.e., LLM aggregation (`swarm.py:L33`).
   - **[example]** The utility used to optimize edges is exact-match (`experiments/evaluator/accuracy.py:L7-L8`, `experiments/evaluator/evaluator.py:L266-L275`). In crosswords, the utility is the fraction of correct words or letters in the environment (`swarm/environment/domain/crosswords/evaluator.py:L44-L51`). These are deterministic checks against an answer key, but they live in the scripts and evaluators, not in the graph core.
5. **Cost/budget control.** **[code]** Tracking only. `cost_count` accumulates cost in US$ and tokens in global singletons (`swarm/llm/price.py:L11-L52`, `swarm/utils/globals.py:L19-L29`), and no code read halts execution based on these counters (search: `Cost.instance` appears only in logs and scripts). There is a per-call cap, `DEFAULT_MAX_TOKENS = 1000` (`swarm/llm/llm.py:L8`), but no total budget. **[example]** `experiments/run_gaia.py:L105` and `L167` log accumulated cost and tokens alongside accuracy.
6. **Memory.** **[code]** `GlobalMemory` is a singleton with an `id -> list` dictionary, append without limit and without eviction; only `clear()` exists (`swarm/memory/memory.py:L35-L51`, `L99-L100`, `L115-L118`). Similarity search (BERT) is optional (`memory.py:L71-L96`). Local limits:
   - demonstrations limited to `max_domenstrations=4` by random sampling (`swarm/optimizer/node_optimizer/node_optimization.py:L13-L16`; default in `swarm/environment/operations/optimizable_operation.py:L20`);
   - read windows `[-4:]` and `[-10:]` (`node_optimization.py:L7`, `code_writing.py:L110`).
7. **Failures/retry.**
   - **[code]** The asynchronous LLM call has `@retry(wait_random_exponential(max=100), stop_after_attempt(10))` and a 1000 s timeout (`swarm/llm/gpt_chat.py:L68-L101`). The synchronous version `gpt_chat` has no retry decorator (`gpt_chat.py:L30`).
   - **[code]** In the node, task exceptions are caught with `return_exceptions=True` and only logged; the node is left with empty outputs and the graph continues (`swarm/graph/node.py:L133-L141`). There is no circuit breaker or model fallback (search: `fallback|circuit`).
8. **Communication pruning.**
   - **[code]** Edges between agents are learned parameters. With low probability, an edge tends not to be sampled (`parameterization.py:L107-L115`). At evaluation, the mask is binarized (`edge_probs > 0.5`, `experiments/evaluator/evaluator.py:L114-L117`) or a `threshold` is used (`parameterization.py:L108-L109`). The README describes this as "edge pruning (value 0)" (`README.md:L71`) **[README/docs]**.
   - **[code]** At runtime, `Graph.run` executes only nodes that reach the output node (`is_node_useful`, `graph.py:L116-L127`), which saves calls from disconnected nodes.
   - **[code]** `CompositeGraph.mutate` adds and removes edges randomly (`composite_graph.py:L55-L86`), but no caller was found (search: `\.mutate(`).
9. **Swarm size.** **[code]** It is fixed. Agents come from `agent_names` in `organize()` (`swarm.py:L63-L73`). There is no on-demand creation or removal of agents (search: `spawn|add_agent|remove_agent|elastic`, no occurrences).
10. **Cost vs quality benchmark.** **[example]** `experiments/run_gaia.py:L155-L168` records, per item, `Accuracy` and accumulated `Total Cost`. In this commit, however, the swarm is commented out and a single `agent` runs (`run_gaia.py:L107-L119`). The MMLU and HumanEval scripts record only accuracy (`experiments/run_humaneval.py:L84-L111`). There is no cost vs quality table in the README (grep for `cost|token` only finds the description of the `swarm.llm` module, `README.md:L29`).

## Evidence

- **Observed implementation:** graph, edge sampling and optimization (REINFORCE with a moving-average baseline in `optimization.py:L24-L28`; without baseline in `experiments/evaluator/evaluator.py:L274`), cost tracking without cutoff, unbounded global memory, retry with backoff on the asynchronous call, test executor in the HumanEval domain.
- **Author report:** accepted at ICML 2024 as an oral (`README.md:L43-L57`). The paper's performance gains were not verified here.
- **Gaps:** I did not read `swarm/environment/agents/*` beyond the names, nor the prompts or `notebooks/`. I did not verify whether the paper's results use `optimization.py` or `experiments/evaluator/evaluator.py`.
- No code was run; no benchmark reproduced.

## Engineering analogue

*Hypothesis.* In the Swarm Efficiency Observatory, `EdgeWiseDistribution` serves as a model for an "N agents with learned topology" condition, to be compared with "N fully connected agents" and "1 strong agent". The training utility is already a mechanical acceptance (exact-match or tests), which aligns with the cost per accepted task metric. What is missing is putting cost into the utility function (today it is only accuracy) and cutting execution when a cap is reached; the counters in `price.py` already exist for this.

## Testable hypothesis

- *Hypothesis H1:* with the same set of agents, the graph with learned edges (mask `>0.5`) has a cost per accepted task (US$ or tokens per solved item, by exact-match or tests) at least 20% lower than the fully connected graph (`realize_full`) on the validation split, with no accuracy drop greater than 2 p.p. It is false if the cost reduction is less than 20% or the accuracy loss exceeds 2 p.p.
- *Hypothesis H2:* adding the cost of edge training (`num_iters × batch_size` executions), the optimized configuration only beats "1 strong agent" in cost per accepted task after K inference tasks. The metric is the break-even K. The hypothesis is false if K is larger than the size of the test set.

## Limits/gaps

- Cost is measured, but does not enter the optimization nor limit execution.
- The code executor runs `exec` without a sandbox. In a benchmark, it would need external isolation.
- Non-timeout exceptions silently end the node's attempts (`graph.py:L143-L145`), which can mask failures in the acceptance count.
- Two optimization paths coexist (`swarm/optimizer/edge_optimizer/optimization.py` and `experiments/evaluator/evaluator.py`), with different baselines.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ DAG + `max_tries=3`/`max_time=600` (`graph.py:L111-L146`); fixed `num_iter` (`optimization.py:L8`) | ✓ `PyExecutor` tests in the HumanEval node (`code_writing.py:L82`); exact-match in optimization (`accuracy.py:L7-L8`, example); default aggregator is LLM | — cost only accumulated (`price.py:L47-L49`); only `max_tokens=1000` per call (`llm.py:L8`) | ✓ edges sampled and binarized by learned probability (`parameterization.py:L107-L115`; `evaluator.py:L116`) | — fixed agents (`swarm.py:L63-L73`) | — `GlobalMemory` with no capacity (`memory.py:L48-L51`); only demos limited to 4 | MIT (`LICENSE:L1`) |
