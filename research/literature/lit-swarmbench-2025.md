---
pivot: adapt
pivot_reason: "Local-view robustness benchmark can inform containment experiments after replacing tasks and metrics."
id: lit-swarmbench-2025
title: "SwarmBench — benchmarking LLM swarm intelligence under local constraints"
area: literature
evidence: author-reported
tags: [decentralization, local-perception, stigmergy, collective-behavior, robustness]
sources:
  - "Ruan, K.; Huang, M.; Wen, J.-R.; Sun, H. (2025). Benchmarking LLMs' Swarm intelligence. arXiv:2505.04364v4 (2025-10-15). https://arxiv.org/abs/2505.04364v4"
  - "Official code and data: https://github.com/RUC-GSAI/YuLan-SwarmIntell (repository page checked 2026-11-08; latest commit date displayed: 2025-05-21)"
related: [nat-stigmergy, nat-response-threshold, sim-stigmergy, sim-response-threshold, H-05, H-07, H-11, H-21]
updated: 2026-11-08
primary_opened: true
version: "Paper v4 (2025-10-15); repository activity last shown 2025-05-21"
summary: "A runnable 2D benchmark isolates decentralized coordination with local views and broadcasts; it adds embodied collective-behavior tasks and robustness tests, but does not report token or monetary cost per verified outcome."
---

## Question
Can LLM-driven agents produce useful collective behavior when each sees only a local patch of the environment and can send only short local broadcasts?

## Benchmark design
- Five 2D-grid tasks: Pursuit, Synchronization, Foraging, Flocking, and Transport. The environment includes a physics engine; Transport requires multiple agents to push an object that one agent cannot move alone.
- Each agent is an independent LLM instance. It receives its local (k \times k) view, status, and messages from the previous round, then returns one action and optionally a short anonymous local broadcast.
- Main evaluation: 13 LLMs, 100 rounds per episode, (5 \times 5) view, five simulation runs per model-task pair. The paper also includes rule-based/heuristic comparisons, agent-count and view-size sweeps, a centralized/global-view variant, and communication corruption/delay tests.
- Reported metrics include task-specific score/progress, movement and exploration, directional entropy, stillness, dominant-action share, polarization, local structure preservation, cooperative push events, and message length/content features. These are useful diagnostic measurements of group dynamics.

## Author-reported findings
- Scores vary substantially by model and task; no model dominates every task. In the reported setup, only o4-mini and DeepSeek-R1 obtain a non-zero average Transport score.
- Foraging degrades with higher group size, plausibly due to congestion; Transport benefits from more agents; Pursuit peaks at an intermediate group size. Increasing the view from (3\times3) to (5\times5) often helps, but (7\times7) has diminishing or negative returns in some tasks.
- In a Gemini 2.0 Flash centralized/global-view ablation, reported scores rose for Foraging and Synchronization, were nearly unchanged for Flocking and Pursuit, and remained zero for Transport. This is evidence about that particular model/task setup, not a universal advantage of centralization.
- With 20% communication corruption and 0–4 step delays, performance changes differ sharply by model and task. The paper also reports recurring failure patterns: movement bias, information silos, traffic jams, repetitive actions, inefficient exploration, and short-memory spatial forgetting.
- These are results reported by the paper's authors. Norevia has not reproduced them.

## What it can add to Norevia
Norevia's current Observatory is aimed at verifiable software tasks and architecture comparison (single agent, fixed team, elastic team), measuring acceptance/false success, cost, latency, calls, and rework. Its local swarm simulations are abstract models, not LLM runs. SwarmBench fills a complementary gap: it tests whether coordination emerges from constrained local perception/action in an embodied environment, rather than task decomposition and artifact handoff.

The most useful candidate additions are:
1. Add a small decentralized environment track with Foraging and Transport first. Foraging exposes coverage, duplicated effort, and congestion; Transport tests genuine joint action that cannot be decomposed into independent code patches.
2. Factor **control topology** separately from **team sizing**: decentralized local-view agents, centralized/global-view control, and a single-agent/global-information baseline; then compare fixed versus elastic group size within the applicable conditions. This avoids attributing a topology effect to agent count.
3. Log environment efficiency alongside LLM cost: task score/completion, rounds, actions and distance, duplicate exploration, congestion, messages/tokens, wall-clock latency, and provider cost per accepted outcome. SwarmBench's movement-efficiency metrics are not monetary/token efficiency.
4. Add selected robustness ablations (message loss/delay, local-view radius, group size) and failure labels (silos, traffic jams, oscillation/repetition, premature convergence). Pre-register the expected direction and acceptance floor before running LLMs.
5. Reuse the paper's deterministic task scores and heuristic baselines where possible, but retain Norevia's acceptance verification and cost accounting. The benchmark's own scores do not establish task correctness in Norevia's software-engineering setting.

## Limits and implementation caveats
- The task domain is spatial/embodied and the score definitions are task-specific. It does not directly measure durable ownership, cross-session responsibility, artifact correctness, bounded repair, or benchmark-general cost efficiency.
- Five repetitions per primary model-task result give limited precision; task and model effects should not be generalized beyond the tested configuration without more runs.
- The paper reports correlation/feature-importance analyses between dynamics and score; these do not establish that manipulating the measured feature will improve performance.
- The code repository documents execution, but its displayed latest commit is 2025-05-21 and the repository's future-work list still names incomplete dataset/RLVR items. Treat it as a fixed research artifact unless a fresh run verifies compatibility. No independent reproduction or environment install was performed for this note.
- A faithful reimplementation/adaptation would need its own tests, baseline parity checks, cost ledger, and preregistration. The current local Norevia grid simulations are not SwarmBench replications.

## Evidence boundary
Natural flocking, foraging, and cooperative transport motivate task design. The measured LLM results are author-reported computational experiments. Any mapping to Norevia's asynchronous OpenBot agents is a proposed engineering transfer, not demonstrated efficacy.
