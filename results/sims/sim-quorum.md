---
id: sim-quorum
title: "Quórum: velocidade vs acurácia em decisão coletiva"
area: simulation
evidence: validacao-local
tags: [quorum, speed-accuracy, decisao-coletiva, erros-correlacionados, encerramento]
sources:
  - "Código: sims/sim-quorum.mjs (v1.2.0, seed 20261107)"
  - "Dados: results/sims/sim-quorum.json"
  - "Fenômeno de inspiração: escolha de ninho por quórum — fontes primárias nos cartões nat-quorum-nest-bees e nat-speed-accuracy-quorum (não reabertas por este agente)"
related: [sim-relatorio, H-08, H-20, nat-quorum-nest-bees, nat-speed-accuracy-quorum, nat-waggle-dance-recruitment, sim-voto-correlacionado, lit-correlated-errors]
updated: 2026-11-07
summary: "No modelo, quórum maior troca velocidade por acurácia (Q=1→50: 19%→96% de acerto, 1→58 passos), mas o ganho é convexo — quóruns pequenos são loteria de descoberta — e um viés de avaliação compartilhado derruba a acurácia de 96% para 66% mesmo com Q=50. 4/4 previsões pré-registradas não suportadas."
---

> **Escopo da evidência:** `validacao-local` = validação **dentro de um modelo simulado** de batedores abstratos. O modelo é inspirado na escolha de ninho por quórum, mas não é calibrado com dados biológicos nem testado com LLMs.

## Hipótese (pré-registrada antes da execução)
Registrada em `results/sims/PREREGISTRO.jsonl` (2026-11-07T22:38:55Z, v1.0.0, sha256 do código `eececc9f1dd60ebe…`).

**Histórico de emendas (todas registradas no PREREGISTRO.jsonl):**
- v1.0.0 → 1ª execução mostrou dinâmica **degenerada**: recrutamento forte demais travava a colônia no 1º sítio descoberto (Q=50 em ~17–20 passos). Mantido no JSON como regime `recrutamento-forte` (mesmas seeds).
- v1.1.0 (22:39:59Z, **pós-hoc**): novo regime principal `recrutamento-por-qualidade`, parâmetros escolhidos por princípio (só "dança" quem percebe qualidade > 0,6; recrutamento 0,15; descoberta 0,02; abandono 0,02+0,2·(1−q̂)), sem busca de parâmetros. Risco de ajuste ao resultado: declarado.
- v1.2.0 (22:40:19Z, **correção de bug**): o desempate na checagem de quórum favorecia o sítio 0 (o melhor) quando vários sítios atingiam Q no mesmo passo, inflando a acurácia em Q pequeno (Q=1: ~32% → 17–19% após a correção). Ambos os regimes reexecutados.
- Hipótese e critérios nunca foram alterados.

Exigir um quórum maior antes de decidir troca velocidade por acurácia com retornos decrescentes; quando a avaliação dos agentes compartilha um viés (erro correlacionado), aumentar o quórum não corrige o erro e a acurácia satura abaixo do caso independente.

- **P1** — Em todas as células, acurácia não decrescente em Q (tolerância 1 p.p.) e tempo médio até a decisão estritamente crescente em Q.
- **P2** — Retornos decrescentes: onde o ganho de Q=1 para Q=50 é > 5 p.p., ≥ 50% dele já vem com Q ≤ 10.
- **P3** — Com viés compartilhado (ρ=0,5), acurácia em Q=50 menor que com ρ=0 (IC95% disjuntos) e ganho de Q=20→50 < 2 p.p. (platô).
- **P4** — Δ=0,1 (discriminação difícil) tem acurácia menor que Δ=0,25 em todo Q, para cada (σ, ρ).

## Modelo
- 100 batedores; 3 sítios com qualidades [1; 1−Δ; 0,5]; o melhor é 3× mais difícil de descobrir ao acaso.
- Não comprometido: é recrutado ao sítio j com prob. r·D_j/100 (D_j = soma da "intensidade de dança" dos comprometidos com j) ou descobre um sítio sozinho. Avalia q̂ = q_j + σ(√ρ·B_j + √(1−ρ)·ε); compromete-se se q̂ > 0,5. Comprometido abandona com prob. a₀ + a₁·max(0, 1−q̂).
- Regime principal `recrutamento-por-qualidade` (v1.1+): descoberta 2%/passo, r=0,15, dança = max(0, q̂−0,6)/0,4, a₀=0,02, a₁=0,2. Regime `recrutamento-forte` (v1.0): descoberta 1%/passo, r=0,5, dança = q̂, a₀=0,01, a₁=0,1.
- Decisão = primeiro sítio a atingir Q comprometidos. B_j é viés compartilhado por sítio e execução (todos avaliam aquele sítio com o mesmo desvio).
- 2000 execuções por célula (σ ∈ {0,1; 0,3}, ρ ∈ {0; 0,5}, Δ ∈ {0,1; 0,25}); Q ∈ {1,…,50}. O quórum é "observado" (não altera a dinâmica), então todos os Q usam a mesma execução.

## Resultados (v1.2.0; gerados pelo script; conferidos por `sims/run-all.mjs`)
Manchetes:
- σ=0,3, ρ=0,0, Δ=0,10, Q=1: acurácia 17,0% [IC95% 15,4%–18,7%], tempo 1 [IC95% 1–1] passos
- σ=0,3, ρ=0,0, Δ=0,10, Q=10: acurácia 15,8% [IC95% 14,3%–17,5%], tempo 11 [IC95% 10–11] passos
- σ=0,3, ρ=0,0, Δ=0,10, Q=50: acurácia 42,4% [IC95% 40,2%–44,5%], tempo 55 [IC95% 54–56] passos
- σ=0,3, ρ=0,5, Δ=0,10, Q=10: acurácia 21,4% [IC95% 19,7%–23,3%], tempo 11 [IC95% 11–11] passos
- σ=0,3, ρ=0,5, Δ=0,10, Q=50: acurácia 47,8% [IC95% 45,6%–50,0%], tempo 62 [IC95% 55–68] passos
- σ=0,3, ρ=0,0, Δ=0,25, Q=1: acurácia 18,9% [IC95% 17,3%–20,7%], tempo 1 [IC95% 1–1] passos
- σ=0,3, ρ=0,0, Δ=0,25, Q=50: acurácia 95,9% [IC95% 94,9%–96,6%], tempo 58 [IC95% 57–59] passos
- Teto aproximado com viés compartilhado (σ=0,3, ρ=0,5, Δ=0,1): 63,1%
- Regime recrutamento-forte (v1.0.0), σ=0,3, ρ=0, Δ=0,25: Q=1 19,4% [IC95% 17,8%–21,2%]; Q=50 50,0% [IC95% 47,8%–52,2%] em 20 [IC95% 19–20] passos

**Regime principal (`recrutamento-por-qualidade`):**

| Previsão | Veredicto (no modelo) | Detalhe |
|---|---|---|
| P1 | **nao-suporta** | 11 violações: acc σ=0.1,ρ=0,Δ=0.1,Q=2; acc σ=0.1,ρ=0,Δ=0.1,Q=3; acc σ=0.1,ρ=0,Δ=0.25,Q=2; acc σ=0.1,ρ=0.5,Δ=0.1,Q=2; acc σ=0.1,ρ=0.5,Δ=0.1,Q=3; acc σ=0.1,ρ=0.5,Δ=0.25,Q=2; acc σ=0.3,ρ=0,Δ=0.1,Q=2; acc σ=0.3,ρ=0,Δ=0.1,Q=3 |
| P2 | **nao-suporta** | σ=0.1,ρ=0,Δ=0.1: ganho 45,3 p.p., fração até Q=10 -7%; σ=0.1,ρ=0,Δ=0.25: ganho 82,2 p.p., fração até Q=10 20%; σ=0.1,ρ=0.5,Δ=0.1: ganho 38,4 p.p., fração até Q=10 -7%; σ=0.1,ρ=0.5,Δ=0.25: ganho 79,4 p.p., fração até Q=10 23%; σ=0.3,ρ=0,Δ=0.1: ganho 25,4 p.p., fração até Q=10 -4%; σ=0.3,ρ=0,Δ=0.25: ganho 76,9 p.p., fração até Q=10 17%; σ=0.3,ρ=0.5,Δ=0.1: ganho 28,5 p.p., fração até Q=10 7%; σ=0.3,ρ=0.5,Δ=0.25: ganho 46,7 p.p., fração até Q=10 32% |
| P3 | **nao-suporta** | σ=0.1,Δ=0.1: Q=50 ρ=0 62,9% vs ρ=0,5 57,4%; ganho Q20→50 (ρ=0,5) 31,5 p.p.; σ=0.1,Δ=0.25: Q=50 ρ=0 100,0% vs ρ=0,5 96,7%; ganho Q20→50 (ρ=0,5) 25,6 p.p.; σ=0.3,Δ=0.1: Q=50 ρ=0 42,4% vs ρ=0,5 47,8%; ganho Q20→50 (ρ=0,5) 16,8 p.p.; σ=0.3,Δ=0.25: Q=50 ρ=0 95,9% vs ρ=0,5 66,4%; ganho Q20→50 (ρ=0,5) 16,4 p.p. |
| P4 | **nao-suporta** | exceções: σ=0.1,ρ=0.5,Q=1; σ=0.3,ρ=0,Q=2 |

**Regime `recrutamento-forte` (v1.0.0, degenerado):**

| Previsão | Veredicto |
|---|---|
| P1 | **nao-suporta** |
| P2 | **nao-suporta** |
| P3 | **nao-suporta** |
| P4 | **nao-suporta** |

Acurácia / tempo médio até a decisão (passos), regime principal, 2000 execuções por célula (IC95% de Wilson ≈ ±2 p.p.; completos no JSON):

| Célula | Q=1 | Q=3 | Q=5 | Q=10 | Q=20 | Q=30 | Q=50 | teto aprox. (viés) |
|---|---|---|---|---|---|---|---|---|
| σ=0.1, ρ=0, Δ=0.1 | 17,6% / 1 | 12,4% / 3 | 12,3% / 6 | 14,5% / 10 | 20,1% / 17 | 28,0% / 24 | 62,9% / 58 | 100,0% |
| σ=0.1, ρ=0, Δ=0.25 | 17,8% / 1 | 14,4% / 4 | 18,1% / 6 | 34,0% / 13 | 77,3% / 24 | 96,8% / 33 | 100,0% / 45 | 100,0% |
| σ=0.1, ρ=0.5, Δ=0.1 | 18,9% / 1 | 11,9% / 3 | 11,9% / 5 | 16,3% / 10 | 25,9% / 18 | 36,4% / 25 | 57,4% / 51 | 84,1% |
| σ=0.1, ρ=0.5, Δ=0.25 | 17,3% / 1 | 13,7% / 4 | 17,4% / 6 | 35,2% / 13 | 71,0% / 25 | 86,5% / 34 | 96,7% / 57 | 99,4% |
| σ=0.3, ρ=0, Δ=0.1 | 17,0% / 1 | 13,5% / 4 | 12,8% / 6 | 15,8% / 11 | 20,3% / 18 | 24,9% / 24 | 42,4% / 55 | 100,0% |
| σ=0.3, ρ=0, Δ=0.25 | 18,9% / 1 | 15,9% / 4 | 18,6% / 7 | 31,9% / 13 | 55,2% / 23 | 71,1% / 32 | 95,9% / 58 | 100,0% |
| σ=0.3, ρ=0.5, Δ=0.1 | 19,3% / 1 | 14,3% / 3 | 14,6% / 6 | 21,4% / 11 | 31,1% / 20 | 37,5% / 28 | 47,8% / 62 | 63,1% |
| σ=0.3, ρ=0.5, Δ=0.25 | 19,7% / 1 | 17,5% / 4 | 21,0% / 7 | 34,5% / 13 | 50,0% / 27 | 57,1% / 39 | 66,4% / 78 | 79,8% |

Curvas para gráficos: `results.regimes[regime][i].accuracy[k]` e `time_to_decision[k]` para cada Q em `results.Qs` (fronteira velocidade–acurácia).

## Interpretação
- **O trade-off velocidade–acurácia existe em escala grande** (Q=1→50: de ~18% para até 96–100% de acerto, de 1 para 45–78 passos), mas **nenhuma das quatro previsões detalhadas foi suportada**:
  - P1/P4 falham em Q ≤ 3: quóruns minúsculos são decididos pela **loteria da descoberta** (o sítio mediano, 3× mais fácil de achar, chega primeiro a 2–3 comprometidos). A acurácia cai de Q=1 para Q=2–3 antes de subir.
  - P2 falha no sentido oposto ao previsto: o ganho é **convexo** (a maior parte vem de Q ≥ 20), não côncavo. Só depois de a colônia amostrar vários sítios o recrutamento dependente de qualidade separa o melhor.
  - P3 falha no critério de platô: com Q ≤ 50 a curva ainda sobe. O viés compartilhado reduz a acurácia onde a discriminação é fácil (σ=0,3, Δ=0,25: 95,9% → 66,4%), mas com Δ pequeno e σ alto ficou ligeiramente maior (42,4% → 47,8%), ainda abaixo do teto aproximado de 63%.
- O regime `recrutamento-forte` mostra o modo de falha mais relevante para swarms de LLM: **realimentação positiva forte demais = manada** — decide rápido (≈ 20 passos) e erra (≤ 50% mesmo com Q=50).
- A conclusão depende fortemente dos parâmetros de recrutamento; tratamos o resultado como **inconclusivo** para a hipótese geral.

## Limitações
- Quórum "observado" (não muda o comportamento, diferente das abelhas, que mudam de modo ao atingir quórum). Sem distância/tempo de viagem explícitos. Parâmetros não calibrados com dados biológicos.
- O regime principal foi definido após ver a 1ª execução (pós-hoc).
- **O que precisa de validação com LLM real:** se "encerrar quando Q agentes independentes concordam" tem curva convexa ou côncava em tarefas reais; se agentes LLM que leem respostas uns dos outros entram em regime de manada (recrutamento forte); efeito de viés compartilhado (mesmo modelo-base) sobre o quórum.
