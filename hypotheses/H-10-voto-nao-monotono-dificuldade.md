---
id: H-10
title: "Com mistura de dificuldades, a acurácia do voto pode subir e depois cair com N"
area: hypothesis
evidence: hipotese
status: aberta
origin: "literatura (lit-more-llm-calls, Chen et al. 2024) + teoria (th-modelo §2.4) + natureza (nat-small-groups-correlated-cues: tamanho de grupo finito e pequeno maximiza acurácia quando parte da informação é compartilhada)"
experiment: "observatory B-vote com N ∈ {1,3,5,9,15} em conjunto com tarefas fáceis e difíceis; sims"
tags: [voto-majoritario, dificuldade, escalonamento]
sources:
  - "Chen, L. et al. (2024). Are More LLM Calls All You Need? arXiv:2403.02419v2"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-more-llm-calls, lit-snell-test-time-compute, nat-small-groups-correlated-cues, H-01]
updated: 2026-11-07
summary: "Quando parte das tarefas engana a maioria dos agentes, mais votos pioram essas tarefas, e a acurácia total pode subir e depois cair com o número de agentes."
---

# H-10 — Com mistura de dificuldades, a acurácia do voto pode subir e depois cair com N

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** literatura (lit-more-llm-calls, Chen et al. 2024) + teoria (th-modelo §2.4) + natureza (nat-small-groups-correlated-cues: tamanho de grupo finito e pequeno maximiza acurácia quando parte da informação é compartilhada)

## Enunciado
Em um conjunto com fração w_h de itens com p < ½, A(N) = Σ w_j A_N(p_j) tem máximo interior N* finito quando w_h é suficiente; nos itens com p < ½, A_N decresce com N.

## Variáveis
mistura {w_j, p_j}, ρ_j, N.

## Previsão (quantitativa/direcional)
- 80% p = 0,8 + 20% p = 0,3 → máximo em N = 15; 50% p = 0,75 + 50% p = 0,35 → N = 5; 30% p = 0,9 + 70% p = 0,4 → N = 1.
- O N* observado é previsível a partir de p_j estimados com poucas amostras por item (cf. `lit-more-llm-calls`).

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Acurácia monotônica em N mesmo com ≥ 20% de itens com p̂ < 0,5; ou itens com p̂ < 0,5 melhorando com N.

## Experimento proposto
Observatório: estimar p por tarefa com 10 amostras de A-low; formar misturas; medir A(N).

## Evidência atual
Modelo; relato de Chen et al. (2024) — `lit-more-llm-calls` (relato-autores).

## Limites
Binário; com muitas respostas possíveis, p < ½ não implica que o erro seja majoritário.
