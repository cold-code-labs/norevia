---
id: obs-lab003-calibration
title: "LAB-003 — Step 0, calibration of false success"
area: observatory
evidence: local-validation
tags: [lab-003, calibration, false-success, observatory]
related: [obs-lab003-split-retry-memory, obs-lab003-prereg-step0]
updated: 2026-11-09
summary: "A probe that shows 60 percent of the hidden test cases removed false success (0 of 93 after repair), so acceptance became measurable."
data: [results/charts/lab003-step0-false-success.json]
---
# LAB-003 — Step 0: calibration of false success (report)

Norevia Lab · 2026-11-09 · Claude Haiku 5.5 via the Anthropic API · `PREREG-STEP0.md` (+ Amendment 0.1) written before the runs · files: `runs-cal.jsonl`, `runs-cal2.jsonl`, `calibration-cal.json`, `calibration-cal2.json`.

**Gate result: passed. False success fell from dominant to ≈ 0, so acceptance is measurable.**

## What changed in the probe
Agent-visible probe per package = original visible tests + 60% of the hidden test cases (case level; bug-revealing and guard cases thinned separately, ≥ 1 revealing case left unseen when a package has ≥ 2). Acceptance = the full original hidden suite. The unseen cases never appear in any prompt (the prompt shows a filtered source view). This is a train/test-style leak of 60% of the hidden cases, declared: accepted tasks are tasks that also pass the 40% the agent never saw, but the acceptance bar is easier than before.

## Numbers
| Candidates | Probe | probe-pass → hidden-fail | 95% Wilson |
|---|---|---:|---|
| first pass, k = 1 (76 runs) | visible only (old) | 9/71 = 0.127 | 0.068–0.224 |
| first pass, k = 1 | new 0.6 | 0/62 = 0.000 | 0–0.058 |
| after repair, k = 1 | new 0.6 | 0/76 = 0.000 | 0–0.048 |
| first pass, k ≥ 3 (20 tasks: 12×3, 6×8, 2×15 packages) | visible only (old) | 6/10 = 0.600 | 0.313–0.832 |
| first pass, k ≥ 3 | new 0.6 | 0/4 | 0–0.490 (few candidates pass the probe at first pass) |
| after repair, k ≥ 3 | new 0.6 | 0/17 = 0.000 | 0–0.184 |
Gate: after-repair FS ≤ 0.20 (k = 1: 0.000; k ≥ 3: 0.000, upper bound 0.18) and first-pass FS ≥ 50% lower (k = 1: 0.127 → 0.000; k ≥ 3: 0.60 → 0.00 on 10 vs 4 probe-passing candidates) → **pass**. Share 0.8 was not needed (offline scoring of the same first-pass candidates at 0.4, 0.6 and 0.8 gave 0/62, 0/62, 0/62 at k = 1).

## What the calibration also showed
- **One agent solves every single package** (76/76 accepted after repair; first-pass acceptance 62/76), so k = 1 is at the ceiling and cannot separate any arm.
- With the stronger probe the **single agent now repairs multi-package tasks**: accepted after repair 12/12 at k = 3, 5/6 at k = 8, 0/2 at k = 15; mean cost per run US$ 0.026 / 0.093 / 0.132 (price table). The earlier "acceptance ≈ 0 everywhere" was largely the verifier, not the agents.
- Eligibility rule of the pre-registration: all 38 packages eligible (no false success, ≥ 1 acceptance each); no package excluded. Nine packages had a first-pass probe failure (agenda-kit, codecs-kit, calendar-kit, grafos-kit, texto-largura, protocolo-quadros, calendario-fiscal, numeros-kit, recorrencia-agenda) — the "hard" pool used later in Q2b.
- Limits: calibration is SOLO-only; k ≥ 3 first-pass comparison rests on 10 and 4 candidates; cost from a price table.
