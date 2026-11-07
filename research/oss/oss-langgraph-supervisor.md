---
id: oss-langgraph-supervisor
title: LangGraph Supervisor — star-topology ReAct supervisor with output_mode last_message as default pruning
area: oss
evidence: observed-implementation
tags: [supervisor, hierarchy, langgraph, handoff, history-pruning, output-mode, parallel-tool-calls, send]
sources:
  - "https://github.com/langchain-ai/langgraph-supervisor-py/tree/88859b34017ac3569bbd4a3092c7e77593a0a960 (inspected commit, shallow clone on 2026-11-07)"
related: [oss-langgraph-swarm, oss-openai-agents-sdk, oss-openai-swarm, oss-crewai, oss-agentprune, oss-metagpt, oss-matrix, oss-patterns]
updated: 2026-11-07
summary: Thin library over LangGraph that builds a ReAct supervisor in a star topology (supervisor → worker → supervisor), with handoff via tools, optional parallel fan-out via Send and default pruning of worker outputs to the last message; termination and limits depend on the LangGraph core, not inspected.
---

## Identification

- URL: https://github.com/langchain-ai/langgraph-supervisor-py
- Inspected SHA: `88859b34017ac3569bbd4a3092c7e77593a0a960`
- Commit date: 2026-07-14T23:32:51-07:00
- License: MIT ("MIT License / Copyright (c) 2025 LangChain, Inc."), read in `LICENSE`.
- Declared version: `0.0.31` (`pyproject.toml`) **[code]**.
- Status: the README recommends using the "supervisor pattern directly via tools" instead of this library in most cases (`README.md:L3`) **[README/docs]**.
- Scope actually read: `langgraph_supervisor/supervisor.py` (in full, 469 lines), `langgraph_supervisor/handoff.py` (L40-L213), `README.md` (Features, Message History Management, Multi-level Hierarchies, Message Forwarding), test names in `tests/`. Not read: `agent_name.py` (only via call), body of the tests. **`langgraph` core (incl. `create_react_agent`, `ToolNode`, `Send`, `recursion_limit`) not cloned → not inspected.**

## Mechanism

1. **Communication topology.** Star: `START → supervisor` (`langgraph_supervisor/supervisor.py:L456`), the supervisor can go to any worker or `END` (`destinations=tuple(agent_names) + (END,)`, `L455`), and each worker has a fixed edge back to the supervisor (`L467`) **[code]**. Workers do not talk to each other directly. Multi-level hierarchy: a compiled supervisor is a `Pregel` and can be passed as an "agent" of another supervisor (`create_supervisor(agents: list[Pregel], ...)`, `L211-L212`; example in `README.md`, section "Multi-level Hierarchies") **[code]/[README/docs]**.
2. **Who decides who acts.** The supervisor's LLM (a ReAct agent created with `create_react_agent`, `supervisor.py:L443-L452`) choosing `transfer_to_<agent>` tools generated automatically for all workers (`supervisor.py:L175-L186`; `langgraph_supervisor/handoff.py:L82-L86`) **[code]**. The tool returns `Command(goto=agent_name, graph=Command.PARENT, ...)` (`handoff.py:L122-L126`) **[code]**. **Parallelism**: `parallel_tool_calls: bool = False` by default (`supervisor.py:L222`), applied via `bind_tools` when the model supports it (`L432-L438`; exclusions `{"o3-mini", "o3", "o4-mini"}` in `L45`) **[code]**. With parallel handoffs, each tool emits `Send(agent_name, ...)` for fan-out (`handoff.py:L100-L115`) **[code]**.
3. **Termination criterion.** Terminates when the supervisor finishes without a handoff (destination `END` declared in `supervisor.py:L455`) **[code]**; the supervisor's ReAct loop and the step limit (`recursion_limit`) belong to the LangGraph core — **not inspected**. There is no `max_*`, counter or `recursion_limit` in the repo (search: `recursion_limit`, `retry`, `usage`, `max_` in `langgraph_supervisor/`) **[code]**. `create_forward_message_tool` returns `Command(goto="__end__")`, with the comment "NOTE: this does nothing." (`handoff.py:L204-L211`) **[code]**.
4. **Mechanical verification/acceptance.** There is no validation of its own. `response_format` (Pydantic/JSON/TypedDict schema) is passed to `create_react_agent` to generate `structured_response` (`supervisor.py:L217-L219`, `L251-L272`, `L449`) — validation happens in the core, not inspected **[code]/[README/docs]**. `post_model_hook` is an extension point "useful for implementing ... guardrails, validation" (`supervisor.py:L305-L309`, docstring) — with no ready-made implementation **[code]**. Structural validations at construction: unique and defined names (`L409-L422`), custom handoffs covering all workers (`L164-L170`) **[code]**.
5. **Cost/budget control.** No limit or token tracking in the repo **[code]**. Mechanisms that reduce tokens without imposing a ceiling: `output_mode="last_message"` (item 8) and `create_forward_message_tool`, whose docstring says it "can save some tokens" (`handoff.py:L155-L160`) **[code]**.
6. **Memory.** Graph state (`messages` with reducer `add_messages`, `supervisor.py:L205-L208`) persisted by LangGraph's checkpointer/store (`README.md`, "Adding Memory") **[README/docs]**. No window/eviction in this repo; `pre_model_hook` is the documented point for trimming/summarization (`supervisor.py:L273-L304`, docstring) **[code]**. For `RemoteGraph` workers, a `thread_id` derived by `uuid5(thread_id, agent.name)` isolates the state (`L102-L108`) **[code]**.
7. **Failures/retry.** Not found in the repo (search: `retry`). Tool error handling is inherited from the input `ToolNode` (`handle_tool_errors=input_tool_node._handle_tool_errors`, `supervisor.py:L192-L198`) — semantics in the core, not inspected **[code]**.
8. **Communication pruning.** Central mechanism: `output_mode: OutputMode = "last_message"` by default (`supervisor.py:L225`). In `last_message` only the worker's last message returns to the shared state (or the last 2 if the last one is a `ToolMessage`); in `full_history` everything returns (`supervisor.py:L77-L91`) **[code]**. `add_handoff_messages=False` removes the handoff's AIMessage/ToolMessage pair from the history (`handoff.py:L116-L121`) and, in a parallel handoff, `_remove_non_handoff_tool_calls` filters out unrelated tool calls (`handoff.py:L42-L51`, `L101-L109`) **[code]**. Caution: the worker's **input** is the entire state (`agent.invoke(state, ...)`, `supervisor.py:L103-L104`) — the default pruning applies only to the return **[code]**.
9. **Elastic vs fixed.** Set of workers fixed at construction (`supervisor.py:L457-L467`) **[code]**. Parallel fan-out via `Send` is dynamic in the number of calls per step, but limited to the pre-declared workers (`handoff.py:L110-L115`) **[code]**.
10. **Cost vs quality benchmark.** None in the repo; functional tests (`tests/test_supervisor.py:L165`, `L333`, `L428`) **[test]** (not executed).

## Evidence

No code was executed; no benchmark reproduced. Static reading at the indicated SHA. The recommendation to prefer a manual supervisor via tools is an author report (`README.md:L3`).

## Engineering analogue

*Engineering hypothesis.* This is the "central orchestrator + N workers" arm of the Swarm Efficiency Observatory, with an explicit pruning lever (`output_mode`). It makes it possible to isolate the effect of **return pruning** on cost per accepted task while keeping topology and models fixed. Since the worker receives the entire state, the savings from `last_message` apply only to the supervisor's subsequent calls; a deterministic verifier would need to come in as a `post_model_hook` or an extra node.

## Testable hypothesis

- H1: On tasks with automatic tests and ≥ 3 delegations, `output_mode="last_message"` reduces the supervisor's input tokens per accepted task by ≥ 30% vs `full_history`, with an acceptance loss ≤ 3 pp. Metric: input tokens (supervisor) / accepted task.
- H2: `parallel_tool_calls=True` reduces wall-clock latency on decomposable tasks, but increases cost per accepted task (≥ 10%) through redundant delegations; measure number of `Send` per task and acceptance.

## Limits/gaps

- `create_react_agent`, `ToolNode`, `Send`, `recursion_limit` and `response_format` validation belong to the LangGraph core, not inspected.
- Merge semantics of parallel `Send` and of the `add_messages` reducer not verified.
- Not verified whether `full_history` duplicates messages already present in the state (depends on deduplication by id in the reducer).

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ? supervisor declares destination `END` (`langgraph_supervisor/supervisor.py:L455`), but the step limit belongs to the LangGraph core (not inspected) | ? `response_format` passed on to the core (`supervisor.py:L449`); `post_model_hook` only an extension point | — no limit/usage in the repo | ✓ `output_mode="last_message"` default (`supervisor.py:L225`, `L77-L91`); `add_handoff_messages=False` (`handoff.py:L116-L121`) | — fixed workers; parallel `Send` only among pre-declared ones (`handoff.py:L110-L115`) | ? delegated to checkpointer/`pre_model_hook` (`supervisor.py:L273-L304`), not implemented in the repo | MIT (`LICENSE`) |
