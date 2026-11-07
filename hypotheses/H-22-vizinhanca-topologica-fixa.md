---
id: H-22
title: "Ler k pares fixos basta em macro-swarms — porque os erros são correlacionados"
area: hypothesis
evidence: hipotese
status: aberta
origin: "natureza (nat-candidatas C07; nat-topological-neighbors — estorninhos, Ballerini et al. 2008; Young et al. 2013) + teoria (th-modelo §11)"
experiment: "observatory: agregação com N ∈ {6, 12, 24} e leitura de k ∈ {2, 4, 6, N−1} pares; sims com ρ controlado"
tags: [topologia, comunicacao, macro-swarm, erros-correlacionados]
sources:
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-candidatas, nat-topological-neighbors, nat-physarum-network, H-07, H-11, H-01]
updated: 2026-11-07
summary: "Em grupos grandes, cada agente pode ler só alguns colegas: o modelo prevê que isso basta quando os erros são correlacionados (há pouco a ganhar lendo mais), mas não quando são independentes."
---

# H-22 — Ler k pares fixos basta em macro-swarms — porque os erros são correlacionados

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-candidatas C07; nat-topological-neighbors — estorninhos, Ballerini et al. 2008; Young et al. 2013) + teoria (th-modelo §11)

## Enunciado
Se cada agente decide pela maioria de si + k pares, o menor k que fica a 3 p.p. da leitura completa (k*) satura num valor pequeno independente de N quando ρ ≳ 0,3, e cresce com N quando ρ ≈ 0. O custo de leitura cai de N(N−1) para N·k*.

## Variáveis
N, k, p, ρ.

## Previsão (quantitativa/direcional)
- p = 0,7, ρ = 0,3: k* = 2, 2, 4, 4 para N = 7, 13, 25, 51.
- p = 0,6, ρ = 0: k* = 4, 10, 20, 38 (cresce com N).
- Discordância com nat-C07 ("k* ≤ 4 independente de N") prevista para ρ̂ ≈ 0.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
k* crescendo com N com ρ̂ ≥ 0,3; ou k* constante e pequeno com ρ̂ ≈ 0 (aí o mecanismo não é a correlação).

## Experimento proposto
Observatório/sims: medir ρ̂ por pares e a acurácia por (N, k).

## Evidência atual
Somente modelo. Fenômeno natural relatado em estorninhos (≈ 6–7 vizinhos topológicos; ótimo independente de N, segundo os cartões nat-*), que é analogia, não prova.

## Limites
Maioria simples; não modela propagação em múltiplas rodadas (cascatas de informação).
