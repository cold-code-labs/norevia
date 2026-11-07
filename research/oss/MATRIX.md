---
id: oss-matrix
title: Comparative matrix of coordination mechanisms in 19 open-source swarm/multi-agent projects
area: oss
evidence: observed-implementation
tags: [matrix, explicit-termination, verifiable-acceptance, budget, communication-pruning, elastic-swarm, bounded-memory, license]
sources:
  - "oss-* cards in this folder, each with the repository URL pinned to a commit SHA (shallow clones on 2026-11-07)"
related: [oss-patterns, oss-gptswarm, oss-agentprune, oss-agentnet, oss-swarmsys, oss-symbiont, oss-stigmergic, oss-selfheal, oss-buzz, oss-plexil, oss-moa, oss-openai-swarm, oss-openai-agents-sdk, oss-langgraph-swarm, oss-langgraph-supervisor, oss-crewai, oss-autogen, oss-camel, oss-metagpt, oss-chatdev-macnet]
updated: 2026-11-07
summary: Of the 18 projects whose code was read, only 2 LLM frameworks (MetaGPT and AutoGen) halt execution on cost/tokens, both after the step, and none combines mechanical acceptance, a technical budget and pruning.
---

# OSS matrix: termination, acceptance, budget, pruning, elasticity, memory, license

**Evidence level:** observed implementation by static reading at the listed commits. Nothing was executed, compiled or installed, and no benchmark was reproduced. Each cell summarizes the "Matrix row" of the corresponding card, where the `file:line` anchors are. The main ones are repeated below the table. Anchors in all cards were checked by our own script (existence of the file and of the line range in the clone): 1,008 anchors in the 18 cards with code resolved, 0 broken; the anchors in this matrix and in `oss-patterns` had their content checked manually. In the cards, a sample of ~25 anchors had their content checked manually.

## Criteria (how to read ✓ / — / ?)
- **Explicit termination:** there is a stopping criterion enforced by code, either by default or as a first-class configuration. The LLM "deciding to stop" is not enough.
- **Verifiable acceptance:** the loop uses a deterministic check of the output (executed tests, schema validation, exact-match, postcondition). LLM-judge alone = —.
- **Technical budget:** a token, cost or call limit checked by code **halts** execution. "Coarse" = the check happens between steps and admits overshoot. `max_turns` alone and rate limits (RPM) do not count.
- **Communication pruning:** some mechanism removes edges, messages, history or agents.
- **Elastic:** the number of agents or members changes at runtime according to demand.
- **Bounded memory:** there is explicit capacity, window, TTL or eviction.
- **Qualifiers:** "opt-in" = exists but is off by default. "partial" = covers only part of the system. "?" = not verified (code not available or outside the inspected repo). "n/a" = the column does not apply (recorded as —).

## Table

| Project (card) | Commit | Topology · who decides | Explicit termination | Verifiable acceptance | Technical budget | Communication pruning | Elastic | Bounded memory | License (file read) |
|---|---|---|---|---|---|---|---|---|---|
| GPTSwarm (`oss-gptswarm`) | `c23a827` | DAG of operations; edges sampled by learned probability | ✓ | ✓ (HumanEval node runs tests; exact-match in optimization) | — (cost only accumulated) | ✓ | — | — | MIT |
| AgentPrune (`oss-agentprune`) | `c544dd6` | spatial + temporal graph with masks; fixed rounds | ✓ (`num_rounds`=3) | ✓ (only as training utility, in scripts) | — (`cost_count` never called) | ✓ | — | ✓ (1-round window) | — no LICENSE file |
| AgentNet (`oss-agentnet`) | `325d39f` | decentralized DAG; each agent decides forward/split/execute via LLM | — (partial: hop limit only via prompt) | ✓ (exact-match in training) | — | ✓ (edge with weight ≤0.3 removed) | — | ✓ partial (executor pool = 40; eviction inoperative) | — no LICENSE file |
| SwarmSys (`oss-swarmsys`) | no code | paper: Explorers/Workers/Validators | ? | ? | ? | ? | ? | ? | ? no repository |
| SYMBIONT (`oss-symbiont`) | `0c19117` | "mycelium" channels reinforced by volume; Queen spawns | ✓ (5-phase pipeline) | — (LLM + substring "approve"; success = artifact exists) | — | ✓ (by idleness, not by quality) | ✓ (only grows) | ✓ partial (logs and scratchpad with TTL; Mound unbounded) | Apache-2.0 |
| Stigmergic (`oss-stigmergic`) | `a90e93c` | shared board (SQLite/Postgres); atomic claim + lease | ✓ per task (`max_retries`=3 → DLQ) | — (NLI quorum 2/3, same model × 3 framings) | — | — | — | — (only telemetry has a ring buffer) | Apache-2.0 |
| SelfHeal (`oss-selfheal`) | `812e6a3` | fixer → critic (same model) | ✓ (3 attempts; stops on "ACCEPT") | — (tests never executed; LLM critic) | — | — | — | — | MIT |
| Buzz (`oss-buzz`) | `49ea418` | situated neighborhood (1 hop) + LWW virtual stigmergy | — (only end of program) | — | ✓ partial (1 packet/step in the ARGoS integration) | ✓ (coalescing by key) | ✓ (`join`/`leave`/`select` at runtime) | ✓ partial (membership expires in 50 steps) | MIT/Expat (text without name) |
| PLEXIL (`oss-plexil`) | `0e7439f` | tree of nodes with conditions; deterministic executive (docs) | ✓ (End/Repeat; quiescence without ceiling) | ✓ (postcondition becomes `POST_CONDITION_FAILED`, if written) | — | — (n/a; Skip/Exit prune execution) | — | — (n/a) | BSD-3-Clause (USRA) |
| Mixture-of-Agents (`oss-moa`) | `1b5cab0` | layers of proposers → aggregator via prompt | ✓ (fixed depth) | — (offline LLM judges) | — | — (full concatenation) | — | — | Apache-2.0 |
| OpenAI Swarm (`oss-openai-swarm`) | `6af0b4c` | handoff: tool returns `Agent`; single history | ✓ config only (`max_turns` default ∞) | — | — | — | — | — | MIT |
| OpenAI Agents SDK (`oss-openai-agents-sdk`) | `27c75c5` | handoffs + Runner; typed final output | ✓ (`DEFAULT_MAX_TURNS`=10) | ✓ (strict schema + code tripwire guardrails) | — (only `Usage` tracking) | ✓ opt-in (`input_filter`, trimmer) | — | ✓ opt-in (`SessionSettings.limit`) | MIT |
| LangGraph Swarm (`oss-langgraph-swarm`) | `8956b13` | handoff via `Command(goto)`; `active_agent` router | ? (LangGraph core not inspected) | — | — | — (full history on handoff) | — | ? | MIT |
| LangGraph Supervisor (`oss-langgraph-supervisor`) | `88859b3` | supervisor ↔ workers star; hierarchy possible | ? (core) | ? (`response_format` passed on to the core) | — | ✓ (`output_mode="last_message"` default) | — | ? | MIT |
| CrewAI (`oss-crewai`) | `3df7fd0` | sequential or hierarchical (manager LLM delegates) | ✓ (`max_iter`=25 forces an answer) | ✓ (function guardrail, 3 retries, hard failure) | — (RPM is rate; usage only tracked) | ✓ opt-in (`Task.context`) | — | — | MIT (text) |
| AutoGen (`oss-autogen`) | `d07c667` | central manager: round-robin, LLM selector, swarm, MagenticOne | ✓ (composable conditions `&`/`\|`; `max_turns` default None) | — (end decided by LLM; tests only in an example) | ✓ coarse, opt-in (`TokenUsageTermination` post-turn) | ✓ partial (replanning clears thread) | — | ✓ opt-in (Buffered/TokenLimited contexts) | MIT (code) + CC-BY-4.0 (docs) |
| CAMEL (`oss-camel`) | `123f0c6` | RolePlaying (pair) and Workforce (LLM coordinator, central channel) | ✓ (Workforce; retries 3; timeout 600 s) | — (LLM judge score ≥60) | — (tokens only recorded) | ✓ weak, opt-in | ✓ (`CREATE_WORKER`; only grows) | ✓ (summarization at 50% of the limit) | Apache-2.0 |
| MetaGPT (`oss-metagpt`) | `11cdf46` | pub/sub in Environment; default via TeamLeader hub | ✓ (`n_round`=3, idleness, budget) | — (QA runs tests, but the verdict is LLM) | ✓ coarse (US$ 10 default, between rounds; model without price = 0) | — | — | ✓ (`memory_k`=200 in RoleZero) | MIT |
| ChatDev + MacNet (`oss-chatdev-macnet`) | main `464a681` · macnet `e7a3582` | generated DAG (chain/star/tree/net/mlp/random), topological order | ✓ (DAG is exhausted) | — (execution only ranks/prunes) | — | ✓ (`prune_test` cuts the lower half) | — macnet · ✓ opt-in main | ✓ (new agent per call; predecessor only) | Apache-2.0 (main) · ? (macnet without LICENSE) |

## Key anchors (repo@SHA → file:line)
- **Finite termination by default.** Agents SDK `27c75c5…`: `src/agents/run_config.py:L45` (`DEFAULT_MAX_TURNS = 10`). CrewAI `3df7fd0…`: `lib/crewai/src/crewai/agents/agent_builder/base_agent.py:L285-L287` (`max_iter=25`). MetaGPT `11cdf46…`: `metagpt/team.py:L123-L138`.
- **Infinite termination by default.** OpenAI Swarm `6af0b4c…`: `swarm/core.py:L239` (`max_turns: int = float("inf")`). AutoGen `d07c667…`: `max_turns=None` in RoundRobin/Selector/Swarm (card `oss-autogen`).
- **Budget that halts.** MetaGPT `11cdf46…`: `metagpt/team.py:L98-L100` (`NoMoneyException`), `metagpt/utils/cost_manager.py:L31` (`max_budget: float = 10.0`); the exception is caught by `serialize_decorator` (`metagpt/utils/common.py:L675-L686`). AutoGen `d07c667…`: `python/packages/autogen-agentchat/src/autogen_agentchat/conditions/_terminations.py:L275-L286`.
- **Cost measured but never bounded.** GPTSwarm `c23a827…`: `swarm/llm/price.py:L47-L49` (global counter, only used in logs). AgentPrune `c544dd6…`: `cost_count` defined and not called. Agents SDK: `src/agents/usage.py:L196-L230`.
- **Learned pruning.** AgentPrune `c544dd6…`: `AgentPrune/graph/graph.py:L317-L339` (`update_masks`). GPTSwarm: `parameterization.py:L107-L115`. AgentNet `325d39f…`: `AgentNet_Code/src/agentgraph.py:L155-L160`.
- **Pruning by idleness (not by quality).** SYMBIONT `0c19117…`: `symbiont/core/topology.py:L134-L143`. Volume reinforcement: `symbiont/core/topology.py:L118-L119`.
- **Pruning by output selection.** LangGraph Supervisor `88859b3…`: `langgraph_supervisor/supervisor.py:L225`. ChatDev macnet `e7a3582…`: `chatdev/waiting.py:L267-L314`.
- **Mechanical acceptance.** Agents SDK: `src/agents/agent_output.py:L142-L153`. CrewAI: `lib/crewai/src/crewai/task.py:L1450-L1459`. PLEXIL `0e7439f…`: `src/exec/NodeImpl.cc:L1236-L1246`.
- **False acceptance.** SelfHeal `812e6a3…`: `run_agent.py:L176-L197` (`validate_fixed_code` only looks for `"def "`/`"return"`) and `run_agent.py:L394` (`"ACCEPT" in critic_output`). CrewAI `3df7fd0…`: `lib/crewai/src/crewai/tasks/hallucination_guardrail.py:L97-L103` (without a hook, logs a warning and returns `True`). CAMEL `123f0c6…`: `camel/societies/workforce/utils.py:L405-L417` (LLM score ≥60).
- **Correlated voting.** Stigmergic `a90e93c…`: `src/stigmergic/core/consensus.py:L75-L84` (three "perspectives" from a single model), `L441`.
- **Elasticity.** CAMEL `123f0c6…`: `camel/societies/workforce/workforce.py:L2010-L2016`, `L4321` (`CREATE_WORKER`). SYMBIONT `0c19117…`: `symbiont/agents/queen.py:L71-L79` (spawn on demand signal). Buzz `49ea418…`: `src/buzz/buzzswarm.c:L377-L476`.

## Cross-cutting readings (hypothesis, from the matrix)
1. **Budget is the emptiest column.** Only MetaGPT (by default) and AutoGen (opt-in) halt on cost or tokens, and both check between steps. No project performs budget admission *before* the call. For the Observatory, this means the ceiling has to live outside the frameworks, in the harness.
2. **Mechanical acceptance is rare and usually optional.** Where it exists by default (Agents SDK schema, PLEXIL postcondition), it checks form, not task correctness. Where there are tests, they serve to rank or train (GPTSwarm, AgentPrune, MacNet), not to block a wrong final delivery.
3. **Pruning comes in two flavors:** learned by utility (GPTSwarm/AgentPrune/AgentNet, which require a training phase with ground truth) and structural, by output selection (`last_message`, `Task.context`, `prune_test`). The second is cheap and testable without training.
4. **Elasticity, when it exists, only grows** (SYMBIONT, CAMEL). No inspected LLM project removes agents for lack of demand. The closest case is CAMEL's `AgentPool`, which removes idle clones after 180 s (card `oss-camel`). Buzz does this in robotics, through membership expiration.
5. **Licenses:** AgentPrune and AgentNet have no LICENSE file, and neither does ChatDev's macnet branch. Public code without a license does not authorize reuse; these implementations serve only as reading references.

## Limits/gaps
- Static reading, without execution: effective defaults may change with external configuration, environment variables or dependencies not read.
- The LangGraph core (`recursion_limit`, checkpointers) was not cloned, hence the "?" in the two LangGraph rows.
- AutoGen's successor (Microsoft Agent Framework) and the `chatdev1.0` branch were not inspected.
- SwarmSys has no official code.
- AgentNet's official status (`zoe-yyx/AgentNet`) is self-declared in the readme; the arXiv page 2504.00587v2 does not cite a repository.
- The cards' frontmatter YAML was checked heuristically (required keys), not with a YAML parser: there is no Python in the environment.
