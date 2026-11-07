---
id: H-14
title: "Reparo com teto R* calculável vence tentativas ilimitadas ou tetos fixos grandes"
area: hypothesis
evidence: hipotese
status: aberta
origin: "teoria (th-modelo §7.5) + missão Norevia (reparo delimitado com retorno ao repouso) + literatura (lit-selfheal)"
experiment: "observatory A-low-loop com teto variável R ∈ {1,2,4,8}; medir q_j por tentativa"
tags: [healing-limitado, reparo, parada-otima, responsabilidade-persistente]
sources:
  - "Chow, Y. S. & Robbins, H. (1963). On optimal stopping rules. Z. Wahrscheinlichkeitstheorie 2(1):33–49. doi:10.1007/BF00535296"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-selfheal, lit-mast, lit-s1-budget-forcing, nat-wound-healing-resolution, H-05]
updated: 2026-11-07
summary: "Tentativas de conserto rendem cada vez menos; parar quando a chance da próxima tentativa não paga custo e risco de regressão dá um teto calculável que evita ciclos sem fim."
---

# H-14 — Reparo com teto R* calculável vence tentativas ilimitadas ou tetos fixos grandes

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §7.5) + missão Norevia (reparo delimitado com retorno ao repouso) + literatura (lit-selfheal)

## Enunciado
Se a probabilidade de a j-ésima tentativa de reparo corrigir decai geometricamente (q_j = q1 δ^{j−1}) e cada tentativa custa c e regride com prob. g (perda L_reg), a política de 1 passo ("tentar enquanto V q_j > c + g L_reg") é ótima e dá R*; tetos acima de R* aumentam custo e regressões sem ganho relevante de aceite.

## Variáveis
q1, δ, c, g, L_reg, V.

## Previsão (quantitativa/direcional)
- δ̂ < 1 (retornos decrescentes) nas tentativas de reparo de LLM.
- V = 10, c = 1, g = 0,05, L_reg = 10: q1 = 0,6 → R* = 2 (δ = 0,4), 4 (δ = 0,7), 14 (δ = 0,9).
- Aceite(R = 8) − aceite(R = R*) < 3 p.p., com custo ≥ 1,5×, quando δ̂ ≤ 0,7.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
δ̂ ≥ 1 (tentativas não perdem eficácia) ou ganho de aceite > 5 p.p. acima de R*.

## Experimento proposto
Observatório: A-low-loop com teto R e registro de cada tentativa (teste antes/depois, regressões).

## Evidência atual
Somente modelo (R* conferido contra busca exaustiva). `lit-selfheal` relata que o crítico acrescenta poucos casos (relato-autores).

## Limites
q_j pode não ser geométrico (p.ex. salto após mudança de estratégia/diagnóstico).
