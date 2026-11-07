---
id: lit-s1-budget-forcing
title: 's1: Simple test-time scaling — budget forcing do raciocínio sequencial'
area: literature
evidence: relato-autores
tags: [reasoning-effort, test-time-compute, budget-forcing, sequencial-vs-paralelo]
sources:
  - "Muennighoff, N., Yang, Z., Shi, W., Li, X. L., Fei-Fei, L., Hajishirzi, H., Zettlemoyer, L., Liang, P., Candès, E. & Hashimoto, T. (2025). s1: Simple test-time scaling. Proceedings of EMNLP 2025, pp. 20275–20321. doi:10.18653/v1/2025.emnlp-main.1025. https://aclanthology.org/2025.emnlp-main.1025"
  - "Preprint: arXiv:2501.19393v3 (1 mar. 2025). https://arxiv.org/abs/2501.19393v3"
related: [lit-overthinking, lit-nothinking, lit-inverse-scaling-ttc]
updated: 2026-11-07
primary_opened: true
version: "arXiv v3 (1 mar. 2025); v1 31 jan. 2025; versão EMNLP não aberta em PDF"
summary: Forçar o modelo a pensar mais (anexando "Wait") elevou AIME24 de 50% para 57% em um modelo de 32B, mas o ganho achata após ~6 extensões e pode entrar em loop.
---

## Pergunta
Qual é a receita mínima para obter escalonamento de test-time compute (mais pensamento → mais acurácia) e controlar o orçamento de raciocínio?

## Método
SFT de Qwen2.5-32B-Instruct em s1K (1.000 perguntas com traços de raciocínio, escolhidas por dificuldade, diversidade e qualidade): "26 minutes on 16 NVIDIA H100 GPUs" (Sec. 4.1). **Budget forcing**: para encurtar, força o delimitador de fim de pensamento; para alongar, suprime o fim e anexa "Wait". Métricas (Sec. 3.2): Control (fração de execuções dentro do orçamento), Scaling (inclinação média acurácia×tokens), Performance (máximo). Comparação sequencial (budget forcing) vs paralelo (voto majoritário com 2–64 amostras do modelo base).

## Resultado relatado
- Tabela 1 (AIME24 / MATH500 / GPQA Diamond): s1-32B com BF 56,7 / 93,0 / 59,6; sem BF 50,0 / 92,6 / 56,6.
- Abstract: extrapolação com BF eleva AIME24 "from 50% to 57%". Tabela 4: anexar "Wait" ignorando o fim 2× dá 53,3 vs 50,0.
- Tabela 3 (AIME24): BF Control 100%, Scaling 15, Performance 56,7; token-conditional 40%/−24/40,0; step-conditional 60%/3/36,7; rejection sampling 100%/−35/40,0.
- Fig. 4: escalonamento sequencial "does eventually flatten out at six times"; voto majoritário paralelo do modelo base "cannot catch up" com s1-32B (Sec. 4.2). Fig. 7: REBASE (busca com PRM, 16 trajetórias) escala melhor que voto majoritário e, nesse cenário, melhor que o sequencial; no sequencial a 512 passos, 12 de 30 questões excederam a janela de contexto.

## Custo/compute considerado?
Sim, em tokens de pensamento (eixo x das curvas). Custo de treino relatado (7 GPU-h H100). Não há custo monetário de inferência nem latência.

## Ameaças à validade
AIME24 tem só 30 questões (cada questão = 3,3 pontos); comparação paralelo vs sequencial usa modelos diferentes (base para voto vs s1 para BF); um único modelo/família; limite de contexto e loops repetitivos ao suprimir o fim "too often" (Sec. 6.2).

## Relevância para a pergunta central
Demonstra que **reasoning effort é um botão controlável e contínuo** (Control 100%) e que tem retornos decrescentes com teto. Também traz um dado raro de comparação sequencial (1 agente pensando mais) vs paralelo (N amostras votando) — com resultado dependente do método de agregação: voto simples perdeu; busca com verificador de processo ganhou. A conclusão útil não é "sequencial vence", e sim "depende do agregador e do teto de contexto".

## Hipóteses candidatas
- candidata: o ganho de mais tokens de raciocínio individual satura (≈6 extensões no s1); depois do ponto de saturação, recursos adicionais rendem mais em amostras paralelas com verificador do que em mais pensamento sequencial.
- candidata: o ponto de cruzamento sequencial↔paralelo depende da qualidade do agregador (voto < PRM/verificador), não só do orçamento.

## Verificação
Aberto em 2026-11-07: https://arxiv.org/abs/2501.19393 (metadados), https://arxiv.org/html/2501.19393v3 (texto até ~100 mil caracteres; apêndices finais não lidos), https://aclanthology.org/2025.emnlp-main.1025 (venue/DOI). Lacuna: o número exato de "Wait" do ponto 57% não está explícito no texto lido.
