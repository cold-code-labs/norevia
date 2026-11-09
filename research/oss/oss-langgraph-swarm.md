---
pivot: adapt
pivot_reason: "Coordination implementation can host defensive workflows; no tested security boundary follows from this card."
id: oss-langgraph-swarm
title: LangGraph Swarm — handoff via Command(goto) and active_agent router over StateGraph
area: oss
evidence: observed-implementation
tags: [handoff, langgraph, command-goto, active-agent, routing, shared-history, thin-library]
sources:
  - "https://github.com/langchain-ai/langgraph-swarm-py/tree/8956b138bbb475b00c98d040176dbb8da667c612 (inspected commit, shallow clone on 2026-11-07)"
related: [oss-langgraph-supervisor, oss-openai-swarm, oss-openai-agents-sdk, oss-crewai, oss-matrix, oss-patterns]
updated: 2026-11-07
summary: Thin layer (~400 lines) over LangGraph in which each agent is a node, handoffs are tools that return Command(goto=agent, graph=PARENT) and a router at START resumes the last active_agent; termination, limits and memory live entirely in the LangGraph core, not inspected here.
---

## Identification

- URL: https://github.com/langchain-ai/langgraph-swarm-py
- Inspected SHA: `8956b138bbb475b00c98d040176dbb8da667c612`
- Commit date: 2026-10-29T02:30:06+09:00
- License: MIT ("MIT License / Copyright (c) 2025 LangChain, Inc."), read in `LICENSE`.
- Declared dependencies: `langchain>=1,<2`, `langchain-core>=1,<2`, `langgraph>=1,<2` (`pyproject.toml`, `[project]` block) **[code]**.
- Scope actually read: `langgraph_swarm/swarm.py` (in full, 289 lines), `langgraph_swarm/handoff.py` (in full, 117 lines), `README.md` (introduction, Memory, How to customize), `tests/test_swarm.py` (test names). Not read: `examples/`. **The `langgraph` core is not cloned: all execution behavior (Pregel cycle, `recursion_limit`, checkpointers, reducers) is marked as not inspected.**

## Mechanism

1. **Communication topology.** `StateGraph` graph with one node per agent (`langgraph_swarm/swarm.py:L277-L287`); handoff edges declared from each agent's handoff tools (`destinations=get_handoff_destinations(agent)`, `swarm.py:L283-L286`; extraction via metadata in `langgraph_swarm/handoff.py:L99-L117`) **[code]**. All agents share the same `messages` key of `SwarmState(MessagesState)` (`swarm.py:L13-L19`); the README confirms that messages from **all** agents are combined into a single list (`README.md`, section "Customizing agent implementation") **[code]/[README/docs]**.
2. **Who decides who acts.** The LLM of the active agent, calling `transfer_to_<agent>`; the tool returns `Command(goto=agent_name, graph=Command.PARENT, update={"messages": [...], "active_agent": agent_name})` (`langgraph_swarm/handoff.py:L73-L93`) **[code]**. At the start of each invocation, a conditional router at `START` reads `state["active_agent"]` (default `default_active_agent`) (`swarm.py:L163-L166`) **[code]** — this makes it possible to resume the last agent across conversation turns, provided there is a checkpointer (`README.md:L119`) **[README/docs]**. `active_agent` is restricted to `Literal[names]` (`swarm.py:L60-L67`) **[code]**.
3. **Termination criterion.** Nothing in the repository: there is no edge to `END`, step counter, `recursion_limit` or `max_*` — not found (search: `recursion_limit`, `END`, `max_`, `retry` in `*.py`) **[code]**. It is presumed that execution ends when the agent's node returns without a handoff `Command` and that the step limit is LangGraph's `recursion_limit` — **not inspected here** (core absent).
4. **Mechanical verification/acceptance.** None: there is no output validation, schema, guardrail or test in the loop — not found (search: `guardrail`, `structured`, `response_format`). The only validation is structural, at graph construction (agent names, existing `default_active_agent`, non-empty list: `swarm.py:L255-L268`) **[code]**.
5. **Cost/budget control.** No limit or token tracking in the repository (search: `usage`, `token`, `max_`) **[code]**. Any control depends on the LangGraph/LangChain core (not inspected).
6. **Memory.** Memory = graph state (`messages` + `active_agent`) persisted by the checkpointer/store passed to `.compile()` (`README.md:L89-L119`) **[README/docs]**; capacity, window or eviction are not handled in this repository **[code]**.
7. **Failures/retry.** Not found (search: `retry`, `except`). `_get_field` raises `TypeError` for an unsupported state type (`handoff.py:L26-L31`) **[code]**.
8. **Communication pruning.** By default **none**: the handoff sends `[*state["messages"], tool_message]` — full history of the transferring agent (`handoff.py:L90`); README: "by default `create_handoff_tool` passes **full** message history" **[code]/[README/docs]**. Pruning is possible only through manual customization (own handoff, private per-agent message keys with a transformation wrapper) (`README.md`, sections "Customizing handoff tools" and "Customizing agent implementation") **[README/docs]**.
9. **Elastic vs fixed.** Fixed: the list of agents is given to `create_swarm` and compiled into nodes (`swarm.py:L264-L287`) **[code]**.
10. **Cost vs quality benchmark.** None; the tests (`test_basic_swarm`, `test_basic_swarm_pydantic`, `tests/test_swarm.py:L48`, `L151`) are functional **[test]** (not executed).

## Evidence

No code was executed; no benchmark reproduced. Static reading of the indicated SHA. Runtime behavior depends on LangGraph, whose implementation was not inspected.

## Engineering analogue

*Engineering hypothesis.* Represents the "N agents in a mesh with shared state" arm of the Swarm Efficiency Observatory with the minimum of its own logic: the marginal cost of each handoff is resending the entire combined history. To measure cost per accepted task, acceptance and budget would have to be added as extra graph nodes (e.g. a verifier node with tests before `END`) — none of this comes ready-made.

## Testable hypothesis

- H1: In a 3-agent swarm with shared history (default), input tokens per accepted task grow superlinearly with the number of handoffs (exponent ≥ 1.5 in a log-log fit), whereas with private per-agent history (README wrapper) they grow ~linearly; acceptance rate does not differ by more than 3 pp.
- H2: Without an explicit `recursion_limit` from the caller, agent pairs with overlapping descriptions produce A↔B handoff cycles in ≥ 5% of ambiguous tasks; measure via count of `active_agent` alternating ≥ 4 times.

## Limits/gaps

- LangGraph core not cloned: termination, `recursion_limit`, reducer semantics (`add_messages`, deduplication by id) and persistence not verified.
- `examples/` not read.
- Behavior when an agent emits multiple parallel handoffs in the same step not verified.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ? nothing in the repo (search `recursion_limit`/`END`/`max_`); depends on the LangGraph core, not inspected | — no validation/guardrail (`langgraph_swarm/swarm.py`, `handoff.py`) | — no limit/usage in the repo | — default sends full history (`langgraph_swarm/handoff.py:L90`); pruning only via manual customization | — agents fixed at construction (`langgraph_swarm/swarm.py:L277-L287`) | ? delegated to LangGraph checkpointer/store (`README.md:L89-L119`), not inspected | MIT (`LICENSE`) |
