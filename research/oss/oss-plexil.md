---
id: oss-plexil
title: PLEXIL — plan executive with per-node state machine, checked conditions and quiescence loop
area: oss
evidence: observed-implementation
tags: [plan-execution, state-machine, postcondition, quiescence, mutex, priority, nasa, c-plus-plus]
sources:
  - "https://github.com/plexil-group/plexil/tree/0e7439fbcf9061b90e35a00e82ebdfa8257609f2 (inspected commit, shallow clone on 2026-11-07)"
  - "https://plexil-group.github.io/plexil_docs/index.html (official documentation linked in README.md:L5; consulted on 2026-11-07)"
related: [oss-buzz, oss-selfheal, oss-langgraph-supervisor, oss-matrix, oss-patterns]
updated: 2026-11-07
summary: The PLEXIL executive evaluates, per node, Start/End/Pre/Post/Invariant/Exit/Skip/Repeat conditions in an 8-state state machine. It records a failed postcondition as a mechanical outcome, arbitrates mutexes and variables by priority and runs a quiescence loop with no micro-step limit. It is neither a swarm nor an LLM system.
---

## Identification
- URL: https://github.com/plexil-group/plexil. It is the repository linked by the previous study; `nasa/PLEXIL` did not clone in this round.
- Full SHA: `0e7439fbcf9061b90e35a00e82ebdfa8257609f2`. Commit date: 2026-05-12T11:33:34-07:00.
- License: `LICENSE` is **3-clause BSD**, "Copyright (c) 2006-2020, Universities Space Research Association (USRA). All rights reserved.". It has the three conditions (retention of the notice, reproduction in binary form, not using the USRA name for endorsement) and the notice "PROVIDED BY USRA ``AS IS''". There is also `src/COPYING` with the same template, but dated "2006-2016" and with content different from `LICENSE` (`diff -q`). I did not detail the differences.
- Scope actually read:
  - Top-level files: `LICENSE`, `README.md:L1-L60`, `CAVEATS:L1-L40`, `doc/README`, `src/COPYING:L1-L5`.
  - Values: `src/value/NodeConstants.hh:L30-L179`.
  - Node core: `src/exec/NodeImpl.hh:L60-L115`; `src/exec/NodeImpl.cc:L50-L70, L570-L830, L1028-L1410`.
  - Executive: `src/exec/PlexilExec.cc:L55-L95, L183-L240, L240-L430, L500-L670, L790-L830`.
  - Node types: `src/exec/ListNode.cc:L236-L330, L655-L680, L725-L772`; `src/exec/CommandNode.cc:L44-L90, L160-L200, L396-L420`; `src/exec/AssignmentNode.cc:L114-L140` (grep).
  - Utilities: `src/utils/LinkedQueue.hh:L465-L490`.
  - Tests: function names in `src/exec/test/exec-test-module.cc`.
  - `index.html` page of the official documentation.

## Mechanism
PLEXIL **is neither a multi-agent system nor an LLM system**: it is a language of hierarchical plans (a tree of nodes) and the executive that interprets them. "Swarm" items are n/a or analogues.

1. **Communication topology.** **[code]** It is a parent→children tree. Children inherit conditions from the ancestor: `AncestorExit` = Exit OR the parent's AncestorExit, `AncestorInvariant` = Invariant AND AncestorInvariant, `AncestorEnd` (`src/exec/ListNode.cc:L242-L308`). Notification is event-driven: a node whose condition changes enters the candidate queue (`src/exec/NodeImpl.cc:L574-L621`). The external world enters through commands, lookups and the dispatcher (`PlexilExec.cc:L666-L670`).
2. **Who decides who acts.** **[code]** The central executive (`PlexilExecImpl::step`) evaluates `getDestState()` for each candidate (`src/exec/PlexilExec.cc:L303-L324`). When the transition to EXECUTING requires resources (mutex or assignment variable), the node goes to a **pending queue ordered by priority** (`PlexilExec.cc:L84, L509-L512, L794-L802`). `resolveResourceConflicts` walks this queue by priority band and transitions those that can acquire (`PlexilExec.cc:L588-L647`). The default priority is `WORST_PRIORITY = 100000` (`src/exec/NodeImpl.hh:L66-L72`). Insertion is stable, so ties follow arrival order (`src/utils/LinkedQueue.hh:L478-L490`). Assignment variables are also resources (`AssignmentNode.cc:L114-L140`). Acquiring a mutex already held by an ancestor is a plan error (`NodeImpl.cc:L637-L659`).
3. **Termination criterion.** **[code]**
   - **States** (8 + sentinel): `INACTIVE, WAITING, EXECUTING, ITERATION_ENDED, FINISHED, FAILING, FINISHING` (`src/value/NodeConstants.hh:L47-L57`).
   - **Conditions**: `Skip, Start, Pre, Exit, Invariant, End, Post, Repeat`, plus the internal `ActionComplete` and `AbortComplete` (`src/exec/NodeImpl.hh:L86-L113`; names in `NodeImpl.cc:L53-L69`).
   - **Defaults**:
     - Without `StartCondition`, the node starts (the test only blocks if the condition exists; `NodeImpl.cc:L1087-L1097`).
     - In a List node without `EndCondition`, the default End is "all children FINISHED" (`AllFinished`, `ListNode.cc:L295-L298, L320-L323`).
     - In a Command node, End is combined by OR with "interruptible command handle" (DENIED/FAILED/INTERFACE_ERROR) (`CommandNode.cc:L55-L71, L174-L187`).
     - Without `RepeatCondition`, ITERATION_ENDED goes to FINISHED; with Repeat true, the node returns to WAITING (`NodeImpl.cc:L1346-L1369`). **There is no ceiling on repetitions**: one exists only if the plan author writes one.
   - **Quiescence loop**: the macro-step repeats micro-steps until the state-change queue is empty or a command/update to dispatch appears (`PlexilExec.cc:L282-L406`). **There is no micro-step limit.** The code contains `// TODO: instrument high-water-mark of max nodes transitioned in this step` (`PlexilExec.cc:L381`). The loop also ends when all plans finish (`allPlansFinished`, `PlexilExec.cc:L195-L215`).
4. **Mechanical verification/acceptance.** **[code]** The executive applies the checks on its own:
   - A false precondition leads to ITERATION_ENDED/FAILURE/`PRE_CONDITION_FAILED` (`NodeImpl.cc:L1098-L1108`).
   - A false invariant during execution leads to `INVARIANT_CONDITION_FAILED` (`NodeImpl.cc:L1211-L1224`).
   - On reaching End, the **PostCondition** is evaluated. If it is false or unknown, the outcome is `FAILURE_OUTCOME`/`POST_CONDITION_FAILED`; otherwise, `SUCCESS_OUTCOME`. This holds for the empty node (`NodeImpl.cc:L1236-L1246`), Command (`CommandNode.cc:L402-L417`) and List (`ListNode.cc:L660-L675`).
   - Available outcomes and failure types: `SUCCESS/FAILURE/SKIPPED/INTERRUPTED` and `PRE_CONDITION_FAILED, POST_CONDITION_FAILED, INVARIANT_CONDITION_FAILED, PARENT_FAILED, EXITED, PARENT_EXITED` (`NodeConstants.hh:L93-L145`).
   - The postcondition is mechanical acceptance, but it is **written by the plan author**. Without Post, the node ends with SUCCESS (including a Command whose handle was `COMMAND_FAILED`, which satisfies End via `CommandHandleInterruptible`). This is a case of "success" without verification. Inference from reading `CommandNode.cc:L55-L71` and `L402-L417`; not tested.
5. **Technical cost/budget control.** Not found in the inspected code (search: `budget`, `limit`, `max`, `timeout`, `retry` in `src/exec`). Mutex and priority arbitrate access, not cost. `COMMAND_DENIED` ("Insufficient resources") comes from the external interface (`CommandNode.cc:L59`), not from an executive budget.
6. **Memory.** n/a in the multi-agent sense. **[code]** On repeat, the node is reset (`NodeImpl.cc:L1384-L1386`), and finished plans can be removed (`deleteFinishedPlans`, `PlexilExec.cc:L225-L240`). There is no history window to bound.
7. **Failures/retry.** **[code]**
   - There is no automatic retry of node or command (search `retry` in `src/exec`: only "retry resource acquisition", `NodeImpl.cc:L752, L761`).
   - Failure is propagated **downward**: a false invariant in the ancestor leads the child to `PARENT_FAILED`, and an exit in the ancestor leads to `PARENT_EXITED` (`NodeImpl.cc:L1166-L1208`; `ListNode.cc:L461-L524`).
   - A List in FAILING waits for its children to become WAITING or FINISHED before concluding (`ListNode.cc:L731-L772`).
   - Recovery comes from plan patterns (Repeat, conditions that read outcomes), not from the executive. I did not find automatic propagation of child failure to the parent in the path read. With the default End `AllFinished` and without Post, the parent can end SUCCESS even with a FAILURE child (inference from `ListNode.cc:L295-L298, L660-L675`; not tested).
8. **Communication pruning.** n/a (there is no channel between agents). The analogue would be execution pruning: `Skip`/`AncestorExit`/`AncestorInvariant`/`AncestorEnd` end subtrees as SKIPPED while still in WAITING (`NodeImpl.cc:L1032-L1085`).
9. **Elastic vs fixed.** **[code]** Each plan's tree is fixed once loaded. New root plans can be added at runtime with `addPlan` (`PlexilExec.cc:L183-L193`), but that is a host decision, not demand-driven adaptation.
10. **Cost vs quality benchmark.** Absent. There are state-transition tests (**[test]** `src/exec/test/exec-test-module.cc`, e.g.: `waitingDestTest`, `listFinishingDestTest`, which checks `POST_CONDITION_FAILED` at L888) and regression directories in `test/`. Read only by name; nothing executed.

**Determinism (docs vs implementation).**
- **[docs]** The official page states: "It is compact, semantically clear, and deterministic given the same sequence of events from the external world." (`plexil_docs/index.html`, consulted on 2026-11-07). The repository does not contain this claim: the search for `determinis` in `.md/.txt/.dox/.hh/.cc` outside `third-party` returned nothing.
- **[code]** What supports the claim in the code read:
  - FIFO queues (`LinkedQueue`) for candidates and state changes (`PlexilExec.cc:L81-L93`);
  - pending queue with stable insertion by priority (`LinkedQueue.hh:L478-L490`);
  - external effects deferred to the end of the macro-step (`PlexilExec.cc:L403-L418`);
  - no source of randomness found (search `rand(`).
- I did not check whether the insertion order in the candidate queue depends on anything beyond the sequence of events, such as listener order. For this reason I do not fully confirm determinism.

## Evidence
- **Observed implementation:** the state machine, the conditions, the outcomes and failure types, the evaluation of Pre/Post/Invariant by the executive, the default End of List, the arbitration of mutexes and variables by priority, and the quiescence loop with no ceiling.
- **Agency report/docs:** determinism given the same sequence of external events. Use in missions and tests: Distributed Spacecraft Autonomy payload on the Starling swarm ("demonstrating distributed reactive autonomy"); LADEE (experiment that did not fly); EDSN; HDU/Desert RATS; ISS (simulation); DAME; K10. All according to `index.html`, without independent verification.
- **Gaps:** the translator, the XML parser, the external interface (`src/intfc`, `src/app-framework`) and the semantics of Update/LibraryCall were not read; `nasa/PLEXIL` was not compared.
- No code was executed or compiled; no benchmark reproduced.

## Engineering analogue
**Engineering hypothesis; spacecraft and robotics semantics do not transfer automatically to LLMs.** For the Swarm Efficiency Observatory, PLEXIL offers a ready-made **node contract**: Pre (can it start?), Invariant (can it continue?), End (has it finished?) and Post (is the result acceptable?), with distinct failure types. This makes it possible to separate, in the report, "agent stopped" from "result accepted". The quiescence loop is a model for synchronous rounds of N agents, in which nothing external is dispatched until the round stabilizes. The absence of a ceiling on micro-steps and repetitions shows what an LLM orchestrator needs to add: a limit on rounds and on cost. Mutex arbitration by priority with FIFO tie-breaking is a deterministic model for "who acts" on a shared resource, such as a repository file.

## Testable hypothesis
1. **Hypothesis:** in a multi-agent orchestrator in which each subtask has a mechanical Post (tests) and a typed outcome as in PLEXIL, the rate of reported false success (task marked as completed without passing the final verifier) drops to ≤1%, against the baseline without Post per subtask. Metrics: false success and cost per accepted task.
2. **Hypothesis:** arbitrating writes to shared files with a priority mutex and FIFO tie-breaking reduces rework from edit conflicts among N agents by ≥50%, without raising median latency by more than 20%. Metric: reverted edits per accepted task and latency.

## Limits/gaps
- It is not a swarm: the pruning, elasticity and memory columns are mostly n/a.
- Acceptance depends on the author writing Post. The default (without Post) is SUCCESS.
- Determinism was only partially checked in the code ("Determinism" item).
- The divergence between `LICENSE` (2006–2020) and `src/COPYING` (2006–2016) was not detailed.
- The mission reports come from the agency or the documentation, not reproduced.

## Matrix row
| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| ✓ End/Repeat with defaults (`ListNode.cc:L295-L298`, `NodeImpl.cc:L1346-L1369`); quiescence with no micro-step ceiling (`PlexilExec.cc:L282-L406`) | ✓ Post/Pre/Invariant evaluated by the executive and converted into `POST_CONDITION_FAILED` etc. (`NodeImpl.cc:L1236-L1246`); depends on Post written by the author | — no cost, time or repetition limit in the executive (search `budget/limit/retry`) | n/a there is no channel between agents; execution-pruning analogue via Skip/AncestorExit (`NodeImpl.cc:L1032-L1085`) | — fixed tree per plan; `addPlan` only by the host (`PlexilExec.cc:L183-L193`) | n/a no history; reset on Repeat (`NodeImpl.cc:L1384-L1386`) | BSD-3-Clause, © 2006-2020 USRA (`LICENSE`) |
