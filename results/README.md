# results/ — what is stored here

| Folder | What | Cost (ledger, counted ×1.5) | Site |
|---|---|---:|---|
| `sims/` | Seed-deterministic simulations (abstract agents) | — | Experiments → Simulations |
| `observatory/` | Observatory pilot, calibration and bio-smoke runs (first benchmark phases) | US$ 18.8 | Experiments → Observatory |
| `lab001/` | LAB-001: 15 agent structures, bio-inspired mechanisms vs artificial structures | US$ 24.7 | card `obs-lab001-bio-vs-artificial` |
| `lab002/` | LAB-002: controller + threads demonstration | US$ 3.6 | card `obs-lab002-controller-threads` |
| `lab003/` | LAB-003: when splitting pays, retry or recruit, type memory (+ Step 0 calibration) | US$ 14.7 | card `obs-lab003-split-retry-memory` |
| `lab004/` | LAB-004: massive swarm, 1,000 real agents + calibrated simulation | US$ 9.9 | card `obs-lab004-massive-swarm` |
| `charts/` | Flat chart-ready tables for the site, exported from the files above | — | charts inside the cards |
| `triage/` | Funnel of studies by realm (seen / unseen / beyond), keyword and machine-field based | — | not on the site |

## Inside a lab folder
- `REPORT.md`, `PREREG*.md`, `CALIBRATION.md` — cards on the site (frontmatter); the pre-registration was written before the runs it governs, amendments are appended and dated.
- `summary*.json`, `calibration-*.json`, `sim-*.json`, `curves.*` — computed summaries.
- `runs-*.jsonl` — one record per run (outcome, cost, calls, latency); `ledger.jsonl` (LAB-004: `ledger.jsonl.gz`, 82,545 calls) — one record per model call (tokens, provider-reported cost, counted cost).
- `raw.tar.gz` — model outputs and final files per run (the uncompressed `raw/` folder is ignored by git); `void.tar.gz` (LAB-001) — attempts voided because of a harness bug, kept for the record.

## Regenerate
- Chart tables: `node observatory/export-charts.mjs` (writes `results/charts/*.json`).
- Task sets (not stored, large and deterministic): `node observatory/lab/build-tasks.mjs && node observatory/lab/validate.mjs` (LAB-001/2), `node observatory/lab003/build3.mjs packages` then the composers inside `cal.mjs`, `cal2.mjs` and `q*.mjs` (LAB-003), `node observatory/lab004/tasks.mjs validate` (LAB-004).
- Site: `node site/build.mjs` (cards for the labs appear under Experiments → Observatory; build output goes to `site/dist/`, deployment is described in `site/DEPLOY.md`).

## Notes
Costs come from provider-reported usage times a price table, not from an invoice. Every report states its own limits; micro-task and benchmark results do not transfer by themselves to real code work.
