---
id: obs-lab002-controller-threads
title: "LAB-002 — Controller and threads, a small isolated demonstration"
area: observatory
evidence: local-validation
tags: [lab-002, controller, threads, observatory, haiku-5-5]
related: [H-06, H-16, obs-lab002-prereg]
updated: 2026-11-08
summary: "A single point of contact that acknowledges at once and runs each request as a thread, unfolding only past a threshold, with request-type memory. The conversation stayed free (0 s blocked against 1,479 to 1,860 s without a controller); the primary cost outcome was inconclusive."
data: [results/charts/lab002-by-arm.json, results/charts/lab002-responsiveness.json, results/charts/lab002-by-request-type.json]
---
# LAB-002 — Controller + threads, small isolated demonstration (report)

> **Charts on this page, in order.** By policy: 1 accepted requests of 14, 2 false success, 3 total cost; conversation responsiveness: 4 seconds the conversation was blocked, 5 wall time of the 7-request batch; by request type: 6 cost per request, 7 calls per request (series are the four policies). Raw runs, timelines and ledger are in `results/lab002/`.

Norevia Lab · 2026-11-08 · Claude Haiku 5.5 through the Anthropic Messages API (API key from a local secret store) · ledger **US$ 3.59 counted of the US$ 5 cap** (≈ US$ 2.4 at the price table; counted = cost × 1.5 safety; `ledger.jsonl`) · pre-registration `PREREG.md` (+ Amendments 1–2) written before the main run.

## What was built
`norevia/observatory/lab002/` — `controller.mjs` (single point of contact: `submit()` acknowledges at once and runs the request as a thread; a thread starts individually, unfolds into child threads under a shared per-request budget, carries an environment manifest, and leaves playbook memory), `api.mjs` (API layer, ledger, hard cap reserved per call), `requests.mjs` (7 requests with programmatic acceptance checks), `run.mjs`, `analyze.mjs`, `rescore.mjs`. Model-agnostic (`D_MODEL`).

## Result in brief
1. **The conversation stays free (demonstrated).** Under the controller every request was acknowledged in 0 ms (max over 2 reps) and the main conversation was blocked 0 s; status queries answered in ≤ 2 ms while 7 threads ran. Without a controller (SOLO-SEQ: one agent, one request after another) the conversation was blocked for 1,479–1,860 s. The 7-request batch finished in 278–598 s with the controller versus 1,479–1,860 s sequentially (≈ 5× in repetition 2, where the concurrency limit was raised; repetition 1 wall times include queueing, see Limits).
2. **Unfolding by threshold behaves as designed.** CTRL unfolded 0 of 6 text requests (Q1, LP1, LP2 × 2) and 8 of 8 repair requests (the two 8–9-package repositories up front, the two 4-package ones after the individual attempt failed its probe). ALWAYS unfolded all 14. On text requests this is where the money is: **cost per LP request US$ 0.0046 (CTRL) vs 0.0175 (ALWAYS), 3.8×; Q1 0.0006 vs 0.0019**, with equal-or-better acceptance (LP 2/4 CTRL, 4/4 CTRL-NOMEM, 2/4 ALWAYS; Q1 2/2 in every arm).
3. **On small repositories the threshold did not save money**: CTRL US$ 0.052 per request vs ALWAYS 0.041, because the individual attempt failed the probe and the thread then unfolded anyway (one wasted call). On large repositories the policies are the same (17.5 calls, ≈ US$ 0.09).
4. **One agent is not enough for large work.** SOLO-SEQ was the cheapest per request (US$ 0.074 on large repos, 3 calls) but its hidden-test pass fraction on the two large repositories was **0.60–0.83 vs 0.97–1.00** for the unfolded arms; its answers hit the 32k output limit in 28 of 400 calls (all SOLO-SEQ plus the four-package solo attempts), so part of the gap is the output cap, not only reasoning.
5. **Memory works once it is keyed by request type** (exploratory re-test, 4 reps, LP1 → LP2): with the playbook LP2 had **0 first-pass visible failures and used 1 call**, against 1 failure and 2 calls without it, in 4/4 reps; acceptance 3/4 vs 3/4. The main run showed the opposite (LP2 accepted 0/2 with memory) because of a defect in my first design: one shared playbook let a rule from Q1 ("at most 700 characters") leak into the LP2 prompt. Disclosed in Amendment 2.
6. **Primary pre-registered outcome: INCONCLUSIVE.** Cost per accepted request: CTRL 0.117, CTRL-NOMEM 0.097, ALWAYS 0.147, SOLO-SEQ 0.081 US$ (14 requests per arm; acceptance 5, 6, 4, 6 of 14). CTRL vs ALWAYS: Δ acceptance +0.07 (95% CI −0.21 to +0.36), cost ratio 0.80 (0.19–2.38). CTRL vs SOLO-SEQ: Δ −0.07 (−0.29 to +0.14), ratio 1.45 (0.74–3.12). The demonstration cannot rank the policies on cost per accepted request.

## Tables (2 repetitions, 7 requests, 14 requests per arm)
| Arm | Accepted | False success | Cost total (US$) | $/accepted (95% CI) | Calls | Conversation blocked | Batch wall (s) |
|---|---:|---:|---:|---|---:|---:|---:|
| CTRL (controller, individual first, threshold, memory) | 5/14 | 9 | 0.585 | 0.117 (0.042–0.417) | 111 | 0 s | 424 |
| CTRL-NOMEM | 6/14 | 8 | 0.582 | 0.097 (0.033–0.289) | 109 | 0 s | 386 |
| ALWAYS (unfold everything) | 4/14 | 10 | 0.589 | 0.147 (0.052–0.755) | 138 | 0 s | 443 |
| SOLO-SEQ (no controller) | 6/14 | 4 | 0.484 | 0.081 (0.028–0.263) | 31 | 1,670 s | 1,670 |

| Request type (mean per request) | CTRL | CTRL-NOMEM | ALWAYS | SOLO-SEQ |
|---|---|---|---|---|
| Q1 (2 reps): accepted / $ / calls | 2/2 · 0.0006 · 2 | 2/2 · 0.0003 · 1.5 | 2/2 · 0.0019 · 6 | 2/2 · 0.0004 · 1.5 |
| LP1+LP2 (4): accepted / $ / calls | 2/4 · 0.0046 · 2 | 4/4 · 0.0069 · 2 | 2/4 · 0.0175 · 6 | 4/4 · 0.0069 · 2 |
| Small repos, 4 pkgs (4): accepted / $ / calls | 1/4 · 0.052 · 7.3 | 0/4 · 0.053 · 7.3 | 0/4 · 0.041 · 8 | 0/4 · 0.040 · 2 |
| Large repos, 8–9 pkgs (4): accepted / $ / calls | 0/4 · 0.089 · 17.5 | 0/4 · 0.085 · 17.3 | 0/4 · 0.087 · 17.5 | 0/4 · 0.074 · 3 |
Hidden-test pass fraction, large repos: unfolded arms 0.97–1.00 (lx10 0.987–0.996, lx11 0.969–0.985); SOLO-SEQ 0.763/0.829 (lx10) and 0.605/0.600 (lx11).

Illustrative timeline (CTRL, repetition 2): all 6 requests acknowledged at 0 s; the two large repositories unfold into 8 and 9 package threads at 0.7–0.9 s; Q1 done 60 s; LP1 done 78 s and LP2 submitted at once; the two 4-package repositories unfold only at ≈ 122–126 s after their individual attempts fail the probe, then patrol at ≈ 158 s; everything done at 278 s (`arms-main.jsonl`).

## Reading
- The demonstrated claim is the **architecture**: one contact point that never blocks, requests run as threads, unfolding past a threshold, memory that carries standards to the next thread. All four parts operated end to end with a hard budget.
- The **threshold pays off where one agent suffices** (text, short deliverables: 4× cheaper than always unfolding) and **unfolding pays off where it does not** (large repositories: much better hidden-test pass fraction than a single agent). It does not by itself make small repair jobs cheaper.
- **Acceptance of repair requests is still ≈ 0 for every arm** (hidden tests fail with 97–99% passing): the verifier gap again, now observed in a fifth experiment. Acceptance by the programmatic checks of text requests is the only place a clear success rate exists.
- A generic playbook is dangerous: memory must be scoped (by request type here). That is a design requirement for the real controller, not a footnote.

## Limits and incidents (disclosed)
- 7 requests, 2 repetitions (a third would have crossed the 4.3 stop line), one small model, acceptance by programmatic checks (not human quality), LP house standards invented for the demo, cost from a price table not checked against an invoice (the cap counts it × 1.5), intervals wide. Not shown: model-decided delegation (unfolding here is rule-based), real user requests, long runs.
- **Instrument bug fixed after repetition 1** (`no-placeholder` matched the Portuguese word "todo"); text outputs of repetition 1 were re-scored offline from saved files (5 verdicts changed). **Memory defect** (above) fixed and re-tested separately. **Contention:** repetition 1 had an API concurrency limit of 10 shared by four arms, which inflated wall times of small requests; repetition 2 used 24. Cost, calls and acceptance are unaffected.
- **Output cap:** 32,000 tokens per call; 28 of 400 calls ended at the cap, concentrated in SOLO-SEQ, which handicaps it on large repositories.
- Smoke tests before the main run (≈ US$ 0.09) and the mem2 phase (≈ US$ 0.14 counted) are in the ledger.

## Files (relative to the repository root)
`observatory/lab002/` (tools) · `results/lab002/` — `PREREG.md`, `REPORT.md`, `runs-main.jsonl` (56 request runs), `arms-main.jsonl` (per-batch timelines and playbooks), `runs-mem2.jsonl`, `summary.json`, `ledger.jsonl`, `raw/` (text outputs). Reproduce: `D_CONCURRENCY=24 node observatory/lab002/run.mjs --phase main --arms CTRL,CTRL-NOMEM,ALWAYS,SOLO-SEQ --reps 2` then `node observatory/lab002/analyze.mjs`.
