---
id: H-19
title: "Memória de trajetórias validadas rende mais por custo do que agentes extras"
area: hypothesis
evidence: hipotese
status: aberta
origin: "literatura (lit-agentnet; lit-sintese candidata 6) + teoria (th-modelo §2: teto do voto)"
experiment: "observatory: A-low com memória de soluções aceitas (tarefas de dev) vs B-vote5 sem memória, em tarefas reservadas"
tags: [memoria-limitada, especializacao, custo-por-acerto]
sources:
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-agentnet, lit-sintese, H-01, H-15]
updated: 2026-11-07
summary: "Guardar e reutilizar soluções que passaram na verificação aumenta o acerto de cada agente, o que vale mais do que adicionar agentes quando os erros são correlacionados."
---

# H-19 — Memória de trajetórias validadas rende mais por custo do que agentes extras

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** literatura (lit-agentnet; lit-sintese candidata 6) + teoria (th-modelo §2: teto do voto)

## Enunciado
Como o voto satura no teto 1 − I_{1/2}(a,b), aumentar p de cada agente (p.ex. com memória de trajetórias aceitas) desloca o teto e o ganho por custo, enquanto aumentar N só aproxima o teto; com ρ > 0, +Δp em 1 agente supera +ΔN agentes ao mesmo custo para Δp modesto.

## Variáveis
p com/sem memória, N, ρ, custo de manter a memória (tokens de contexto, curadoria).

## Previsão (quantitativa/direcional)
- Exemplo do modelo: p = 0,6, ρ = 0,1 — 1 agente com p = 0,7 (0,70) supera voto de 5 com p = 0,6 (0,655) a ~1/5 do custo de geração.
- No observatório: aceite(A-low + memória) ≥ aceite(B-vote5) com custo menor, em tarefas da mesma família das usadas para formar a memória.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Memória sem ganho de p̂ em tarefas reservadas, ou B-vote5 com custo por aceite menor.

## Experimento proposto
Observatório: separar tarefas de dev (formam memória) e reservadas (avaliação); medir p̂ e custo por aceite.

## Evidência atual
Relato-autores: em AgentNet, memória acumulada rende 7–10 pontos, enquanto passar de 3 para 9 agentes rende 0,8 (lit-agentnet). Somente modelo do lado Norevia.

## Limites
Memória não validada pode reforçar erros (ver ressalvas de memória limitada no estudo canônico); custo de curadoria não modelado.
