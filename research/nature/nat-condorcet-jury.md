---
id: nat-condorcet-jury
title: Teorema do júri de Condorcet — quando a maioria de juízes medianos vence
area: nature
evidence: validacao-local
tags: [teoria-coletiva, votacao, agregacao, quando-cooperar, 1-vs-n]
sources:
  - "Condorcet, Marquis de (1785). Essai sur l'application de l'analyse à la probabilité des décisions rendues à la pluralité des voix. Paris: Imprimerie Royale. (não consultado diretamente)"
  - "Boland, P. J. (1989). Majority systems and the Condorcet jury theorem. The Statistician 38(3):181ff. doi:10.2307/2348873"
  - "Grofman, B., Owen, G. & Feld, S. L. (1983). Thirteen theorems in search of the truth. Theory and Decision 15:261–278. doi:10.1007/BF00125672 (apenas bibliografia)"
  - "Cálculo local: research/nature/calc/teoria-coletiva.js → calc/saida-teoria-coletiva.txt (determinístico)"
related: [nat-condorcet-correlated, nat-small-groups-correlated-cues, sim-voto-correlacionado, lit-self-consistency, lit-more-agents, nat-candidatas, sim-verificador]
updated: 2026-11-07
verificacao: "Resumo de Boland 1989 lido (OpenAlex). Números abaixo recalculados localmente (binomial exata). Texto de 1785 e Grofman 1983 não abertos."
summary: Se n juízes votam independentemente e cada um acerta com p > 1/2, a maioria acerta com probabilidade que cresce para 1 com n — mas devagar: com p = 0,6, são precisos ~51 votos para chegar a ~93%.
---

## Mecanismo
- **Enunciado (Boland 1989, resumo):** se n = 2m + 1 jurados agem **independentemente**, cada um com probabilidade **p > 1/2** de decidir corretamente, a probabilidade de a maioria acertar **cresce monotonicamente para 1** quando m → ∞. Condorcet argumentou que há situações em que é aconselhável confiar uma decisão a um grupo de menor competência individual em vez de a um indivíduo de maior competência. Boland generaliza para competências variáveis e dependência entre votos.
- **Números (cálculo local exato, p = 0,6):** n = 1: 0,600; 3: 0,648; 5: 0,683; 7: 0,710; 11: 0,753; 21: 0,826; 51: 0,926; 101: 0,979. Com p < 1/2 a maioria **piora** com n (simétrico).
- Comparação 1 forte vs N fracos: um único juiz com p = 0,83 equivale aproximadamente a 21 juízes independentes com p = 0,6 (0,826) — o ganho de agregação é real, mas caro em número de votos.

## Evidência
`validacao-local` **somente da matemática** (binomial exata, script no repo). Não é evidência sobre LLMs; a premissa de independência é a parte que falha na prática (ver `nat-condorcet-correlated`).

## Análogo de engenharia
Self-consistency/voto majoritário entre amostras ou agentes. O teorema dá o **teto otimista**: mesmo sob independência, o ganho marginal por voto adicional cai rápido (de +4,8 p.p. de 1→3 para +0,5 p.p. por voto perto de n = 51 com p = 0,6). Isso já sugere micro-swarms (3–7) como faixa de maior ganho por custo e define a pergunta 1-vs-N: **comparar p_alto de 1 agente com effort alto ao A_n de n agentes baratos a custo igual**.

## Hipótese testável
- **Variável:** n ∈ {1, 3, 5, 7, 11} amostras independentes com effort baixo vs 1 amostra com effort alto, a custo pareado.
- **Métrica:** acurácia por tarefa; p estimado por tarefa; ajuste à previsão binomial.
- **Previsão:** em tarefas onde a correlação de erros medida é ≈ 0, A_n observada fica dentro de ± 3 p.p. da binomial; o voto vence o agente de effort alto apenas onde p_baixo > 1/2 por tarefa **e** p_alto < A_n(custo pareado).
- **Refutação:** se A_n observada ficar sistematicamente abaixo da binomial mesmo com correlação medida ≈ 0 (indicando dependência não capturada pela métrica), ou se o voto vencer em tarefas com p_baixo < 1/2.

## Limites da transferência
Respostas não binárias (múltiplas opções) mudam a matemática (pluralidade); p varia por tarefa e é desconhecido a priori. Em tarefas com p < 1/2 para o agente barato, agregar **piora**. Ver também os resultados do agente de teoria (`research/theory/SAIDA-model.txt`).
