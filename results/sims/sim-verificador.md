---
id: sim-verificador
title: "Best-of-N com verificador imperfeito vs voto vs agente único"
area: simulation
evidence: validacao-local
tags: [verificacao, best-of-n, falso-sucesso, aceite-verificavel, erros-correlacionados]
sources:
  - "Código: sims/sim-verificador.mjs (v1.0.0, seed 20261107)"
  - "Dados: results/sims/sim-verificador.json"
related: [sim-relatorio, H-02, H-13, H-18, sim-voto-correlacionado, sim-elastico, lit-large-language-monkeys, lit-correlated-errors]
updated: 2026-11-07
summary: "No modelo, um verificador com sens=spec=0,95 derruba o falso sucesso de 35% (voto, N=9, ρ=0,3) para 5%, a ~1/5 do custo por acerto; mas o falso sucesso cresce com N, e um verificador fraco (spec=0,5) é pior que o voto quando os erros são independentes."
---

> **Escopo da evidência:** `validacao-local` = validação **dentro de um modelo simulado** de agentes abstratos, não de LLMs.

## Hipótese (pré-registrada antes da execução)
Registrada em `results/sims/PREREGISTRO.jsonl` (2026-11-07T22:33:11Z, v1.0.0, sha256 do código `0458aeae79c2bf83…`).

Um verificador imperfeito, porém com especificidade alta e erros não correlacionados com os geradores, reduz o falso sucesso abaixo do voto e do agente único; mas, como cada tentativa extra é uma nova chance de aceitar um erro, o falso sucesso do best-of-N cresce com N, e um verificador fraco ou correlacionado com a dificuldade da tarefa pode ser pior que o voto.

- **P1** — Com spec ≥ 0,95 e ρ_v=0, bon-seq tem falso sucesso (FS) menor que voto-N e que único-alto (mesmo orçamento de geração) para todo N ≥ 3 e todo ρ (IC95% disjuntos).
- **P2** — O FS de bon-seq é não decrescente em N (tolerância 1 p.p.); com ρ=ρ_v=0 coincide com FS(N) = r_w/(r_c+r_w)·(1−(1−r_c−r_w)^N), r_c=p·sens, r_w=(1−p)(1−spec), dentro do IC95% em ≥ 90% dos pontos.
- **P3** — Verificador correlacionado com a dificuldade (ρ_v=0,5) aumenta o FS de bon-seq vs ρ_v=0 para ρ ≥ 0,3, N ≥ 3, spec < 0,99.
- **P4** — Com spec=0,5 e ρ=0, bon-seq tem FS maior que o voto em N=33.
- **P5** — Com ρ_v=0, a vantagem de acurácia de bon-seq sobre o voto em N=9 cresce com ρ (0 < 0,3 < 0,6) para spec ≥ 0,8.

## Modelo
- Geradores como em `sim-voto-correlacionado` (p=0,6, fator latente S com correlação ρ). Tarefa binária.
- Verificador: aceita candidato correto com prob. `sens`; aceita candidato errado com prob. 1−`spec`. Com ρ_v>0, a aceitação de errados depende do mesmo S (tarefas difíceis enganam gerador **e** verificador).
- Estratégias: `unico-baixo`, `unico-alto` (esforço N, p=1−0,4/√N), `voto` (N), `bon-seq` (para no 1º aceito; abstém se nenhum), `bon-fallback` (se nenhum aceito, entrega o voto).
- Falso sucesso = entrega errada declarada como sucesso. Abstenção é falha honesta (não é falso sucesso).
- Custo = gerações + c_v·verificações, c_v ∈ {0,2; 1}. 10 000 tarefas por célula; 48 células × 7 valores de N.

## Resultados (gerados pelo script; conferidos por `sims/run-all.mjs`)
Manchetes:
- rho=0,3, sens=spec=0,95, N=9: FS bon-seq 5,0% [IC95% 4,6%–5,4%] vs voto 35,4% [IC95% 34,4%–36,3%] vs único-alto 13,7% [IC95% 13,0%–14,4%]
- Mesma célula: acurácia bon-seq 93,5% [IC95% 93,0%–94,0%], abstenção 1,5%; bon-fallback FS 6,5% [IC95% 6,0%–7,0%]
- Verificador correlacionado (rho_v=0,5) na mesma célula: FS bon-seq sobe para 7,9% [IC95% 7,4%–8,5%]
- Verificador fraco (spec=0,5, sens=0,95, rho=0, N=33): FS bon-seq 25,8% [IC95% 25,0%–26,7%] vs voto 11,6% [IC95% 11,0%–12,2%]
- Custo por acerto (c_v=0,2) rho=0,3 N=9: bon-seq 2,50 [IC95% 2,45–2,55] vs voto 13,92 [IC95% 13,72–14,13]

| Previsão | Veredicto (no modelo) | Detalhe |
|---|---|---|
| P1 | **nao-suporta** | 3 falhas, ex.: rho=0.6,sens=0.8,spec=0.95,N=17 vs unico-alto; rho=0.6,sens=0.8,spec=0.95,N=33 vs unico-alto; rho=0.6,sens=0.95,spec=0.95,N=33 vs unico-alto |
| P2 | **suporta** | monótono=true; fórmula dentro do IC em 55/56 pontos |
| P3 | **suporta-parcialmente** | 53/60 comparações com aumento significativo; exceções: rho=0.6,sens=0.8,spec=0.5,N=5; rho=0.6,sens=0.8,spec=0.5,N=9; rho=0.6,sens=0.8,spec=0.5,N=17; rho=0.6,sens=0.8,spec=0.5,N=33; rho=0.6,sens=0.95,spec=0.5,N=9; rho=0.6,sens=0.95,spec=0.5,N=17; rho=0.6,sens=0.95,spec=0.5,N=33 |
| P4 | **suporta** | sens=0.8: FS bon-seq 30,1% vs voto 12,6%; sens=0.95: FS bon-seq 25,8% vs voto 11,6% |
| P5 | **nao-suporta** | sens=0.8,spec=0.8: 12,5 / 17,0 / 14,8 p.p.; sens=0.8,spec=0.95: 22,5 / 27,0 / 24,4 p.p.; sens=0.8,spec=0.99: 26,1 / 30,5 / 26,7 p.p.; sens=0.95,spec=0.8: 14,1 / 19,4 / 17,5 p.p.; sens=0.95,spec=0.95: 23,0 / 28,9 / 24,6 p.p.; sens=0.95,spec=0.99: 25,5 / 31,3 / 28,3 p.p. |

Trechos (sens=0,95, ρ_v=0; FS = falso sucesso; valores pontuais, IC95% ≈ ±1 p.p.; tabela completa no JSON `results.cells[]`):

| Célula | N | voto acc / FS | único-alto acc / FS | bon-seq acc / FS / abstém |
|---|---|---|---|---|
| ρ=0, spec=0,95 | 9 | 73,7% / 26,3% | 86,9% / 13,1% | 96,7% / 3,3% / 0,0% |
| ρ=0,3, spec=0,95 | 9 | 64,6% / 35,4% | 86,3% / 13,7% | 93,5% / 5,0% / 1,5% |
| ρ=0,6, spec=0,95 | 33 | 63,2% / 36,8% | 93,1% / 6,9% | 90,3% / 9,2% / 0,4% |
| ρ=0,3, spec=0,8 | 9 | 64,5% / 35,5% | 86,2% / 13,8% | 83,9% / 15,8% / 0,3% |
| ρ=0, spec=0,5 | 33 | 88,4% / 11,6% | 93,3% / 6,7% | 74,2% / 25,8% / 0,0% |

## Interpretação
- O verificador é uma fonte de informação **independente** dos geradores; por isso escapa do teto de correlação do voto. Com spec ≥ 0,95, bon-seq tem FS e custo por acerto menores que o voto em todas as células com essa spec (com spec=0,5 isso se inverte, ver P4).
- O FS de bon-seq **cresce com N** e satura em r_w/(r_c+r_w): mais tentativas aumentam a chance de aceitar um erro. A fórmula fechada bateu com o MC em 55/56 pontos (ρ=ρ_v=0).
- **P1 falhou** em 3 de 120 comparações: com ρ=0,6 e N ≥ 17, o agente único com esforço N (p≈0,90–0,93 pela curva suposta) tem FS menor que bon-seq com spec=0,95. Ou seja, com erros muito correlacionados e retorno ao esforço β=0,5, investir o orçamento em um agente só pode ser mais seguro que amostrar muito.
- **P5 não suportada:** a vantagem de bon-seq sobre o voto não é monótona em ρ — cresce de ρ=0 para 0,3 e cai em 0,6, porque com ρ alto as tarefas difíceis têm quase nenhum candidato correto para o verificador aprovar.
- **P3 parcial:** verificador correlacionado aumenta o FS em 53/60 comparações; as exceções são todas com spec=0,5 e ρ=0,6, em que o FS já é alto nos dois casos.
- `bon-fallback` (entregar o voto quando nada passa) mascara falhas: com N pequeno o FS volta ao nível do voto. Abster-se e escalar é a opção que preserva aceite verificável.

## Limitações
- Verificador binário com sens/spec fixos e custo fixo; em LLMs, sens/spec dependem da tarefa e o verificador pode compartilhar vieses do gerador além do modelado por ρ_v.
- A curva de esforço do `unico-alto` é suposição (β=0,5).
- **O que precisa de validação com LLM real:** sens/spec de verificadores reais (testes unitários vs LLM-juiz) por tipo de tarefa; correlação entre erro do juiz e erro do gerador; FS observado de best-of-N em função de N.
