---
id: H-12
title: "Parada sequencial calibrada para independência subestima o erro sob correlação"
area: hypothesis
evidence: hipotese
status: aberta
origin: "teoria (th-modelo §7.2; Wald) + literatura (lit-adaptive-consistency, lit-early-stopping-sc)"
experiment: "sims (já reproduzível em model.mjs: sprt_correlation) + observatory com parada por margem de votos"
tags: [sprt, parada-otima, self-consistency, erros-correlacionados]
sources:
  - "Wald, A. (1945). Sequential Tests of Statistical Hypotheses. Ann. Math. Statist. 16(2):117–186. doi:10.1214/aoms/1177731118"
  - "Wald, A. & Wolfowitz, J. (1948). Optimum Character of the Sequential Probability Ratio Test. Ann. Math. Statist. 19(3):326–339. doi:10.1214/aoms/1177730197"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-adaptive-consistency, lit-early-stopping-sc, H-05, H-08, H-01]
updated: 2026-11-07
summary: "Parar de amostrar quando a margem de votos parece suficiente funciona se os erros são independentes; com erros correlacionados a confiança é ilusória e o erro real é várias vezes o prometido."
---

# H-12 — Parada sequencial calibrada para independência subestima o erro sob correlação

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §7.2; Wald) + literatura (lit-adaptive-consistency, lit-early-stopping-sc)

## Enunciado
Um SPRT de margem m* = ⌈ln((1−α)/α)/ln(p0/(1−p0))⌉ aplicado a votos com correlação ρ tem erro realizado E_P[1/(1 + (P/(1−P))^{m*})] > α, e a vantagem da parada sequencial sobre o voto fixo de mesmo custo diminui com ρ.

## Variáveis
p, ρ, α, p0, teto de votos.

## Previsão (quantitativa/direcional)
- p = p0 = 0,7, α = 0,05 (m* = 4): erro realizado 0,03 / 0,09 / 0,14 / 0,20 / 0,24 para ρ = 0 / 0,05 / 0,1 / 0,2 / 0,3.
- Vantagem sobre voto fixo de mesmo nº médio de votos: 3× menos erro com ρ = 0; quase nula (0,239 vs 0,245) com ρ = 0,3.
- Inflar a margem usando ρ medido restaura o erro alvo a custo maior (proposta de correção).

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Erro realizado ≤ α nominal + 2 p.p. em tarefas com ρ̂ ≥ 0,1.

## Experimento proposto
Observatório: amostras sequenciais de A-low com regra de margem; comparar erro com testes ocultos; estimar ρ por tarefa.

## Evidência atual
Modelo (fórmula exata conferida por Monte Carlo, 40 000 tarefas). A literatura (relato-autores) mostra economia de amostras com perda pequena em média — o modelo prevê que a perda se concentre nas tarefas/benchmarks de ρ alto.

## Limites
Respostas binárias; LLMs com muitas respostas possíveis exigem SPRT multi-hipótese.
