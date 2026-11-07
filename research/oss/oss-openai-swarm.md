---
id: oss-openai-swarm
title: OpenAI Swarm — handoff as a function that returns Agent in a single chat-completions loop
area: oss
evidence: observed-implementation
tags: [handoff, lightweight-orchestration, agent-loop, context-variables, educational, no-budget]
sources:
  - "https://github.com/openai/swarm/tree/6af0b4caf37dca4526dfd98e9fbd8ce36e7eeb22 (inspected commit, shallow clone on 2026-11-07)"
related: [oss-openai-agents-sdk, oss-langgraph-swarm, oss-langgraph-supervisor, oss-crewai, oss-autogen, oss-matrix, oss-patterns]
updated: 2026-11-07
summary: Minimal educational library (~420 lines) in which a single loop switches the active agent when a tool returns another Agent, ending when there are no tool calls; there is no budget, retry, output validation or history pruning.
---

## Identification

- URL: https://github.com/openai/swarm
- Inspected SHA: `6af0b4caf37dca4526dfd98e9fbd8ce36e7eeb22`
- Commit date (`git log -1 --format=%cI`): 2026-04-15T13:10:28-04:00
- License: MIT ("MIT License / Copyright (c) 2024 OpenAI"), read in `LICENSE`.
- Declared status: `README.md:L3` "Swarm (experimental, educational)"; `README.md:L6-L8` states that it has been replaced by the OpenAI Agents SDK and recommends migrating for production use **[README/docs]**.
- Scope actually read: `swarm/core.py` (in full, 292 lines), `swarm/types.py` (in full), `swarm/util.py` (in full), `README.md` (excerpts via search), `tests/test_core.py` (test names), `examples/triage_agent/evals.py` and `evals_util.py` (beginning). Not read: `swarm/repl/`, other examples.

## Mechanism

1. **Communication topology.** A single shared linear history; in each iteration only the `active_agent` is called with `system = instructions` + the entire history (`swarm/core.py:L41-L47`) **[code]**. The handoff graph is implicit: any function of an agent can return another `Agent` (`swarm/core.py:L76-L80`) **[code]**. There is no broadcast and no parallelism between agents; only parallel tool calls within a turn (`parallel_tool_calls: bool = True`, `swarm/types.py:L20`; passed on in `swarm/core.py:L66-L67`) **[code]**.
2. **Who decides who acts.** The LLM of the active agent, when it chooses to call a function that returns `Agent`/`Result(agent=...)`; the loop switches `active_agent` (`swarm/core.py:L134-L135`, `L285-L286`) **[code]**. If several tool calls in the same turn return agents, the last one processed prevails (overwrite in `L134-L135`) **[code]**.
3. **Termination criterion.** (a) model message without tool calls or `execute_tools=False` → `break` (`swarm/core.py:L275-L277`; streaming `L198-L200`) **[code]**; (b) `max_turns`, whose default is infinite: `max_turns: int = float("inf")` (`swarm/core.py:L239`, also `L146`) **[code]**. Note: the condition `len(history) - init_len < max_turns` (`swarm/core.py:L257`) counts appended **messages** (assistant + tool messages), not turns, although the README describes "conversational turns" (`README.md:L133`) **[code]/[README/docs]**.
4. **Mechanical verification/acceptance.** There is no final-output validation, output schema or guardrails in the core — not found in the inspected code (search: `guardrail`, `validate`, `output_type`, `schema` in `swarm/`). The only check is structural: a nonexistent tool becomes the message `"Error: Tool {name} not found."` (`swarm/core.py:L103-L113`) **[code]**. The example evals use an LLM-judge (`gpt-4o` via `instructor`, `examples/triage_agent/evals_util.py:L14-L23`) and deterministic asserts on the name of the called tool (`examples/triage_agent/evals.py:L44-L48`) **[example]**.
5. **Cost/budget control.** No token/cost/call limit; no usage tracking — not found (search: `usage`, `token`, `cost`, `budget`). The only brake is `max_turns` (default ∞) **[code]**.
6. **Memory.** `context_variables` (dict) copied by `deepcopy` at the start (`swarm/core.py:L253`) and updated by `Result.context_variables` (`swarm/core.py:L133`, `L284`) **[code]**; the history grows without limit and is resent in full on every call (`swarm/core.py:L47`, `L271-L273`, `L283`) **[code]**. README: "stateless between calls" (`README.md:L81`) **[README/docs]**. No window, summarization or eviction.
7. **Failures/retry.** No retry: the call `self.client.chat.completions.create(**create_params)` (`swarm/core.py:L69`) has no handling; the `json.loads` of the arguments (`L114`) and the function execution (`L122`) are not in a `try`, so exceptions propagate and abort the run **[code]**. Only the conversion of the result to `str` has a `try` and re-raises `TypeError` (`swarm/core.py:L82-L87`) **[code]**.
8. **Communication pruning.** None; the full history is always sent to the next agent (`swarm/core.py:L47`). `context_variables` are hidden from the tools' schema (`swarm/core.py:L51-L56`) — this is parameter hiding, not history pruning **[code]**.
9. **Elastic vs fixed.** Set of agents defined by the user in Python; an agent can return a dynamically constructed `Agent`, but there is no demand-based sizing mechanism or simultaneous execution of N agents **[code]** (inference from `swarm/core.py:L76-L80`).
10. **Cost vs quality benchmark.** None. There are example evals (LLM-judge + routing asserts) and a `logs/` folder with JSON sessions from 2024, not analyzed **[example]**.

## Evidence

No code was executed; no benchmark reproduced. All statements come from static reading at the indicated SHA; numbers and status come from the README (author report).

## Engineering analogue

*Engineering hypothesis.* In the Swarm Efficiency Observatory, Swarm serves as a **minimal baseline of "N agents via handoff"**: same model, same history, swap of prompt/tools. Since the entire history is resent on every call and there is no pruning, the cost per accepted task should grow roughly with (number of calls × history size), with no parallelism gain. Useful as a control against "1 strong agent with all the tools", isolating the pure effect of instruction specialization.

## Testable hypothesis

- H1: On verifiable tasks (e.g. routing + answer with tests), a Swarm arrangement with triage + 2 specialists consumes ≥ 20% more input tokens per accepted task than a single agent with the same tools, with no statistically significant increase in acceptance rate. Metric: input tokens/accepted task, acceptance rate (automatic test), n ≥ 100 tasks.
- H2: With infinite `max_turns` (default), a non-zero fraction of runs with faulty tools does not terminate within an external wall-clock limit; imposing a finite `max_turns` reduces tail cost (p95 of tokens) without reducing acceptance.

## Limits/gaps

- `swarm/repl/repl.py` and complex examples (airline, support_bot) not read.
- Actual behavior of the loop with current models not verified (nothing executed).
- Documentation×code ambiguity in `max_turns` (messages vs turns) identified only by reading.
- Project declared as replaced (`README.md:L6`); does not represent production practice.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ (config only) — `max_turns` is a parameter of `run` but default `float("inf")` (`swarm/core.py:L239`); natural stop depends on the LLM not emitting tool calls (`L275-L277`) | — no output validation; evals only in examples (LLM-judge) | — no limit/usage; only `max_turns` (∞) | — full history always resent (`L47`) | — fixed agents defined in code | — unbounded history; free-form `context_variables` dict | MIT (`LICENSE`) |
