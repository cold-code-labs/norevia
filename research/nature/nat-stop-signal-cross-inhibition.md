---
id: nat-stop-signal-cross-inhibition
title: Sinais de parada e inibição cruzada evitam impasse no enxame
area: nature
evidence: fenomeno-natural
tags: [inibicao-cruzada, impasse, debate, criterio-de-parada]
sources:
  - "Seeley, T. D., Visscher, P. K., Schlegel, T., Hogan, P. M., Franks, N. R. & Marshall, J. A. R. (2012). Stop signals provide cross inhibition in collective decision-making by honeybee swarms. Science 335(6064):108–111. doi:10.1126/science.1210361"
related: [nat-quorum-nest-bees, lit-multiagent-debate-du, lit-debate-or-vote, nat-candidatas]
updated: 2026-11-07
verificacao: "Metadados Crossref + resumo/editor's summary (OpenAlex). Texto integral não aberto; parâmetros do modelo não conferidos."
summary: Batedoras que anunciam um local dão "cabeçadas" de parada em dançarinas de locais rivais; essa inibição cruzada quebra empates e impede que o enxame fique paralisado.
---

## Mecanismo
- Batedoras de um local candidato emitem **sinais de parada** dirigidos às batedoras que dançam por **outros** locais (resumo). À medida que os sinais se acumulam, a exploração cessa e o enxame se prepara para o local mais representado.
- Simulações dos autores indicam que a **inibição cruzada** funciona como entre neurônios em cérebros complexos: em ambos os casos **impede que o sistema chegue a um impasse** entre opções equivalentes.
- Parâmetros quantitativos (taxa de sinais, limiares do modelo) → `lacuna` (texto não aberto).

## Evidência
`fenomeno-natural` (observação) + `relato-autores` (modelo).

## Análogo de engenharia
Em debate/votação entre agentes, permitir que um agente que sustenta a opção A emita uma **objeção específica** (contraexemplo, teste falhando) contra a opção B, reduzindo o peso de B — em vez de apenas somar apoios. Objeção deve ser **verificável** (um teste) para não virar mero ruído retórico.

## Hipótese testável
- **Variável:** protocolo de agregação — (A) voto/apoio somado por rodadas; (B) apoio + inibição cruzada por contraexemplo verificável.
- **Métrica:** rodadas até decisão; taxa de impasse (sem decisão após R máx.); acurácia final.
- **Previsão:** em tarefas com duas respostas quase igualmente plausíveis, B reduz a taxa de impasse ≥ 50% e as rodadas ≥ 30%, sem perda de acurácia > 2 p.p.
- **Refutação:** se B aumentar a acurácia errada (a inibição favorecer a opção dominante inicial independentemente do mérito) ou não reduzir impasse.

## Limites da transferência
O sinal de parada é físico e barato; contraexemplos de LLM podem ser alucinados. Inibição cruzada acelera convergência — inclusive para o erro, se a opção inicial dominante estiver errada e não houver verificação.
