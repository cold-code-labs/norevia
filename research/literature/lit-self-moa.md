---
id: lit-self-moa
title: "Self-MoA (Li et al., TMLR 2026) — agregar amostras do melhor modelo vence misturar modelos"
area: literature
evidence: relato-autores
tags: [mixture-of-agents, diversidade, qualidade, ensemble, correlacao-de-erros]
sources:
  - "Li, W., Lin, Y., Xia, M. & Jin, C. (2026). Rethinking Mixture-of-Agents: Is Mixing Different Large Language Models Beneficial? Transactions on Machine Learning Research. https://openreview.net/forum?id=K6WwK8URlV (registro BibTeX TMLR: https://jmlr.org/tmlr/papers/bib/K6WwK8URlV.bib)"
  - "arXiv:2502.00674v1 (2 fev 2025), versão única no arXiv. https://arxiv.org/abs/2502.00674v1"
related: [lit-mixture-of-agents, lit-stop-overvaluing-mad, lit-pareto-test-time-multiagent]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (2025-02-02); TMLR 2026 (via BibTeX do jmlr.org)"
summary: Agregar 6 amostras do melhor modelo (Self-MoA) supera misturar 6 modelos diferentes (+6,6 pp no AlpacaEval 2.0); o desempenho depende mais da qualidade média dos propositores que da diversidade.
---

## Pergunta
O ganho do Mixture-of-Agents vem da diversidade entre modelos diferentes, ou basta agregar várias amostras do melhor modelo?

## Método
- Self-MoA: mesmos 2 níveis do MoA, mas todos os propositores são amostras do mesmo modelo (o melhor); comparado a Mixed-MoA com o mesmo nº de propositores (6) e mesmo agregador.
- AlpacaEval 2.0 com os 6 modelos do MoA original; MMLU, CRUX, MATH com Qwen2-7B-Instruct (i), DeepSeek-Coder-V2-Lite-Instruct (d), Qwen2-Math-7B-Instruct (m); 13 combinações Mixed-MoA testadas.
- Análise qualidade × diversidade (Seção 4): >70 misturas de propositores por conjunto, temperaturas 0,5–1,2; qualidade = acurácia média dos propositores; diversidade = Vendi Score; regressão linear normalizada.
- Self-MoA-Seq (Seção 5): agregação sequencial com janela deslizante para escalar além do contexto do agregador.

## Resultado relatado
- AlpacaEval 2.0 (Tabela 1, LC win rate): Mixed-MoA 59,1 vs Self-MoA (WizardLM-2-8x22B ×6) **65,7**; melhor modelo isolado 53,1.
- MMLU / CRUX / MATH (Tabela 3, agregador Qwen2-7B): Self-MoA (melhor modelo por tarefa ×6) 69,01 / 50,75 / 68,42; com agregador por tarefa 69,01 / 52,62 / 69,80; melhores Mixed-MoA por tarefa 68,21 (MMLU) / 47,00 (CRUX) / 67,62 (MATH). Self-MoA vence as 13 configurações mistas em todas as tarefas.
- Média na tarefa mista (Tabela 6): Self-MoA TaskBest 63,81 vs melhor Mixed-MoA 60,04 (a "melhora de 3,8%" do abstract é em pontos).
- Regressão (Tabela 4; coeficientes normalizados, p < 0,001): qualidade α vs diversidade β — MMLU 2,558 vs 1,841 (R² 0,771); CRUX 4,548 vs 1,421 (R² 0,685); MATH 4,719 vs 2,839 (R² 0,760). Qualidade pesa mais que diversidade nos três.
- Quando misturar ajuda (Seção 4.2, Tabela 7): com modelos de qualidade similar e diversos, ganhos pequenos (+0,17 e +0,35 pp); em MMLU, Qwen+Llama misto (70,73) supera Self-MoA de Qwen (69,01), mas perde para Self-MoA de Llama (71,27).
- Self-MoA-Seq é "comparable to, or slightly better than" Self-MoA (Fig. 3, sem números no texto); não há configuração ótima universal de nº de amostras.

## Custo/compute considerado?
Parcial. O nº de propositores é fixo (6) nos dois braços e o nº de forward passes é igual (7 para MoA e Self-MoA de 2 camadas; 13 para MoA de 3 camadas; Tabelas 8 e 10) — compute aproximadamente pareado em chamadas, não em tokens. Sem custo em US$ ou latência.

## Ameaças à validade
- Agregador limitado pelo contexto (Gemma 2 obrigou a usar 4 amostras na Tabela 2).
- Modelos de 7–8B nas tarefas verificáveis; AlpacaEval é julgado por LLM.
- Pequenas inconsistências texto/tabela (ex.: "2–3 pontos" vs +1,8 em uma linha; R² ">0,9 com K=2" vs 0,881 na Tabela 5).
- arXiv tem só v1; a versão TMLR pode diferir — não aberta (OpenReview pediu verificação de navegador).

## Relevância para a pergunta central
Contradiz a leitura ingênua "diversidade de modelos é o que faz o swarm funcionar": **misturar modelos mais fracos dilui a qualidade média** e custa mais que o ganho de diversidade. Para Norevia, a regra prática candidata é: escalar primeiro amostras do melhor modelo disponível; só misturar modelos quando forem de qualidade comparável e com erros pouco correlacionados. Tensão com lit-stop-overvaluing-mad, que vê heterogeneidade como "antídoto" no debate — resolver experimentalmente.

## Hipóteses candidatas
- candidata: o desempenho de um ensemble ≈ f(qualidade média dos membros) + g(diversidade), com peso de qualidade 1,4–3,2× maior que o de diversidade.
- candidata: adicionar um membro mais fraco só vale a pena se reduzir a correlação de erros o bastante para compensar a queda da qualidade média.
- candidata: o ganho satura e não há nº de amostras ótimo universal — precisa de controle adaptativo por tarefa.

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2502.00674 (v1 única); https://arxiv.org/html/2502.00674v1 (tabelas e texto); https://jmlr.org/tmlr/papers/bib/K6WwK8URlV.bib (venue TMLR, ano 2026).
- Lacuna: página OpenReview (forum K6WwK8URlV) não abriu (verificação de navegador); versão TMLR final não conferida. Uma listagem neurips.cc 2024 com o mesmo título apareceu na busca e não foi verificada.
