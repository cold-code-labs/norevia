---
id: sim-limiar-resposta
title: "Limiares de resposta vs papéis fixos vs despachante central sob demanda flutuante"
area: simulation
evidence: validacao-local
tags: [divisao-de-trabalho, limiar-de-resposta, alocacao-de-tarefas, elastic-swarm, custo-de-comunicacao]
sources:
  - "Código: sims/sim-limiar-resposta.mjs (v1.0.0, seed 20261107)"
  - "Dados: results/sims/sim-limiar-resposta.json"
  - "Mecanismo de inspiração: Bonabeau, Theraulaz & Deneubourg (1996). Proc. R. Soc. B 263:1565–1569. doi:10.1098/rspb.1996.0229 (citação conforme o briefing e o cartão nat-response-threshold; regra reimplementada aqui, não reprodução do artigo)"
related: [sim-relatorio, H-06, H-16, nat-response-threshold, nat-inactive-reserve, sim-elastico, sim-clonal, lit-swarmsys]
updated: 2026-11-07
summary: "No modelo, limiares de resposta sem nenhuma mensagem chegam perto de um despachante central perfeito (latência 1,46 vs 1,34 passos) com ~22% mais agentes ativos; o despachante só compensa se a mensagem custar menos que ~0,18 agente-passo e se a informação não chegar atrasada."
---

> **Escopo da evidência:** `validacao-local` = validação **dentro de um modelo simulado** de filas e agentes abstratos, não de LLMs. A regra de limiar é inspirada no fenômeno natural; não reproduzimos o modelo original do artigo.

## Hipótese (pré-registrada antes da execução)
Registrada em `results/sims/PREREGISTRO.jsonl` (2026-11-07T22:35:18Z, v1.0.0, sha256 do código `27dcec91d1a39acb…`).

Limiares de resposta heterogêneos, lendo apenas o estímulo local (backlog), alocam agentes de forma adaptativa sem mensagens: melhor latência que papéis fixos dimensionados pela média, menos agentes ativos que papéis fixos dimensionados pelo pico, e custo total menor que um despachante central quando mensagens têm custo ou quando a informação do despachante chega atrasada.

- **P1** — Limiar (θ~U[5,50], n=2, p_saída=0,1) tem latência média menor que fixo-media (3+3), Δ pareado com IC95% < 0, com zero mensagens.
- **P2** — Limiar usa menos agentes ativos que fixo-pico (8+8) e tem latência ≤ 2× a do fixo-pico.
- **P3** — Despachante com atraso L=0 domina o limiar quando mensagens são gratuitas: menos ativos **e** latência ≤ limiar.
- **P4** — Latência e pico de backlog do despachante crescem com L (0<2<5<10); para L ≥ 5 o pico do despachante excede o do limiar.
- **P5** — Com custo 0,2 por mensagem, custo total/passo do limiar < qualquer despachante.

## Modelo
- 40 agentes, 2 tipos de tarefa, 1000 passos, chegadas Poisson λ=1/tipo/passo; 3 picos de 50 passos com λ×4 (t=200 tipo A, 450 tipo B, 700 tipo A).
- Agente ativo conclui 1 tarefa do seu tipo por passo com prob. μ=0,5 se houver fila. Custo = agentes ativos por passo (+ custo por mensagem).
- **Limiar:** agente inativo engaja no tipo j com P = s_j²/(s_j²+θ_ij²), s_j = backlog do tipo j (lido do ambiente — sem mensagens); ativo sai com prob. p por passo. Variantes de θ e uma variante de engenharia com saída quando a fila está vazia.
- **Fixo:** 3+3 (média) ou 8+8 (pico) sempre ativos.
- **Despachante:** observa filas e chegadas com atraso L; alvo_j = ⌈(λ̂_j + fila_j/5)/μ⌉; mensagens = 1 status por agente ativo por passo + 1 por comando de (des)ativação.
- 1000 execuções por estratégia, chegadas idênticas entre estratégias (comparações pareadas).

## Resultados (gerados pelo script; conferidos por `sims/run-all.mjs`)
Manchetes:
- limiar-5-50: ativos 8,84 [IC95% 8,81–8,87], latência 1,46 [IC95% 1,45–1,46], pico 7,3 [IC95% 7,2–7,4], msgs/passo 0,0
- fixo-media: ativos 6,00 [IC95% 6,00–6,00], latência 25,81 [IC95% 25,60–26,03], pico 136,9 [IC95% 136,0–137,7], msgs/passo 0,0
- fixo-pico: ativos 16,00 [IC95% 16,00–16,00], latência 1,58 [IC95% 1,56–1,59], pico 19,5 [IC95% 19,1–19,8], msgs/passo 0,0
- despachante-L0: ativos 7,22 [IC95% 7,21–7,23], latência 1,34 [IC95% 1,34–1,34], pico 6,4 [IC95% 6,3–6,4], msgs/passo 8,8
- despachante-L10: ativos 8,12 [IC95% 8,11–8,13], latência 2,30 [IC95% 2,29–2,30], pico 30,4 [IC95% 30,1–30,7], msgs/passo 9,7
- Custo total/passo com 0,2 por mensagem: limiar 8,84 [IC95% 8,81–8,87] vs despachante-L0 8,98 [IC95% 8,97–8,99]

| Previsão | Veredicto (no modelo) | Detalhe |
|---|---|---|
| P1 | **suporta** | Δlatência limiar−fixo-media = -24,36 [IC95% -24,57–-24,14] passos; mensagens do limiar = 0 |
| P2 | **suporta** | Δativos limiar−fixo-pico = -7,16 [IC95% -7,19–-7,13]; latência limiar 1,46 vs fixo-pico 1,58 |
| P3 | **suporta** | Δativos desp.L0−limiar = -1,62 [IC95% -1,65–-1,60]; Δlatência = -0,12 [IC95% -0,12–-0,11] |
| P4 | **suporta** | latência cresce com L=true; pico cresce com L=true; pico desp.(L=5,10) > limiar=true (Δpico L5 11,41 [IC95% 11,22–11,60], L10 23,11 [IC95% 22,83–23,39]) |
| P5 | **suporta** | L0: Δcusto -0,14 [IC95% -0,17–-0,11]; L2: Δcusto -0,53 [IC95% -0,56–-0,50]; L5: Δcusto -0,82 [IC95% -0,85–-0,79]; L10: Δcusto -1,22 [IC95% -1,25–-1,19] |

Médias por execução (1000 execuções; IC95% de cada métrica em `results.summary`):

| Estratégia | ativos/passo | latência média | latência p95 | pico backlog | recuperação (passos) | msgs/passo | custo/passo (0,2/msg) |
|---|---|---|---|---|---|---|---|
| limiar-5-50 | 8,84 | 1,46 | 3,01 | 7,3 | 0,0 | 0,0 | 8,84 |
| limiar-2-20 | 16,21 | 1,06 | 1,53 | 2,9 | 0,0 | 0,0 | 16,21 |
| limiar-10-100 | 6,62 | 2,41 | 5,39 | 14,8 | 0,5 | 0,0 | 6,62 |
| limiar-homog-20 | 8,81 | 1,51 | 3,01 | 6,9 | 0,0 | 0,0 | 8,81 |
| limiar-saida-ociosa | 9,70 | 1,41 | 2,99 | 6,2 | 0,0 | 0,0 | 9,70 |
| fixo-media | 6,00 | 25,81 | 80,61 | 136,9 | 232,3 | 0,0 | 6,00 |
| fixo-pico | 16,00 | 1,58 | 4,85 | 19,5 | 2,5 | 0,0 | 16,00 |
| despachante-L0 | 7,22 | 1,34 | 2,37 | 6,4 | 0,0 | 8,8 | 8,98 |
| despachante-L2 | 7,55 | 1,68 | 3,00 | 11,8 | 0,0 | 9,1 | 9,37 |
| despachante-L5 | 7,79 | 1,94 | 4,58 | 18,7 | 0,1 | 9,4 | 9,66 |
| despachante-L10 | 8,12 | 2,30 | 6,36 | 30,4 | 0,2 | 9,7 | 10,06 |

Custo de mensagem de equilíbrio (abaixo dele o despachante é mais barato que `limiar-5-50`), derivado das médias: L=0: 0,184; L=2: 0,142; L=5: 0,113; L=10: 0,074 agente-passo por mensagem.

Curvas para gráficos: `results.backlog_trace` (backlog médio a cada 5 passos por estratégia).

## Interpretação
- Todas as cinco previsões foram suportadas dentro do modelo.
- O limiar resolve o problema de picos sem comunicação explícita: o próprio backlog é o sinal (estigmérgico). O preço é ~1,6 agente ativo a mais que o despachante perfeito, porque a saída é aleatória (p=0,1) e não sabe quando a fila esvaziou.
- O limiar tem um **botão de custo×latência**: θ baixo (2–20) → 16 ativos e latência 1,06; θ alto (10–100) → 6,6 ativos e latência 2,4. A heterogeneidade de θ quase não importou aqui (homogêneo θ=20 ≈ heterogêneo 5–50). A variante de engenharia "saída ociosa" (exploratória, sem previsão registrada) ficou **pior** em custo (9,70 ativos) com ganho marginal de latência — a intuição de sair quando a fila esvazia não ajudou com estes parâmetros.
- A vantagem do despachante desaparece com atraso de informação: com L=10 o pico de backlog é ~4× o do limiar e a latência 58% maior, economizando só ~0,7 agente ativo por passo e gastando ~9,7 mensagens/passo.
- Papéis fixos falham nas duas pontas: dimensionado pela média, o backlog leva em média 232 passos para voltar a ≤ 5 após cada pico (teto de medição 250); dimensionado pelo pico, paga 16 agentes sempre.

## Limitações
- Tarefas homogêneas de duração geométrica; nenhuma especialização (qualquer agente serve qualquer tipo sem custo de troca).
- Despachante simples (regra proporcional); controladores melhores podem reduzir a diferença. Custo de "ler o backlog" foi considerado zero para o limiar.
- **O que precisa de validação com LLM real:** custo real de mensagens/contexto de um orquestrador vs leitura de estado compartilhado; atraso típico de observação; se agentes LLM conseguem aplicar uma regra de limiar estável sem oscilar.
