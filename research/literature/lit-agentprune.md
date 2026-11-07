---
id: lit-agentprune
title: "AgentPrune (Cut the Crap) — poda de comunicação redundante em sistemas multiagente LLM"
area: literature
evidence: relato-autores
tags: [comunicacao, poda, custo, tokens, topologia, escala-de-agentes]
sources:
  - "Zhang, G.; Yue, Y.; Li, Z.; Yun, S.; Wan, G.; Wang, K.; Cheng, D.; Yu, J. X.; Chen, T. (2025). Cut the Crap: An Economical Communication Pipeline for LLM-based Multi-Agent Systems. ICLR 2025. https://proceedings.iclr.cc/paper_files/paper/2025/hash/bbc461518c59a2a8d64e70e2c38c4a0e-Abstract-Conference.html"
  - "arXiv:2410.02506v1 (3 out. 2024). https://arxiv.org/abs/2410.02506v1"
  - "Código declarado: https://github.com/yanweiyue/AgentPrune"
related: [lit-gptswarm, lit-swarmsys]
updated: 2026-11-07
primary_opened: true
version: "v1 (2024-10-03; única versão arXiv); ICLR 2025"
summary: "Podar mensagens redundantes entre agentes reduz de 28% a 73% dos tokens de prompt sem perder acurácia, e o ganho de 5 agentes GPT-4 sobre o melhor agente único com self-consistency fica em ~4 pp na média."
---

## Pergunta
Quanto da comunicação em sistemas multiagente LLM é redundante, e uma poda one-shot do grafo espaço-temporal de mensagens preserva a qualidade a um custo menor?

## Método
- Primeiro roda algumas rodadas no grafo completo. Depois aprende máscaras sobre as arestas espaciais (dentro da rodada) e temporais (entre rodadas), com restrição de baixa ordem e esparsidade, e poda de uma vez.
- Benchmarks: MMLU, GSM8K, MultiArith, SVAMP, AQuA e HumanEval (Seção 4.1).
- Modelos: gpt-3.5-turbo-0301 e gpt-4-1106-preview. Segundo a legenda da Tabela 1, os métodos multiagente usam 5 agentes baseados em GPT-4.
- Baselines de agente único: Vanilla, CoT, ComplexCoT, SC(CoT) e SC(ComplexCoT).
- Baselines espaciais: Chain, Star, Tree, Complete Graph, Layered, Random, LLM-Blender e GPTSwarm.
- Baselines temporais: LLM-Debate, PHP e DyLAN.

## Resultado relatado
Relato dos autores.
- **Tabela 1 (médias):**
  - Agentes únicos: Vanilla 81,65; melhor agente único SC(ComplexCoT) 85,35.
  - Multiagente: Complete Graph 86,55; GPTSwarm 86,77; LLM-Debate 87,01; PHP 87,02; DyLAN 84,48.
  - AgentPrune-C 89,72; AgentPrune-R 89,44; AgentPrune-L 88,38.
  - A média de Chain (92,92) não bate com as colunas; parece erro de digitação.
- **Custo no MMLU (resumo e Apêndice H.1):** os autores dizem que o AgentPrune "supera o GPTSwarm" a US$ 5,6, contra US$ 43,56 do GPTSwarm (US$ 43,7 no resumo). No GSM8K, o AgentPrune custa US$ 65,9 contra US$ 357,47 do DyLAN.
- **Integração em frameworks (Tabela 3/5, Seção 4.3):**
  - AutoGen no MMLU, 3 agentes: 81,94 → 82,20 com prompt tokens em 79,4% do original e custo de US$ 5,446 → US$ 4,750.
  - GPTSwarm no MMLU: 83,32 → 83,66 com prompt tokens em 35,8% do original e custo de US$ 24,99 → US$ 15,65.
  - GPTSwarm no GSM8K: US$ 234,76 → US$ 57,17.
  - A faixa declarada é de 28,1% a 72,8% de redução de tokens.
- **Número de agentes (Apêndice, Figura 21; números não legíveis no texto):** segundo os autores, há "melhora significativa de 3 para 5 agentes" e ganho "relativamente marginal de 5 para 9".
- **Robustez:** os autores declaram +3,5% a +10,8% sob dois tipos de ataque baseados em agentes. Os números por figura não foram conferidos no texto.

## Custo/compute considerado?
Sim, de forma central: tokens de prompt e de conclusão e custo em US$. Porém a comparação com o agente único não é feita com compute igual. A tabela principal não traz o custo de SC versus o do multiagente.

## Ameaças à validade
- A Tabela 1 tem uma inconsistência (média de Chain).
- Dois valores diferentes de custo para o GPTSwarm no MMLU (US$ 24,99 e US$ 43,56), sem explicação.
- Benchmarks saturados por GPT-4, com margens pequenas.
- Preços de 2024.
- Não li uma seção de limitações no texto acessado.

## Relevância para a pergunta central
- Boa parte do custo multiagente é comunicação redundante, e a poda tira de 28% a 73% dos tokens sem perda de qualidade.
- A vantagem do melhor MAS (89,72) sobre o melhor agente único com amostragem (85,35) é de 4,4 pp na média, sem controle de compute.
- O tamanho útil do grupo satura cedo, com retorno marginal acima de 5 agentes, o que é coerente com a ideia de micro-swarm.

## Hipóteses candidatas (hipótese)
- candidata: em uma configuração multiagente ótima, a maior parte das arestas de comunicação é dispensável, e o custo de coordenação pode cair muito antes de afetar a qualidade.
- candidata: o tamanho ótimo do grupo para tarefas de raciocínio de benchmark está entre 3 e 5 agentes.
- candidata: SC de agente único com compute igualado eliminaria boa parte dos 4,4 pp de vantagem (não testado no paper).

## Verificação
- Aberto em 2026-11-07:
  - https://arxiv.org/abs/2410.02506 (somente a v1)
  - https://arxiv.org/html/2410.02506v1 (lido em duas partes: Tabela 1, Tabela 3/5, Seção 4.3, Apêndice H.1)
  - Página dos proceedings ICLR 2025, que confirma o venue e os 9 autores
- Lacunas:
  - Os números da Figura 21 (escala de agentes) e da Figura 20 (robustez) não foram legíveis.
  - Licença do código não verificada.
  - Sem reprodução local.
