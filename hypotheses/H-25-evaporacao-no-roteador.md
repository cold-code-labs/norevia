---
id: H-25
title: "Roteador reforçado por aceites precisa de decaimento: sem ele, a readaptação cresce com o histórico"
area: hypothesis
evidence: hipotese
status: aberta
origin: "natureza (nat-candidatas C10; nat-pheromone-evaporation-aco; nat-physarum-network) + teoria (th-modelo §8, §11)"
experiment: "sims (roteador entre configurações com mudança abrupta de distribuição) + observatory com troca de mistura de tarefas no meio do fluxo"
tags: [roteamento, estigmergia, lock-in, memoria-limitada]
sources:
  - "Dorigo, M., Maniezzo, V. & Colorni, A. (1996). Ant system. IEEE Trans. SMC-B 26(1):29–41. doi:10.1109/3477.484436"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-candidatas, nat-pheromone-evaporation-aco, nat-physarum-network, sim-estigmergia, H-07, H-16]
updated: 2026-11-07
summary: "Um roteador que só acumula sucessos fica preso ao passado: depois de uma mudança, ele leva um tempo proporcional a todo o histórico para se readaptar; com decaimento, leva um tempo fixo, pagando um pouco de ruído."
---

# H-25 — Roteador reforçado por aceites precisa de decaimento: sem ele, a readaptação cresce com o histórico

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-candidatas C10; nat-pheromone-evaporation-aco; nat-physarum-network) + teoria (th-modelo §8, §11)

## Enunciado
Se os pesos do roteador são médias acumuladas de aceites, após uma mudança abrupta o passado pesa menos de 10% só depois de 9·T0 tarefas (T0 = histórico). Com EWMA de taxa λ, depois de ln 0,1/ln(1−λ) tarefas, independente de T0. O preço é ruído estacionário ∝ λ/(2−λ); existe λ* que equilibra os dois (como o λ* da §8).

## Variáveis
λ (ou meia-vida), T0, taxa de mudança da distribuição, ruído do sinal de aceite.

## Previsão (quantitativa/direcional)
- T0 = 500: t90 = 4.500 (sem decaimento) vs 229 / 45 / 22 / 10 com λ = 0,01 / 0,05 / 0,1 / 0,2 — razão de 20× a 436× (nat-C10 pede ≥ 3×).
- Perda estacionária (sem mudança) cresce com λ; com λ ≤ 0,05, ≤ 5% (critério de nat-C10) se o ruído do aceite for moderado.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Readaptação sem decaimento independente do histórico T0; ou qualquer λ > 0 custando > 5% em regime estacionário.

## Experimento proposto
Simulação de roteador bandit-like com mudança abrupta; observatório trocando a mistura (fáceis → acopladas) no meio do lote.

## Evidência atual
Somente modelo (fórmulas conferidas). sim-estigmergia (validacao-local no modelo) relata, num problema análogo de busca, que sem evaporação o rastro cresce sem limite e episódios posteriores ficam mais lentos (P4 suportada) — apoio indireto.

## Limites
Mudança abrupta única; mudanças graduais favorecem λ menor.
