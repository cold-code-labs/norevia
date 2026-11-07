---
id: nat-physarum-network
title: Physarum — rede que engrossa com o fluxo e encolhe sem uso
area: nature
evidence: fenomeno-natural
tags: [topologia, poda-de-comunicacao, reforco-com-decaimento, custo-robustez]
sources:
  - "Tero, A., Takagi, S., Saigusa, T., Ito, K., Bebber, D. P., Fricker, M. D., Yumiki, K., Kobayashi, R. & Nakagaki, T. (2010). Rules for biologically inspired adaptive network design. Science 327(5964):439–442. doi:10.1126/science.1177894"
  - "Nakagaki, T., Yamada, H. & Tóth, Á. (2000). Maze-solving by an amoeboid organism. Nature 407:470. doi:10.1038/35035159"
related: [nat-pheromone-evaporation-aco, nat-stigmergy, lit-agentprune, lit-gptswarm, nat-candidatas]
updated: 2026-11-07
verificacao: "Texto de Tero 2010 lido (cópia PDF em pdodds.w3.uvm.edu, extraída localmente; equações abaixo conferidas). Nakagaki 2000: resumo (Semantic Scholar)."
summary: O bolor limoso liga 36 fontes de alimento num mapa de Tóquio com custo, eficiência e tolerância a falhas comparáveis às da malha ferroviária, usando só a regra local "tubo com fluxo engrossa, tubo sem fluxo encolhe".
---

## Mecanismo
- **Experimento:** *Physarum polycephalum* conectou um molde de **36 fontes de alimento** posicionadas como cidades da região de Tóquio; a rede resultante teve custo (comprimento total), eficiência de transporte e tolerância a falhas comparáveis às da rede ferroviária real, com cerca de **30% do número máximo possível de ligações**. A rede ferroviária teve tolerância a falhas marginalmente melhor; Physarum, custo marginalmente menor.
- **Modelo (texto conferido):** fluxo de Hagen-Poiseuille Q_ij = D_ij (p_i − p_j)/L_ij; a cada passo, uma fonte aleatória injeta I₀ e outra retira I₀. A condutância evolui por **dD_ij/dt = f(|Q_ij|) − D_ij**, com **f(|Q|) = |Q|^γ/(1 + |Q|^γ)** (sigmoide; γ controla a não linearidade). O 2º termo é a constrição: **sem fluxo, o tubo desaparece**.
- **Parâmetros:** I₀ = 2, γ = 1,8 dá redes parecidas com Physarum e ferrovia; I₀ = 0,20, γ = 1,15 dá topologia muito próxima da ferrovia de Tóquio. **Aumentar I₀** cria rotas alternativas (mais tolerância a falhas e eficiência, **maior custo**); **reduzir I₀ ou aumentar γ** leva à árvore geradora mínima (barata, frágil). Adicionar ligações aleatórias à árvore mínima deu redes com tolerância a falhas ruim.
- Nakagaki et al. (2000): o organismo encontra o caminho de comprimento mínimo entre dois pontos num labirinto.

## Evidência
`fenomeno-natural` (experimento) + `relato-autores` (modelo).

## Análogo de engenharia
Grafo de comunicação entre agentes em que o peso de cada aresta (quem lê quem) **cresce com fluxo útil** — informação que contribuiu para um aceite — e **decai** sem uso; arestas abaixo de um piso são podadas. I₀ (quanto "fluxo" circula por rodada) é o botão custo × robustez: mais redundância custa mais tokens mas tolera agente falho.

## Hipótese testável
- **Variável:** topologia — (A) completa (todos leem todos); (B) estática esparsa aleatória com mesmo nº de arestas que C; (C) adaptativa Physarum-like (reforço por contribuição a aceite + decaimento), com I₀ ∈ {baixo, alto}.
- **Métrica:** tokens de comunicação por aceite; aceite; queda de aceite ao remover 1 agente aleatório (tolerância a falha).
- **Previsão:** C atinge aceite ≥ A − 2 p.p. com ≤ 40% dos tokens de comunicação de A; C supera B em tolerância a falha ao mesmo custo; I₀ alto aumenta tolerância e custo (relação monotônica, como no modelo).
- **Refutação:** se C não superar B (adaptatividade irrelevante), ou se a atribuição de "contribuição a aceite" for tão ruidosa que C ≈ B.

## Limites da transferência
O fluxo de protoplasma é conservado e medido localmente sem erro; "contribuição de uma mensagem a um aceite" exige atribuição de crédito, que é difícil e cara. O experimento otimiza transporte físico, não raciocínio.
