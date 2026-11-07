---
id: H-26
title: "Uma pequena reserva ociosa de agentes reduz muito a latência sob rajadas perto da saturação"
area: hypothesis
evidence: hipotese
status: aberta
origin: "natureza (nat-inactive-reserve — Charbonneau et al. 2017; Hasegawa et al. 2016) + teoria (th-modelo §11; filas M/M/c, Kleinrock 1975)"
experiment: "sims de fila com rajadas e falhas injetadas; observatory apenas em ambiente isolado (sem produção)"
tags: [capacidade, reserva, latencia, resiliencia]
sources:
  - "Kleinrock, L. (1975). Queueing Systems, Volume 1: Theory. New York: Wiley."
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-inactive-reserve, nat-candidatas, H-11, H-06]
updated: 2026-11-07
summary: "Formigas "preguiçosas" funcionam como reserva que substitui as ativas; numa fila de tarefas, poucos agentes ociosos de reserva cortam muito a espera quando a carga se aproxima da capacidade."
---

# H-26 — Uma pequena reserva ociosa de agentes reduz muito a latência sob rajadas perto da saturação

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-inactive-reserve — Charbonneau et al. 2017; Hasegawa et al. 2016) + teoria (th-modelo §11; filas M/M/c, Kleinrock 1975)

## Enunciado
Com chegadas λ e capacidade μ por agente, a espera média W_q = C(c, λ/μ)/(cμ − λ) (Erlang C) é fortemente não linear perto de λ/μ → c; manter uma reserva r de agentes ociosos (custo de ociosidade) reduz a latência p95 sob rajadas mais do que o custo de ociosidade, quando a utilização média > ~0,8.

## Variáveis
c (ativos), r (reserva), λ (carga e rajadas), μ, taxa de falhas.

## Previsão (quantitativa/direcional)
- μ = 1: carga 3,6 → W_q = 1,97 (c = 4), 0,29 (c = 5), 0,08 (c = 6).
- Rajada de carga 4,5: c = 4 instável; c = 5 → 1,53; c = 6 → 0,28.
- Com utilização média < 0,5 a reserva não compensa (só custo).

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Latência p95 insensível à reserva com utilização > 0,8; ou ganho igual com utilização < 0,5.

## Experimento proposto
Simulação de fila com rajadas e agentes travados; medir latência p95, tarefas abandonadas e custo de ociosidade.

## Evidência atual
Somente modelo (Erlang C conferido em casos conhecidos). Fenômeno natural nos cartões nat-* (analogia).

## Limites
Chegadas Poisson e serviço exponencial; rajadas reais e tempos de serviço de cauda pesada pioram a espera.
