---
id: nat-physarum-network
title: Physarum — a network that thickens with flow and shrinks without use
area: nature
realm: seen
evidence: natural-phenomenon
tags: [topology, communication-pruning, reinforcement-with-decay, cost-robustness]
sources:
  - "Tero, A., Takagi, S., Saigusa, T., Ito, K., Bebber, D. P., Fricker, M. D., Yumiki, K., Kobayashi, R. & Nakagaki, T. (2010). Rules for biologically inspired adaptive network design. Science 327(5964):439–442. doi:10.1126/science.1177894"
  - "Nakagaki, T., Yamada, H. & Tóth, Á. (2000). Maze-solving by an amoeboid organism. Nature 407:470. doi:10.1038/35035159"
related: [nat-pheromone-evaporation-aco, nat-stigmergy, lit-agentprune, lit-gptswarm, nat-candidates]
updated: 2026-11-07
verification: "Text of Tero 2010 read (PDF copy at pdodds.w3.uvm.edu, extracted locally; equations below checked). Nakagaki 2000: abstract (Semantic Scholar)."
summary: The slime mold connects 36 food sources on a map of Tokyo with cost, efficiency and fault tolerance comparable to those of the rail network, using only the local rule "a tube with flow thickens, a tube without flow shrinks".
---

## Mechanism
- **Experiment:** *Physarum polycephalum* connected a template of **36 food sources** positioned like the cities of the Tokyo region; the resulting network had cost (total length), transport efficiency and fault tolerance comparable to those of the real rail network, with about **30% of the maximum possible number of links**. The rail network had marginally better fault tolerance; Physarum, marginally lower cost.
- **Model (text checked):** Hagen–Poiseuille flow Q_ij = D_ij (p_i − p_j)/L_ij; at each step, a random source injects I₀ and another withdraws I₀. The conductance evolves by **dD_ij/dt = f(|Q_ij|) − D_ij**, with **f(|Q|) = |Q|^γ/(1 + |Q|^γ)** (sigmoid; γ controls the nonlinearity). The 2nd term is the constriction: **without flow, the tube disappears**.
- **Parameters:** I₀ = 2, γ = 1.8 gives networks similar to Physarum and the railway; I₀ = 0.20, γ = 1.15 gives a topology very close to the Tokyo railway. **Increasing I₀** creates alternative routes (more fault tolerance and efficiency, **higher cost**); **reducing I₀ or increasing γ** leads to the minimum spanning tree (cheap, fragile). Adding random links to the minimum tree gave networks with poor fault tolerance.
- Nakagaki et al. (2000): the organism finds the minimum-length path between two points in a maze.

## Evidence
`natural-phenomenon` (experiment) + `author-reported` (model).

## Engineering analogue
A communication graph between agents in which the weight of each edge (who reads whom) **grows with useful flow** — information that contributed to an acceptance — and **decays** without use; edges below a floor are pruned. I₀ (how much "flow" circulates per round) is the cost × robustness knob: more redundancy costs more tokens but tolerates a failed agent.

## Testable hypothesis
- **Variable:** topology — (A) complete (everyone reads everyone); (B) static random sparse with the same no. of edges as C; (C) adaptive Physarum-like (reinforcement by contribution to acceptance + decay), with I₀ ∈ {low, high}.
- **Metric:** communication tokens per acceptance; acceptance; drop in acceptance when 1 random agent is removed (fault tolerance).
- **Prediction:** C reaches acceptance ≥ A − 2 pp with ≤ 40% of A's communication tokens; C beats B in fault tolerance at the same cost; high I₀ increases tolerance and cost (monotonic relation, as in the model).
- **Refutation:** if C does not beat B (adaptivity irrelevant), or if the attribution of "contribution to acceptance" is so noisy that C ≈ B.

## Limits of transfer
Protoplasmic flow is conserved and measured locally without error; "the contribution of a message to an acceptance" requires credit assignment, which is difficult and expensive. The experiment optimizes physical transport, not reasoning.
