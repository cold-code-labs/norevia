---
id: sim-report
title: "Report on the Norevia simulations — hypothesis tests in abstract agent models"
area: simulation
evidence: local-validation
tags: [simulation, hypothesis-testing, preregistration, reproducibility, synthesis]
sources:
  - "Code: sims/*.mjs (Node 22, no dependencies, mulberry32 PRNG, base seed 20261107)"
  - "Data: results/sims/*.json · Preregistration: results/sims/PREREGISTRATION.jsonl"
related: [sim-correlated-vote, sim-verifier, sim-response-threshold, sim-stigmergy, sim-quorum, sim-elastic, sim-clonal, H-01, H-02, H-05, H-06, H-07, H-08, H-10, H-13, H-14, H-17, H-19, th-model]
updated: 2026-11-07
summary: "7 preregistered simulations, 33 predictions: 19 supported, 2 partially, 12 not supported — within abstract agent models. Correlated errors cap the vote; the verifier and the elastic/clonal rules pay off; quorum and several detailed predictions failed."
---

> **Evidence scope — read before citing.** Everything here is `local-validation` **within simulated models** of abstract agents (probability of a correct answer, cost per step, shared latent error factor). No number is an LLM measurement. The models embody assumptions (effort curve, conditional independence, verifier with fixed sens/spec) that need to be measured in the Observatory before any engineering decision. Research proposal, not an authorisation to deploy.

## How to reproduce
```
node sims/run-all.mjs          # reruns the 7 simulations (~25 s), rewrites the JSON files and checks
                               # determinism (byte-for-byte identical JSON) + headlines and verdicts in the cards
node sims/<id>.mjs             # a single simulation
```
Each hypothesis was registered in `results/sims/PREREGISTRATION.jsonl` (date/time + sha256 of the code) **before** the first run; later amendments are in the same file and in the cards.

**Note on the translation:** Preregistration entries in PREREGISTRATION.jsonl predate the English translation and reference the original Portuguese ids; the code hashes in them refer to commit 4dc87c2. The translation changed only names, comments and text; every number in `results/sims/*.json` is identical to that commit (the per-cell seed keys are frozen in `sims/lib.mjs`, `FROZEN_SEED_KEYS`).

## Summary table

Strength of evidence (within the model): **A** = analytical result confirmed by Monte Carlo; **B** = MC with narrow 95% CIs and a large effect, robust across the sweeps performed; **C** = depends on chosen parameters or on a borderline criterion; **D** = not supported / inconclusive.

| Simulation | Hypothesis (summary) | Result in the model | Strength | H-xx | What needs validation with real LLMs |
|---|---|---|---|---|---|
| `sim-correlated-vote` | Error correlation imposes a ceiling on the vote; above ρ_c, 1 high-effort agent beats any N | **Supported (4/4).** Ceiling Φ(z_L/√ρ); ρ_c ≈ 0.091 for p_L=0.6 vs p_H=0.8. With ρ=0 the vote only wins from N=19 (cost 19 vs 4); with ρ ≥ 0.075 never (N ≤ 64). A φ between errors of only 0.03 already shifts the turning point from N=19 to N=49 | A | H-01, H-10, H-15 | Error correlation between samples/agents by task type; accuracy × reasoning-effort curve (β) |
| ↳ sensitivity (coordination) | Does the ~45% threshold of Kim et al. appear? | **Not reproduced by pure aggregation:** at equal budget the vote only wins with p ≥ 0.7 and low ρ, never with ρ ≥ 0.55. The vote's gain vs the same p is largest at p≈0.7–0.8 | C (exploratory) | H-17 | Whether the ~45% threshold comes from overhead/error propagation (not modelled) |
| `sim-verifier` | A high-spec verifier reduces false success below the vote and the single agent; FS grows with N | **Mixed (2 supported, 1 partial, 2 not).** sens=spec=0.95, ρ=0.3, N=9: FS 5.0% vs 35.4% (vote) vs 13.7% (single-high). FS grows with N and matches the closed-form formula (55/56). A weak verifier (spec=0.5) is worse than the vote. Failures: with ρ=0.6 and N ≥ 17 the high-effort single agent had lower FS; the verifier's advantage is not monotone in ρ | B | H-02, H-13, H-18 | Real sens/spec of tests and of LLM-as-judge; judge–generator correlation; FS of best-of-N vs N |
| `sim-response-threshold` | Response thresholds allocate without messages; beat fixed roles; beat a dispatcher with message cost/delay | **Supported (5/5).** Latency 1.46 vs 1.34 for the perfect dispatcher, with 0 messages and ~1.6 more active agents; the dispatcher only pays off if a message costs < ~0.18 agent-steps (L=0) or < ~0.07 (L=10) | B | H-06, H-16 | Real cost of orchestrator messages/context vs reading shared state; observation delay |
| `sim-stigmergy` | A trail with evaporation reduces duplication without messages; intermediate optimal ε; a trail without evaporation grows without bound | **3/4 supported.** Time ~2.5× lower and duplication 50% → 14% vs no coordination; U-shape in ε (optimum ε≈0.1); without evaporation memory grows linearly and search becomes ~30% slower. **P3 failed:** all-to-all messages (1,165–5,778 msgs/episode) were not the minimum — the recency trail tied (K=4) or won (K=16) | B | H-07, H-11 | "I have already tried X" board with TTL between LLM agents; token cost of reading vs messages |
| `sim-quorum` | Larger quorum: more accuracy with diminishing returns; shared bias creates a plateau | **Not supported (0/4); inconclusive.** The trade-off exists at scale (Q=1→50: ~18% → 96% correct, 1 → 58 steps), but the gain is **convex** (small Q = discovery lottery), not concave; shared bias drops 96% → 66% in one cell and not in another. The preregistered regime was degenerate (herding); main regime defined post hoc; 1 bug fixed | D | H-08, H-20 | Whether "stop when Q agree" is convex on real tasks; herding risk when agents read each other's answers |
| `sim-elastic` | Rule ΔP·V ≥ cost beats fixed N in cost per accepted task while keeping acceptance; transitions 1→micro→macro | **Mixed (2 supported, 1 partial, 3 not).** Net utility ≥ best fixed N at every V (V=20: 14.9 vs 12.8; acceptance 93% with 2.3 agents). **P1 failed** because the single agent has the lowest cost per accepted task by giving up on the hard ones — the isolated metric is misleading. Transitions: medium 1→micro at V≈7, →macro at V≈70; coupled is only worth attempting with V≥10. A controller that ignores ρ over-expands (cost/accepted +33% at V=20) | B (utility) / C (transitions) | H-05, H-12, H-16, H-17 | Real P(correct at attempt k+1 \| k failures); specificity of acceptance tests; does K*(V) generalise outside the calibration? |
| ↳ sensitivity (coordination) | Optimal N vs single-agent p (ρ 0.2–0.7) | Value of the 2nd agent is largest at p≈0.5 (≈ p(1−p)), compatible in shape with ~45% and with H-17; but N ≥ 2 remains optimal up to p=0.6–0.95 when there is an acceptance test | C (exploratory) | H-17 | Same as above |
| `sim-clonal` | Expand under persistent error and contract afterwards: large-pool recovery at small-pool cost | **3/5 supported.** Recovery 11.8 steps vs 12.9 for 16 fixed agents, cost 2.85 vs 16 agents/step; per-type memory −18% in time (+3% cost); slow contraction only increases cost. Failures: the idle-cost comparison with fixed-1 is misleading (fixed-1 is never idle, it is always behind); persistence filter of little use with 1-step alarms | B | H-14, H-19, H-05 | Cost of activating/deactivating agents; reliability of the error signal; parallel repairs that interfere or introduce faults |

Count of formal predictions: 33 → 19 `supported`, 2 `partially supported`, 12 `not supported` (verdicts per prediction below; details in the cards).

## Verdicts per simulation (checked by `run-all.mjs`)
- sim-correlated-vote — P1: supported; P2: supported; P3: supported; P4: supported
- sim-verifier — P1: not supported; P2: supported; P3: partially supported; P4: supported; P5: not supported
- sim-response-threshold — P1: supported; P2: supported; P3: supported; P4: supported; P5: supported
- sim-stigmergy — P1: supported; P2: supported; P3: not supported; P4: supported
- sim-quorum — P1: not supported; P2: not supported; P3: not supported; P4: not supported
- sim-elastic — P1: not supported; P2: supported; P3: partially supported; P4: not supported; P5: not supported; P6: supported
- sim-clonal — P1: supported; P2: not supported; P3: not supported; P4: supported; P5: supported

## What the seven models say together (engineering hypotheses, not conclusions about LLMs)
1. **Redundancy without new information does not scale.** Vote and quorum inherit the common error factor: the ceiling Φ(z_L/√ρ) appears in the vote and an analogous effect in the quorum with shared bias. Measuring ρ between agents is a prerequisite for choosing N.
2. **Independent information is worth more than more copies.** The verifier (generator and judge with uncorrelated errors) and the stigmergic trail add information that the vote does not have; both outperformed more agents or more messages. When the verifier shares the task's bias, the advantage shrinks.
3. **Expand under a signal, contract early.** Response threshold, elastic rule and clonal rule — three different mechanisms — arrived at the same pattern: little cost at rest, expansion only while there is a signal (backlog, test failure, persistent error), quick return to rest. In all of them, a large fixed pool bought little latency at a much higher cost.
4. **Isolated metrics mislead.** Cost per accepted task favours giving up on the hard tasks (elastic, P1); idle cost favours undersized pools that are never idle (clonal, P2). Always report the pair (cost, acceptance rate) or the net utility.
5. **False success grows with expansion.** Best-of-N and the elastic swarm increase false acceptance with N (0.7% → 4.6% in `sim-elastic`; saturation at r_w/(r_c+r_w) in `sim-verifier`). Verifiable acceptance needs high specificity, not just more attempts.
6. **Feedback that is too strong = herding.** The degenerate quorum regime (strong recruitment) decides fast and is wrong — a direct risk for LLM swarms that read each other's answers.

## Gaps and general limitations
- Abstract models; parameters chosen, not calibrated with LLM data. The effort curves p(e), sens/spec and α are assumptions.
- Binary or success/failure tasks; no real decomposition, no learning between attempts (LLM agents see earlier failures), no latency cost in the utility (except as separate metrics).
- `sim-quorum` had its main regime chosen after the 1st run and a bug fix; its results are the most fragile.
- Robustness to parameters was swept only where indicated in the cards (ρ, β, N, V, ε, θ, L, f); other choices (grid sizes, arrival rates) were not varied.
- Correspondences with the literature (Kim et al.; Kim, Garg et al.) rely on author reports; we did not reproduce those studies.

## Suggested next steps (research; nothing here authorises deployment)
- Observatory: estimate ρ and p per task with ≥ 10 independent runs of A-low (feeds H-01/H-15); measure sens/spec of visible vs hidden tests (H-02/H-13); measure P(correct at attempt k+1 | k failures) (H-05/H-12).
- Simulation: add an agent activation cost (`sim-clonal`, `sim-response-threshold`), learning between attempts and decomposition into coupled tasks (`sim-elastic`), and a quorum model with a mode switch on reaching Q.
