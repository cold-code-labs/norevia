# Norevia — feature-flag registry of bio-inspired mechanisms (v1, 2026-11-09)

One row per mechanism card in `research/nature/` (56). Each row turns the card's *engineering analogue* into a runtime **flag** for an agent swarm/controller: the **signal** it reads, the **action** it takes, linked **hypotheses**, and its **status** from local tests.
Owner: Norevia (lead). Experiments that change a status belong to Norevia Lab. Every flag must be tested at matched budget against the best non-bio baseline, one flag at a time.

**Status legend**
- `positive-eng` — helped in an LLM test, but an equivalent non-bio engineering control explains it (no bio-specific effect shown).
- `null-llm` — tested with LLM agents, no gain over baselines.
- `sim-support` — preliminary support only in abstract simulations (`sims/`).
- `untested` — mapped, never run.
- `lens` — diagnostic/analysis idea, not a runtime flag.

Sources of status: `results/sims/`, `results/observatory/biosmoke-summary.md`, `results/lab001/REPORT.md`, `results/lab002/REPORT.md`, `results/lab003/REPORT.md`.

## Activation, recruitment and scaling
| Flag | Card | Signal | Runtime action | Hyp. | Status |
|---|---|---|---|---|---|
| `response_threshold` | nat-response-threshold | failing-probe fraction vs per-agent threshold | recruit agents whose threshold is below the stimulus; habituate on no gain | H-06 | `positive-eng` — LAB-001 gain = re-review; LAB-003 Q2 retry = recruit |
| `inactive_reserve` | nat-inactive-reserve | failure, saturated context, rate limit | wake cold agents only on demand | H-06, H-26 | `null-llm` — TEAM-GATE never needed reserve (F2, LAB-001) |
| `reflex_cortex_tiers` | nat-reflex-vs-cortex | request class / check result | tier 1 code check → tier 2 cheap model → tier 3 strong model | H-06, H-16 | `untested` as tiers (LAB-002 controller partial, primary inconclusive) |
| `adaptive_activation` | nat-reflex-vs-cortex, nat-inactive-reserve | first attempt fails probe | individual first, team on demand | H-16 | `null-llm` — never activated (F2), no gain (LAB-001) |
| `split_by_size` (division of labour) | nat-colony-size-scaling, nat-teams-not-swarms | number of independent packages | single owner per package with package-only context when k ≥ ~3 | H-11, H-04 | `positive-eng` — LAB-003 Q1: team cost/accepted 0.64× at k=3, 0.37× at k=8, only team succeeds at k=15 |
| `group_threshold_payoff` | nat-myxococcus-group-predation | task needs several tools/perspectives at once | form the group only above the minimum useful size | — | `untested` |
| `relay_recruit_selflimit` | nat-neutrophil-swarming | local "problem found" signal | nearby agents join and re-emit; recruitment stops by self-limit | — | `untested` |
| `acceptance_coupled_launch` | nat-interaction-rate-foraging | recent rate of accepted results | launch new attempts proportionally to acceptance rate | H-05, H-21 | `untested` |
| `proportional_allocation` | nat-waggle-dance-recruitment, nat-recruitment-benefit-conditions | verified partial-quality score | expand candidates in proportion to quality | H-20 | `untested` |
| `root_foraging` | nat-root-foraging | local reward on a branch | add budget to a branch only after reward, in proportion | — | `untested` |
| `sparse_activation` | nat-brain-energy-sparse | router score per specialist | k ≪ N specialists active per task | H-23 | `sim-support` (router must be near-perfect) |
| `clonal_expansion` | nat-clonal-expansion-contraction | verified problem appears / resolved | clone the configuration that solved similar work; contract after | H-05, H-19, H-21, H-24 | `null-llm` — ELASTIC no gain (LAB-001); type memory no gain (LAB-003 Q3) |
| `homeostatic_escalation` | nat-homeostasis-allostasis | failed check | retry cheaply, then more effort/agents | — | `positive-eng` — retry with feedback works (LAB-003 Q2) |
| `quorum_sensing_activation` | nat-bacterial-quorum-sensing | density of standard "blocker" signals in a shared medium | trigger the costly collective action only above a signal density | — | `untested` |
| `dicty_aggregation` | nat-dictyostelium-aggregation | weak signals crossing a threshold | form a temporary collective with entry and cheater rules | — | `untested` |

## Coordination and communication
| Flag | Card | Signal | Runtime action | Hyp. | Status |
|---|---|---|---|---|---|
| `stigmergy_board` | nat-stigmergy | shared artifact state (code, tests, board) | coordinate through the artifact, no peer messages | H-07 | `sim-support`; `null-llm` (biosmoke inactive; LAB-001 no gain); simple board helped team cost in F2 together with other levers; LAB-004 (630 micro-tasks, N ≤ 1,000): `positive-eng` — vs independent agents +0.07 coverage and 1.19× accepted/US$ at N = 300; a central dispatcher with global state matches it (Δ coverage +0.009); saturated at N = 1,000 (`results/lab004/REPORT.md`) |
| `pheromone_evaporation` | nat-pheromone-evaporation-aco | accepted results per route | reinforce routes/configs with acceptance, decay the rest | H-07, H-25 | `sim-support`; `null-llm` — evaporation ablation no difference (LAB-001) |
| `physarum_edges` / `cosmic_web` | nat-physarum-network, nat-cosmic-web-physarum | useful information flow per edge | strengthen who-reads-whom edges that carried useful flow; decay others | H-22, H-25 | `untested` |
| `topological_neighbours` | nat-topological-neighbors | — (fixed graph) | each agent reads k fixed peers, not all N | H-22 | `sim-support` (only when errors are similar) |
| `locust_phase_switch` | nat-locust-marching-transition, nat-vicsek-phase-transition | local density of agents on the same subtask | solitary (independent, diverse) below threshold → gregarious (align, shared plan) above; hysteresis; flip direction on failure signal | — | `null-llm` — LAB-004: no gain over the board it extends or over coverage-matched baselines up to N = 1,000 (Δ coverage −0.012…+0.013, accepted/US$ ×0.93–0.98); gregarious share ≈ 0.4 is set by the failure-flip rule, no density transition seen; revising a failed candidate fixes only 6% (`results/lab004/REPORT.md`) |
| `scale_free_correlation` | nat-scale-free-correlation | spread of a finding across agents | propagate verified findings fast; damp unverified ones | — | `untested` |
| `informed_leaders` | nat-informed-leaders | agent holds verifiable evidence (ran the test, has the tool) | weight informed agents over aggregators | H-10 | `null-llm` — LAB-004: weighting verified candidates (1 vs 0.25) over plain voting: Δ coverage +0.008 (−0.002…+0.019), accepted/US$ ×1.02, false success unchanged (0.59 vs 0.60); wrong answers agree with each other (0.4–0.55), which limits voting (`results/lab004/REPORT.md`) |
| `independent_then_aggregate` | nat-galton-vox-populi, nat-diversity-prediction | numeric/score outputs | collect independently, aggregate by robust mean/median, debate only after | — | `untested` (voting arm is a baseline) |
| `firefly_sync` | nat-firefly-synchrony | shared heartbeat/time slots | act in common windows so anomalies stand out | — | `untested` |
| `circadian_cadence` | nat-circadian-cadence | clock | separate timescales per function under one reference clock | — | `untested` |
| `orbital_resonance` | nat-orbital-resonance | routine periods | choose (in)commensurable periods to phase or avoid collisions | — | `untested` |
| `lagrange_handoff` | nat-lagrange-points | handoff between two specialists | regulate unstable symmetric interfaces with an explicit contract | — | `untested` |
| `v_formation_rotation` / `penguin_rotation` | nat-v-formation-flight, nat-penguin-huddle | load on the costly position | rotate the expensive role on a schedule | — | `untested` |
| `living_bridges` | nat-army-ant-living-bridges | work saved vs workers withdrawn | keep an intermediate artifact/coordinator only while it pays | — | `untested` |
| `microtubule_provisional` | nat-microtubule-dynamic-instability | demand change | keep provisional capacity that grows/shrinks quickly | — | `untested` |

## Decision, voting and stopping
| Flag | Card | Signal | Runtime action | Hyp. | Status |
|---|---|---|---|---|---|
| `quorum_stop` | nat-quorum-nest-bees, nat-speed-accuracy-quorum | k independent verified agreements | stop at quorum; tune k by cost of delay vs error | H-08 | `null-llm` (LAB-001); quorum amplified false success under weak verifier (biosmoke); sims inconclusive; LAB-004 (N ≤ 1,000): `null-llm` — worse than the board at N = 300 (Δ coverage −0.07), no detectable gain at N = 1,000; false success not detectably lower (0.22 vs 0.25) (`results/lab004/REPORT.md`) |
| `cross_inhibition` | nat-stop-signal-cross-inhibition | counterexample / failing test against an option | reduce the rival option's weight | H-08, H-27 | `null-llm` (bundled in quorum, LAB-001) |
| `correlation_stop` | nat-condorcet-correlated, nat-small-groups-correlated-cues | estimated error correlation ρ between agents | stop adding voters when effective n saturates | H-01, H-04, H-10 | `sim-support` |
| `condorcet_ceiling` | nat-condorcet-jury | marginal gain per vote | cap the number of votes | — | `lens` |
| `diversity_check` | nat-hong-page-critique | identical model/prompt/temperature | treat N identical copies as one agent; require real diversity | — | `lens` |
| `ecoli_run_tumble` | nat-ecoli-run-and-tumble | last few evaluations improving or not | keep direction while improving, change approach when not | — | `null-llm` — LAB-004: worse than independent agents at N = 300 (Δ coverage −0.07, accepted/US$ ×0.70), no detectable difference at N = 1,000 (`results/lab004/REPORT.md`) |

## Regulation, safety and repair
| Flag | Card | Signal | Runtime action | Hyp. | Status |
|---|---|---|---|---|---|
| `danger_signal_escalation` | nat-danger-theory | confirmed damage (regression, failed acceptance) | escalate only on damage, not on novelty | — | `untested` |
| `wound_resolution` | nat-wound-healing-resolution | incident resolved | active shutdown: stop extra agents, cancel waits, consolidate evidence | H-14, H-24 | `positive-eng` — LAB-004: at N = 1,000 accepted/US$ ×1.43 (1.37–1.49) vs the board with equal coverage, nothing at N ≤ 300; an uncapped central dispatcher that stops when tasks are resolved saves more (cost control, not a bio-specific effect) (`results/lab004/REPORT.md`) |
| `kessler_guard` | nat-kessler-cascade | orphaned work generating more work | cap and reap ownerless tasks/delegations | H-24 | `untested` (shadow L3 rules related, F3) |
| `predator_prey_damping` | nat-predator-prey-cycles | backlog vs idleness | elastic spawn/retire with damping to avoid oscillation | — | `untested` |
| `stellar_backpressure` | nat-stellar-thermostat | load | reduce admission/concurrency before degrading | — | `untested` |
| `shepherd_guards` | nat-shepherd-moons | boundary violations | a few gatekeeper agents (rate limits, schema checks) hold the crowd | — | `untested` |
| `renal_compaction` | nat-renal-filtration | context growth | discard transient context by default, reabsorb only functional items | — | `null-llm` — LAB-004: no gain over a stateless agent (accepted/US$ ×1.00, Δ coverage +0.016); cuts cost 27% vs carrying the full history, which raised coverage ≈ +0.04 but also false success (0.40 vs 0.34) (`results/lab004/REPORT.md`) |
| `cluster_dissolution` | nat-open-cluster-dissolution | group age/size/crowding | every group has an explicit dissolve stage | — | `untested` |
| `satellite_avoidance` | nat-satellite-constellation-avoidance | predicted conflict between agents on the same resource | coordinate manoeuvres to avoid collisions | — | `untested` |
| `accretion_threshold` | nat-accretion-planetesimals | aggregation stalls | switch from pairwise merging to a collective step past a density threshold | — | `lens` |

## Summary (v1)
- 56 cards → 43 flags (some cards share a flag) + 3 lenses (46 rows).
- **Tested with LLM agents: 10 flags.** Positive only as engineering (no bio-specific effect): `split_by_size`, `homeostatic_escalation`, `response_threshold`. Null: `inactive_reserve`, `adaptive_activation`, `clonal_expansion`, `stigmergy_board`, `pheromone_evaporation`, `quorum_stop`, `cross_inhibition`.
- **Simulation-only support: 3 flags** (`correlation_stop`, `sparse_activation`, `topological_neighbours`); `stigmergy_board` and `pheromone_evaporation` also had simulation support but were null with LLM agents.
- **Untested: 30 flags.** Suggested next batch (cheap, high information): `locust_phase_switch`, `renal_compaction`, `ecoli_run_tumble`, `informed_leaders`, `wound_resolution`.
- Gap: the registry covers only mechanisms with a nature card; new candidates enter by adding a card first.
