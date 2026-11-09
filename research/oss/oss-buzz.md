---
pivot: archive
pivot_reason: "Historical, robotic or unavailable implementation; retain without prominent cyber recommendation."
id: oss-buzz
title: Buzz — VM and language for robot swarms with dynamic swarms, situated neighborhood and virtual stigmergy
area: oss
evidence: observed-implementation
tags: [swarm-robotics, virtual-stigmergy, gossip, dynamic-membership, last-writer-wins, message-queue, c]
sources:
  - "https://github.com/buzz-lang/Buzz/tree/49ea418d2c3177355d1e993ac58bd5862b39232e (inspected commit, shallow clone on 2026-11-07)"
  - "https://github.com/MISTLab/Buzz (resolves to the same commit 49ea418d2c3177355d1e993ac58bd5862b39232e, checked by the orchestrator)"
  - "Pinciroli, C.; Beltrame, G. Buzz: An Extensible Programming Language for Self-Organizing Heterogeneous Robot Swarms. arXiv:1507.05946 (2015; version not recorded). https://arxiv.org/abs/1507.05946"
related: [oss-stigmergic, oss-plexil, oss-selfheal, oss-agentprune, oss-matrix, oss-patterns]
updated: 2026-11-07
summary: Buzz implements in C a per-robot VM with dynamic-membership swarms, a neighborhood rebuilt at every step and per-key last-writer-wins virtual stigmergy, propagated by gossip with message coalescing; it has no task termination criterion, acceptance or cost benchmark.
---

## Identification
- URL: https://github.com/buzz-lang/Buzz (the `MISTLab/Buzz` mirror points to the same commit).
- Full SHA: `49ea418d2c3177355d1e993ac58bd5862b39232e`; commit date: 2026-04-01T16:45:09-04:00 (`git log -1 --format=%cI`).
- License: `LICENSE.txt` contains "Copyright (c) 2015 Carlo Pinciroli" followed by the permissive text in MIT/Expat form ("Permission is hereby granted, free of charge…"). The file **does not use the name "MIT"**, and `README.md` does not declare a license: the only occurrence of "MIT" is "MIT Technology Review" (`README.md:L61`). The "MIT declared" label from the previous study is, therefore, a classification of the text, not a declaration by the repository.
- Scope actually read: `LICENSE.txt`; `README.md`; `TODO`; `doc/concepts/basics.md` (excerpts L20–L45); `doc/api.md` (swarm, stigmergy and neighbors sections, L886–L1015); `src/buzz/buzzvstig.h` and `buzzvstig.c` (in full); `src/buzz/buzzvm.c:L1-L30, L236-L505, L553-L557` (message processing); `src/buzz/buzzoutmsg.c` (in full); `src/buzz/buzzinmsg.c` (in full); `src/buzz/buzzswarm.c:L205-L617`; `src/buzz/buzzneighbors.c:L29-L170`; `src/buzz/buzzrun.c:L60-L133`; `src/buzz/argos/buzz_controller.cpp:L538-L580, L740-L870`; `src/testing/teststigmergy.bzz:L1-L40`. I did not read the parser, assembler, heap/GC or the other ARGoS controllers.

## Mechanism
Buzz is not an LLM multi-agent system: it is a language with a VM (BVM) in C, and **every robot runs the same bytecode** (**[docs]** `doc/concepts/basics.md:L23`). Execution advances in *steps* — sensors, received messages, a portion of the script, sending and actuation — and the step size is up to the integrator (**[docs]** `doc/concepts/basics.md:L27`).

1. **Communication topology.** Situated communication, described as "gossip-based" (**[docs]** `doc/concepts/basics.md:L30`). **[code]** The `neighbors` table is cleared and rebuilt at every step from the packets actually received, with distance, azimuth and elevation (`src/buzz/buzzneighbors.c:L67-L131`; the ARGoS integration calls `buzzneighbors_reset` and `buzzneighbors_add` in `src/buzz/argos/buzz_controller.cpp:L758-L772`). The VM core does not define range: the topological constraint comes from the host's sensor/radio (in ARGoS, the range-and-bearing). Message types propagate differently:
   - `neighbors.broadcast` is **single-hop**. The receiver calls the listener and does not re-enqueue the message (`src/buzz/buzzvm.c:L251-L274`).
   - Virtual stigmergy is **multi-hop**: each robot that accepts a newer PUT re-enqueues it to its neighbors (`src/buzz/buzzvm.c:L300-L305`).
   - A QUERY about an unknown stigmergy is forwarded onward (`src/buzz/buzzvm.c:L363-L367`).
2. **Who decides who acts.** **[code]** Each robot decides for itself. `swarm.select(cond)` records membership from a local condition (`src/buzz/buzzswarm.c:L450-L476`), and `swarm.exec(f)` only executes the closure if the robot is a member (`src/buzz/buzzswarm.c:L481-L518`). The `union`/`intersection`/`difference` operations build derived swarms from local membership (`src/buzz/buzzswarm.c:L554-L614`). There is no coordinator or central allocation.
3. **Termination criterion.** **[code]** The only termination is the program's: `buzzrun` runs `buzzvm_step` while the state is `READY` and reports `DONE` or an error (`src/buzz/buzzrun.c:L96-L126`). In ARGoS, `step()` is called at every tick; an error halts execution for that robot (`src/buzz/argos/buzz_controller.cpp:L546-L560`). There is no convergence or task-completed criterion; that is left to the user's script. There is also no instruction limit per step: the call `buzzvm_function_call(..., "step", 0)` runs until it returns (`buzz_controller.cpp:L549`).
4. **Mechanical verification/acceptance.** Not found in the inspected code (search: `accept`, `verify`, `check` in `src/buzz/*.c`). There is deterministic conflict resolution in the stigmergy (item 6), but that is data consistency, not result acceptance.
5. **Technical cost/budget control.**
   - **[code, ARGoS integration]** Per step, each robot sends **a single packet** of the size of the range-and-bearing actuator (`m_pcRABA->GetSize()`). Messages leave the queue until the buffer is full; what does not fit stays in the queue for the next step. A message larger than the buffer is **discarded** with the log "Discarded oversize message" (`src/buzz/argos/buzz_controller.cpp:L803-L838`). This is a bandwidth ceiling enforced by the code.
   - **[code, core]** The outgoing (`src/buzz/buzzoutmsg.c:L96-L111`) and incoming (`src/buzz/buzzinmsg.c:L20-L34`) queues are dynamic arrays **with no maximum capacity**.
   - Send order follows a fixed priority: BROADCAST > SWARM_LIST > VSTIG_PUT > VSTIG_QUERY > SWARM_JOIN > SWARM_LEAVE (`src/buzz/buzzoutmsg.c:L365-L441`).
   - **[docs]** The `TODO` itself records "bandwidth is limited and volatile" as an open problem (`TODO`, item "Information aggregation is an issue").
6. **Memory.**
   - **[code]** Virtual stigmergy is a key→(data, `uint16_t` timestamp, robot) dictionary (`src/buzz/buzzvstig.h:L14-L31`), with no capacity or eviction. An entry is only removed when someone does `put(k, nil)`, which also propagates a tombstone with timestamp+1 (`src/buzz/buzzvstig.c:L222-L233`).
   - Consistency is **per-key last-writer-wins**:
     - `put` increments the key's counter (`buzzvstig.c:L214-L220`);
     - the receiver accepts if the remote timestamp is greater (`buzzvm.c:L300-L306`);
     - with equal timestamps and different robots, it calls the user's `onconflict` or the default "highest robot id wins", preferring the non-nil value (`buzzvstig.c:L590-L608`);
     - the loser receives `onconflictlost` (`buzzvm.c:L319-L329`).
   - The header calls the timestamp a "Lamport clock" (`buzzvstig.h:L17`), but the code works as a per-key version counter, not as a global logical clock. **[docs]** `doc/api.md:L950` calls the structure a CRDT. **[hypothesis]** The `uint16_t` can wrap around after 65535 writes to the same key, and the `<` comparison in `buzzvm.c:L301` does not handle this case. Not tested.
   - **[code]** Knowledge about the membership of **other** robots has explicit aging: each entry gains +1 age per step and is removed above `MEMBERSHIP_AGE_MAX = 50` (`src/buzz/buzzswarm.c:L209-L248`, called in `buzzvm.c:L484-L485`). The neighborhood is recreated at every step (item 1).
7. **Failures/retry.**
   - **[code]** There is no ACK or retransmission. A malformed message generates a warning and is discarded (`src/buzz/buzzvm.c:L280-L283, L292-L296, L437-L450`).
   - Recovery comes from two implicit repair mechanisms:
     - (a) `get(k)` emits a QUERY with the local value. A neighbor with a newer version responds with a PUT, and a neighbor with an older version updates itself (`buzzvstig.c:L445-L483`; `buzzvm.c:L386-L398`). In practice, this is read-triggered anti-entropy.
     - (b) The robot's swarm list is retransmitted every `SWARM_BROADCAST_PERIOD = 10` steps (`buzzvm.c:L21, L491-L500`): soft state that compensates for lost JOIN/LEAVE messages and combines with the 50-step aging.
   - An error in the VM ends execution for that robot, with no automatic restart (`buzz_controller.cpp:L549-L559`).
   - **[code]** Incoming dequeue takes the **last** message from the first sender found in the hash table (`buzzinmsg.c:L48-L64`), i.e., LIFO per sender. The consequences were not assessed.
8. **Communication pruning.** **[code]**
   - Coalescing in the outgoing queue: for each (stigmergy, key), only the newest message stays in the queue; the older one is removed (`src/buzz/buzzoutmsg.c:L337-L359`).
   - JOIN/LEAVE for the same swarm cancel out and are deduplicated, and are absorbed by a pending SWARM_LIST (`buzzoutmsg.c:L182-L306`).
   - A received PUT with an equal or older version is ignored and not forwarded (`buzzvm.c:L337-L341, L426-L430`), which contains flooding.
   - Broadcast is not forwarded (item 1).
9. **Elastic vs fixed.** **[code]** Swarm membership changes at runtime by local condition (`join`/`leave`/`select`, `src/buzz/buzzswarm.c:L377-L476`) and the neighborhood changes at every step. **[docs]** `doc/api.md:L921` documents `unselect`, which is **not** registered in the method table (`buzzswarm.c:L257-L262`). `doc/api.md:L971-L972` describes `onconflict`/`onconflictlost` with text copied from `create` (divergence between docs and code).
10. **Cost vs quality benchmark.** Absent from the repository. There are `.bzz` test scripts (e.g.: **[test]** `src/testing/teststigmergy.bzz:L11-L40`, which exercises `onconflict`) and a C++ unit test for types (`src/testing/unittest/buzztype_test.cpp`, not read). Nothing was executed.

## Evidence
- **Observed implementation:** LWW stigmergy with tie-break by id and callbacks; multi-hop propagation with coalescing; dynamic swarms with soft state and aging (50 steps, rebroadcast every 10); per-step byte ceiling in the ARGoS integration; no capacity in the core queues.
- **Author report/docs:** "gossip-based" (`basics.md:L30`); "CRDT" (`api.md:L950`); self-organization through a "purely distributed" runtime (`README.md`); publications listed in the README without performance numbers in the repository.
- **Gaps:** no benchmark or bandwidth measurement; I did not read the paper (arXiv 1507.05946, version not recorded) in this round; the behavior after timestamp wrap-around and the effect of LIFO on input were not checked.
- No code was executed or compiled; no benchmark reproduced.

## Engineering analogue
**Engineering hypothesis; robotic semantics do not transfer automatically to LLMs.** For the Swarm Efficiency Observatory (1 strong agent vs N agents on verifiable tasks, with cost per accepted task), three Buzz mechanisms are candidates:
- (i) **per-round bandwidth ceiling with a queue and discarding of oversize messages**, as a budget of tokens exchanged between agents per round;
- (ii) **per-key coalescing**, in which only the newest version of a fact goes onto the channel, reducing redundant messages;
- (iii) **soft state with aging**, which allows subgroup membership without a coordinator and corrects losses through periodic retransmission.

LWW with tie-break by id is cheap, but silently discards concurrent work. In LLMs, a "lost conflict" may be precisely the correct answer, so the tie-break should consult the verifier, not the id.

## Testable hypothesis
1. **Hypothesis:** on a shared board among N LLM agents, coalescing writes by key (only the most recent version circulates) reduces tokens exchanged per accepted task by ≥30% without reducing the acceptance rate by more than 2 pp compared with full broadcast. Metrics: communication tokens per accepted task and mechanical acceptance rate.
2. **Hypothesis:** resolving write conflicts with the mechanical verifier, instead of LWW by id, increases the acceptance rate with an extra verification cost smaller than the gain in cost per accepted task. Metric: cost per accepted task (US$ or tokens) and false success.

## Limits/gaps
- The bandwidth ceiling is in the ARGoS integration (`buzz_controller.cpp`), not in the VM; other integrations (ROS, Khepera) were not read.
- There is no task termination criterion, acceptance or compute budget per step.
- The docs diverge from the code (`unselect`, description of `onconflict`).
- The license text is MIT/Expat without naming it; I did not consult SPDX or GitHub metadata.
- Performance reported in publications was not checked.

## Matrix row
| Explicit termination | Verifiable acceptance | Technical budget (not just prompt) | Communication pruning | Elastic (size adapts) | Bounded memory | License |
|---|---|---|---|---|---|---|
| — only end of bytecode/error (`buzzrun.c:L96-L126`); `step()` per tick with no task criterion | — no acceptance; LWW (`buzzvstig.c:L590-L608`) is consistency, not verification | ✓ partial: 1 fixed-size packet per step and discarding of oversize messages in the ARGoS integration (`buzz_controller.cpp:L803-L838`); core with no limit | ✓ per-key coalescing (`buzzoutmsg.c:L337-L359`), old PUT not forwarded (`buzzvm.c:L337-L341`), single-hop broadcast | ✓ `join`/`leave`/`select` at runtime (`buzzswarm.c:L377-L476`); neighborhood recreated per step | ✓ partial: other robots' memberships expire in 50 steps (`buzzswarm.c:L209-L248`); stigmergy and queues with no limit | Unnamed MIT/Expat text, © 2015 Carlo Pinciroli (`LICENSE.txt`) |
