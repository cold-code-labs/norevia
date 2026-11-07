---
id: nat-brain-energy-sparse
title: Orçamento energético do cérebro e codificação esparsa
area: nature
evidence: fenomeno-natural
tags: [esparsidade, orcamento, ativacao-esparsa, custo-por-unidade, macro-swarm]
sources:
  - "Raichle, M. E. & Gusnard, D. A. (2002). Appraising the brain's energy budget. PNAS 99(16):10237–10239. doi:10.1073/pnas.172399499 (PMC124895)"
  - "Attwell, D. & Laughlin, S. B. (2001). An energy budget for signaling in the grey matter of the brain. J. Cereb. Blood Flow Metab. 21(10):1133–1145. doi:10.1097/00004647-200110000-00001"
  - "Lennie, P. (2003). The cost of cortical computation. Current Biology 13(6):493–497. doi:10.1016/S0960-9822(03)00135-0"
  - "Levy, W. B. & Baxter, R. A. (1996). Energy efficient neural codes. Neural Computation 8(3):531–543. doi:10.1162/neco.1996.8.3.531"
  - "Olshausen, B. A. & Field, D. J. (1996). Emergence of simple-cell receptive field properties by learning a sparse code for natural images. Nature 381:607–609. doi:10.1038/381607a0"
related: [nat-renal-filtration, nat-response-threshold, lit-mixture-of-agents, lit-routellm, nat-candidatas]
updated: 2026-11-07
verificacao: "Raichle & Gusnard: página PMC lida (OpenAlex trazia resumo trocado — descartado). Attwell & Laughlin, Lennie, Levy & Baxter, Olshausen & Field: resumos (OpenAlex/Europe PMC)."
summary: O cérebro tem ~2% do peso corporal e consome ~20% do oxigênio; como cada disparo é caro, só uma pequena fração dos neurônios (≤15%, talvez <1%) pode estar muito ativa ao mesmo tempo.
---

## Mecanismo
- **Orçamento (Raichle & Gusnard 2002):** no adulto médio, o cérebro representa **~2% do peso corporal** e responde por **~20% do oxigênio** e, portanto, das calorias consumidas. Mudanças locais de fluxo sanguíneo em tarefas cognitivas costumam ser **≤ 5%** — a maior parte do gasto é atividade contínua.
- **Para onde vai a energia (Attwell & Laughlin 2001, córtex de roedor):** potenciais de ação **47%**, efeitos pós-sinápticos do glutamato **34%**, potencial de repouso **13%**, reciclagem de glutamato **3%**. +1 PA/neurônio/s eleva o consumo de O₂ em 145 mL/100 g/h. Previsão: códigos distribuídos com **≤ 15% dos neurônios simultaneamente ativos**.
- **Lennie (2003):** pelo custo de cada disparo e pelo consumo conhecido do córtex humano, possivelmente **menos de 1%** dos neurônios podem estar substancialmente ativos ao mesmo tempo; isso exige códigos com muito poucos neurônios ativos e **alocação flexível** de energia entre regiões conforme a demanda (atenção seletiva).
- **Levy & Baxter (1996):** códigos com maior capacidade representacional não são ótimos quando se contabiliza energia; maior custo por neurônio implica **menor taxa média de disparo** para transmissão eficiente.
- **Olshausen & Field (1996):** maximizar esparsidade basta para emergirem campos receptivos semelhantes aos de V1; código esparso tem saídas mais independentes estatisticamente.

## Evidência
`fenomeno-natural` + estimativas teóricas (`relato-autores`) para as frações de neurônios ativos.

## Análogo de engenharia
Num macro-swarm, **ativação esparsa**: muitos especialistas disponíveis, **poucos ativos por tarefa** (k ≪ N), escolhidos por roteamento; o custo dominante é "disparar" (cada chamada), não "existir" (agentes ociosos sem contexto custam ~0). Atenção seletiva = alocar orçamento a quem a tarefa demanda. Esparsidade também traz **independência** entre saídas (benefício para agregação).

## Hipótese testável
- **Variável:** k ativos de N = 12 especialistas por tarefa (k ∈ {1, 2, 3, 6, 12}), roteados por um seletor barato.
- **Métrica:** aceite; custo por aceite; correlação de erros entre os ativos.
- **Previsão:** k = 2–3 atinge aceite ≥ (k = 12) − 2 p.p. com ≤ 25% do custo; a correlação média de erros entre ativos é menor com k pequeno roteado do que com k = 12 (os roteados são mais diferentes entre si).
- **Refutação:** se o aceite crescer de forma aproximadamente linear até k = 12, ou se o seletor errar tanto que k pequeno perca > 5 p.p.

## Limites da transferência
O custo neural é metabólico e o cérebro não pode "pagar mais" sob demanda; orçamentos de tokens podem. As frações de 15% e 1% são estimativas teóricas com premissas fortes. Esparsidade neural é intra-sistema; agentes LLM são sistemas inteiros.
