---
id: lit-adaptive-computation-time
title: 'Adaptive Computation Time (ACT) — parada aprendida com custo de ponderação'
area: literature
evidence: relato-autores
tags: [adaptive-computation, halting, custo, precursor-conceitual]
sources:
  - "Graves, A. (2016). Adaptive Computation Time for Recurrent Neural Networks. arXiv:1603.08983v6 (21 fev. 2017). https://arxiv.org/abs/1603.08983v6 · doi:10.48550/arXiv.1603.08983"
related: [lit-adaptive-consistency, lit-early-stopping-sc, lit-s1-budget-forcing]
updated: 2026-11-07
primary_opened: true
version: "v6 (21 fev. 2017); v1 29 mar. 2016; sem venue declarado no arXiv"
summary: 'Precursor formal de "quanto computar": uma rede aprende quando parar, pagando um custo por passo τ, mas o comportamento é muito sensível ao τ escolhido à mão.'
---

## Pergunta
Uma rede recorrente pode aprender, por entrada, quantos passos de computação fazer antes de emitir a saída?

## Método
Unidade de parada sigmoide por passo; a computação para quando a soma das probabilidades de parada atinge 1−ε (ε = 0,01), com teto M (100; 20 em adição) (Sec. 2, Eqs. 5–13). "Ponder cost" ρ = N(t) + R(t); perda L̂ = L + τ·P (Eq. 12). τ escolhido por grid search (i×10⁻ʲ). Tarefas sintéticas (paridade, lógica, adição, ordenação) e modelagem de caracteres (Wikipedia/Hutter Prize).

## Resultado relatado
- Paridade (Sec. 3.1): sem ACT, erro "almost 40%"; com τ ≤ 0,03, erro médio < 5%; ponderação cresce ~linear com a dificuldade (Fig. 6).
- Adição: resolvida perfeitamente para todos os τ do grid (Sec. 3.3).
- Ordenação (Sec. 3.4): erro ~12% → ~6%, mas com ~9× mais computação.
- Wikipedia (Sec. 3.5): erro "fairly similar with and without ACT"; a rede pondera mais em fronteiras (espaços, pontuação) (Fig. 23). Valores de BPC só em figuras — não conferidos.
- Limitação central: "quite sensitive to the time penalty parameter", que "has to be hand-chosen" (Sec. 1 e Conclusão).

## Custo/compute considerado?
Sim, explicitamente na função objetivo (τ·ponder). É custo em passos de rede, não em tokens/US$.

## Ameaças à validade
Tarefas sintéticas pequenas; RNNs de 2016, não LLMs; ganho real em dados naturais pequeno; ponder cost descontínuo (gradiente aproximado). Analogia, não evidência para swarms LLM.

## Relevância para a pergunta central
Estabelece o **formalismo** que a Norevia procura em escala de sistema: utilidade = qualidade − λ·compute, com parada aprendida por instância. Também antecipa o problema prático: o preço do compute (τ) define o comportamento e não se descobre sozinho. Qualquer "lei" de alocação Norevia herda essa questão (quem fixa λ?).

## Hipóteses candidatas
- candidata: um controlador de esforço Norevia é um ACT em nível de sistema — "passos" = rodadas/agentes; sem calibração de λ por custo real, ele oscila entre gastar demais e parar cedo.
- candidata: o esforço ótimo se concentra em "fronteiras" (pontos de decisão difíceis da tarefa), não uniformemente — análogo a ponderar mais em limites de palavra.

## Verificação
Aberto em 2026-11-07: https://arxiv.org/abs/1603.08983 (metadados), https://ar5iv.labs.arxiv.org/html/1603.08983 (texto). PDF bruto não lido como texto. Lacuna: valores BPC da Wikipedia (só em figura).
