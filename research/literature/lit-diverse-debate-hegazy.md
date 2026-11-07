---
id: lit-diverse-debate-hegazy
title: "Diversity of Thought Elicits Stronger Reasoning in Multi-Agent Debate — modelos heterogêneos vs homogêneos (Hegazy, 2024)"
area: literature
evidence: relato-autores
tags: [debate, diversidade, heterogeneo-vs-homogeneo, gsm8k, ensemble]
sources:
  - "Hegazy, M. (2024). Diversity of Thought Elicits Stronger Reasoning Capabilities in Multi-Agent Debate Frameworks. Journal of Robotics and Automation Research 5(3):1–10 (out 2024, conforme journal-ref do arXiv). arXiv:2410.12853v2 (23 jan 2025; v1 10 out 2024). https://arxiv.org/abs/2410.12853v2 — HTML lido: https://arxiv.org/html/2410.12853v1"
related: [lit-hong-page-diversity, lit-correlated-errors, lit-diversity-of-thought, lit-sintese]
updated: 2026-11-07
primary_opened: true
version: "v2 (2025-01-23) no abs; números extraídos do HTML v1 (2024-10-10)"
summary: Após 4 rodadas de debate, 3 modelos médios diferentes chegaram a 91% no GSM8K contra 82% de 3 cópias do mesmo modelo — evidência fraca (sem tamanho de amostra, variância nem custo) a favor de heterogeneidade.
---

## Pergunta
Em debate multiagente (estilo Du et al.), um grupo de modelos **diferentes** raciocina melhor do que um grupo de cópias do mesmo modelo?

## Método
- Debate de 4 rodadas (rodada 0 = sem debate), 3 agentes, resposta final pela moda; Gemini-Pro também atua como sumarizador (Sec. 3–4).
- GSM8K: conjunto diverso Gemini-Pro + Mixtral 8x7B + PaLM 2-M vs 3× Gemini-Pro. ASDiv/MATH: Gemini Flash 1.5 + Gemini Pro + GPT-3.5. Também conjuntos de modelos 7B e ~2B (Sec. 4.2).

## Resultado relatado (Sec. 4.2; Abstract)
- GSM8K, diverso: individuais Gemini-Pro 78%, Mixtral 70%, PaLM 2-M 64%; debate de 4 rodadas: 78% → 91%.
- GSM8K, homogêneo (3× Gemini-Pro): 78% → 80% (sem CoT) e 78% → 82% (zero-shot CoT).
- ASDiv: individuais 89% / 86% / 81% → 94% após 4 rodadas (autor afirma estado da arte).
- MATH: individuais 55% / 32% / 33%; após debate só margens relatadas (24% sobre GPT-4, 14% sobre Gemini Ultra), sem valor absoluto no texto.
- Modelos pequenos: +17% (7B) e +10% (~2B) até a rodada 4, sem valores absolutos no texto.
- Apêndice A.1: num conjunto 7B, a resposta caiu de 69% para 66% após debate — debate também pode piorar.

## Custo/compute considerado?
Não. Nenhuma contagem de tokens, chamadas ou custo; debate de 3 agentes × 4 rodadas custa ~12+ chamadas contra 1 do baseline individual, e não há comparação com self-consistency de mesmo orçamento.

## Ameaças à validade
- Número de questões avaliadas não informado; sem variância, seeds ou repetições.
- Comparação “supera GPT-4” sem valor de GPT-4 no texto (cita Bubeck et al. 2023).
- Sumarizador é também debatedor (confundidor); listas de modelos inconsistentes entre texto e apêndice.
- Autor único; journal-ref em periódico de robótica sem revisão verificada aqui.
- Sem baseline de votação simples com compute igual — o ganho pode ser de ensemble, não de debate.

## Relevância para a pergunta central
Apoia (fracamente) que heterogeneidade de modelos aumenta o ganho de cooperação em relação a cópias homogêneas (+13 p.p. vs +4 p.p. no GSM8K). Mas não responde “a que custo” nem “vs um único agente com mais raciocínio”, e o desenho não controla compute. Útil como hipótese a reproduzir no Observatory, não como evidência.

## Hipóteses candidatas
- candidata: com orçamento de chamadas igual, debate entre modelos heterogêneos supera votação entre cópias homogêneas; debate entre cópias homogêneas não supera votação simples.
- candidata: o ganho de heterogeneidade é maior quando os membros têm acurácias individuais próximas e erros pouco correlacionados; um membro muito mais fraco pode arrastar o grupo (cf. queda 69%→66%).

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2410.12853 (v2, 23 jan 2025, journal-ref JRAR 5(3)) e https://arxiv.org/html/2410.12853v1 (números). https://arxiv.org/html/2410.12853v2 retornou 404; o PDF v2 não pôde ser extraído.
- Lacuna: possíveis mudanças numéricas entre v1 e v2 não verificadas (o abstract v2 mantém 91%, 82% e 94%); página do periódico não aberta.
