---
id: nat-speed-accuracy-quorum
title: Trade-off velocidade–acurácia com limiar de quórum ajustável (formigas Temnothorax)
area: nature
evidence: fenomeno-natural
tags: [quorum, velocidade-acuracia, parametro-ajustavel, urgencia, quanto-cooperar]
sources:
  - "Franks, N. R., Dornhaus, A., Fitzsimmons, J. P. & Stevens, M. (2003). Speed versus accuracy in collective decision making. Proc. R. Soc. Lond. B 270:2457–2463. doi:10.1098/rspb.2003.2527"
  - "Pratt, S. C. & Sumpter, D. J. T. (2006). A tunable algorithm for collective decision-making. PNAS 103(43):15906–15910. doi:10.1073/pnas.0604801103 (PMC1635101)"
  - "Pratt, S. C. (2005). Quorum sensing by encounter rates in the ant Temnothorax albipennis. Behavioral Ecology 16(2):488–496. doi:10.1093/beheco/ari020"
  - "Pratt, S. C., Mallon, E. B., Sumpter, D. J. T. & Franks, N. R. (2002). Quorum sensing, recruitment, and collective decision-making during colony emigration by the ant Leptothorax albipennis. Behav. Ecol. Sociobiol. 52:117–127. doi:10.1007/s00265-002-0487-x (apenas bibliografia)"
  - "Chittka, L., Skorupski, P. & Raine, N. E. (2009). Speed–accuracy tradeoffs in animal decision making. Trends Ecol. Evol. 24(7):400–407. doi:10.1016/j.tree.2009.02.010"
related: [nat-quorum-nest-bees, nat-reflex-vs-cortex, lit-early-stopping-sc, nat-candidatas, sim-quorum]
updated: 2026-11-07
verificacao: "Resumos de Franks 2003, Pratt 2005 e Chittka 2009 lidos. Pratt & Sumpter 2006: texto integral lido via PMC (números abaixo). Pratt 2002: só metadados."
summary: Formigas baixam o quórum quando o ninho foi destruído (decidem em ~1/6 do tempo, mas acertam menos) e o elevam quando há tempo — um único algoritmo, parâmetro ajustado à urgência.
---

## Mecanismo
- Colônias de *Temnothorax* escolhem novo ninho por **quórum**: só quando um local candidato contém companheiras suficientes as recrutadoras trocam *tandem runs* lentos por transporte rápido da colônia (Pratt 2005).
- **O quórum é percebido pela taxa de encontros** (Pratt 2005): impedir contato tátil fazia as formigas agirem como se o ninho estivesse vazio; reduzir o tamanho do ninho (mais encontros com a mesma população) antecipava a troca. A troca ocorreu na **mesma taxa de encontro** independentemente do tamanho do ninho; após a troca, as visitas encurtam ~**2 min** — interpretado como o tempo de detecção do quórum.
- **Ajuste à urgência (Franks 2003, resumo):** em condições adversas as colônias escolhem mais rápido e discriminam menos; os erros são de *julgamento* (todas as alternativas já haviam sido descobertas), não de omissão. As formigas **baixam o limiar de quórum** e passam a depender mais de decisão individual.
- **Números (Pratt & Sumpter 2006, *T. curvispinosus*, texto integral):** quórum em mudança forçada (ninho destruído) **5,7 ± 0,5** formigas vs **12,7 ± 0,6** em mudança não forçada. Tempo previsto pelo modelo para abandonar o ninho: **87 ± 77 min** (forçada) vs **565 ± 314 min** (não forçada). Fração da colônia que terminou no ninho bom (observado): **65 ± 32%** (forçada) vs **90 ± 18%** (não forçada). As taxas de busca e de aceitação também foram maiores na forçada.
- Chittka et al. (2009) generalizam: obter informação de alta qualidade exige mais tempo de amostragem, sobretudo sob ruído.

## Evidência
`fenomeno-natural` (experimentos de laboratório) + `relato-autores` (modelo com parâmetros ajustados).

## Análogo de engenharia
O **limiar de quórum k** (e a taxa de exploração) como parâmetro explícito de um único algoritmo de decisão, ajustado pela **urgência/custo do atraso** e pelo **custo do erro** declarados na tarefa. Um "oi" ou tarefa urgente → k baixo (até k = 1, decisão individual); mudança irreversível em produção → k alto. A taxa de encontros sugere estimar o quórum **por amostragem local** em vez de contar votos globais.

## Hipótese testável
- **Variável:** k ∈ {1, 2, 3, 5} e razão de custo C_erro/C_tempo da tarefa.
- **Métrica:** utilidade esperada = acurácia × valor − custo de tokens − custo de latência; fronteira de Pareto acurácia × custo.
- **Previsão:** a curva acurácia(k) é côncava e satura; o k ótimo cresce monotonicamente com C_erro/C_tempo. Um controlador que escolhe k pela razão declarada fica ≤ 5% abaixo do k ótimo a posteriori em utilidade.
- **Refutação:** se acurácia(k) não saturar até k = 5 (ganho linear) ou se o k ótimo não depender da razão de custos, o paralelo não vale; se o controlador ficar > 10% abaixo do ótimo, a regra é inútil na prática.

## Limites da transferência
Nas formigas, decidir errado custa o ninho, e a regra foi selecionada por evolução; nos LLMs, o custo do erro precisa ser declarado ou estimado. Encontros físicos são independentes entre si em boa medida; votos de LLM correlacionados podem inflar o "quórum" percebido.
