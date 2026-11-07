---
id: lit-macnet
title: MacNet — escalonamento de colaboração multiagente em DAGs ("collaborative scaling law")
area: literature
evidence: relato-autores
tags: [escalonamento-de-agentes, topologia, lei-de-escala, saturacao, comunicacao]
sources:
  - "Qian, C., Xie, Z., Wang, Y., Liu, W., Zhu, K., Xia, H., Dang, Y., Du, Z., Chen, W., Yang, C., Liu, Z. & Sun, M. (2025). Scaling Large Language Model-based Multi-Agent Collaboration. ICLR 2025. arXiv:2406.07155v3. https://arxiv.org/abs/2406.07155v3"
related: [lit-more-agents, lit-scaling-agent-systems, lit-more-llm-calls]
updated: 2026-11-07
primary_opened: true
version: "v3 (17 mar. 2025); v1 11 jun. 2024; v2 28 fev. 2025"
summary: Organizar agentes GPT-3.5 em DAGs mostra ganho de qualidade em forma logística com o número de nós e saturação por volta de 16 nós, a um custo de contexto e tokens que cresce rápido.
---

## Pergunta
Adicionar agentes que colaboram, organizados em grafo acíclico dirigido, produz uma lei de escala parecida com a neural? Quais topologias funcionam melhor?

## Método
MacNet: nós são "atores" e arestas são "críticos". O raciocínio segue a ordem topológica do DAG; cada interação tem até 3 rodadas. O controle de memória passa adiante só os artefatos, não o diálogo inteiro (Sec. 2.3). Modelo: GPT-3.5; modelos abertos só na nota de rodapé 5. Benchmarks: MMLU, HumanEval, SRDD e CommonGen-Hard; "Quality" é a média deles. Baselines: CoT, AutoGPT, GPTSwarm, AgentVerse. Topologias: chain, star, tree, mesh, layer e random. Escala de 2^0 a 2^6 nós, que segundo os autores passa de mil agentes no mesh, contando nós e arestas.

## Resultado relatado
- Tabela 1, Quality média com cerca de 4 nós: MacNet-Random 0,6522 (melhor); Mesh 0,6316; Chain 0,6078; CoT 0,5757; AgentVerse 0,5805; GPTSwarm 0,5163.
- O ganho não é uniforme. No HumanEval, MacNet-Chain (0,3720) fica abaixo de CoT (0,6098) e de AgentVerse (0,7256), embora o texto diga que a chain supera "todos os baselines".
- Lei colaborativa (Eq. 6): f(|V|) = γ / (1 + e^(−β(log|V| − α))) + δ, uma logística em log(nº de nós). Parâmetros específicos por topologia; os valores ajustados não foram publicados no HTML.
- Saturação: os autores chamam 2^4 nós de "escolha razoável" e dizem que a maioria das topologias satura por volta de cem agentes (Sec. 3.3).
- Controle: o voto majoritário melhora só 0,9% e estabiliza em cerca de 8 agentes. O AgentVerse sofre "explosão de contexto" acima de 30 agentes (Sec. 3.3).
- Topologia random leva cerca de 51,92% menos tempo que mesh. Inverter arestas degrada o resultado; topologias divergentes superam as convergentes (Sec. 3.2, Fig. 6).
- Comprimento de tokens 7,51× maior de 2^0 para 2^4 agentes; sugestões dos críticos implementadas em 93,10% dos casos (Sec. 3.4).

## Custo/compute considerado?
Parcialmente. Há análise de crescimento de contexto: O(n²) sem controle de memória, O(n) com controle (Eq. 5). Uma interação exige pelo menos 2×|E| rodadas. Também há tempo e tokens relativos. Não há custo monetário nem comparação com um agente único que receba o mesmo orçamento de tokens.

## Ameaças à validade
- Um único modelo (GPT-3.5) nos resultados principais.
- Métricas de SRDD e CommonGen dependem de avaliadores automáticos e LLM.
- A lei vale só para escala de rede; os autores deixam perfis, ferramentas e protocolos para trabalho futuro (nota 9).
- Não há baseline de agente único com compute igualado, então o ganho pode refletir mais tokens e não colaboração.
- Contradição interna entre o texto e a Tabela 1 sobre a chain no HumanEval.

## Relevância para a pergunta central
É a evidência mais citada de uma "lei de escala colaborativa", mas mede qualidade em função do número de nós, não do custo. Para a Norevia, mostra que existe uma faixa de saturação (cerca de 16 nós) e que topologia importa, sem responder se o mesmo gasto num único agente renderia mais.

## Hipóteses candidatas
- candidata: o ganho de colaboração segue uma logística em log(N) e satura cedo; o ponto ótimo de custo fica antes da saturação de qualidade.
- candidata: topologias esparsas e divergentes dão melhor qualidade por token que as densas.
- candidata: sem controle de memória, o custo de contexto cresce como O(N²) e domina qualquer ganho para N moderado.

## Verificação
Abertos em 2026-11-07: https://arxiv.org/abs/2406.07155 (v3 e ICLR 2025 confirmados no campo comments) e https://arxiv.org/html/2406.07155v3. Números extraídos por leitor automático, sem conferência manual célula a célula. Valores ajustados de α, β, γ, δ não localizados (lacuna). Resultados com modelos abertos não detalhados (lacuna).
