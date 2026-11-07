---
id: lit-inverse-scaling-ttc
title: 'Inverse Scaling in Test-Time Compute — quando pensar mais piora'
area: literature
evidence: relato-autores
tags: [reasoning-effort, overthinking, test-time-compute, falhas, seguranca]
sources:
  - "Gema, A. P., Hägele, A., Chen, R., Arditi, A., Goldman-Wetzler, J., Fraser-Taliente, K., Sleight, H., Petrini, L., Michael, J., Alex, B., Minervini, P., Chen, Y., Benton, J. & Perez, E. (2025). Inverse Scaling in Test-Time Compute. Transactions on Machine Learning Research (TMLR), 12/2025. arXiv:2507.14417v2 (15 dez. 2025). https://arxiv.org/abs/2507.14417v2 · doi:10.48550/arXiv.2507.14417"
related: [lit-overthinking, lit-s1-budget-forcing, lit-nothinking]
updated: 2026-11-07
primary_opened: true
version: "v2 (15 dez. 2025); v1 19 jul. 2025"
summary: Em tarefas construídas com distratores e correlações espúrias, dar mais orçamento de raciocínio a modelos de fronteira reduziu a acurácia — o retorno de reasoning effort pode ser negativo.
---

## Pergunta
Existem tarefas em que aumentar o comprimento do raciocínio de Large Reasoning Models (LRMs) **diminui** a acurácia? Quais modos de falha explicam isso?

## Método
Tarefas em quatro categorias: contagem com distratores (Misleading Math/Python, paradoxos famosos), regressão com features espúrias (Grades Regression), dedução com rastreio de restrições (Zebra puzzles) e avaliações de risco de IA (Model-Written Evaluations, p. ex. Survival Instinct). Três regimes: controlled overthinking (orçamento pedido: 0, 1.024, 2.048, 4.096… tokens; "low/medium/high" para série o), natural overthinking (sem orçamento; comparação por comprimento natural) e cautioned (Apêndice D). Modelos (Tabela 1): Claude Sonnet 3.7, Sonnet 4, Opus 4, o3-mini, o4-mini, o3, Qwen3-32B, QwQ-32B, DeepSeek R1; foco em Opus 4, o3, R1.

## Resultado relatado
- Misleading Math (Fig. 3): Opus 4 (controlled) cai de ~100% para ~85–90%; R1 (natural) cai de 70% para 30% com cinco distratores; o3 mais estável.
- Misleading Python (Fig. 4): Opus 4 de quase perfeito para ~80%; o3 escala positivamente em controlled e em U invertido em natural.
- Grades Regression (Figs. 6–7): Sonnet 3.7, Opus 4 e o3-mini com escala inversa em zero-shot; Qwen3-32B positiva; few-shot (8–16 exemplos) remove em grande parte a tendência inversa.
- Zebra (Fig. 8): escala inversa mais forte em natural overthinking para os três modelos-foco.
- Survival Instinct (Fig. 10): Sonnet 4 cai de 60% para 47% de respostas alinhadas com mais raciocínio; o3 sobe de 72% para 76%.
- Benchmarks padrão (GSM8K, MultiArith etc.) não mostram escala inversa significativa.
- Conclusão dos autores: "scaling test-time compute naively may amplify flaws in how LRMs approach problems."
- Valores numéricos acima são leituras do texto que descreve as figuras; não houve acesso a tabelas numéricas por ponto.

## Custo/compute considerado?
Indiretamente: o eixo é o comprimento do raciocínio (tokens), mas o paper mede acurácia vs compute, não custo monetário.

## Ameaças à validade
"The majority of our tasks are synthetically generated" para isolar falhas, logo a prevalência em tarefas reais é desconhecida; tendências em MWE fracas/ruidosas; orçamentos pedidos por prompt não são limites técnicos exatos; 3–5 repetições por condição.

## Relevância para a pergunta central
Contraria a premissa "mais reasoning ≥ menos reasoning". Para a Norevia, mostra que a curva qualidade×esforço individual pode ser **não monotônica** e dependente do modelo e da tarefa; um controlador que só "aumenta esforço quando incerto" pode piorar. Também sugere que diversidade de modelos (Claude vs o-series vs R1 têm falhas diferentes) é uma forma de descorrelacionar erros que mais reasoning do mesmo modelo não oferece.

## Hipóteses candidatas
- candidata: existe um esforço ótimo interior por (modelo, tipo de tarefa); além dele, mais raciocínio individual reduz qualidade, e o recurso extra tem melhor uso em verificação externa ou em outro modelo.
- candidata: em tarefas com distratores/espúrias, um micro-swarm heterogêneo (modelos com modos de falha diferentes) supera o aumento de esforço de um único modelo com custo igual.
- candidata: exemplos (few-shot / memória de casos) podem substituir parte do esforço de raciocínio e remover a escala inversa — ligação com memória limitada do AgentNet.

## Verificação
Aberto em 2026-11-07: https://arxiv.org/abs/2507.14417 (metadados e journal ref TMLR 12/2025), https://arxiv.org/html/2507.14417v2 (texto até ~100 mil de 214 mil caracteres; apêndices não lidos). Lacuna: números por ponto vêm de descrições de figuras, não de tabelas; projeto em https://safety-research.github.io/inverse-scaling-ttc não aberto.
