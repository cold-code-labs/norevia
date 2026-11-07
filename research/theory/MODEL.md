---
id: th-model
title: Formal model of the collective efficiency law (candidate)
area: theory
evidence: hypothesis
tags: [collective-efficiency-law, correlated-vote, verifier, usl, decomposability, optimal-stopping, elastic-swarm, transition-points]
sources:
  - "Condorcet, M. J. A. N. de C. (1785). Essai sur l'application de l'analyse à la probabilité des décisions rendues à la pluralité des voix. Paris: Imprimerie Royale."
  - "Ladha, K. K. (1992). The Condorcet Jury Theorem, Free Speech, and Correlated Votes. American Journal of Political Science 36(3):617ss. doi:10.2307/2111584"
  - "Berg, S. (1993). Condorcet's jury theorem, dependency among jurors. Social Choice and Welfare 10(1). doi:10.1007/BF00187435"
  - "Kaniovski, S. (2010). Aggregation of correlated votes and Condorcet's Jury Theorem. Theory and Decision 69(3):453–468. doi:10.1007/s11238-008-9120-4"
  - "Gunther, N. J. (1993). A Simple Capacity Model of Massively Parallel Transaction Systems. CMG National Conference (gap: full text not opened)"
  - "Gunther, N. J. (2008). A General Theory of Computational Scalability Based on Rational Functions. arXiv:0808.1431v2"
  - "Amdahl, G. M. (1967). Validity of the single processor approach to achieving large scale computing capabilities. AFIPS '67 (Spring), p. 483ss. doi:10.1145/1465482.1465560"
  - "Wald, A. (1945). Sequential Tests of Statistical Hypotheses. Ann. Math. Statist. 16(2):117–186. doi:10.1214/aoms/1177731118"
  - "Wald, A. & Wolfowitz, J. (1948). Optimum Character of the Sequential Probability Ratio Test. Ann. Math. Statist. 19(3):326–339. doi:10.1214/aoms/1177730197"
  - "Chow, Y. S. & Robbins, H. (1963). On optimal stopping rules. Z. Wahrscheinlichkeitstheorie 2(1):33–49. doi:10.1007/BF00535296"
  - "Ferguson, T. S. (1989). Who Solved the Secretary Problem? Statistical Science 4(3):282–289. doi:10.1214/ss/1177012493"
  - "Ferguson, T. S. Optimal Stopping and Applications (online text, UCLA), ch. 5 'Monotone Stopping Rule Problems'. https://www.math.ucla.edu/~tom/Stopping/Contents.html"
  - "Bonabeau, E., Theraulaz, G. & Deneubourg, J.-L. (1996). Quantitative study of the fixed threshold model for the regulation of division of labour in insect societies. Proc. R. Soc. B 263(1376):1565–1569. doi:10.1098/rspb.1996.0229"
  - "Theraulaz, G. & Bonabeau, E. (1999). A Brief History of Stigmergy. Artificial Life 5(2):97–116. doi:10.1162/106454699568700"
  - "Dorigo, M., Maniezzo, V. & Colorni, A. (1996). Ant system: optimization by a colony of cooperating agents. IEEE Trans. SMC-B 26(1):29–41. doi:10.1109/3477.484436"
  - "Pratt, S. C., Mallon, E. B., Sumpter, D. J. T. & Franks, N. R. (2002). Quorum sensing, recruitment, and collective decision-making during colony emigration by the ant Leptothorax albipennis. Behav. Ecol. Sociobiol. 52(2):117–127. doi:10.1007/s00265-002-0487-x"
  - "Franks, N. R., Dornhaus, A., Fitzsimmons, J. P. & Stevens, M. (2003). Speed versus accuracy in collective decision making. Proc. R. Soc. B 270(1532):2457–2463. doi:10.1098/rspb.2003.2527"
  - "Passino, K. M. & Seeley, T. D. (2006). Modeling and analysis of nest-site selection by honeybee swarms: the speed and accuracy trade-off. Behav. Ecol. Sociobiol. 59(3):427–442. doi:10.1007/s00265-005-0067-y"
  - "Seeley, T. D. & Visscher, P. K. (2004). Quorum sensing during nest-site selection by honeybee swarms. Behav. Ecol. Sociobiol. 56(6):594–601. doi:10.1007/s00265-004-0814-5"
  - "Chen, L. et al. (2024). Are More LLM Calls All You Need? Towards Scaling Laws of Compound Inference Systems. arXiv:2403.02419v2"
  - "Brown, B. et al. (2024). Large Language Monkeys: Scaling Inference Compute with Repeated Sampling. arXiv:2407.21787v3"
  - "Stroebl, B., Kapoor, S. & Narayanan, A. (2024/2026). The Limits of Inference Scaling Through Resampling. arXiv:2411.17501v3"
  - "Kim, E., Garg, A., Peng, K. & Garg, N. (2025). Correlated Errors in Large Language Models. arXiv:2506.07962v1"
  - "Kim, Y. et al. (2025). Towards a Science of Scaling Agent Systems. arXiv:2512.08296v3"
  - "Kao, A. B. & Couzin, I. D. (2014). Decision accuracy in complex environments is often maximized by small group sizes. Proc. R. Soc. B 281(1784):20133305. doi:10.1098/rspb.2013.3305"
  - "Seeley, T. D. et al. (2012). Stop Signals Provide Cross Inhibition in Collective Decision-Making by Honeybee Swarms. Science 335(6064):108–111. doi:10.1126/science.1210361"
  - "Harris, T. E. (1963). The Theory of Branching Processes. Springer. doi:10.1007/978-3-642-51866-9"
  - "Kleinrock, L. (1975). Queueing Systems, Volume 1: Theory. New York: Wiley (metadata checked via reviews indexed in Crossref)"
related: [H-index, nat-candidates, sim-correlated-vote, sim-verifier, lit-synthesis, lit-debate-routing-matched-ceiling, lit-more-llm-calls, lit-correlated-errors, lit-large-language-monkeys, lit-scaling-agent-systems, lit-sas-equal-thinking-budget, lit-adaptive-consistency, lit-early-stopping-sc]
updated: 2026-11-07
summary: Mathematical model that predicts when 1 high-effort agent beats N agents, when a micro-swarm pays off and where expansion is wasteful, as a function of capability, error correlation, verifier, coordination cost and task coupling.
---

# Formal model of the collective efficiency law (candidate)

**Evidence status:** `hypothesis`. This document is a mathematical model. The classical derivations cited are third-party results (checked for existence and metadata — see §14). Our own formulas were **checked numerically** (`model.test.mjs`, 29/29 tests, Monte Carlo and exact enumeration). That check is **local validation of the mathematics**, not of its applicability to LLMs. No parameter (p, ρ, s, f, β, κ, ι, μ) has been measured on a real LLM by Norevia; the numerical values are illustrative, except in §10, where numbers reported by authors (`lit-*`, level `author-reported`) are used to calibrate and confront the model.

**Baseline to beat (we claim no novelty over it):** Kim et al. (2025, arXiv:2512.08296v3, `lit-scaling-agent-systems`) already propose a predictive scaling law for agent systems (260 configurations; diminishing/negative returns once the single agent exceeds ~45% success, interaction β = −0.236; +80.8% on a decomposable task vs −70% on sequential planning; out-of-sample R² 0.37–0.41, according to the authors). Laws for the optimal number of calls (`lit-more-llm-calls`), difficulty-based allocation (`lit-snell-test-time-compute`), routers/cascades and adaptive stopping also already exist (see `lit-synthesis` §3). What this model tries to add is **mechanistic and joint**: deriving *where* the thresholds come from (capability, ρ, verifier, coupling, coordination) and a joint policy of effort × no. of agents × topology × verification, counting the controller's cost and optimizing cost per **accepted** result. This is a research opportunity, not demonstrated originality.

Reproduction (Node 22, no dependencies):

```
cd research/theory
node model.mjs all          # generates curves/*.json and prints the summary (saved in MODEL-OUTPUT.txt)
node --test model.test.mjs  # numerical check (saved in TEST-OUTPUT.txt)
```

Question: *when do N agents with effort e_i outperform 1 agent with effort E, per unit of cost, under error correlation, verification and coordination cost?*

The model's short answer: a swarm only wins when at least one of these mechanisms is at work **and** is not cancelled out by the others —
(i) **diminishing returns to effort** (splitting the budget yields more than concentrating it, §4);
(ii) enough **error independence** for aggregation to improve things (§2);
(iii) a **cheap and specific verifier** that converts coverage into success (§3);
(iv) **decomposition** with coupling below a critical threshold (§6);
and the gain exceeds the **coordination cost** (§5) and the **cost of deciding** (§7). Otherwise, 1 agent wins.

---

## §1 Variables

| Symbol | Meaning | Where measured (proposed) |
|---|---|---|
| e, E | reasoning effort per call (normalized reasoning tokens) | observatory config |
| p(e; d) | prob. that 1 call succeeds, as a function of effort and difficulty | acceptance rate by effort |
| d → h, β | difficulty: **h** = half-saturation effort; **β** = initial convexity (Hill curve) | fit of the p(e) curve |
| p_hi | the model's capability ceiling (p(∞)) | same |
| ρ | intra-class correlation of successes between agents on the same task | pairs of runs on the same task |
| s, f | verifier: sensitivity s = P(accept \| correct); false acceptance f = 1 − specificity = P(accept \| wrong) | visible vs hidden tests |
| c(e) = c0 + c1·e | cost per call: fixed overhead (context, tools) + cost per effort | tokens/US$ |
| c_v | cost of one verification | same |
| κ_msg, R, topology | cost per communication edge per round, no. of rounds, graph | message tokens |
| σ, κ (USL) | contention (serialized fraction) and coherence (pairwise synchronization) | fit of throughput vs N |
| k, χ | no. of subproblems; fraction of the k(k−1)/2 pairs of subproblems that are coupled | task design (interdependent bugs) |
| ι, μ | context interference per extra subproblem (solo); information loss per interface (split) | ablations |
| V, L | value of an accepted success; loss from a false success | experiment definition |
| t(e) = t0 + e/r | latency per call | clock |

Capability (Hill, `capability`): p(e) = p_lo + (p_hi − p_lo)·(e/h)^β / (1 + (e/h)^β).
The Hill form is an **assumption**: there are reports of negative returns to effort (`lit-inverse-scaling-ttc`) and of saturation (`lit-s1-budget-forcing`), which may require a different family.

---

## §2 Majority vote with correlated errors

**Classical (Condorcet 1785):** N independent voters, each correct with p > 1/2 → majority accuracy A_N grows with N and → 1. **Ladha (1992)** showed that the result survives limited positive correlation and is weakened by it; **Berg (1993)** modeled dependence via a Pólya–Eggenberger urn, which is equivalent to the beta-binomial model used here; **Kaniovski (2010; online 2008)** treats aggregation of correlated votes.

### 2.1 Beta-binomial model
Per task, draw P ~ Beta(a, b) with mean p and intra-class correlation ρ: a = p(1−ρ)/ρ, b = (1−p)(1−ρ)/ρ. Given P, the N votes are independent. Then X = no. of correct votes ~ BetaBin(N, a, b), Corr(X_i, X_j) = ρ (checked by Monte Carlo) and

A_N = Σ_{k > N/2} C(N,k)·B(a+k, b+N−k)/B(a,b)   (+ ½ of the tie if N is even).

**Ceiling (N → ∞):** A_∞ = P(P > ½) = 1 − I_{1/2}(a, b) < 1 whenever ρ > 0.
Example (p = 0.7): ρ = 0.05 → 0.965; ρ = 0.1 → 0.900; ρ = 0.2 → 0.818; ρ = 0.3 → 0.773 (curves/vote_vs_N.json).

**Alternative model ("common shock"):** with prob. ρ everyone copies the same draw; otherwise independent. Same pairwise correlation, ceiling ρp + (1−ρ). The two models bracket the behavior; the simulation `sim-correlated-vote` used a third one (probit with a Gaussian latent factor, ceiling Φ(z_p/√ρ)) and reached the same qualitative conclusion.

### 2.2 Closed-form marginal gain
Conditional on P, the classical identity for N = 2m+1 → 2m+3 is ΔA_m = C(2m+1, m)·(2P−1)·[P(1−P)]^{m+1}. Since the votes are conditionally independent, under the beta model it suffices to take the expectation:

**ΔA_m = C(2m+1, m)·[2·B(a+m+2, b+m+1) − B(a+m+1, b+m+1)]/B(a,b)**

(checked against exact differences for m = 0..11, ρ ∈ {0; 0.1; 0.3}, error < 1e−10).

### 2.3 Optimal size N*
Utility: U(N) = V·A_N − N·c − κ_msg·edges(N).
- **Marginal rule:** expand N → N+2 while V·ΔA_m > 2c + Δcomm. Since ΔA_m is decreasing in m when p > ½, the myopic rule coincides with the global optimum (tested on 36 combinations). It is the "one-step look-ahead" rule that is optimal in **monotone** stopping problems (Chow & Robbins 1963; Ferguson, *Optimal Stopping*, ch. 5).
- **Solo → micro threshold (1 → 3 voters):** V/c > 2/ΔA_0, ΔA_0 = E[(2P−1)P(1−P)]; in the independent case **V/c > 2/[(2p−1)p(1−p)]**. E.g.: p = 0.7 → V/c > 23.8; with ρ = 0.3 → 59.4; p = 0.55 → 84.8 (curves/transitions.json, voteMap).
- **Metric paradox:** with identical agents, the *accuracy/cost* ratio is **always** maximal at N = 1 (A_N ≤ 1 < N·p for p > 1/N). Hence "cost per success" without an error value (V, L) and without a verifier **never** recommends voting among copies; voting is only justified when errors are expensive (high V/c) or there is no way to detect failure and retry.
- Examples (V = 100, c = 1, κ = 0.05 star): p = 0.7 → N* = 9 (ρ = 0), 5 (ρ = 0.1), 3 (ρ = 0.3); p = 0.6 → N* = 9, 3, 1.

### 2.4 Mixture of difficulties → non-monotonic curve
If a fraction of the tasks has p < ½ (the model "errs to the same side"), voting makes those tasks **worse** with N. The aggregate accuracy Σ w_j·A_N(p_j) can have an **interior maximum**: 80% easy (p = 0.8) + 20% hard (p = 0.3) → maximum at N = 15 (0.80 → then falls); 50/50 (0.75; 0.35) → maximum at N = 5; 30/70 (0.9; 0.4) → N = 1. This qualitatively reproduces the report by Chen et al. (2024, `lit-more-llm-calls`).

---

## §3 Best-of-N with an imperfect verifier

Procedure: generate candidates (sequentially, stopping at the 1st accepted one, or in parallel and pick an accepted one — same outcome distribution by exchangeability). Verifier with (s, f). Per candidate: P(accepted ∧ correct) = ps; P(accepted ∧ wrong) = (1−p)f; rejection r = 1 − ps − (1−p)f.

Independent:
- P_true(N) = π·(1 − r^N), P_false(N) = (1−π)·(1 − r^N), abstention r^N, expected calls (sequential) (1 − r^N)/(1 − r);
- **precision of the accepted π = ps / (ps + (1−p)f) — does not depend on N.**

Consequences:
1. **Success ceiling = π.** With a perfect verifier (f = 0) we recover the coverage 1 − (1 − ps)^N (the regime of Brown et al. 2024, `lit-large-language-monkeys`). With f > 0, more N only converts abstentions into acceptances **in the proportion π : (1−π)** — false success grows along with it (Stroebl, Kapoor & Narayanan 2024 discuss this limit of resampling with imperfect verifiers).
2. **The verifier dominates when p is low:** π falls quickly when (1−p)f ~ ps. E.g. (s = 0.9): p = 0.1, f = 0.05 → π = 0.667; p = 0.05, f = 0.05 → π = 0.487 (false success > success). A single agent with higher effort (p = 0.6, same verifier) has π = 0.964: **one strong generator with a weak verifier beats many weak generators with the same verifier** in reliability, even with lower coverage.
3. **With correlation (P ~ Beta) the situation gets worse:** "impossible" tasks (P ≈ 0) consume attempts until a false acceptance. The precision of the accepted falls **below** π and drops with N. E.g.: p = 0.1, f = 0.01, ρ = 0.3: P_true(64) = 0.50 vs P_false(64) = 0.27 (iid: 0.91 vs 0.09).

Exact formula under Beta (implemented): since r(P) = (1−s)P + (1−f)(1−P) is a convex combination, E[P^x(1−P)^y r^k] = Σ_j C(k,j)(1−s)^j(1−f)^{k−j}·B(a+x+j, b+y+k−j)/B(a,b) — a sum of positive terms, numerically stable (checked by Monte Carlo, tolerance 0.004).

**Comparison with 1 higher-effort agent:** U = V·P_true − L·P_false − cost. The swarm wins when the extra coverage (1 − r^N vs 1 − r_solo) is worth more than the loss of precision (π_low vs π_high) and the extra cost. The map in §9 shows that, with f = 0.2, the high-effort solo wins in every medium-difficulty cell (h = 2–5), for any β and ρ in the grid.

---

## §4 Equal budget: concentrate or split the effort?

Same cost: N·c(e_N) = c(E) ⇒ e_N = E/N − c0(N−1)/(N·c1) (the per-call overhead c0 penalizes splitting).

With a perfect verifier and small p, 1 − (1 − p(E/N))^N ≈ N·p(E/N); splitting wins approximately when p(e)/e is decreasing, i.e., when the **elasticity** ε(e) = d ln p / d ln e < 1. For Hill (p_lo = 0):

ε(e) = β / (1 + (e/h)^β)  ⇒  ε < 1  ⇔  β ≤ 1  or  **e > e_knee = h·(β−1)^{1/β}**.

**Knee criterion (heuristic):** splitting pays off if the per-agent effort e_N stays **above** the knee; concentrating, if it falls below. On the grid (β ∈ {0.5;1;2;3}, h ∈ {1;4;16}, N ∈ {2;4;8}, E = 8, ρ = 0.1) the criterion gets the winner right in 94.4% of the cells; the two disagreements are at β = 1, h = 16, where ε ≈ 1 and the overhead decides.
Interpretation: "threshold" tasks (β > 1, high h — they need a minimum of chained reasoning) favor **1 agent with high effort**; "search/guess" tasks (β ≤ 1, diminishing returns) favor **sampling cheaply several times**. `lit-nothinking` and `lit-sas-equal-thinking-budget` report the two sides of this same divide.

---

## §5 Coordination cost: Universal Scalability Law (USL)

Gunther (1993; 2007; formalization in arXiv:0808.1431): relative capacity

**X(N) = γN / [1 + σ(N−1) + κN(N−1)]**,  peak at **N_max = √((1−σ)/κ)**.

σ = contention (queueing for a shared resource; with κ = 0, γ = 1 it reduces to Amdahl 1967); κ = coherence (delay to make data consistent via point-to-point exchange).

Proposed mapping for LLM swarms (**engineering hypothesis**):
- σ ← serialized part: single orchestrator, single verifier, tool queue, rate limits, final integration;
- κ ← pairwise reconciliation: each agent must read/reconcile the others' work (shared context grows ∝ N, total cost ∝ N²; Brooks's N(N−1)/2 channels, *The Mythical Man-Month*, 1975).
Examples: (σ, κ) = (0.05; 0.01) → N_max ≈ 9.7; (0.1; 0.02) → 6.7; (0.2; 0.05) → 4. Note that reports of saturation near 14–16 agents (`lit-swarmsys`, `lit-macnet`) would be compatible with κ ≈ 0.004–0.005 if σ ≈ 0 — a fit to be done with data, not inferred here.

Token cost by topology (`swarmTokenCost`): N·c + κ_msg·R·edges(N), with edges = 0 (independent), N−1 (star), N (board/stigmergy), N(N−1)/2 (all-to-all). Only the full topology introduces the quadratic term — which is why **the choice of topology changes κ**, not just the cost.

---

## §6 Decomposability: "simple bug" vs "interdependent bugs"

Task with k subproblems; a fraction χ of the k(k−1)/2 pairs is coupled (fixing one requires knowing about the other).
- **Solo** (1 agent, effort E, E/k per part): P_solo = q(E/k)^k · (1−ι)^{k−1} (ι = context interference per additional part).
- **Split** (k agents, same budget): P_split = q(e_k)^k · (1−μ)^{χ·k(k−1)/2} · q_int (μ = loss per interface crossed; q_int = integration success).

Split wins ⇔ χ < χ*, with

**χ* = [(k−1)·ln(1−ι) + k·ln(q_solo/q_split) − ln q_int] / [C(k,2)·ln(1−μ)]  ≈  2ι/(kμ)** (if q_solo = q_split and q_int = 1).

Structural predictions:
- k = 1 (simple bug): χ* = 0 → nothing to split; any swarm only adds cost (except verification, §3).
- χ* **falls as 1/k**: the more parts, the lower the tolerable coupling. With ι = 0.08, μ = 0.15: χ* ≈ 0.53 (k=2), 0.36 (k=3), 0.27 (k=4), 0.18 (k=6) — in practice (with overhead) 0.45; 0.25; 0.14; 0.01.
- That is why the **micro-swarm (2–3)** is the natural regime for decomposition: for large k the threshold becomes so low that only almost perfectly independent tasks (χ ≈ 0) support a macro-swarm.
- The report by Kim et al. (2025, `lit-scaling-agent-systems`) of multi-agent degradation on sequential tasks is compatible with high χ; it is not a test of this model.

---

## §7 Stopping, elasticity and bounded repair

### 7.1 General expansion rule
Expand (one more agent, one more sample, more effort) while **E[ΔP]·V − E[ΔP_false]·L > Δcost**. When the marginal gain is decreasing (monotone problem), the one-step rule is optimal (Chow & Robbins 1963). The secretary problem (Ferguson 1989) is **not** the right model in most LLM cases: there the decision is irrevocable and there is only relative ranking; here there is *recall* (candidates are kept) and absolute verifiers. The secretary problem becomes relevant only when the opportunity expires (e.g. a latency window) and there is no absolute verifier.

### 7.2 Wald's SPRT for sequential voting
Two answers (A/B), each vote correct with assumed p0: LLR per vote = ±ln(p0/(1−p0)); stop when the **margin** |#A − #B| ≥ m* = ⌈ln((1−α)/α)/ln(p0/(1−p0))⌉ (Wald 1945; optimality in expected no. of samples under i.i.d.: Wald & Wolfowitz 1948). Exact error conditional on P (gambler's ruin): 1/(1 + (P/(1−P))^m).

**Under correlation the SPRT calibrated for independence becomes miscalibrated** (p = p0 = 0.7, α = 0.05, m* = 4):

| ρ | realized error (MC) | exact error without cap | mean votes | error of the fixed vote with the same mean no. |
|---|---|---|---|---|
| 0 | 0.032 | 0.033 | 9.3 | 0.099 |
| 0.05 | 0.095 | 0.091 | 9.7 | 0.141 |
| 0.1 | 0.139 | 0.138 | 9.5 | 0.173 |
| 0.2 | 0.200 | 0.199 | 8.8 | 0.216 |
| 0.3 | 0.239 | 0.236 | 8.1 | 0.245 |

Reading: under independence the SPRT has 1/3 of the error of the fixed vote with the same spend; under ρ = 0.3 the advantage almost disappears and the realized error is ~5× the nominal one. The early stopping reported in `lit-adaptive-consistency` and `lit-early-stopping-sc` should, according to the model, yield less where correlation is high.

### 7.3 Quorum as a race (speed–accuracy)
The first option to accumulate Q votes decides: P(correct) = Σ_{j<Q} C(Q−1+j, j)·E[P^Q(1−P)^j]; E[votes] = Σ_j (Q+j)·C(Q−1+j, j)·(E[P^Q(1−P)^j] + E[(1−P)^Q P^j]). Larger Q → slower and more accurate; correlation flattens the gain: p = 0.65, Q = 12 → 0.93 (ρ = 0) vs 0.74 (ρ = 0.2) with ~17–18 votes. It is an abstraction of the quorum of *Temnothorax/Leptothorax* (Pratt et al. 2002) and of honeybees (Seeley & Visscher 2004; Passino & Seeley 2006), where the speed–accuracy trade-off was reported experimentally (Franks et al. 2003). The race does not model positive recruitment or continuous site quality.

### 7.4 Elastic vs fixed size
Sequential best-of-N (stops at the 1st accepted) has **the same P_true** as fixed parallel and costs (1 − r^N)/(1 − r) calls instead of N. On a mixture of 50% easy (p = 0.9) / 30% medium (0.5) / 20% hard (0.15), s = 0.9, f = 0.05: cost per success fixed vs elastic = 3.54 vs 2.50 (N = 2); 11.56 vs 3.08 (N = 8). **Price:** latency (sequential rounds) and P_false growing with the cap N (0.019 → 0.057 from N = 1 to 8) — the expansion cap should be chosen by §3, not by cost alone.

### 7.5 Bounded repair (healing with return to rest)
Attempt j fixes with q_j = q1·δ^{j−1} (diminishing returns: same blind spot), costs c and introduces a regression with prob. g (loss L_reg). One-step rule (optimal, monotone case): keep trying while V·q_j > c + g·L_reg ⇒

**R* = 1 + ⌊ln((c + g·L_reg)/(V·q1)) / ln δ⌋.**

E.g. (V = 10, c = 1, g = 0.05, L_reg = 10): q1 = 0.6, δ = 0.7 → R* = 4 (P_fix = 0.87); δ = 0.4 → R* = 2. Prediction: large fixed attempt caps (e.g. 10) are wasteful when δ is low, and the measured δ decides the cap.

---

## §8 Formalized natural mechanisms (a source of hypotheses, not of proof)

**Response threshold** (Bonabeau, Theraulaz & Deneubourg 1996): prob. of engaging T_θ(s) = s^n/(s^n + θ^n). Engineering analogue: stimulus s = estimated task uncertainty (e.g. disagreement among the first samples), agents with staggered thresholds θ_i; expected no. of active agents Σ_i T_{θ_i}(s). With θ = {0.1; 0.2; 0.35; 0.5; 0.7; 0.9} and n = 2: s = 0.05 → 0.3 agent; s = 0.3 → 2.5; s = 0.9 → 4.7. A "hi" (s ≈ 0) activates no one besides the responder.

**Stigmergy with evaporation** (Grassé, via Theraulaz & Bonabeau 1999; Ant System, Dorigo et al. 1996): trail τ ← (1−λ)τ + deposit. If the environment changes as a Poisson process with rate h, the **weight of stale information is h/(h + λ)** (continuous time; checked by discrete simulation, error < 0.02) and the relative variance of the signal (EWMA) is λ/(2 − λ). There is a λ* that minimizes the squared error: h = 0.01 → λ* ≈ 0.24; h = 0.05 → 0.44; h = 0.2 → 0.65 (with Δ² = 1, noise 0.25). Messages per round: board 2N vs direct N(N−1).

---

## §9 Transition points (1 agent → micro → macro)

Predicted conditions (derived above; all **hypotheses** to be tested):

| Regime | Approximate sufficient condition in the model |
|---|---|
| **No swarm, low effort** | p(e_low) already ≥ target (trivial task), or no configuration has U > 0 (task out of reach: "do not invest", abstain) |
| **1 agent, high effort** | β > 1 and e_N < e_knee (threshold task); or χ > χ*; or high f (low π_low); or high ρ without a verifier (vote ceiling ≤ p(E)); or V/c < 2/ΔA_0 |
| **Micro-swarm (2–3)** | verifier with f ≪ p_low·s and moderate p_low (generation + verification); or k = 2–3 with χ < χ*; or vote with V/c between 2/ΔA_0 and 2/ΔA_1 |
| **Macro-swarm (≥ 4)** | ρ ≈ 0 **and** (f ≪ p_low or very high V/c) **and** β ≤ 1 **and** N ≤ N_max(σ, κ); or decomposition with χ ≈ 0 and large k |
| **Expansion is wasteful** | ΔA·V < Δcost; N > the USL's N_max; N > the interior-maximum point (§2.4); P_false growing faster than P_true (§3) |

Numerical map (curves/transitions.json, verifier s = 0.9, V = L = 20, parallel, e_low = 1, e_high = 6):
- β = 0.7 or 1, low h (0.5): **micro** wins across the whole f and ρ grid.
- β = 0.7, h = 2–5, f ≤ 0.05, ρ = 0: **macro** (N = 4–5); with ρ = 0.3 the same point becomes **micro**; with f = 0.2, **solo-high**.
- β ≥ 2 and h ≥ 2: **solo-high** across the whole grid (threshold task).
- h = 12 (out of reach): **solo-low** (spend the minimum and abstain) — the model says no swarm scale pays off.
- Vote (V = 50): N* = 5 only with ρ = 0; ρ = 0.05–0.15 → 3; ρ ≥ 0.3 → 1, for p ∈ [0.65; 0.85]; p = 0.55 → always 1.

---

## §10 Calibration and confrontation with the literature (inputs = author-reported)

Curve: `curves/literature_calibration.json`. None of the items below is local validation; they are consequences of the model when fed with published numbers.

### 10.1 Capability threshold (~45%, Kim et al.) — where it might come from
Absolute gain of the **2nd verified candidate** (sequential): g(p) = E[P·s·r(P)]; independent, **g(p) = ps(1−f) − p²s(s−f)**, peaking at **p* = (1−f)/(2(s−f))** — 0.50 with a perfect verifier, 0.56 with (s, f) = (0.9; 0.05), 0.57 with (0.9; 0.2). With a perfect verifier, correlation only multiplies g by (1−ρ) (E[P(1−P)] = p(1−p)(1−ρ)), without moving the peak. The gain of the 1 → 3 **vote**, (2p−1)p(1−p), on the other hand, peaks at **(3+√3)/6 ≈ 0.79**.
Reading: the model predicts that **the saturation threshold depends on the aggregation mechanism** — ≈ 0.5 when cooperation works as "more attempts + selection", ≈ 0.8 when it works as a vote —, and that the gain *relative* to the single agent (g/ps = 1 − ps − (1−p)f in the iid case) falls monotonically with p. Kim et al.'s ~45% is compatible with the first mechanism; this is a mechanism conjecture (→ H-17), not a reproduction of their result.

### 10.2 Errors in an open answer space: plurality and K_eff
The binary model (§2) is the worst case. Generalization: K_eff equiprobable wrong alternatives ⇒ the correct one wins the plurality in the limit ⇔ P > 1/(1+K_eff); ceiling = 1 − I_{1/(1+K)}(a, b) (K = 1 recovers the binary case; checked by Monte Carlo). The agreement between two errors is 1/K_eff. `lit-correlated-errors` reports error agreement ≈ 0.6 (HELM; chance ≈ 1/3) and 0.423 (HuggingFace; chance 0.127) between **different models** ⇒ K_eff ≈ 1.7 and 2.4: on those benchmarks the binary case is a reasonable approximation and model diversity decorrelates little.

### 10.3 Large Language Monkeys (MATH, Llama-3-8B-Instruct)
Report: coverage 82.9% (N = 100) and 98.44% (N = 10,000); selection by vote/RM plateaus at ~41% (`lit-large-language-monkeys`).
- Fit of the Beta family to coverage: p ≈ 0.120, ρ ≈ 0.186 (a ≈ 0.53, b ≈ 3.84). **Caution:** 2 points and 2 parameters — it is an exact fit, not a test.
- Consequence 1 (testable): **predicted pass@1 ≈ 12%** for this model/dataset pair. If the reported/measured pass@1 is very different, the Beta family (a tail of near-impossible tasks) is wrong for this case. Value not checked in the card (`gap`).
- Consequence 2: the **binary** ceiling would be 2.7% — far below the 41% observed; plurality explains 41% with **K_eff ≈ 9.4**, i.e., a predicted agreement between wrong samples of the **same** model ≈ 0.11. Measuring that agreement is a direct test (→ H-01, H-18).
- Consequence 3: the gap between coverage (98%) and selection (41%) is exactly the §3 regime (without a verifier, the ceiling is that of aggregation; with a perfect verifier, that of coverage).

### 10.4 Unanimous and wrong: why consensus signals do not detect need
Fraction of majority errors in which the N votes are **unanimous and wrong**: E[(1−P)^N]/(1 − A_N). For N = 3: p = 0.7 → 12.5% (ρ = 0), 35.5% (ρ = 0.3), 70.3% (ρ = 0.7); p = 0.5 → 25%, 47.5%, 77.5%. `lit-debate-routing-matched-ceiling` reports that 66% of the cases in which debate helps have a unanimous, wrong vote and that vote entropy recovers only 11–19% of the gain of an oracle router. In the model, 66% unanimous-wrong requires high ρ (≈ 0.55–0.7 for N = 3 and p between 0.5 and 0.8). The conditioning is not the same (they measure among the cases where debate helps; the model, among all majority errors), so this is only an order-of-magnitude check, compatible with the idea that **disagreement signals measure safety, not need**; the controller needs signals external to the consensus (tests, verifier, tool) (→ H-18).

### 10.5 Coordination cost measured by others
Kim et al. report turns T = 2.72·(n + 0.5)^1.724 (R² = 0.974) and successes per 1K tokens of 67.7 (single agent) vs 13.6–42.4 (multi-agent). The exponent 1.72 lies between star (edges ∝ n) and all-to-all (∝ n²), compatible with κ > 0 in the USL (§5) (→ H-11). `lit-macnet` (~16 nodes) and `lit-swarmsys` (~14) report peaks; `lit-agentnet` reports that trajectory memory yields 7–10 points vs 0.8 from 3 → 9 agents (→ H-19).

### 10.6 How to calibrate the curves (protocol proposed to the observatory)
1. p(e): acceptance per task in A-low/A-mid/A-high → fit (h, β) per class (H-09).
2. ρ: ≥ 10 independent runs per task → fit Beta (mean, ρ) by beta-binomial maximum likelihood; K_eff from the agreement between wrong answers.
3. Verifier: s and f of the visible tests against the hidden ones (H-02).
4. Coordination: tokens/turns by N and topology → (σ, κ) (H-11).
5. Only then predict N*, regime and thresholds — and compare with the Kim et al. baseline (architecture selection) on held-out data.

---

## §11 Formalization of the nature candidates (`nat-candidates` C01–C10 and extras)

Curve: `curves/nature_candidates.json`. The candidates come from `research/nature/CANDIDATES.md`; their numerical thresholds are refutation criteria proposed by the nature agent. Here we check what the model says about each one. **In three cases the model disagrees with the candidate's quantitative form**, and that becomes a competing prediction to be tested.

- **C01 (N ≈ 1/ρ):** the *effective* N of the mean (Kish) saturates at 1/ρ, but the vote's **accuracy** does not: in the beta model, N = ⌈1/ρ⌉ delivers only 50–79% of the possible gain (p = 0.7, ρ = 0.1: N = 11 → 69%; 90% requires N = 43). Exception: p = 0.8, ρ = 0.05 (92%). Competing predictions recorded in H-01.
- **C02 (Kao & Couzin 2014):** interior maximum in N when shared evidence leads the majority into error; in the model, it is the §2.4 mechanism (items with p < ½). It goes into H-10.
- **C03:** quorum tuned to urgency → H-08 (race to Q, §7.3).
- **C04:** threshold activation → H-06; the stimulus AUC condition links to H-18 (consensus does not detect need).
- **C05:** independence first, sharing later → H-15 (sharing early increases ρ) and H-20 (sharing pays off when solutions are rare).
- **C06 (launch coupled to acceptances):** mean dynamics x_{t+1} = ε + g·a·x_t, with a = ps + (1−p)f. The swarm **contracts** iff g·a < 1, with fixed point ε/(1 − g·a). To expand on feasible tasks and contract on infeasible ones (a = f), the gain must lie in the **window 1/(p·s) < g < 1/f** — with f = 0.05, g < 20; a high false acceptance closes the window. → H-21.
- **C07 (k fixed neighbors):** with each agent reading k peers, the k* needed to stay within 3 pp of the full read **saturates in N only when there is correlation**: ρ = 0.3 → k* = 2–4 for N = 7…51; ρ = 0 → k* grows with N (p = 0.6: 4, 10, 20, 38). Prediction: the fixed topological neighborhood works *because* the errors are correlated. → H-22.
- **C08 (sparse activation):** with 12 agents, 3 competent (pc = 0.6) and a router that fills each slot correctly with prob. r: k = 3 stays 3.3 pp from dense with r = 0.9, 13 pp with r = 0.7. The criterion "≥ dense − 2 pp at ≤ 25% of the cost" requires **r ≳ 0.9** (or k = 4 with r = 0.9: 0.6 pp). → H-23.
- **C09 (Kessler):** branching process (Galton–Watson; Harris 1963): with a mean of m child jobs per job, the expected progeny per root job is 1/(1−m) if m < 1 and diverges if m ≥ 1. Cleanup/deduplication/cancellation of a fraction d gives m_ef = m(1−d), with **critical cleanup d* = 1 − 1/m** (m = 1.5 → 33%; m = 2 → 50%). → H-24.
- **C10 (evaporation in the router):** after an abrupt change, the cumulative mean without decay with history T0 needs 9·T0 tasks for the past to weigh less than 10%. An EWMA with rate λ needs ln 0.1/ln(1−λ) (λ = 0.1 → 22). The ratio grows with T0 (lock-in): with T0 = 500, it lies between 20× and 436×. The price is the stationary noise λ/(2−λ). → H-25.
- **Idle reserve (`nat-inactive-reserve`):** M/M/c queue (Erlang C; Kleinrock 1975). Near saturation the wait is highly nonlinear: c = 4 with load 3.6 gives W_q ≈ 1.97; with 1 reserve agent (c = 5), 0.29. A load burst of 4.5 makes c = 4 unstable, and c = 6 (+50% reserve) gives W_q ≈ 0.28. → H-26.
- **Cross-inhibition (`nat-stop-signal-cross-inhibition`, Seeley et al. 2012):** two equally supported options take E[T] = m² rounds to reach margin m (gambler's ruin; checked by MC). A verifiable counterexample that eliminates the wrong option with prob. v per round reduces this: m = 5 falls from 25 to 12.3 (v = 0.05) and 4.7 (v = 0.2). → H-27.

---

## §12 Riskiest predictions (falsifiable)

1. **Vote ceiling predicted by measured ρ.** Measuring p and ρ on pairs of runs (same model, same task), the vote accuracy with N = 15–31 should lie within ±3 pp of 1 − I_{1/2}(a,b) (or of the probit ceiling) and not above it. If voting in LLMs systematically exceeds the predicted ceiling, the correlation model is wrong (e.g.: errors dispersed over many answers, where plurality is stronger — not modeled). → H-01.
2. **Precision of the accepted does not rise with N.** In best-of-N with a fixed verifier, the fraction of accepted candidates that pass the hidden tests should be constant or **fall** with N (fall if ρ > 0), never rise; P_false should grow monotonically with N. A significant rise in precision with N refutes §3. → H-02, H-13.
3. **The effort knee decides concentrate vs split.** Fitting the p(e) curve per task class, the criterion e_N ≷ h(β−1)^{1/β} should predict the winner (1×E vs N×E/N, equal budget) in ≥ 80% of the classes. A hit rate ≤ 60% refutes the criterion. → H-09.

4. **(calibration)** For the Llama-3-8B-Instruct/MATH pair, the Beta model fitted to coverage implies pass@1 ≈ 12% and agreement between wrong samples ≈ 0.11; very different values refute the Beta family + uniform plurality for this case (§10.3).
5. **Threshold by mechanism:** the peak of the cooperation gain lies near p ≈ 0.5 when cooperation is "attempts + verified selection" and near 0.8 when it is a vote (§10.1; H-17).

Other quantitative predictions: solo → micro V/c threshold (H-01/H-05), χ* ∝ 1/k (H-03/H-04), SPRT miscalibration under ρ (H-12), repair R* (H-14).

---

## §13 Limits and gaps

- **Binary.** The vote models in §2 assume 2 answers (worst case). §10.2 adds plurality with K_eff **equiprobable** alternatives; non-uniform error distributions are not modeled.
- **Single ρ per task.** Real correlation varies by task type and between generator and verifier (the verifier may share the generator's blind spot — higher effective f on tasks where p is low; not modeled beyond the effect via Beta).
- **Hill p(e) is an assumption**; negative returns to effort (`lit-inverse-scaling-ttc`) break the monotonicity used in §4.
- **USL** was derived for computing systems (processors, transactions); applying it to LLM agents is an engineering analogy, without a fit to data.
- **Decomposition** uses independent multiplicative losses (ι, μ); higher-order interactions and interface repair are not modeled.
- **Costs** are linear in tokens; prompt caching, per-model differential pricing and network latency are not in the model.
- **Sources:** the full text of Gunther (1993) was not opened (`gap`); the formula and the peak were checked on the author's page (perfdynamics.com/Manifesto/USLscalability.html) and in arXiv:0808.1431v2. For Ladha (1992) and Berg (1993) Crossref does not give the final page; the initial page/DOI is cited. Condorcet (1785) cited by the original edition (no DOI).
- Nothing here authorizes deployment: the expansion/stopping rules are research proposals.

## §14 Source verification (2026-11-07)

- DOIs checked via the Crossref API (title, authors, volume, pages): Ladha 1992; Berg 1993; Kaniovski 2010; Wald 1945; Wald & Wolfowitz 1948; Chow & Robbins 1963; Ferguson 1989; Amdahl 1967; Bonabeau et al. 1996; Theraulaz & Bonabeau 1999; Dorigo et al. 1996; Pratt et al. 2002; Franks et al. 2003; Passino & Seeley 2006 (Crossref: published online 2005, vol. 59(3) 2006); Seeley & Visscher 2004.
- arXiv ids checked via the arXiv API (title, authors, version): 2403.02419v2, 2407.21787v3, 2411.17501v3 (current title "The Limits of Inference Scaling Through Resampling"), 2506.07962v1, 2512.08296v3, 0808.1431v2.
- Checked later via Crossref: Kao & Couzin 2014; Seeley et al. 2012; Harris 1963 (book chapters, Springer); Kleinrock 1975 (via indexed reviews).
- Gunther (1993) and the form of the USL: author's page; Condorcet (1785): catalog/Cambridge reissue (2014) — metadata, not a reading of the text.
- The empirical LLM results cited come from the `lit-*` cards (level `author-reported`) and were not reproduced here.
