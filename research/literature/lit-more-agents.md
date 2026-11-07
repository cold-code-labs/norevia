---
id: lit-more-agents
title: 'More Agents Is All You Need — sampling-and-voting (Agent Forest)'
area: literature
evidence: relato-autores
tags: [escalonamento-de-agentes, sampling-and-voting, dificuldade, ensemble]
sources:
  - "Li, J., Zhang, Q., Yu, Y., Fu, Q. & Ye, D. (2024). More Agents Is All You Need. Transactions on Machine Learning Research (TMLR). arXiv:2402.05120v2. https://arxiv.org/abs/2402.05120v2"
  - "Código: https://github.com/MoreAgentsIsAllYouNeed/AgentForest (não inspecionado)"
related: [lit-self-consistency, lit-more-llm-calls, lit-large-language-monkeys, lit-macnet]
updated: 2026-11-07
primary_opened: true
version: "v2 (11 out. 2024); v1 3 fev. 2024"
summary: Amostrar o mesmo LLM várias vezes e votar melhora o resultado com o número de "agentes", com ganho maior em tarefas mais difíceis e modelos mais fracos, mas sem análise de custo igualado.
---

## Pergunta
O desempenho de um LLM escala só com o número de instâncias ("agentes") que amostram respostas independentes e votam, sem colaboração estruturada?

## Método
"Agent Forest": N amostras independentes do mesmo modelo e prompt; voto majoritário por frequência (múltipla escolha) ou por similaridade BLEU (código) (Sec. 3, App. A.4). Ensemble de até 40 nos experimentos principais (Sec. 4). Modelos: Llama2-13B, Llama2-70B, GPT-3.5-Turbo; GPT-4 só como referência de agente único. Tarefas: GSM8K, MATH, Chess, MMLU, HumanEval. Também combinado com CoT, Zero-shot CoT, SPP, Debate e Reflection (Tabela 3). Análise de dificuldade numa tarefa sintética com GPT-3.5 (Sec. 6).

## Resultado relatado
- Tabela 2 (agente único → ensemble de 40): GSM8K Llama2-13B 0,35→0,59; Llama2-70B 0,54→0,74; GPT-3.5 0,73→0,85. MATH GPT-3.5 0,29→0,39. HumanEval GPT-3.5 0,67→0,73. Chess Llama2-70B 0,12→0,13. GPT-4 agente único: GSM8K 0,88, MATH 0,40.
- Faixas de ganho absoluto (Sec. 5.1): GSM8K 12–24 pontos; MATH 6–10; Chess 1–4; MMLU 5–11; HumanEval 4–9.
- Modelo menor com mais amostras supera o maior com uma só: Llama2-13B com ensemble (0,59) > Llama2-70B com uma amostra (0,54) no GSM8K. Segundo a legenda da Fig. 1, isso já ocorre com cerca de 15 amostras.
- Ganho relativo maior em modelo mais fraco (Tabela 6): GSM8K +69% / +37% / +16% e MATH +200% / +120% / +34% para Llama2-13B / 70B / GPT-3.5.
- Dificuldade (Sec. 6, Fig. 6): o ganho sobe e depois cai com a dificuldade intrínseca I. O pico fica em I=100–200; em I=400 o ganho diminui. O ganho cresce com o número de passos S (1→8) e com prior menor (1/4→1/32).
- Hierárquico heterogêneo (GPT-3.5 filtra, GPT-4 decide): na tarefa sintética, a acurácia do GPT-4 com K=32 sobe de 35% para 47% (Fig. 7, à direita).
- Debate combinado com o ensemble chega a 0 no HumanEval com Llama2-13B/70B. Os autores atribuem o resultado ao ruído de referenciar respostas de outros agentes (Sec. 5.2).

## Custo/compute considerado?
Pouco. A Tabela 5 dá tokens por agente com GPT-3.5 (ex.: GSM8K 235±54; MATH 326±131; HumanEval 495±120); o custo cresce linearmente com N. O Debate foi limitado a 10 agentes por "overhead computacional significativo" (Sec. 4). Não há comparação com orçamento igualado entre "modelo maior" e "N amostras do menor" além da acurácia; a Sec. 7 só aponta o custo como limitação.

## Ameaças à validade
- A saturação em função de N não é quantificada. A ANOVA (Tabela 7) mostra que existem diferenças entre N ∈ {1,10,20,30,40}, não onde o ganho satura.
- Número de execuções inconsistente: 10 na Sec. 4, 20 na Sec. 5.4.
- A tarefa sintética de dificuldade é artificial, e a curva só foi medida com GPT-3.5.
- Modelos de 2023, sem raciocínio estendido. Não se sabe se o ganho persiste com modelos de reasoning.

## Relevância para a pergunta central
É a linha de base mais simples de "N agentes": cooperação sem comunicação. Mostra que parte do ganho atribuído a swarms pode vir só de amostragem e voto. Também indica que o ganho depende da dificuldade de forma não monotônica, o que pede uma política adaptativa e não um N fixo.

## Hipóteses candidatas
- candidata: o ganho de amostragem e voto é maior quando a capacidade individual está numa faixa intermediária; com tarefa trivial ou impossível para o modelo, o ganho some.
- candidata: N amostras de um modelo menor substituem um modelo maior só abaixo de um limiar de dificuldade; acima dele, o modelo maior domina com custo igualado.
- candidata: qualquer comparação de swarm deve incluir "Agent Forest com o mesmo número de chamadas" como controle mínimo.

## Verificação
Abertos em 2026-11-07: https://arxiv.org/abs/2402.05120 (página abs; v2 confirmada) e https://arxiv.org/html/2402.05120v2 (texto completo). Os números foram extraídos do HTML v2 com leitor automático (WebFetch); não houve conferência manual célula a célula no PDF. O PDF não pôde ser lido como texto. Código não inspecionado. Não identifiquei DOI de TMLR (lacuna).
