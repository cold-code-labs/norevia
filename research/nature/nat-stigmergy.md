---
id: nat-stigmergy
title: Estigmergia — coordenação pelo estado do trabalho, não por mensagens
area: nature
evidence: fenomeno-natural
tags: [estigmergia, comunicacao-indireta, estado-compartilhado, poda-de-comunicacao]
sources:
  - "Grassé, P.-P. (1959). La reconstruction du nid et les coordinations interindividuelles chez Bellicositermes natalensis et Cubitermes sp. La théorie de la stigmergie. Insectes Sociaux 6:41–80. doi:10.1007/BF02223791 (apenas bibliografia conferida)"
  - "Theraulaz, G. & Bonabeau, E. (1999). A brief history of stigmergy. Artificial Life 5(2):97–116. doi:10.1162/106454699568700"
related: [nat-pheromone-evaporation-aco, oss-stigmergic, lit-agentprune, nat-physarum-network, nat-candidatas, sim-estigmergia]
updated: 2026-11-07
verificacao: "Resumo de Theraulaz & Bonabeau 1999 lido (OpenAlex). Grassé 1959: só metadados (texto em francês, não aberto)."
summary: Cupins e formigas coordenam construções complexas reagindo ao estado da obra deixado pelos outros; o próprio artefato carrega a comunicação.
---

## Mecanismo
- Introduzida por Grassé (1959) para explicar o "paradoxo" de que, numa sociedade de insetos, **indivíduos trabalham como se estivessem sozinhos**, mas a atividade coletiva parece coordenada (resumo de 1999).
- Theraulaz & Bonabeau distinguem duas classes: **estigmergia quantitativa** (a intensidade do estímulo — ex.: quantidade de feromônio/material — modula a probabilidade de resposta) e **qualitativa** (configurações distintas do artefato disparam ações distintas).
- A comunicação é indireta, mediada pelo ambiente, assíncrona e persistente: o custo de coordenação não cresce com o nº de pares de indivíduos.

## Evidência
`fenomeno-natural` (descrição etológica) + `relato-autores` (síntese histórica). Sem números nas fontes abertas.

## Análogo de engenharia
O **artefato verificável** (repositório, saída de testes, checklist de aceite, quadro de tarefas) é o meio de coordenação. Agentes leem o estado e agem; não trocam mensagens par-a-par. Estigmergia qualitativa = "teste X falhando dispara o especialista de X"; quantitativa = "quanto mais testes falham num módulo, maior a chance de alocar mais um agente ali".

## Hipótese testável
- **Variável:** canal de coordenação — (A) mensagens livres entre agentes (chat/debate); (B) apenas estado compartilhado estruturado (artefato + resultados de teste), sem mensagens.
- **Métrica:** tokens de coordenação por tarefa aceita; taxa de aceite; trabalho duplicado (dois agentes editando o mesmo alvo).
- **Previsão:** em tarefas decomponíveis (bugs independentes), B reduz tokens de coordenação ≥ 40% com aceite ≥ A − 2 p.p.; em tarefas fortemente acopladas (bugs interdependentes), B perde aceite (o artefato não carrega a intenção).
- **Refutação:** se B não reduzir tokens ou perder aceite também em tarefas decomponíveis, ou se ganhar em tarefas acopladas (contrariando a previsão de fronteira), revisar.

## Limites da transferência
Insetos respondem a estímulos simples e locais; o "estado" de uma tarefa de software é semântico e pode ser lido de forma divergente por LLMs. Estigmergia sem controle de concorrência gera conflitos de escrita — exige locks/leases que a natureza não precisa explicitar.
