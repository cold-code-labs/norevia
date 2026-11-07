---
id: nat-quorum-nest-bees
title: Quórum, não consenso — como o enxame de abelhas decide que decidiu
area: nature
evidence: fenomeno-natural
tags: [quorum, criterio-de-parada, verificacao, quando-encerrar, velocidade-acuracia]
sources:
  - "Seeley, T. D. & Visscher, P. K. (2003). Choosing a home: how the scouts in a honey bee swarm perceive the completion of their group decision making. Behav. Ecol. Sociobiol. 54:511–520. doi:10.1007/s00265-003-0664-6"
  - "Seeley, T. D. & Visscher, P. K. (2004). Quorum sensing during nest-site selection by honeybee swarms. Behav. Ecol. Sociobiol. 56:594–601. doi:10.1007/s00265-004-0814-5"
related: [nat-speed-accuracy-quorum, nat-stop-signal-cross-inhibition, nat-waggle-dance-recruitment, lit-early-stopping-sc, lit-adaptive-consistency, nat-candidatas, sim-quorum]
updated: 2026-11-07
verificacao: "Texto integral de 2003 lido (PDF hospedado em bees.ucr.edu, extraído localmente). 2004: só metadados Crossref + desenho experimental descrito em índice secundário (não aberto o texto)."
summary: As batedoras começam a preparar a mudança quando ~10–15 abelhas estão juntas num mesmo local candidato, mesmo com danças ainda ativas para outros — quórum local substitui consenso global.
---

## Mecanismo
- Duas hipóteses testadas em 4 enxames escolhendo entre 2 caixas-ninho (2003): **consenso** (as batedoras notam quando todas as danças anunciam um só local) vs **quórum** (notam quando um local recebe batedoras suficientes).
- Resultado (texto integral): o consenso entre dançarinas **não foi necessário nem suficiente** para iniciar o *worker piping* (sinal de preparação para o voo). Um acúmulo de **10–15 ou mais abelhas** numa caixa esteve consistentemente associado ao início do piping. Num enxame, o piping começou logo após ~**15** batedoras no local escolhido (≈12 dentro, 3 fora), com no máximo 2 no outro. O piping começa **cerca de uma hora** antes da decolagem.
- O quórum é medido **no local candidato** (sinal local, barato), não no enxame inteiro. Os autores sugerem que quórum dá melhor equilíbrio velocidade–acurácia do que consenso.
- 2004 (desenho conforme índice secundário, não conferido no texto): dividir as batedoras de um mesmo local entre 5 caixas atrasou piping e decolagem em relação a 1 caixa — consistente com contagem por densidade local.

## Evidência
`fenomeno-natural` (experimento de campo, n = 4 enxames em 2003 — amostra pequena).

## Análogo de engenharia
**Critério de parada por quórum:** amostrar soluções/verificações independentes em sequência e parar quando k concordam sobre uma resposta *verificada*, sem esperar unanimidade nem rodadas fixas de debate. O "local" é a resposta candidata; o quórum é contado ali (ex.: k execuções que passam no mesmo teste/produzem a mesma saída canônica).

## Hipótese testável
- **Variável:** regra de parada — (A) N fixo + maioria; (B) consenso (todos concordam ou R rodadas); (C) quórum k ∈ {2, 3, 4} sobre respostas canônicas, amostragem sequencial.
- **Métrica:** acurácia verificável; nº médio de chamadas por tarefa; latência.
- **Previsão:** C com k = 3 atinge acurácia ≥ A − 1 p.p. com ≥ 40% menos chamadas que A (N = 9) e ≥ 30% menos que B; ganho maior em tarefas fáceis (onde o quórum se forma cedo).
- **Refutação:** se erros correlacionados formarem quórum errado com frequência (acurácia de C < A − 3 p.p.), o quórum precisa de diversidade ou verificador — e o mecanismo puro é refutado para LLMs homogêneos.

## Limites da transferência
Abelhas avaliam o local de forma **independente** (cada batedora inspeciona a cavidade); amostras de um mesmo LLM não são independentes (ver `nat-condorcet-correlated`). O quórum natural está acoplado a recrutamento proporcional à qualidade, que filtra opções ruins antes; sem esse filtro, quórum precoce pode cristalizar erro.
