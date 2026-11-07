---
id: lit-nothinking
title: 'Reasoning Models Can Be Effective Without Thinking — NoThinking + escala paralela'
area: literature
evidence: relato-autores
tags: [reasoning-effort, sequencial-vs-paralelo, test-time-compute, latencia, verificador]
sources:
  - "Ma, W., He, J., Snell, C., Griggs, T., Min, S. & Zaharia, M. (2025). Reasoning Models Can Be Effective Without Thinking. arXiv:2504.09858v1 (14 abr. 2025). https://arxiv.org/abs/2504.09858v1 · doi:10.48550/arXiv.2504.09858"
related: [lit-s1-budget-forcing, lit-overthinking, lit-more-agents]
updated: 2026-11-07
primary_opened: true
version: "v1 (14 abr. 2025), única versão; venue não identificado"
summary: Com o mesmo orçamento de tokens, pular o raciocínio explícito e gerar várias respostas curtas em paralelo com verificador igualou ou superou o raciocínio longo com até 9× menos latência.
---

## Pergunta
O longo bloco de "Thinking" de modelos de raciocínio é necessário? Com orçamento igual de tokens, gastar em uma cadeia longa ou em várias respostas curtas paralelas?

## Método
Modelo principal DeepSeek-R1-Distill-Qwen-32B (apêndice: 7B, 14B). "NoThinking": pré-preenche o bloco de pensamento como vazio. Orçamentos igualados via max_tokens (budget forcing; Sec. 3.1). Sete datasets: matemática (AIME 2024/2025, AMC 2023, OlympiadBench), prova formal (MiniF2F, ProofNet), código (LiveCodeBench). Avaliação por pass@k e, na Sec. 4, escala paralela: N saídas NoThinking agregadas por verificador (Lean) ou por seleção best-of-N (confiança, voto). Latência = máximo de tokens gerados.

## Resultado relatado
- Abstract/Sec. 3.3: AMC 2023 com 700 tokens, NoThinking 51,3 vs Thinking 28,9.
- Sec. 3.3: "NoThinking eventually matches Thinking at the largest k, while still using 2.0–5.1x fewer tokens." Em pass@1 com orçamento alto (~3.500 tokens), Thinking ainda vence; LiveCodeBench é exceção (Thinking vence).
- Tabela 3 (tarefas com verificador, igualar pass@1 do Thinking): MiniF2F 36,38 vs 34,84 com latência −6,47× e tokens −3,91×; ProofNet 6,90 vs 5,52, latência −7,20×, tokens −4,14× (k = 2).
- Sec. 4.2 (sem verificador): "NoThinking achieves a higher pass@1 score (55.79 vs. 54.1) while reducing latency by a factor of 9" (associado pelo texto a OlympiadBench).
- Seleção por confiança geralmente supera voto majoritário (Tabela 2). Diversidade das respostas "alone does not fully explain" os ganhos.

## Custo/compute considerado?
Sim: tokens totais e latência (paralela). Não há US$. O verificador formal (Lean) é tratado como perfeito e de custo desprezível.

## Ameaças à validade
Só modelos open-weight da família R1-Distill; preprint sem revisão por pares identificada; acurácias absolutas muito baixas em ProofNet; ganhos com verificador dependem de verificador perfeito; Thinking ainda vence em pass@1 com orçamento alto e em código.

## Relevância para a pergunta central
Um dos raros trabalhos que compara **diretamente** "um agente com reasoning longo" vs "N tentativas curtas + agregação" com orçamento igual. Resultado: em orçamentos baixos e com verificador, paralelo-curto vence em qualidade e latência; em orçamento alto sem verificador e em código, sequencial-longo ainda vence. Isso é uma fronteira de transição empírica, do tipo que a Norevia quer mapear — já parcialmente feita por outros.

## Hipóteses candidatas
- candidata: o ponto de cruzamento "1 longo vs N curtos" depende de (a) disponibilidade de verificador barato e (b) orçamento total; com verificador perfeito, N curtos dominam em latência.
- candidata: sem verificador, o ganho de N curtos é limitado pelo agregador (voto/confiança) e pela correlação entre amostras do mesmo modelo.
- candidata: latência (paralelismo) é um eixo de custo separado de tokens; uma política Norevia precisa otimizar os dois (ver também lit-routellm).

## Verificação
Aberto em 2026-11-07: https://arxiv.org/abs/2504.09858 (metadados), https://arxiv.org/html/2504.09858v1 (texto; trechos citados conferidos literalmente: 51,3 vs 28,9; "2.0–5.1x"; Tabela 3; "55.79 vs. 54.1"). Lacuna: venue de publicação não encontrado; cabeçalhos da Tabela 3 ilegíveis no texto extraído; últimos ~19 mil caracteres (apêndices) não lidos.
