---
id: lit-adaptive-consistency
title: 'Adaptive-Consistency — número de amostras por pergunta decidido pela concordância'
area: literature
evidence: relato-autores
tags: [self-consistency, early-stopping, custo, ativacao-adaptativa, votacao]
sources:
  - "Aggarwal, P., Madaan, A., Yang, Y. & Mausam (2023). Let's Sample Step by Step: Adaptive-Consistency for Efficient Reasoning and Coding with LLMs. Proceedings of EMNLP 2023, pp. 12375–12396. doi:10.18653/v1/2023.emnlp-main.761. https://aclanthology.org/2023.emnlp-main.761"
  - "Preprint: arXiv:2305.11860v2 (16 nov. 2023). https://arxiv.org/abs/2305.11860v2"
related: [lit-early-stopping-sc, lit-self-consistency, lit-more-agents]
updated: 2026-11-07
primary_opened: true
version: "v2 (16 nov. 2023); v1 19 mai. 2023 tinha 13 datasets e 2 LLMs"
summary: Parar de amostrar quando a resposta majoritária já é estatisticamente estável reduz em média 3,2× as amostras do self-consistency, com variação de acurácia de −0,07 ponto em 17 datasets.
---

## Pergunta
Self-consistency usa um número fixo de amostras por pergunta. Dá para gastar menos em perguntas "fáceis" (consenso rápido) e mais nas difíceis, sem perder acurácia?

## Método
Amostra sequencial; após cada amostra, um critério de parada estima a probabilidade de a resposta mais votada continuar sendo a mais votada. Critério principal: aproximação Beta(v1+1, v2+1) entre as duas respostas mais frequentes (Eq. 2, Sec. 3); Dirichlet completo é parecido em qualidade mas ~4 ordens de grandeza mais lento (Tabela 2). Limiar C = 0,95 (Sec. 4). Orçamento máximo: 40 amostras (math/commonsense/simbólico); 50/100/1000 em código (APPS/HumanEval-MBPP/CodeContests). Modelos: GPT-3.5-turbo, Vicuna-13B, code-davinci-002 (+ Incoder-6B, CodeGen-16B em código). 17 datasets.

## Resultado relatado
- Média geral (Tabela 5): 3,2× menos gerações, Δ acurácia −0,07.
- Por modelo (Tabela 1): GPT-3.5-turbo 4,4× (−0,2); Vicuna-13B 1,9× (+0,0); code-davinci-002 3,4× (+0,0).
- Por categoria (Tabela 1): Math 3,3× (−0,1); Commonsense 2,9× (−0,2); Simbólico 3,8× (+0,0); Código 2,4× (+0,4).
- Máximo: 7,9× (Boolean Expressions, GPT-3.5-turbo, −0,4 na Tabela 5 — o texto da Sec. 5.3 diz "sem perda", inconsistência do paper).
- Com custo médio igual, supera SC de orçamento fixo em todos os pontos testados; ≈+3 pontos em GSM8K com custo médio 10 (Sec. 5.2, Figs. 4/6).
- Diferença de acurácia não significativa (p médio 0,50, 3 seeds; Tabela 6).

## Custo/compute considerado?
Sim, em número de amostras (gerações). Não converte em tokens/US$ nem latência (amostragem sequencial aumenta latência em relação a amostragem paralela de N fixo).

## Ameaças à validade
Voto exige resposta com match exato (ruim para geração livre, Sec. 7); "anticipated to fail where Self-Consistency fails" (Limitações) — se o modelo converge para um erro, para cedo no erro; modelos de 2023; números agregados variam entre figura/texto (3,3× vs 3,2×; "2 a 4 vezes").

## Relevância para a pergunta central
Prova de conceito de **orçamento por pergunta guiado por incerteza observada**: o próprio coletivo de amostras decide quando parar. É uma regra de parada para micro-swarms homogêneos. Não compara contra "um agente com mais raciocínio", e a concordância mede estabilidade, não correção.

## Hipóteses candidatas
- candidata: o número ótimo de agentes/amostras por tarefa é previsível pela concordância das primeiras k respostas; a regra Beta é um baseline obrigatório para qualquer controlador elástico Norevia.
- candidata: com erros correlacionados (mesmo modelo, mesmo prompt), parada por concordância economiza custo mas não protege contra falso sucesso — o aceite precisa de verificador externo.

## Verificação
Aberto em 2026-11-07: https://arxiv.org/abs/2305.11860 (metadados), https://ar5iv.labs.arxiv.org/html/2305.11860 (texto da última versão renderizada), https://aclanthology.org/2023.emnlp-main.761 (venue/DOI). O PDF bruto não pôde ser lido como texto (sem extrator local).
