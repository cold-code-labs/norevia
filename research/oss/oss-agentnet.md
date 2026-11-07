---
id: oss-agentnet
title: AgentNet — decentralized forward/split/execute routing with edge weights and experience pools
area: oss
evidence: observed-implementation
tags: [decentralized-routing, dag, communication-pruning, bounded-memory, experience-rag, skill-evolution, partial-termination, no-license]
sources:
  - "https://github.com/zoe-yyx/AgentNet/tree/325d39f2a940be5fa903d28c411bd3426b8007f5 (inspected commit, shallow clone on 2026-11-07)"
  - "Yang et al., AgentNet: Decentralized Evolutionary Coordination for LLM-Based Multi-Agent Systems, arXiv:2504.00587v2 (NeurIPS 2025); repository officiality self-declared in the README, not confirmed by the paper (arXiv v2 page does not list code, checked by the swarm coordinator on 2026-11-07)"
related: [oss-gptswarm, oss-agentprune, oss-matrix]
updated: 2026-11-07
summary: "Each agent decides by LLM between forwarding, splitting or executing the task; multiplicative edge weights remove bad neighbors and capacity-limited experience pools feed the prompt — but the hop limit is prompt-only and eviction is degenerate."
---

## Identification

- Repository: https://github.com/zoe-yyx/AgentNet
- Commit: `325d39f2a940be5fa903d28c411bd3426b8007f5`
- Commit date (`git log -1 --format=%cI`): 2025-10-02T22:04:55+08:00
- License: **no license file.** Search: `find -iname "*licen*" -o -iname "COPYING*"`, no result. The `readme.md` (82 lines, read up to L80) does not declare a license. Status: **gap**, with no explicit permission for reuse.
- Officiality: `readme.md:L3` says "This is the official implementation" and lists the same authors as the paper (`readme.md:L9`). According to the coordinator, the arXiv v2 page does not point to a repository. Status: **self-declared, not confirmed by the paper.**
- Files read: `readme.md`, `AgentNet_Code/run_bigbenchhard_train_test.py`, `AgentNet_Code/config/experiment/bigbenchhard_new_abilities.yaml`, `AgentNet_Code/src/experiment.py`, `AgentNet_Code/src/agentgraph.py`, `AgentNet_Code/src/agent.py` (L36–L260, L426–L595, L688–L926), `AgentNet_Code/src/pool.py` (L1–L275, L300–L384, plus grep), `AgentNet_Code/src/global_vars.py`, `AgentNet_Code/src/utils.py` (L55–L144), `AgentNet_Code/src/task.py` (grep), `AgentNet_Code/evaluator/evaluator.py`, `AgentNet_Code/evaluator/Accuracy.py`, `AgentNet_Code/utils/Result_Extractor.py`, `AgentNet_Code/config/setting.py` (L300–L345). The directory `AgentNet_Code/models/` is a parallel implementation that the entry point does not import (search: `from models|import models` only finds `models/agent.py`). It was not analyzed.

## Mechanism

1. **Communication topology.**
   - [code] The directed graph is initially **complete**. Only `graph_type == "complete"` is implemented (`AgentNet_Code/src/agentgraph.py:L49-L67`), with initial weight 1.0 on every edge (`agentgraph.py:L37-L44`). [example] The configuration uses 3 agents (`config/experiment/bigbenchhard_new_abilities.yaml:L5`, `L29-L34`).
   - [code] Communication is a **point-to-point handoff**: the task (`TaskChain`) passes from one agent to an outgoing neighbor (`src/experiment.py:L116-L121`). There is no broadcast.
   - The README calls the structure a "dynamic DAG" [README/docs] (`readme.md:L18`, `L31-L32`). In the code, the only things preventing revisits are the prompt and `forward_history` (see item 3). I did not find an acyclicity check in the loop (search: `cycle|acyclic` in `src/`).
2. **Who decides who acts.**
   - [code] The first agent is chosen by heuristic: highest mean ability for the `task_type`, with random tie-breaking (`agentgraph.py:L74-L117`).
   - [code] Afterwards, **each agent decides by LLM** between `forward`, `split` or `execute` (`src/agent.py:L63-L119`). The ID requested by the LLM is only accepted if the neighbor has mean ability ≥0.5, load <3 and is in the neighbor list. Otherwise, `find_best_alternative_agent` kicks in, with score `0.4·ability + 0.3·(1−load/3) + 0.2·success + 0.1·output` (`agent.py:L98-L110`, `L426-L449`).
   - [code] After a `split`, the LLM decides `completed` or `incompleted` and the next agent (`agent.py:L160-L211`; `experiment.py:L155-L206`).
3. **Termination criterion.**
   - [code] `execute` ends the task (`experiment.py:L132-L152`). After `split`, `completed` ends it (`experiment.py:L194-L195`), and `incompleted` increments a counter with a hard ceiling `max_execution_times` (`experiment.py:L197-L206`). [example] This ceiling is 5 in the YAML (`yaml:L7`).
   - [code] The **hop limit is not hard.** `forward_path_max_length` (3, `yaml:L6`) only switches the prompt to "Split_and_Execute" mode when `forward_times <= 0` (`agent.py:L748-L749`). If the LLM still answers `forward`, the forward branch runs again without checking the counter (`experiment.py:L116-L121`).
   - [code] The loop is `while True` with no `else` branch: an empty decision or one outside {forward, execute, split}, or a post-split decision outside {completed, incompleted}, makes the loop repeat with new LLM calls (`experiment.py:L95-L207`). I did not find a global iteration ceiling or a per-task timeout (search: `timeout|max_iter|max_steps` in `src/`).
4. **Mechanical verification/acceptance.**
   - [code] Normalized exact-match against the answer key (yes/no, parenthesized option, string): `evaluator/evaluator.py:L100-L113`, with extraction of the last `RESULT:` line (`utils/Result_Extractor.py:L9-L19`).
   - [code] The result (`success`) **feeds back into the system during training**: it enters the experience pool and updates edge weights and abilities (`experiment.py:L240-L302`). In testing, it only measures (`experiment.py:L352-L356`). There is no internal verification without an answer key, nor an LLM-judge.
5. **Cost/budget control.** [code] Nonexistent. Each call has `max_tokens=2048` (`src/utils.py:L72`, `L92`). There is no token or cost counting for the default model `gpt-4o-mini` (search: `usage|prompt_tokens|completion_tokens|cost`; the only occurrence is a `usage` log in the Qwen path, `utils.py:L126`). Each routing step makes at least one LLM call, and each execution makes two (thought + execution when `user_react=True`: `agent.py:L795-L808`; `yaml:L8`).
6. **Memory (experience pools).**
   - [code] Each agent has a router pool and an executor pool (`agent.py:L43-L52`, `L478-L486`, `L720-L728`). Only **successful** trajectories enter the retrieval pool; failures go to `failure_experiences`, an unbounded list (`src/pool.py:L108-L128`, `L306-L327`). Retrieval uses top-k=3 with cosine threshold 0.7 (BGE-large) (`pool.py:L237-L265`; `yaml:L26-L27`).
   - [code] **Capacity:** the executor has limit 40 (`yaml:L21`), enforced in `pool.py:L324`. The router has `-1`, i.e., unlimited (`yaml:L23`; condition `self.capacity >= 0` in `pool.py:L125`). The global router pool also has `capacity=-1` (`src/global_vars.py:L4`). The `success_experiences` and `embedding_cache` lists have no limit (`pool.py:L80-L84`, `L96-L103`). `embedding_cache_limit: 1000` (`yaml:L22`) is not read anywhere in `src/` (search: `embedding_cache_limit`).
   - [code] **Eviction is degenerate (inference from reading).** The docstring speaks of "LLM decide" (`pool.py:L134`), but `make_agent_decision` only computes the BGE embedding of the prompt and returns `str(np.argmax(embedding))`, a dimension index (`pool.py:L190-L206`). The `task_id`s have the format `"{chain}_{n}"` (`src/task.py`, occurrences `task_id=f"{self.task_chain_id}_{self.task_id_count}"`), so they never match this index. From the code of `remove_selected_trajectory` (`pool.py:L208-L220`), when the pool is full, nothing is removed and the new experience is not added: the pool **freezes** at the limit.
   - [code] **Skill evolution:** success adds +0.1, with a ceiling of 2.0, and failure changes nothing (`agent.py:L849-L866`). Decay (`decay_abilities`) is only called from `set_executor_pool_result`, which has no callers (search: `set_executor_pool_result`), so it is dead code. `get_newest_experience` returns `experiences[:-k]`, that is, the **oldest** ones (`pool.py:L268-L270`).
7. **Failures/retry.**
   - [code] The LLM has `MAX_RETRIES = 3` with a fixed 1 s wait and re-raises on the last attempt (`src/utils.py:L15`, `L59-L84`). There is no exponential backoff or model fallback.
   - [code] Fragilities in routing. `find_best_alternative_agent` can return `None` when there are no neighbors (`agent.py:L455-L457`), and `agents[None]` in `experiment.py:L120` would raise `KeyError`. The handler in `agent.py:L113` calls `find_best_alternative_agent(task)` with one argument too few, which would raise `TypeError` inside the `except`. The entry point does not catch exceptions (`run_bigbenchhard_train_test.py:L125-L130`, try commented out).
8. **Communication pruning.**
   - [code] The edge weight is updated multiplicatively: ×1.1 on success, ×0.9 on failure, times a time factor `min(1, 1/(0.1·t))`, bounded to [0.1, 2.0] (`agentgraph.py:L140-L155`). With weight ≤0.3, the edge is **removed** from `outcoming_agent_id` (`agentgraph.py:L158-L160`) and the neighbor is no longer advertised in the prompt (`agentgraph.py:L125-L127`).
   - [code] Removal is **irreversible**: there is only an `append` at initialization (`agentgraph.py:L65`; search `outcoming_agent_id"].append`). The `t` used in the time factor is the latency of the routing call (`agent.py:L121`).
9. **Swarm size.** [code] It is fixed. An `assert agent_num == len(agent_config)` enforces the number (`run_bigbenchhard_train_test.py:L93`), and the agents are created only once (`agentgraph.py:L28-L46`). Specialization changes abilities, not the number of agents (search: `spawn|add_agent|remove_agent`, no occurrences).
10. **Cost vs quality benchmark.** Absent as code. Only training and test accuracy is recorded (`experiment.py:L229-L235`). There is a versioned log, `AgentNet_Code/log/test.log` (3179 lines, dated 2025-03-02), with accuracy lines. It is an author artifact, not validated here. The README has no numbers. The `AgentNet.pdf` included in the repository was not read.

## Evidence

- **Observed implementation:** LLM routing with heuristic validation, partially hard termination, exact-match feeding back into edges, pools and abilities, irreversible edge pruning by weight threshold, pools with capacity and inoperative eviction, no cost control.
- **Author report:** "Fully Decentralized Architecture… improving fault tolerance" and "Dynamically Evolving DAG Topology" (`readme.md:L28-L32`). The limitation declared in the paper (via context, paper not read here) is that the router operates over a small set of predefined candidates. This is consistent with the code: a complete graph of 3 fixed agents.
- **"Decentralized" in practice:** flow control lives in a single `Experiment` class, which receives the global `success` and updates all agents (`experiment.py:L1-L6`, `L240-L260`). The routing decision is local to each agent, but orchestration and credit are central.
- **Gaps:** I did not read `src/task.py` in full, `src/utils.py` outside L55–L144, the prompts (except L300–L345 of `setting.py`) or `models/`. The execution consequences described in items 6 and 7 are inferences from reading, not observed behavior.
- No code was executed; no benchmark reproduced.

## Engineering analogue

*Hypothesis.* For the Observatory, AgentNet is a case of "N agents with LLM routing and credit by acceptance". Mechanical acceptance (exact-match) is already the signal that prunes edges and feeds memory, which aligns with cost per accepted task. For a fair comparison with 1 strong agent, what would be missing is: (a) a hard ceiling on hops and on calls per task, since today a loop can spin without limit; (b) token counting per task, considering that each hop costs ≥1 call and each execution 2; (c) real, bounded eviction in the pools.

## Testable hypothesis

- *Hypothesis H1:* on BBH with 3 agents, the mean number of LLM calls per accepted task is at least 3× that of a single agent that executes directly (1–2 calls per task). The metric is calls, or tokens, per item with exact-match true. The hypothesis is false if the ratio is less than 3.
- *Hypothesis H2:* with `executor_memory_limit=40`, after an agent accumulates 40 successes, test accuracy stops improving with more training, because the pool freezes. The metric is test accuracy as a function of the number of training tasks (40, 80, 120). The hypothesis is false if accuracy keeps rising by more than 2 pp after the freeze.

## Limits/gaps

- No license, and officiality is only self-declared.
- Termination depends on the LLM obeying the format. There is no global step ceiling or budget.
- The "intelligent" eviction does not call an LLM and, from reading, never removes anything. Ability decay is dead code. The correlation between task types is probably never computed (it is compared only within the same `task_type`; `agent.py:L870-L878`).
- The "evolutionary" topology amounts to removing edges from a small complete graph. There is no creation of edges or agents.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| — partial: only the split branch has a hard ceiling (`max_execution_times=5`, `experiment.py:L203-L206`); forward limit only by prompt (`agent.py:L748`); `while True` without else | ✓ exact-match against answer key in the training loop (`evaluator.py:L100-L113`; `experiment.py:L219`, `L240-L260`) | — only `max_tokens=2048` per call (`utils.py:L72`); no counting | ✓ edge removed at weight ≤0.3 (`agentgraph.py:L155-L160`) | — fixed `agent_num` (`run_bigbenchhard_train_test.py:L93`) | ✓ partial: executor with capacity 40 (`pool.py:L324`; `yaml:L21`); router `-1` unlimited; inoperative eviction (`pool.py:L190-L220`) | — no LICENSE file or declaration in the readme |
