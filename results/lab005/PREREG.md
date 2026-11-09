---
id: obs-lab005-prereg
title: "LAB-005 — Pre-registration and amendment"
area: observatory
evidence: hypothesis
tags: [preregistration, observatory]
related: [obs-lab005-flags-batch2]
updated: 2026-11-09
summary: "Flags, closest engineering controls, worlds, scales and the verdict classes (bio-specific effect, engineering-equivalent, null), written before the main runs."
---
# LAB-005 — Flag batch 2: looking for a bio-specific effect (pre-registration, 2026-11-09, before the main runs)

Owner: Norevia Lab. Overnight batch (`tasks/OVERNIGHT-2026-11-09.md`). **Cap US$ 35**, own ledger `ledger.jsonl`, enforced in code per call (single process; counted cost = table cost × 1.5; US$ 1.0 counted before this file: two smoke runs). Model: Claude Haiku 5.5 only, Anthropic API, key from `ANTHROPIC_API_KEY_FILE`; thinking disabled; ≈ US$ 0.00007 per call at the price table (US$ 0.10/M in, 0.50/M out; not an invoice).

## Question
Every positive result so far (LAB-001…004) was explained by a non-bio engineering control. Which of five more flags — chosen because their mechanism has no obvious one-line engineering equivalent — beats **its closest engineering control**, not only a plain baseline? Micro-task scale of LAB-004: same 630-task pool (`tasks5.mjs` = LAB-004 tasks plus the op structure of the programming-by-example tasks, used to define **task classes**: family, or for PBE the sorted pair of step types; ≈ 55 classes), same agent call (≈ 200 input, ≈ 100 output tokens), same scoring (accepted = hidden tests pass; false success = committed on the visible check, hidden fails).

## Flags chosen (by expected information) and what each is paired with
| Flag | Mechanism implemented | Closest engineering control(s) | Plain base |
|---|---|---|---|
| `proportional_allocation` (S-PROP) | an agent picks, among open tasks in its 30-task sample, with probability ∝ 0.05 + partial quality (best fraction of visible examples passed; 0.25 if untried) — waggle-dance recruitment ∝ quality | S-GREEDY (best partial score first), S-BOARD (least-claimed) | S-BOARD |
| `quorum_sensing_activation` (S-QSA) | costly collective action = a 3-agent team on the task, triggered by the **density of "blocker" signals in the task's class** (≥ 6 attempts in the class and smoothed failure rate ≥ 0.75), i.e. a signal pooled over a neighbourhood, not the task's own count | S-ESC1 (team after 1 failure on the task), S-ESC2 (after 2) | S-BOARD |
| `correlation_stop` (S-SEQCORR) | sequential voting that stops adding voters when the marginal gain of the effective number of voters n/(1+(n−1)ρ̂) falls below 0.12 (ρ̂ = online agreement rate among visibly-failed candidates; ≥ 2 votes, ≤ 5), verified candidates weigh 1 vs 0.25 | S-FIXED3 (exactly 3 votes), S-SEQMAJ (until a margin of 2, ≤ 5) | S-FIXED3 |
| `acceptance_coupled_launch` (D-ACL) | bursty world: active agents next round = N × clip(last-round visible-commit rate / 0.25, 0.1, 1), start 0.3 N | D-AIMD (additive increase 0.05 N when commit rate ≥ 0.15, else halve) | D-FULL (all N always on) |
| `predator_prey_damping` (D-PPD) | active agents relax toward the backlog with damping: A' = A + 0.5 (backlog − A), × 0.8 when idle share > 0.3, start 0.3 N | D-HYST (autoscaler ×1.5 / ×0.67 on backlog per agent with hysteresis), D-PCTRL (active = backlog, undamped) | D-FULL |
Reference baseline for every flag (fixing LAB-004's capped-orchestrator artefact): **S-CENTRAL** / **D-CENTRAL** = uncapped central dispatcher with global state (one agent per open task, no duplicates). Not chosen: `firefly_sync`, `physarum_edges`, `relay_recruit_selflimit`, `danger_signal_escalation`, `topological_neighbours` (the LAB-004 revise gain is only 6% and the pool has no shared state to route; expected information low); stated up front.

## World, scales, repetitions
Agents are stateless, one call per active agent per round, wave = max(10, active/10) agents on one board snapshot, local visibility of 30 open tasks, claim marks last 1 round (as LAB-004). Static world 'S': all 630 tasks at round 0. Dynamic world 'D': the pool is released in four bursts (19%, 40%, 25%, 16% at rounds 0, 2, 4, 6 of 8). **N = 300 agents, 8 rounds, 4 seeds (1–4), all 17 arms** (the scale where LAB-004 saw the board effect and duplicates start); **N = 1,000, 6 rounds, 3 seeds, static arms S-CENTRAL, S-BOARD, S-GREEDY, S-PROP, S-QSA** (where duplicates dominate). Seeds change the agent order, task release and sampling; the model itself is sampled at default temperature. Dispatch stops at US$ 33.5 counted.

## Outcomes and verdict rule (fixed now)
Primary: **accepted tasks per US$** (table cost) with **coverage** (accepted/630); **false-success rate** reported separately and never merged. Dynamic world also: mean waiting rounds of accepted tasks and backlog-rounds (sum over rounds of open tasks). Paired task-level bootstrap (4,000 draws, seeded; all seeds pooled per task; task cost = attempts × the arm's mean cost per call).
*BETTER(f, g)*: Δcoverage lower 95% bound ≥ −0.03 and accepted-per-US$ ratio lower bound > 1.10, **or** Δcoverage lower bound > 0 and ratio lower bound ≥ 1.0; in the dynamic world a BETTER is downgraded to INCONCLUSIVE if f's mean waiting is more than 25% above g's. *WORSE*: Δcoverage upper bound < −0.03 or ratio upper bound < 0.90.
Verdict per flag: **"bio-specific effect"** iff BETTER than its plain base **and** BETTER than **every** closest control; **"engineering-equivalent"** iff BETTER than the base but at least one control is not beaten (matches or beats the flag); **"null"** otherwise (including WORSE). A false-success rate more than 0.10 above a control's is noted and vetoes "bio-specific". Comparison with the reference baseline is reported for each flag but does not change the class.

## Known limits (before running)
Micro-tasks only, one cheap model, simple fixed-rule implementations of each mechanism (one reading of each card), 3–4 seeds, task-level intervals (same 630 tasks), classes defined by me for the QSA signal, thresholds (0.75, 6 attempts, 0.12, 0.25…) set by me and not tuned on outcomes beyond two smoke runs (60 agents; one bug found and fixed: the vote arms' assignment). A null here does not say the mechanism cannot help elsewhere.

## Code hashes (sha256, first 12 hex)
4916efc841b6 api.mjs · 083873967e0b tasks5.mjs · 6d751d413e52 backend.mjs · 8cb38648e84b engine5.mjs · 16c27382f168 run5.mjs · 

---
## Amendment 1 (after the N = 300 runs and 1–2 seeds at N = 1,000; informed by them)
**Why.** At N = 300 with 8 rounds every static arm reached the pool's ceiling (coverage 0.39–0.42 for all arms except GREEDY and SEQCORR; accepted tasks per US\$ differ only through the number of calls), so allocation, escalation and commit rules have almost no room to matter; at N = 1,000 (6,000 calls) the pool is even more saturated (coverage 0.42–0.43). The N = 1,000 stage was therefore **stopped after seed 1 for all five arms and seed 2 for four of them** (GREEDY has one seed) — fewer than the three seeds registered; it is reported as exploratory and the verdict rule is not applied to it. The money saved funds a **budget-limited regime** where the allocation decision matters: **static world, N = 100 agents, 6 rounds (≤ 600 calls, expected coverage ≈ 0.2–0.3), 10 static arms, 6 seeds (1–6)**. Same rule, same verdict classes, same controls, applied to that regime with 6 seeds; the verdict of each flag is stated **for each regime separately** and a flag is called "bio-specific effect" overall only if it is so in the regime(s) where it is not saturated. The dynamic-world flags (D-ACL, D-PPD) keep their N = 300 result as registered (population control matters there because bursts exceed the active population). Cost: ≈ US\$ 4 counted; ledger at US\$ 21.7 counted when this amendment was written.
