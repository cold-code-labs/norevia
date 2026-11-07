---
id: H-07
title: "Estigmergia com evaporação reduz comunicação e evita sinal obsoleto"
area: hypothesis
evidence: hipotese
status: suportada-preliminar
origin: "natureza (nat-stigmergy, nat-pheromone-evaporation-aco; Theraulaz & Bonabeau 1999; Ant System) + teoria (th-modelo §5, §8) + literatura (lit-agentprune)"
experiment: "sims/sim-estigmergia (proposta: ambiente que muda a taxa h) + observatory com quadro de estado vs mensagens diretas"
tags: [estigmergia, comunicacao, memoria-limitada]
sources:
  - "Theraulaz, G. & Bonabeau, E. (1999). A Brief History of Stigmergy. Artificial Life 5(2):97–116. doi:10.1162/106454699568700"
  - "Dorigo, M., Maniezzo, V. & Colorni, A. (1996). Ant system. IEEE Trans. SMC-B 26(1):29–41. doi:10.1109/3477.484436"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-stigmergy, nat-pheromone-evaporation-aco, sim-estigmergia, nat-candidatas, H-25, lit-agentprune, lit-gptswarm, H-11]
updated: 2026-11-07
summary: "Coordenar por um quadro compartilhado cujos sinais evaporam troca a comunicação quadrática de todos-com-todos por custo linear, e a evaporação certa impede que o grupo siga informação velha."
---

# H-07 — Estigmergia com evaporação reduz comunicação e evita sinal obsoleto

**Status:** `suportada-preliminar` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-stigmergy, nat-pheromone-evaporation-aco; Theraulaz & Bonabeau 1999; Ant System) + teoria (th-modelo §5, §8) + literatura (lit-agentprune)

## Enunciado
Coordenação indireta por quadro (escrever/ler) custa 2N mensagens por rodada vs N(N−1) no todos-com-todos; com o ambiente mudando a taxa h, a fração de informação obsoleta no sinal é h/(h+λ), e existe λ* que minimiza o erro (λ* ≈ 0,24 / 0,44 / 0,65 para h = 0,01 / 0,05 / 0,2 no exemplo).

## Variáveis
N, topologia, λ (evaporação/TTL), h (taxa de mudança do ambiente/estado da tarefa), ruído.

## Previsão (quantitativa/direcional)
- Para N ≥ 5, tokens de comunicação caem ≥ 50% (quadro vs todos-com-todos) com aceite igual (±2 p.p.).
- Sem evaporação (λ → 0) o erro por informação obsoleta cresce com o tempo de tarefa; com λ muito alto, a variância domina — curva em U do erro vs λ.
- O λ* medido cresce com h.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Ausência de curva em U em λ (erro monotônico), ou aceite do quadro < todos-com-todos − 2 p.p. em N ≥ 5.

## Experimento proposto
Simulação: forrageamento/busca com alvo que muda; medir erro vs λ e h. Observatório: tarefas b* com estado compartilhado (arquivo de status com TTL) vs troca de mensagens.

## Evidência atual
Simulação `sim-estigmergia` (validacao-local no modelo, pré-registrada): rastro compartilhado com evaporação ε ≈ 0,1 encontra alvos tão rápido quanto mensagens todos-com-todos (95 vs 97 passos com 4 agentes; 22,5 vs 24 com 16) com zero mensagens contra 1.165–5.778 por episódio; curva em U na evaporação (P2) e lock-in sem evaporação (P4) suportados; P3 (mensagens mais rápidas) não suportada — o que favorece a hipótese. **Escopo: só no modelo simulado**, nenhum teste em LLM. Modelo: fórmula h/(h+λ) conferida por simulação discreta. `lit-agentprune` (relato-autores): podar mensagens reduz 28–73% dos tokens sem perda de acurácia.

## Limites
Feromônio é escalar; estado de tarefas de LLM é estruturado e precisa de versão (ver ressalvas do estudo canônico sobre memória limitada).
