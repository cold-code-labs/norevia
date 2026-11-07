---
id: lit-large-language-monkeys
title: Large Language Monkeys — repeated sampling e o gargalo da verificação
area: literature
evidence: relato-autores
tags: [repeated-sampling, coverage, verificacao, custo, compute-optimal]
sources:
  - "Brown, B., Juravsky, J., Ehrlich, R., Clark, R., Le, Q. V., Ré, C. & Mirhoseini, A. (2024). Large Language Monkeys: Scaling Inference Compute with Repeated Sampling. arXiv:2407.21787v3. https://arxiv.org/abs/2407.21787v3"
related: [lit-self-consistency, lit-snell-test-time-compute, lit-more-agents]
updated: 2026-11-07
primary_opened: true
version: "v3 (30 dez. 2024); v1 31 jul. 2024; v2 16 set. 2024"
summary: A cobertura (ao menos uma amostra correta) cresce de forma log-linear por quatro ordens de grandeza de amostras, mas sem verificador automático a seleção estabiliza em cerca de 100 amostras.
---

## Pergunta
Escalar o número de amostras independentes é um eixo útil de compute de inferência? Como "coverage" e acurácia final se comportam com k grande?

## Método
Amostras independentes, mesmo prompt, variação só por temperatura (Sec. 5). Tarefas: GSM8K e MATH (128 problemas cada), MiniF2F-MATH (130), CodeContests (140) e SWE-bench Lite (250 tentativas por issue). Modelos: Llama-3 8B/70B, Gemma, Pythia, DeepSeek-Coder-V2-Instruct, entre outros. Coverage = pass@k. Seleção sem verificador: voto majoritário, best-of-N com reward model e voto ponderado.

## Resultado relatado
- SWE-bench Lite, DeepSeek-Coder-V2-Instruct: 15,9% com 1 amostra → 56% com 250. O estado da arte em tentativa única era 43% (Abstract; Sec. 2.1; Fig. 2).
- Custo (Tabela 1, framework Moatless Tools): DeepSeek com 5 tentativas a US$ 0,0072 cada resolve 29,62% (US$ 10,8 no total). GPT-4o com 1 tentativa resolve 24,00% (US$ 39). Claude 3.5 Sonnet com 1 tentativa resolve 26,70% (US$ 51).
- Lei empírica: log(c) ≈ a·k^b, isto é, c ≈ exp(a·k^b) (Sec. 3.1, Eqs. 2–3). Os autores dizem que o ajuste é menos exato que as leis de treino.
- CodeContests, Gemma-2B: pass@1 0,02% → pass@10k 7,1%. MATH, Pythia-160M: 0,27% → 57%.
- Gargalo de seleção (Sec. 4.1, Fig. 7): no MATH com Llama-3-8B-Instruct, a coverage vai de 82,9% (100 amostras) a 98,44% (10.000). Voto majoritário e reward model ficam em 40,50% → 41,41% no mesmo intervalo; todos os métodos de seleção estabilizam por volta de 100 amostras.
- FLOPs iguais (Sec. 2.3, Fig. 4): Llama-3-8B vence Llama-3-70B em coverage no MiniF2F, GSM8K e MATH. No CodeContests, o 70B é quase sempre mais custo-efetivo.
- Verificadores reais falham: 11,3% dos problemas do SWE-bench Lite têm testes instáveis (Sec. 4.2.1). Em 35 de 122 problemas do CodeContests com solução em Python 3, as soluções de referência falham nos próprios testes (Sec. 4.2.2).

## Custo/compute considerado?
Sim. Custo em dólares no SWE-bench (Tabela 1) e comparação por FLOPs entre tamanhos de modelo (Fig. 4). Os autores dizem que FLOPs são proxy grosseiro; batching e prefixo compartilhado mudam o custo real (Sec. 2.3 e 5).

## Ameaças à validade
- Amostras de problemas pequenas (128–140 por benchmark).
- Coverage pressupõe um oráculo; sem verificador, o ganho de coverage não vira acurácia.
- Preços de API de 2024; a comparação de custo não se transfere para hoje.
- Tentativas totalmente independentes: não mede colaboração nem feedback de execução.

## Relevância para a pergunta central
Separa dois fatores que a Norevia precisa modelar: gerar candidatos (barato e escalável) e selecionar o correto (gargalo). Mais agentes só ajudam quando existe um verificador confiável. Isso liga "aceite verificável" ao valor de expandir o swarm.

## Hipóteses candidatas
- candidata: o valor marginal de mais agentes ou amostras é limitado pela precisão do verificador; com aceite mecânico, a curva é log-linear, sem ele, estabiliza perto de 100.
- candidata: com orçamento igual, um modelo menor com várias amostras vence um modelo maior com uma em tarefas com verificador e solução de baixa entropia, mas não em tarefas de busca profunda como CodeContests.
- candidata: investir em verificação rende mais que investir em mais geradores depois de um N modesto.

## Verificação
Abertos em 2026-11-07: https://arxiv.org/abs/2407.21787 (v3 confirmada; sem venue declarado) e https://arxiv.org/html/2407.21787v3. Números extraídos por leitor automático, sem conferência manual célula a célula. Valores ajustados de a e b por tarefa não transcritos (estão no App. C.1; lacuna).
