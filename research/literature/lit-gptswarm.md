---
id: lit-gptswarm
title: "GPTSwarm — agentes de linguagem como grafos otimizáveis"
area: literature
evidence: relato-autores
tags: [topologia, otimizacao-de-grafo, self-consistency, escala-de-agentes, custo]
sources:
  - "Zhuge, M.; Wang, W.; Kirsch, L.; Faccio, F.; Khizbullin, D.; Schmidhuber, J. (2024). GPTSwarm: Language Agents as Optimizable Graphs. Proceedings of the 41st International Conference on Machine Learning (ICML 2024), PMLR 235:62743–62767. https://proceedings.mlr.press/v235/zhuge24a.html"
  - "arXiv:2402.16823v3 (22 ago. 2024), título 'Language Agents as Optimizable Graphs'. doi:10.48550/arXiv.2402.16823. https://arxiv.org/abs/2402.16823v3"
  - "Código declarado no arXiv: https://github.com/metauto-ai/gptswarm"
related: [lit-agentprune, lit-swarmsys, lit-agentnet]
updated: 2026-11-07
primary_opened: true
version: "arXiv v3 (2024-08-22); PMLR v235 (2024)"
summary: "Otimizar as conexões entre agentes ajuda em crosswords e HumanEval, mas no GAIA 7 agentes ToT com voto ganham só ~5 pp sobre 1 agente ToT com cerca de 6× o tempo."
---

## Pergunta
Representar agentes LLM como grafos computacionais (nós = operações/consultas ao LLM; arestas = fluxo de informação) e otimizar automaticamente prompts (nós) e conectividade (arestas) melhora a orquestração multiagente?

## Método
- Swarm como grafo composto. As arestas são otimizadas por REINFORCE sobre uma distribuição de arestas, e os nós por refinamento de prompt.
- Experimentos:
  - MMLU em cenários adversarial e colaborativo, com GPT-4-Turbo
  - Mini Crosswords, com GPT-3.5-Turbo
  - HumanEval
  - GAIA, com GPT-4-Turbo e ferramentas

## Resultado relatado
Relato dos autores; seções da arXiv v3.
- **MMLU colaborativo (Seção 3.1.2):** com 7 agentes IO, o grafo otimizado melhora em 2,1% ± 1,1% sobre o baseline (5 seeds). No cenário adversarial, os autores reconhecem que **não há melhora de score sobre o baseline de agente único** e atribuem isso a agentes IO com prompts idênticos.
- **MMLU vs. outros MAS (Apêndice D.1, Tabela 3):** Multiagent Debate obteve 0,5751, DyLAN 0,8366 e GPTSwarm 0,8301.
- **Mini Crosswords (Seção 3.2):** o grafo otimizado obteve 0,575 ± 0,0275, contra 0,465 da distribuição inicial e 0,320 da agregação best-of-three. O controle com θ fixo obteve 0,510. O mesmo grafo avaliado com GPT-4-Turbo chegou a 0,800.
- **HumanEval (Seção 3.3):** a acurácia sobe de 0,76 para 0,88 ± 0,007 com a otimização online.
- **GAIA (Seção 3.4, Tabela 1):** o GPTSwarm teve média de 18,45, contra 9,70 do GPT-4-Turbo e 14,6 do GPT-4 com plugins.
- **Ablação no GAIA Level 1 (Tabela 2):**
  - Agentes únicos: IO 16,60; COT_web 18,87; TOT 25,66.
  - Self-Consistency com N agentes TOT: 3 → 28,30; 5 → 29,06; 7 → 30,56.
  - Tempo: 1 TOT ≈ 71,31 s; 3 TOT ≈ 181,15 s; 7 TOT ≈ 414,89 s. Segundo os autores, o tempo cresce de forma aproximadamente linear com o número de agentes.

## Custo/compute considerado?
Sim, em apêndices (Tabela 11 do Apêndice F e Tabela 3 do Apêndice D.1), com US$ e tokens.
- **MMLU (3A3T):** otimização US$ 5,32; inferência US$ 1,82. O Multiagent Debate custa US$ 32,8. O DyLAN custa US$ 105,93 na otimização e US$ 14,99 na inferência.
- **HumanEval:** sem otimização, US$ 1,61; com otimização, US$ 28,46.
- **Crosswords:** a otimização de arestas custa US$ 77,42 com 50.394.028 tokens de prompt.
- Não há comparação com compute igualado entre swarm e agente único. O custo da otimização é pago à parte.

## Ameaças à validade
- No GAIA, a variante principal não usa otimização de grafo (Seção 3.4), de modo que o ganho reportado ali vem de ensemble e voto.
- Subconjuntos pequenos: 153 questões MMLU na otimização e 20 problemas de crosswords.
- Modelos e preços de 2024.
- No cenário adversarial, o resultado é "assintoticamente igual" ao baseline.

## Relevância para a pergunta central
- No GAIA, o ganho de escalar de 1 para 7 agentes TOT (25,66 → 30,56) é de cerca de 5 pp para cerca de 5,8× o tempo, com retornos decrescentes.
- Trocar o modelo, em vez de adicionar agentes, deu ganho maior: o mesmo grafo de crosswords passa de 0,575 para 0,800 com GPT-4-Turbo.
- Mostra que a topologia importa: o grafo otimizado vence best-of-three, que obteve 0,320.

## Hipóteses candidatas (hipótese)
- candidata: N cópias homogêneas do mesmo agente agregam pouco quando os erros são correlacionados; o ganho exige diversidade de operadores (TOT vs IO).
- candidata: o upgrade de modelo domina a otimização de topologia em ganho por dólar em tarefas de raciocínio puro.
- candidata: o custo amortizado da otimização de topologia só se paga com volume alto de tarefas semelhantes.

## Verificação
- Aberto em 2026-11-07:
  - https://arxiv.org/abs/2402.16823 (versões v1–v3; v3 de 2024-08-22)
  - https://arxiv.org/html/2402.16823v3 (Seções 3.1–3.4, Tabelas 1–4 e 11, Apêndices D, F e G)
  - https://proceedings.mlr.press/v235/zhuge24a.html (páginas 62743–62767)
- Lacunas:
  - O PDF arXiv v3 não pôde ser lido (conteúdo binário); usei a versão HTML.
  - A página OpenReview (uTC9AFXIhg) ficou bloqueada por verificação de navegador; não confirmei se a apresentação foi oral.
  - A licença MIT e o README são herdados do estudo anterior e não foram reabertos aqui.
