---
id: H-index
title: Official Norevia hypothesis registry
area: hypothesis
evidence: hypothesis
tags: [registry, hypotheses, collective-efficiency-law]
sources:
  - "research/theory/MODEL.md (th-model)"
related: [th-model, H-01, H-02, H-03, H-04, H-05, H-06, H-07, H-08, H-09, H-10, H-11, H-12, H-13, H-14, H-15, H-16, H-17, H-18, H-19, H-20, H-21, H-22, H-23, H-24, H-25, H-26, H-27]
updated: 2026-11-07
summary: Official registry of Norevia's falsifiable hypotheses about when 1 agent, a micro-swarm or a macro-swarm is the most efficient choice.
---

# Official hypothesis registry (H-index)

Maintained by the theory agent. Each card contains a statement, variables, prediction, refutation conditions, proposed experiment, status and origin.
Reference model: [`research/theory/MODEL.md`](../research/theory/MODEL.md) (`th-model`).

**Possible statuses:** `open` (no test), `testing` (experiment in progress), `preliminary-support` / `preliminary-refuted` (initial result, scope declared in the card).
**Caution:** "preliminary-support" here means support **within a simulated model** (`sims/`, level `local-validation` in the model) and/or author reports — **no hypothesis has been tested on a real LLM with conclusive data** as of 2026-11-07. The observatory has completed smoke and pilot runs (no conclusive data).

Count: preliminary-support: 4 · testing: 6 · open: 17 · total: 27.

| id | short statement | status | experiment |
|---|---|---|---|
| [H-01](H-01-correlation-caps-voting.md) | Correlation ρ caps the vote: accuracy saturates at 1−I½(a,b) < 1 | `preliminary-support` | sims/sim-correlated-vote (done, in the model) + observatory B-vote3/B-vote5 with repetitions of A-low per task to estimate ρ |
| [H-02](H-02-verifier-dominant-factor.md) | Verifier specificity (f) weighs more than N; ceiling = precision π | `preliminary-support` | sims/sim-verifier (done, in the model) + observatory A-low-loop/C-elastic with verifier = visible tests, acceptance = hidden tests |
| [H-03](H-03-high-effort-beats-coupled.md) | Coupling χ > χ* ≈ 2ι/(kμ): A-high beats C-decompose | `testing` | observatory A-high vs C-decompose on b* tasks with coupled bugs (vary χ) |
| [H-04](H-04-micro-swarm-decomposable.md) | k = 2–3, χ ≈ 0: micro-swarm ≥ A-high in acceptance at ≤ cost; macro adds nothing | `testing` | observatory C-decompose (N = k) and B-pipeline (executor + verifier) vs A-high and vs N > k on independent b* tasks |
| [H-05](H-05-elasticity-marginal-gain.md) | Elastic (stop at the 1st acceptance / marginal gain < cost) < fixed in cost per success | `testing` | observatory C-elastic vs B-vote5 / fixed best-of-N; difficulty-mixture sims |
| [H-06](H-06-response-threshold-activation.md) | Activating agents by T_θ(s) = s²/(s²+θ²) over uncertainty reduces agents/task by ≥ 40% vs fixed N | `testing` | sims/sim-response-threshold (proposed) + variant of observatory C-elastic with stimulus = visible-test failure and/or disagreement between the first 2 samples (see H-18) |
| [H-07](H-07-stigmergy-evaporation.md) | Shared board with decay λ: messages O(N) vs O(N²); stale weight h/(h+λ) | `preliminary-support` | sims/sim-stigmergy (proposed: environment that changes at rate h) + observatory with a state board vs direct messages |
| [H-08](H-08-quorum-speed-accuracy.md) | Quorum Q: accuracy ↑ and votes ↑ with Q; under ρ the gain saturates at the vote ceiling | `testing` | sims/sim-quorum (proposed) + observatory with quorum stopping Q ∈ {1,2,3,5} |
| [H-09](H-09-effort-knee.md) | Splitting E into N wins ⇔ E/N above e_knee = h(β−1)^{1/β} | `open` | observatory A-low/A-mid/A-high per task class (fit p(e)) + comparison 1×E vs N×E/N |
| [H-10](H-10-vote-non-monotone-difficulty.md) | Items with p < ½ get worse with N; aggregate accuracy has an interior maximum | `open` | observatory B-vote with N ∈ {1,3,5,9,15} on a set with easy and hard tasks; sims |
| [H-11](H-11-usl-coordination.md) | Useful output × N follows the USL (σ, κ > 0); the full topology has a larger κ | `open` | observatory: sweep N ∈ {1,2,3,5,8} on a decomposable task with star / board / all-to-all topologies; fit USL |
| [H-12](H-12-miscalibrated-sequential-stopping.md) | i.i.d. SPRT/early stop: realized error ≫ nominal α when ρ > 0 | `open` | sims (already reproducible in model.mjs: sprt_correlation) + observatory with stopping by vote margin |
| [H-13](H-13-false-success-grows-with-N.md) | P_false ↑ with N; precision of the accepted constant (iid) or ↓ (ρ > 0) | `preliminary-support` | observatory best-of-N with visible tests as verifier and hidden tests as acceptance; sims/sim-verifier (done) |
| [H-14](H-14-bounded-repair.md) | q_j decays (δ < 1): stop at R* = 1 + ⌊ln((c+gL)/(V q1))/ln δ⌋ | `open` | observatory A-low-loop with variable cap R ∈ {1,2,4,8}; measure q_j per attempt |
| [H-15](H-15-diversity-beats-N.md) | Δρ 0.3 → 0.1 at N = 5 > increasing N from 5 → 21 at ρ = 0.3 | `open` | observatory homogeneous vs heterogeneous B-vote5 (different prompts/approaches/models) vs B-vote with larger N |
| [H-16](H-16-triage-does-not-pay-for-orchestration.md) | "Oi" [Hi] does not pay for orchestration: a controller is worth it if c_ctrl < Σ w_j·(avoided cost_j) | `testing` | observatory: adaptive controller vs A-low and vs C-elastic on a mixture with a variable fraction of trivial tasks |
| [H-17](H-17-capability-threshold-by-mechanism.md) | Peak of the cooperation gain: p* = (1−f)/(2(s−f)) ≈ 0.5 (verified selection) vs ≈ 0.79 (vote) | `open` | observatory: stratify tasks by the single agent's p̂; measure the gain of A-low-loop/C-elastic (selection by tests) and of B-vote3 vs p̂ |
| [H-18](H-18-consensus-measures-safety-not-need.md) | Fraction of unanimous errors E[(1−P)^N]/(1−A_N) grows with ρ: disagreement does not detect need | `open` | observatory: compare controllers with stimulus = disagreement vs stimulus = visible-test/verifier failure; measure the fraction of unanimous errors |
| [H-19](H-19-memory-beats-agents.md) | Raising p via validated memory > increasing N (under ρ > 0) | `open` | observatory: A-low with memory of accepted solutions (dev tasks) vs B-vote5 without memory, on held-out tasks |
| [H-20](H-20-quality-proportional-allocation.md) | Honeybee-dance-style recruitment: more budget for candidates with more tests passing | `open` | observatory: uniform best-of-N vs refinement of the candidates with the largest fraction of visible tests passing (exploration floor) |
| [H-21](H-21-acceptance-coupled-launch.md) | x_{t+1} = ε + g·a·x_t: contracts iff g·a < 1; window 1/(ps) < g < 1/f | `open` | sims (flow of feasible/infeasible subtasks, rule x_{t+1} = ε + g·acceptances) + observatory on a task flow with an infeasible part |
| [H-22](H-22-fixed-topological-neighborhood.md) | k* (3 pp from the full read) saturates in N only if ρ > 0: ρ = 0.3 → k* = 2–4 | `open` | observatory: aggregation with N ∈ {6, 12, 24} and reading k ∈ {2, 4, 6, N−1} peers; sims with controlled ρ |
| [H-23](H-23-sparse-activation.md) | k = 3 of 12 within ≤ 2–3 pp of dense requires a router with per-slot accuracy r ≳ 0.9 | `open` | observatory: 12 specialists (distinct prompts/tools) with a cheap router vs dense activation, same verifier |
| [H-24](H-24-critical-generation-cleanup-ratio.md) | Branching: m_ef = m(1−d) ≥ 1 ⇒ backlog diverges; critical cleanup d* = 1 − 1/m | `open` | sims (jobs that spawn children with mean m; with/without transitive cancellation and deduplication) + audit of observatory traces (children per job) |
| [H-25](H-25-router-evaporation.md) | t90 without decay = 9·T0 vs ln 0.1/ln(1−λ) with EWMA (λ = 0.1 → 22) | `open` | sims (router across configurations with an abrupt distribution change) + observatory switching the task mixture mid-flow |
| [H-26](H-26-idle-reserve.md) | M/M/c: load 3.6 with c = 4 → W_q ≈ 1.97; +1 reserve → 0.29; a 4.5 burst requires a reserve | `open` | queue sims with bursts and injected failures; observatory only in an isolated environment (no production) |
| [H-27](H-27-verifiable-cross-inhibition.md) | Symmetric impasse takes m² rounds; counterexample with prob. v/round: m = 5 → 25 → 12.3 (v = 0.05) | `open` | observatory: aggregation by rounds of support vs support + elimination by an executable counterexample (a failing test) |

## Mandatory hypotheses from the briefing → cards
- Correlation limiting the vote gain → H-01 (and H-10, H-15)
- Verifier as the dominant factor → H-02 (and H-13)
- High effort of 1 agent wins on coupled tasks → H-03 (and H-09)
- Micro-swarm (2–3) wins on decomposable tasks → H-04
- Elasticity by marginal gain beats fixed size → H-05 (and H-12, H-14)
- Response threshold (insects) for adaptive activation → H-06 (and H-16)
- Stigmergy/evaporation reduces communication → H-07 (and H-11)
- Quorum (speed-accuracy) → H-08

## Candidates integrated from other areas
- `lit-synthesis` §5: candidate 1 → H-01, H-17; candidate 2 → H-02, H-09; candidate 3 → H-03, H-04; candidate 4 → H-18; candidate 5 (cascade) → H-05, H-16; candidate 6 (memory) → H-19.
- `nat-*`: nat-response-threshold → H-06; nat-stigmergy, nat-pheromone-evaporation-aco → H-07; nat-quorum-nest-bees, nat-speed-accuracy-quorum, nat-stop-signal-cross-inhibition → H-08; nat-colony-size-scaling → H-11; nat-interaction-rate-foraging → H-05; nat-waggle-dance-recruitment, nat-recruitment-benefit-conditions → H-20.
- `nat-candidates` (research/nature/CANDIDATES.md) → registry: C01 → H-01 (with a competing prediction: the model disagrees with "≥ 90% of the gain with N ≤ 1/ρ"); C02 → H-10; C03 → H-08; C04 → H-06 (AUC condition; see H-18); C05 → H-15 (a) and H-20 (b); C06 → **H-21**; C07 → **H-22** (the model predicts k* independent of N only with ρ > 0); C08 → **H-23** (requires a router with r ≳ 0.94); C09 → **H-24**; C10 → **H-25**. Extras: nat-inactive-reserve → **H-26**; nat-stop-signal-cross-inhibition → **H-27** (and H-08).
- Formalization of the candidates: th-model §11 and `research/theory/curves/nature_candidates.json`.
- `nat-small-groups-correlated-cues` (Kao & Couzin 2014) → H-04, H-10; nat-clonal-expansion-contraction → H-05; nat-wound-healing-resolution → H-14; nat-reflex-vs-cortex → H-16.
- Simulation results used: `sim-correlated-vote` (H-01, H-09), `sim-verifier` (H-02, H-13). Later simulations: `sim-stigmergy` (H-07 → preliminary-support in the model), `sim-response-threshold` (H-06 → testing: mechanism supported in a queue model), `sim-elastic` (H-05 → testing: utility yes, cost per acceptance no), `sim-quorum` (H-08 → testing: scope restricted to the race between candidates already sampled), `sim-clonal` (indirect support for H-19). Observatory: smoke + pilot (45 runs, 100% acceptance in all architectures — ceiling effect; only H-16 moves to `testing`). **Recommendation to the observatory:** according to the model, only tasks with p̂(A-low) between ~0.2 and ~0.8 discriminate between architectures (H-17).

**Baseline:** Kim et al. (arXiv:2512.08296v3, `lit-scaling-agent-systems`) already propose a predictive scaling law for agent systems; the hypotheses here seek to refine it by mechanism (H-17, H-18, H-03/H-04) and claim no novelty over it.

## Update rules
- A status change requires an artifact (a file in `results/`) and a scope (simulated model vs real LLM).
- Author results (`lit-*`) do not change status on their own.
- New hypotheses get the next free number; refuted hypotheses remain in the registry.
