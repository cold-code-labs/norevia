---
id: nat-condorcet-correlated
title: Condorcet com votos correlacionados — teto de acurácia e "n efetivo"
area: nature
evidence: validacao-local
tags: [teoria-coletiva, correlacao, teto, quando-parar-de-expandir, diversidade]
sources:
  - "Ladha, K. K. (1992). The Condorcet jury theorem, free speech, and correlated votes. American Journal of Political Science 36(3):617ff. doi:10.2307/2111584"
  - "Boland, P. J. (1989). Majority systems and the Condorcet jury theorem. The Statistician 38(3):181ff. doi:10.2307/2348873"
  - "Cálculo local: research/nature/calc/teoria-coletiva.js → calc/saida-teoria-coletiva.txt (beta-binomial exata + integração numérica)"
related: [nat-condorcet-jury, nat-small-groups-correlated-cues, nat-scale-free-correlation, lit-correlated-errors, lit-great-models-think-alike, sim-voto-correlacionado, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumos de Ladha 1992 e Boland 1989 lidos (OpenAlex; o de Ladha truncado). Números abaixo recalculados localmente com um modelo de correlação escolhido por nós (beta-binomial), não o de Ladha."
summary: Com votos positivamente correlacionados, a maioria não converge para 1: com p = 0,6 e correlação 0,1, nem infinitos votantes passam de ~74% — e a variância da média se comporta como se houvesse no máximo 1/ρ votantes.
---

## Mecanismo
- **Ladha (1992, resumo):** o teorema assume votos **independentes** e objetivo comum; Ladha generaliza para **votos correlacionados**: para grupos grandes, o resultado de Condorcet vale sob condições bastante gerais; **para grupos pequenos, as condições são severas** (resumo truncado; condições exatas não conferidas).
- **Cálculo local (modelo beta-binomial, p = 0,6, correlação intra-classe ρ):**
  - ρ = 0,05: n = 5: 0,667; 21: 0,745; 101: 0,795; **limite n → ∞: 0,814**.
  - ρ = 0,1: n = 5: 0,655; 21: 0,704; 101: 0,728; **limite: 0,736**.
  - ρ = 0,3: n = 5: 0,626; 21: 0,638; 101: 0,642; **limite: 0,643**.
  - Ou seja, há um **teto** < 1 que depende de ρ; com ρ = 0,3, 100 votantes ganham só ~4 p.p. sobre 1.
- **"n efetivo" (identidade estatística da variância da média de variáveis equicorrelacionadas; derivação, não citação):** n_ef = n / (1 + (n − 1)ρ), com teto **1/ρ**. Ex.: ρ = 0,1 → n = 10 vale 5,3; n = 1000 vale 9,9. ρ = 0,3 → teto 3,3.

## Evidência
`validacao-local` da matemática (modelo de correlação escolhido por nós). O teorema de Ladha é `relato-autores`. Não é evidência empírica sobre LLMs — para isso, ver `lit-correlated-errors`.

## Análogo de engenharia
Para N cópias do mesmo modelo, ρ entre erros é provavelmente alto (cópias "pensam igual"). O teto e o n efetivo dão uma **regra de parada de expansão**: se ρ estimado ≈ 0,3, não há razão para mais que ~3 votantes; aumentar diversidade real (modelos/evidências diferentes) para reduzir ρ vale mais que aumentar N. Complementa `sim-voto-correlacionado` (cópula gaussiana) com outro modelo de correlação — se as conclusões coincidirem, ganham robustez a escolha de modelo.

## Hipótese testável
- **Variável:** N ∈ {1, 3, 5, 9, 15} cópias do mesmo modelo vs N agentes heterogêneos (modelos/prompts/evidências distintos); ρ medido entre pares de erros em conjunto de calibração.
- **Métrica:** acurácia do voto; ρ estimado; ajuste da curva a um modelo beta-binomial com (p, ρ) estimados.
- **Previsão:** (a) o ganho do voto satura perto de N ≈ 1/ρ̂ (± 50%); (b) a curva prevista por (p̂, ρ̂) acerta a acurácia observada em ± 3 p.p. para N ≤ 15; (c) heterogêneos têm ρ̂ menor e teto maior.
- **Refutação:** se a acurácia continuar subindo bem além de N ≈ 1/ρ̂, ou se o modelo de 2 parâmetros errar > 5 p.p. (correlação de LLMs não é bem descrita por ρ único — p.ex. depende da dificuldade).

## Limites da transferência
A correlação real varia com a tarefa (erros concentrados em itens difíceis); ρ único é simplificação. Beta-binomial é uma escolha de modelo entre várias (cópula gaussiana, mistura por dificuldade); os números são ilustrativos da forma, não estimativas de LLMs.
