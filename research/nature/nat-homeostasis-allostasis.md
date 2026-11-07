---
id: nat-homeostasis-allostasis
title: Homeostase vs alostase — corrigir erro vs antecipar necessidade
area: nature
evidence: relato-autores
tags: [controle-preditivo, orcamento, effort, ativacao-adaptativa, reserva]
sources:
  - "Sterling, P. (2012). Allostasis: a model of predictive regulation. Physiology & Behavior 106(1):5–15. doi:10.1016/j.physbeh.2011.06.004 (PMID 21684297)"
  - "Cannon, W. B. (1929). Organization for physiological homeostasis. Physiological Reviews 9(3):399–431. doi:10.1152/physrev.1929.9.3.399 (apenas bibliografia)"
related: [nat-reflex-vs-cortex, nat-stellar-thermostat, nat-inactive-reserve, lit-adaptive-computation-time, lit-snell-test-time-compute, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumo de Sterling 2012 lido (Europe PMC). Cannon 1929: só metadados (origem do termo homeostase)."
summary: Sterling argumenta que correção por realimentação (homeostase) é ineficiente como regulação primária; regular bem é prever necessidades e preparar recursos antes, compartilhando reservas entre sistemas.
---

## Mecanismo
Segundo o resumo de Sterling (2012), em forma de argumento teórico:
- Mecanismos de regulação precisam ser eficientes, mas homeostase (correção de erro por realimentação) é **inerentemente ineficiente**; realimentações são ubíquas, mas não poderiam ser o mecanismo primário.
- **Alostase:** regulação eficiente exige **antecipar necessidades** e preparar-se antes que surjam. Vantagens listadas: (i) erros menores e menos frequentes; (ii) capacidades de componentes diferentes **casadas** — evitando gargalos e reduzindo fatores de segurança; (iii) recursos **compartilhados entre sistemas**, minimizando reservas; (iv) erros **lembrados** e usados para reduzir erros futuros.
- O cérebro rastreia muitas variáveis, integra com conhecimento prévio para prever necessidades e definir prioridades, e impõe trocas flexíveis: "de cada órgão segundo sua capacidade, a cada órgão segundo sua necessidade".
- Cannon (1929) é a origem do termo homeostase (conteúdo não conferido).

## Evidência
`relato-autores` (modelo conceitual com exemplos fisiológicos; não é medição única).

## Análogo de engenharia
- **Homeostase** = escalonamento reativo: tentar barato, falhar, re-tentar com mais effort/agentes.
- **Alostase** = prever a dificuldade **antes** de executar e alocar effort/N de saída; casar capacidades (não gerar 5 executores para 1 revisor); compartilhar orçamento entre tarefas; registrar erros de previsão para recalibrar.
- A questão central da Norevia — estimar o ganho marginal sem gastar mais do que se economiza — é exatamente o custo do preditor alostático.

## Hipótese testável
- **Variável:** política — (A) reativa (escada de escalonamento após falha); (B) preditiva (classificador barato de dificuldade escolhe effort/N antes); (C) B + recalibração com erros passados.
- **Métrica:** custo por aceite; latência; AUC do preditor de dificuldade; custo do próprio preditor.
- **Previsão:** B vence A em custo por aceite **se e somente se** AUC do preditor ≥ ~0,75 e custo do preditor ≤ 10% do custo médio por tarefa; C melhora a AUC ao longo do tempo.
- **Refutação:** se B vencer A mesmo com AUC ~0,5 (o ganho viria de outro fator) ou não vencer com AUC ≥ 0,85.

## Limites da transferência
É um argumento teórico; Sterling também discute vícios e hipertensão — a extensão a esses temas é dele, não validada aqui. Previsão errada custa caro: alostase exige memória e modelo do ambiente, que em LLMs têm custo de manutenção.
