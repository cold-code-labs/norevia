---
id: nat-colony-size-scaling
title: Tamanho de colônia, eficiência per capita e especialização
area: nature
evidence: fenomeno-natural
tags: [escala, tamanho-de-grupo, especializacao, eficiencia-per-capita, macro-swarm]
sources:
  - "Hou, C., Kaspari, M., Vander Zanden, H. B. & Gillooly, J. F. (2010). Energetic basis of colonial living in social insects. PNAS 107(8):3634–3638. doi:10.1073/pnas.0908071107 (PMC2840457)"
  - "Holbrook, C. T., Barden, P. M. & Fewell, J. H. (2011). Division of labor increases with colony size in the harvester ant Pogonomyrmex californicus. Behavioral Ecology 22(5):960–966. doi:10.1093/beheco/arr075"
  - "Dornhaus, A., Powell, S. & Bengston, S. (2012). Group size and its effects on collective organization. Annu. Rev. Entomol. 57:123–141. doi:10.1146/annurev-ento-120710-100604"
  - "Michener, C. D. (1964). Reproductive efficiency in relation to colony size in hymenopterous societies. Insectes Sociaux 11:317–341. doi:10.1007/BF02227433 (apenas bibliografia)"
related: [nat-recruitment-benefit-conditions, nat-response-threshold, lit-scaling-agent-systems, lit-more-agents, nat-candidatas]
updated: 2026-11-07
verificacao: "Hou 2010: texto via PMC (números abaixo). Holbrook 2011 e Dornhaus 2012: resumos (OpenAlex). Michener 1964: só metadados — a ideia de queda da eficiência reprodutiva per capita com o tamanho NÃO foi conferida no texto."
summary: O metabolismo de colônias inteiras escala de forma sublinear com a massa (expoente ≈ 0,75–0,81), e colônias maiores dividem mais o trabalho — mas faltam dados limpos sobre eficiência per capita.
---

## Mecanismo
- **Escala metabólica (Hou et al. 2010, PMC):** taxa metabólica de colônias inteiras (corrigida) vs massa da colônia teve expoente observado **0,81** (IC95% **0,55–1,08**; r² = 0,82; **12 colônias** de formigas, cupins, abelhas e vespas), estatisticamente indistinguível do previsto **0,75** — mas também de 1. Expoentes intraespecíficos variaram de 0,44 a 0,94. O estudo amplo cobre 168 espécies. Se o expoente for < 1, o gasto **por indivíduo cai** com o tamanho (inferência minha, não resultado direto: ∝ N^(−0,25) a N^(−0,19)).
- **Divisão de trabalho (Holbrook et al. 2011):** colônias maiores de *P. californicus* tiveram **mais especialização** individual e mais divisão de trabalho, independentemente da idade; **sem efeito do tamanho sobre a atividade per capita**; mudanças correlacionadas com a **taxa de encontro** entre companheiras.
- **Revisão (Dornhaus et al. 2012):** há **falta surpreendente de dados** sobre tamanhos de grupo e muitos confundidores; tamanho pode ser para a colônia o que tamanho corporal é para o organismo, mas é preciso controle rigoroso.

## Evidência
`fenomeno-natural` com evidência mista e IC largo; per capita → `lacuna` parcial.

## Análogo de engenharia
Ao passar de micro-swarm (2–3) a macro-swarm (10+), esperar: (i) **especialização** só se paga acima de um tamanho mínimo; (ii) custo de coordenação por agente pode cair (sublinear) **se** houver infraestrutura compartilhada (estado, verificador), ou subir se a coordenação for par-a-par. A medida correta é custo e aceite **por agente e por tarefa**, como função de N.

## Hipótese testável
- **Variável:** N ∈ {1, 2, 3, 5, 8, 13} e modo (generalistas idênticos vs papéis especializados) em tarefas multi-bug.
- **Métrica:** aceites por 1M tokens; expoente b de custo_total ∝ N^b ajustado por log-log; ganho de especialização = aceite(espec.) − aceite(gener.).
- **Previsão:** (a) existe N_e (≈ 3–5) abaixo do qual especialização não melhora aceite (|Δ| < 2 p.p.) e acima do qual melhora; (b) com coordenação via estado compartilhado b < 1; com coordenação par-a-par (todos leem todos) b > 1.
- **Refutação:** se especialização ajudar já em N = 2 ou nunca ajudar até N = 13; se b não depender do modo de coordenação.

## Limites da transferência
Expoente metabólico é sobre energia em equilíbrio, não sobre qualidade de decisão; o IC (0,55–1,08) não exclui escala linear. Colônias crescem por ontogenia; swarms são montados instantaneamente. Não usar 0,75 como "lei" para LLMs.
