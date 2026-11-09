# Pre-registration — bioinspired vs non-bioinspired smoke test (2026-11-08)

**Purpose.** Check that the three bioinspired architectures run correctly, respect the budget and produce logs, and measure the cost of a larger run. It is a smoke test: **no hypothesis is tested and no efficiency claim may be drawn from it.**

**Budget match.** All arms use the same model and effort (Haiku, low) and at most 5 calls per run.

| Arm | Type | Mechanism |
|---|---|---|
| A-low | non-bio reference | 1 call |
| A-low-loop5 | non-bio | one agent, self-repair from visible-test feedback, ≤5 calls |
| B-vote5 | non-bio | 5 independent candidates, select by visible tests |
| S-threshold | bio (H-06) | response-threshold recruitment with habituation |
| S-stigmergy | bio (H-07) | shared artifact + evaporating marks, no messages |
| S-quorum | bio (H-08/H-27) | scouts, recruitment to best site, commit at quorum q=2 |

**Tasks.** b11-calendar-kit, b20-texto-largura, bx08-repo-cinco-kits, b17-numeros-kit, b19-grafos-kit — chosen because earlier calibration showed A-low failing at least sometimes on them. The calibration predates task repairs and is used only for selection; A-low is re-measured here.

**Design.** 5 tasks × 6 arms × 2 repetitions = 60 runs. Phase cap US$ 5.

**Recorded per run.** Hidden-test acceptance, false success (visible pass, hidden fail), cost, tokens, calls, critical-path latency, mechanism trace.

**Pass criteria for the smoke test.** (1) Every arm completes without errors on every task. (2) No arm exceeds 5 calls. (3) Mechanism traces show the mechanism actually acting (recruitment varies with stimulus; marks evaporate; quorum reached or exhausted). (4) Measured cost lets us size the full benchmark.

**Full benchmark (not authorised yet).** Primary outcome: cost per accepted solution with hidden-test acceptance and false success reported alongside, with intervals; ~20 calibrated tasks × arms × ≥3 repetitions.
