---
id: H-11
title: "O custo de coordenação segue a Lei de Escalabilidade Universal, com pico em N_max"
area: hypothesis
evidence: hipotese
status: aberta
origin: "teoria (th-modelo §5; Gunther USL) + literatura (saturação em lit-macnet, lit-swarmsys)"
experiment: "observatory: varrer N ∈ {1,2,3,5,8} em tarefa decomponível com topologias estrela / quadro / todos-com-todos; ajustar USL"
tags: [coordenacao, usl, topologia, macro-swarm]
sources:
  - "Gunther, N. J. (1993). A Simple Capacity Model of Massively Parallel Transaction Systems. CMG National Conference (lacuna: texto integral não aberto)"
  - "Gunther, N. J. (2008). A General Theory of Computational Scalability Based on Rational Functions. arXiv:0808.1431v2"
  - "Amdahl, G. M. (1967). AFIPS '67 (Spring), p. 483ss. doi:10.1145/1465482.1465560"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, lit-scaling-agent-systems, lit-macnet, lit-swarmsys, lit-agentnet, lit-gptswarm, lit-agentprune, nat-colony-size-scaling, H-07, H-04]
updated: 2026-11-07
summary: "Somar agentes rende cada vez menos e, a partir de um ponto, piora: a contenção (gargalos compartilhados) e a coerência (cada um precisa conciliar com todos) produzem um pico calculável."
---

# H-11 — O custo de coordenação segue a Lei de Escalabilidade Universal, com pico em N_max

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §5; Gunther USL) + literatura (saturação em lit-macnet, lit-swarmsys)

## Enunciado
A produção útil (tarefas aceitas por unidade de tempo, ou subtarefas concluídas) de um swarm segue X(N) = γN/[1 + σ(N−1) + κN(N−1)] com κ > 0; N_max = √((1−σ)/κ); κ(todos-com-todos) > κ(estrela) ≥ κ(quadro).

## Variáveis
N, σ (orquestrador/verificador único, filas, limites de taxa), κ (conciliação par a par), topologia.

## Previsão (quantitativa/direcional)
- O ajuste USL tem erro menor que Amdahl (κ = 0) em validação cruzada.
- N_max(todos-com-todos) < N_max(estrela); ex. ilustrativo (σ, κ) = (0,05; 0,01) → N_max ≈ 9,7.
- Saturação perto de 14–16 agentes relatada na literatura corresponderia a κ ≈ 0,004–0,005 se σ ≈ 0 (verificar com dados).

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
κ̂ com IC95% incluindo 0 para a topologia completa; ou produção linear em N até 8.

## Experimento proposto
Observatório: tarefa com muitas partes independentes; medir vazão e tokens de coordenação por N e topologia; ajuste não linear.

## Evidência atual
Modelo (USL clássica; N_max conferido numericamente). Saturação relatada por `lit-macnet` (~16 nós) e `lit-swarmsys` (~14) — relato-autores. Kim et al. relatam turnos T = 2,72·(n+0,5)^1,724 (entre estrela ∝ n e completo ∝ n²) e 67,7 sucessos/1K tokens no agente único vs 13,6–42,4 nos MAS. `nat-colony-size-scaling` (fenômeno natural): metabolismo de colônias escala sublinearmente — analogia, não evidência.

## Limites
USL foi formulada para sistemas computacionais; aplicação a agentes LLM é analogia de engenharia.
