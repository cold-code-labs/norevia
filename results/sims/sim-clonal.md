---
id: sim-clonal
title: "Expansão/contração inspirada em seleção clonal vs N fixo"
area: simulation
evidence: validacao-local
tags: [selecao-clonal, elastic-swarm, retorno-ao-repouso, reparo-delimitado, custo-ocioso, alarmes-falsos, memoria-imune]
sources:
  - "Código: sims/sim-clonal.mjs (v1.0.0, seed 20261107)"
  - "Dados: results/sims/sim-clonal.json"
  - "Fenômeno de inspiração: expansão clonal, contração e memória imunológica — fontes primárias no cartão nat-clonal-expansion-contraction (não reabertas por este agente)"
related: [sim-relatorio, H-14, H-19, H-05, nat-clonal-expansion-contraction, nat-wound-healing-resolution, sim-limiar-resposta, sim-elastico, lit-bio-autonomic, lit-selfheal]
updated: 2026-11-07
summary: "No modelo, expandir ×2 enquanto o erro persiste e contrair ×0,5 depois recupera incidentes em 11,8 passos (contra 12,9 de 16 agentes fixos) gastando 2,85 agentes/passo em vez de 16; memória por tipo corta a recuperação para 9,8 passos com +3% de custo."
---

> **Escopo da evidência:** `validacao-local` = validação **dentro de um modelo simulado** de incidentes e agentes abstratos. A analogia com o sistema imune é inspiração de mecanismo, não demonstração; não há teste com LLMs.

## Hipótese (pré-registrada antes da execução)
Registrada em `results/sims/PREREGISTRO.jsonl` (2026-11-07T22:45:40Z, v1.0.0, sha256 do código `1b704c3363684c5b…`).

Escalar multiplicativamente enquanto um sinal de erro persiste e contrair após a resolução dá recuperação comparável a um pool grande fixo com custo ocioso próximo ao de um pool mínimo; um filtro de persistência contém o custo de alarmes falsos, e memória por tipo de incidente acelera respostas secundárias.

- **P1** — Cenário principal (alarme falso f=0,01): clonal-g2-h1 não é dominado por nenhum N fixo (1,2,4,8,16) em (custo ocioso, recuperação média) — para cada N fixo, é significativamente melhor em pelo menos uma métrica.
- **P2** — Clonal-g2-h1: custo ocioso ≤ 2× fixo-1 e recuperação ≤ fixo-4.
- **P3** — Cenário ruidoso (f=0,05): persistência h=3 reduz o custo ocioso ≥ 30% vs h=1 com aumento da recuperação ≤ 20%.
- **P4** — Memória por tipo reduz a recuperação (IC95% disjuntos) com aumento de custo total ≤ 10%.
- **P5** — Contração lenta (c=0,8) aumenta o custo ocioso vs c=0,5 sem reduzir a recuperação em mais de 5%.

## Modelo
- 3000 passos; incidentes Poisson (1 a cada 120 passos), 5 tipos com trabalho mediano 20/40/80/120/200 agente-passos (lognormal, σ=0,5). Vazão com n agentes = n^0,8 (overhead de coordenação), FIFO.
- Sinal de erro: ligado se há incidente aberto há ≥ 2 passos (atraso de detecção) ou alarme falso (prob. f por passo).
- **Clonal:** se o sinal está ligado há ≥ h passos, n ← min(32, ⌈g·n⌉); desligado, n ← max(1, ⌊c·n⌋). Memória: ao detectar um tipo já visto, salta para o pico usado na última vez.
- **Fixo:** N ∈ {1,2,4,8,16} sempre ativos.
- 1000 execuções; mesmos incidentes para todas as políticas e cenários (comparações pareadas). Custo ocioso = Σ n(t) nos passos sem incidente aberto.

## Resultados (gerados pelo script; conferidos por `sims/run-all.mjs`)
Manchetes:
- principal fixo-1: ocioso 793 [IC95% 764–821] agente-passos, recuperação 291,4 [IC95% 279,9–302,9] passos, custo total/passo 1,00
- principal fixo-4: ocioso 8619 [IC95% 8560–8678] agente-passos, recuperação 46,1 [IC95% 45,2–47,1] passos, custo total/passo 4,00
- principal fixo-16: ocioso 43358 [IC95% 43278–43439] agente-passos, recuperação 12,9 [IC95% 12,7–13,0] passos, custo total/passo 16,00
- principal clonal-g2-h1: ocioso 3304 [IC95% 3300–3309] agente-passos, recuperação 11,8 [IC95% 11,7–11,9] passos, custo total/passo 2,85
- principal clonal-g2-h1-mem: ocioso 3401 [IC95% 3395–3406] agente-passos, recuperação 9,8 [IC95% 9,7–9,8] passos, custo total/passo 2,93
- ruidoso clonal-g2-h1: ocioso 3539 [IC95% 3532–3545] agente-passos, recuperação 11,8 [IC95% 11,7–11,9] passos, custo total/passo 2,93
- ruidoso clonal-g2-h3: ocioso 3262 [IC95% 3257–3267] agente-passos, recuperação 13,6 [IC95% 13,5–13,7] passos, custo total/passo 2,82

| Previsão | Veredicto (no modelo) | Detalhe |
|---|---|---|
| P1 | **suporta** | vs fixo-1: Δocioso 2512 [IC95% 2482–2541], Δrecuperação -279,6 [IC95% -291,0–-268,1]; vs fixo-2: Δocioso 167 [IC95% 117–217], Δrecuperação -93,4 [IC95% -96,7–-90,1]; vs fixo-4: Δocioso -5314 [IC95% -5374–-5254], Δrecuperação -34,3 [IC95% -35,2–-33,4]; vs fixo-8: Δocioso -16741 [IC95% -16811–-16671], Δrecuperação -11,7 [IC95% -12,0–-11,4]; vs fixo-16: Δocioso -40054 [IC95% -40135–-39973], Δrecuperação -1,0 [IC95% -1,1–-0,9] |
| P2 | **nao-suporta** | ocioso clonal 3304 vs 2×fixo-1 1585; recuperação clonal 11,8 vs fixo-4 46,1 |
| P3 | **nao-suporta** | ruidoso: redução do ocioso com h=3 7,8%; aumento da recuperação 15,2% |
| P4 | **suporta** | Δrecuperação memória -2,09 [IC95% -2,10–-2,08]; aumento do custo total 3,1% |
| P5 | **suporta** | Δocioso c=0,8 1397 [IC95% 1380–1415]; redução da recuperação 1,1% |

**Cenário principal (f=0,01)** — médias por execução de 3000 passos (1000 execuções):

| Política | custo ocioso (agente-passos) | custo total/passo | recuperação média [IC95%] | recuperação p95 | incidentes abertos no fim |
|---|---|---|---|---|---|
| fixo-1 | 793 | 1,00 | 291,4 [279,9–302,9] | 541,3 | 3,57 |
| fixo-2 | 3137 | 2,00 | 105,2 [101,9–108,6] | 230,8 | 0,92 |
| fixo-4 | 8619 | 4,00 | 46,1 [45,2–47,1] | 108,4 | 0,36 |
| fixo-8 | 20045 | 8,00 | 23,5 [23,2–23,9] | 55,8 | 0,17 |
| fixo-16 | 43358 | 16,00 | 12,9 [12,7–13,0] | 30,1 | 0,10 |
| clonal-g2-h1 | 3304 | 2,85 | 11,8 [11,7–11,9] | 21,2 | 0,09 |
| clonal-g2-h3 | 3208 | 2,80 | 13,6 [13,5–13,7] | 23,0 | 0,10 |
| clonal-g1.5-h1 | 3204 | 2,77 | 13,1 [13,0–13,2] | 22,6 | 0,09 |
| clonal-g2-h1-mem | 3401 | 2,93 | 9,8 [9,7–9,8] | 19,2 | 0,07 |
| clonal-g2-h1-c0.8 | 4702 | 3,31 | 11,7 [11,6–11,8] | 21,1 | 0,09 |

**Cenário ruidoso (f=0,05):**

| Política | custo ocioso | custo total/passo | recuperação média [IC95%] | p95 | abertos no fim |
|---|---|---|---|---|---|
| fixo-1 | 793 | 1,00 | 291,4 [279,9–302,9] | 541,3 | 3,57 |
| fixo-2 | 3137 | 2,00 | 105,2 [101,9–108,6] | 230,8 | 0,92 |
| fixo-4 | 8619 | 4,00 | 46,1 [45,2–47,1] | 108,4 | 0,36 |
| fixo-8 | 20045 | 8,00 | 23,5 [23,2–23,9] | 55,8 | 0,17 |
| fixo-16 | 43358 | 16,00 | 12,9 [12,7–13,0] | 30,1 | 0,10 |
| clonal-g2-h1 | 3539 | 2,93 | 11,8 [11,7–11,9] | 21,2 | 0,09 |
| clonal-g2-h3 | 3262 | 2,82 | 13,6 [13,5–13,7] | 23,0 | 0,10 |
| clonal-g1.5-h1 | 3386 | 2,83 | 13,0 [12,9–13,1] | 22,6 | 0,09 |
| clonal-g2-h1-mem | 3640 | 3,01 | 9,7 [9,6–9,8] | 19,2 | 0,07 |
| clonal-g2-h1-c0.8 | 5274 | 3,51 | 11,6 [11,5–11,7] | 21,0 | 0,09 |

Dados para gráfico de Pareto (custo ocioso × recuperação): `results.<cenário>.pareto`.

## Interpretação
- **Resultado principal (P1 suportada):** o clonal não é dominado por nenhum pool fixo. Contra 16 agentes fixos, recupera ligeiramente mais rápido (11,8 vs 12,9 passos) com custo total **5,6× menor** (2,85 vs 16 agentes/passo) e ~13× menos custo ocioso. É o padrão "expandir sob sinal persistente, voltar ao repouso" funcionando como prometido **dentro do modelo**.
- **P2 não suportada, por um defeito da métrica:** o fixo-1 tem custo ocioso baixo porque quase nunca fica ocioso — está sempre atrasado (recuperação 291 passos, 3,6 incidentes abertos no fim). Custo ocioso só é comparável entre políticas com recuperação parecida; o clonal paga ~1 agente-passo por passo de repouso (n_min=1) mais a cauda de contração (32→1 em 5 passos).
- **P3 não suportada:** com g=2, um alarme falso de 1 passo só custa ~1 agente-passo extra; o filtro h=3 economizou 7,8% do ocioso e atrasou a recuperação em 15%. Persistência só compensa se alarmes falsos forem longos ou a expansão for agressiva — previsão superestimou o custo dos alarmes.
- **P4 suportada:** memória por tipo (resposta secundária) reduz a recuperação em ~2,1 passos (−18%) com +3,1% de custo total.
- **P5 suportada:** contração lenta (c=0,8) aumenta o custo ocioso em ~42% sem ganho relevante de recuperação (−1,1%). Voltar ao repouso rápido é barato aqui porque novos incidentes são raros.

## Limitações
- Incidentes independentes com trabalho divisível (n^0,8); sem incidentes que pioram com intervenção, sem reparos que introduzem falhas, sem custo de ativação/aquecimento de agentes (que favoreceria pools fixos).
- Sinal de erro perfeito após 2 passos (exceto alarmes falsos de 1 passo); n_max=32 é atingido em todas as execuções — o clonal exige capacidade de pico de 32 agentes (custo de reserva/limite de concorrência não contabilizado).
- **O que precisa de validação com LLM real:** custo de ativar/desativar agentes (contexto, aquecimento); se o "sinal de erro" (testes falhando, alertas) é confiável o bastante para guiar expansão; se reparos paralelos se atrapalham (α real); risco de cascata quando o reparo introduz novos erros.
