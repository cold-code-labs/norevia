---
id: obs-lab003-split-retry-memory
title: "LAB-003 — When splitting pays, retry or recruit, and type memory"
area: observatory
evidence: local-validation
tags: [lab-003, split-by-size, retry-vs-recruit, memory, observatory, haiku-5-5]
related: [H-04, H-05, H-06, H-11, H-21, obs-lab003-calibration, obs-lab003-prereg-step0, obs-lab003-prereg-main]
updated: 2026-11-09
summary: "After fixing false success with a stronger agent-visible probe, splitting into package owners pays from about 3 packages; retry and recruit give the same result at equal budget; request-type memory did not help."
data: [results/charts/lab003-step0-false-success.json, results/charts/lab003-q1-split-by-packages.json, results/charts/lab003-q1-cost-ratio.json, results/charts/lab003-q2-retry-vs-recruit.json, results/charts/lab003-q2b-harder-regime.json, results/charts/lab003-q3-memory.json]
---
# LAB-003 — When does splitting pay, retry or recruit, and does type memory help (report)

> **Charts on this page, in order.** Step 0 (1 false success, visible-only probe against the strengthened probe); Q1 split by packages (2 acceptance, 3 cost per accepted task, 4 package acceptance, 5 hidden-test pass rate, lines SOLO vs TEAM; 6 team-over-solo cost ratio); Q2 retry or recruit at E = 8 extra calls (7 task acceptance, 8 package acceptance, 9 cost per accepted, 10 extra calls), then the same four for the harder Q2b regime (11–14); Q3 memory (15 first-pass failure, 16 cost per accepted). Raw runs and ledger are in `results/lab003/`.

Norevia Lab · 2026-11-09 · Claude Haiku 5.5 via the Anthropic API (Platform key from the vault) · **ledger US$ 14.74 counted of the US$ 15 cap** (counted = cost × 1.5; ≈ US$ 9.83 at the price table US$ 0.10/M in, 0.50/M out, not an invoice; 1,480 calls) · `PREREG-STEP0.md`, `PREREG-MAIN.md` (+ Amendments 1–2) written before the runs they govern · `CALIBRATION.md` (Step 0).

## Answers in brief
**Step 0 — false success.** Fixed. With 60% of the hidden cases in the agent-visible probe, probe-pass → hidden-fail went from 6/10 (first-pass, k ≥ 3, visible-only probe) to 0 and from 0.127 to 0 at k = 1; after repair 0/93 (0 of 76 + 0 of 17, upper bound ≈ 0.04 pooled). In the main runs false success was 2/90 (Q1), 5/48 (Q2, mostly the no-extra-budget reference) and 1/228 (Q3). Acceptance is now measurable. (Cost: the acceptance bar is easier, see Limits.)

**Q1 — From how many packages does splitting pay?** **From about 3 packages; at 8 and 15 it is large.** Cost per accepted task, TEAM/SOLO ratio ρ (95% bootstrap over tasks):
| Packages | SOLO accepted | TEAM accepted | $/accepted SOLO → TEAM | ρ (95% CI) | Reading |
|---:|---|---|---|---|---|
| 1 (6 tasks) | 18/18 | 18/18 | 0.0065 → 0.0055 | 0.85 (0.75–0.98) | equal by construction; the gap is two SOLO repair calls vs none (noise-level) |
| 3 (4) | 12/12 | 12/12 | 0.0221 → 0.0141 | **0.64 (0.51–0.81)** | team pays |
| 8 (3) | 7/9 (0.45–0.94) | 9/9 (0.70–1) | 0.120 → 0.044 | **0.37 (0.13–0.55)** | team pays |
| 15 (2) | **0/6** (0–0.39) | 4/6 (0.30–0.90) | none → 0.118 | SOLO never accepted | team pays; package acceptance 0.62 vs 0.98 |
Crossover from the pre-registered fit: k\* = 1.3 (95% 1.1–1.5), i.e. at or below the smallest size where the arms genuinely differ (3); with sizes 1 and 3 only, **the crossover cannot be placed more precisely than "between 1 and 3 packages"**. Mechanism at large k: the single agent's answer hits the 64k output cap (11 of its calls at k = 8, 13 at k = 15 were cut) and loses files, so it fails by not being able to emit the repair, not by reasoning; TEAM never truncated. TEAM costs more at k = 15 per run than at k = 8 only because it needs 15–17 calls; it is still 43% cheaper per run than SOLO (0.079 vs 0.137).

**Q2 — Retry or recruit?** **No detectable difference between retrying and recruiting; the extra attempts with probe feedback are what matter. LAB-001's THRESH gain looks like "more attempts", not a swarm mechanism.** Same 8 extra calls on 8-package tasks, 12 paired task-runs (6 tasks × 2 repetitions), stage 1 shared:
| Arm | Accepted | Package acceptance | $/accepted |
|---|---|---:|---:|
| NONE (stage 1 only) | 5/12 (0.19–0.68) | 0.927 | 0.099 |
| RETRY (same agent, own answer + feedback) | 11/12 | 0.990 | 0.090 |
| RECRUIT-U (fresh agents, uniform) | 12/12 | 1.000 | 0.085 |
| RECRUIT-T (fresh agents by response threshold) | 11/12 | 0.990 | 0.093 |
Any extra budget lifts acceptance by +0.50 (CI +0.17 to +0.83). RECRUIT-T vs RETRY: Δ 0.00 [0, 0], cost ratio 1.03 (1.00–1.07); RECRUIT-U vs RETRY: Δ +0.08 [0, +0.25]; RECRUIT-T vs RECRUIT-U: Δ −0.08 [−0.25, 0] — threshold allocation did not beat uniform fresh recruits. All contrasts INCONCLUSIVE by the pre-registered rule; with 12 units the study can only exclude differences larger than about 25 points. Q2 is at the ceiling (every arm ≈ 100%). **Q2b** (harder regime: 5 "hard" + 3 other packages, tight budget E = 4, 1 repetition, 6 tasks): NONE 5/6, all three extra-budget arms 6/6 — also at the ceiling, uninformative (the packages that were hard for one agent are not hard for a package owner).

**Q3 — Does request-type memory help?** **No: not confirmed.** 38 requests × 3 orders, empty memory each time, bounded 1,200 characters of lessons per type (327 lessons written, distillation 3.8% of MEM cost):
| | NOMEM | MEM |
|---|---:|---:|
| first-pass failure (probe) | 14.0% (8.8–21.6) | 19.3% (13.1–27.5) |
| accepted | 114/114 | 113/114 |
| $/accepted | 0.0062 | 0.0065 |
Δ first-pass failure +5.3 points (95% CI 0.0 to +10.5); cost ratio 1.055 (1.007–1.104); second half of each sequence: +3.5 points (−3.5 to +10.5). By the rule: **no detectable effect**, with a lean toward slightly worse and slightly costlier (the lessons add ≈ 1.1k characters to prompts). LAB-002's exploratory 4/4 is **not confirmed** — that was LP house standards (a rule the brief did not state), a setting where a lesson is directly actionable; here the single packages are near the ceiling (≈ 86% first-pass success) and generic lessons add little. Power is limited to differences of ≈ 10 points.

## What was and was not worth measuring
Latency from non-blocking design and k = 1 equality were functional checks, not results. The informative results are Q1 (large and clear), the Step 0 fix, and two null results (Q2, Q3) whose precision is bounded by ceilings and n.

## Limits and incidents (all disclosed)
1. **The cap counter was per process (my defect).** I ran up to 4 experiment processes at once; each kept its own running total, so the US$ 14.0 dispatch stop line and the US$ 15 cap were enforced per process, not globally. Combined spend ended at US$ 14.74 counted (below the hard cap, above the 14.0 line by 0.74); the real ceiling was never breached, but it was luck of margin. Fixed after the main run: `api.mjs` re-reads the shared ledger before every reservation (hash changed after the registered hash; no run used it).
2. **My cost estimates were low** (Q2 ≈ US$ 1.5 counted per repetition vs 0.9 estimated). Consequences, decided before seeing Q2b outcomes (Amendment 2): Q2 repetition 3 cancelled (its 1 completed unit excluded), Q2b limited to 1 repetition, Q3/Q1 repetition 3 completed. Q2 therefore rests on 12 task-runs, Q2b on 6.
3. **Easier acceptance:** 60% of the hidden cases are visible to the agents by design; "accepted" means the agent also passed the 40% it never saw. Absolute acceptance rates are not comparable with LAB-001/2.
4. **Same 38 packages everywhere:** tasks are not independent; resampling is by task; Q1 has 2 tasks at k = 15 and 3 at k = 8 (intervals wide); k = 1 cannot separate arms.
5. **Q1 k = 1 gap:** TEAM and SOLO are identical by construction; the observed 15% cost gap is two repair calls in SOLO, not a split effect.
6. **Q3 first-pass hidden failure was not recorded** (only the probe); hidden acceptance is final. Memory content is generic lessons distilled by the same model; other memory designs (retrieval of similar solved tasks, per-package notes) were not tested.
7. Price table not an invoice; one small model at default sampling; unfolding and recruiting rules are fixed rules, not model-chosen.

## Files (relative to the repository root)
Tools `observatory/lab003/`: `testrun3.mjs` (case-level test runner), `build3.mjs` (package index, probe builder, task composer), `engine3.mjs` (budgeted agent runs, SOLO, TEAM, paired evaluation), `api.mjs` (API layer, ledger, cap), `cal.mjs`/`cal2.mjs` (Step 0), `q1.mjs`, `q2.mjs`, `q2b.mjs`, `q3.mjs`, `plan.mjs`, `analyze3.mjs`. Results `results/lab003/`: `PREREG-STEP0.md`, `PREREG-MAIN.md`, `CALIBRATION.md`, `REPORT.md`, `runs-cal.jsonl`, `runs-cal2.jsonl`, `runs-q1.jsonl` (90), `runs-q2.jsonl` (52, of which 48 analysed), `runs-q2b.jsonl` (24), `runs-q3.jsonl` (228), `summary.json`, `summary-q2b.json`, `ledger.jsonl`. Reproduce: `node observatory/lab003/q1.mjs --rep N` (same for `q2`, `q2b`, `q3`), then `node observatory/lab003/analyze3.mjs` (`Q2FILE=runs-q2b.jsonl SUMMARY=summary-q2b.json` for Q2b).
