---
id: nat-army-ant-living-bridges
title: Army-ant living bridges — structure built from workers and moved by a cost–benefit trade-off
area: nature
realm: seen
evidence: natural-phenomenon
tags: [self-assembly, cost-benefit, adaptive-structure, no-global-information, army-ants]
sources:
  - "Reid, C. R. et al. (2015). Army ants dynamically adjust living bridges in response to a cost–benefit trade-off. PNAS. doi:10.1073/pnas.1512241112"
related: [nat-interaction-rate-foraging, nat-inactive-reserve, nat-physarum-network, nat-stigmergy]
updated: 2026-11-08
verification: "Abstract read (OpenAlex). Full text not read; numeric results (bridge lengths, traffic levels, model parameters) NOT checked → gap."
summary: Eciton army ants link their bodies into bridges across gaps in the foraging trail and keep lengthening, widening and relocating them with traffic and geometry; the final position balances faster trails against workers withdrawn from foraging, with no individual knowing the global costs or benefits.
---

## Mechanism
- Bridges of linked individuals span gaps in the colony's trail. **Field experiments show the ants continuously modify them**: they lengthen, widen and change position in response to traffic levels and environmental geometry (abstract).
- Ants initiate bridges where the path deviates from the incoming direction and move them over time to create shortcuts over large gaps.
- The final position depended on traffic intensity and path deviation and was shaped by a **colony-level cost–benefit trade-off**: the benefit of a more efficient trail versus the cost of removing workers from the foraging pool. A model that maximises foraging rate qualitatively matched the observed bridge movement, "without any individual unit's having information on global benefits or costs" (abstract).

## Evidence
`natural-phenomenon` (field experiments plus a model, author-reported).

## Engineering analogue
**Build structure only while it pays:** an intermediate artefact (shared scaffold, cache, coordinator) is worth keeping only while the work saved exceeds the workers withdrawn to maintain it; its position and size should track the traffic it serves. Test by pricing the cost of any coordinating structure in agent-hours, not only in output quality.

## Testable hypothesis
- **Variable:** a shared coordinating component (e.g. planner/indexer) held fixed vs resized with request volume.
- **Metric:** throughput per total agent-cost.
- **Prediction:** the adaptive version wins when load varies; refuted if resizing overhead exceeds the savings.

## Limits of transfer
The ants' units are physically linked bodies; the "cost" is real foraging labour. Agents pay token cost, not displacement, and nothing here shows intelligence beyond local rules.
