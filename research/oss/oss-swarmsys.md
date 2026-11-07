---
id: oss-swarmsys
title: SwarmSys — código oficial não localizado (Explorers/Workers/Validators só no paper)
area: oss
evidence: lacuna
tags: [divisao-de-trabalho, validadores, feromonio, sem-codigo-oficial]
sources:
  - "Li et al. (2025). SwarmSys: Decentralized Swarm-Inspired Agents for Scalable and Adaptive Reasoning. arXiv:2510.10047v1. https://arxiv.org/abs/2510.10047v1"
  - "Busca GitHub (MCP search_repositories, query 'SwarmSys', 2026-11-07): nenhum repositório atribuível aos autores"
related: [oss-agentnet, oss-symbiont, oss-stigmergic, oss-matriz]
updated: 2026-11-07
summary: SwarmSys descreve exploradores, executores e validadores com reforço de rastros validados, mas não há código oficial público para inspecionar o mecanismo.
---

## Identificação
- Paper: arXiv:2510.10047v1 (autores listados na página abs: Ruohao Li, Hongjun Liu, Leyi Zhao, Zisu Li, Jiawei Li, Jiajun Jiang, Linning Xu, Chen Zhao, Mingming Fan, Chen Liang). Página abs consultada em 2026-11-07: o campo de comentários traz apenas "14 pages, 7 figures"; não há link de código.
- Repositório oficial: **não localizado**. A busca no GitHub por `SwarmSys` retornou apenas projetos homônimos sem vínculo com os autores (ex.: `vzbb/swarmsys`, `smir1998/SwarmSys-AI`, `HODLKONG64/SWARMSY-Ai`); nenhum foi atribuído ao paper nem inspecionado.
- Commit SHA: inexistente (não há código). Licença: lacuna.

## Mecanismo
Somente **[paper/relato dos autores]**, conforme o estudo anterior (A4 Master, rev. 2, linhas 21–30) e a página abs: papéis Explorers, Workers e Validators; perfis adaptativos de agentes e eventos; matching probabilístico por embeddings; reforço tipo feromônio de rastros validados e decaimento dos ineficazes. Nenhum item (término, aceite, orçamento, memória, retry, poda, elasticidade) pôde ser verificado em código.

## Evidência
- Implementação observada: nenhuma.
- Relato dos autores (via estudo anterior, não reconferido nesta rodada): tabela de custo do paper registra US$ 0,071 por pergunta para SwarmSys-8 contra US$ 0,014 para GPT-5 no bloco instrucional, nas condições do artigo. Não é preço atual nem previsão para o Observatory.
- Nenhum código foi executado; nenhum benchmark reproduzido.

## Análogo de engenharia
**Hipótese:** o papel de Validator é o ponto mais transferível — o reforço de rotas deveria depender de aceite verificado, não de atividade (contraste com `oss-symbiont`). No Observatory, isso se traduz em atualizar pesos de roteamento apenas com tarefas aceitas por verificador mecânico.

## Hipótese testável
**Hipótese:** um roteador que reforça pares (agente, tipo de tarefa) somente após aceite mecânico reduz custo por tarefa aceita em relação a um roteador que reforça por volume de mensagens, sem aumentar a taxa de falso sucesso. Métrica: custo por tarefa aceita e taxa de falso sucesso em conjunto reservado.

## Limites/lacunas
- Sem código oficial: mecanismo, defaults e critérios de término são desconhecidos na prática.
- Se um repositório oficial for publicado, abrir novo cartão com SHA; não atribuir homônimos ao paper.

## Linha da matriz
| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ? sem código | ? validadores descritos só no paper | ? | ? decaimento descrito só no paper | ? | ? | ? sem repositório |
