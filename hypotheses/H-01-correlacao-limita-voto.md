---
id: H-01
title: "Correlação de erros impõe teto ao ganho do voto majoritário"
area: hypothesis
evidence: hipotese
status: suportada-preliminar
origin: "teoria (th-modelo §2, §10.2) + literatura (Condorcet/Ladha; lit-correlated-errors; lit-sintese candidata 1) + natureza (nat-candidatas C01; nat-condorcet-correlated; cálculo em research/nature/calc)"
experiment: "sims/sim-voto-correlacionado (feito, no modelo) + observatory B-vote3/B-vote5 com repetições de A-low por tarefa para estimar ρ"
tags: [voto-majoritario, erros-correlacionados, condorcet]
sources:
  - "Condorcet (1785). Essai sur l'application de l'analyse à la probabilité des décisions rendues à la pluralité des voix. Paris: Imprimerie Royale."
  - "Ladha, K. K. (1992). The Condorcet Jury Theorem, Free Speech, and Correlated Votes. Am. J. Polit. Sci. 36(3):617ss. doi:10.2307/2111584"
  - "Berg, S. (1993). Condorcet's jury theorem, dependency among jurors. Soc. Choice Welf. 10(1). doi:10.1007/BF00187435"
  - "Kim, E., Garg, A., Peng, K. & Garg, N. (2025). Correlated Errors in Large Language Models. arXiv:2506.07962v1"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, sim-voto-correlacionado, lit-correlated-errors, lit-self-consistency, lit-more-agents, lit-great-models-think-alike, lit-sintese, nat-candidatas, nat-condorcet-correlated, nat-small-groups-correlated-cues, H-10, H-15, H-17, H-22]
updated: 2026-11-07
summary: "Com erros correlacionados (ρ > 0), somar votantes idênticos converge para um teto abaixo de 100%; acima de uma correlação pequena, 1 agente de esforço alto vence qualquer N."
---

# H-01 — Correlação de erros impõe teto ao ganho do voto majoritário

**Status:** `suportada-preliminar` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §2, §10.2) + literatura (Condorcet/Ladha; lit-correlated-errors; lit-sintese candidata 1) + natureza (nat-candidatas C01; nat-condorcet-correlated; cálculo em research/nature/calc)

## Enunciado
Para agentes idênticos com acerto médio p > ½ e correlação intra-classe ρ > 0 entre acertos na mesma tarefa, a acurácia do voto majoritário A_N cresce com N mas satura em A_∞ = 1 − I_{1/2}(a, b) (a = p(1−ρ)/ρ, b = (1−p)(1−ρ)/ρ) — ou no teto probit Φ(z_p/√ρ), conforme o modelo de dependência —, e o N ótimo por utilidade cai com ρ.

## Variáveis
p (acerto de 1 chamada), ρ (correlação de acertos entre execuções da mesma tarefa), N, V/c (valor do acerto / custo por agente).

## Previsão (quantitativa/direcional)
- A_N medido para N ∈ {15, 21, 31} fica abaixo do teto previsto pelo ρ medido + 3 p.p. (IC95%).
- p = 0,7: o ganho de N = 5 → 21 cai de +13,7 p.p. (ρ = 0) para +6,9 (ρ = 0,1) e +2,0 (ρ = 0,3); A_101 fica a < 1 p.p. do teto para ρ ≥ 0,1.
- Limiar solo → micro: o voto de 3 só compensa se V/c > 2/E[(2P−1)P(1−P)] (p = 0,7: 23,8 com ρ = 0; 59,4 com ρ = 0,3).
- N* (V = 100, c = 1, p = 0,7) = 9 / 5 / 3 para ρ = 0 / 0,1 / 0,3.
- Previsões concorrentes (nat-C01 vs th-modelo §11): a regra nat-C01 diz que N ≤ ⌈1/ρ̂⌉ obtém ≥ 90% do ganho possível; o modelo beta diz que obtém só 50–79% (p = 0,7, ρ = 0,1: N = 11 → 69%; 90% exige N = 43). O experimento decide entre as duas.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Acurácia do voto sistematicamente acima do teto previsto (> 3 p.p., IC95% excluindo) em ≥ 2 classes de tarefa; ou ρ medido ≈ 0 e mesmo assim saturação precoce (indicaria outro mecanismo, p.ex. heterogeneidade de dificuldade — H-10).

## Experimento proposto
Observatório: para cada tarefa, ≥ 10 execuções independentes de A-low (estimar p e ρ por pares) e B-vote3/B-vote5 (comparar com A_N previsto). Simulação: `sims/sim-voto-correlacionado` (já executada).

## Evidência atual
Modelo: teto e ganho marginal conferidos (model.test.mjs). Simulação `sim-voto-correlacionado` (validacao-local **no modelo**, pré-registrada): P1–P4 suportadas — ρ ≥ 0,075 já impede 64 agentes p = 0,6 de alcançar 1 agente p = 0,8. Literatura (`lit-correlated-errors`, relato-autores): quando dois LLMs erram, escolhem a mesma resposta errada ≈ 60% das vezes (HELM; acaso ≈ 1/3), e a correlação cresce com a acurácia — no modelo, K_eff ≈ 1,7, perto do pior caso binário (th-modelo §10.2). O cálculo independente do agente de natureza (`research/nature/calc/teoria-coletiva.js`) reproduz o mesmo teto beta-binomial (p = 0,6, ρ = 0,1 → 0,736). **Sem medição local em LLM** — por isso "preliminar".

## Limites
Resposta binária (pior caso). Erros dispersos favorecem pluralidade: teto 1 − I_{1/(1+K_eff)}(a,b) (th-modelo §10.2); no MATH (Monkeys) o voto em ~41% implica K_eff ≈ 9,4.
