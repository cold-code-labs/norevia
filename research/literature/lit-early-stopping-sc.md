---
id: lit-early-stopping-sc
title: 'Early-Stopping Self-Consistency (ESC) — parar quando uma janela de amostras concorda'
area: literature
evidence: relato-autores
tags: [self-consistency, early-stopping, custo, dificuldade]
sources:
  - "Li, Y., Yuan, P., Feng, S., Pan, B., Wang, X., Sun, B., Wang, H. & Li, K. (2024). Escape Sky-high Cost: Early-stopping Self-Consistency for Multi-step Reasoning. ICLR 2024. https://proceedings.iclr.cc/paper_files/paper/2024/hash/3fe2a777282299ecb4f9e7ebb531f0ab-Abstract-Conference.html"
  - "arXiv:2401.10480v1 (19 jan. 2024). https://arxiv.org/abs/2401.10480v1 · doi:10.48550/arXiv.2401.10480"
related: [lit-adaptive-consistency, lit-self-consistency]
updated: 2026-11-07
primary_opened: true
version: "v1 (19 jan. 2024), única versão"
summary: Parar a amostragem quando uma janela de 5–8 respostas é unânime cortou 67–80% das amostras em tarefas fáceis para GPT-4 sem mudar a acurácia, mas só 33,8% em MATH, onde o modelo é menos confiável.
---

## Pergunta
Self-consistency com tamanho fixo é caro; dá para cortar amostras sem mudar o resultado do voto?

## Método
Amostragem em janelas sequenciais de tamanho w; se todas as respostas de uma janela são iguais (entropia zero), para; senão continua até L e faz voto majoritário (Sec. 2.2, Alg. 1). L = 64, w = 8 em MATH; L = 40, w = 5 nos demais (Sec. 3.2). Modelos: GPT-4, GPT-3.5-Turbo, Llama-2 7b. Limite superior teórico para a probabilidade de o voto mudar (teste z de uma proporção; ≤2×10⁻³ para w = 8, Sec. 2.3). Esquema de controle (Sec. 2.4, Alg. 2): janela inicial w0 = 5 estima custo e erro esperados para pares (w, L), e o usuário escolhe pela meta de orçamento.

## Resultado relatado
- Tabela 1, GPT-4 (amostras médias vs L; acurácia SC vs ESC): MATH 42,40 de 64 (−33,8%), 60,32 = 60,32; GSM8K 7,98 de 40 (−80,1%), 89,29 = 89,29; CSQA 9,29 (−78,5%), 87,18 = 87,18; StrategyQA 7,19 (−76,8%), 81,67 → 81,70; Last Letters 6,32 (−67,4%), 95,00 → 94,98. Coin Flip −84,2% (abstract).
- GPT-3.5-Turbo em MATH: 52,37 amostras médias — economia menor.
- Concordância ESC×SC: 99,13–99,96% (Tabela 5).
- Controle: correlação de Pearson previsto×real de amostras = 1,00; de variação de desempenho 0,81–0,86 (Tabela 3, GSM8K).
- Sec. 3.2: "cost savings are positively correlated with performance".

## Custo/compute considerado?
Sim, em número de amostras de CoT (não em US$ nem tokens). Latência não analisada; janelas sequenciais aumentam a latência em relação a N amostras paralelas.

## Ameaças à validade
Critério de unanimidade exige respostas curtas comparáveis; economia depende de a tarefa ser fácil para o modelo; modelos e benchmarks de 2023–2024; não testa tarefas abertas; não compara com 1 agente de raciocínio longo.

## Relevância para a pergunta central
Mostra empiricamente o padrão que interessa à Norevia: **a economia de parar cedo é grande onde o agente já é competente e pequena onde não é** — exatamente as tarefas em que mais agentes poderiam ajudar. A regra de parada coletiva é barata e quase sem perda quando o modelo é bom.

## Hipóteses candidatas
- candidata: economia de early-stopping ∝ acurácia de base do agente; nas tarefas em que o agente erra muito, o controle elástico tende a gastar o orçamento máximo.
- candidata: uma janela unânime pequena (w≈5) é um sinal de "contrair o swarm" quase sem custo de qualidade em tarefas com resposta verificável curta.

## Verificação
Aberto em 2026-11-07: https://arxiv.org/abs/2401.10480 (metadados), https://arxiv.org/html/2401.10480v1 (texto e tabelas), proceedings ICLR 2024 (venue). Código (github.com/Yiwei98/ESC) não inspecionado.
