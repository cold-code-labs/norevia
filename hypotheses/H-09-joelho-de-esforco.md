---
id: H-09
title: "O joelho da curva acerto × esforço decide entre concentrar e dividir o orçamento"
area: hypothesis
evidence: hipotese
status: aberta
origin: "teoria (th-modelo §4) + literatura (lit-nothinking vs lit-sas-equal-thinking-budget)"
experiment: "observatory A-low/A-mid/A-high por classe de tarefa (ajustar p(e)) + comparação 1×E vs N×E/N"
tags: [reasoning-effort, orcamento-igual, lei-da-eficiencia-coletiva]
sources:
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, sim-voto-correlacionado, lit-nothinking, lit-sas-equal-thinking-budget, lit-snell-test-time-compute, lit-s1-budget-forcing, lit-inverse-scaling-ttc, H-03]
updated: 2026-11-07
summary: "Se a tarefa exige um mínimo de raciocínio encadeado, concentrar o orçamento em 1 agente vence; se o retorno ao esforço é decrescente, várias tentativas baratas vencem — e o ponto de virada é calculável pela curva acerto × esforço."
---

# H-09 — O joelho da curva acerto × esforço decide entre concentrar e dividir o orçamento

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §4) + literatura (lit-nothinking vs lit-sas-equal-thinking-budget)

## Enunciado
Com capacidade de Hill p(e) = p_hi (e/h)^β/(1 + (e/h)^β), a orçamento igual, N agentes de esforço e_N = E/N − c0(N−1)/(N c1) vencem 1 agente de esforço E (com verificador) aproximadamente quando e_N > e_knee = h(β−1)^{1/β} (sempre, se β ≤ 1).

## Variáveis
h, β (ajustados por classe de tarefa), E, N, c0 (overhead por chamada), ρ.

## Previsão (quantitativa/direcional)
- No modelo, o critério acerta o vencedor em 94% da grade (β ∈ {0,5..3}, h ∈ {1,4,16}, N ∈ {2,4,8}).
- Em LLM: o critério acerta o vencedor em ≥ 80% das classes de tarefa.
- Tarefas com β̂ > 1 e h alto (raciocínio encadeado) favorecem A-high; tarefas com β̂ ≤ 1 favorecem amostragem paralela barata.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Acerto do critério ≤ 60%; ou p(e) não monotônica (retorno negativo, `lit-inverse-scaling-ttc`) na maioria das classes, o que invalida a premissa.

## Experimento proposto
Observatório: para cada classe, medir aceite em 3–4 níveis de esforço (A-low, A-mid, A-high), ajustar (h, β), prever e testar 1×E vs N×E/N (B-vote/best-of-N com mesmo orçamento).

## Evidência atual
Modelo (grade numérica). `sim-voto-correlacionado` (no modelo, outra família p(e)): a região onde o voto vence a orçamento igual encolhe quando o retorno ao esforço é menos decrescente — direção consistente. Literatura com resultados opostos por tarefa (`lit-nothinking`, `lit-sas-equal-thinking-budget`).

## Limites
Critério heurístico (não teorema); overhead por chamada e saturação p_hi < 1 deslocam a fronteira.
