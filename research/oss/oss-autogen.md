---
id: oss-autogen
title: "AutoGen — group chat with a central manager and composable termination conditions"
area: oss
evidence: observed-implementation
tags: [group-chat, central-orchestrator, termination-conditions, selector-llm, handoff, magentic-one, ledger, replanning, bounded-context, archived-project]
sources:
  - "https://github.com/microsoft/autogen/tree/d07c667a3239ea4ab7af62a53b0f4ff205a1f23d (inspected commit, shallow clone on 2026-11-07)"
related: [oss-matrix, oss-patterns, oss-openai-swarm, oss-openai-agents-sdk, oss-langgraph-swarm, oss-langgraph-supervisor, oss-crewai, oss-camel, oss-metagpt, oss-chatdev-macnet, oss-moa]
updated: 2026-11-07
summary: "In AutoGen (AgentChat), a central manager chooses who speaks: round-robin, by LLM, by handoff, or by ledger with replanning. Termination comes from composable conditions (&, |); the token limit is checked only after each turn, against usage already reported. By default the team has no mechanical acceptance, and the repository is archived."
---

# AutoGen (AgentChat): central manager and composable termination conditions

## Identification

- **URL:** https://github.com/microsoft/autogen
- **Inspected SHA:** `d07c667a3239ea4ab7af62a53b0f4ff205a1f23d`
- **Commit date:** 2026-10-28T14:45:27+00:00 (`git log -1 --format=%cI`)
- **License:** dual license, according to the files read.
  - `LICENSE` is the Creative Commons Attribution 4.0 International (`LICENSE:L1`).
  - `LICENSE-CODE` is the MIT License, "Copyright (c) Microsoft Corporation." (`LICENSE-CODE:L1-L3`).
  - The README explains the split: CC-BY-4.0 covers documentation and content, and MIT covers code (`README.md:L229-L231`) **[README/docs]**.
- **Project status:** the README marks the project as archived. **[README/docs]**
  - "status-archived" badge and the notice "Project archived and no longer maintained" (`README.md:L14-L19`).
  - New users should use the Microsoft Agent Framework (`README.md:L29-L31`).
  - The README also describes itself as in "maintenance mode", accepting only bug fixes, security patches and documentation (`README.md:L222`).
- **Scope of what was read** (paths under `python/packages/` appear abbreviated throughout the card):
  - **Teams** (`autogen-agentchat/src/autogen_agentchat/teams/_group_chat/`):
    - `_base_group_chat_manager.py` (in full);
    - `_round_robin_group_chat.py` (excerpts);
    - `_selector_group_chat.py` (L60-L310 and the signature);
    - `_swarm_group_chat.py` (L20-L150);
    - `_magentic_one/_magentic_one_orchestrator.py` (L60-L536);
    - `_magentic_one/_magentic_one_group_chat.py` (signature);
    - `_chat_agent_container.py` (L1-L140);
    - `_graph/_digraph_group_chat.py` (only the cycle guard);
    - `_base_group_chat.py` (only the constructor).
  - **Termination:** `conditions/_terminations.py` (excerpts) and `base/_termination.py` (L79-L160).
  - **Agents:** `agents/_code_executor_agent.py` (L430-L640, by grep and excerpts) and `agents/_assistant_agent.py` (by grep).
  - **Context:** `autogen-core/src/autogen_core/model_context/*.py`.
  - **Benchmark:**
    - `agbench/benchmarks/HumanEval/Templates/AgentChat/{scenario.py,custom_code_executor.py}`;
    - `agbench/benchmarks/GAIA/Templates/ParallelAgents/scenario.py` (excerpts);
    - `agbench/src/agbench/tabulate_cmd.py` (by grep).
  - I did not read `dotnet/`, `autogen-ext` (except for one grep) or `autogen-studio`.

## Mechanism

**1. Communication topology.**
- **Bus with a manager.** A `BaseGroupChatManager` subscribes to the group topic. Each participant lives in a `ChatAgentContainer` and receives the others' responses, which it stores in `_message_buffer`. Communication is a full broadcast over the topic, mediated by the manager.
  - Sources: `.../teams/_group_chat/_base_group_chat_manager.py:L25-L35`, `L116-L121` and `.../teams/_group_chat/_chat_agent_container.py:L53-L66` **[code]**.
- **Who may speak.** The manager publishes `GroupChatRequestPublish` only to the chosen speakers (`_base_group_chat_manager.py:L172-L193`) **[code]**.
- **Nested teams.** A `Team` can participate as a member of another team (`_chat_agent_container.py:L85-L105`) **[code]**.
- **`GraphFlow`.** Executes a directed graph. If the graph has cycles, the team requires a termination condition or `max_turns` (`.../_graph/_digraph_group_chat.py:L340-L341`) **[code]**.

**2. Who decides who acts.** The manager decides, through `select_speaker`.
- **`RoundRobinGroupChat`:** circular index, deterministically (`_round_robin_group_chat.py:L72-L82`) **[code]**.
- **`SelectorGroupChat`:**
  - Order of precedence:
    1. `selector_func`, if it returns a name (`_selector_group_chat.py:L163-L177`);
    2. otherwise, `candidate_func` filters the candidates (`L180-L192`);
    3. otherwise, the previous speaker is removed when `allow_repeated_speaker=False` (`L196-L199`).
  - After that, an LLM chooses with up to `max_selector_attempts` attempts, receiving feedback when it names zero names, several names, or repeats the speaker (`L232-L300`).
  - If all attempts fail, the previous speaker speaks again, or the first candidate when there is no previous one (`L302-L308`).
  - Defaults: `allow_repeated_speaker=False` and `max_selector_attempts=3` (`L615-L616`) **[code]**.
- **`Swarm`:** the next speaker is the `target` of the last `HandoffMessage`. Without a handoff, the current speaker continues, and the first participant starts (`_swarm_group_chat.py:L45`, `L81-L97`) **[code]**.
- **`MagenticOneGroupChat`:**
  - The LLM orchestrator generates facts and a plan, which form the *task ledger* (`_magentic_one_orchestrator.py:L156-L186`).
  - At each step, it generates a *progress ledger* in JSON with the fields `is_request_satisfied`, `is_progress_being_made`, `is_in_loop`, `instruction_or_question` and `next_speaker` (`L300-L384`).
  - The JSON structure is validated up to `_max_json_retries=10` times (`L94`, `L318-L384`) **[code]**.

**3. Termination criterion.**
- **Composition.** Conditions are composable with `&` and `|` (`base/_termination.py:L79-L86`) **[code]**.
  - `AndTerminationCondition` stops only when all conditions fire (`L102-L121`).
  - `OrTerminationCondition` stops when any one fires (`L153-L160`).
- **Checkpoint.** The manager evaluates the condition on the *delta* after all active speakers respond, and then applies `max_turns` (`_base_group_chat_manager.py:L152-L161`, `L195-L228`) **[code]**.
- **Available conditions** (`conditions/_terminations.py`) **[code]**:
  - `MaxMessageTermination` (`L62-L95`);
  - `TextMentionTermination` (`L111-L145`), which accepts a `sources` filter;
  - `TokenUsageTermination` (`L235-L292`);
  - `HandoffTermination` (`L313-L340`);
  - `TimeoutTermination` (`L358-L390`): the clock starts in `__init__` (`L370`), not at the start of execution;
  - `ExternalTermination`, triggered by `set()` (`L404-L450`);
  - `SourceMatchTermination` (`L463-L495`);
  - `TextMessageTermination` (`L513-L545`);
  - `FunctionCallTermination` (`L565-L600`);
  - `StopMessageTermination` (`L24-L45`).
- **`max_turns` defaults:**
  - `None`, no limit, in `RoundRobinGroupChat` (`_round_robin_group_chat.py:L249`), `SelectorGroupChat` (`_selector_group_chat.py:L605`) and `Swarm` (`_swarm_group_chat.py:L240`) **[code]**. Therefore, these three teams can run without a limit by default.
  - `20` in `MagenticOneGroupChat` (`_magentic_one_group_chat.py:L117`) **[code]**.
- **In MagenticOne,** stopping occurs through three routes:
  - `is_request_satisfied` (an LLM judgment) (`_magentic_one_orchestrator.py:L388-L391`);
  - `n_rounds > max_turns`, which leads to `_prepare_final_answer` (`L303-L305`). The comparison uses `>`, so `max_turns+1` steps fit;
  - the user's termination condition (`L203-L210`) **[code]**.

**4. Verification and mechanical acceptance.**
- **In the team core, there is no deterministic acceptance gate.** In MagenticOne, task completion depends on an LLM evaluating `is_request_satisfied` (`_magentic_one_orchestrator.py:L388`). The JSON key validation (`L346-L374`) checks the ledger's format, not the task **[code]**.
- **Opt-in component.** The `CodeExecutorAgent` executes code and retries up to `max_retries_on_error` (default `0`, `agents/_code_executor_agent.py:L436`) **[code]**.
  - The loop stops when `exit_code == 0` or on the last attempt (`L548`, `L627-L628`).
  - Between attempts, an LLM decides whether retrying is worthwhile (`L631-L640`).
- **In the benchmark there is mechanical acceptance.** **[example]**
  - The HumanEval template appends the tests to the coder's code. It only prints `TERMINATE` if `check(candidate)` passes (`agbench/benchmarks/HumanEval/Templates/AgentChat/custom_code_executor.py:L35-L46`).
  - The team terminates via `TextMentionTermination("TERMINATE", sources=["executor"])` with `max_turns=12` (`.../scenario.py:L45-L48`).
  - The scorer searches for the success string (`agbench/src/agbench/tabulate_cmd.py:L19-L20`, `L68`).

**5. Cost control and technical budget.**
- **`TokenUsageTermination` is not a hard limit before the call.** **[code]**
  - It sums `models_usage` from the delta's messages after each turn ends (`conditions/_terminations.py:L275-L286`).
  - In practice, it only interrupts between turns, after the tokens have already been spent. A long turn, with many tool iterations, can exceed the ceiling.
- **Spending outside the count.** In the read excerpt of `_select_speaker`, the token usage of the selector call is not attached to any message (`_selector_group_chat.py:L232-L300`). Reading inference: the selector's cost is not counted **[code]**. The same holds for MagenticOne's ledger calls (`_magentic_one_orchestrator.py:L318-L332`).
- **`TimeoutTermination` does not interrupt a turn in progress.** It is also only evaluated between turns (`_base_group_chat_manager.py:L159`) **[code]**.
- **Other hard loop limits:**
  - `max_selector_attempts`;
  - `_max_json_retries=10`;
  - `max_tool_iterations` with default `1` (`agents/_assistant_agent.py:L739`, loop at `L1149`) **[code]**.
- I did not find a monetary cost limit (search: `budget`, `max_cost`, `cost` in `autogen-agentchat/src`).

**6. Memory.**
- **Unbounded by default.**
  - `AssistantAgent` uses `UnboundedChatCompletionContext()` (`agents/_assistant_agent.py:L840`).
  - So does the selector, when it receives no context (`_selector_group_chat.py:L99-L102`).
  - The manager's `_message_thread` only grows, via `extend` (`_base_group_chat_manager.py:L298-L303`) **[code]**.
- **Bounded contexts, opt-in.**
  - `BufferedChatCompletionContext(buffer_size)` returns the last N messages (`autogen-core/.../model_context/_buffered_chat_completion_context.py:L28-L36`).
  - `HeadAndTailChatCompletionContext` returns head and tail and omits the middle (`_head_and_tail_chat_completion_context.py:L32-L60`).
  - `TokenLimitedChatCompletionContext` removes messages from the middle until it fits within `token_limit` or the model's `remaining_tokens` (`_token_limited_chat_completion_context.py:L57-L72`) **[code]**.
  - Caveat: these contexts limit the *view* sent to the LLM, but storage keeps growing, because `add_message` only does `append` (`_chat_completion_context.py:L49-L57`) **[code]**.

**7. Failures and retry.**
- An exception in the manager or in a participant ends the group with `GroupChatTermination(error=...)` and propagates the error (`_base_group_chat_manager.py:L165-L170`, `L250-L260` and `_chat_agent_container.py:L106-L115`) **[code]**.
- Local retries exist:
  - in the selector (feedback to the LLM);
  - in MagenticOne's ledger parsing, with up to 10 attempts;
  - in `CodeExecutorAgent` (`max_retries_on_error`) **[code]**.
- **Replanning.** Each step without progress, or in a loop, adds 1 to `n_stalls`, and each step with progress subtracts 1 (`_magentic_one_orchestrator.py:L394-L399`). Upon reaching `max_stalls` (default `3`, `_magentic_one_group_chat.py:L119`), the orchestrator redoes facts and plan (`_update_task_ledger`, `L451-L476`) and re-enters the outer loop (`L402-L406`) **[code]**.
- **Abrupt exit.** If the ledger indicates an invalid `next_speaker`, the `break` at `L370-L374` keeps `key_error=True` and raises `ValueError` without retrying (`L383-L384`) **[code]**.

**8. Communication pruning.**
- **When replanning,** MagenticOne sends `GroupChatReset` to all participants and clears the manager's `_message_thread` before rebroadcasting the ledger (`_magentic_one_orchestrator.py:L262-L273`). This works as a per-episode history pruning **[code]**.
- **Tool calls outside the orchestrator's context.** `_thread_to_context` discards tool call events (`L514-L520`) **[code]**.
- **Candidate filter.** `candidate_func` and `allow_repeated_speaker` restrict who may speak, but do not prune messages **[code]**.
- **Opt-in.** Bounded contexts prune what the LLM sees (item 6).

**9. Elastic or fixed.** Fixed.
- Participants are defined in the constructor (`_base_group_chat.py:L81-L85`).
- I did not find a method to add or remove participants at runtime (search: `def add_`, `def remove_`, `participants.append`) **[code]**.

**10. Cost vs quality benchmark.**
- `agbench` includes HumanEval and GAIA scenarios, including `MagenticOne`, `SelectorGroupChat` and `ParallelAgents` (`python/packages/agbench/benchmarks/`) **[code/example]**.
- **`ParallelAgents`:** the closest thing to "1 vs N" in the repository. **[example]**
  - Runs `num_teams=3` MagenticOne teams in parallel and waits for `num_answers=3` answers, cancelling the remaining ones (`.../GAIA/Templates/ParallelAgents/scenario.py:L298-L369`, `L376-L377`).
  - Aggregates the answers with an LLM (`L154-L256`).
  - Records `prompt_tokens` and `completion_tokens` per call in JSONL (`L86-L96`).
- The default tabulator only counts successes and failures and has no cost columns (`agbench/src/agbench/tabulate_cmd.py:L217-L261`; search: `cost`, `token` with no relevant result) **[code]**.
- The README provides no cost vs quality numbers, it only cites AutoGen Bench (`README.md:L198`) **[README/docs]**.

## Evidence

No code was executed; no benchmark was reproduced. Everything above comes from static reading of commit `d07c667a`. Runtime behavior, such as the order of events in the asynchronous runtime, was inferred from the code, not observed. No performance number was verified.

## Engineering analogue

**[hypothesis]** For the Swarm Efficiency Observatory, AutoGen offers the pieces of an "N agents" arm with fine-grained control:
- **Composable termination**, for example `TextMentionTermination(sources=[executor]) | MaxMessageTermination | TokenUsageTermination`.
- **Mechanical acceptance** already demonstrated in the HumanEval template: the tests are executed and only then does `TERMINATE` appear.
- **A harness of N parallel teams with token logging** (`ParallelAgents`).

Gaps for use as an observatory:
- The token budget is not hard: the check is post-turn and ignores the selector and the ledger.
- A per-call counter, recorded in the model client, would be needed to measure cost per accepted task.
- Comparing `RoundRobin`, `Selector`, `Swarm` and `MagenticOne` against a single `AssistantAgent` with the same `CodeExecutorAgent` would isolate the cost of coordination.

## Testable hypothesis

1. **[hypothesis]** On HumanEval tasks with the template's mechanical acceptance, `MagenticOneGroupChat`, with its 4 agents and the ledger overhead, will have a cost per accepted task (total tokens, counting selector and ledger, divided by the tasks that pass the tests) ≥ 2× that of the coder + executor pair in `RoundRobinGroupChat`, with no acceptance-rate gain greater than 5 percentage points. It is falsified if MagenticOne stays below 2× or gains more than 5 p.p.
2. **[hypothesis]** With `TokenUsageTermination(max_total_token=B)`, actual consumption, measured at the model client, will exceed B in a measurable fraction of runs. This follows from the post-turn check and the omission of the selector. Metric: the distribution of (actual consumption − B)/B. The hypothesis is falsified if the excess is ≤ 0 in ≥ 95% of runs.

## Limits/gaps

- The project is **archived** (`README.md:L14-L31`). The successor, the Microsoft Agent Framework, was not inspected.
- I did not read `autogen-ext`, where the model clients and their `max_retries` live (only a grep). I do not know whether `models_usage` is always populated by all clients.
- I read `GraphFlow` only for the cycle guard. The activation semantics and conditional edges were not verified.
- That the selector and ledger cost falls outside the `TokenUsageTermination` count is an inference from the code read. I did not test it.
- I did not read `dotnet/`.
- `TRANSPARENCY_FAQS.md`, the documentation in `docs/` and the papers were not read. The README does not cite arXiv.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ composable termination conditions `&`/`\|` and `max_turns` (`base/_termination.py:L79-L86`; `_base_group_chat_manager.py:L195-L228`). The default is `max_turns=None`, except in MagenticOne (20, `_magentic_one_group_chat.py:L117`) | — in the core, completion is decided by the LLM (`is_request_satisfied`, `_magentic_one_orchestrator.py:L388`). Executed tests + `TERMINATE` appear only in [example] (`agbench/.../HumanEval/Templates/AgentChat/custom_code_executor.py:L35-L46`) | ✓ (coarse, opt-in) `TokenUsageTermination` stops the team, but checks post-turn against `models_usage` (`conditions/_terminations.py:L275-L286`), without blocking calls and without counting the selector; overshoot expected (criterion harmonized with `oss-metagpt` in `oss-matrix`). There are `max_turns` and `max_tool_iterations=1` (`_assistant_agent.py:L739`) | ✓ (partial) MagenticOne's replanning resets the agents and clears the thread (`_magentic_one_orchestrator.py:L262-L273`). Bounded contexts are opt-in | — participants fixed in the constructor (`_base_group_chat.py:L81-L85`) | ✓ opt-in: `Buffered`, `HeadAndTail` and `TokenLimited` (`autogen-core/.../model_context/_token_limited_chat_completion_context.py:L57-L72`). The default is `Unbounded` (`_assistant_agent.py:L840`) | MIT for code (`LICENSE-CODE`) + CC-BY-4.0 for docs/content (`LICENSE`) |
