---
id: nat-lagrange-points
title: Pontos de Lagrange — estabilidade condicionada pela razão de massas (analogia)
area: nature
evidence: fenomeno-natural
tags: [celeste-analogia, contratos, fronteiras, station-keeping, assimetria]
sources:
  - "Sicardy, B. (2010). Stability of the triangular Lagrange points beyond Gascheau's value. Celest. Mech. Dyn. Astron. 107:145–155. doi:10.1007/s10569-010-9259-5"
  - "NASA — Basics of Space Flight, Chapter 5: Planetary Orbits (citada no estudo anterior, seção 17; não reaberta)"
  - "Cálculo local: research/nature/calc/teoria-coletiva.js (seção Gascheau/Routh)"
related: [nat-orbital-resonance, nat-candidatas]
updated: 2026-11-07
verificacao: "Texto de Sicardy 2010 extraído localmente de PDF (página pessoal do autor no LESIA/Obs. Paris); fórmula de Gascheau conferida e valor recalculado localmente. Valor de μ∞ (fim da cascata) não extraído (lacuna)."
summary: L4/L5 são linearmente estáveis só se a massa secundária for menor que ~3,85% do total (valor de Gascheau/Routh); L1–L3 são instáveis e exigem correções contínuas — estabilidade de fronteira depende de assimetria e manutenção.
---

## Mecanismo
- No problema restrito de três corpos, **L1, L2, L3 são instáveis**; missões próximas exigem correções de trajetória (*station keeping*). **L4/L5** podem ser estáveis sob condições apropriadas (estudo anterior, seção 17).
- **Condição (Sicardy 2010, texto):** o valor de Gascheau é a menor solução de **27μ(1 − μ) = 1**, isto é, **μ_G = (1 − √(23/27))/2**. Recalculado localmente: **μ_G ≈ 0,038521** (calc/saida-teoria-coletiva.txt). Abaixo dele, L4/L5 são linearmente estáveis; acima, linearmente instáveis. Sicardy mostra que, além de μ_G, ainda existem órbitas periódicas estáveis em torno de L4/L5 numa **cascata de Feigenbaum** de duplicações de período que termina em caos num valor limite μ∞ (valor numérico não extraído do PDF → `lacuna`).
- Nenhum ponto de Lagrange é um lugar onde as forças "desaparecem"; é um equilíbrio no referencial em rotação.

## Evidência
`fenomeno-natural` (mecânica celeste); transposição **estritamente analógica**.

## Análogo de engenharia
Uma interface entre dois especialistas (handoff/contrato) é um "ponto de equilíbrio" que: (i) se entre pares simétricos e poderosos, tende a ser **instável** e exige correções regulares (revisão do contrato, testes de fronteira); (ii) é mais estável quando há **assimetria clara** (um dono dominante do resultado, outro contribuidor). Lição operacional: contratos de handoff precisam de station keeping explícito, com custo orçado.

## Hipótese testável
- **Variável:** estrutura de propriedade numa tarefa com 2 agentes — (A) coautoria simétrica (ambos podem alterar a especificação); (B) dono único + contribuidor com contrato fixo; (C) B + revalidação periódica do contrato (station keeping).
- **Métrica:** divergências de versão/especificação no handoff; retrabalho; aceite.
- **Previsão:** A tem ≥ 2× mais divergências que B; C reduz divergências residuais de B ≥ 50% com custo de revalidação ≤ 10% do total.
- **Refutação:** se A não divergir mais que B, a assimetria não importa — e a analogia é só decorativa.

## Limites da transferência
O limiar μ_G é exato para um modelo matemático específico; não existe "razão de massas" de agentes. Uso apenas para lembrar que equilíbrios de fronteira podem ser intrinsecamente instáveis e precisar de manutenção ativa.
