---
id: H-24
title: "Without active cleanup, subtask generation has a critical threshold above which the backlog explodes"
area: hypothesis
evidence: hypothesis
status: open
origin: "nature (nat-candidates C09; nat-kessler-cascade; nat-wound-healing-resolution) + theory (th-model §11; Galton–Watson process, Harris 1963)"
experiment: "sims (jobs that spawn children with mean m; with/without transitive cancellation and deduplication) + audit of observatory traces (children per job)"
tags: [contraction, orphan-work, bounded-healing, kessler]
sources:
  - "Harris, T. E. (1963). The Theory of Branching Processes. Springer. doi:10.1007/978-3-642-51866-9"
  - "research/theory/MODEL.md (th-model) and research/theory/model.mjs"
related: [th-model, nat-candidates, nat-kessler-cascade, nat-wound-healing-resolution, nat-clonal-expansion-contraction, sim-clonal, H-14, H-21]
updated: 2026-11-07
summary: "If each task spawns one or more subtasks on average and nothing cancels or deduplicates them, pending work grows without end; the model gives the minimum cleanup fraction that keeps the system stable."
---

# H-24 — Without active cleanup, subtask generation has a critical threshold above which the backlog explodes

**Status:** `open` · **Card evidence level:** `hypothesis` · **Origin:** nature (nat-candidates C09; nat-kessler-cascade; nat-wound-healing-resolution) + theory (th-model §11; Galton–Watson process, Harris 1963)

## Statement
In a system in which each job spawns m children on average and a fraction d of them is cancelled/deduplicated/depth-limited, the total work per root job is 1/(1 − m(1−d)) if m(1−d) < 1 and diverges otherwise. There is an abrupt transition at m_ef = 1 (not gradual), and d* = 1 − 1/m.

## Variables
m (children per job), d (cleanup), arrival rate, maximum depth.

## Prediction (quantitative/directional)
- m = 0.9 without cleanup: 10 jobs per root; m = 1.5: diverges; with d = 0.3 → m_ef = 1.05 (still diverges); d* = 33%.
- The backlog keeps growing after arrivals stop iff m_ef ≥ 1.
- Measured in traces: m̂ per task type and d̂; predict explosion/stability before running.

Model numbers: `research/theory/model.mjs` → `research/theory/curves/*.json` (illustrative parameters, not measured on an LLM).

## Refutation conditions
Gradual growth without a threshold around m_ef = 1; or stability with a measured m̂_ef > 1.

## Proposed experiment
Branching simulation with cancellation; in real traces, count subtasks spawned and cancelled per job (without changing production).

## Current evidence
Model only (progeny 1/(1−m) checked by MC). Physical (Kessler cascade) and biological (active resolution) analogy, without proof for LLMs.

## Limits
Assumes independent and identically distributed children; queues with a hard limit truncate the explosion (the cost becomes waiting/abandonment).
