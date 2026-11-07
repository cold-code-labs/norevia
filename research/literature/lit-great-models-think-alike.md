---
id: lit-great-models-think-alike
title: "Great Models Think Alike and this Undermines AI Oversight (Goel et al., 2025)"
area: literature
evidence: relato-autores
tags: [correlacao-de-erros, similaridade, capa, llm-as-judge, weak-to-strong, verificacao]
sources:
  - "Goel, S., Struber, J., Auzina, I. A., Chandra, K. K., Kumaraguru, P., Kiela, D., Prabhu, A., Bethge, M. & Geiping, J. (2025). Great Models Think Alike and this Undermines AI Oversight. arXiv:2502.04313v2 (12 jun 2025). https://arxiv.org/abs/2502.04313v2 — HTML: https://arxiv.org/html/2502.04313v2"
related: [lit-correlated-errors, lit-hong-page-diversity, lit-sintese]
updated: 2026-11-07
primary_opened: true
version: "v2 (2025-06-12); v1 2025-02-06"
summary: Propõe a métrica CAPA de similaridade por erros sobrepostos e mostra que juízes LLM favorecem modelos parecidos com eles, que o ganho weak-to-strong vem de conhecimento complementar e que os erros ficam mais parecidos conforme a capacidade cresce.
---

## Pergunta
Como medir a similaridade funcional entre LMs descontando o acaso dado suas acurácias, e que efeito essa similaridade tem sobre supervisão por IA (LLM-as-judge e treino weak-to-strong)?

## Método
- **CAPA** (κp; Sec. 2.2, Eqs. 2–4): concordância observada = média, por questão, de Σ_o p1(o)·p2(o) sobre as alternativas; concordância esperada combina a probabilidade média de cada modelo na alternativa correta com distribuição uniforme do resto nas erradas; κp = (c_obs − c_exp)/(1 − c_exp), em [−1, 1]; 0 = tão similar quanto modelos independentes de mesma acurácia. Para classificação binária reduz-se a *error consistency*.
- LLM-as-judge (Sec. 3): 9 juízes × 39 modelos avaliados, MMLU-Pro filtrado (8.707 questões, 14 domínios); checagem em AlpacaEval (App. B.4).
- Weak-to-strong (Sec. 4): 4 modelos fracos (1–3B) × 3 fortes (7–9B) = 12 pares, 15 tarefas binárias de Burns et al. (2024), 180 treinos.
- Tendência com capacidade (Sec. 5): 130 modelos do OpenLLM Leaderboard 2 em MMLU-Pro e BBH.

## Resultado relatado
- Viés de afinidade do juiz: nota do juiz correlaciona com CAPA, r médio ≈ 0,84 (p < 0,01; pares entre famílias). Correlação parcial controlando acurácia continua significativa: de ≈0,35 (Llama-3.3-70B, p<0,05) a 0,65 (Llama-3.1-8B e gemma-2-9b, p<0,01). Efeito mais forte em juízes < ~32B (Sec. 3.2, Tabela 2, Fig. 3).
- Weak-to-strong: similaridade correlaciona negativamente com o ganho (r = −0,85; parcial controlando o gap de acurácia r = −0,35, p<0,01). Tabela 3 (média de 180 runs): aluno forte inicial 75,1%; supervisor fraco +4,1 p.p.; aluno weak-to-strong +7,4; teto de elicitação +11,2; elicitação + conhecimento complementar +14,1. Nas questões em que o supervisor fraco errou e o forte elicitado acertou, acurácia média 42,2% (Fig. 5) (Sec. 4).
- Similaridade cresce com capacidade: correlação positiva forte entre capacidade e similaridade média (Fig. 6), mantida por categoria de MMLU-Pro e BBH (App. D.4); dificuldade é confundidor leve; instruction tuning reforça a tendência (App. D.2). O texto extraído não traz o valor numérico de r/inclinação da Fig. 6 (lacuna).

## Custo/compute considerado?
Não diretamente. O foco é qualidade da supervisão, não custo de inferência.

## Ameaças à validade
- Causalidade não estabelecida: não mostra que reduzir similaridade melhora supervisão sem perder capacidade (Sec. 7).
- Restrito a múltipla escolha; similaridade em texto livre fica para trabalho futuro.
- Juízes avaliados em formato de múltipla escolha, não em tarefas abertas típicas de agentes.
- Apêndice A.7 (limitações do CAPA) não foi lido (texto truncado na extração).

## Relevância para a pergunta central
Duas consequências diretas para swarms: (1) **verificação por pares semelhantes é enviesada** — um validador da mesma família tende a aprovar os erros que ele próprio cometeria; (2) **ganho por cooperação depende de conhecimento complementar**, não do número de agentes — o ganho weak-to-strong cai quando os modelos são parecidos. Junto com lit-correlated-errors, indica que a tendência de convergência dos modelos de fronteira reduz o “dividendo de diversidade” disponível para micro-swarms homogêneos.

## Hipóteses candidatas
- candidata: o valor de um validador no micro-swarm é proporcional a (1 − CAPA) entre validador e executor; validadores com CAPA alto aumentam falso sucesso.
- candidata: medir CAPA (ou concordância-quando-erram) em um conjunto de calibração é um preditor barato de quando adicionar um 2º agente compensa.
- candidata: com modelos de fronteira cada vez mais similares, o ganho de N agentes homogêneos tende a cair ao longo de gerações de modelos, enquanto o ganho de verificadores mecânicos (testes, execução) permanece.

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2502.04313 (v2, 12 jun 2025; “60 pages, 20 figures”; sem venue no abs) e https://arxiv.org/html/2502.04313v2 (primeiros ~100k de ~228k caracteres; apêndices tardios não lidos).
- Lacunas: valor numérico da tendência na Fig. 6; conteúdo do App. A.7; se houve publicação em conferência (ICML 2025?) não confirmado — não afirmado aqui.
