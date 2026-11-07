---
id: lit-overthinking
title: 'Do NOT Think That Much for 2+3=? — overthinking em modelos de raciocínio longo'
area: literature
evidence: relato-autores
tags: [reasoning-effort, overthinking, custo, dificuldade, eficiencia]
sources:
  - "Chen, X., Xu, J., Liang, T., He, Z., Pang, J., Yu, D., Song, L., Liu, Q., Zhou, M., Zhang, Z., Wang, R., Tu, Z., Mi, H. & Yu, D. (2025). Do NOT Think That Much for 2+3=? On the Overthinking of Long Reasoning Models. Proceedings of the 42nd ICML, PMLR 267:9487–9499. https://proceedings.mlr.press/v267/chen25bx.html"
  - "Preprint: arXiv:2412.21187v2 (1 fev. 2025), título 'On the Overthinking of o1-Like LLMs'. https://arxiv.org/abs/2412.21187v2 · doi:10.48550/arXiv.2412.21187"
related: [lit-s1-budget-forcing, lit-nothinking, lit-inverse-scaling-ttc]
updated: 2026-11-07
primary_opened: true
version: "arXiv v2 (1 fev. 2025); v1 30 dez. 2024; versão ICML não aberta em PDF"
summary: Modelos de raciocínio longo acertam na primeira solução em mais de 92% dos casos e gastam o resto em verificações redundantes; auto-treino cortou ~45% dos tokens em MATH500 com −0,2 ponto de acurácia.
---

## Pergunta
Modelos tipo o1 alocam compute demais a problemas simples? Como medir e reduzir esse desperdício sem perder acurácia?

## Método
Análise das "rodadas de solução" dentro da cadeia de raciocínio de QwQ-32B-Preview e DeepSeek-R1 (baselines convencionais: Llama-3.3-70B-Instruct, Qwen2.5-Math-72B-Instruct) em ASDIV, GSM8K, MATH500, GPQA, AIME24 (Sec. 2). Duas métricas: eficiência de resultado ξO (tokens até a primeira resposta correta / tokens totais) e de processo ξP (tokens de soluções com estratégia distinta / total). Mitigação (Sec. 3): auto-treino em PRM12K com SFT/DPO/RPO/SimPO, usando respostas encurtadas (First-Correct Solution, FCS; FCS+Reflection; soluções gulosamente diversas).

## Resultado relatado
- "2+3": QwQ gera 13 soluções, 901 tokens; a primeira (39 tokens) já está correta → ξO = 4,3% (Fig. 1–2). Em média, modelos o1-like usam "1,953% more tokens" que convencionais para a mesma resposta.
- "In more than 92% of cases, the initial round of solutions produces the correct answer" (Sec. 2.2); a primeira rodada costuma ser <60% dos tokens.
- Tabela 1, ξO/ξP: MATH500 QwQ 52,3%/71,2%, R1 51,0%/66,2%; GSM8K QwQ 50,7%/67,6%. Convencionais: ξO 75,4–96,3%.
- Nível 1 do MATH500: ξO < 50% para ambos (Sec. 2.4) — o desperdício relativo é maior nos problemas mais fáceis.
- Tabela 4 (QwQ, MATH500 base 93,0%, 2407,9 tokens): SimPO+FCS+Reflection 92,8%, 1330,7 tokens (≈−44,7%); SimPO+FCS 91,0%, 1016,0 (≈−57,8%). GSM8K 94,8→96,0%, 772,8→416,6 tokens; GPQA 59,6→59,1%, 3228→2086; AIME24 46,7→43,3%, 9481→5155.
- Inconsistência: a introdução atribui −48,6% a MATH500, mas na Tabela 4 esse valor é de ASDIV.

## Custo/compute considerado?
Sim, em tokens gerados (proxy de compute/latência). Sem US$; custo do auto-treino não contabilizado contra a economia.

## Ameaças à validade
Modelos de raciocínio de fim de 2024/início de 2025; benchmarks de matemática com resposta checável; métrica ξO depende de detectar a "primeira resposta correta" dentro do traço (anotação automática); a queda em AIME24 (−3,4 pontos) mostra que cortar tokens custa mais em problemas difíceis. Resumos externos citam ">85%" (slides ICML) vs ">92%" (arXiv v2) — usar o número da versão aberta.

## Relevância para a pergunta central
Evidência direta de que **mais raciocínio individual tem retorno marginal quase nulo em tarefas fáceis**: a maior parte dos tokens extras é autoverificação redundante. Reforça que um controlador deve cortar esforço em consultas simples ("um 'oi' não deve pagar orquestração"). Também sugere que reflexões sucessivas dentro de um mesmo modelo são verificações correlacionadas (o 2º–Nº "revisor" é o mesmo modelo).

## Hipóteses candidatas
- candidata: o retorno marginal de tokens de raciocínio cai após a primeira solução completa; a partir daí, uma verificação externa (outro agente ou teste) tem melhor valor esperado que mais reflexão do mesmo modelo.
- candidata: o desperdício relativo (1−ξO) é máximo nas tarefas mais fáceis — o ganho de um roteador de esforço é maior em cargas dominadas por consultas simples.

## Verificação
Aberto em 2026-11-07: https://arxiv.org/abs/2412.21187 (metadados), https://arxiv.org/html/2412.21187v2 (texto, Tabelas 1 e 4), https://proceedings.mlr.press/v267/chen25bx.html (venue). Lacuna: PDF da versão ICML não comparado com a v2.
