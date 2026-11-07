---
id: nat-pheromone-evaporation-aco
title: Feromônio com evaporação — pontes duplas e Ant Colony Optimization
area: nature
evidence: relato-autores
tags: [reforco-com-decaimento, roteamento, exploracao-explotacao, lock-in, memoria-limitada]
sources:
  - "Goss, S., Aron, S., Deneubourg, J.-L. & Pasteels, J. M. (1989). Self-organized shortcuts in the Argentine ant. Naturwissenschaften 76:579–581. doi:10.1007/BF00462870"
  - "Deneubourg, J.-L., Aron, S., Goss, S. & Pasteels, J. M. (1990). The self-organizing exploratory pattern of the Argentine ant. Journal of Insect Behavior 3:159–168. doi:10.1007/BF01417909"
  - "Dorigo, M., Maniezzo, V. & Colorni, A. (1996). Ant system: optimization by a colony of cooperating agents. IEEE Trans. SMC-B 26(1):29–41. doi:10.1109/3477.484436"
  - "Dorigo, M. & Gambardella, L. M. (1997). Ant colony system: a cooperative learning approach to the traveling salesman problem. IEEE Trans. Evol. Comput. 1(1):53–66. doi:10.1109/4235.585892"
related: [nat-stigmergy, nat-physarum-network, lit-routellm, lit-gptswarm, nat-candidatas, sim-estigmergia]
updated: 2026-11-07
verificacao: "DOIs conferidos (Crossref). Resumos Dorigo 1996/1997 lidos. PDF de Goss 1989 obtido (repositório ULB) mas é digitalização sem texto extraível — números do experimento NÃO conferidos. Deneubourg 1990: só metadados."
summary: Trilhas de feromônio reforçadas pelo uso e apagadas pela evaporação deixam a colônia convergir para caminhos curtos sem ficar presa para sempre ao primeiro achado.
---

## Mecanismo
- **Pontes duplas (Goss et al. 1989; Deneubourg et al. 1990):** formigas argentinas entre ninho e alimento com dois ramos tendem a concentrar o tráfego num ramo por realimentação positiva (quem passa deposita feromônio; mais feromônio atrai mais formigas). O ramo mais curto é reforçado mais cedo porque as idas e voltas por ele se completam antes. **Números (proporções, comprimentos, função de escolha) não conferidos no original** — PDF digitalizado sem texto. Fontes secundárias relatam ainda um efeito de **lock-in**: se o ramo curto é oferecido depois da trilha longa estabelecida, a maioria continua no longo (`lacuna` — não conferido no original).
- **Ant System (1996, resumo):** realimentação positiva para descobrir boas soluções rápido; computação distribuída para **evitar convergência prematura**; heurística gulosa construtiva. **ACS (1997, resumo):** comunicação indireta via feromônio depositado nas arestas do grafo do TSP.
- O papel da **evaporação** (decaimento do feromônio) é esquecer escolhas antigas, limitando o lock-in. (Mecanismo central do ACO; o coeficiente específico usado pelos autores não foi conferido.)

## Evidência
`fenomeno-natural` (pontes duplas, sem números conferidos) + `relato-autores` (ACO em TSP, sem reprodução local).

## Análogo de engenharia
Um **roteador** que escolhe estratégia/modelo/configuração (1 agente high-effort vs micro-swarm, qual especialista) com pesos reforçados por **resultados aceitos** e com **decaimento exponencial** (meia-vida h). Memória limitada por construção: o peso antigo some.

## Hipótese testável
- **Variável:** meia-vida h do reforço do roteador (∞ = sem evaporação; 50; 200 tarefas) e mudança abrupta na distribuição de tarefas no meio do fluxo.
- **Métrica:** custo por tarefa aceita antes e depois da mudança; nº de tarefas até recuperar 90% do desempenho pós-mudança (tempo de readaptação).
- **Previsão:** h = ∞ sofre lock-in (readaptação > 3× mais lenta que h = 50); h finito perde ≤ 5% no regime estacionário. Existe h intermediário que domina ambos os extremos.
- **Refutação:** se h = ∞ readaptar tão rápido quanto h finito (sem lock-in), ou se qualquer evaporação custar > 5% no estacionário, a analogia não ajuda.

## Limites da transferência
Formigas reforçam pelo *tempo de percurso*, um sinal físico gratuito; no LLM o reforço depende de aceite confiável. Reforço por "mensagens"/popularidade (não por aceite) reproduz o risco apontado no estudo anterior para SYMBIONT. ACO é heurística para otimização combinatória, não prova sobre roteamento de agentes.
