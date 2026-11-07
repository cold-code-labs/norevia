---
id: oss-openai-agents-sdk
title: OpenAI Agents SDK — turn loop with handoffs, max_turns=10 and tripwire guardrails
area: oss
evidence: observed-implementation
tags: [handoff, agents-as-tools, max-turns, guardrails, structured-output, input-filter, usage-tracking, retry-opt-in, sessions]
sources:
  - "https://github.com/openai/openai-agents-python/tree/27c75c5f9c5fd957d28c04fb7e9eeacaad4630a9 (inspected commit, shallow clone on 2026-11-07)"
related: [oss-openai-swarm, oss-langgraph-swarm, oss-langgraph-supervisor, oss-crewai, oss-autogen, oss-agentprune, oss-matrix, oss-patterns]
updated: 2026-11-07
summary: Production successor to Swarm; the Runner executes turns until there is a schema-validated final output, with a default limit of 10 turns, user-defined tripwire guardrails, history filters on handoffs, and usage accounting without a hard token/cost limit.
---

## Identification

- URL: https://github.com/openai/openai-agents-python
- Inspected SHA: `27c75c5f9c5fd957d28c04fb7e9eeacaad4630a9`
- Commit date: 2026-11-06T16:21:40+00:00
- License: MIT ("MIT License / Copyright (c) 2025 OpenAI"), read in `LICENSE`.
- Scope actually read (excerpts): `src/agents/run.py` (docstring of `Runner.run` and loop branches), `src/agents/run_config.py`, `src/agents/agent.py` (fields of `Agent`), `src/agents/handoffs/__init__.py`, `src/agents/handoffs/history.py`, `src/agents/extensions/handoff_filters.py`, `src/agents/extensions/tool_output_trimmer.py`, `src/agents/agent_output.py`, `src/agents/run_internal/turn_resolution.py` (final output resolution, multiple handoffs), `src/agents/run_internal/model_retry.py`, `src/agents/retry.py`, `src/agents/model_settings.py`, `src/agents/guardrail.py`, `src/agents/run_error_handlers.py`, `src/agents/usage.py`, `src/agents/tool.py` (default tool error), `src/agents/memory/session_settings.py`, `src/agents/memory/openai_responses_compaction_session.py`, `src/agents/exceptions.py`; examples `examples/agent_patterns/{input_guardrails,output_guardrails,llm_as_a_judge,parallelization}.py` (excerpts). Not read: `realtime/`, `voice/`, `sandbox/`, `mcp/`, most of `run_internal/`, tests (only names listed).

## Mechanism

1. **Communication topology.** Two patterns: (a) **handoff** — the active agent transfers control and the next agent receives the history (in full by default) (`src/agents/handoffs/__init__.py:L159-L163`); (b) **agents-as-tools** — `Agent.as_tool` (`src/agents/agent.py:L630`) keeps a central orchestrator that calls subagents as tools **[code]**. Parallelism between agents only via user code (`asyncio.gather` in `examples/agent_patterns/parallelization.py:L30`) **[example]**.
2. **Who decides who acts.** The LLM of the active agent, by calling the tool `transfer_to_<name>` (`src/agents/handoffs/__init__.py:L228-L232`); the runner switches `current_agent` on `NextStepHandoff` (`src/agents/run.py:L1543-L1555`) **[code]**. If the model requests several handoffs in the same turn, only the first is executed and the others receive "Multiple handoffs detected, ignoring this one." (`src/agents/run_internal/turn_resolution.py:L580-L590`) **[code]**. Handoffs can be enabled/disabled dynamically via `is_enabled` (`src/agents/handoffs/__init__.py:L193-L195`) **[code]**.
3. **Termination criterion.** Terminates when there is a final output (text with no pending tool calls, or valid JSON for `output_type`) (`src/agents/run.py:L300-L304`; `src/agents/run_internal/turn_resolution.py:L1206-L1333`) **[code]**. Turn limit with a default: `DEFAULT_MAX_TURNS = 10` (`src/agents/run_config.py:L45`), parameter `max_turns: int | None = DEFAULT_MAX_TURNS` (`src/agents/run.py:L287`); exceeded → `MaxTurnsExceeded` unless there is an `error_handlers["max_turns"]` (`src/agents/run.py:L1597-L1622`; `src/agents/run_error_handlers.py:L53`) **[code]**. `None` disables the limit (`src/agents/run.py:L319-L321`) **[code]**. `tool_use_behavior` (default `"run_llm_again"`; also `"stop_on_first_tool"`, `StopAtTools`, function) allows terminating from a tool result (`src/agents/agent.py:L400-L420`) **[code]**. `reset_tool_choice=True` exists so that "the agent doesn't enter an infinite loop of tool usage" (`src/agents/agent.py:L422-L424`) **[code]**.
4. **Mechanical verification/acceptance.** (a) **Schema**: with a non-text `output_type`, the output is validated via Pydantic `TypeAdapter` in strict mode (`src/agents/agent_output.py:L142-L153`; called in `src/agents/run_internal/turn_resolution.py:L1252`); failure → `ModelBehaviorError` raised (no automatic re-prompt) unless `error_handlers["invalid_final_output"]` handles it (`turn_resolution.py:L1253-L1268`; `run_error_handlers.py:L55`) **[code]**. (b) **Tripwire guardrails**: input guardrails (only of the first agent, only on turn 0: `src/agents/run.py:L1047-L1051`), output guardrails on the final output (`src/agents/agent.py:L382-L385`), and tool guardrails (`src/agents/tool_guardrails.py:L152`, `L181`); `tripwire_triggered=True` halts execution (`src/agents/guardrail.py:L29-L32`, `L81-L83`) **[code]**. The SDK ships no ready-made guardrails in the core: the function is the user's and can be deterministic — e.g., a substring check for `"650"` (`examples/agent_patterns/output_guardrails.py:L41-L49`) — or LLM-based — a classifier agent (`examples/agent_patterns/input_guardrails.py:L38-L57`) **[example]**. Input guardrails run in parallel by default (`run_in_parallel: bool = True`, `src/agents/guardrail.py:L100`) **[code]**.
5. **Cost/budget control.** `Usage` accumulates `requests`, `input_tokens`, `output_tokens`, `total_tokens` and per-request entries (`src/agents/usage.py:L196-L230`) **[code]** — it is tracking, not a limit. No hard token/cost limit per run was found (search: `budget`, `max_cost`, `usage_limit`, `token_budget`, `max_total_tokens` in `src/agents`, excluding `sandbox`) **[code]**. There are only: `max_turns` (default 10), per-call `ModelSettings.max_tokens` (default `None`, `src/agents/model_settings.py:L129-L130`) and a per-call-attempt `timeout` that explicitly does not limit the whole run (`src/agents/model_settings.py:L215-L220`) **[code]**.
6. **Memory.** Optional sessions; `SessionSettings.limit: int | None = None` — "If None, retrieves all items" (`src/agents/memory/session_settings.py:L44-L45`) **[code]**. `OpenAIResponsesCompactionSession` calls the API's `responses.compact` when there are ≥ 10 candidate items (`DEFAULT_COMPACTION_THRESHOLD = 10`, `src/agents/memory/openai_responses_compaction_session.py:L37`, `L68-L70`, `L465`) — compaction delegated to the OpenAI server, not inspected **[code]**. By default, no window/eviction.
7. **Failures/retry.** Model retry is **opt-in**: `ModelSettings.retry: ModelRetrySettings | None = None` (`src/agents/model_settings.py:L188-L189`), `max_retries: int | None = None` (`src/agents/retry.py:L213`), default backoff 0.25 s initial, 2.0 s max., multiplier 2, jitter (`src/agents/run_internal/model_retry.py:L46-L49`) **[code]**. Internal provider retries may occur and are only disabled with `max_retries<=0` (`model_retry.py:L517-L531`) **[code]**. Tool errors become, by default, the message "An error occurred while running the tool. Please try again." returned to the LLM (`src/agents/tool.py:L1997-L2002`) **[code]**.
8. **Communication pruning.** Handoff `input_filter`, per handoff or global (`RunConfig.handoff_input_filter`, `src/agents/run_config.py:L377-L383`), can remove/redact history; the ready-made filter `remove_all_tools` removes tool items (`src/agents/extensions/handoff_filters.py:L33-L58`) **[code]**. `nest_handoff_history` (beta, default `False`, `run_config.py:L385-L398`) collapses the previous transcript into a **deterministically formatted** (non-LLM) summary message (`src/agents/handoffs/history.py:L321-L327`, `L386-L400`) **[code]**. `call_model_input_filter` (`run_config.py:L455-L462`) and `ToolOutputTrimmer` (sliding window: `recent_turns=2`, `max_output_chars=500`, `preview_chars=200`, `src/agents/extensions/tool_output_trimmer.py:L112-L114`) cut old tool outputs **[code]**. All opt-in.
9. **Elastic vs fixed.** Agent graph declared in code; `is_enabled` turns handoffs on/off at runtime, but does not create agents on demand **[code]**. No automatic scaling mechanism found (search: `spawn`, `autoscal`, `agent_pool` in `src/agents`, excluding `sandbox`; only occurrences of MCP subprocesses).
10. **Cost vs quality benchmark.** Not found (search `benchmark` returned only realtime docs and maintenance skills in `.agents/skills/`). There is an LLM-as-judge example in a `while True` loop with no limit (`examples/agent_patterns/llm_as_a_judge.py:L56`) **[example]**.

## Evidence

No code was run; no benchmark reproduced. Static reading at the indicated SHA; existing tests (`tests/test_max_turns.py`, `tests/test_guardrails.py`, `tests/test_handoff_history_duplication.py`) were only listed, not read or run.

## Engineering analogue

*Engineering hypothesis.* It is the most direct candidate for implementing the Swarm Efficiency Observatory: `output_type` + strict validation provide mechanical format acceptance; deterministic output guardrails can run the task's tests as a tripwire; per-request `Usage` allows measuring cost per accepted task; `max_turns` sets a comparable cap between the "1 strong agent" and "N agents" arms. A hard token limit is missing — it would have to be implemented outside (e.g., via `call_model_input_filter` or a hook that raises an exception when a budget is exceeded).

## Testable hypothesis

- H1: On tasks with automatic tests, turning on `nest_handoff_history=True` (or `remove_all_tools`) reduces input tokens per accepted task by ≥ 25% in a triage→specialist arrangement, with an acceptance drop ≤ 2 p.p. Metric: `Usage.input_tokens` / accepted tasks; acceptance rate.
- H2: With `max_turns=10` (default), the fraction of runs terminated by `MaxTurnsExceeded` is higher in the multi-agent arrangement (handoffs) than in the single agent with the same tools; raising it to 20 increases acceptance less than proportionally to the tail cost (p95 of tokens).

## Limits/gaps

- The streaming loop (`run_internal/run_loop.py`) and resumption paths (`RunState`) were only partially seen.
- Provider retry policy (`openai` client) not inspected.
- The behavior of `responses.compact` is server-side; not locally verifiable.
- Not verified whether `Usage` is exposed to hooks in a way that allows aborting on budget without a patch.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ `DEFAULT_MAX_TURNS = 10` → `MaxTurnsExceeded` (`src/agents/run_config.py:L45`; `src/agents/run.py:L1597-L1606`) | ✓ strict validation of `output_type` (`src/agents/agent_output.py:L142-L153`) + tripwire guardrails in user code (`src/agents/guardrail.py:L29-L32`) | — only `Usage` (tracking, `src/agents/usage.py:L196-L230`), per-call `max_tokens` and `max_turns`; no token/cost cap per run | ✓ (opt-in) `input_filter`/`remove_all_tools`, `nest_handoff_history`, `ToolOutputTrimmer` (`src/agents/extensions/handoff_filters.py:L33`; `src/agents/extensions/tool_output_trimmer.py:L112-L114`) | — fixed graph; only `is_enabled` is dynamic (`src/agents/handoffs/__init__.py:L193`) | ✓ (opt-in) `SessionSettings.limit` (default `None` = everything) and compaction at ≥10 items (`src/agents/memory/openai_responses_compaction_session.py:L37`) | MIT (`LICENSE`) |
