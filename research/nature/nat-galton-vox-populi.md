---
id: nat-galton-vox-populi
title: Galton, "Vox populi" — mediana de 787 palpites e o efeito da influência social
area: nature
evidence: relato-autores
tags: [teoria-coletiva, wisdom-of-crowds, independencia, influencia-social, agregacao]
sources:
  - "Galton, F. (1907). Vox populi. Nature 75:450–451. doi:10.1038/075450a0 (texto via galton.org)"
  - "Wallis, K. F. (2014). Revisiting Francis Galton's forecasting competition. Statistical Science 29(3):420–424. doi:10.1214/14-STS468"
  - "Lorenz, J., Rauhut, H., Schweitzer, F. & Helbing, D. (2011). How social influence can undermine the wisdom of crowd effect. PNAS 108(22):9020–9025. doi:10.1073/pnas.1008636108"
related: [nat-diversity-prediction, nat-condorcet-correlated, nat-scale-free-correlation, lit-multiagent-debate-du, lit-silicon-crowd, nat-candidatas]
updated: 2026-11-07
verificacao: "Galton: página galton.org com o texto de 1907 lida. Wallis 2014 e Lorenz 2011: resumos (OpenAlex). Divergências de transcrição (1197/1198/1208 lb) vistas só em resultado de busca, não conferidas."
summary: Numa feira de 1906, a mediana de 787 palpites sobre o peso do boi abatido errou por 9 lb em 1.198 (~0,8%); um século depois, um experimento mostrou que até influência social leve destrói esse efeito.
---

## Mecanismo
- **Galton (1907, texto):** de 800 cartões, 13 defeituosos/ilegíveis foram excluídos, restando **787**; a estimativa **mediana ("middlemost") foi 1.207 lb**; o peso do boi abatido foi **1.198 lb**; erro de **9 lb** (~0,75–0,8%).
- **Wallis (2014, resumo):** após corrigir erros nos dados, a **média** dos palpites coincidiu **exatamente** com o resultado; o caso antecipa combinação de previsões e distribuições assimétricas (two-piece).
- **Lorenz et al. (2011, resumo; N = 144):** quando os participantes recebiam a média ou todas as respostas dos outros e podiam revisar ao longo de 5 rodadas, a diversidade de opiniões estreitou-se a ponto de minar o efeito por três vias: **influência social** (menos diversidade sem reduzir o erro coletivo), **redução de amplitude** (a verdade passa para a periferia da distribuição) e **efeito de confiança** (mais confiança sem mais acurácia).

## Evidência
`relato-autores` (observação histórica e experimento com humanos).

## Análogo de engenharia
Para agregação em swarms: **coletar respostas independentes antes de qualquer exposição** às respostas dos pares; agregar por mediana/média (robusta) e só então, se necessário, debater. Debate multirodada com visibilidade total é o desenho de Lorenz — prever convergência + confiança sem ganho de acurácia.

## Hipótese testável
- **Variável:** protocolo — (A) N = 7 estimativas independentes agregadas por mediana; (B) mesmas estimativas + 3 rodadas de revisão vendo as respostas dos outros; (C) B, mas agregando a mediana da rodada 0.
- **Métrica:** erro da mediana; dispersão; confiança declarada; posição da verdade na distribuição.
- **Previsão:** B reduz a dispersão ≥ 50% e aumenta a confiança, sem reduzir o erro da mediana vs A (≤ 1% de melhora) e com mais casos em que a verdade fica fora do intervalo interquartil.
- **Refutação:** se B reduzir o erro da mediana de forma consistente (> 5% relativo) em tarefas com verdade numérica, o debate traz informação nova e não apenas conformidade.

## Limites da transferência
Palpiteiros de 1906 tinham informação independente e heterogênea (açougueiros, fazendeiros); amostras de LLMs compartilham treino. Galton e Wallis divergem sobre mediana vs média e sobre os números exatos — o caso é ilustrativo, não base estatística.
