---
id: lit-agentnet
title: "AgentNet — coordenação evolutiva descentralizada para sistemas multiagente LLM"
area: literature
evidence: relato-autores
tags: [descentralizacao, especializacao, memoria-limitada, roteamento, escala-de-agentes]
sources:
  - "Yang, Y.; Chai, H.; Shao, S.; Song, Y.; Qi, S.; Rui, R.; Zhang, W. (2025). AgentNet: Decentralized Evolutionary Coordination for LLM-based Multi-Agent Systems. NeurIPS 2025 (Main Conference Track). doi:10.52202/085713-3578. arXiv:2504.00587v2 (29 mai. 2025). https://arxiv.org/abs/2504.00587v2"
  - "Registro NeurIPS: https://proceedings.neurips.cc/paper_files/paper/2025/hash/9a379c1b05793d1c42dc832269834515-Abstract-Conference.html"
related: [lit-swarmsys, lit-gptswarm]
updated: 2026-11-07
primary_opened: true
version: "v2 (2025-05-29); v1 de 2025-04-01"
summary: "Com 3 agentes, AgentNet empata ou supera por pouco os baselines e às vezes perde para eles; o ganho com mais agentes é pequeno e decrescente, e nenhum custo em tokens é medido."
---

## Pergunta
Um sistema multiagente sem orquestrador central, com grafo dinâmico (DAG) e memória de trajetórias por recuperação (RAG) de capacidade limitada, consegue especializar agentes e superar baselines de agente único e multiagente centralizados?

## Método
- Cada agente roteia tarefas pelo DAG e especializa-se recuperando trajetórias bem-sucedidas de um pool com limite C_max. Trajetórias menos pertinentes são podadas.
- Backbones: DeepSeek-V3, GPT-4o-mini e Qwen-turbo, com temperatura 0,0 e max tokens 2048.
- Benchmarks com divisões próprias: MATH (700 de treino / 140 de teste), BBH (627/100) e API-Bank (100/100).
- Baselines de agente único: Direct, ReAct, Synapse, Self-Consistency e Self-Refinement. Baselines multiagente: MorphAgent, MetaGPT, AFLOW e GPTSwarm. Todos os métodos multiagente usam 3 agentes.

## Resultado relatado
Relato dos autores.
- **Tabela 1 (acurácia em %):**
  - Com DeepSeek-V3: AgentNet obteve 92,86 em MATH (MetaGPT 92,14), 94,00 em BBH (Synapse 92,00) e 30,00 em API-Bank (ReAct/SC 29,00).
  - Com GPT-4o-mini: empate em MATH (85,00, igual a AFLOW/GPTSwarm) e em BBH (86,00, igual ao GPTSwarm). Em API-Bank, 29,00 contra 24,00 do ReAct.
  - Com Qwen-turbo: **perde** em MATH (81,43 vs 82,14 do AFLOW). Vence em BBH (92,00 vs 75,00 do GPTSwarm) e em API-Bank (32,00 vs 30,00).
- **Escala (Seção 5.1, Figura 8):** a acurácia de treino passa de 80,38 (3 agentes, 30 executores) para 81,18 (9 agentes, 40 executores). Os autores descrevem retornos decrescentes. O teste fica entre 80 e 86.
- **Heterogeneidade (Tabela 2, BBH):** com 3 agentes, a configuração homogênea obteve 0,86, contra 0,81 da heterogênea em LLM. Com 5 agentes, a homogênea cai para 0,79, e a heterogênea em skill obtém 0,86.
- **Ablação da evolução (Tabela 3, GPT-4o-mini):** sem evolução, os resultados foram 77,86 em MATH, 76,00 em BBH e 23,00 em API-Bank; com evolução, 85,00, 86,00 e 32,00.

## Custo/compute considerado?
Não. Não há medição de tokens, custo ou latência. A frase do resumo sobre "melhorar eficiência" não vem com números no texto lido. Nenhum valor de C_max foi reportado e não há varredura do tamanho de memória.

## Ameaças à validade
- Conjuntos de teste pequenos: 100–140 itens, de modo que 1 ponto em BBH corresponde a 1 questão.
- Divisões próprias dos benchmarks.
- Margens de 0–2 pontos sem intervalos de confiança.
- Há tarefas que exigem treino evolutivo prévio.
- Os autores reconhecem que o router escolhe entre poucos candidatos predefinidos.
- Nenhum repositório oficial validado.

## Relevância para a pergunta central
Com orçamento não controlado, a vantagem multiagente sobre agente único bem configurado (Synapse, SC, ReAct) é pequena e inconsistente. Aumentar o número de agentes rende pouco (+0,8 pp no treino indo de 3 para 9 agentes). A especialização via memória (evolução) é o que mais pesa: +7 a +10 pp. Diversidade importa de forma não trivial: homogêneo é melhor com 3 agentes, heterogêneo com 5.

## Hipóteses candidatas (hipótese)
- candidata: o valor de um micro-swarm vem mais da memória especializada acumulada do que da cooperação em tempo de inferência.
- candidata: a diversidade de agentes só compensa acima de um tamanho mínimo de grupo; abaixo dele, adiciona ruído.

## Verificação
- Aberto em 2026-11-07:
  - https://arxiv.org/abs/2504.00587 (v1 de 2025-04-01 e v2 de 2025-05-29)
  - https://arxiv.org/html/2504.00587v2 (Tabelas 1–3, Seção 5.1, Seção 6)
  - Registro NeurIPS 2025, que confirma o Main Conference Track e o DOI 10.52202/085713-3578
- Lacunas: o PDF da versão NeurIPS não foi comparado com a v2; não há código oficial; não há custo.
