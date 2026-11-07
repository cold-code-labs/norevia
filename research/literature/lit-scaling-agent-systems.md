---
id: lit-scaling-agent-systems
title: Towards a Science of Scaling Agent Systems — quando arquiteturas multiagente ajudam ou atrapalham
area: literature
evidence: relato-autores
tags: [lei-de-escala, single-vs-multi, saturacao-de-capacidade, amplificacao-de-erro, overhead, arquitetura]
sources:
  - "Kim, Y., Gu, K., Park, C., Park, C., Schmidgall, S., Heydari, A. A., Yan, Y., Zhang, Z., Zhuang, Y., Liu, Y., Malhotra, M., Liang, P. P., Park, H. W., Yang, Y., Xu, X., Du, Y., Patel, S., Althoff, T., McDuff, D. & Liu, X. (2025/2026). Towards a Science of Scaling Agent Systems. arXiv:2512.08296v3. doi:10.48550/arXiv.2512.08296. https://arxiv.org/abs/2512.08296v3"
  - "Blog dos autores (secundário, não usado para números): https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/"
related: [lit-macnet, lit-sas-vs-mas-hybrid, lit-sas-equal-thinking-budget, lit-more-llm-calls]
updated: 2026-11-07
primary_opened: true
version: "v3 (8 abr. 2026); v1 9 dez. 2025; v2 17 dez. 2025"
summary: Em 260 configurações com orçamento de tokens igualado, o multiagente varia de +80,8% a −70% em relação ao agente único conforme a tarefa, com retorno negativo quando o agente único já passa de cerca de 45% de acerto.
---

## Pergunta
Existem princípios quantitativos que prevejam quando uma arquitetura multiagente supera o agente único (SAS), dados a capacidade do modelo, a tarefa e a coordenação?

## Método
Seis benchmarks agênticos: BrowseComp-Plus, Finance-Agent, PlanCraft, WorkBench, SWE-bench Verified e Terminal-Bench (os dois últimos em subconjuntos de 20 instâncias). Nove modelos de três famílias: GPT-5-nano/mini/5, Gemini-2.0 Flash/2.5 Flash/2.5 Pro e Claude Sonnet 3.7/4/4.5. Cinco arquiteturas: SAS, Independent (paralelo e só síntese), Centralized (orquestrador), Decentralized (debate todos-com-todos) e Hybrid. São 260 configurações com 50–100 instâncias cada nos quatro benchmarks principais. Orçamento igualado em tokens de raciocínio totais (média de 4.800 por tentativa) e acesso igual a ferramentas (Sec. 4.1, 4.4, Tabela 5). Regressão com preditores padronizados: capacidade, nº de ferramentas, baseline SAS, overhead, densidade de mensagens, redundância, eficiência e amplificação de erro (Tabelas 3–4).

## Resultado relatado
- Dependência da tarefa (Sec. 4.2, Fig. 2): Finance-Agent Centralized +80,8% (0,631 vs 0,349 do SAS). PlanCraft Independent −70,0%, Centralized −50,3%, Hybrid −39,1%. BrowseComp-Plus Decentralized +9,2%. SWE-bench Verified: todos os MAS negativos (−2,1% a −14,9%). Terminal-Bench Centralized −19,2%. Média geral do MAS −0,3% (IC 95% de −58,7% a +77,2%).
- Saturação de capacidade: "coordination yields diminishing returns beyond ∼45% single-agent baselines" (Conclusão). A interação P_SA × log(1+n_a) tem β = −0,236 (p = 0,004; Tabela 4). Os autores a chamam de "the most robustly supported result"; na Sec. 4.5, o limiar acerta 94% das 16 configurações de SWE-bench e Terminal-Bench.
- Amplificação de erro no nível do traço (Tabela 5): SAS 1,0; Independent 17,2; Decentralized 7,8; Hybrid 5,1; Centralized 4,4. O efeito principal não é significativo após controles (p = 0,658).
- Eficiência (Tabela 5): sucessos por 1K tokens: SAS 67,7; Independent 42,4; Decentralized 23,9; Centralized 21,5; Hybrid 13,6. Overhead de turnos: 0% (SAS), 58%, 263%, 285% e 515%. Turnos crescem como T = 2,72·(n+0,5)^1,724 (R² = 0,974).
- Ajuste do modelo: R²_CV = 0,373 (±0,170) com Intelligence Index e 0,413 com uma métrica de capacidade ancorada na tarefa (Tabela 3). Escolhe a melhor arquitetura em 87% das configurações reservadas.
- Fora da amostra (GPT-5.2, Gemini-3.0 Pro/Flash no BrowseComp-Plus): MAE = 0,077 em 15 previsões; 11 de 15 pares achado-modelo validados.
- Número de agentes: exploração preliminar até 9 (n_a ∈ {1,3,5,7,9}; Fig. 5). Acima de 3–4 agentes, a qualidade por agente cai muito com orçamento fixo.
- Modelos heterogêneos (13 configurações no BrowseComp-Plus): misturar modelos não contorna a saturação. O Centralized heterogêneo fica em média 12,6 pp abaixo do homogêneo forte.

## Custo/compute considerado?
Sim, e é o ponto forte: orçamento de tokens igualado entre arquiteturas, além de métricas de overhead, turnos e sucesso por 1K tokens.

## Ameaças à validade
- R²_CV de cerca de 0,37–0,41: o modelo explica menos da metade da variância e prevê mal valores absolutos entre domínios. Os autores dizem que a seleção relativa é mais estável.
- Subconjuntos de 20 instâncias em SWE-bench e Terminal-Bench; alta variabilidade no BrowseComp-Plus (CV = 0,32).
- Agentes homogêneos dentro de cada configuração; escala de agentes só até 9.
- O leitor automático apontou uma possível inconsistência de sinal na derivação do limiar (Sec. 4.3 vs Tabela 4); não conferi manualmente.
- Preprint sem venue declarado.

## Relevância para a pergunta central
É o trabalho mais próximo da pergunta da Norevia: compara SAS e MAS com orçamento igualado e propõe preditores (capacidade-base, tipo de tarefa, ferramentas, verificação central) da arquitetura ótima. Indica que boa parte da "lei" já começou a ser formulada por outros. A novidade possível da Norevia está na alocação dinâmica durante a execução e na inclusão do esforço de raciocínio individual como variável contínua; aqui as arquiteturas são escolhas fixas por configuração.

## Hipóteses candidatas
- candidata: acima de cerca de 45% de acerto do agente único, adicionar agentes tem retorno marginal negativo; o controlador deve tratar isso como limiar de contração.
- candidata: tarefas decomponíveis em subproblemas paralelos ganham com orquestração central; tarefas sequenciais e dependentes de estado perdem com qualquer MAS.
- candidata: uma etapa de verificação central limita a amplificação de erro; sem ela, agentes independentes propagam erros.
- candidata: o overhead de turnos cresce de forma superlinear em n (expoente cerca de 1,7), fixando um teto prático de cerca de 3–4 agentes com orçamento fixo.

## Verificação
Abertos em 2026-11-07: https://arxiv.org/abs/2512.08296 (v3, 20 autores, DOI arXiv) e https://arxiv.org/html/2512.08296v3 (lido inteiro em duas partes). Números extraídos por leitor automático, sem conferência manual célula a célula. Venue de publicação não identificado (lacuna).
