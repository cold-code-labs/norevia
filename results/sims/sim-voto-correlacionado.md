---
id: sim-voto-correlacionado
title: "Voto correlacionado: 1 agente de esforço alto vs N agentes de esforço baixo"
area: simulation
evidence: validacao-local
tags: [voto-majoritario, erros-correlacionados, reasoning-effort, diagrama-de-fases, custo-por-acerto]
sources:
  - "Código: sims/sim-voto-correlacionado.mjs (v1.2.0, seed 20261107)"
  - "Dados: results/sims/sim-voto-correlacionado.json"
related: [sim-relatorio, H-01, H-09, H-10, H-15, H-17, nat-condorcet-correlated, nat-condorcet-jury, lit-correlated-errors, lit-scaling-agent-systems, lit-self-consistency, lit-more-agents]
updated: 2026-11-07
summary: "No modelo, uma correlação latente de apenas 0,1 entre erros já impede que até 64 agentes de esforço baixo (p=0,6) alcancem 1 agente de esforço alto (p=0,8, custo 4); o voto só vence com erros quase independentes e N ≥ 19."
---

> **Escopo da evidência:** `validacao-local` significa validação **dentro de um modelo simulado** de agentes abstratos. Não é medição com LLMs reais.

## Hipótese (pré-registrada antes da execução)
Registrada em `results/sims/PREREGISTRO.jsonl` (2026-11-07T22:30:55Z, v1.0.0, sha256 do código `db92960b8b0fdce8…`). Emenda v1.1.0 (22:31:30Z), após a 1ª execução: acrescentados ρ = 0,025/0,05/0,075 para refinar a fronteira — hipótese e critérios inalterados; os veredictos foram os mesmos nas duas versões. Emenda v1.2.0 (22:41:36Z): análise de sensibilidade pedida pela coordenação (abaixo); não altera P1–P4 nem seus números (mesmas seeds).

Erros correlacionados impõem um teto à acurácia do voto majoritário; acima de uma correlação crítica, 1 agente de esforço alto vence qualquer N de agentes de esforço baixo em acurácia, e o custo para atingir um alvo de acurácia favorece o agente único quando o retorno ao esforço não é muito decrescente.

- **P1** — Com p_L=0,6 e p_H=0,8 (k=4, β=0,5), o teto teórico do voto é Φ(z_L/√ρ); a correlação crítica prevista é ρ_c=(z_L/z_H)² ≈ 0,091. Para todo ρ ≥ 0,1 o agente único tem acurácia maior que o voto para **todo** N em 1..64 (IC95% pareado exclui 0).
- **P2** — Com ρ=0 existe N ≤ 25 em que o voto supera p_H=0,8 (IC95% pareado exclui 0).
- **P3** — A orçamento igual (N=k agentes baixos vs 1 agente com esforço k), a região em que o voto vence encolhe quando ρ cresce e quando β cresce; com β=1 o agente único vence para todo k ≥ 3 e todo ρ.
- **P4** — Custo mínimo para atingir alvos 0,7/0,8/0,9: com β ≥ 0,5 o agente único é mais barato para todo ρ; com β=0,25 o voto só é mais barato para alvos ≥ 0,9 e ρ ≤ 0,1.

## Modelo
- Tarefa binária com resposta correta única. Fator latente da tarefa S ~ N(0,1) compartilhado por todos os agentes; agente i acerta se √ρ·S + √(1−ρ)·ε_i < Φ⁻¹(p). Marginal = p; ρ é correlação **latente** (o JSON também traz a correlação φ observável entre erros).
- Esforço e → p(e) = 1 − 0,4·e^(−β) (p(1)=0,6; com β=0,5, p(4)=0,8). β ∈ {0,25; 0,5; 1} = retorno ao esforço.
- Custo = soma dos esforços (agente baixo = 1, agente alto = k). Sem custo de agregação/comunicação (favorece o voto).
- Voto majoritário; empates por moeda. Resposta binária = pior caso para o voto (todos os erros coincidem).
- 20 000 tarefas por ρ, números aleatórios comuns entre N, k e β (comparações pareadas). Validação cruzada contra integração numérica exata sobre S.

## Resultados (números gerados pelo script; conferidos por `sims/run-all.mjs`)
Manchetes:
- Teto teórico do voto (N→∞) com p_L=0,6: 67,8% em rho=0,3 e 62,8% em rho=0,6; rho crítico vs p_H=0,8: 0,091
- Voto N=64: 94,5% [IC95% 94,1%–94,8%] (rho=0); 67,5% [IC95% 66,9%–68,2%] (rho=0,3); 62,2% [IC95% 61,5%–62,9%] (rho=0,6)
- Agente único (k=4, p=0,8) em rho=0,3: 80,2% [IC95% 79,6%–80,7%]
- Com rho=0 o voto supera o agente único (k=4) a partir de N=19
- Validação MC×analítico: 98,4% das 768 células com valor analítico dentro do IC95%; erro máx. 0,84 p.p.
- Sensibilidade (K=4, concordância de erros ~0,6): voto N=5 supera 1 agente de mesma p a partir de p=0,40 (rho=0), 0,35 (rho=0,4), 0,30 (rho=0,7)
- Sensibilidade a orçamento igual (N=5 vs 1 agente com esforço 5, beta=0,5): faixas de p em que o voto vence — K=2 rho=0: [0,80 0,90]; K=4 rho=0: [0,70 0,80 0,90]; K=4 rho=0,4: [0,90]

Acurácia do voto (MC, 20 000 tarefas/célula; IC95% ≈ ±0,7 p.p.) e agente único de referência (k=4):

| ρ latente | φ entre erros | N=1 | N=10 | N=64 | teto N→∞ | único k=4 |
|---|---|---|---|---|---|---|
| 0 | 0,00 | 59,6% | 73,5% | 94,5% | 100% | 79,9% |
| 0,05 | 0,03 | 59,8% | 71,1% | 82,1% | 87,1% | 80,2% |
| 0,1 | 0,06 | 60,6% | 69,5% | 76,8% | 78,9% | 79,8% |
| 0,3 | 0,18 | 59,8% | 65,7% | 67,5% | 67,8% | 80,2% |
| 0,6 | 0,41 | 60,2% | 61,8% | 62,2% | 62,8% | 79,4% |

**Diagrama de fases (acurácia, voto de N vs único k=4)** — `results.phase.accuracy_vs_ref`: o voto vence (IC pareado) apenas em ρ=0 com N ≥ 19, ρ=0,025 com N ≥ 25 e ρ=0,05 com N ≥ 49; para ρ ≥ 0,075 o único vence em todo N=1..64. Mesmo onde o voto vence em acurácia, custa ≥ 19 unidades contra 4.

**Orçamento igual (N=k vs esforço k)** — `results.phase.equal_budget`: com β=0,25 o voto vence em 44 valores de k (ρ=0) e 24 (ρ=0,025); em todos os demais (ρ ≥ 0,05, ou β ≥ 0,5) o único vence ou empata para todo k ≥ 2.

**Custo mínimo para alvo** — `results.phase.target_cost`: para alvo 0,8, o voto precisa de N=17 (ρ=0), 23 (ρ=0,025), 37 (ρ=0,05) e não alcança com N ≤ 64 para ρ ≥ 0,075; o único precisa de esforço 4 (β=0,5). O voto só é mais barato em alvo 0,9 com β=0,25 e ρ=0 (N=41 vs esforço 256).

| Previsão | Veredicto (no modelo) | Resumo |
|---|---|---|
| P1 | **suporta** | único vence ∀N≤64 para ρ ≥ 0,1 |
| P2 | **suporta** | com ρ=0, voto supera 0,8 a partir de N=19 |
| P3 | **suporta** | região do voto encolhe com ρ e β; β=1 → único sempre (k≥3) |
| P4 | **suporta** | custo para alvo favorece o único, exceto β=0,25, alvo 0,9, ρ=0 |

Curvas para gráficos no JSON: `results.curves.acc_vote[ρ][N]` (+ `_lo`, `_hi`, `_analytic`), `cost_per_correct_vote`, `single_ref`, `vote_ceiling_analytic`, `error_phi_correlation`.

## Análise de sensibilidade (v1.2.0, exploratória — pedido da coordenação)
Calibração tomada da literatura (relato dos autores, não validado aqui): concordância de ~0,6 entre dois LLMs que erram, vs 1/3 ao acaso (`lit-correlated-errors`); limiar de ~45% de acerto do agente único acima do qual a coordenação multiagente deixa de compensar (`lit-scaling-agent-systems`, Kim et al., arXiv:2512.08296v3). Expectativa declarada antes de rodar: ver `SENSITIVITY.expectation` no código.

Desenho: p ∈ {0,2…0,9}, ρ ∈ {0; 0,2; 0,4; 0,55; 0,7}, K=2 (binário) ou K=4 (quando erra, escolhe a resposta-atratora com prob. 0,63 → concordância entre errados ≈ 0,6), N ∈ {3,5,9}, 20 000 tarefas por célula. "Mesma p" = voto de N vs 1 agente igual; "orçamento igual" = voto de N vs 1 agente com esforço N (β=0,5). Critério: ganho com IC95% pareado > 0.

| K | ρ | menor p em que o voto vence 1 agente de mesma p (N=3/5/9) | faixa de p em que o voto vence a orçamento igual (N=3/5/9) |
|---|---|---|---|
| 2 | 0 | 0,55 / 0,55 / 0,55 | [0,80 0,90] / [0,80 0,90] / [0,80 0,90] |
| 2 | 0,2 | 0,55 / 0,55 / 0,55 | [0,90] / [0,90] / [0,90] |
| 2 | 0,4 | 0,55 / 0,55 / 0,55 | — / [0,90] / — |
| 2 | 0,55 | 0,55 / 0,55 / 0,55 | — / — / — |
| 2 | 0,7 | 0,55 / 0,50 / 0,50 | — / — / — |
| 4 | 0 | 0,40 / 0,40 / 0,40 | [0,80 0,90] / [0,70 0,80 0,90] / [0,70 0,80 0,90] |
| 4 | 0,2 | 0,40 / 0,40 / 0,40 | [0,90] / [0,80 0,90] / [0,80 0,90] |
| 4 | 0,4 | 0,35 / 0,35 / 0,35 | [0,90] / [0,90] / [0,90] |
| 4 | 0,55 | 0,35 / 0,30 / 0,35 | — / — / — |
| 4 | 0,7 | 0,30 / 0,30 / 0,30 | — / — / — |

Leitura:
- **Mesma p:** o voto só ajuda **acima** de um limiar de p (0,55 no binário; 0,30–0,40 com K=4 e erros atraídos). O ganho do voto cresce até p≈0,6–0,8 e cai perto de p→1 (efeito de teto). Isso é coerente com retornos decrescentes em p alto, mas o mecanismo no modelo é só o teto.
- **Orçamento igual:** o modelo prevê o **oposto** do limiar relatado por Kim et al.: o voto só vence 1 agente de esforço equivalente com p **alto** (≥ 0,7) e ρ baixo, e nunca vence com ρ ≥ 0,55 — o regime que a literatura indica como realista. Abaixo de ~0,45 o agente único sempre vence aqui, por larga margem.
- **Divergência com a literatura:** o limiar de Kim et al. vem de sistemas agênticos com overhead de coordenação, amplificação de erro e tarefas sequenciais — mecanismos ausentes deste modelo de voto. A comparação não valida nem refuta aquele relato; indica que o efeito de ~45% **não decorre só de agregação com erros correlacionados** e deve ser buscado em custo de coordenação / propagação de erro (candidato a teste no Observatory). O resultado também depende da curva de esforço suposta.
- Dados: `results.sensitivity.cells[]` (ganhos, IC, limiares) para marcar no diagrama de fases a linha p=0,45 de referência.

## Interpretação
- O resultado central é analítico (teto Φ(z_L/√ρ)) e a simulação o confirma: o MC coincide com a integração numérica (98,4% de cobertura dos IC95%).
- Correlações **pequenas** de erro já mudam a decisão: φ ≈ 0,03 entre erros (ρ latente 0,05) desloca o ponto de virada de N=19 para N=49. Medir a correlação de erros entre amostras de um LLM é, portanto, pré-requisito para qualquer política de "mais agentes".
- O veredicto de orçamento igual depende fortemente da curva de retorno ao esforço p(e). Com β ≥ 0,5 o agente único domina; só com retorno fortemente decrescente (β=0,25) e erros quase independentes o voto compensa.

## Limitações
- Resposta binária (pior caso para o voto). Com espaço de respostas grande e erros dispersos, pluralidade é mais forte — não modelado.
- Curva p(e) é suposição, não medida. O agente de esforço alto compartilha o mesmo fator latente da tarefa (mesmo ρ).
- Sem custo de agregação, comunicação ou latência; sem heterogeneidade entre agentes (diversidade de modelos).
- **O que precisa de validação com LLM real:** (i) correlação de erros entre amostras/agentes por tipo de tarefa; (ii) curva acurácia × reasoning effort (β efetivo); (iii) se o teto de voto observado bate com Φ(z_L/√ρ) estimado.
