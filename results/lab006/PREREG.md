---
id: obs-lab006-prereg
title: "LAB-006 — Pre-registration"
area: observatory
evidence: hypothesis
tags: [preregistration, observatory]
related: [obs-lab006-allocator-v0]
updated: 2026-11-09
summary: "The Allocator policy, the evaluation set, the arms, the frontier and the win-tie-loss rule, written before the main runs."
---
# LAB-006 — Norevia Allocator v0 and its evaluation (pre-registration, 2026-11-09, before the main runs)

Owner: Norevia Lab. Overnight batch (`tasks/OVERNIGHT-2026-11-09.md`). **Cap US$ 30**, own ledger `ledger.jsonl`, enforced in code (single process; counted cost = table cost × 1.5; US$ 2.1 counted before this file: two smoke runs and a debugging run). Model: Claude Haiku 5.5 only through the Anthropic API (key from `ANTHROPIC_API_KEY_FILE`); price table US$ 0.10/M in, 0.50/M out (not an invoice).

## What was built (`allocator/`, zero dependencies, 7 unit tests with a mock model)
`createAllocator({ model, policy, budget, onEvent }).run(task)`; the task is an adapter with `parts`, `group(ids, {feedback, previous, extra})` (prompt builder), `parse`, `verify` (visible check per part), optional `baseline` (free check of the starting state) and `merge`. Policy, every decision logged with its reason: (1) **decide** solo if parts < 3, team otherwise (LAB-003 Q1); (2) team = one owner per part with part-only context, in parallel; (3) first-pass agents receive the visible-check feedback of the starting state when the task provides it (LAB-003); (4) **repair only failing parts**, with their feedback and previous candidate, ≤ 2 rounds, a repair is kept only if its check score does not drop and its files are merged on the previous ones (LAB-003 Q2); (5) **active stop** as soon as every part passes: no patrol, no further calls (LAB-004 wound_resolution); (6) **verification gate**: accepted only if every part passed its visible check, otherwise the result is reported unverified; (7) per-task **budget ceiling** (calls, USD) checked before every call. Not included on purpose: type memory (LAB-003 Q3 null), voting without a check (LAB-004: correlated errors → false success), unbounded fan-out.
Two defects of my own found while smoke-testing the evaluation (before any registered run): the repair replaced a package's candidate by only the files the agent returned (earlier fixes lost) — fixed with the `merge` hook, used by every arm — and first-pass agents did not see the starting-state check feedback that LAB-003's owners had — added as `baseline`, given to every arm. The API layer also disabled "thinking" by default (right for micro-tasks, wrong for repository repair, where LAB-003 used the model default): thinking is now a per-request property — off for micro-tasks (as LAB-004), model default for repository tasks (as LAB-003).

## Evaluation set (fixed by seeds)
**Repository tasks (LAB-003 builder, strengthened probe 0.6):** 6 tasks of 1 package, 4 of 3, 3 of 8, 2 of 15 (`plan(77)`, the same compositions as LAB-003 Q1). **Micro-task bundles (LAB-004 pool):** a bundle is one task whose parts are independent micro-functions (each part checked by its shown examples, scored by hidden tests); 10 bundles of 3, 8 of 8, 6 of 15 parts, parts drawn by seed from the 251 pool tasks that the LAB-004 pool calibration solved in ≥ 2 of 3 fresh attempts (chosen from calibration only, not from any arm of this evaluation; false success remains possible through the traps). Acceptance = every part passes the hidden tests; the gate (system claim of success) = every part passes its visible check; **false success** = gate passed, hidden failed.
## Arms (all use the same model, prompts built by the same adapter, the same baseline feedback, the same ceiling: calls ≤ 2k+4; USD ≤ 0.02 + 0.00006·LOC for repository tasks, 0.01 + 0.004·k for bundles)
**SOLO** (one agent sees all parts; ≤ 2 repairs; Allocator code with the decision forced); **ALWAYS-SPLIT** (owners for every task even k = 1; ≤ 2 repairs; decision forced); **ORCH** (central orchestrator, uncapped: planner call → ⌈k/3⌉ (≤ 4) group solvers in parallel → integrator only for parts whose check still fails); **TODAY** (TEAM-TODAY-style as in LAB-001: coordinator briefs → one specialist per part with the whole task as context → coordinator review messages → a second specialist round for every part; 2k+2 calls); **ALLOCATOR** (the library as above).
**Repetitions:** 3 (a 4th only if the ledger allows it and is then stated); order of jobs shuffled; arms and tasks interleaved.

## Outcomes and rules (fixed now)
Primary: **cost per accepted task** (table cost) with **acceptance rate** (Wilson 95%), **false-success rate** and **latency** (critical path: sequential stages add, parallel calls take the slowest, from provider fetch times; wall clock is not used). Resampling unit = task (all repetitions together), 4,000 seeded bootstrap draws. Reported per size class (repo k = 1, 3, 8, 15; micro m = 3, 8, 15) and pooled over repository tasks and over bundles.
**Position on the frontier:** per size class, an arm is *dominated* if another arm has lower-or-equal cost per accepted task, higher-or-equal acceptance and lower-or-equal median latency, strictly better on at least one; the report lists the non-dominated set and whether the Allocator is in it. **Where it loses:** the Allocator **LOSES** to an arm in a class if (cost-per-accepted ratio Allocator/arm has its lower 95% bound > 1.10) or (acceptance difference's upper bound < −0.10); **WINS** if (ratio upper bound < 0.90 and acceptance difference's lower bound ≥ −0.10); otherwise TIE. Cells with only 2–3 tasks (k = 8, 15) are reported with their wide intervals and no claim beyond them.
**Expectations stated before running (not tested as hypotheses):** Allocator ≈ SOLO at k = 1; Allocator ≈ ALWAYS-SPLIT at k ≥ 3 and cheaper than SOLO from k = 3; TODAY the most expensive; SOLO failing at k = 15 (output cap) as in LAB-003.

## Known limits (before running)
Haiku 5.5 at default sampling, one task family per kind (code repair on a fixed pool of 38 packages; synthetic micro-functions), the 15-package class has only 2 tasks, bundles use pool-calibrated solvable parts so acceptance is measurable, tasks reuse packages across tasks, ORCH/TODAY are my reconstructions (not OpenBot itself), cost from a price table. A result here supports the Allocator's policy on these two task kinds; it does not show it works on other kinds of work.

## Code hashes (sha256, first 12 hex)
984324dd96c1 lab006/api.mjs · 4497fcdaf31d lab006/adapters.mjs · 3b96240f4bc1 lab006/arms.mjs · eb8123ded0e2 lab006/run6.mjs · f639849230f8 ../allocator/index.mjs · 

---
## Note (before the 4th repetition ran)
Repetitions 1–3 ended at US$ 22.05 counted; a 4th repetition was run as allowed above (dispatch stop 29.2, hard cap 30) and finished at US$ 28.40 counted, complete for all 39 tasks × 5 arms. Reported results use **4 repetitions**. No rule, arm, task or code changed between repetitions.
