---
id: H-03
title: "Em tarefas acopladas, 1 agente com esforço alto vence a decomposição"
area: hypothesis
evidence: hipotese
status: em-teste
origin: "teoria (th-modelo §6, §4) + literatura (lit-sas-equal-thinking-budget, lit-scaling-agent-systems; lit-sintese candidata 3) + documento norteador ("bugs interdependentes")"
experiment: "observatory A-high vs C-decompose em tarefas b* com bugs acoplados (variar χ)"
tags: [decomponibilidade, reasoning-effort, bugs-interdependentes]
sources:
  - "Kim, Y. et al. (2025). Towards a Science of Scaling Agent Systems. arXiv:2512.08296v3"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-sas-equal-thinking-budget, lit-scaling-agent-systems, lit-rethinking-bounds-discussion, lit-mast, lit-sintese, H-04, H-09]
updated: 2026-11-07
summary: "Quando os subproblemas dependem uns dos outros acima de um limiar que cai com o número de partes, dividir entre agentes perde informação nas interfaces e 1 agente com raciocínio alto vence."
---

# H-03 — Em tarefas acopladas, 1 agente com esforço alto vence a decomposição

**Status:** `em-teste` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §6, §4) + literatura (lit-sas-equal-thinking-budget, lit-scaling-agent-systems; lit-sintese candidata 3) + documento norteador ("bugs interdependentes")

## Enunciado
Para uma tarefa com k subproblemas e fração χ de pares acoplados, a decomposição entre k agentes vence 1 agente de mesmo orçamento só se χ < χ* = [(k−1)ln(1−ι) + k ln(q_solo/q_split) − ln q_int] / [C(k,2) ln(1−μ)] ≈ 2ι/(kμ). Para χ > χ*, A-high vence em aceite e em custo por acerto.

## Variáveis
k, χ, ι (interferência de contexto no solo), μ (perda por interface), q_int, orçamento E.

## Previsão (quantitativa/direcional)
- Com ι = 0,08, μ = 0,15: χ* ≈ 0,45 (k = 2), 0,25 (k = 3), 0,14 (k = 4), ≈ 0,01 (k = 6) — χ* cai ∝ 1/k.
- Em tarefas com bugs interdependentes (χ alto), aceite(A-high) − aceite(C-decompose) > 0 e cresce com k.
- Repasses e retrabalho (falhas de interface, categorias MAST de especificação/coordenação) concentram-se em C-decompose nas tarefas acopladas.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
C-decompose com aceite ≥ A-high (IC95%) em tarefas com χ ≥ 0,5 e k ≥ 3; ou ausência de tendência com χ.

## Experimento proposto
Observatório: pares de tarefas com o mesmo k e χ controlado (bugs independentes vs bugs cuja correção depende de invariantes compartilhadas); A-high vs C-decompose vs A-mid; ≥ 10 repetições. Estimar ι e μ por ablação (solo com 1 vs k partes; split com/sem contrato de interface).

## Evidência atual
Observatório: smoke (4 execuções) e piloto (45 execuções; aceite 100% em todas as arquiteturas, inclusive b01/b02 — efeito teto, sem tarefas acopladas difíceis o bastante) — sem conclusão. Literatura (relato-autores): `lit-sas-equal-thinking-budget` e `lit-scaling-agent-systems` relatam agente único igualando/superando MAS em tarefas sequenciais/multi-hop a orçamento igual (agente único vence a partir de ~500 thinking tokens; −70% do MAS em planejamento sequencial no PlanCraft, segundo Kim et al.).

## Limites
Perdas multiplicativas independentes; não modela reparo de interface nem acoplamento de ordem superior.
