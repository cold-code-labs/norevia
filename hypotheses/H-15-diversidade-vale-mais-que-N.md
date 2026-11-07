---
id: H-15
title: "Reduzir correlação (diversidade) rende mais que aumentar N — se a qualidade individual não cair"
area: hypothesis
evidence: hipotese
status: aberta
origin: "teoria (th-modelo §2) + literatura (lit-correlated-errors, lit-diversity-of-thought; contraponto lit-self-moa)"
experiment: "observatory B-vote5 homogêneo vs heterogêneo (prompts/abordagens/modelos diferentes) vs B-vote com N maior"
tags: [diversidade, erros-correlacionados, voto-majoritario]
sources:
  - "Ladha, K. K. (1992). The Condorcet Jury Theorem, Free Speech, and Correlated Votes. Am. J. Polit. Sci. 36(3):617ss. doi:10.2307/2111584"
  - "Kim, E., Garg, A., Peng, K. & Garg, N. (2025). Correlated Errors in Large Language Models. arXiv:2506.07962v1"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-correlated-errors, lit-great-models-think-alike, lit-diversity-of-thought, lit-self-moa, lit-hong-page-diversity, lit-diverse-debate-hegazy, nat-candidatas, H-01, H-20]
updated: 2026-11-07
summary: "Cinco agentes que erram de jeitos diferentes valem mais que vinte que erram igual — desde que a diversidade não venha à custa de agentes muito piores."
---

# H-15 — Reduzir correlação (diversidade) rende mais que aumentar N — se a qualidade individual não cair

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §2) + literatura (lit-correlated-errors, lit-diversity-of-thought; contraponto lit-self-moa)

## Enunciado
Para p fixo, ∂A_N/∂ρ domina ∂A_N/∂N fora do regime de ρ ≈ 0: com p = 0,7, reduzir ρ de 0,3 para 0,1 em N = 5 dá +5,0 p.p. (0,744 → 0,794), enquanto ir de N = 5 para N = 21 em ρ = 0,3 dá +2,0 p.p. (0,744 → 0,765). A troca compensa enquanto a queda de p dos membros diversos for menor que o ganho via ρ.

## Variáveis
p_i (por membro), ρ (homogêneo vs heterogêneo), N.

## Previsão (quantitativa/direcional)
- Painel heterogêneo de 5 com p̂ médio ≥ p̂_homogêneo − 3 p.p. supera homogêneo de 15–21.
- Se p̂ cair mais que isso, o homogêneo vence (consistente com `lit-self-moa`).
- nat-C05(a) (efeito Lorenz): expor agentes às respostas dos pares **antes** de responderem aumenta ρ̂ e reduz a dispersão sem reduzir o erro — no modelo, isso só pode baixar o teto do voto.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
ρ̂ heterogêneo ≈ ρ̂ homogêneo (diversidade não descorrelaciona) ou heterogêneo perde com p̂ igual.

## Experimento proposto
Observatório: medir ρ entre pares homogêneos e heterogêneos; comparar votos de mesmo custo.

## Evidência atual
Modelo. Literatura mista (relato-autores): `lit-correlated-errors` (modelos diferentes ainda erram junto), `lit-diversity-of-thought` (diversidade de abordagem ajuda), `lit-self-moa` (qualidade > diversidade).

## Limites
Supõe ρ e p separáveis; na prática diversidade e qualidade estão acopladas.
