---
id: lit-mixture-of-agents
title: "Mixture-of-Agents (Wang et al., ICLR 2025) — camadas de propositores e agregador"
area: literature
evidence: relato-autores
tags: [mixture-of-agents, agregacao, diversidade, custo, latencia, alpacaeval]
sources:
  - "Wang, J., Wang, J., Athiwaratkun, B., Zhang, C. & Zou, J. (2025). Mixture-of-Agents Enhances Large Language Model Capabilities. International Conference on Learning Representations (ICLR 2025). https://proceedings.iclr.cc/paper_files/paper/2025/hash/5434be94e82c54327bb9dcaf7fca52b6-Abstract-Conference.html"
  - "arXiv:2406.04692v1 (7 jun 2024), versão única. https://arxiv.org/abs/2406.04692v1"
related: [lit-self-moa, lit-pareto-test-time-multiagent, lit-multiagent-debate-du]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (2024-06-07); ICLR 2025"
summary: Seis LLMs abertos em 3 camadas com agregador superam GPT-4o no AlpacaEval 2.0 (65,1% vs 57,5% LC), mas o ganho depende de propositores de qualidade, e o tempo até o 1º token cresce com as camadas.
---

## Pergunta
Combinar vários LLMs em camadas — cada agente lendo as saídas da camada anterior — supera o melhor modelo isolado em qualidade de resposta aberta?

## Método
- 3 camadas, 6 propositores abertos por camada (Qwen1.5-110B-Chat, Qwen1.5-72B-Chat, WizardLM-8x22B, LLaMA-3-70B-Instruct, Mixtral-8x22B-v0.1, dbrx-instruct); agregador final Qwen1.5-110B-Chat (Seção 3.1).
- Variantes: MoA w/ GPT-4o (agregador GPT-4o); MoA-Lite (2 camadas, agregador Qwen1.5-72B-Chat).
- Avaliação: AlpacaEval 2.0 (LC win rate, julgado por LLM), MT-Bench, FLASK.

## Resultado relatado
- AlpacaEval 2.0 (Tabela 2a, LC win rate): MoA w/ GPT-4o 65,7 ± 0,7%; MoA 65,1 ± 0,6%; MoA-Lite 59,3 ± 0,2%; GPT-4 Omni (05/13) 57,5%.
- MT-Bench (Tabela 2b): MoA w/ GPT-4o 9,40; MoA 9,25; MoA-Lite 9,18; GPT-4o 9,19.
- **Ablação de propositores** (Tabela 3; 2 camadas, agregador Qwen1.5-110B, AlpacaEval LC):

| n propositores | LLMs diferentes | mesmo LLM (temp 0,7) |
|---|---|---|
| 1 | 47,8% | 47,8% |
| 2 | 58,8% | 54,5% |
| 3 | 58,0% | 56,1% |
| 6 | 61,3% | 56,7% |

  Diversidade de modelos ajudou nesta configuração (+4,6 pp em n=6). O texto diz que o escore "increase monotonically with n", mas a coluna multi-modelo não é monotônica (n=2 > n=3).
- Papéis (Tabela 4): o mesmo modelo rende diferente como agregador vs. propositor (ex.: WizardLM 52,9% agregador / 63,8% propositor).
- A primeira agregação dá o maior ganho (Seção 5).

## Custo/compute considerado?
Sim, parcialmente (Seção 3.4, Fig. 5): custo em US$ (preços de 22 maio 2024) e TFLOPs como proxy de latência. Relato: MoA-Lite iguala o custo do GPT-4o com escore maior e supera GPT-4 Turbo em ~4% sendo >2× mais custo-efetivo. Valores exatos só no gráfico. Limitação declarada: alto **time-to-first-token**, pois nada sai antes da última camada.

## Ameaças à validade
- Métricas de preferência julgadas por LLM (AlpacaEval/MT-Bench), sensíveis a estilo e comprimento.
- Comparação com modelo único em 1 chamada, não com ensemble do melhor modelo a compute igual — lacuna explorada por lit-self-moa, que mostra o mesmo ganho (ou maior) sem misturar modelos.
- Inconsistência interna: Introdução cita 65,8%, Abstract/Tabela 65,1%.
- Sem tarefas verificáveis (código, matemática) no núcleo do paper.

## Relevância para a pergunta central
Referência de "cooperação por agregação" (sem diálogo iterativo). Mostra ganho grande sobre 1 chamada, mas o desenho não separa "mais amostras" de "modelos diferentes" a custo igual. Para Norevia, MoA é um candidato de topologia barata de comunicação (camadas sem memória acumulada) — e lit-pareto-test-time-multiagent sugere que ele domina a fronteira de Pareto quando bem dimensionado.

## Hipóteses candidatas
- candidata: o primeiro passo de agregação captura a maior parte do ganho; camadas extras têm retorno decrescente e custo de latência linear.
- candidata: o papel (propositor vs. agregador) importa tanto quanto o modelo — alocação de papéis por desempenho medido.
- candidata: a vantagem da diversidade de modelos desaparece quando se controla pela qualidade média dos propositores (ver lit-self-moa).

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2406.04692 (v1 única); https://arxiv.org/html/2406.04692v1 (tabelas e texto); página de proceedings ICLR 2025 (venue, autores).
- Lacuna: valores numéricos de custo/TFLOPs e FLASK (só em figuras); código oficial não inspecionado.
