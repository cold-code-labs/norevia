---
id: nat-hong-page-critique
title: "Diversidade supera habilidade?" — Hong & Page (2004) e suas críticas
area: nature
evidence: relato-autores
tags: [teoria-coletiva, diversidade, composicao-de-grupo, copias-identicas, critica]
sources:
  - "Hong, L. & Page, S. E. (2004). Groups of diverse problem solvers can outperform groups of high-ability problem solvers. PNAS 101(46):16385–16389. doi:10.1073/pnas.0403723101"
  - "Thompson, A. (2014). Does diversity trump ability? An example of the misuse of mathematics in the social sciences. Notices of the AMS 61(9):1024ff. doi:10.1090/noti1163"
  - "Grim, P., Singer, D. J., Bramson, A., Holman, B., McGeehan, S. & Berger, W. J. (2019). Diversity, ability, and expertise in epistemic communities. Philosophy of Science 86(1):98–123. doi:10.1086/701070"
related: [lit-hong-page-diversity, nat-diversity-prediction, nat-condorcet-correlated, lit-great-models-think-alike, nat-candidatas]
updated: 2026-11-07
verificacao: "Hong & Page: resumo. Thompson 2014: texto extraído de PDF (cópia em users.wfu.edu; ams.org retornou 403). Grim 2019: resumo. Réplica de Page ('Ability can trump diversity…') vista só em resultado de busca — não lida."
summary: Hong & Page acharam, em modelo, que times aleatórios superam times dos "melhores" resolvedores; Thompson mostrou que o teorema depende de cópias do melhor agente serem idênticas e que o grupo maximamente diverso foi pior que a mediana dos aleatórios — a lição útil é sobre cópias redundantes, não sobre diversidade em si.
---

## Mecanismo
- **Hong & Page (2004, resumo):** agentes com representações e heurísticas de busca; ao selecionar um time de uma população grande e diversa, um time **aleatório** supera um time dos **melhores individualmente**, porque os melhores tornam-se **semelhantes** no espaço de resolvedores — sua maior habilidade é mais que compensada pela falta de diversidade.
- **Thompson (2014, texto):** (i) o "Teorema 1" é sobre maximizar uma função num conjunto finito e exige a premissa de que **múltiplas cópias de um agente atuam de forma idêntica a uma única cópia**; daí, "não deveríamos nos surpreender" que um grupo com o melhor agente mais outros supere um grupo de **cópias idênticas** do melhor; (ii) o teorema seria **não relacionado** ao experimento computacional e **sem aplicação ao mundo real**; (iii) na sua reanálise, um grupo **maximamente diverso** teve desempenho **pior que a mediana de 200 grupos aleatórios de 10 agentes** — a vantagem é do sorteio, não da "diversidade" medida.
- **Grim et al. (2019, resumo):** estendendo o modelo a paisagens com diferentes graus de aleatoriedade, o resultado "diversidade supera habilidade" é **sensível** às condições; desaconselham interpretação ampla.

## Evidência
`relato-autores` (modelos e críticas matemáticas; disputa em aberto). Ver também `lit-hong-page-diversity` (agente de literatura).

## Análogo de engenharia
A premissa criticada por Thompson é **literalmente verdadeira** para LLMs determinísticos: N cópias do mesmo modelo, prompt e temperatura 0 = 1 agente. A lição transferível é estreita e útil: **cópias redundantes não somam**; o que soma é cobertura de heurísticas/caminhos distintos. Não se segue que "mais diverso" seja sempre melhor (a reanálise de Thompson contraria isso).

## Hipótese testável
- **Variável:** time de 5 agentes — (A) 5 cópias do melhor agente (mesmo modelo/prompt, temperatura baixa); (B) 5 sorteados de um pool de configurações; (C) 5 escolhidos para maximizar uma métrica de diversidade de saídas; (D) top-5 por desempenho individual em calibração.
- **Métrica:** fração de tarefas de busca (ex.: encontrar entrada que falha, otimização) resolvidas por pelo menos um membro (cobertura) e custo.
- **Previsão:** A ≈ 1 agente (ganho < 2 p.p.); B e D superam A; C **não** supera B sistematicamente (consistente com Thompson).
- **Refutação:** se C superar B e D com folga (> 5 p.p.) em vários domínios, a crítica de Thompson não se transfere para LLMs; se A superar 1 agente por > 5 p.p., as cópias não são redundantes (estocasticidade útil).

## Limites da transferência
O modelo de Hong & Page usa um anel de 2.000 posições e heurísticas de passo; a generalidade é disputada. Discussão pública do tema tem forte carga política — este cartão trata só da matemática e da transferência para composição de agentes.
