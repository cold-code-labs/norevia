---
id: oss-metagpt
title: "MetaGPT — SOP via publish/subscribe, TeamLeader hub and per-round dollar budget"
area: oss
evidence: observed-implementation
tags: [sop, publish-subscribe, team-leader, hub, investment, cost-manager, react-loop, plan-and-act, tenacity, windowed-memory]
sources:
  - "https://github.com/FoundationAgents/MetaGPT/tree/11cdf466d042aece04fc6cfd13b28e1a70341b1f (inspected commit, shallow clone on 2026-11-07)"
  - "MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework, ICLR 2024 — https://openreview.net/forum?id=VtmBAGCN7o (cited in the README; no arXiv id in the README)"
related: [oss-matrix, oss-patterns, oss-chatdev-macnet, oss-camel, oss-autogen, oss-crewai, oss-langgraph-supervisor]
updated: 2026-11-07
summary: "In MetaGPT, roles subscribe to messages in an Environment and react to them; by default (MGXEnv), every message passes through a TeamLeader. Team.run stops on n_round, on idleness, or when the dollar cost exceeds the investment, but the budget is only checked between rounds and does not count models without a registered price."
---

# MetaGPT: SOP via publish/subscribe, TeamLeader hub and per-round budget

## Identification

- **URL:** https://github.com/FoundationAgents/MetaGPT
- **Inspected SHA:** `11cdf466d042aece04fc6cfd13b28e1a70341b1f`
- **Commit date:** 2026-01-21T18:12:32+08:00 (`git log -1 --format=%cI`).
- **License:** MIT License, "Copyright (c) 2024 Chenglin Wu" (`LICENSE:L1-L3`).
- **Scope of what was read:**
  - Read in full:
    - `metagpt/team.py`
    - `metagpt/utils/cost_manager.py`
    - `metagpt/environment/mgx/mgx_env.py`
  - Read in excerpts:
    - Role and environment core: `metagpt/environment/base_env.py` (L120-L247), `metagpt/roles/role.py` (L82-L560) and `metagpt/memory/memory.py` (L20-L90).
    - DI roles: `metagpt/roles/di/role_zero.py` (L55-L110, L303-L335, via grep), `metagpt/roles/di/team_leader.py` (L23-L95) and `metagpt/roles/di/data_interpreter.py` (L39-L150).
    - Memory and utilities: `metagpt/memory/role_zero_memory.py` (L24-L135) and `metagpt/utils/common.py` (L323-L332, L423-L431, L675-L716).
    - Actions: `metagpt/actions/action_node.py` (L420-L452), `metagpt/actions/run_code.py` (L29-L148) and `metagpt/actions/di/execute_nb_code.py` (via grep).
    - SOP roles: `metagpt/roles/qa_engineer.py` (L47-L210), `metagpt/roles/product_manager.py` (L30-L55) and `metagpt/roles/architect.py` (L40-L52).
    - Strategy and orchestration: `metagpt/strategy/planner.py` (L63-L145), `metagpt/software_company.py` (L14-L75) and `metagpt/tools/libs/software_development.py` (L118-L152).
    - LLM: `metagpt/provider/base_llm.py` (L245-L262).
  - Read only via grep:
    - `metagpt/provider/openai_api.py`
    - `metagpt/ext/aflow/benchmark/{benchmark.py,humaneval.py}`
  - `README.md`: lines L34-L50 and L161-L175.

## Mechanism

**1. Communication topology**
- **Publish/subscribe bus in the `Environment`.**
  - `publish_message` delivers the message to every role whose address matches `send_to` (`metagpt/environment/base_env.py:L175-L195`). The matching rule is in `metagpt/utils/common.py:L423-L431`, where `MESSAGE_ROUTE_TO_ALL` broadcasts **[code]**.
  - Each role filters what it reads in `_observe`. It keeps only messages whose `cause_by` is in `rc.watch` or that name it in `send_to` (`metagpt/roles/role.py:L399-L417`) **[code]**.
  - This filtering is the "SOP": for example, the `Architect` does `_watch({WritePRD})` (`metagpt/roles/architect.py:L52`) **[code]**.
- **Current default: hub with TeamLeader.**
  - `Team` uses `use_mgx=True` by default and instantiates the `MGXEnv` (`metagpt/team.py:L43`, `L48-L51`) **[code]**.
  - In the `MGXEnv`, every regular message gets the TeamLeader as recipient: "every regular message goes through team leader" (`metagpt/environment/mgx/mgx_env.py:L54-L57`). The message only reaches the other roles after the TL publishes it (`L48-L53`) **[code]**.
  - `is_public_chat=True` adds `MESSAGE_ROUTE_TO_ALL` (`L16-L22`). In practice, everyone receives everything in the buffer and filters in `_observe` **[code]**.
- **Fixed SOP is legacy and opt-in.**
  - The classic PM→Architect→… pipeline only applies with `use_fixed_sop=True`. The default is `False` (`metagpt/roles/di/role_zero.py:L98`).
  - The comment in the `Architect` says so explicitly: "only be effective when self.use_fixed_sop is changed to True" (`metagpt/roles/architect.py:L46`) **[code]**.

**2. Who decides who acts**
- **Message-driven activation.** Each round, `Environment.run` fires `role.run()` in parallel (`asyncio.gather`) for every non-idle role (`base_env.py:L197-L211`) **[code]**.
- **In MGX, the TeamLeader (LLM) chooses the recipient** via `publish_team_message(content, send_to)` (`metagpt/roles/di/team_leader.py:L75-L87`) **[code]**.
- **Within each role, it depends on the `react_mode`** (`metagpt/roles/role.py:L82-L85`, `L261-L282`) **[code]**:
  - `REACT`: an LLM chooses the next state in `_think`. Invalid output becomes `-1`, which terminates (`L340-L378`).
  - `BY_ORDER`: walks through the actions in order (`L353-L357`).
  - `PLAN_AND_ACT`: a `Planner` generates tasks and executes them until they run out (`L472-L496`).

**3. Termination criterion**
- **`Team.run(n_round=3)`** terminates in three ways (`metagpt/team.py:L123-L138`) **[code]**:
  - all roles idle (`L129-L131`);
  - end of rounds;
  - budget overrun (`L133`).
- **The CLI uses other defaults:** `n_round=5` and `investment=3.0` (`metagpt/software_company.py:L16-L17`, `L71-L72`) **[code]**.
- **Per-role cycle limit (`max_react_loop`):**
  - `Role` default: `1` (`role.py:L113`).
  - `RoleZero`: `50`. On reaching the limit, if it is ≥ 10, it asks the human whether to continue, and a "yes" resets the counter (`role_zero.py:L71`, `L314-L333`).
  - `TeamLeader`: `3` (`team_leader.py:L29`) **[code]**.
- **LLM `end` command.** For this, `RoleZero` also uses the `end` command, listed in `special_tool_commands` (`role_zero.py:L77`) **[code]**.

**4. Verification/mechanical acceptance**
- **`QaEngineer` runs real tests, but the verdict belongs to the LLM.**
  - `RunCode` runs a subprocess with `timeout=10` (`metagpt/actions/run_code.py:L106-L116`).
  - Next, an LLM reads stdout and stderr and writes `PASS` or `FAIL` and the recipient (`L29-L48`, `L120-L147`). The process return code decides nothing **[code]**.
  - `QaEngineer` limits the test cycle to `test_round_allowed=5` (`qa_engineer.py:L47`, `L164-L176`). It is commented out and outside the CLI's default team (`software_company.py:L59-L62`) **[code]**.
- **`DataInterpreter` (`PLAN_AND_ACT`, `auto_run=True`): task acceptance is mechanical.**
  - `confirmed = task_result.is_success` (`metagpt/strategy/planner.py:L140`).
  - `is_success` comes from notebook execution: a traceback becomes `False` (`metagpt/actions/di/execute_nb_code.py:L163-L197`).
  - The code is rewritten up to `max_retry=3` (`data_interpreter.py:L107-L147`) **[code]**.
  - With `auto_run=False` (the `Planner` default, `planner.py:L63`), the reviewer is a human (`L132-L139`) **[code]**.
- **Output schema validation.** `ActionNode._aask_v1` instantiates a pydantic model with the parsed response (`action_node.py:L441-L451`). A failure falls into the 6-attempt `@retry` (`L423-L427`). This validates the format, not the correctness of the task **[code]**.
- **Document loops.** In `write_trd` and similar, the loop runs `while not is_pass and total_cost < max_budget`, but `is_pass` comes from an LLM evaluator (`software_development.py:L129-L151`; prompt in `actions/requirement_analysis/trd/evaluate_trd.py:L114`) **[code]**.

**5. Cost control and technical budget**
- **How it works.** The `CostManager` accumulates tokens and dollar cost from a price table (`metagpt/utils/cost_manager.py:L25-L60`). The default is `max_budget=10.0` (`L31`), and `Team.invest` overrides it (`team.py:L92-L96`) **[code]**.
- **It is a hard limit, but coarse.**
  - `_check_balance` raises `NoMoneyException` when `total_cost >= max_budget` (`team.py:L98-L100`), but only **before each round** (`L133`). A whole round with all roles in parallel can overshoot the ceiling.
  - The exception is caught by `serialize_decorator`, which logs the error and serializes the team instead of propagating (`utils/common.py:L675-L686`) **[code]**.
- **Holes in the accounting.**
  - A model outside `TOKEN_COSTS` only adds tokens, with cost 0, and the budget never fires (`cost_manager.py:L48-L50`).
  - `TokenCostManager` does not compute cost (`L94-L108`) **[code]**.
- **Other capped limits:** `max_react_loop`, `test_round_allowed` and the `tenacity` retries.

**6. Memory**
- **Base `Memory` without limit.** It is a list plus an index by `cause_by`. `get(k=0)` returns everything (`metagpt/memory/memory.py:L20-L35`, `L80-L82`) **[code]**.
- **Window in the `RoleZero` roles.** The context is `memory.get(self.memory_k)` with `memory_k=200` messages (`role_zero.py:L97`, `L241`) **[code]**.
- **Opt-in long-term.** With `enable_longterm_memory`, `RoleZeroLongTermMemory` moves to RAG the message that leaves the `memory_k` window (`metagpt/memory/role_zero_memory.py:L33`, `L71-L79`, `L119-L128`; activation in `role_zero.py:L174-L188`) **[code]**.
- **Unbounded debug history.** `Environment.history` only accumulates (`base_env.py:L134`, `L193`) **[code]**.
- **`RunCode` outputs truncated** at 500 and 10000 characters (`run_code.py:L140-L141`) **[code]**.

**7. Failures and retry**
- **`tenacity` retries** **[code]**:
  - `ActionNode._aask_v1`: 6 attempts, exponential backoff from 1 to 20 s, any exception (`action_node.py:L423-L427`).
  - `BaseLLM.acompletion_text`: 3 attempts, only `ConnectionError` (`provider/base_llm.py:L249-L255`).
  - `openai_api.py:L165-L169`: 6 attempts, only `APIConnectionError`.
- **Role failure.** `role_raise_decorator` deletes the last observed message from memory, so that it is re-observed later, and re-raises the exception (`utils/common.py:L689-L716`) **[code]**.
- **Repeated responses.** `check_duplicates` detects an identical response within a window of 10 and asks for regeneration. With 3 repetitions, the output is `end` (when it is `finish_current_task`) or asking the human (`metagpt/utils/role_zero_utils.py:L68-L93`) **[code]**.
- **Planner.** An unconfirmed task leads to `update_plan()` (replanning), except when the review asks for "redo" (`planner.py:L102-L117`).
  - **[code]** I did not find a ceiling for the `while self.planner.current_task` loop in `role.py:L480-L486`. Search performed: `max_` in `planner.py`, where the only limit is `max_retries=3` for an invalid plan (`L77-L93`).

**8. Communication pruning**
- **Input filter, not structural pruning.**
  - `_observe` discards unsubscribed messages (`role.py:L410-L417`).
  - Fixed-SOP roles use `enable_memory=False` (`product_manager.py:L44`, `architect.py:L47`). Thus, already-seen messages are not deduplicated against memory (`role.py:L408`) **[code]**.
- **Dummy messages.** The TL can discard messages with `send_to == {"no one"}` (`mgx_env.py:L48-L51`) **[code]**.
- **Static graph and roles.** I did not find removal of edges or roles (search: `remove_role`, `prune`) **[code]**.

**9. Elastic vs fixed**
- **Fixed.** Roles are defined by `Team.hire` before execution (`team.py:L83-L85`; `software_company.py:L45-L53`) **[code]**.
- The TL routes among the existing roles listed by `_get_team_info` (`team_leader.py:L45-L53`). I did not find dynamic role creation (search: `add_role(`, `.hire(` outside initialization) **[code]**.

**10. Cost vs quality benchmark in the repository**
- **For the multi-agent team:** not found in the inspected code.
- **AFlow**, a workflow optimizer that is not the `Team`, records `score`, `avg_cost` and `total_cost` per evaluation. Sources: `metagpt/ext/aflow/benchmark/benchmark.py:L39-L46` and `L97-L104`, which limit concurrency to `max_concurrent_tasks=50` **[code]**.
  - On HumanEval, AFlow `exec`s the solution and the tests with a 15 s timeout (`ext/aflow/benchmark/humaneval.py:L45-L98`). This is mechanical acceptance **[code]**.
- **README:** cites the MetaGPT paper (ICLR 2024) and those of AFlow, SPO and AOT (`README.md:L34-L36`, `L161-L175`) **[README/docs]**. It gives no per-task cost numbers.

## Evidence

No code was executed; no benchmark reproduced. The analysis is a static reading of commit `11cdf466`. There is no behavior observed at runtime. Claims about flow (for example, "overrun within a round") are inferences from the code.

## Engineering analogue

- **`CostManager` + `Team.invest`:** this is the primitive closest to "cost per task" among the projects read. Per task, the project has a dollar budget, a cumulative counter and a hard, albeit coarse (per-round), stop **[code]**.
- **Use in the Swarm Efficiency Observatory [hypothesis]:**
  - Instrument `CostManager.get_costs()` per task.
  - Use as acceptance the `DataInterpreter`'s mechanical criterion (execution without traceback) or external tests, instead of the `PASS` written by the LLM in `RunCode`.
  - Compare two arms:
    - a single `DataInterpreter`, that is, one strong agent with plan and execution;
    - the MGX `Team`: TL + PM + Architect + Engineer2 + DataAnalyst.
- **Caution:** the per-round check requires recording the overshoot (final cost − investment) as a metric of its own.

## Testable hypothesis

1. **[hypothesis]** On coding tasks with hidden tests, the default MGX `Team` (5 roles, TL hub) will have a cost per accepted task, in dollars according to the `CostManager`, ≥ 3× that of an isolated `DataInterpreter` with the same model. The acceptance rate would not grow by more than 10 p.p. The hypothesis is falsified if the cost ratio is < 3× or the acceptance gain is > 10 p.p.
2. **[hypothesis]** With `investment` = B, the final cost will exceed B in ≥ 20% of runs that terminate via `NoMoneyException`, because the check only occurs between parallel rounds. Metric: the distribution of (final_cost − B)/B over the interrupted runs.

## Limits/gaps

- `metagpt/roles/engineer.py` (classic Engineer, `n_borg`), `engineer2.py` and the TL prompts were not read in detail. The TL routing instructions (`TL_INSTRUCTION`) were not checked either.
- `RoleZero._think`, `_quick_think` and the command parser were read only partially, via grep.
- `ExecuteNbCode` was read via grep. The exact `is_success` rule deserves a full reading.
- `TOKEN_COSTS` (`utils/token_counter.py`) was not read, so I do not know which models are covered.
- I did not check whether `NoMoneyException` is also raised inside LLM calls elsewhere. Grep only found it in `team.py`.
- The README gives no arXiv id for the main paper, only the OpenReview link.
- I did not investigate whether the project is actively maintained. The last commit is from 2026-01-21.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ `Team.run(n_round=3)` + idleness + budget (`team.py:L123-L138`); per-role `max_react_loop` (`role.py:L113`; `role_zero.py:L71`) | — in the default team. `QaEngineer` runs tests, but the `PASS`/`FAIL` verdict belongs to the LLM (`run_code.py:L29-L48`). Execution without traceback = acceptance only in `DataInterpreter` with `auto_run` (`planner.py:L140`) | ✓ (coarse) `NoMoneyException` with cost ≥ `max_budget`, checked only between rounds (`team.py:L98-L100`, `L133`). Models without a price do not count (`cost_manager.py:L48-L50`) | — only subscription filter in `_observe` (`role.py:L410-L417`), no removal of edges, roles or history | — fixed roles via `hire` (`team.py:L83-L85`) | ✓ `memory_k=200` window in `RoleZero` (`role_zero.py:L97`, `L241`). Base `Memory` without limit (`memory.py:L80-L82`) | MIT (`LICENSE:L1-L3`) |
