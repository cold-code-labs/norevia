---
id: obs-lab002-prereg
title: "LAB-002 — Pre-registration and amendments"
area: observatory
evidence: hypothesis
tags: [lab-002, preregistration, observatory]
related: [obs-lab002-controller-threads]
updated: 2026-11-08
summary: "Claim, requests, arms, matched ceilings and decision rules for the controller-and-threads demonstration, plus two amendments."
---
# LAB-002 — Controller + threads demonstration (pre-registration, 2026-11-08, before the main run)

Owner: Norevia Lab. Requested by the user. **Budget: US$ 5 hard cap** (approved by the user), own ledger `ledger.jsonl`, enforced in `api.mjs`: every call reserves its worst case; the cap counts cost × 1.5 safety (price table US$ 0.10/M input, US$ 0.50/M output from litellm, not checked against an invoice). Model route: Anthropic Messages API (API key from a local secret store), model `claude-haiku-5-5`, default sampling (this model accepts only temperature 1). Smoke tests before this file: Q1 and (LP1, LP2, R-lm04), ≈ US$ 0.09 counted (`runs-smoke*.jsonl`); they showed the pipeline works and informed no threshold below.

## Claim being demonstrated (small and isolated)
A single point of contact (the **controller**) keeps the main conversation free: every request is acknowledged at once and runs as a **thread**; a thread starts individually and **unfolds** into child threads only past a threshold (work exceeds one context, or independent parts fail their visible checks); finished threads leave **memory** (playbook of house standards) for later threads of the same kind. The demo asks whether this policy beats "always unfold" and "no controller" on cost per accepted request, without losing acceptance, and whether it keeps the conversation responsive.

## Requests (7, fixed; `requests.mjs`)
Q1 (short Portuguese answer, programmatic checks); LP1 and LP2 (single-file landing pages, 6 visible checks given as feedback + 6 hidden checks; the house standards `cta` and `self-contained` are NOT in the brief and are revealed only by a failed visible check; LP2 is submitted when LP1 finishes); four repair requests from LAB-001 (R-lm03, R-lm04: 4 packages, below the unfold threshold; R-lx10, R-lx11: 8–9 packages, above it). Repair acceptance = every hidden test passes; visible = probe tests. A request is *accepted* only if all visible and hidden checks pass; *false success* = visible pass, hidden fail.

## Arms
- **CTRL**: controller, individual first; unfold when whole-request prompt > 150k chars (up front, one child thread per package with package-only context) or when probe checks fail (failing packages, ≤ 2 rounds); after any unfold, one probe-silent patrol review per package; text requests: one repair from visible checks, never unfold; **playbook memory on**.
- **CTRL-NOMEM**: same, memory off (isolates the memory effect).
- **ALWAYS**: controller; every request unfolds up front (repo: package owners + repairs + patrol; text: planner → 3 workers → merger, one repair). No memory.
- **SOLO-SEQ**: no controller; one agent handles the 7 requests one after another (repo: whole repo, ≤ 2 probe repairs; text: one call + one repair); the conversation is blocked until each finishes.
Unfolding is **rule-based** (threshold), not chosen by the model; the demo does not test model-decided delegation. Matched ceilings per request, identical for every arm: repo US$ 0.03 + 0.00006 × LOC and 2k+4 calls; text US$ 0.06 and 8 calls.

## Outcomes and rules (fixed now)
1. **Primary**: cost per accepted request across the 7 requests (paired by request and repetition), with acceptance rate; bootstrap over (request, rep) units, seeded. **CTRL vs ALWAYS: "works better" iff** acceptance of CTRL is not lower by more than 0.10 (absolute) and cost per accepted ≤ 0.80× ALWAYS. Same rule CTRL vs SOLO-SEQ (cost comparisons also reported per request type). Otherwise INCONCLUSIVE or WORSE as defined in LAB-001.
2. **Responsiveness**: max acknowledgement latency and time during which the main conversation is blocked (controller arms ack in-process; SOLO-SEQ: blocked for the whole wall time). Success: ack ≤ 1 s and blocked time 0 s for controller arms; wall time of the whole batch reported.
3. **Memory** (descriptive): LP2 under CTRL vs CTRL-NOMEM: first-pass visible failures, calls, cost.
4. **Unfold discipline** (descriptive): share of requests that unfolded under CTRL (expected: only the two lx requests, plus repairs for failing small repos) versus ALWAYS (all).
Repetitions: rep-by-rep in this order until the counted ledger reaches US$ 4.3 or 3 reps are done; only complete reps (all arms) are analyzed. All runs are kept; no run is repeated except infrastructure errors.

## Limits (anticipated)
Seven requests, ≤ 3 repetitions, one small model, rule-based unfolding, programmatic checks as the acceptance proxy (not human quality), LP standards invented for the demo, cost from a price table. Demonstrates the mechanism and gives a first estimate; it does not establish a general law.

---
## Amendment 1 (after repetition 1, before repetition 2)
- **Instrument bug.** The hidden check `no-placeholder` used `/TODO/i`, which also matches the Portuguese word "todo" ("todo o projeto") and rejected correct landing pages in every arm. Fixed to a case-sensitive `\bTODO\b`. Repetition 1 text outputs were re-scored offline from the saved outputs (`rescore.mjs`, no model calls, original verdicts kept in `originalFailed`); behaviour of the agents was unaffected because hidden checks are never shown to them.
- **Harness contention.** In repetition 1 the four arms shared one API concurrency limit of 10, so queueing inflated wall times of small requests (e.g. Q1 under CTRL waited behind child threads). Repetition 2 uses a limit of 24; wall-clock comparisons across arms are therefore indicative only, and cost, calls and acceptance are the reliable metrics.
- **Reps.** Repetition 1 cost US$ 1.69 counted; repetition 2 is run; a third repetition would exceed the 4.3 stop line and is not run.

## Amendment 2 (after repetition 2; exploratory, separate phase `mem2`)
- **Memory defect.** In the main run the playbook was one list for all request types; the Q1 rule "at most 700 characters" leaked into the LP2 prompt (CTRL arm) and produced short pages missing the footer and sections (LP2 failed in 2/2 CTRL reps). The memory result of the main run is therefore **not a valid test of memory**; it is kept as reported.
- **Fix** (`controller.mjs`): playbook keyed by request type. **Exploratory re-test** (phase `mem2`, requests LP1+LP2 only, 4 repetitions, arms CTRL = memory on and CTRL-NOMEM = off). Expected cost < US$ 0.2. Reading rule fixed now: memory "helps" if LP2 under CTRL has fewer first-pass visible failures and equal-or-higher acceptance than NOMEM in the pooled 4 reps; n is tiny, so the result is descriptive.
