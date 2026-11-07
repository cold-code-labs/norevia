---
id: nat-recruitment-benefit-conditions
title: Quando comunicar compensa — benefício do recrutamento depende da ecologia
area: nature
evidence: relato-autores
tags: [quando-cooperar, comunicacao, custo-de-coordenacao, distribuicao-de-recursos]
sources:
  - "Dornhaus, A., Klügl, F., Oechslein, C., Puppe, F. & Chittka, L. (2006). Benefits of recruitment in honey bees: effects of ecology and colony size in an individual-based model. Behavioral Ecology 17(3):336–344. doi:10.1093/beheco/arj036"
related: [nat-waggle-dance-recruitment, nat-stigmergy, nat-colony-size-scaling, lit-sas-vs-mas-hybrid, lit-scaling-agent-systems, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumo lido (OpenAlex). Valores de parâmetros e curvas não conferidos."
summary: Num modelo de forrageio de abelhas, comunicar locais de comida ajuda quando as fontes são poucas, pobres e variáveis — e pode até atrapalhar quando a comida é abundante; tamanho de colônia não teve efeito.
---

## Mecanismo
- Modelo baseado em indivíduos do forrageio de abelhas, variando distribuição espacial de manchas não esgotáveis e tamanho da colônia (resumo).
- O benefício do recrutamento dependeu fortemente de **qualidade, densidade e variabilidade** das manchas: comunicação foi especialmente benéfica quando as manchas eram **pobres, poucas e variáveis**.
- Análise de sensibilidade: com **alta densidade de recursos**, o recrutamento podia se tornar **prejudicial**, sobretudo se a duração do forrageio era curta, a tendência a explorar era alta ou os recrutas demoravam a achar o local comunicado.
- **Tamanho da colônia não teve efeito significativo** sobre o benefício do recrutamento.

## Evidência
`relato-autores` (modelo; os autores ligam a resultados experimentais sazonais, não conferidos aqui).

## Análogo de engenharia
"Recrutar" = um agente compartilhar sua pista (hipótese de causa, arquivo suspeito) e redirecionar os outros. Previsão do modelo traduzida: **compartilhar ajuda quando soluções são raras e heterogêneas** (bug difícil com uma única causa escondida) e **atrapalha quando soluções são abundantes** (tarefa fácil, qualquer caminho serve) — porque o custo de transmitir/seguir a pista supera o ganho. O custo de "achar o local comunicado" ≈ custo de contexto para o receptor reconstruir a pista.

## Hipótese testável
- **Variável:** (i) compartilhamento de achados intermediários entre K agentes paralelos (on/off); (ii) densidade de soluções da tarefa (fração de caminhos que levam a solução aceita, estimada por amostragem prévia).
- **Métrica:** custo por tarefa aceita; tempo até aceite.
- **Previsão:** interação significativa: compartilhar reduz custo ≥ 20% em tarefas de baixa densidade de solução e aumenta custo (≥ 5%) em tarefas de alta densidade. O efeito de K (tamanho) sobre o benefício é pequeno comparado ao efeito da densidade.
- **Refutação:** se o benefício do compartilhamento não variar com a densidade de soluções, ou se for dominado por K.

## Limites da transferência
É um modelo, não um experimento; a "densidade de recursos" de uma tarefa de software não é observável diretamente e precisa de proxy. Recursos do modelo são não esgotáveis; em software, dois agentes seguindo a mesma pista podem duplicar trabalho.
