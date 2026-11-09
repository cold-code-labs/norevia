---
pivot: adapt
pivot_reason: "Communication graph is a candidate containment surface; efficiency results do not demonstrate cyber containment."
id: oss-chatdev-macnet
title: "ChatDev + MacNet — DAG of agents in topological order, with hierarchical aggregation and execution-based pruning"
area: oss
evidence: observed-implementation
tags: [dag, topology, topological-order, aggregation, mechanical-pruning, code-execution, cross-team, workflow-yaml, per-node-context, chatdev-2]
sources:
  - "https://github.com/OpenBMB/ChatDev/tree/464a681ba7bda869db97a50c5fa707c9a0fb57a0 (inspected commit, shallow clone on 2026-11-07; branch main = ChatDev 2.0/DevAll)"
  - "https://github.com/OpenBMB/ChatDev/tree/e7a35824fd683ffe8fc237e28ecc47d7b1a5da63 (inspected commit, shallow clone on 2026-11-07; branch macnet)"
  - "MacNet — Scaling Large-Language-Model-based Multi-Agent Collaboration, arXiv:2406.07155 (cited in the main README; ICLR 2025 in the macnet README)"
  - "Croto — Multi-Agent Collaboration via Cross-Team Orchestration, arXiv:2406.08979 (cited in the macnet README)"
  - "ChatDev — Communicative Agents for Software Development, arXiv:2307.07924 (cited in the macnet README)"
related: [oss-matrix, oss-patterns, oss-gptswarm, oss-agentprune, oss-agentnet, oss-moa, oss-metagpt, oss-camel, oss-autogen]
updated: 2026-11-07
summary: "On the macnet branch, agents occupy the nodes of a generated DAG (chain, star, tree, net, mlp, random) and are executed layer by layer in topological order. Each edge reviews and rewrites code, and each node aggregates its predecessors' solutions, with mechanical pruning by executing main.py. The current main is ChatDev 2.0, an orchestrator of YAML workflows."
---

# ChatDev + MacNet

## Identification

- **Repository:** https://github.com/OpenBMB/ChatDev. Two trees were inspected.
- **Branch `main`**
  - SHA: `464a681ba7bda869db97a50c5fa707c9a0fb57a0`
  - Commit date: 2026-10-30T13:36:43+01:00
  - The README presents itself as **"ChatDev 2.0 - DevAll"** (`README.md:L1`). According to it, "the classic ChatDev (v1.x) has been moved to the `chatdev1.0` branch" (`README.md:L26`) **[README/docs]**.
  - The `chatdev1.0` branch (remote SHA `31fd994416a251ecdeb1f0a73c329271743bfb56`) **was not cloned**. See Limits/gaps.
- **Branch `macnet`**
  - SHA: `e7a35824fd683ffe8fc237e28ecc47d7b1a5da63`
  - Commit date: 2025-06-06T07:58:06+08:00
- **License**
  - `main`: the `LICENSE` file is the Apache License 2.0 (`LICENSE:L1-L2`, `@main`), with "Copyright 2025 OpenBMB" (`LICENSE:L189`, `@main`).
  - `macnet`: **there is no LICENSE file in the tree** (`find -iname "*licen*"` returned nothing), and the branch README does not mention a license. I did not check whether main's Apache-2.0 formally extends to the branch.
- **Files read**
  - `@macnet`:
    - Read in full: `graph.py` (500 lines), `generate_graph.py`, `config.yaml` and `run.py`.
    - Read in excerpts: `chatdev/waiting.py` (L15-L355 and L424-L520), `chatdev/competition.py` (L15-L156), `camel/model_backend.py` (L85-L110), `camel/agents/chat_agent.py` (L76-L262), `chatdev/statistics.py` (grep) and `README.md`.
  - `@main`:
    - Read in excerpts: `README.md` (L1-L50), `workflow/runtime/execution_strategy.py`, `workflow/cycle_manager.py` (L9-L50), `entity/configs/node/node.py` (L69, L110-L120, L238-L270), `workflow/graph.py` (L590-L600), `runtime/node/executor/loop_counter_executor.py`, `runtime/node/executor/python_executor.py` (L118-L170), `workflow/executor/dynamic_edge_executor.py` (L1-L180), `entity/configs/node/agent.py` (L106-L115) and `utils/token_tracker.py` (grep).
    - Read partially: `yaml_instance/ChatDev_v1.yaml` and `yaml_instance/MACNet_v1.yaml`.

## Mechanism

Unmarked anchors are from **`@macnet` (e7a3582)**. Anchors from main are marked with **`@main` (464a681)**.

**1. Communication topology**
- **Graph.** It is an explicit DAG, declared in `config.yaml` as a list of `"u->v"` edges (default `['0->1','0->2','0->3']`, `config.yaml:L1`). Ranges are accepted (`graph.py:L224-L238`) **[code]**.
- **Sentinel nodes.** `Node_in_id = -1` is connected to the entire input layer and `Node_out_id = -2` to the entire output layer (`graph.py:L248-L250`, `L283-L289`) **[code]**.
- **Cycles.** The code rejects graphs with a cycle and calls `exit(1)` (`graph.py:L291-L294`, DFS at `L475-L496`) **[code]**.
- **Topology generator** (`generate_graph.py`) **[code]**:
  - `chain` (`L28-L33`);
  - `star` (`L35-L40`);
  - binary `tree` (`L42-L54`);
  - complete `net` with `u<v` (`L56-L63`);
  - layered `mlp` (`L65-L81`);
  - `random` with `u<v` (`L83-L94`);
  - `--reverse`, which inverts the edges (`L100-L103`).
  - There is no "mesh" option; the complete graph is called `net` (`L155`).
  - Since edges always follow `u<v`, the graph is acyclic by construction.
- **Main (2.0) `@main`.** The workflow is a YAML graph of `agent`, `literal`, `loop_counter`, `passthrough`, `python`, `subgraph` nodes, among others. Examples: `yaml_instance/ChatDev_v1.yaml:L6-L37` and `yaml_instance/MACNet_v1.yaml:L7-L40`. MACNet_v1 uses subgraphs as nodes.
  - The execution strategy is DAG or cycles (`workflow/runtime/execution_strategy.py:L14-L60`) **[code/example]**.

**2. Who decides who acts**
- **No one decides at runtime: the structure decides.**
- **Execution order.** `Graph.execute` repeats the same step until the graph is empty **[code]**:
  1. takes the layer of nodes without predecessors (`graph.py:L321`);
  2. for each edge `cur→next`, runs `next.optimize(...)` on the solution of `cur` (`L337-L357`);
  3. removes the edges and nodes already consumed (`L391-L394`).

  It is a layered Kahn.
- **Work of each edge** (`graph.py:L131-L183`) **[code]**:
  - one "instructor" call with review rules (`config.yaml:L7-L22`);
  - optionally, a compilation check;
  - one "assistant" call that rewrites the code.

  Each call uses a new `ChatAgent` (`L75-L82`, `L145`, `L164`, `L174`).
- **Profiles and temperature.** Profiles come from the sampled `SRDD_Profile` or from the default "You are an experienced programmer." Temperature decreases with depth, `1 - depth/graph_depth` (`graph.py:L410-L422`) **[code]**.

**3. Termination criterion**
- **MacNet.** Termination is structural: the loop ends when there are no more input nodes, and the solution of node `-2` is written (`graph.py:L320-L327`, `L398`) **[code]**.
  - There is no multi-turn dialogue per edge, so there is no `chat_turn_limit` on the MacNet path. There are at most 3 LLM calls per edge (`L145`, `L164`, `L174`).
  - Aggregation has `Aggregate_retry_limit: 10` (`config.yaml:L5`; loop at `graph.py:L200-L213`) **[code]**.
- **Main `@main`.**
  - `loop_counter` nodes only release their output upon reaching `max_iterations` (`runtime/node/executor/loop_counter_executor.py:L16-L46`).
  - Cycles have a default ceiling of 100 iterations when `max_iterations` is not set (`workflow/cycle_manager.py:L16`, `L23`; used in `workflow/executor/cycle_executor.py:L130`).
  - In `ChatDev_v1.yaml`, the counters use 5, 3, 5, 1 and 10 (`L12`, `L20`, `L161`, `L355` and `L500`) **[code/example]**.
  - Edges with a `keyword` condition react to `<INFO>` (`ChatDev_v1.yaml:L712-L739`) **[example]**.

**4. Verification and mechanical acceptance**
- **Compilation on LLM demand.** It only occurs if the instructor begins its response with `<API>compile()</API>` (`graph.py:L147-L165`).
  - `exist_bugs` runs `python3 main.py`, waits 3 s and kills the process (`L84-L129`).
  - Reading observation, not executed: `return_code` is read at `L106`, **before** `poll()` at `L107`. In practice, the diagnosis depends on there being a "Traceback" in stderr (`L117-L121`).
  - The result goes back to the LLM as text. It is not a gate **[code]**.
- **Execution-based pruning and ranking.** This is deterministic, except for the `shuffle` **[code]**.
  - `competition_filter` assigns the score `rate = (executability*10 + completeness)*10000 - need_complete_number` (`chatdev/competition.py:L138-L156`), where:
    - `executability` comes from running `main.py` (`L57-L123`);
    - `completeness` is the absence of `pass` or `todo` (`L46-L55`);
    - `need_complete_number` counts unimplemented functions.
  - The score is used only to **select** solutions (item 8). There is no final acceptance: the output of node `-2` is written without checking (`graph.py:L398`).
- **Main `@main`.**
  - The `python` node has `success = returncode == 0` and a timeout (`runtime/node/executor/python_executor.py:L139-L168`) **[code]**.
  - In `ChatDev_v1.yaml`, the "Software Test Engineer" is an LLM agent that runs the software via tools and judges pass/fail through the prompt. A timeout can count as success (`ChatDev_v1.yaml:L458-L476`) **[example]**.

**5. Cost control and technical budget**
- **MacNet.** I did not find a ceiling on tokens, cost or calls in the inspected code (search: `budget`, `max_cost`, `total_tokens` in `graph.py` and `chatdev/waiting.py`) **[code]**.
  - The backend sets `max_tokens = model_limit - prompt_tokens` per call, using a fixed table in which `gpt-4o: 4096 #100000` (`camel/model_backend.py:L85-L99`).
  - The backend computes `cost` (`L103-L107`), but the log is commented out (`L111-L113`).
  - `ChatAgent.step` refuses to call the model when the prompt exceeds `model_token_limit` and marks `terminated` (`camel/agents/chat_agent.py:L235-L260`). This is a context limit, not a budget.
  - `chatdev/statistics.py` (`prompt_cost`, `get_info`) is not called by `graph.py`, `run.py` or `waiting.py`, according to grep **[code]**.
  - Cost grows with the number of edges: there are ≈2-3 calls per edge, and the `net` graph has n(n-1)/2 edges (`generate_graph.py:L62`) **[code]**.
- **Main `@main`.**
  - `utils/token_tracker.py:L36-L111` records usage per node and per model. I did not find a limit (search: `budget`, `max_cost` in `workflow`, `runtime`, `utils` and `entity`) **[code]**.
  - Provider retries go up to `max_attempts=5` (`entity/configs/node/agent.py:L106-L110`).

**6. Memory**
- **MacNet: bounded by construction.** Each call uses a new `ChatAgent` and receives only the task and the predecessor's solution (`graph.py:L139`, `L167-L168`). During aggregation, the node receives the solutions of its direct predecessors (`L194-L199`) **[code]**.
  - The README claims "without exceeding context limits" (`README.md:L9`, `@macnet`) **[README/docs]**.
- **Main `@main`.** Each node has `context_window`, with default `0`:
  - `0` clears everything except `keep` messages;
  - `-1` does not limit;
  - `N` keeps the N most recent (`entity/configs/node/node.py:L69`, `L113-L120`, `L238-L270`). It is applied in `workflow/graph.py:L596-L597` **[code]**.

**7. Failures and retry**
- **Aggregation.** Up to 10 attempts (`graph.py:L200-L213`). If they fail, the node uses the first pre-solution (`L376-L383`) **[code]**.
- **Format.** `error_check` redoes the call while the response has no codebooks, up to 3 times (`chatdev/waiting.py:L344-L355`). A parse failure in `optimize` becomes an empty `Codes()` (`graph.py:L177-L181`) **[code]**.
- **Fatal errors.**
  - A number of solutions different from the number of files terminates the program with `exit(1)` (`graph.py:L369-L371`).
  - `select_strategy` raises `ValueError` if `unit_num <= 1` (`waiting.py:L513-L514`) **[code]**.
- **Main `@main`.** There is per-provider retry (`entity/configs/node/agent.py:L106-L115`) **[code]**.

**8. Communication pruning** ✓
- **Croto, integrated into MacNet.** The README attributes "greedy aggregation, hierarchy partitioning, and pruning strategy" to `chatdev.waiting` and `graph.py` (`README.md:L80`, `@macnet`) **[README/docs]**.
- **Pruning observed in the code (`prune_test`).** It is triggered with more than 4 solutions in the queue (`waiting.py:L127-L128`) and with 4 or more after each round (`L189-L192`) **[code]**.
  1. Shuffles the solutions.
  2. Ranks each one by `competition_filter`, with a cache in `./Rate`.
  3. **Discards the lower half**, keeping `len//2` (`waiting.py:L267-L314`).
- **Hierarchical partitioning.** `select_strategy` groups `unit_num` solutions per aggregation call; the default is `Aggregate_unit_num: 2` (`config.yaml:L6`). Rounds repeat until ≤ `unit_num` remain (`waiting.py:L140-L200`), and `unit_num ≥ 4` is halved (`L130-L131`) **[code]**.
- **Dead code.** `select_strategy_greedy`, which limits groups by tokens via `tiktoken`, exists (`waiting.py:L424-L500`) but is not called anywhere, according to a grep for `select_strategy_greedy()` **[code]**.
- **Conditional aggregation.** The node only aggregates if it received all pre-solutions and they are ≥ `unit_num`. Otherwise, it uses the first (`graph.py:L373-L389`) **[code]**.

**9. Elastic vs fixed**
- **MacNet: fixed.** The number of nodes and the edges are defined before execution by `config.yaml` and `generate_graph.py --node_num`. During execution, nodes are only removed after being consumed (`graph.py:L391-L394`) **[code]**.
- **Main `@main`: opt-in elastic.**
  - `dynamic` edges (map or tree) split the payload and **virtually instantiate the target node once per unit**. The units run in parallel with `min(len(units), max_parallel)` workers (`workflow/executor/dynamic_edge_executor.py:L1-L6`, `L59-L82`, `L162-L175`) **[code]**.
  - Examples: `yaml_instance/demo_dynamic.yaml` and `demo_dynamic_tree.yaml`, listed but not read **[example]**.

**10. Cost vs quality benchmark in the repository**
- **MacNet.** I did not find an evaluation harness on the branch. `statistics.py` has cost functions, but they are not wired in (item 5) **[code]**.
- **Author reports** **[README/docs]**:
  - The main README claims that MacNet supports "more than a thousand agents without exceeding context limits" (`README.md:L44`, `@main`).
  - The Puppeteer paper (arXiv:2505.19591, on the `puppeteer` branch, not inspected) "reduces computational costs" (`README.md:L31-L34`, `@main`).
  - No number was verified.

## Evidence

No code was executed; no benchmark was reproduced. Everything comes from static reading of the two commits. The observation about `return_code` being read before `poll()` is a reading inference, untested.

## Engineering analogue

- **[hypothesis]** MacNet is the most direct "N agents with variable topology" arm for the Swarm Efficiency Observatory: the topology generator with `--node_num` allows sweeping N and the graph shape while keeping everything else fixed.
- **Pieces to reuse (engineering pattern):**
  - `competition_filter`: execution of `main.py` plus a completeness heuristic. It could serve as a cheap but weak mechanical acceptance (it has no tests).
  - Halving pruning as a cost-control mechanism.
- **What would be missing:**
  - a per-edge token counter. The cost computation already exists in the backend, but the log is commented out;
  - a final acceptance with hidden tests at node `-2`;
  - a "1 node" baseline arm (`chain` with `node_num=1`, or a single call) with the same budget.

## Testable hypothesis

1. **[hypothesis]** With software tasks that have hidden tests, the cost per accepted task (total tokens per task that passes the tests) grows superlinearly in N in the `net` topology (≈N²/2 edges) and ~linearly in `chain`. The acceptance rate of `net` does not exceed that of `chain` by more than 5 p.p. for N ≤ 8. The hypothesis is falsified if `net` gains more than 5 p.p. at some N ≤ 8, or if the cost of `net` grows ≤ linearly.
2. **[hypothesis]** Disabling `prune_test`, that is, aggregating all solutions, increases aggregation tokens without a significant gain in acceptance rate. Metric: Δtokens and Δacceptance with and without pruning, same graph seed.

## Limits/gaps

- **Classic ChatDev 1.0** (ChatChain, phases, `chat_turn_limit`, test phase with compilation) **was not inspected**. It is on the `chatdev1.0` branch (SHA `31fd994416a251ecdeb1f0a73c329271743bfb56`), which was not cloned.
  - The `macnet` branch contains `chatdev/chat_chain.py`, `phase.py` and `composed_phase.py`, but the MacNet execution path (`run.py` → `graph.py`) does not import them: `graph.py` imports only `chatdev.codes`, `chatdev.richshell` and `chatdev.waiting`. These files were not read.
- **License of the macnet branch not determined**: there is no LICENSE in the tree.
- **Main 2.0** was read on a sampling basis. The agent executor, the providers, the full semantics of conditional edges and the server were not verified. The `demo_dynamic*.yaml` YAMLs were not read.
- **Branch `puppeteer`** (RL-trained orchestrator, which claims to reduce cost) was not inspected.
- **Wait loop in `state_pool_pop`.** It uses `max_duration = wait_time = 6000000` s and a fixed `client_number = 1` (`waiting.py:L17`, `L58`, `L225-L262`). I did not analyze whether it can hang.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ structural: the DAG is exhausted in topological order (`graph.py:L320-L327`, `@macnet`); aggregation with `retry_limit=10` (`config.yaml:L5`). Main: `loop_counter`/cycle with a default of 100 (`workflow/cycle_manager.py:L23`, `@main`) | — execution of `main.py` serves only to rank and prune (`chatdev/competition.py:L138-L156`) and as optional feedback to the LLM (`graph.py:L147-L165`). There is no final gate (`graph.py:L398`) | — only `max_tokens` per call = context − prompt (`camel/model_backend.py:L97-L99`). Cost is computed, but neither recorded nor limited. Main: `TokenTracker` only records (`utils/token_tracker.py:L36-L111`, `@main`) | ✓ `prune_test` discards the lower half by execution score (`chatdev/waiting.py:L267-L314`) and aggregates hierarchically in groups of `unit_num` | — MacNet has a fixed graph (`config.yaml:L1`). ✓ opt-in on main: `dynamic` edges instantiate the node per unit (`workflow/executor/dynamic_edge_executor.py:L162-L175`, `@main`) | ✓ new `ChatAgent` per call, which sees only the predecessor's solution (`graph.py:L139`, `L174`). Main: `context_window` with default 0 (`entity/configs/node/node.py:L69`, `@main`) | Apache-2.0 on main (`LICENSE`, `@main`). ? on macnet: no LICENSE file in the tree |
