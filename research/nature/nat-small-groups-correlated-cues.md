---
id: nat-small-groups-correlated-cues
title: Com pistas correlacionadas, a acurácia coletiva é máxima em grupos pequenos
area: nature
evidence: relato-autores
tags: [tamanho-otimo, correlacao, wisdom-of-crowds, quando-parar-de-expandir, micro-swarm]
sources:
  - "Kao, A. B. & Couzin, I. D. (2014). Decision accuracy in complex environments is often maximized by small group sizes. Proc. R. Soc. B 281:20133305. doi:10.1098/rspb.2013.3305 (PMC4043084)"
related: [nat-condorcet-correlated, nat-informed-leaders, lit-correlated-errors, lit-great-models-think-alike, lit-more-agents, sim-voto-correlacionado, nat-candidatas]
updated: 2026-11-07
verificacao: "Texto integral extraído de PDF (cópia em blogs.umb.edu/collectivelab). A faixa '5 a 20' aparece só em material de imprensa e NÃO foi usada."
summary: Quando parte da informação é compartilhada por todos (correlacionada), o "wisdom of crowds" só aparece numa minoria de ambientes; em geral existe um tamanho de grupo finito e pequeno (> 1) que maximiza a acurácia.
---

## Mecanismo
- **Modelo de duas pistas:** uma pista de **baixa correlação** (amostrada independentemente, confiabilidade r_L) e outra de **alta correlação** (vista por todos, confiabilidade r_H). Cada indivíduo usa a pista de baixa correlação com probabilidade p e vota segundo a pista usada.
- **Condição para wisdom of crowds:** a fração esperada do grupo que recebe informação correta e de baixa correlação precisa exceder 1/2, isto é, **p·r_L > 1/2 ⇔ p > 1/(2r_L)**. Fora disso, a decisão do grupo grande é **ditada pela pista correlacionada** — mesmo que só uma minoria a use.
- **Resultado central (texto):** no regime p < 1/(2r_L) existe um **tamanho de grupo ótimo finito**, que **tende a ser moderadamente pequeno, mas maior que 1**. É o **ruído inerente a grupos pequenos** que permite escapar da informação altamente correlacionada mantendo parte do benefício da agregação. O wisdom of crowds clássico (acurácia crescendo monotonicamente com N) aparece **só numa minoria** dos ambientes.
- Os autores também consideram ambientes com correlação espacial/temporal na mesma pista, com conclusão qualitativa semelhante (detalhes não extraídos).

## Evidência
`relato-autores` (modelos teóricos; não é experimento com animais).

## Análogo de engenharia
Para swarms de LLM, a "pista de alta correlação" é o conhecimento/viés compartilhado do mesmo modelo-base (ou de modelos treinados em dados parecidos); a de "baixa correlação" é a evidência que cada agente coleta independentemente (ferramenta, arquivo, teste diferente). Tradução direta da condição: **expandir só ajuda se a fração de agentes que trazem evidência independente e correta for > 1/2**; caso contrário, há um N* pequeno e parar de expandir é o certo. Isto é uma candidata forte para explicar a transição micro → macro-swarm.

## Hipótese testável
- **Variável:** N ∈ {1, 2, 3, 5, 7, 11, 21} × fração de agentes com acesso a evidência independente (q ∈ {0, 0,25, 0,5, 0,75}) em tarefas com resposta verificável.
- **Métrica:** acurácia do voto majoritário; argmax_N da acurácia (N*); custo.
- **Previsão:** com q·acc_evid < 1/2, a curva acurácia(N) tem máximo interior em N* ∈ [3, 7] e cai depois; com q·acc_evid > 1/2, cresce monotonicamente até saturar. A fronteira observada fica a ± 0,1 do previsto por 1/(2r_L).
- **Refutação:** se a acurácia for monotônica em N em todas as condições, ou se N* não se mover com q.

## Limites da transferência
O modelo assume votos binários e pistas com confiabilidade fixa conhecida; em LLMs, "pista correlacionada" e "independente" se misturam dentro de cada agente. O ótimo pequeno vem do **ruído** — em LLMs a temperatura dá ruído, mas não necessariamente independência útil.
