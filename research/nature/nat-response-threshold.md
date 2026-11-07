---
id: nat-response-threshold
title: Limiar de resposta e divisão de trabalho em insetos sociais
area: nature
evidence: relato-autores
tags: [divisao-de-trabalho, elastic-swarm, ativacao-adaptativa, quando-cooperar]
sources:
  - "Bonabeau, E., Theraulaz, G. & Deneubourg, J.-L. (1996). Quantitative study of the fixed threshold model for the regulation of division of labour in insect societies. Proc. R. Soc. Lond. B 263(1376):1565–1569. doi:10.1098/rspb.1996.0229"
  - "Theraulaz, G., Bonabeau, E. & Deneubourg, J.-L. (1998). Response threshold reinforcements and division of labour in insect societies. Proc. R. Soc. Lond. B 265:327–332. doi:10.1098/rspb.1998.0299 (PMC1688885)"
  - "Fonte secundária para a forma funcional: UiO TEK5010 (2024), aula 6 'Task allocation' — https://www.uio.no/studier/emner/matnat/its/TEK5010/h24/forelesningspresentasjoner/tek5010_mas_2024_lecture_6_taskallocation.pdf (não aberta; conteúdo via resultado de busca)"
related: [nat-inactive-reserve, nat-colony-size-scaling, nat-bacterial-quorum-sensing, lit-swarmsys, nat-mapa, nat-candidatas, sim-limiar-resposta]
updated: 2026-11-07
verificacao: "DOIs conferidos via Crossref (2026-11-07). Resumo de 1998 lido (OpenAlex). Texto integral de 1996 NÃO aberto (Royal Society bloqueou); forma s^n/(s^n+θ^n) com n=2 conferida só em fonte secundária."
summary: Cada indivíduo só entra numa tarefa quando o estímulo dela supera seu limiar pessoal; limiares heterogêneos produzem recrutamento gradual e proporcional à demanda, sem coordenador.
---

## Mecanismo
- **Modelo de limiar fixo (1996):** a probabilidade de um indivíduo com limiar θ executar uma tarefa cujo estímulo vale s é uma função sigmoide T_θ(s) = sⁿ/(sⁿ + θⁿ). A forma com n = 2 é a usualmente atribuída ao paper; **conferida apenas em fonte secundária** (slides UiO), não no texto original. Segundo o resumo indexado, castas com limiares distintos e fixos na escala experimental explicam observações em formigas *Pheidole* (Wilson 1984).
- **Reforço de limiar (1998, resumo lido):** executar a tarefa *reduz* o limiar do indivíduo; não executar o *aumenta*. Dessa realimentação emergem especialistas a partir de indivíduos inicialmente idênticos. Previsão dos autores: após remover especialistas e reintroduzi-los, a colônia não volta ao estado anterior, e a diferença cresce com o tempo de separação (histerese).
- Consequência funcional: quando a demanda (estímulo) sobe, entram primeiro os de limiar baixo; só demanda alta recruta os de limiar alto. O tamanho da força de trabalho ativa acompanha a demanda **sem contagem central**.

## Evidência
`relato-autores` (modelo matemático ajustado a dados de campo de terceiros); o fenômeno de divisão de trabalho é `fenomeno-natural`. Números do ajuste (ex.: θ por casta) não conferidos no original → `lacuna`.

## Análogo de engenharia (swarms de LLM)
Cada agente/papel potencial tem um limiar θᵢ sobre um **estímulo de tarefa** mensurável e barato: critérios de aceite em aberto, testes falhando, incerteza estimada (ex.: discordância entre 2 amostras), backlog. Um verificador entra só se s > θ_verif; um segundo executor só se s > θ_exec2, etc. O reforço (θ cai com uso bem-sucedido) dá especialização emergente; o aumento de θ sem uso dá "esquecimento" e contração.

## Hipótese testável
- **Variável manipulada:** política de ativação — (A) N fixo; (B) limiares fixos heterogêneos sobre o estímulo s; (C) limiares com reforço.
- **Métrica:** custo (tokens) por tarefa aceita; taxa de aceite verificável; nº médio de agentes ativos por faixa de dificuldade.
- **Previsão:** B e C atingem taxa de aceite ≥ A − 2 p.p. com custo por tarefa aceita ≥ 25% menor em mistura de tarefas com dificuldade heterogênea; o nº de agentes ativos cresce monotonicamente com a dificuldade medida a posteriori.
- **Refutação:** se o estímulo s não correlacionar com a dificuldade real (Spearman < 0,3) ou se B/C não reduzirem custo sem perda de aceite, a hipótese cai — o limiar só funciona se o estímulo for informativo e barato.

## Limites da transferência
Insetos pagam pouco por "olhar" o estímulo; LLMs pagam por estimar dificuldade (o próprio estímulo pode custar uma chamada). Limiar não garante qualidade do trabalho, só alocação. A histerese prevista em 1998 pode virar rigidez indesejada (especialista que não deveria mais ser chamado).
