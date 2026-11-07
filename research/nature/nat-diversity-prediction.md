---
id: nat-diversity-prediction
title: Diversity prediction theorem — erro coletivo = erro médio − diversidade
area: nature
evidence: validacao-local
tags: [teoria-coletiva, diversidade, agregacao, estimacao, ensemble]
sources:
  - "Page, S. E. (2007). Making the difference: applying a logic of diversity. Academy of Management Perspectives 21(4):6–20. doi:10.5465/amp.2007.27895335"
  - "Page, S. E. (2007). The Difference: How the Power of Diversity Creates Better Groups, Firms, Schools, and Societies. Princeton University Press. (livro; não consultado)"
  - "Cálculo local: research/nature/calc/teoria-coletiva.js (verificação numérica da identidade)"
related: [nat-hong-page-critique, nat-galton-vox-populi, nat-condorcet-correlated, lit-hong-page-diversity, lit-diversity-of-thought, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumo de Page 2007 (AMP) lido. A identidade foi verificada numericamente no script local (3 casos aleatórios com seed fixa; igualdade até 4 casas). Identidade equivalente na literatura de ensembles (decomposição de ambiguidade, Krogh & Vedelsby 1995) NÃO conferida."
summary: Para estimativas numéricas agregadas pela média, o erro quadrático do grupo é exatamente o erro quadrático médio dos indivíduos menos a variância das estimativas — diversidade reduz erro coletivo, por identidade algébrica.
---

## Mecanismo
- **Identidade:** com estimativas s₁…s_n, média c = (1/n)Σsᵢ e verdade θ: **(c − θ)² = (1/n)Σ(sᵢ − θ)² − (1/n)Σ(sᵢ − c)²** — erro coletivo = erro médio individual − diversidade de predição.
- **Page (2007, resumo):** em tarefas preditivas, diversidade de modelos preditivos reduz erro coletivo; "é um fato matemático que diversidade importa tanto quanto modelos altamente acurados ao fazer previsões coletivas". Em resolução de problemas, os benefícios viriam de superaditividade (combinações de ferramentas), não de efeito de portfólio.
- **Verificação local:** 3 ensaios aleatórios (seed 42): erro coletivo = erro médio − diversidade, ex.: 203,9067 = 284,71 − 80,81.

## Evidência
`validacao-local` da identidade (é álgebra). O que a identidade **não** diz: ela não implica que aumentar diversidade reduz o erro coletivo **mantendo** o erro médio — diversidade "ruidosa" aumenta também o erro médio. Por isso a leitura causal ("diversidade ajuda") é interpretação, não teorema.

## Análogo de engenharia
Para saídas numéricas ou pontuações (estimativas de custo, probabilidade de sucesso, notas de verificador), agregar por média e **medir separadamente** os dois termos: erro médio individual (competência) e diversidade (desacordo). Isso dá um diagnóstico barato de quando adicionar agentes ajuda: só se o novo agente aumenta a diversidade **mais** do que aumenta o erro médio.

## Hipótese testável
- **Variável:** composição do grupo de estimadores (N = 5): (A) 5 cópias do mesmo modelo/prompt; (B) 5 prompts/modelos diferentes; (C) B com um membro sabidamente ruim.
- **Métrica:** os três termos da identidade por tarefa de estimação numérica com verdade conhecida.
- **Previsão:** B tem diversidade ≥ 2× a de A com aumento de erro médio < diversidade adicional, logo menor erro coletivo; em C, o ganho de diversidade é anulado pelo aumento do erro médio.
- **Refutação:** se B não reduzir o erro coletivo vs A (a diversidade obtida é só ruído), a heterogeneidade de prompts não é uma fonte útil de diversidade.

## Limites da transferência
Vale para perda quadrática e agregação por média; não se aplica diretamente a respostas categóricas ou a código. Diversidade medida não é independência de erros.
