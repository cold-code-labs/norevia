---
id: H-17
title: "O limiar de capacidade acima do qual cooperar deixa de compensar depende do mecanismo de agregação"
area: hypothesis
evidence: hipotese
status: aberta
origin: "literatura (lit-scaling-agent-systems: retornos decrescentes acima de ~45%; lit-sintese candidata 1) + teoria (th-modelo §10.1)"
experiment: "observatory: estratificar tarefas por p̂ do agente único; medir ganho de A-low-loop/C-elastic (seleção por testes) e de B-vote3 vs p̂"
tags: [limiar-de-capacidade, lei-da-eficiencia-coletiva, linha-de-base-kim]
sources:
  - "Kim, Y. et al. (2025). Towards a Science of Scaling Agent Systems. arXiv:2512.08296v3"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-scaling-agent-systems, lit-sas-vs-mas-hybrid, lit-more-agents, lit-sintese, H-01, H-02]
updated: 2026-11-07
summary: "O limiar de ~45% de acerto do agente único relatado por Kim et al. pode não ser uma constante: o modelo prevê pico do ganho de cooperar perto de 50% quando a cooperação é "mais tentativas + verificação" e perto de 79% quando é voto."
---

# H-17 — O limiar de capacidade acima do qual cooperar deixa de compensar depende do mecanismo de agregação

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** literatura (lit-scaling-agent-systems: retornos decrescentes acima de ~45%; lit-sintese candidata 1) + teoria (th-modelo §10.1)

## Enunciado
O ganho absoluto de acrescentar o 2º agente verificado é g(p) = ps(1−f) − p²s(s−f) (pico em p* = (1−f)/(2(s−f))); o do 3º votante é (2p−1)p(1−p) (pico em (3+√3)/6 ≈ 0,79). Logo, o limiar de capacidade a partir do qual cooperar rende cada vez menos depende do mecanismo; o ganho relativo ao agente único cai monotonicamente com p em ambos.

## Variáveis
p̂ do agente único por tarefa, mecanismo (seleção verificada vs voto), s, f, ρ.

## Previsão (quantitativa/direcional)
- Seleção verificada: ganho absoluto máximo para p̂ ∈ [0,4; 0,6] (p* = 0,50 com verificador perfeito; 0,56 com s = 0,9, f = 0,05).
- Voto 1 → 3: ganho máximo para p̂ ∈ [0,7; 0,85].
- Ganho relativo (sobre o agente único) decrescente em p̂ nos dois mecanismos.
- Refinamento da linha de base: incluir o mecanismo como moderador melhora a previsão do ganho em relação a usar só P_SA (comparar R² fora da amostra com a forma de Kim et al.).

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Picos dos dois mecanismos indistinguíveis (diferença < 0,1 em p̂, IC95%), ou ganho absoluto monotônico em p̂.

## Experimento proposto
Observatório: tarefas com p̂ variado (10 execuções de A-low por tarefa); comparar o ganho de seleção por testes e de voto por faixa de p̂. Implicação de desenho: o piloto teve aceite 100% em todas as arquiteturas (p̂ ≈ 1), região em que o modelo prevê ganho ≈ 0 para qualquer swarm; são necessárias tarefas com p̂(A-low) entre 0,2 e 0,8.

## Evidência atual
Somente modelo (pico conferido numericamente). O número de ~45% é relato de Kim et al. (lit-scaling-agent-systems) sobre arquiteturas MAS reais, não sobre este mecanismo isolado; não reivindicamos novidade sobre a existência do limiar.

## Limites
Kim et al. medem arquiteturas completas (com comunicação e orquestração), não mecanismos puros; a comparação é de direção.
