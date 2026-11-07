---
id: H-02
title: "A qualidade do verificador domina o ganho do best-of-N"
area: hypothesis
evidence: hipotese
status: suportada-preliminar
origin: "teoria (th-modelo §3) + literatura (lit-large-language-monkeys; Stroebl et al.; lit-mast; lit-sintese candidata 2)"
experiment: "sims/sim-verificador (feito, no modelo) + observatory A-low-loop/C-elastic com verificador = testes visíveis, aceite = testes ocultos"
tags: [verificacao, best-of-n, aceite-verificavel]
sources:
  - "Brown, B. et al. (2024). Large Language Monkeys. arXiv:2407.21787v3"
  - "Stroebl, B., Kapoor, S. & Narayanan, A. The Limits of Inference Scaling Through Resampling. arXiv:2411.17501v3"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, sim-verificador, lit-large-language-monkeys, lit-nothinking, lit-mast, lit-frugalgpt, lit-sintese, H-13, H-09]
updated: 2026-11-07
summary: "Em best-of-N, o acerto máximo atingível é a precisão do verificador π = ps/(ps+(1−p)f); por isso melhorar o verificador rende mais que aumentar N, e um gerador forte vence muitos fracos com o mesmo verificador."
---

# H-02 — A qualidade do verificador domina o ganho do best-of-N

**Status:** `suportada-preliminar` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §3) + literatura (lit-large-language-monkeys; Stroebl et al.; lit-mast; lit-sintese candidata 2)

## Enunciado
Em geração + verificação, P_true(N) = π(1 − r^N) com π = ps/(ps + (1−p)f) independente de N. A variação de acerto entre configurações é explicada mais por (s, f) do que por N, e com f > 0 e p baixo, 1 agente de esforço maior (p alto, π alto) supera N agentes fracos.

## Variáveis
s (sensibilidade), f (falso-aceite = 1 − especificidade), p, N, ρ.

## Previsão (quantitativa/direcional)
- P_true satura em π: p = 0,1, s = 0,9 → π = 0,909 (f = 0,01), 0,667 (f = 0,05), 0,333 (f = 0,2).
- Numa grade fatorial (N × qualidade do verificador), a fração da variância de P_true atribuível ao verificador > à atribuível a N.
- Com o mesmo verificador (f = 0,05), gerador p = 0,6 tem π = 0,964 vs π = 0,667 para p = 0,1 — o forte vence em confiabilidade mesmo com cobertura menor.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
P_true continuar subindo com N acima de π estimado (IC95%), ou N explicar mais variância que (s, f) na grade fatorial.

## Experimento proposto
Observatório: medir s e f do verificador (testes visíveis) contra o aceite real (testes ocultos) por tarefa; variar N (1, 2, 4, 8) e o verificador (testes visíveis completos vs reduzidos vs LLM-juiz). Simulação: `sims/sim-verificador`.

## Evidência atual
Simulação `sim-verificador` (validacao-local no modelo, pré-registrada): com sens = spec = 0,95, falso sucesso cai de 35% (voto) para 5% a ~1/5 do custo por acerto; verificador fraco (spec = 0,5) é pior que o voto (P4 suportada). P1 falhou em 3/120 comparações (ρ = 0,6, N ≥ 17: o único de esforço alto teve menos falso sucesso), o que é **compatível** com o §3.3 do modelo (correlação derruba a precisão dos aceitos). Literatura (relato-autores): no MATH, cobertura 98,44% com 10.000 amostras vs ~41% selecionada por voto/RM; no SWE-bench Lite, 15,9% → 56% com 250 amostras porque os testes verificam (`lit-large-language-monkeys`); paralelo curto + verificador iguala raciocínio longo com latência menor (`lit-nothinking`). Sem medição local em LLM.

## Limites
s e f tratados como constantes; em LLMs dependem da tarefa e podem compartilhar pontos cegos com o gerador.
