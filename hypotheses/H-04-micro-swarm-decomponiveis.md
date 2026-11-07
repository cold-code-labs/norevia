---
id: H-04
title: "Micro-swarm (2–3) vence em tarefas decomponíveis de baixo acoplamento"
area: hypothesis
evidence: hipotese
status: em-teste
origin: "teoria (th-modelo §6, §9) + documento norteador (micro-swarms) + literatura (lit-scaling-agent-systems; lit-sintese candidata 3) + natureza (nat-small-groups-correlated-cues: Kao & Couzin 2014, grupos pequenos maximizam acurácia com pistas correlacionadas)"
experiment: "observatory C-decompose (N = k) e B-pipeline (executor + verificador) vs A-high e vs N > k em tarefas b* independentes"
tags: [micro-swarm, decomponibilidade, elastic-swarm]
sources:
  - "Gunther, N. J. (2008). A General Theory of Computational Scalability Based on Rational Functions. arXiv:0808.1431v2"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-scaling-agent-systems, lit-agentnet, lit-swarmsys, lit-macnet, lit-sintese, nat-small-groups-correlated-cues, H-03, H-11]
updated: 2026-11-07
summary: "Em tarefas com 2–3 partes quase independentes, dividir entre 2–3 agentes (ou executor + verificador) iguala ou supera 1 agente de esforço alto a custo menor ou igual, e crescer além disso não acrescenta."
---

# H-04 — Micro-swarm (2–3) vence em tarefas decomponíveis de baixo acoplamento

**Status:** `em-teste` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §6, §9) + documento norteador (micro-swarms) + literatura (lit-scaling-agent-systems; lit-sintese candidata 3) + natureza (nat-small-groups-correlated-cues: Kao & Couzin 2014, grupos pequenos maximizam acurácia com pistas correlacionadas)

## Enunciado
Para k ∈ {2, 3} e χ < χ*, um micro-swarm de k agentes (ou executor + verificador) tem custo por acerto ≤ ao de A-high e aceite ≥; expandir para N > k (macro) não aumenta o aceite e aumenta o custo (coordenação, §5).

## Variáveis
k, χ, N, σ/κ (coordenação), c(e).

## Previsão (quantitativa/direcional)
- Em tarefas decomponíveis (χ ≈ 0, k = 2–3): custo por acerto(micro) ≤ custo por acerto(A-high) e aceite(micro) ≥ aceite(A-high) − 2 p.p.
- Aceite(N = 2k) − aceite(N = k) ≤ 1 p.p., com custo ≥ 1,5×.
- Ganho do micro sobre o solo cresce com ι (interferência de contexto), isto é, com o tamanho de cada parte.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
A-high com custo por acerto menor **e** aceite maior (IC95%) nas tarefas decomponíveis; ou macro (N > k) melhorando o aceite em > 3 p.p.

## Experimento proposto
Observatório: tarefas b01/b02 (kits multi-módulo) e variantes com k = 2, 3, 4 partes independentes; arquiteturas A-high, A-mid, C-decompose, B-pipeline; ≥ 10 repetições.

## Evidência atual
Observatório em smoke: em b01, A-low e C-decompose aceitaram (1 execução cada; C-decompose custou ~2,7×) — **não conclusivo**. Literatura: `lit-agentnet` (ganho pequeno e decrescente com mais agentes), `lit-swarmsys`/`lit-macnet` (saturação) — relato-autores. Kim et al. (`lit-scaling-agent-systems`) relatam +80,8% em tarefa decomponível com orquestração central, que também contém a amplificação de erros (4,4× vs 17,2× em agentes independentes) — compatível com o lado "χ baixo" do modelo; é a linha de base a superar. Piloto do observatório (results/observatory/runs-pilot.jsonl, 45 execuções, 2–3 por célula): aceite 100% em todas as 9 arquiteturas (efeito teto: tarefas fáceis demais para discriminar) — sem efeito no status.

## Limites
Se a tarefa for fácil (p(e_low) ≈ 1), nenhum swarm compensa (ver H-16).
