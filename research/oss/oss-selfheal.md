---
pivot: adapt
pivot_reason: "Failure diagnosis or repair can inform recovery design; requires defensive tasks and independent verification."
id: oss-selfheal
title: SelfHeal — ReAct fixer + separate LLM critic in up to 3 attempts, no test execution in the loop
area: oss
evidence: observed-implementation
tags: [bug-repair, fixer-critic, llm-judge, react, dataset, agentdefect, no-verifiable-acceptance, no-budget]
sources:
  - "https://github.com/Laboratory-software-Innovation/SelfHeal/tree/812e6a3252a45d102a652695673010e4ca8c8807 (inspected commit, shallow clone on 2026-11-07)"
  - "SelfHeal: Empirical Fix Pattern Analysis and Bug Repair in LLM Agents, arXiv 2604.17699v1 (preprint Apr 2026; pointed to by the previous study; not cited in the repo README; not read in this inspection)"
related: [oss-stigmergic, oss-symbiont, oss-metagpt, oss-chatdev-macnet, oss-autogen, oss-matrix, oss-patterns]
updated: 2026-11-07
summary: Single script in which a fixer agent proposes code and a separate LLM critic decides ACCEPT/REJECT in up to 3 attempts; the dataset tests are read as text and never executed, and the "Resolved" in the spreadsheets comes from a process outside the repo.
---

## Identification

- URL: https://github.com/Laboratory-software-Innovation/SelfHeal
- Inspected SHA: `812e6a3252a45d102a652695673010e4ca8c8807`
- Commit date (`git log -1 --format=%cI`): 2026-04-19T16:00:09-04:00
- License: **MIT License**, "Copyright (c) 2026 Laboratory-software-Innovation", read at `LICENSE:L1-L3` (21 lines, standard MIT text). The README does not declare a license (`README.md`, 39 lines) **[README/docs]**.
- Scope actually read: `run_agent.py` (in full, 465 lines), `README.md`, `LICENSE`, `requirements.txt`, `preproceesing/readme.md`, `preproceesing/*.py` (search for CSV files and models). Listing of `AgentDefect.zip` with `zipinfo`, without extracting, and reading of `AgentDefect/76062338/{readme.md,test.py}` with `unzip -p`. Imports of `run_fixed.py` of the 37 cases, by search. XML of `Detailed Result.xlsx` (sheet names, headers, sum of the "Resolved" column) and strings of `Agreement Scores.xlsx`/`Fix Patterns.xlsx`. Nothing from the repo was executed or installed.

## Mechanism

1. **Communication topology.** Sequential pipeline of two agents per attempt: `create_fix_agent()` → `create_critic_agent()`, both LangGraph `create_react_agent` (`run_agent.py:L232-L278`) **[code]**. There is no direct message between them. The code passes through a global variable `CURRENT_FIXED_CODE`, written by the tool `submit_fixed_code` (`run_agent.py:L143-L150`) and read by `generate_diff` and `validate_fixed_code` (`run_agent.py:L153-L197`) **[code]**. The critic's verdict **does not return to the fixer**: the `fix_prompt` is identical in all attempts (`run_agent.py:L306-L323`) and each attempt creates new agents (`run_agent.py:L303`, `L331`) **[code]**.
2. **Who decides who acts.** Fixed order in code: fixer and then critic, per attempt (`run_agent.py:L300-L381`) **[code]**. Fixer tools: `web_search` (excludes stackoverflow.com, `run_agent.py:L57`), `list_fix_patterns`, `get_fix_pattern_summary` and `submit_fixed_code` (`run_agent.py:L247-L252`). Critic tools: `generate_diff`, `validate_fixed_code` and `verify_api_usage` (`run_agent.py:L272-L276`) **[code]**. Both use the **same model** with `temperature=0`: `google/gemini-3-pro-preview` via OpenRouter if a key is present, otherwise `gpt-5.2` (`run_agent.py:L237-L245`, `L262-L270`) **[code]**.
3. **Termination criterion.** `max_attempts: int = 3` (`run_agent.py:L281`, `L300`). The loop stops at the first critic whose output contains the substring `"ACCEPT"` (`run_agent.py:L394-L406`); otherwise it returns `FAILED` (`run_agent.py:L408-L419`) **[code]**. The inner ReAct loop of each agent is consumed by `stream(...)` without `recursion_limit` or `config` (`run_agent.py:L325-L329`, `L377-L381`). The inner limit depends on the library default, not checked here **[code]**. Fragility: any response that mentions "ACCEPT", for example quoting the output of the tool `validate_fixed_code` before concluding REJECT, ends as accepted (inference from `L197` + `L394`).
4. **Mechanical verification/acceptance.** **No test is executed.** `test.py` is read as text and pasted into the critic's prompt (`run_agent.py:L97-L111`, `L334-L355`) **[code]**. The tool `validate_fixed_code` is only a string heuristic: it rejects if there is no `"def "` or if `"return"` is missing when the test contains `assert` (`run_agent.py:L176-L197`) **[code]**. `verify_api_usage` does a web search and returns snippets for the LLM to interpret (`run_agent.py:L200-L229`) **[code]**. Acceptance is, therefore, an **LLM-judge** (critic) with a trivial syntactic check. The "Resolved" in the spreadsheets is not produced by the script, which only writes `ACCEPTED`/`FAILED` to `results/<id>_result.txt` (`run_agent.py:L436-L462`); the process that generated "Resolved" is not in the repo **[code]/[README/docs]**. In the data, `test.py` imports `run_fixed` (the reference fix), not the candidate, and calls a real LLM checking for a substring in the output (`AgentDefect/76062338/test.py`, lines 2 and 19-21 of the file inside the zip) **[test]**.
5. **Technical cost/budget control.** No token/cost limit — not found (search: `budget`, `cost`, `token`, `max_tokens`, `recursion`). The only limits are `max_attempts=3` (which counts attempts, not cost), `timeout=10` and `num=5` in the web search (`run_agent.py:L38-L47`) **[code]**. The spreadsheets record "Attempts" and "Time" per case, but not tokens or cost (`Detailed Result.xlsx`, header ID/Localized/Line/Function/Component/Resolved/Attempts/Time) **[README/docs]**.
6. **Memory.** There is no memory between attempts or between cases: agents are recreated at each attempt (`run_agent.py:L303`, `L331`), `CURRENT_FIXED_CODE` is reset only at the start of the case (`run_agent.py:L286`) **[code]**. Side effect (inference): if the fixer of attempt *k* does not call `submit_fixed_code`, the critic evaluates the code from the previous attempt. The "knowledge" comes from a CSV of fix patterns (`FIX_PATTERN_PATH`, `run_agent.py:L18`, `L114-L140`) generated offline by an LLM in preprocessing (`preproceesing/make_rules.py:L9-L11`, `L51`, model `o3-mini`) **[code]**.
7. **Failures/retry.** The retry is the repetition of attempts itself, with an identical prompt and `temperature=0` (`run_agent.py:L300-L323`, `L239`). There is no feedback from the critic, so diversity between attempts depends on the provider's non-determinism (inference) **[code]**. Tool errors become strings ("Error ...", `run_agent.py:L35-L50`, `L84-L94`). A missing `run_buggy.py` does not interrupt the case: the string `"Error run_buggy.py missing"` enters the prompt as if it were the code (`run_agent.py:L88-L89`, `L295`, `L312-L315`) **[code]**. Resumption: cases with an already recorded result are skipped (`run_agent.py:L430-L433`) **[code]**.
8. **Communication pruning.** Not applicable: there are 2 fixed agents and no removal of messages. Context is discarded at each attempt by recreation, not by pruning **[code]**.
9. **Elastic vs fixed.** Fixed: 1 fixer + 1 critic per attempt (`run_agent.py:L303`, `L331`) **[code]**.
10. **Cost vs quality benchmark.** There is no cost. The quality data are in `Detailed Result.xlsx`, with 8 sheets. Count I made by reading the XML (sum of the "Resolved" column, without executing repo code): `results-agent-gpt` 20/37, `results-agent-gemini` **22/37**, `results-agent-claude` 21/37, `zero-shot-claude` 15/37, `results-zero-shot-gpt` 12/37, `swe-gpt5.2` 14/36, `no-web-search` 17/37, `No-pattern` 15/36 **[README/docs: author data]**. The model used in the `no-web-search`/`No-pattern` ablations and the criterion for "Resolved" are not documented in the repo.

## Evidence

- **Observed implementation:** fixer→critic loop with `max_attempts=3`, acceptance by the substring `"ACCEPT"`, no test execution, same model in both roles (items 1–4).
- **Dataset (data, not code):** `AgentDefect.zip` has 37 case directories (36 Stack Overflow post IDs + `hf-26`). Each has `test.py`, `run_fixed.py`, `requirements.txt` and `readme.md`; `run_buggy.py` exists in 36 (absent in `hf-26`) (via `zipinfo`). By imports in `run_fixed.py`: 29 cases use `langchain` (1 of them with `langgraph`), 6 use `llama_index` and 2 have no framework detected by the search. The `requirements.txt` files appear to be the same environment dump (LangChain and LlamaIndex packages in almost all), so they do not indicate the case's framework.
- **Reproducibility (static reading):** `run_agent.py` expects `Fix-Agent/Dataset-Benchmark/<id>/` and two CSVs (`run_agent.py:L16-L20`) that are not in the repo. The zip has root `AgentDefect/`. `make_rules.py` writes `fix_pattern_rules.csv` (`preproceesing/make_rules.py:L11`), but the script reads `fix_pattern_summaries.csv` (`run_agent.py:L18`). `langgraph` is imported (`run_agent.py:L12`) but is not listed in `requirements.txt`. The print uses a fixed `total_cases = 10`, although the loop goes through all cases (`run_agent.py:L424-L434`).
- **Author report:** models cited in the README (GPT-5.2, Gemini 3 Pro, Claude Sonnet 4) (`README.md:L30-L33`); paper numbers not checked.
- No code was executed; no benchmark reproduced.

**Comparison with the previous study (A4 Master, rev. 2):**
- **Confirmed:** fixer agent + separate critic (`run_agent.py:L232-L278`); AgentDefect with 37 cases, mostly LangChain/LlamaIndex (29 + 6 by imports); the best result 22/37 matches the `results-agent-gemini` sheet.
- **Refinements/corrections:** (i) "37 executable cases" holds for the data: the tests exist, but they import `run_fixed` and call a real LLM. The repair loop executes **nothing**, and one case (`hf-26`) has no `run_buggy.py`. (ii) The license, which the previous study did not read, is **MIT** (`LICENSE`). (iii) The critic is the same model as the fixer, and the verdict does not return to the fixer, so "separate critic" means a separate role, not an independent model or signal. (iv) The paper is not cited in the README; the arXiv reference comes only from the previous study.

## Engineering analogue

*(engineering hypothesis)* For the Swarm Efficiency Observatory, SelfHeal is an "N=2 with LLM critic" configuration to be compared directly with "1 strong agent + executed test as acceptance". The dataset itself already provides the buggy/fixed pair and a `test.py` per case. Replacing `if "ACCEPT" in critic_output` with "execute `test.py` against the candidate" would turn the loop into verifiable acceptance and would make it possible to measure cost per accepted task and the **critic's false-acceptance** rate (ACCEPT with a failed test). The `zero-shot-*` sheets (12–15/37) vs `results-agent-*` (20–22/37) already suggest the gain from the agentic loop, but with no associated cost.

## Testable hypothesis

1. *(hypothesis)* On AgentDefect, the fraction of cases `ACCEPTED` by the critic that fail when `test.py` is executed against the final code is ≥ 20%. Metric: false acceptance = (ACCEPTED ∧ test fails) / ACCEPTED; falsifiable if < 5%.
2. *(hypothesis)* Returning the critic's verdict to the fixer and accepting by executed test increases resolved cases per US$ relative to the current loop (identical prompt, `temperature=0`) with the same `max_attempts=3`. Metric: cases with a passing test / total cost in tokens; falsifiable if the ratio does not improve.

## Limits/gaps

- I did not read the paper; the spreadsheet numbers were counted by me in the XML (sum of 0/1 in column E, excluding the header row) and may differ from what the paper reports.
- I did not read the preprocessing scripts line by line (`create_env.py` creates venvs and runs `pip`, according to the search: `preproceesing/create_env.py:L35-L43`).
- I do not know how "Resolved", "Localized" and "Attempts" were annotated (manually? test execution outside the repo?).
- `Fix Patterns.xlsx` (sheets StackOverflow/Commits/Issues/Hugginface) and `Agreement Scores.xlsx` were seen only through their headers.

## Matrix row

| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ — `max_attempts=3` and stop at the first `"ACCEPT"` (`run_agent.py:L281`, `L300`, `L394-L406`); inner ReAct loop without explicit `recursion_limit` (`L325-L329`) | — — LLM critic decides by substring (`run_agent.py:L394`); `validate_fixed_code` only checks `"def "`/`"return"` (`L176-L197`); `test.py` only enters as text in the prompt (`L334-L355`) | — — no token/cost limit; only attempts (`L281`) and web search timeout (`L47`) | — — 2 fixed agents; context discarded by recreation, not pruned (`L303`, `L331`) | — — 1 fixer + 1 critic fixed (`L232-L278`) | — — no memory between attempts/cases; 1-slot global state (`L26-L27`, `L286`) | MIT (`LICENSE:L1-L3`) |
