---
id: lit-silicon-crowd
title: "Wisdom of the Silicon Crowd: ensemble de 12 LLMs rivaliza com multidão humana em previsão (Schoenegger et al., 2024)"
area: literature
evidence: relato-autores
tags: [wisdom-of-crowds, ensemble, previsao, agregacao, diversidade, vies-de-aquiescencia]
sources:
  - "Schoenegger, P., Tuminauskaite, I., Park, P. S., Valdece Sousa Bastos, R. & Tetlock, P. E. (2024). Wisdom of the silicon crowd: LLM ensemble prediction capabilities rival human crowd accuracy. Science Advances 10(45). doi:10.1126/sciadv.adp1528"
  - "Preprint: Schoenegger, P., Tuminauskaite, I., Park, P. S. & Tetlock, P. E. arXiv:2402.19379v6 (22 jul 2024). https://arxiv.org/abs/2402.19379v6 — HTML: https://arxiv.org/html/2402.19379v6"
related: [lit-correlated-errors, lit-hong-page-diversity, lit-sintese]
updated: 2026-11-07
primary_opened: true
version: "arXiv v6 (2024-07-22); versão Science Advances 10(45) não aberta"
summary: A mediana de 12 LLMs diferentes empatou estatisticamente com a mediana de 925 humanos em 31 perguntas de previsão binária (Brier 0,20 vs 0,19), mas com viés de aquiescência e amostra pequena.
---

## Pergunta
A agregação ("wisdom of crowds") de previsões de vários LLMs heterogêneos atinge a acurácia de uma multidão humana em torneio de previsão? E LLMs melhoram ao ver a previsão humana?

## Método
- Estudo 1 (Sec. 2.1): 12 LLMs diferentes (Tabela 1) preveem 31 perguntas binárias de um torneio de 3 meses com 925 previsores humanos; previsões coletadas via interfaces web com configurações padrão; agregação pela mediana; métrica Brier; teste preregistrado de diferença e teste de equivalência não preregistrado.
- Estudo 2 (Sec. 3.2): GPT-4 e Claude 2 recebem a mediana humana e atualizam suas previsões.

## Resultado relatado
- Brier da multidão LLM M = 0,20 (DP 0,12) vs multidão humana M = 0,19 (DP 0,19); t(60) = 0,19, p = 0,850 (Sec. 3.1).
- Contra o benchmark sem informação (50% em tudo, Brier 0,25): t(30) = −2,35, p = 0,026 (BH-ajustado 0,039).
- Equivalência (limites d = 0,5 ≈ 0,081 Brier, não preregistrado): inferior t(60)=2,16, p=0,017; superior t(60)=−1,78, p=0,040.
- Diferenças entre modelos: F(12, 354) = 2,64, p = 0,002. Apenas 3 dos 12 modelos superaram a mediana dos modelos (Sec. 4).
- Viés de aquiescência: previsão média 57,35% (DP 20,93), mediana 60%, embora só 14 de 31 (~45%) perguntas tenham resolvido “sim”.
- Estudo 2: Brier GPT-4 0,17 → 0,14; Claude 2 0,22 → 0,15. A média simples humano+máquina foi melhor que as previsões atualizadas (GPT-4: 0,13, t(92)=2,583, p=0,011; Claude 2: 0,14, t(92)=3,530, p=0,001). O abstract fala em melhoria de 17–28%; os Brier arredondados implicam ~18% e ~32% — a faixa não é derivada no corpo (inconsistência a registrar, não corrigida aqui).

## Custo/compute considerado?
Só qualitativamente: a Discussão (Sec. 4) diz que o ensemble é “substantially cheaper and faster” que coletar previsões humanas. Nenhum número de custo ou comparação com um único LLM de raciocínio alto.

## Ameaças à validade
- Apenas 31 perguntas de um torneio; poder estatístico baixo; equivalência com limites largos e não preregistrada.
- Coleta via web UI, modelos mudando durante o estudo, 109 previsões ausentes.
- Não compara o ensemble com o melhor modelo individual sob o mesmo orçamento; a questão “ensemble vs um modelo forte” fica aberta.
- Má calibração e excesso de confiança do agregado.
- A versão publicada (Science Advances, com coautor adicional) pode diferir da v6.

## Relevância para a pergunta central
Evidência de que agregação de modelos heterogêneos produz resultado de nível “multidão”, mas **não** de que supera um único modelo forte com mesmo custo — o paper não testa isso. Mostra também um viés compartilhado (aquiescência) que a agregação não remove: erro sistemático comum a todos os membros sobrevive à mediana, coerente com lit-correlated-errors. E o Estudo 2 sugere que combinar fontes com erros pouco correlacionados (humano + máquina) bate deixar um agente “absorver” a outra fonte.

## Hipóteses candidatas
- candidata: agregação por mediana/votação corrige erro de variância, mas não viés compartilhado; o ganho de N agentes é limitado pela fração de erro que é viés comum.
- candidata: média de fontes independentes (agregação externa) supera “debate/atualização” em que um agente vê a resposta do outro, quando as fontes têm erros pouco correlacionados.

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2402.19379 (v1–v6; v6 = 22 jul 2024; sem journal-ref no abs), https://arxiv.org/html/2402.19379v6 (números acima), https://researchonline.lse.ac.uk/id/eprint/125626 (citação Science Advances 10(45), doi:10.1126/sciadv.adp1528).
- Lacuna: o artigo em Science Advances (doi:10.1126/sciadv.adp1528) não foi aberto; números vêm da v6 do arXiv.
