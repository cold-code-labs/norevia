---
id: H-23
title: "Ativação esparsa (2–3 de 12) iguala a densa só se o roteador acertar quase sempre"
area: hypothesis
evidence: hipotese
status: aberta
origin: "natureza (nat-candidatas C08; nat-brain-energy-sparse — orçamento energético e código esparso) + teoria (th-modelo §11)"
experiment: "observatory: 12 especialistas (prompts/ferramentas distintos) com roteador barato vs ativação densa, mesmo verificador"
tags: [ativacao-esparsa, roteamento, macro-swarm, custo]
sources:
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-candidatas, nat-brain-energy-sparse, lit-routellm, H-16, H-06]
updated: 2026-11-07
summary: "Como o cérebro, que só ativa uma fração pequena dos neurônios, um swarm grande pode ativar 2–3 especialistas por tarefa a 1/4 do custo — mas só se quem escolhe os especialistas errar pouco."
---

# H-23 — Ativação esparsa (2–3 de 12) iguala a densa só se o roteador acertar quase sempre

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-candidatas C08; nat-brain-energy-sparse — orçamento energético e código esparso) + teoria (th-modelo §11)

## Enunciado
Com N especialistas dos quais m são competentes na tarefa (acerto pc) e verificador, ativar k ≪ N escolhidos por um roteador (cada vaga acerta um competente com prob. r) atinge aceite ≈ Σ_j Bin(j; k, r)·[1 − (1−pc)^{min(j,m)}] contra 1 − (1−pc)^m do denso, a k/N do custo. A diferença é dominada por r.

## Variáveis
N, m, pc, k, r (qualidade do roteador), custo do roteador.

## Previsão (quantitativa/direcional)
- N = 12, m = 3, pc = 0,6: k = 3 → 0,90 (r = 0,9), 0,80 (r = 0,7), 0,66 (r = 0,5) vs denso 0,936; custo 25%.
- k = 4 com r = 0,9 fica a 0,6 p.p. do denso com 33% do custo.
- Critério de nat-C08 (≥ denso − 2 p.p. com ≤ 25% do custo) só é atingível se r ≥ ~0,94 com k = 3.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Esparso com aceite ≥ denso − 2 p.p. com roteador medido r < 0,8; ou aceite crescendo ~linearmente até k = 12.

## Experimento proposto
Observatório: medir r (o roteador escolheu um especialista que, sozinho, resolveria?) e o aceite por k.

## Evidência atual
Somente modelo (fórmula conferida por MC). Fenômeno natural (esparsidade cortical) é analogia.

## Limites
Supõe competências disjuntas e verificador perfeito; especialistas parcialmente competentes suavizam a dependência de r.
