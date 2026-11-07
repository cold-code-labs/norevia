---
id: H-16
title: "Ativação adaptativa só compensa se a triagem custar menos que o desperdício evitado"
area: hypothesis
evidence: hipotese
status: em-teste
origin: "documento norteador (Adaptive Swarm Activation; "um simples oi") + teoria (th-modelo §2.3, §9) + literatura (lit-routellm, lit-frugalgpt)"
experiment: "observatory: controlador adaptativo vs A-low e vs C-elastic em mistura com fração variável de tarefas triviais"
tags: [adaptive-swarm-activation, roteamento, custo]
sources:
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-routellm, lit-frugalgpt, lit-sas-vs-mas-hybrid, lit-debate-routing-matched-ceiling, lit-overthinking, nat-reflex-vs-cortex, H-05, H-06, H-18]
updated: 2026-11-07
summary: "Decidir quanto raciocinar também custa: um controlador só vale a pena se seu custo por tarefa for menor que o desperdício que evita — em tarefas triviais, uma resposta direta vence qualquer orquestração."
---

# H-16 — Ativação adaptativa só compensa se a triagem custar menos que o desperdício evitado

**Status:** `em-teste` · **Nível de evidência do cartão:** `hipotese` · **Origem:** documento norteador (Adaptive Swarm Activation; "um simples oi") + teoria (th-modelo §2.3, §9) + literatura (lit-routellm, lit-frugalgpt)

## Enunciado
Para uma mistura de tarefas, um controlador de custo c_ctrl por tarefa melhora o custo por acerto sobre a melhor configuração fixa somente se c_ctrl < Σ_j w_j·[custo_fixo_j − custo_adaptado_j] − (perda de aceite por erro de roteamento)·V. Em tarefas com p(e_low) ≈ 1, qualquer configuração além de 1 chamada de esforço baixo é dominada.

## Variáveis
mistura {w_j}, c_ctrl, acurácia do roteamento, custos por configuração.

## Previsão (quantitativa/direcional)
- Em tarefas triviais (a* fáceis), A-low domina todas as arquiteturas em custo por acerto com aceite igual.
- O benefício do controlador cresce com a heterogeneidade da mistura e desaparece em misturas homogêneas.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Controlador com custo por acerto menor que a melhor configuração fixa em mistura homogênea; ou arquitetura multiagente com custo por acerto menor que A-low em tarefas triviais.

## Experimento proposto
Observatório: variar a fração de tarefas triviais (0%, 50%, 90%); medir custo total incluindo a triagem.

## Evidência atual
Somente modelo/argumento. Smoke do observatório em a01: A-low aceitou a ~1/14 do custo de C-decompose (1 execução). Piloto (45 execuções, 2–3 por célula, tarefas a02/a04/a05/b01/b02): aceite 100% em todas as arquiteturas; custo por aceite ~US$ 0,001 (A-low, A-low-loop, C-elastic) vs ~US$ 0,04 (A-high, classe a) e ~US$ 0,03 (B-pipeline, classe a) — **direção compatível**, mas não conclusivo (amostra mínima, sem IC, efeito teto). Status passa a `em-teste`. Literatura: roteadores/cascatas reduzem custo (`lit-routellm`, `lit-frugalgpt`, relato-autores).

## Limites
O custo de triagem pode ser amortizado (cache, heurísticas determinísticas), o que muda a fronteira.
