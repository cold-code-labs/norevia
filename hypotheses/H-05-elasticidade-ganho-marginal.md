---
id: H-05
title: "Expandir por ganho marginal vence tamanho fixo em custo por acerto"
area: hypothesis
evidence: hipotese
status: aberta
origin: "teoria (th-modelo §7.1, §7.4) + literatura (lit-adaptive-consistency, lit-early-stopping-sc, lit-frugalgpt; lit-sintese candidata 5: cascata) + natureza (nat-interaction-rate-foraging: spawn pela taxa de aceites)"
experiment: "observatory C-elastic vs B-vote5 / best-of-N fixo; sims de mistura de dificuldade"
tags: [elastic-swarm, parada-otima, custo-por-acerto]
sources:
  - "Chow, Y. S. & Robbins, H. (1963). On optimal stopping rules. Z. Wahrscheinlichkeitstheorie 2(1):33–49. doi:10.1007/BF00535296"
  - "Wald, A. (1945). Sequential Tests of Statistical Hypotheses. Ann. Math. Statist. 16(2):117–186. doi:10.1214/aoms/1177731118"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-adaptive-consistency, lit-early-stopping-sc, lit-frugalgpt, lit-routellm, lit-sas-vs-mas-hybrid, lit-snell-test-time-compute, nat-interaction-rate-foraging, nat-clonal-expansion-contraction, lit-sintese, H-12, H-06]
updated: 2026-11-07
summary: "Adicionar agentes só enquanto o ganho esperado supera o custo marginal (e parar no primeiro resultado aceito) gasta bem menos por acerto que um swarm de tamanho fixo, com o mesmo acerto."
---

# H-05 — Expandir por ganho marginal vence tamanho fixo em custo por acerto

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §7.1, §7.4) + literatura (lit-adaptive-consistency, lit-early-stopping-sc, lit-frugalgpt; lit-sintese candidata 5: cascata) + natureza (nat-interaction-rate-foraging: spawn pela taxa de aceites)

## Enunciado
Uma política que expande enquanto E[ΔP_true]·V − E[ΔP_false]·L > Δcusto (e para no primeiro aceite verificado) tem o mesmo P_true do best-of-N fixo com o mesmo teto e custo por acerto menor; a economia cresce com a fração de tarefas fáceis e com o teto N.

## Variáveis
mistura de dificuldades {w_j, p_j}, s, f, teto N, custo por chamada, latência.

## Previsão (quantitativa/direcional)
- Mistura 50% p = 0,9 / 30% p = 0,5 / 20% p = 0,15, s = 0,9, f = 0,05: razão custo-por-acerto fixo/elástico = 1,41 (N = 2), 1,82 (N = 3), 2,21 (N = 4), 3,75 (N = 8).
- Aceite do elástico ≥ aceite do fixo − 1 p.p.; latência do elástico maior (rodadas sequenciais).
- P_false do elástico cresce com o teto N (0,019 → 0,057 de N = 1 a 8) — o teto deve vir de H-02/H-13.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Custo por acerto do elástico ≥ fixo (IC95%), ou queda de aceite > 2 p.p.

## Experimento proposto
Observatório: C-elastic vs B-vote5 e vs best-of-N paralelo fixo no mesmo conjunto (a* fáceis + b* difíceis); medir custo por tarefa aceita, latência e falso sucesso.

## Evidência atual
Somente modelo (exato; teste §7.3). Literatura (relato-autores): parada adaptativa reduz amostras ~3,2× (`lit-adaptive-consistency`) e 67–80% em tarefas fáceis (`lit-early-stopping-sc`); cascata agente único → MAS só se falhar gasta ~88% menos tokens no GSM8K (`lit-sas-vs-mas-hybrid`). O cartão `nat-interaction-rate-foraging` (fenômeno natural) sugere a variante "spawn proporcional à taxa recente de aceites" — incluída como braço do experimento.

## Limites
Estimar o ganho marginal custa; se o estimador custar mais do que economiza, a vantagem some (H-16).
