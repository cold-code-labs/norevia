---
id: oss-patterns
title: Coordination patterns and anti-patterns extracted from OSS code for the Swarm Efficiency Observatory
area: oss
evidence: hypothesis
tags: [patterns, anti-patterns, observatory, explicit-termination, verifiable-acceptance, budget, communication-pruning, elastic-swarm, correlated-consensus]
sources:
  - "oss-* cards in this folder (each mechanism cited has repo@SHA and file:line)"
  - "oss-matrix (MATRIX.md)"
related: [oss-matrix, oss-openai-agents-sdk, oss-crewai, oss-plexil, oss-autogen, oss-metagpt, oss-agentprune, oss-gptswarm, oss-agentnet, oss-chatdev-macnet, oss-langgraph-supervisor, oss-stigmergic, oss-symbiont, oss-selfheal, oss-camel, oss-moa, oss-buzz, oss-openai-swarm, oss-langgraph-swarm]
updated: 2026-11-07
summary: Eleven reusable patterns and nine anti-patterns seen in the code of open-source swarms, turned into three comparable architectures for the Observatory (verified solo, micro-swarm with a mechanical gate, adaptive swarm with pruning).
---

# Patterns and anti-patterns for the Observatory

## How to read
- **Source mechanism** = observed implementation (static reading, repo@SHA + `file:line`). The full SHAs are in the cards and in `oss-matrix`. Abbreviations used here: GPTSwarm `c23a827`, AgentPrune `c544dd6`, AgentNet `325d39f`, SYMBIONT `0c19117`, Stigmergic `a90e93c`, SelfHeal `812e6a3`, Buzz `49ea418`, PLEXIL `0e7439f`, MoA `1b5cab0`, OpenAI Swarm `6af0b4c`, Agents SDK `27c75c5`, LangGraph Swarm `8956b13`, LangGraph Supervisor `88859b3`, CrewAI `3df7fd0`, AutoGen `d07c667`, CAMEL `123f0c6`, MetaGPT `11cdf46`, ChatDev main `464a681`, ChatDev macnet `e7a3582`.
- **Application in the Observatory** = engineering hypothesis. Nothing here has been implemented, simulated or tested. No pattern authorizes deployment in OpenBot.
- **Scope:** the Observatory harness must enforce termination, budget and acceptance *outside* the frameworks. The matrix shows that no inspected framework guarantees all three by default.

## Reusable patterns

### P1. Layered termination, with a finite default
- **Source:**
  - Agents SDK: `src/agents/run_config.py:L45` defines `DEFAULT_MAX_TURNS = 10`, which becomes `MaxTurnsExceeded` (`src/agents/run.py:L1597-L1606`).
  - AutoGen: conditions composable with `&`/`|` (`python/packages/autogen-agentchat/src/autogen_agentchat/base/_termination.py:L79-L86`).
  - MetaGPT: `Team.run` stops by rounds, by idleness or by budget (`metagpt/team.py:L123-L138`).
- **Application:** every Observatory run terminates on the first of four conditions: (a) mechanical acceptance, (b) budget exhausted, (c) turn ceiling, (d) idleness/stagnation. The termination reason is recorded as a mandatory field. This separates "stopped because it got it right" from "stopped because the money ran out", which is the basis of the premature-termination metric.

### P2. Budget admission *before* the call
- **Source (gap in the frameworks):** the only ceilings that halt execution check *after* the step.
  - MetaGPT: `metagpt/team.py:L98-L100`, called between rounds.
  - AutoGen: `conditions/_terminations.py:L275-L286`, post-turn.
  - The others only track: GPTSwarm `swarm/llm/price.py:L47-L49`; Agents SDK `src/agents/usage.py:L196-L230`.
- **Application:** a ledger in the harness estimates the maximum cost of the next call (output `max_tokens` + prompt) and refuses the call if the balance does not cover it. The overshoot (actual consumption − ceiling) is measured against post-hoc budgets.

### P3. Mechanical acceptance as a final gate, separate from ranking
- **Source:**
  - Agents SDK: strict validation of `output_type` (`src/agents/agent_output.py:L142-L153`).
  - CrewAI: function guardrail with `guardrail_max_retries=3` and hard failure (`lib/crewai/src/crewai/task.py:L289-L291`, `L1450-L1459`).
  - PLEXIL: a postcondition evaluated by the executive becomes the typed outcome `POST_CONDITION_FAILED` (`src/exec/NodeImpl.cc:L1236-L1246`).
- **Application:** the task only counts as accepted if it passes tests or deterministic checks that no agent sees or alters. Acceptance failure produces a typed outcome (as in PLEXIL), not free text.

### P4. Structural pruning of outputs (without training)
- **Source:**
  - LangGraph Supervisor: `output_mode="last_message"` is the default (`langgraph_supervisor/supervisor.py:L225`, `L77-L91`).
  - CrewAI: `Task.context` chooses which previous outputs go in (`lib/crewai/src/crewai/crew.py:L1887-L1895`).
  - Agents SDK: `input_filter`/`remove_all_tools` on handoffs (`src/agents/extensions/handoff_filters.py:L33`).
  - MacNet: each node sees only its predecessor's solution (`graph.py:L139`, `L174` @macnet).
- **Application:** compare "full history" with "only the last artifact" between agents, measuring input tokens per accepted task and the information loss (tasks that fail only in the pruned variant).

### P5. Utility-learned pruning, with cost in the objective
- **Source:**
  - AgentPrune: `update_masks` zeroes, every `imp_per_iters`, the `pruning_rate` fraction of edges with the lowest logit (`AgentPrune/graph/graph.py:L317-L339`).
  - GPTSwarm: edges sampled by probability learned via REINFORCE (`swarm/optimizer/edge_optimizer/parameterization.py:L107-L115`).
  - Neither of the two puts cost in the objective: the utility is exact-match (cards `oss-gptswarm`, `oss-agentprune`).
- **Application:** only after P4. The utility becomes *acceptance − λ·cost*, with a training set separate from the test set.

### P6. Reinforcement conditioned on acceptance, discounting cost
- **Source:** AgentNet updates the edge weight by `success_factor` (1.1 or 0.9) × `time_factor`, and removes the edge with weight ≤0.3 (`AgentNet_Code/src/agentgraph.py:L140-L160`). In training, `success` comes from exact-match (card `oss-agentnet`).
- **Contrast:** SYMBIONT's reinforcement depends only on volume (anti-pattern A3).
- **Application:** adaptive routing (who receives which type of task) updated only by accepted tasks and penalized by cost/time.

### P7. Shared board with atomic claim, lease and dead-letter
- **Source:** Stigmergic, atomic `claim` with lease in a SQLite transaction (`src/stigmergic/core/environment.py:L703-L786`); `max_retries=3` sends the task to the DLQ (`src/stigmergic/agents/base_ant.py:L257-L272`).
- **Application:** each subtask has a single owner and a deadline. Orphaned work (expired lease) returns to the queue; recurrence above the limit goes to the DLQ and counts as an explicit failure, not as silence. Measures orphaned and duplicated work.

### P8. Stagnation counter with bounded replanning
- **Source:** in AutoGen's MagenticOne, `_n_stalls` goes up without progress or in a loop and goes down with progress. On reaching `max_stalls`, the orchestrator replans and resets the thread (`python/packages/autogen-agentchat/src/autogen_agentchat/teams/_group_chat/_magentic_one/_magentic_one_orchestrator.py:L394-L406`).
- **Application:** progress measured mechanically (for example, more tests passing), not declared by an LLM. Replannings have a ceiling and count toward cost.

### P9. Best-of-N with mechanical selection
- **Source:** MacNet's `prune_test` sorts candidates by execution score and keeps the upper half (`chatdev/waiting.py:L267-L314` @macnet). MoA shows the opposite: it aggregates via a synthesis prompt, without selection (`utils.py:L144-L146`).
- **Application:** N independent proposers and a deterministic verifier chooses. The point of comparison is N=1 with the same total budget.

### P10. Memory with explicit window, TTL or summarization
- **Source:**
  - MetaGPT: `memory_k=200` in RoleZero (`metagpt/roles/di/role_zero.py:L97`).
  - CAMEL: summarization at 50% of `token_limit` (`camel/agents/chat_agent.py:L1032-L1066`).
  - SYMBIONT: scratchpad with a TTL of 1800 s (card `oss-symbiont`).
  - Buzz: other robots' membership expires in 50 steps (`src/buzz/buzzswarm.c:L209-L248`).
- **Application:** a per-agent context limit becomes an experimental variable. Context growth and undue information loss are measured.

### P11. Bidirectional elasticity
- **Source:**
  - CAMEL: the `AgentPool` removes clones idle beyond `idle_timeout` (`camel/societies/workforce/single_agent_worker.py:L162-L184`); `CREATE_WORKER` creates workers (`camel/societies/workforce/workforce.py:L2010-L2016`).
  - Buzz: `join`/`leave` at runtime (`src/buzz/buzzswarm.c:L377-L476`).
- **Application:** expand only when acceptance fails or the backlog grows, and contract on idleness. The marginal cost per added agent is measured.

## Implementable architectures for the Observatory (hypothesis)
All use the same harness: budget ledger (P2), hidden acceptance gate (P3), recording of the termination reason (P1) and the same task set with held-out cases.

| | **A — Verified solo** | **B — Micro-swarm with mechanical gate** | **C — Adaptive swarm with pruning** |
|---|---|---|---|
| Agents | 1, high reasoning | k ≤ 3 independent proposers (distinct models/temperatures) | supervisor + specialists; k varies at runtime |
| Communication | none | none between proposers; only artifact → verifier | star with `last_message` (P4) + board with claim/lease (P7) |
| Decision on who acts | — | all in parallel; selection by verifier (P9) | supervisor; routing reinforced only by acceptance (P6) |
| Termination | acceptance, budget, `max_turns`, stagnation (P1) | first accepted candidate or budget | P1 + bounded replanning (P8) |
| Repair | redo with test feedback | new round only for rejected candidates | P8; DLQ (P7) |
| Elasticity | — | fixed k | starts with k=1 and expands only after rejection; contracts on idleness (P11) |
| Question it answers | baseline cost per accepted task | does independent diversity buy acceptance more cheaply than extra reasoning? | does adaptive coordination pay for its own overhead? |

**Common metrics:** cost per accepted task; acceptance rate; false success (the agent declares success and the gate rejects); premature termination; budget overshoot; input tokens per task; handoffs; orphaned or duplicated work; information loss from pruning.

**Fair comparison:** same total budget per task across A, B and C. Without this, B and C "win" by spending more.

## Anti-patterns (observed in the code)

### A1. Consensus of correlated models
- **Stigmergic:** `DEFAULT_PERSPECTIVES` are three framings of a single NLI judge (`src/stigmergic/core/consensus.py:L75-L84`, `L441`). In the versioned benchmark, `single-judge`, `quorum-3` and `heterogeneous-panel` have identical numbers (`benchmarks/injection_capture/RESULTS.md:L16-L19`; author-reported, torch-free mode).
- **SelfHeal:** fixer and critic use the same model (card `oss-selfheal`).
- **Lesson:** more votes from the same model do not add independent evidence. Diversity should come from verifiers of a different nature (tests, schema), not from more LLMs.

### A2. Loops without termination by default
- OpenAI Swarm: `max_turns: int = float("inf")` (`swarm/core.py:L239`).
- AutoGen: `max_turns=None` in RoundRobin/Selector/Swarm (card `oss-autogen`).
- PLEXIL: quiescence loop without a micro-step ceiling (`src/exec/PlexilExec.cc:L282-L406`).
- AgentNet: the hop limit only changes the prompt (`AgentNet_Code/src/agent.py:L748-L749`); the loop is `while True`.

### A3. Messages or activity as a proxy for quality
- SYMBIONT: `flow_score += (msg_count − usage_count) × weight` (`symbiont/core/topology.py:L118-L119`), with no accepted-result signal. Pruning is by idleness, not by quality (`L134-L143`).
- **Lesson:** no routing weight should rise with message volume. Use P6.

### A4. Theatrical acceptance
Verdict by LLM substring, structural validator or placeholder that always approves:
- SelfHeal: `"ACCEPT" in critic_output` (`run_agent.py:L394`); `validate_fixed_code` only looks for `"def "`/`"return"` (`run_agent.py:L176-L197`).
- SYMBIONT: `"approve" in result.lower()` (`symbiont/agents/worker.py:L122`).
- CrewAI: `HallucinationGuardrail` without a hook logs a warning and returns `True` (`lib/crewai/src/crewai/tasks/hallucination_guardrail.py:L97-L103`).
- CAMEL: accepts a low-score task when retries are exhausted (`camel/societies/workforce/workforce.py:L5534-L5560`).

### A5. Cost measured and never used, and cost-blind optimization
- AgentPrune: `cost_count` is never called (card `oss-agentprune`).
- GPTSwarm: only accumulates cost (`swarm/llm/price.py:L47-L49`), and REINFORCE optimizes accuracy only.
- **Lesson:** token-savings claims need measurement at the model client, not framework counters.

### A6. Post-hoc budget with holes
- MetaGPT: a model missing from the price table adds no cost (`metagpt/utils/cost_manager.py:L48-L50`), and the `NoMoneyException` is caught by `serialize_decorator` (`metagpt/utils/common.py:L675-L686`).
- AutoGen: `TokenUsageTermination` does not count the selector or the ledger (card `oss-autogen`; inference from reading).

### A7. Full history resent on every handoff
- OpenAI Swarm: `swarm/core.py:L47`.
- LangGraph Swarm: `[*messages, tool_message]` on handoff (`langgraph_swarm/handoff.py:L86-L93`).
- **Expected effect (hypothesis):** input cost grows with (number of steps × history size).

### A8. Growth-only elasticity
- SYMBIONT: spawn on demand (`symbiont/agents/queen.py:L71-L79`), but `hibernate()` is never called (card `oss-symbiont`).
- CAMEL: `CREATE_WORKER` with no ceiling and no removal of workers (card `oss-camel`).

### A9. Silent fallback treated as an answer
- SYMBIONT: with the circuit breaker open, `think` returns a "degraded mode" string as if it were an answer (`symbiont/agents/base.py:L327-L329`), and it can become a "successful" artifact.
- CrewAI: failure to convert to the schema returns the raw string (`lib/crewai/src/crewai/utilities/converter.py:L424-L431`).
- **Lesson:** degradation must produce a typed failure outcome (P3), never content.

## Limits/gaps
- All mechanisms came from static reading; the cost and quality effects are hypotheses until there is execution in the Observatory.
- Some anti-patterns are inferences from reading and are marked as such in the cards: the selector outside the count in AutoGen, the fallback as artifact in SYMBIONT.
- Architectures A/B/C are experimental design proposals. Assigning `H-xx` IDs belongs to the theory/hypotheses area.
