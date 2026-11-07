---
id: oss-camel
title: "CAMEL — two-agent RolePlaying and Workforce with LLM coordinator, strategy-based recovery and on-demand workers"
area: oss
evidence: observed-implementation
tags: [role-playing, workforce, coordinator, task-decomposition, failure-recovery, llm-judge, dynamic-workers, agent-pool, context-summarization, apache-2-0]
sources:
  - "https://github.com/camel-ai/camel/tree/123f0c60f6efce7b420d6de2c3e046adb1f2cacc (inspected commit, shallow clone on 2026-11-07)"
  - "CAMEL: Communicative Agents for 'Mind' Exploration of Large Language Model Society — https://arxiv.org/abs/2303.17760 ('Paper' link in README.md:L39)"
related: [oss-autogen, oss-metagpt, oss-chatdev-macnet, oss-crewai, oss-langgraph-supervisor, oss-selfheal, oss-matrix, oss-patterns]
updated: 2026-11-07
summary: "Two societies: RolePlaying (alternating user/assistant pair, termination by a prompt token and a turn limit in the caller) and Workforce (an LLM coordinator assigns subtasks via a central channel, LLM judge with score ≥60, up to 3 attempts and runtime worker creation), with no token budget enforced by code."
---

## Identification

- **URL:** https://github.com/camel-ai/camel
- **Full SHA:** `123f0c60f6efce7b420d6de2c3e046adb1f2cacc`
- **Commit date:** 2026-11-02T18:15:00+08:00 (`git log -1 --format=%cI`)
- **License:** Apache License 2.0 — `LICENSE:L1-L2` ("Apache License / Version 2.0, January 2004"), `LICENSE:L189` ("Copyright 2023 @ CAMEL-AI.org"). File headers use "Copyright 2023-2026 @ CAMEL-AI.org" under Apache-2.0 (`licenses/license_template.txt:L1-L13`).
- **Scope (files actually read, in excerpts):** `LICENSE`; `README.md` (L30-L52, L116, L141, L350, L470); `camel/societies/role_playing.py`; `camel/societies/workforce/{workforce.py, utils.py, single_agent_worker.py, role_playing_worker.py, task_channel.py}`; `camel/agents/chat_agent.py`; `camel/memories/blocks/chat_history_block.py`; `camel/memories/context_creators/score_based.py`; `camel/terminators/{token_limit_terminator.py, base.py}`; `camel/tasks/task.py`; `camel/prompts/ai_society.py`; `camel/utils/constants.py`; `camel/benchmarks/{gaia.py, browsecomp.py}`; `examples/ai_society/role_playing.py`. Not read: other toolkits, `services/`, `apps/`, tests (only listed in `test/workforce/`).

## Mechanism

**1. Communication topology**
- **RolePlaying:** fixed user → assistant pair, in strict alternation within `step` — the user responds to the assistant's message and the assistant responds to the user (`camel/societies/role_playing.py:L661-L693`) **[code]**. Optionally a critic (`CriticAgent` or `Human`) joins and chooses one among several message options (`role_playing.py:L516-L545`, `L490-L502`) **[code]**.
- **Workforce:** hierarchical star. A central `TaskChannel` keeps the task packets in a dict, indexed by status and with queues per assignee and per publisher (`camel/societies/workforce/task_channel.py:L85-L100`). The Workforce posts a task (`_post_task`, `workforce.py:L4146`) and waits for its return (`_get_returned_task`, `workforce.py:L4362-L4396`) **[code]**. Children can be `SingleAgentWorker`, `RolePlayingWorker` or another nested `Workforce` (`workforce.py:L3031`, `L3094`, `L3172-L3193`) **[code]**. Subtasks have dependencies declared by the coordinator (`TaskAssignment.dependencies`, `utils.py:L176-L181`), which forms a task DAG **[code]**.
- With `share_memory=True` (default `False`), the coordinator, planner and SingleAgentWorkers receive the consolidated history of all (`workforce.py:L1362-L1380`; docstring `L224-L232`) **[code]**. This is broadcast, the opposite of pruning.

**2. Who decides who acts**
- **RolePlaying:** the order is fixed in code (user, then assistant) and there is no selector (`role_playing.py:L661-L693`) **[code]**.
- **Workforce:**
  - The *Task Planner Agent* (LLM) decomposes the task (`_decompose_task`, `workforce.py:L1549-L1575`). In `PIPELINE` mode there is no decomposition (`L1571-L1572`) **[code]**.
  - The *Coordinator Agent* (LLM) assigns the subtasks to workers by ID (`_call_coordinator_for_assignment`, `workforce.py:L3768`) **[code]**.
  - To invalid IDs the code reacts deterministically: it separates out the invalid assignments (`_validate_assignments`, `L3883-L3905`), tries again and, as a fallback, **creates a new worker** (`L3907-L3931`, `L3933+`) **[code]**.

**3. Termination criterion**
- **RolePlaying:** the class has no loop. `step` only returns `terminated` (`role_playing.py:L662-L706`). The loop and the limit belong to the caller:
  - `RolePlayingWorker`: `chat_turn_limit=20` by default, `while n < self.chat_turn_limit`, and stops if the user message contains `"CAMEL_TASK_DONE"` (`role_playing_worker.py:L74`, `L149`, `L190`) **[code]**.
  - `Workforce.add_role_playing_worker`: `chat_turn_limit=3` (`workforce.py:L3102`) **[code]**.
  - Example: `chat_turn_limit=50` (`examples/ai_society/role_playing.py:L20`, `L50`, `L81`) **[example]**.
  - The `<CAMEL_TASK_DONE>` token is a prompt instruction (`camel/prompts/ai_society.py:L106-L107`) **[code]**, that is, termination is self-declared by the LLM.
- **ChatAgent:**
  - `max_iteration=None`: no limit on model calls per step (`chat_agent.py:L432-L435`, `L522`, `L3120-L3125`) **[code]**.
  - `response_terminators` and `stop_event` are optional (`L520`, `L524`, `L3062-L3071`, `L3132-L3155`) **[code]**.
  - `step_timeout` uses `Constants.TIMEOUT_THRESHOLD = None` (`chat_agent.py:L532`; `camel/utils/constants.py:L40`) **[code]**.
- **Workforce:**
  - The main loop runs while there are pending or in-flight tasks and no stop request (`workforce.py:L5294-L5298`) **[code]**.
  - Permanent failure: `max_retries=3` per task (`utils.py:L281-L285`) and `halt_on_max_retries=True` halts the Workforce in `AUTO_DECOMPOSE` (`utils.py:L294-L297`; `workforce.py:L4693-L4720`) **[code]**.
  - Per-task wait timeout: 600 s (`workforce.py:L129`, `L355`, `L4370-L4375`) **[code]**.
  - There are also `stop_gracefully` / `stop_immediately` (`L2098`, `L2171`) **[code]**.

**4. Verification/mechanical acceptance**
- Quality acceptance is an **LLM judge**. `_analyze_task(..., for_failure=False)` (`workforce.py:L1645-L1700`, called at `L5522-L5523`) produces a `TaskAnalysisResult`. The `quality_sufficient` property requires `quality_score >= 60` and no recovery strategy (`utils.py:L405-L417`) **[code]**. The threshold is deterministic, but the score comes from the LLM.
- The only mechanical check is superficial: `is_task_result_insufficient` → `validate_task_content` rejects a result that is `None`, empty or contains failure phrases ("i cannot", "task failed", "error" prefix…) (`camel/tasks/task.py:L148-L168`, `L85-L137`; used in `single_agent_worker.py:L577-L582`) **[code]**. It does not run tests or validate the content against a specification.
- **Degraded acceptance:** when the task reaches `max(1, max_retries-1)` quality failures, it is **marked as completed even with a low score** (`workforce.py:L5534-L5560`) **[code]**.
- Dynamically created workers receive `CodeExecutionToolkit` as a tool (`workforce.py:L4348-L4353`) **[code]**. This is an agent capability, not an acceptance gate.
- **Benchmarks in the repo:**
  - GAIA compares the answer by normalized exact match (`camel/benchmarks/gaia.py:L385-L424`) **[code]**.
  - BrowseComp uses an LLM grader (`camel/benchmarks/browsecomp.py:L163-L171`, `L714-L715`) **[code]**.

**5. Cost control/technical budget**
- **There is no hard token, cost or call limit that stops execution by default.**
- `TokenLimitTerminator` exists (`camel/terminators/token_limit_terminator.py:L19-L52`), but is not instantiated outside `camel/terminators/` (search: `TokenLimitTerminator` in `camel/`) **[code]**.
- The ChatAgent's `token_limit` defines the context window and triggers summarization, not interruption (`chat_agent.py:L402-L405`, `L556-L564`, `L1032-L1066`) **[code]**.
- The `_step_terminate(..., "max_tokens_exceeded")` path only runs if `_get_context_with_summarization` raises `RuntimeError` (`chat_agent.py:L3025-L3033`). In the context creators/memories I found nothing that raises it (search: `RuntimeError` in `camel/memories/`, only `memanto.py:L61`) **[code]**. See gaps.
- `on_request_usage` is a measurement callback. Exceptions from the callback are caught and only generate a log entry (`chat_agent.py:L3533-L3558`), so they do not work as a brake **[code]**.
- In the Workforce, per-task token usage is **recorded** in events and in the logger (`workforce.py:L4944-L4992`; `workforce_logger.py:L229-L243`) **[code]**. This is tracking, not a budget.
- Limits that exist but are not a budget: `max_retries=3`, 600 s timeout, `chat_turn_limit`.

**6. Memory**
- `ChatHistoryMemory(context_creator, window_size=message_window_size)` (`chat_agent.py:L560-L569`). `message_window_size=None` by default (`L509`), and so there is no window **[code]**.
- With a window, retrieval preserves the system message and returns the last `window_size` (`chat_history_block.py:L76-L118`). Storage remains complete; only the view is truncated **[code]**.
- `ScoreBasedContextCreator`: "token_limit … No longer used to filter records" (`score_based.py:L35-L36`). It only sorts and counts tokens (`L112-L171`) **[code]**.
- **Compression by LLM summarization active by default:** `summarize_threshold=50`, i.e., 50% of `token_limit` (`chat_agent.py:L510`, `L590-L601`) **[code]**. Note that the docstring says default `None` (`L398-L401`), diverging from the code.
- When the threshold is exceeded: `summarize()`, then `clear_memory()`, then it reinserts the previous summaries, the new summary and the last user message (`L1054-L1064`, `L1146-L1200`) **[code]**.
- When the summaries exceed `token_limit * summary_window_ratio` (0.6, `L536`), there is full compression (`L1043-L1052`) **[code]**.
- If `num_tokens > token_limit`, the function returns **without** summarizing (`L1038-L1039`) **[code]**.
- Pool agents do `reset()` on each loan, with memory cleared per task (`single_agent_worker.py:L128-L129`) **[code]**.

**7. Failures/retry**
- **LLM:** retry only for `RateLimitError` (OpenAI/Anthropic), with `retry_attempts=3` and exponential backoff with jitter, capped at 60 s (`chat_agent.py:L161-L163`, `L530-L531`, `L3666-L3690`). Other exceptions propagate **[code]**.
- **Task (Workforce):** each failure increments `failure_count` (`workforce.py:L4651`). An LLM chooses the strategy (`_analyze_task(for_failure=True)`, `L4836`). If parsing fails, the fallback is `RETRY` (`L1680-L1686`) **[code]**.
- Available strategies (`utils.py:L211-L218`; applied in `workforce.py:L1828-L2016`) **[code]**:
  - `RETRY`: same worker.
  - `REPLAN`: the LLM rewrites the task content.
  - `REASSIGN`: another worker.
  - `DECOMPOSE`: new subtasks.
  - `CREATE_WORKER`: new worker.
- `enabled_strategies=[]` turns off recovery and also skips the quality evaluation (`utils.py:L287-L292`; `workforce.py:L5500-L5520`) **[code]**.
- In `PIPELINE` mode, a definitive failure passes the error on to dependent tasks without stopping the flow (`workforce.py:L4700-L4713`) **[code]**.
- I did not find an explicit limit on recursive decomposition depth (search: `max_depth`, `MAX_DEPTH`; only `task.get_depth()` as information for the prompt in `workforce.py:L1765`).

**8. Communication pruning**
- There is no pruning of edges or agents by performance.
- Opt-in `prune_tool_calls_from_memory=False` removes tool-call messages from the agent's history after each step (`chat_agent.py:L449-L452`, `L528`, `L3183-L3185`) **[code]**.
- Opt-in `enable_snapshot_clean` removes DOM markers from old outputs (`L453-L457`) **[code]**.
- RolePlaying with a critic reduces N options to one message (`role_playing.py:L540-L542`) **[code]**. This is selection, not topology pruning.

**9. Elastic vs fixed**
- **Elastic, only for growth.** The Workforce adds `SingleAgentWorker` at runtime in two ways: through the `CREATE_WORKER` strategy and as a fallback for invalid assignment (`workforce.py:L2010-L2016`, `L3907-L3931`, `L4186-L4332` with `self._children.append(new_node)` at `L4321`). The new worker's role and prompt are generated by an LLM (`CREATE_NODE_PROMPT`, `L4197-L4203`) **[code]**.
- I did not find a worker ceiling or worker removal (search: `max_worker`, `max_children`, `_children.remove`).
- Within each `SingleAgentWorker`, the `AgentPool` clones agents on demand (`single_agent_worker.py:L114`, `L131-L135`) **[code]**:
  - With `auto_scale=True` (default, `L79`, `L241`), it creates clones **even above `max_size`**: `len(in_use) < max_size or self.auto_scale` (`L133`). `max_size` (10, `workforce.py:L130`) only limits the idle agents returned to the pool (`single_agent_worker.py:L151-L160`).
  - Clones idle for more than 180 s are removed (`L77-L87`, `L162-L183`).

**10. Cost vs quality benchmark in the repo**
- Absent as a cost × quality comparison.
- `camel/benchmarks/browsecomp.py:L547-L625` accepts `ChatAgent`, `RolePlaying` or `Workforce` as an interchangeable `pipeline_template` **[code]**. This is the closest fit to "1 vs N", but it does not record tokens or cost (0 occurrences of `token|cost|usage` in `browsecomp.py` and `gaia.py`).
- The README speaks of "Simulate up to 1M agents" and "millions of agents" (`README.md:L116`, `L141`) **[README/docs]**. This is an author report; I did not verify it in the code.

## Evidence

No code was executed; no benchmark reproduced. All claims come from static reading at SHA `123f0c60f6efce7b420d6de2c3e046adb1f2cacc`. The README's scale claims (1M agents) and the paper (arXiv 2303.17760) were not verified. The tests in `test/workforce/` were only listed, not read.

## Engineering analogue

*(hypothesis)* In the Swarm Efficiency Observatory, CAMEL provides two ready-made arms on the same harness:
- **"1 strong agent":** `ChatAgent`.
- **"N agents":** `RolePlaying` or `Workforce`.

`browsecomp.py` already swaps these three as `pipeline_template`. To measure cost per accepted task, two pieces are missing:
- **External token measurement:** the Workforce only records; the `on_request_usage` callback provides per-request measurement.
- **External mechanical acceptance:** the internal judge (score ≥60) accepts bad results when the retries run out.

The Workforce is a good object of study for the "cost of self-recovery". Each failure or low score costs an LLM analysis call and can create new workers without a ceiling. This should show up as extra cost relative to the single agent.

## Testable hypothesis

1. **H1 (cost of recovery):** on tasks with a deterministic verifier (e.g., unit tests), the `Workforce` with `enabled_strategies=None` spends at least 2× the tokens per task *accepted by the external verifier* relative to a single `ChatAgent` with the same model. The acceptance rate does not rise in the same proportion.
   - **Metric:** total tokens (via `on_request_usage`) ÷ no. of tasks that pass the external tests.
   - **Falsification:** ratio < 2× or proportional acceptance gain.
2. **H2 (internal judge agreement):** the fraction of tasks that the Workforce marks DONE (score ≥60 or retries exhausted) and that fail the external verifier is ≥ 20%.
   - **Metric:** false acceptances ÷ DONE tasks.

## Limits/gaps

- I did not read `_handle_completed_task` in full (`workforce.py:L4941-L5100`), nor the complete `_listen_to_channel` loop (`L5282-L5800`), nor `_post_ready_tasks`. There may be other termination or acceptance paths.
- **`max_tokens_exceeded` path apparently vestigial:** I found nothing that raises `RuntimeError` in `memory.get_context()`. There may be an alternative memory (e.g., `VectorDB`, `memanto`) that does.
- The `summarize_threshold` docstring (default `None`) diverges from the signature (`50`), and the `step_timeout` docstring diverges from the effective default. The code prevails.
- I did not check whether chained `REPLAN`/`DECOMPOSE` can produce unbounded recursion in practice: no explicit ceiling was found, but each subtask has its own `failure_count`.
- `RolePlaying` with a critic and `Human` mode were not evaluated in depth.
- External integrations (MCP, `services/`, Eigent) were out of scope.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ — Workforce terminates with no pending tasks/stop (`workforce.py:L5294-L5298`), `max_retries=3`+`halt_on_max_retries=True` (`utils.py:L281-L297`), 600 s timeout (`workforce.py:L129`); RolePlaying only via `chat_turn_limit` in the caller (`role_playing_worker.py:L74,L149`) and the `CAMEL_TASK_DONE` prompt token | — — LLM judge score ≥60 (`utils.py:L405-L417`); mechanical check only for empty/failure phrases (`tasks/task.py:L85-L137`); accepts low score at the retry limit (`workforce.py:L5534-L5560`) | — — tokens only recorded (`workforce.py:L4944-L4992`); `TokenLimitTerminator` not wired; `max_iteration=None` (`chat_agent.py:L522`); limits only on retries/turns/time | ✓ (weak, opt-in) — intra-agent history only: `prune_tool_calls_from_memory=False` (`chat_agent.py:L528,L3183-L3185`); no pruning of edges/agents; `share_memory` broadcasts | ✓ — `CREATE_WORKER`/fallback create workers at runtime (`workforce.py:L2010-L2016,L3907-L3931,L4321`); `AgentPool` clones on demand and removes idle >180 s (`single_agent_worker.py:L133,L162-L183`); no worker ceiling/removal | ✓ — LLM summarization by default at 50% of `token_limit` with `clear_memory` (`chat_agent.py:L510,L1032-L1066,L1146-L1172`); opt-in `window_size` (`chat_history_block.py:L76-L118`) | Apache-2.0 (`LICENSE:L1-L2,L189`) |
