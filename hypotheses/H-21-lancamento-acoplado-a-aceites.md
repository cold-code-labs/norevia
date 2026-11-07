---
id: H-21
title: "Lançar tentativas na proporção dos aceites recentes contrai o swarm sozinho em tarefas inviáveis"
area: hypothesis
evidence: hipotese
status: aberta
origin: "natureza (nat-candidatas C06; nat-interaction-rate-foraging — formigas colhedoras, Gordon et al. 2008; Prabhakar et al. 2012) + teoria (th-modelo §11)"
experiment: "sims (fluxo de subtarefas viáveis/inviáveis, regra x_{t+1} = ε + g·aceites) + observatory em fluxo de tarefas com parte inviável"
tags: [elastic-swarm, recrutamento, contracao, falso-sucesso]
sources:
  - "Harris, T. E. (1963). The Theory of Branching Processes. Springer. doi:10.1007/978-3-642-51866-9"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-candidatas, nat-interaction-rate-foraging, nat-clonal-expansion-contraction, sim-elastico, sim-clonal, H-05, H-13, H-24]
updated: 2026-11-07
summary: "Como formigas que saem para forragear na proporção das colegas que voltam com comida, lançar novas tentativas na proporção dos aceites recentes faz o swarm crescer onde há sucesso e murchar onde não há — sem estimar a dificuldade antes."
---

# H-21 — Lançar tentativas na proporção dos aceites recentes contrai o swarm sozinho em tarefas inviáveis

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-candidatas C06; nat-interaction-rate-foraging — formigas colhedoras, Gordon et al. 2008; Prabhakar et al. 2012) + teoria (th-modelo §11)

## Enunciado
Num fluxo de trabalho em que cada rodada lança x_t tentativas e a próxima lança x_{t+1} = ε + g·(aceites da rodada), a média segue x_{t+1} = ε + g·a·x_t com a = ps + (1−p)f. O swarm contrai para ε/(1 − g·a) se g·a < 1 e expande até o teto se g·a ≥ 1. Expandir nas viáveis e contrair nas inviáveis exige 1/(p·s) < g < 1/f; o falso aceite f limita o ganho utilizável.

## Variáveis
g (ganho de recrutamento), ε (piso de exploração), p, s, f, teto, janela de observação.

## Previsão (quantitativa/direcional)
- Inviáveis (p = 0, f = 0,05, ε = 0,2): ~0,21–0,25 chamada/rodada para g ∈ {1, 2, 4}, contra N chamadas de um swarm fixo (≥ 50% menos chamadas, critério de nat-C06).
- Viáveis com p = 0,7: g = 1 não expande (0,57/rodada); g ≥ 2 expande até o teto.
- Com f alto (p.ex. 0,25) e g = 4, as inviáveis deixam de contrair (g·f ≥ 1): desperdício explode.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Sem contração nas inviáveis com g·f < 1, ou atraso > 20% nas viáveis contra o melhor N fixo (critério de nat-C06).

## Experimento proposto
Simulação: fluxo misto viável/inviável, varrer g, ε e f. Observatório: lote de tarefas com fração sem solução aceitável (testes impossíveis), medir chamadas desperdiçadas e tempo até o 1º aceite.

## Evidência atual
Somente modelo (dinâmica média conferida em model.test.mjs). Fenômeno natural nos cartões nat-* (analogia). sim-elastico e sim-clonal testam regras elásticas aparentadas, não esta.

## Limites
Dinâmica média (sem flutuações); em fluxos curtos, a variância de x_t pode extinguir o recrutamento cedo demais (risco do piso ε baixo).
