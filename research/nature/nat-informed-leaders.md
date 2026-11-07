---
id: nat-informed-leaders
title: Poucos informados guiam grupos grandes; desinformados devolvem o controle à maioria
area: nature
evidence: relato-autores
tags: [lideranca, informacao-assimetrica, verificador, minoria-opinativa, quanto-cooperar]
sources:
  - "Couzin, I. D., Krause, J., Franks, N. R. & Levin, S. A. (2005). Effective leadership and decision-making in animal groups on the move. Nature 433:513–516. doi:10.1038/nature03236"
  - "Couzin, I. D., Ioannou, C. C., Demirel, G., Gross, T., Torney, C. J., Hartnett, A., Conradt, L., Levin, S. A. & Leonard, N. E. (2011). Uninformed individuals promote democratic consensus in animal groups. Science 334(6062):1578–1580. doi:10.1126/science.1210280"
related: [nat-small-groups-correlated-cues, nat-quorum-nest-bees, lit-debate-or-vote, lit-multiagent-debate-du, nat-candidatas, sim-verificador]
updated: 2026-11-07
verificacao: "Couzin 2005: texto integral extraído de PDF (arquivo de curso Princeton cs/COS597C). Couzin 2011: resumo lido (OpenAlex). Números de figuras (ex.: % de informados por N) não extraídos → lacuna."
summary: Sem sinalização e sem saber quem sabe, grupos em movimento seguem uma pequena minoria informada — tanto menor (em proporção) quanto maior o grupo; e indivíduos sem opinião protegem a maioria contra uma minoria radical.
---

## Mecanismo
- **Couzin et al. 2005 (modelo):** indivíduos com regras de repulsão/alinhamento/atração; uma proporção p recebe uma direção preferida g, com peso ω. Resultado (texto): para um dado tamanho, a acurácia cresce com p; **quanto maior o grupo, menor a proporção de informados necessária** para uma dada acurácia; para grupos suficientemente grandes, **uma proporção muito pequena** basta para acurácia próxima do máximo. Há **trade-off** entre acurácia do movimento e probabilidade de **fragmentação** do grupo ao aumentar ω.
- Com dois subconjuntos informados de preferências diferentes: se as preferências diferem pouco, o grupo segue a média; se diferem muito, escolhe uma delas; se um subconjunto é maior, o grupo segue a **maioria, mesmo pequena**. Uma realimentação em ω (reforço quando o indivíduo se move na direção preferida, dentro de 20°) permite consenso em vez de média.
- **Couzin et al. 2011 (teoria + experimento, resumo):** uma minoria fortemente opinativa pode ditar a escolha do grupo, mas a presença de **indivíduos desinformados inibe espontaneamente** esse efeito e **devolve o controle à maioria numérica**.
- Percentuais exatos (ex.: proporção de informados para N = 200) estão em figuras → `lacuna`.

## Evidência
`relato-autores` (modelo 2005; teoria + experimento 2011 — o experimento não foi conferido).

## Análogo de engenharia
"Informado" = agente com **evidência verificável** (rodou o teste, leu o log, tem a ferramenta); "desinformado" = agente que só agrega. (i) Num swarm grande, poucos agentes com acesso a ferramentas/verificador podem guiar a decisão sem que os demais saibam quem são — basta que a evidência pese. (ii) Agentes neutros/agregadores podem diluir um agente excessivamente confiante e errado.

## Hipótese testável
- **Variável:** fração f ∈ {0, 1/12, 2/12, 4/12, 1} de agentes com acesso a ferramenta de verificação num swarm de N = 12; presença de 1 agente "teimoso" errado com confiança alta; com/sem 4 agentes neutros sem opinião inicial.
- **Métrica:** acurácia da decisão do grupo; custo (ferramentas são caras).
- **Previsão:** acurácia satura em f ≤ 2/12 (≥ 90% do ganho de f = 1 com ≤ 17% do custo de ferramenta); com o teimoso, agentes neutros reduzem a taxa de captura pelo teimoso ≥ 30%.
- **Refutação:** se a acurácia crescer linearmente até f = 1 (sem saturação) ou se agentes neutros **aumentarem** a captura (LLMs neutros tendem a seguir o mais confiante — risco real de sicofancia).

## Limites da transferência
No modelo, informação é uma direção contínua e a influência é geométrica; em LLMs, persuasão depende de retórica e confiança declarada, não da qualidade da evidência — a menos que o protocolo force evidência verificável. O efeito de 2011 depende de os desinformados não terem viés; LLMs têm vieses compartilhados.
