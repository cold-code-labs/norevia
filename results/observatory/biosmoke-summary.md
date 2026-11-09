# Bioinspired vs non-bioinspired — smoke test result (2026-11-08)

Pre-registration: `PREREG-bio-smoke.md`. Raw runs: `runs-biosmoke.jsonl`, `raw/biosmoke/`, log `biosmoke.log`. Code: `observatory/arch/bio.mjs`.
60 runs (5 tasks × 6 arms × 2 reps), Haiku/low, ≤5 calls per run. Spend US$ 1.26 (ledger total US$ 18.78 of the US$ 250 cap). 0 errors.

| Arm | n | Accepted (hidden) | False success | Mean cost | Mean calls |
|---|---:|---:|---:|---:|---:|
| A-low | 10 | 3 | 7 | 0.0112 | 1.0 |
| A-low-loop5 | 10 | 2 | 8 | 0.0116 | 1.0 |
| B-vote5 | 10 | 1 | 9 | 0.0566 | 5.0 |
| S-threshold | 10 | 3 | 7 | 0.0119 | 1.0 |
| S-stigmergy | 10 | 3 | 7 | 0.0119 | 1.0 |
| S-quorum | 10 | 1 | 9 | 0.0232 | 2.0 |

## Smoke criteria
1. Every arm ran on every task without errors — **met**.
2. No arm exceeded 5 calls — **met**.
3. Mechanisms observably acting — **not met**. All 60 runs passed every visible test on the first candidates, so the stimulus (failing visible tests) was always zero: threshold recruitment and stigmergic marks never fired, and the quorum was reached immediately by two scouts that were both wrong on hidden tests in 9 of 10 runs.
4. Cost known for sizing — **met** (≈ US$ 0.01–0.06 per run).

## What this shows (and does not)
- No efficiency comparison can be drawn: with n = 10 per arm and mechanisms inactive, differences are noise.
- The decisive finding is about the **signal**, not the swarm: on these tasks the visible tests (2–4 per task) are saturated — 60/60 visible pass vs 13/60 hidden pass (false success 47/60). Mechanisms driven by visible tests collapse to a single agent; voting and quorum amplify the false success. This is consistent with H-02 (the verifier is the dominant factor) and H-13 (false success grows with N under a weak verifier) — as an observation in a smoke test, not a test of those hypotheses.

## Changes needed before the full benchmark
1. **Informative environmental signal**: give architectures a stronger but still non-hidden signal (more visible tests per task, or a held-out "probe" split separate from the final hidden tests), so stimulus-driven mechanisms can act.
2. **Task selection on false success, not only on failure**: pick tasks where the weak agent passes visible tests but often fails hidden ones, and report visible/hidden gap per arm.
3. **Disagreement as a stimulus**: let bio arms use agreement between independent candidates on generated inputs (behavioural divergence) as a second stimulus, so the quorum checks behaviour, not just visible tests.
4. Keep the budget match (≤5 Haiku/low calls) and add A-high as an "invest in individual reasoning" reference for the central question.
