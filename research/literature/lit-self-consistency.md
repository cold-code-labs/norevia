---
id: lit-self-consistency
title: Self-consistency — amostrar vários caminhos de raciocínio e votar
area: literature
evidence: relato-autores
tags: [self-consistency, voto-majoritario, saturacao, incerteza, baseline]
sources:
  - "Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E., Narang, S., Chowdhery, A. & Zhou, D. (2023). Self-Consistency Improves Chain of Thought Reasoning in Language Models. ICLR 2023. arXiv:2203.11171v4. https://arxiv.org/abs/2203.11171v4"
related: [lit-more-agents, lit-more-llm-calls, lit-large-language-monkeys]
updated: 2026-11-07
primary_opened: true
version: "v4 (7 mar. 2023, camera-ready ICLR); v1 21 mar. 2022"
summary: Amostrar cerca de 40 cadeias de raciocínio e votar a resposta final melhora muito o CoT guloso (até +17,9 pontos no GSM8K), com saturação rápida e concordância que serve de sinal de incerteza.
---

## Pergunta
Substituir a decodificação gulosa do chain-of-thought por amostragem de vários caminhos com voto majoritário melhora o raciocínio?

## Método
Amostrar m caminhos de raciocínio (m=40 nos resultados principais) com o mesmo prompt few-shot CoT e escolher a resposta final mais frequente. Modelos: UL2-20B, GPT-3 code-davinci-001/002, LaMDA-137B, PaLM-540B. Tarefas aritméticas, de senso comum e ARC. Comparações: sample-and-rank, beam search, ensembles de prompts e de modelos.

## Resultado relatado
- Tabelas 2–3, CoT guloso → SC com 40 caminhos, PaLM-540B: GSM8K 56,5→74,4 (+17,9); SVAMP 79,0→86,6; AQuA 35,8→48,3; StrategyQA 75,3→81,6; ARC-c 85,2→88,7.
- code-davinci-002: GSM8K 60,1→78,0 (+17,9); SVAMP +11,0; AQuA +12,2; StrategyQA +6,4; ARC-c +3,9. Os números do resumo correspondem a este modelo.
- Ganho menor no modelo menor: UL2-20B tem GSM8K +3,2.
- Número de caminhos (Fig. 2; Tabela 6, UL2-20B, AQuA): 19,7 (1) → 24,9 (5) → 25,3 (10) → 26,7 (20) → 26,9 (40). Os autores dizem que "performance saturates quickly" e sugerem começar com 5 ou 10 caminhos (Sec. 5).
- Beam search piora com largura maior: 23,6 (beam 1) → 10,2 (beam 40) na Tabela 6.
- Ensemble de prompts (Tabela 7, LaMDA-137B, GSM8K): CoT 17,1; 40 permutações 19,2; SC 27,7. Ensembles de modelos (Tabela 10) ficam abaixo do SC de um único PaLM-540B (74,4).
- Concordância entre caminhos altamente correlacionada com acurácia no GSM8K (Fig. 5). Os autores propõem usá-la como sinal de baixa confiança.

## Custo/compute considerado?
Só como limitação: o método "incurs more computation cost" (Sec. 5). Não há comparação com orçamento igualado contra outros usos do compute.

## Ameaças à validade
- Exige resposta final num conjunto fixo, para poder votar.
- Modelos de 2022 sem raciocínio longo; o ganho com modelos de reasoning atuais não é medido aqui.
- A curva por número de caminhos com números exatos só existe para UL2-20B na Tabela 6; os demais estão só em figura.

## Relevância para a pergunta central
É o baseline obrigatório para qualquer sistema multiagente que vote ou debata: "N amostras independentes + voto" com o mesmo número de chamadas. A concordância entre amostras é um sinal barato de incerteza que pode decidir quando expandir ou encerrar, insumo direto para Adaptive Swarm Activation.

## Hipóteses candidatas
- candidata: a maior parte do ganho de agregação vem das primeiras 5 a 10 amostras; expandir depois disso tem retorno marginal pequeno.
- candidata: a taxa de concordância entre as primeiras k amostras prevê se vale escalar (concordância baixa sinaliza um problema difícil e vale mais compute; concordância alta permite parar cedo).
- candidata: ensembles de modelos ou prompts diferentes não superam automaticamente o SC de um único modelo forte; diversidade só vale se os erros forem descorrelacionados.

## Verificação
Abertos em 2026-11-07: https://arxiv.org/abs/2203.11171 (v4 e ICLR 2023 confirmados) e https://ar5iv.labs.arxiv.org/html/2203.11171 (renderização ar5iv da última versão; não há HTML nativo do arXiv para esta data). Números extraídos por leitor automático, sem conferência manual célula a célula no PDF. Lidos cerca de 100k de 104k caracteres.
