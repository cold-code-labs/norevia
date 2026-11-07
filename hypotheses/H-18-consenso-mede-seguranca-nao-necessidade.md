---
id: H-18
title: "Sinais de consenso indicam quando parar, não quando expandir"
area: hypothesis
evidence: hipotese
status: aberta
origin: "literatura (lit-debate-routing-matched-ceiling; lit-sintese candidata 4) + teoria (th-modelo §10.4)"
experiment: "observatory: comparar controladores com estímulo = discordância vs estímulo = falha de teste visível/verificador; medir fração de erros unânimes"
tags: [adaptive-swarm-activation, roteamento, erros-correlacionados, sinal-de-ativacao]
sources:
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-debate-routing-matched-ceiling, lit-early-stopping-sc, lit-adaptive-consistency, lit-sintese, H-06, H-12, H-16]
updated: 2026-11-07
summary: "Quando os agentes erram juntos, a unanimidade não prova acerto: sinais de discordância servem para economizar (parar cedo), mas não para descobrir quando é preciso mais esforço — para isso é preciso um sinal externo, como testes."
---

# H-18 — Sinais de consenso indicam quando parar, não quando expandir

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** literatura (lit-debate-routing-matched-ceiling; lit-sintese candidata 4) + teoria (th-modelo §10.4)

## Enunciado
A fração dos erros da maioria em que os N votos são unânimes e errados é E[(1−P)^N]/(1 − A_N), crescente em ρ; portanto um controlador cujo estímulo é a discordância perde essa fração das necessidades de expansão, enquanto um estímulo externo (falha de teste/verificador) não depende de ρ.

## Variáveis
N, p, ρ, tipo de estímulo.

## Previsão (quantitativa/direcional)
- N = 3, p = 0,7: erros unânimes = 12,5% (ρ = 0), 35,5% (ρ = 0,3), 61% (ρ = 0,6).
- Controlador por discordância recupera < 40% do ganho de um roteador oráculo quando ρ̂ ≥ 0,3; controlador por teste/verificador recupera mais.
- Concordância entre amostras erradas do mesmo modelo prevista ≈ 0,11 no caso Llama-3-8B/MATH (via K_eff ≈ 9,4, th-modelo §10.3).

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Controlador por discordância recuperando ≥ 60% do ganho oráculo em tarefas com ρ̂ ≥ 0,3; ou fração de erros unânimes sem relação com ρ̂.

## Experimento proposto
Observatório: em cada tarefa, 3–5 amostras de A-low; marcar erros unânimes; comparar duas regras de expansão (discordância vs testes visíveis) em custo por aceite.

## Evidência atual
Modelo; relato-autores: 66% dos casos em que o debate ajuda têm voto unânime e errado e a entropia do voto recupera só 11–19% do ganho oráculo (lit-debate-routing-matched-ceiling). No modelo, 66% exige ρ ≈ 0,55–0,7 (N = 3) — checagem de ordem de grandeza, condicionamentos diferentes.

## Limites
Binário; pluralidade com erros dispersos reduz a unanimidade-errada.
