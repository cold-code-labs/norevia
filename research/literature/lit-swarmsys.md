---
id: lit-swarmsys
title: "SwarmSys — agentes descentralizados inspirados em enxames para raciocínio escalável"
area: literature
evidence: relato-autores
tags: [swarm, divisao-de-trabalho, estigmergia, escala-de-agentes, custo, agente-unico-vs-multiagente]
sources:
  - "Li, R.; Liu, H.; Zhao, L.; Li, Z.; Li, J.; Jiang, J.; Xu, L.; Zhao, C.; Fan, M.; Liang, C. (2025). SwarmSys: Decentralized Swarm-Inspired Agents for Scalable and Adaptive Reasoning. arXiv:2510.10047v1 (11 out. 2025). https://arxiv.org/abs/2510.10047v1"
related: [lit-gptswarm, lit-agentnet, lit-agentprune]
updated: 2026-11-07
primary_opened: true
version: "v1 (2025-10-11; única versão listada no arXiv em 2026-11-07)"
summary: "Swarm de 8 agentes GPT-4o fica abaixo de um único GPT-5 em exames (65,8% vs 68,7%) custando cerca de 5× mais por pergunta, e o ganho com mais agentes estabiliza perto de 14."
---

## Pergunta
A coordenação descentralizada inspirada em enxames (papéis Explorer/Worker/Validator, perfis adaptativos, matching probabilístico e reforço tipo feromônio) consegue melhorar o raciocínio de LLMs sem supervisor global, e o "escalonamento por coordenação" pode competir com o escalonamento do modelo?

## Método
- Três papéis em ciclo: exploração, execução e validação. Agentes e eventos têm perfis em embeddings. O matching entre eles é probabilístico. Rastros validados são reforçados e os ineficazes decaem.
- Backbone: GPT-4o (Seção 3.4).
- Benchmarks (Tabela 1): GaoKao Bench (800 amostras), Omni-Math (300), DeepResearch Bench (200), SciCode (338).
- Baselines de agente único: IO, CoT, CoT-SC (5-shot), Self-Refine, MultiPersona (todos com GPT-4o), GPT-5 e o3-mini-medium. Baselines multiagente: GPTSwarm, DeepResearchAgent e Grok Deeper Search.

## Resultado relatado
Relato dos autores, sem reprodução local.
- **Exames (Tabela 2, média de Acc./Cov. em %):** SwarmSys-8 obteve 65,8/78,2, contra 58,4/71,7 do GPTSwarm, 52,1/59,0 do CoT-SC e **68,7/83,4 do GPT-5**. O GPT-5 sozinho vence o swarm de 8 agentes GPT-4o na média. O swarm só vence em Olympic Math (42,4 vs 31,2 de acurácia). Os autores dizem que o SwarmSys "fecha mais de 70%" da distância até o GPT-5. O "+12,5%" sobre o GPTSwarm é um ganho relativo; em pontos absolutos, a diferença é de +7,4.
- **DeepResearch Bench (Tabela 3, RACE overall):** SwarmSys-8 obteve 42,5. Supera o Grok Deeper Search (40,2), mas fica abaixo do DeepResearchAgent (48,8), o que o texto não comenta.
- **SciCode (Tabela 4):** SwarmSys-14 obteve 12,5 em Pass@Main e 45,2 em Pass@Sub. O o3-mini-medium obteve 9,2/34,4, e o GPTSwarm, 8,6/29,2.
- **Escala de agentes (Tabela 5, exames, Acc./Cov.):** com A = 4, 8, 14, 20 e 32 agentes, os resultados foram 74,3/79,7, 76,2/80,2, 77,3/81,0, 77,2/81,3 e 76,5/80,8. Os autores falam em platô depois de cerca de 14 workers, com diferença "<1%" entre 14 e 32. Sem os papéis do método, as variantes aleatórias ficam entre 43% e 58%: Rand-NoRoles fica em cerca de 43–44%, e Rand-Roles, em cerca de 56–58%.

## Custo/compute considerado?
Sim, parcialmente. A Tabela 8 (Apêndice A.5) dá o custo médio em US$ por pergunta, sem tokens nem latência.
- **Exames:** SwarmSys-8 custa US$ 0,071, contra **US$ 0,014 do GPT-5**, US$ 0,012 do CoT com GPT-4o e US$ 0,077 do GPTSwarm.
- **Pesquisa:** SwarmSys-8 custa US$ 2,63, contra US$ 2,82 do DeepResearchAgent, US$ 2,85 do Grok e US$ 1,53 do Self-Refine.
- **SciCode:** SwarmSys-14 custa US$ 0,44 (instrucional) e US$ 0,019 (código), contra US$ 0,41 e US$ 0,024 do GPTSwarm.
- Não há comparação com orçamento igualado. Os preços são de 2025, não os atuais.

## Ameaças à validade
- Sem código oficial localizado; não há como reproduzir.
- Na comparação com o GPT-5, o swarm usa um modelo mais fraco. A superioridade alegada é sobre baselines com GPT-4o, não sobre o modelo de fronteira.
- Os ganhos aparecem no texto como percentuais relativos, o que infla a impressão.
- Os benchmarks são poucos, e a cobertura (Cov.) é uma métrica própria.
- Uma única versão, sem revisão por pares identificada.

## Relevância para a pergunta central
É o contraexemplo mais direto à ideia de que "swarm sempre vence". Um único modelo mais forte (GPT-5) supera o swarm de 8 agentes GPT-4o na média dos exames, custando cerca de 1/5 por pergunta. O swarm agrega valor no subdomínio mais difícil (Olympic Math) e em tarefas procedurais (SciCode). Também mostra a saturação do tamanho do swarm perto de 14 agentes.

## Hipóteses candidatas (hipótese, não validadas)
- candidata: o ganho de N agentes de um modelo mais fraco não substitui um salto de capacidade do modelo base, exceto nas faixas mais difíceis da distribuição de tarefas.
- candidata: o ganho marginal por agente satura em uma escala que depende da tarefa (≈14 aqui), e passar disso só adiciona custo.
- candidata: a estrutura de papéis explica mais o ganho do que o número de agentes (Rand-NoRoles fica plano em ≈43% com qualquer N).

## Verificação
- Aberto em 2026-11-07: https://arxiv.org/abs/2510.10047 (somente a v1) e https://arxiv.org/html/2510.10047v1 (Tabelas 1–5 e 8, Seção 3.4, Limitações).
- Conferido: o número herdado do estudo anterior (US$ 0,071 vs US$ 0,014) confere com a Tabela 8.
- Lacunas: repositório oficial não localizado; tokens e latência não reportados; não há reprodução local.
