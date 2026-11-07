---
id: sim-estigmergia
title: "Estigmergia com evaporação vs mensagens todos-com-todos vs sem coordenação"
area: simulation
evidence: validacao-local
tags: [estigmergia, evaporacao, memoria-limitada, custo-de-comunicacao, exploracao]
sources:
  - "Código: sims/sim-estigmergia.mjs (v1.0.0, seed 20261107)"
  - "Dados: results/sims/sim-estigmergia.json"
related: [sim-relatorio, H-07, H-11, nat-stigmergy, nat-pheromone-evaporation-aco, sim-limiar-resposta]
updated: 2026-11-07
summary: "No modelo, um rastro compartilhado com evaporação ε≈0,1 encontra alvos tão rápido quanto (ou mais rápido que) mensagens todos-com-todos (95 vs 97 passos com 4 agentes; 22,5 vs 24 com 16), com zero mensagens contra 1 165–5 778 por episódio; sem evaporação o rastro cresce sem limite e a busca fica ~30% mais lenta."
---

> **Escopo da evidência:** `validacao-local` = validação **dentro de um modelo simulado** (agentes abstratos numa grade), não de LLMs nem de formigas reais.

## Hipótese (pré-registrada antes da execução)
Registrada em `results/sims/PREREGISTRO.jsonl` (2026-11-07T22:37:09Z, v1.0.0, sha256 do código `db0528af72083d01…`).

Um rastro compartilhado ("já explorei aqui") reduz trabalho duplicado e tempo até a solução sem mensagens; como os agentes não sabem quando um episódio termina, o rastro velho vira ruído, e a evaporação funciona como esquecimento: existe uma taxa intermediária ótima, e o rastro sem evaporação cresce sem limite.

- **P1** — Para K=4 e K=16, estigmergia com ε=0,01 tem tempo até a solução e fração de visitas duplicadas menores que sem-coordenação (IC95% disjuntos).
- **P2** — Tempo em forma de U em ε: existe 0<ε<1 com tempo significativamente menor que ε=0 e ε=1, para K=4 e K=16.
- **P3** — Mensagens todos-com-todos (informação perfeita, zerada por episódio) têm o menor tempo, ao custo de K(K−1) mensagens/passo; o melhor ε fica a ≤ 15% do tempo das mensagens, com zero mensagens.
- **P4** — Com ε=0 a massa de rastro cresce ~linearmente (memória ilimitada) e o 10º episódio é mais lento que o 1º; com o melhor ε a massa se estabiliza (massa ep.10/ep.5 < 1,2).

## Modelo
- Grade 24×24 (576 nós, vizinhança 4). K agentes partem do centro. 10 episódios por execução: um alvo surge em nó uniforme; o episódio termina quando um agente pisa nele; novo alvo; os agentes seguem de onde estão.
- `sem-coordenacao`: passeio aleatório sem retorno imediato. `estigmergia`: vai ao vizinho de menor rastro (rastro decai por (1−ε) por passo; +1 ao chegar); os agentes **não** sabem que o episódio terminou. `mensagens-todos`: mesma regra, mas com contagem de visitas perfeita e zerada a cada episódio, paga com K(K−1) mensagens/passo + aviso de fim.
- Por construção, `mensagens-todos` equivale a um rastro ideal apagado no início de cada episódio — a comparação isola o valor de **esquecer na hora certa** e o preço em mensagens.
- 500 execuções × 10 episódios por configuração; a unidade estatística é a execução (média dos episódios).

## Resultados (gerados pelo script; conferidos por `sims/run-all.mjs`)
Manchetes:
- sem-coordenacao (K=4): tempo 239,9 [IC95% 232,5–247,2], duplicação 50,1%, msgs/episódio 0
- mensagens-todos (K=4): tempo 96,8 [IC95% 94,8–98,9], duplicação 16,1%, msgs/episódio 1165
- estigmergia-e0 (K=4): tempo 122,0 [IC95% 119,4–124,6], duplicação 28,9%, msgs/episódio 0
- estigmergia-e0.1 (K=4): tempo 95,0 [IC95% 92,9–97,0], duplicação 13,9%, msgs/episódio 0
- sem-coordenacao (K=16): tempo 55,5 [IC95% 53,9–57,2], duplicação 46,0%, msgs/episódio 0
- mensagens-todos (K=16): tempo 24,0 [IC95% 23,5–24,5], duplicação 14,8%, msgs/episódio 5778
- estigmergia-e0 (K=16): tempo 29,5 [IC95% 28,9–30,2], duplicação 27,0%, msgs/episódio 0
- estigmergia-e0.1 (K=16): tempo 22,5 [IC95% 22,1–22,9], duplicação 12,2%, msgs/episódio 0

| Previsão | Veredicto (no modelo) | Detalhe |
|---|---|---|
| P1 | **suporta** | K=4: tempo 96,8 vs 239,9; duplicação 15,0% vs 50,1%; K=16: tempo 24,0 vs 55,5; duplicação 15,4% vs 46,0% |
| P2 | **suporta** | K=4: melhor epsilon=0.1 (t=95,0) vs epsilon=0 (122,0) e epsilon=1 (422,7); significativo=true; K=16: melhor epsilon=0.1 (t=22,5) vs epsilon=0 (29,5) e epsilon=1 (86,6); significativo=true |
| P3 | **nao-suporta** | K=4: mensagens com menor tempo=false; melhor estigmergia/mensagens=0,981; mensagens/episódio=1165; K=16: mensagens com menor tempo=false; melhor estigmergia/mensagens=0,937; mensagens/episódio=5778 |
| P4 | **suporta** | K=4: eps=0 ep10 mais lento que ep1=true; massa ep10/ep5 eps=0: 2,36; melhor eps: 1,00; K=16: eps=0 ep10 mais lento que ep1=true; massa ep10/ep5 eps=0: 2,31; melhor eps: 1,00 |

| K | Estratégia | tempo até solução (passos) [IC95%] | visitas duplicadas | msgs/episódio | massa de rastro no início do ep. 10 |
|---|---|---|---|---|---|
| 4 | sem-coordenacao | 239,9 [232,5–247,2] | 50,1% | 0 | 0 |
| 4 | mensagens-todos | 96,8 [94,8–98,9] | 16,1% | 1165 | 0 |
| 4 | estigmergia-e0 | 122,0 [119,4–124,6] | 28,9% | 0 | 4337 |
| 4 | estigmergia-e0.001 | 101,7 [99,5–103,8] | 17,3% | 0 | 2344 |
| 4 | estigmergia-e0.003 | 97,1 [95,1–99,1] | 15,9% | 0 | 1208 |
| 4 | estigmergia-e0.01 | 96,8 [94,8–98,8] | 15,0% | 0 | 397 |
| 4 | estigmergia-e0.03 | 95,2 [93,2–97,2] | 14,0% | 0 | 131 |
| 4 | estigmergia-e0.1 | 95,0 [92,9–97,0] | 13,9% | 0 | 38 |
| 4 | estigmergia-e0.3 | 115,8 [112,7–119,0] | 19,1% | 0 | 12 |
| 4 | estigmergia-e1 | 422,7 [408,6–436,9] | 68,3% | 0 | 2 |
| 16 | sem-coordenacao | 55,5 [53,9–57,2] | 46,0% | 0 | 0 |
| 16 | mensagens-todos | 24,0 [23,5–24,5] | 14,8% | 5778 | 0 |
| 16 | estigmergia-e0 | 29,5 [28,9–30,2] | 27,0% | 0 | 4177 |
| 16 | estigmergia-e0.001 | 24,0 [23,5–24,5] | 15,9% | 0 | 3023 |
| 16 | estigmergia-e0.003 | 23,6 [23,1–24,1] | 15,5% | 0 | 2420 |
| 16 | estigmergia-e0.01 | 24,0 [23,5–24,5] | 15,4% | 0 | 1362 |
| 16 | estigmergia-e0.03 | 22,8 [22,3–23,3] | 13,2% | 0 | 514 |
| 16 | estigmergia-e0.1 | 22,5 [22,1–22,9] | 12,2% | 0 | 150 |
| 16 | estigmergia-e0.3 | 22,7 [22,2–23,2] | 12,3% | 0 | 45 |
| 16 | estigmergia-e1 | 86,6 [83,5–89,7] | 61,1% | 0 | 8 |

Curvas para gráficos: `results.configs[].time_by_episode` (tempo por índice de episódio) e `trail_mass_at_episode_start` (memória acumulada).

## Interpretação
- **P1, P2, P4 suportadas.** O rastro reduz o tempo em ~2,5× e a duplicação de ~50% para ~14% vs sem coordenação. A curva em ε é em U: sem evaporação, a massa de rastro cresce linearmente (≈ 480/episódio), o rastro antigo vira ruído e os episódios ficam mais lentos (K=4: 102 → 132 passos do 1º ao 10º); com ε ≥ 0,01 (K=4) ou ε ≥ 0,03 (K=16) a massa se estabiliza em poucos episódios e o tempo fica estacionário. Com K=4 a diferença entre o melhor rastro e as mensagens não é significativa (IC sobrepostos); com K=16 o rastro é significativamente mais rápido.
- **P3 não suportada (pela 1ª cláusula):** as mensagens não foram o mínimo. O melhor rastro (ε=0,1) ficou **igual ou melhor** que a contagem perfeita por episódio (razão 0,98 com K=4 e 0,94 com K=16). Interpretação provável: com ε=0,1 o rastro codifica *recência* ("alguém passou aqui há pouco"), uma regra de dispersão melhor que a contagem acumulada do episódio. Logo, a comparação mistura informação **e** regra de decisão; "informação perfeita" não é automaticamente o limite superior.
- ε=1 (rastro some no mesmo passo) é pior que o passeio sem coordenação porque perde até a memória de "não voltar" — esquecer rápido demais também custa.
- Custo de comunicação: mensagens todos-com-todos crescem com K² (1 165 msgs/episódio com K=4; 5 778 com K=16) para desempenho equivalente ao rastro.

## Limitações
- Ambiente estático e simples (grade sem obstáculos, alvo único uniforme); a regra "menor rastro" é uma de muitas possíveis; não há custo de escrita/leitura no rastro nem contenção de acesso.
- Rastro repulsivo (cobertura); o forrageio clássico com feromônio atrativo e fontes que se esgotam não foi modelado.
- **O que precisa de validação com LLM real:** se um quadro compartilhado de "já tentei X" com expiração reduz retrabalho entre agentes LLM; custo de tokens para ler o quadro vs mensagens diretas; qual "evaporação" (TTL) funciona para o horizonte típico de uma tarefa.
