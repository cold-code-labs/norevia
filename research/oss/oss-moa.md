---
pivot: archive
pivot_reason: "Generic aggregation or forecasting is peripheral to collective defence; retain as historical comparison."
id: oss-moa
title: Mixture-of-Agents (Together) — layers of LLM proposers aggregated by a synthesis prompt
area: oss
evidence: observed-implementation
tags: [llm, mixture-of-agents, aggregator, fixed-layers, llm-as-judge, retry-backoff, no-cost-accounting]
sources:
  - "https://github.com/togethercomputer/MoA/tree/1b5cab0f0905d9da821e37322ac6df96ba65e1a7 (inspected commit, shallow clone on 2026-11-07)"
  - "Wang, J.; Wang, J.; Athiwaratkun, B.; Zhang, C.; Zou, J. Mixture-of-Agents Enhances Large Language Model Capabilities. arXiv:2406.04692 (2024; cited in README.md:L4, L153-L159; version not recorded). https://arxiv.org/abs/2406.04692"
related: [oss-gptswarm, oss-agentprune, oss-camel, oss-autogen, oss-matrix, oss-patterns]
updated: 2026-11-07
summary: MoA calls a fixed list of proposer models in parallel or in sequence for a fixed number of layers and injects the responses into a synthesis system prompt for an aggregator; it has retry with backoff, but no mechanical acceptance, budget or cost measurement, and quality is evaluated only by LLM judges.
---

## Identification
- URL: https://github.com/togethercomputer/MoA
- Full SHA: `1b5cab0f0905d9da821e37322ac6df96ba65e1a7`; commit date: 2025-01-06T22:21:19-05:00.
- License: `LICENSE` is the text of the **Apache License, Version 2.0, January 2004** (225 lines; I read the header L1-L3). `README.md:L145-L147` also declares Apache 2.0.
- Scope actually read:
  - in full: `utils.py`, `moa.py`, `advanced-moa.py`, `bot.py`, `generate_for_alpaca_eval.py`, `run_eval_*.sh`, `tests.py`, `README.md`, `requirements.txt`;
  - by grep and excerpts: `generate_for_mt_bench.py`, `generate_for_flask.py`, `eval_mt_bench.py:L138-L240`, `FLASK/gpt_review/gpt4_eval.py`, `alpaca_eval/src/alpaca_eval/decoders/openai.py`;
  - `outputs/*.json`: record count and `generator` field.
- The vendored folders `alpaca_eval/`, `FastChat/` and `FLASK/` are third-party code with modifications (`README.md:L78-L81`) and were not read in full.

## Mechanism
1. **Communication topology.** **[code]** It is a layered network, fully connected between consecutive layers, with no communication within a layer. Each proposer in layer *i+1* receives all responses from layer *i*, numbered, in a system prompt (`utils.py:L137-L160`). The final aggregator receives the responses of the last layer in the same way.
   - **[example]** `moa.py`: 4 proposers called with `asyncio.gather` (`moa.py:L10-L15, L38`), followed by 1 aggregator (`moa.py:L16, L39-L46`).
   - **[example]** `advanced-moa.py`: `layers = 3`, i.e., 1 initial layer, `layers-2` intermediate layers and the aggregator (`advanced-moa.py:L21, L64-L83`).
2. **Who decides who acts.** **[code]** No one decides at runtime: the proposer lists and the aggregator are fixed. Defaults:
   - `moa.py:L10-L16`: Llama-3.3-70B, Qwen2.5-72B, Qwen2.5-Coder-32B and WizardLM-2-8x22B; aggregator Qwen2.5-72B.
   - `bot.py:L34-L39, L86`: Qwen2-72B, Qwen1.5-72B, Mixtral-8x22B and DBRX; aggregator Qwen2-72B.
   - Evaluation scripts, 6 references: WizardLM-2-8x22B, Qwen1.5-110B, Qwen1.5-72B, Llama-3-70B, Mixtral-8x22B and DBRX; aggregator Qwen1.5-72B-Chat (`run_eval_alpaca_eval.sh:L5-L12`, `run_eval_mt_bench.sh`, `run_eval_flask.sh`).
3. **Termination criterion.** **[code]** Depth is fixed: `rounds=1` by default in `bot.py:L90`, `generate_for_alpaca_eval.py:L78`, `generate_for_flask.py:L90` and `generate_for_mt_bench.py:L185`; `layers=3` in `advanced-moa.py:L21`. The rounds loop is in `generate_for_alpaca_eval.py:L33-L60`. The README says "num rounds == num of MoA layers - 1" (`README.md:L72`). There is no stopping on quality or consensus.
4. **Mechanical verification/acceptance.** Not found in the inspected code (search: `verify`, `assert`, `check`, `score` in top-level `*.py`). The aggregator receives only the textual instruction "critically evaluate… some of it may be biased or incorrect" (`utils.py:L144-L146`), which is prompt text, not verification. Evaluation is **offline and by LLM judge**:
   - MT-Bench with `--judge-model` default `gpt-4` (`eval_mt_bench.py:L184`);
   - FLASK with `gpt-4-0613` (`FLASK/gpt_review/gpt4_eval.py:L134`);
   - AlpacaEval against the outputs of `gpt4_1106_preview` (`run_eval_alpaca_eval.sh:L14`).
5. **Technical cost/budget control.** **[code]**
   - There is only a **per-call** cap, via `max_tokens`: 2048 in `utils.py:L17, L103, L167`; 512 in `moa.py:L29`, `advanced-moa.py:L54` and `bot.py:L89`.
   - In the AlpacaEval script, the aggregator is called without `temperature` or `max_tokens` and inherits 0.7/2048 (`generate_for_alpaca_eval.py:L62-L66`).
   - The number of calls is implicit: (no. of proposers × rounds) + 1 per item. There is no token counting, pricing or total budget (search: `cost`, `price`, `usage`, `prompt_tokens` in the top-level `.py` files).
   - The vendored `alpaca_eval` computes `price_per_example` for its decoders and annotators (`alpaca_eval/src/alpaca_eval/decoders/openai.py:L33, L166-L175, L296-L299`), but MoA generation uses `utils.generate_together` and does not go through that path.
6. **Memory.**
   - **[code]** The evaluation pipeline is stateless per item.
   - **[example]** `bot.py` with `multi_turn=True` appends each user instruction and each final response to the history of all proposers, **with no window or truncation** (`bot.py:L155-L158, L210-L214`).
   - The only handling of context overflow is reactive: an `invalid_request_error` from the API makes `generate_together` return `None` (`utils.py:L47-L51`).
7. **Failures/retry.** **[code]**
   - `generate_together` makes up to 6 attempts with fixed backoff of 1, 2, 4, 8, 16 and 32 s, catches any exception (`utils.py:L24-L63`) and returns `None` if exhausted (`utils.py:L65-L67`).
   - `generate_openai` has the same loop, but no guard after exhaustion: `output` is undefined before `.strip()` (`utils.py:L110-L132`). This is an inference from reading (probable `UnboundLocalError`), not tested.
   - **[example]** `moa.py` and `advanced-moa.py` retry only on `RateLimitError`, 3 times (1/2/4 s). If all fail, `response` is undefined (`moa.py:L21-L35`; `advanced-moa.py:L33-L61`).
   - **[code]** Proposers that return `None` are **discarded** from the reference list (`generate_for_alpaca_eval.py:L52-L54`; likewise `generate_for_mt_bench.py:L130-L132`, `generate_for_flask.py:L61`). In `bot.py`, `None` is not filtered (`bot.py:L68-L82, L180`) and may enter the prompt as text (inference from `utils.py:L150`).
8. **Communication pruning.** — There is no policy-based pruning. The only thing that occurs is discarding a proposer that failed (item 7). All valid responses are concatenated in full.
9. **Elastic vs fixed.** Fixed: model lists and number of layers defined before execution (items 2–3).
10. **Cost vs quality benchmark.**
    - **[README/author report]** 65.1% on AlpacaEval 2.0 versus 57.5% for GPT-4 Omni, "using only open-source models" (`README.md:L25, L130`); FLASK described qualitatively (`README.md:L137`); figures in `assets/`.
    - **[example]** The reproduction scripts exist (`run_eval_*.sh`), and `outputs/Qwen-72B-round-1.json` and `outputs/Qwen-72B-round-2.json` contain 805 generations each, with `generator` = `Qwen/Qwen1.5-72B-Chat-together`. The repository contains no scores for these outputs nor cost or latency data.
    - **Cost vs quality is not measured in the repository.**
    - **[test]** `tests.py` compares exact strings from live APIs at temperature 0 (`tests.py:L13-L21, L42-L50`). It is non-hermetic and was not run.
    - Divergence between README and code: `README.md:L68, L73` cites `--aggregator` and `--num_proc`, but `bot.py:main` only accepts `model, reference_models, temperature, max_tokens, rounds, multi_turn` (`bot.py:L85-L92`).

## Evidence
- **Observed implementation:** fixed layered topology, identical aggregation prompt in `utils.py` and in the examples, retry with backoff, discarding of failed proposers, per-call cap only, and no cost accounting.
- **Author report:** gains on AlpacaEval 2.0, MT-Bench and FLASK (README and paper arXiv:2406.04692, not read in this round). All measured by LLM judges, with no mechanical verification of correctness.
- **Gaps:** cost per response and per quality point absent; there is no comparison with 1 strong model at equal cost.
- No code was run or compiled; no benchmark reproduced.

## Engineering analogue
**Engineering hypothesis.** MoA is the natural baseline for "N agents" in the Swarm Efficiency Observatory: N proposers × L layers + 1 aggregator costs about N·L+1 calls and more context at each layer, because the previous responses are concatenated. The Observatory can measure what the repository does not:
- cost per accepted task versus 1 strong agent, on tasks with a mechanical verifier (tests, exact check) rather than an LLM judge;
- whether the aggregator selects or synthesizes the correct answer when it is among the references.

Discarding a failed proposer is a cheap bounded repair. The lack of pruning (full concatenation) is the main cost driver.

## Testable hypothesis
1. **Hypothesis:** on tasks with a mechanical verifier, MoA 6×1+1 with the scripts' defaults has a cost per accepted task ≥3× that of 1 strong model, with an acceptance-rate gain <5 p.p. Metrics: tokens/US$ per accepted task and acceptance rate.
2. **Hypothesis:** replacing the aggregator's synthesis with "check each reference with the verifier and return the first accepted one, synthesizing only if none passes" reduces cost per accepted task by ≥40% without loss of acceptance. Metrics: the same, plus the fraction of cases resolved without calling the aggregator.

## Limits/gaps
- The paper was not read; the README numbers were not verified.
- The vendored code (`alpaca_eval`, `FastChat`, `FLASK`) was not audited.
- The failures in `generate_openai` and in the examples are inferences from reading.
- The default models may be discontinued at the provider; this was not verified.

## Matrix row
| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ fixed depth: `rounds=1` (`generate_for_alpaca_eval.py:L78`), `layers=3` (`advanced-moa.py:L21`); no stopping on quality | — synthesis prompt only (`utils.py:L144-L146`); offline evaluation by GPT-4 judge (`eval_mt_bench.py:L184`) | — only per-call `max_tokens` (`utils.py:L17`); no budget or accounting | — full concatenation; only discards a proposer with `None` (`generate_for_alpaca_eval.py:L52-L54`) | — fixed lists and layers (`moa.py:L10-L16`) | — multi-turn history grows without a window (`bot.py:L155-L158, L210-L214`) | Apache-2.0 (`LICENSE:L1-L3`; `README.md:L147`) |
