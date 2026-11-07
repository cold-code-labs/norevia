---
id: H-08
title: "Quórum troca velocidade por acurácia, com teto imposto pela correlação"
area: hypothesis
evidence: hipotese
status: em-teste
origin: "natureza (nat-candidatas C03; nat-quorum-nest-bees, nat-speed-accuracy-quorum; quórum em Temnothorax/Leptothorax e abelhas) + teoria (th-modelo §7.3)"
experiment: "sims/sim-quorum (proposta) + observatory com parada por quórum Q ∈ {1,2,3,5}"
tags: [quorum, speed-accuracy, parada-otima]
sources:
  - "Pratt, S. C. et al. (2002). Quorum sensing, recruitment, and collective decision-making during colony emigration by the ant Leptothorax albipennis. Behav. Ecol. Sociobiol. 52(2):117–127. doi:10.1007/s00265-002-0487-x"
  - "Franks, N. R. et al. (2003). Speed versus accuracy in collective decision making. Proc. R. Soc. B 270(1532):2457–2463. doi:10.1098/rspb.2003.2527"
  - "Passino, K. M. & Seeley, T. D. (2006). Modeling and analysis of nest-site selection by honeybee swarms: the speed and accuracy trade-off. Behav. Ecol. Sociobiol. 59(3):427–442. doi:10.1007/s00265-005-0067-y"
  - "Seeley, T. D. & Visscher, P. K. (2004). Quorum sensing during nest-site selection by honeybee swarms. Behav. Ecol. Sociobiol. 56(6):594–601. doi:10.1007/s00265-004-0814-5"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-candidatas, nat-quorum-nest-bees, nat-speed-accuracy-quorum, nat-stop-signal-cross-inhibition, sim-quorum, H-27, H-01, H-12, lit-adaptive-consistency]
updated: 2026-11-07
summary: "Decidir quando Q agentes concordam funciona como em formigas e abelhas: Q maior é mais lento e mais certo, mas com erros correlacionados aumentar Q para de ajudar cedo."
---

# H-08 — Quórum troca velocidade por acurácia, com teto imposto pela correlação

**Status:** `em-teste` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-candidatas C03; nat-quorum-nest-bees, nat-speed-accuracy-quorum; quórum em Temnothorax/Leptothorax e abelhas) + teoria (th-modelo §7.3)

## Enunciado
Na regra "decide a primeira resposta com Q votos", acurácia e nº esperado de votos crescem com Q; sob correlação ρ, a acurácia satura no teto do voto (H-01) e o Q ótimo (com custo de tempo) é pequeno.

## Variáveis
Q, p, ρ, custo por voto, custo de latência.

## Previsão (quantitativa/direcional)
- p = 0,65: Q = 1/3/5/12 → acurácia 0,65/0,76/0,83/0,93 com 1/4,0/7,1/18,2 votos (ρ = 0).
- Com ρ = 0,2: Q = 12 → 0,74 (vs 0,93) com 16,6 votos — ganho de Q = 5 → 12 < 2 p.p.
- Com custo de tempo, Q* ∈ {2, 3, 4} para p ∈ [0,6; 0,8] e ρ ≥ 0,1.
- Como as formigas que baixam o quórum sob urgência (`nat-speed-accuracy-quorum`), Q* deve cair quando a razão custo-do-erro/custo-do-tempo cai.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Acurácia não crescente em Q, ou acurácia com Q alto acima do teto previsto pelo ρ medido.

## Experimento proposto
Simulação da corrida até Q (com recrutamento opcional, como em Pratt et al.); observatório com parada por quórum sobre amostras de A-low.

## Evidência atual
Modelo da corrida (fórmula exata conferida por Monte Carlo). Simulação `sim-quorum` (validacao-local num modelo **diferente**, de descoberta + recrutamento, com emendas pós-hoc declaradas pelo agente de simulação): o trade-off velocidade–acurácia aparece em escala grande (Q = 1 → 50: ~18% → 96–100%), mas 4/4 previsões detalhadas não foram suportadas — com descoberta sequencial, quóruns minúsculos são "loteria de descoberta" (acurácia não monotônica em Q ≤ 3) e o ganho é convexo, não côncavo; o viés compartilhado reduz a acurácia (95,9% → 66,4% numa célula), mas sem o platô previsto até Q = 50. Leitura: as previsões desta hipótese valem para a corrida entre candidatos **já amostrados** (votos de amostras independentes), não para busca com descoberta; o escopo foi restrito e o status passa a `em-teste`, sem refutação no escopo da corrida. O compromisso velocidade–acurácia é relatado em colônias (Franks et al. 2003; Passino & Seeley 2006) — fenômeno natural, não prova em LLMs.

## Limites
A corrida não modela descoberta sequencial, recrutamento positivo, qualidade contínua de opções nem desistência — exatamente o que sim-quorum mostra que muda a forma da curva.
