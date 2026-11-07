---
id: sim-elastico
title: "Swarm elástico por ganho marginal vs N fixo"
area: simulation
evidence: validacao-local
tags: [elastic-swarm, ganho-marginal, adaptive-activation, custo-por-tarefa-aceita, aceite-verificavel, pontos-de-transicao]
sources:
  - "Código: sims/sim-elastico.mjs (v1.0.0, seed 20261107)"
  - "Dados: results/sims/sim-elastico.json"
related: [sim-relatorio, H-05, H-12, H-16, H-17, sim-voto-correlacionado, sim-verificador, lit-scaling-agent-systems, lit-adaptive-consistency, lit-early-stopping-sc]
updated: 2026-11-07
summary: "No modelo, a regra elástica por ganho marginal empata ou supera o melhor N fixo em utilidade líquida em todo V testado (V=20: 14,9 vs 12,8) e aceita 93% das tarefas com 2,3 agentes em média; mas custo por tarefa aceita sozinho engana — o agente único \"vence\" nessa métrica desistindo das tarefas difíceis."
---

> **Escopo da evidência:** `validacao-local` = validação **dentro de um modelo simulado** de agentes abstratos com teste de aceite, não de LLMs.

## Hipótese (pré-registrada antes da execução)
Registrada em `results/sims/PREREGISTRO.jsonl` (2026-11-07T22:43:39Z, v1.0.0, sha256 do código `792e3930abd1a809…`).

Uma regra elástica que adiciona agentes enquanto o ganho marginal esperado (ΔP·V) supera o custo marginal, com ΔP estimado por um modelo bayesiano da dificuldade, entrega custo por tarefa aceita menor que qualquer N fixo, mantendo a taxa de aceite; o tamanho ótimo transita de 1 → micro → macro conforme a dificuldade e o valor da tarefa, e a regra só funciona bem se o modelo de ΔP considerar a correlação de erros.

- **P1** — Para V ∈ {10, 20}, `elastico-seq` tem custo por tarefa aceita menor que todo fixo-N (N=1,3,5,9; IC95% disjuntos) e aceite ≥ fixo-3 − 1 p.p.
- **P2** — Para todo V ∈ {2,5,10,20,50,100}, a utilidade líquida de `elastico-seq` não é significativamente menor que a do melhor fixo-N.
- **P3** — N fixo ótimo por classe: fácil → 1 (V ≥ 5); média → micro 2..5 (V ∈ [10,50]); acoplada → 0 (V ≤ 5) e macro ≥ 6 (V ≥ 50).
- **P4** — Controlador mal especificado (supõe ρ=0) tem custo por aceita maior que o calibrado para V ≥ 20.
- **P5** — Sonda de dificuldade (custo 0,05, 80% de acerto) aumenta a utilidade vs `elastico-seq` para V ≥ 10.
- **P6** — `elastico-dobra` (lotes 1,2,4,8,16) usa menos rodadas que `elastico-seq`, com custo por aceita ≤ 1,2× , para V ≥ 10.

## Modelo
- Mistura de tarefas: fácil 50% (p=0,9, ρ=0,2), média 35% (p=0,5, ρ=0,3), acoplada 15% (p=0,15, ρ=0,5). "Acoplada" = baixa chance por tentativa e tentativas muito correlacionadas; decomposição/especialização **não** modelada.
- Cada tentativa custa 1 + 0,1 (teste de aceite). Teste: aprova todo correto, deixa passar 2% dos errados (falso aceite).
- V = valor de uma tarefa aceita e correta, em unidades de custo de tentativa. Utilidade = V·[correta aceita] − custo − V·[falso aceite].
- `elastico-seq`: antes de cada tentativa, P(próxima correta | k falhas) é calculado por integração sobre (classe, fator latente) — o posterior "aprende" que a tarefa é difícil a cada falha. Continua se P·V ≥ 1,1. Equivale a um limite de tentativas K*(V) que depende do valor.
- 40 000 tarefas por V, números aleatórios comuns entre políticas. N fixo ótimo por classe calculado de forma exata (integração).

## Resultados (gerados pelo script; conferidos por `sims/run-all.mjs`)
Manchetes:
- V=20 fixo-1: aceite 65,8% [IC95% 65,3%–66,2%], custo/aceita 1,67 [IC95% 1,66–1,68], utilidade 11,78 [IC95% 11,69–11,88], agentes 1,00
- V=20 fixo-3: aceite 83,7% [IC95% 83,3%–84,0%], custo/aceita 3,94 [IC95% 3,93–3,96], utilidade 12,81 [IC95% 12,72–12,89], agentes 3,00
- V=20 fixo-9: aceite 92,5% [IC95% 92,2%–92,8%], custo/aceita 10,70 [IC95% 10,67–10,73], utilidade 7,53 [IC95% 7,45–7,61], agentes 9,00
- V=20 elastico-seq: aceite 93,1% [IC95% 92,8%–93,3%], custo/aceita 2,73 [IC95% 2,70–2,77], utilidade 14,94 [IC95% 14,84–15,04], agentes 2,31
- V=20 elastico-sonda: aceite 92,9% [IC95% 92,6%–93,1%], custo/aceita 2,68 [IC95% 2,65–2,72], utilidade 15,00 [IC95% 14,91–15,10], agentes 2,22
- V=20 oraculo-classe: aceite 91,8% [IC95% 91,5%–92,0%], custo/aceita 2,43 [IC95% 2,40–2,46], utilidade 15,18 [IC95% 15,09–15,27], agentes 2,03
- Transições (N fixo ótimo): fácil 0,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3; média 0,0,0,1,1,1,2,2,3,3,4,5,6,7,8,9; acoplada 0,0,0,0,0,0,0,1,2,2,3,5,6,8,10,11 para V=1,1.5,2,3,4,5,7,10,15,20,30,50,70,100,150,200

| Previsão | Veredicto (no modelo) | Detalhe |
|---|---|---|
| P1 | **nao-suporta** | V=10: custo/aceita elástico 2,31 vs fixos 1,67/3,95/6,21/10,68 (mais barato que todos=false); aceite 88,5% vs fixo-3 83,5%; V=20: custo/aceita elástico 2,73 vs fixos 1,67/3,94/6,21/10,70 (mais barato que todos=false); aceite 93,1% vs fixo-3 83,7% |
| P2 | **suporta** | V=2: ΔU vs fixo-1 0,00 [IC95% 0,00–0,00]; V=5: ΔU vs fixo-1 0,21 [IC95% 0,19–0,23]; V=10: ΔU vs fixo-1 1,08 [IC95% 1,04–1,12]; V=20: ΔU vs fixo-3 2,13 [IC95% 2,08–2,19]; V=50: ΔU vs fixo-3 3,94 [IC95% 3,77–4,11]; V=100: ΔU vs fixo-5 5,94 [IC95% 5,65–6,23] |
| P3 | **suporta-parcialmente** | fácil→1 (V>=5)=false; média→micro (V 10–50)=true; acoplada→0 (V<=5) e macro (V>=50)=false. N ótimo por V [1,1.5,2,3,4,5,7,10,15,20,30,50,70,100,150,200]: facil [0,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3]; media [0,0,0,1,1,1,2,2,3,3,4,5,6,7,8,9]; acoplada [0,0,0,0,0,0,0,1,2,2,3,5,6,8,10,11] |
| P4 | **nao-suporta** | V=20: mal especificado 3,63 [IC95% 3,56–3,70] vs calibrado 2,73 [IC95% 2,70–2,77]; V=50: mal especificado 3,69 [IC95% 3,62–3,76] vs calibrado 3,43 [IC95% 3,37–3,49]; V=100: mal especificado 3,69 [IC95% 3,61–3,76] vs calibrado 3,69 [IC95% 3,61–3,76] |
| P5 | **nao-suporta** | V=10: ΔU sonda−seq 0,072 [IC95% 0,053–0,091]; V=20: ΔU sonda−seq 0,063 [IC95% 0,038–0,089]; V=50: ΔU sonda−seq 0,029 [IC95% -0,008–0,066]; V=100: ΔU sonda−seq -0,050 [IC95% -0,050–-0,050] |
| P6 | **suporta** | V=10: rodadas 1,34 vs 1,86; custo/aceita 2,22 vs 2,31; V=20: rodadas 1,51 vs 2,31; custo/aceita 2,82 vs 2,73; V=50: rodadas 1,60 vs 3,01; custo/aceita 3,58 vs 3,43; V=100: rodadas 1,65 vs 3,27; custo/aceita 4,42 vs 3,69 |

**V=20** (40 000 tarefas; IC95% completos no JSON `results.per_V[]`):

| Política | aceite | falso aceite | custo/aceita | utilidade [IC95%] | agentes | rodadas |
|---|---|---|---|---|---|---|
| fixo-1 | 65,8% | 0,7% | 1,67 | 11,78 [11,69–11,88] | 1,00 | 1,00 |
| fixo-3 | 83,7% | 1,6% | 3,94 | 12,81 [12,72–12,89] | 3,00 | 1,00 |
| fixo-5 | 88,5% | 2,0% | 6,21 | 11,39 [11,31–11,48] | 5,00 | 1,00 |
| fixo-9 | 92,5% | 2,7% | 10,70 | 7,53 [7,45–7,61] | 9,00 | 1,00 |
| elastico-seq | 93,1% | 2,8% | 2,73 | 14,94 [14,84–15,04] | 2,31 | 2,31 |
| elastico-dobra | 91,1% | 2,4% | 2,82 | 14,68 [14,58–14,77] | 2,34 | 1,51 |
| elastico-mis | 97,6% | 4,6% | 3,63 | 14,14 [14,01–14,28] | 3,22 | 3,22 |
| elastico-sonda | 92,9% | 2,7% | 2,68 | 15,00 [14,91–15,10] | 2,22 | 2,22 |
| oraculo-classe | 91,8% | 2,4% | 2,43 | 15,18 [15,09–15,27] | 2,03 | 2,03 |

**V=5:**

| Política | aceite | falso aceite | custo/aceita | utilidade [IC95%] | agentes | rodadas |
|---|---|---|---|---|---|---|
| fixo-1 | 65,5% | 0,8% | 1,68 | 2,10 [2,08–2,13] | 1,00 | 1,00 |
| fixo-3 | 83,7% | 1,5% | 3,94 | 0,73 [0,71–0,75] | 3,00 | 1,00 |
| fixo-5 | 88,5% | 2,0% | 6,21 | -1,28 [-1,30–-1,26] | 5,00 | 1,00 |
| fixo-9 | 92,5% | 2,7% | 10,70 | -5,54 [-5,56–-5,52] | 9,00 | 1,00 |
| elastico-seq | 83,7% | 1,5% | 2,05 | 2,31 [2,28–2,34] | 1,56 | 1,56 |
| elastico-dobra | 83,7% | 1,5% | 2,22 | 2,17 [2,14–2,20] | 1,69 | 1,34 |
| elastico-mis | 88,5% | 2,0% | 2,31 | 2,18 [2,15–2,21] | 1,86 | 1,86 |
| elastico-sonda | 81,5% | 1,2% | 1,95 | 2,36 [2,33–2,39] | 1,40 | 1,40 |
| oraculo-classe | 82,5% | 1,0% | 1,76 | 2,57 [2,55–2,60] | 1,32 | 1,32 |

**Pontos de transição — N fixo ótimo (exato) por classe**, V = 1 · 1.5 · 2 · 3 · 4 · 5 · 7 · 10 · 15 · 20 · 30 · 50 · 70 · 100 · 150 · 200:

| Classe | N ótimo |
|---|---|
| facil (p=0,9, ρ=0,2) | 0 · 1 · 1 · 1 · 1 · 1 · 1 · 1 · 2 · 2 · 2 · 2 · 2 · 3 · 3 · 3 |
| media (p=0,5, ρ=0,3) | 0 · 0 · 0 · 1 · 1 · 1 · 2 · 2 · 3 · 3 · 4 · 5 · 6 · 7 · 8 · 9 |
| acoplada (p=0,15, ρ=0,5) | 0 · 0 · 0 · 0 · 0 · 0 · 0 · 1 · 2 · 2 · 3 · 5 · 6 · 8 · 10 · 11 |

Leitura: **0 → 1** em V≈1,5 (fácil), V≈3 (média), V≈10 (acoplada); **1 → micro** em V≈15 (fácil), V≈7 (média), V≈15 (acoplada); **micro → macro (≥6)** em V≈70 (média e acoplada); a classe fácil nunca passa de 3 em V ≤ 200.

## Análise de sensibilidade (exploratória — pedido da coordenação)
Classe isolada com acerto individual p e correlação ρ (ρ alto 0,4–0,7 = regime que a literatura indica como realista, relato dos autores em `lit-correlated-errors`). Referência: limiar ~0,45 de Kim et al. (`lit-scaling-agent-systems`, relato dos autores). p = 0.05 · 0.1 · 0.15 · 0.2 · 0.25 · 0.3 · 0.35 · 0.4 · 0.45 · 0.5 · 0.6 · 0.7 · 0.8 · 0.9 · 0.95.

| ρ | V | N ótimo por p | maior p com N ótimo ≥ 2 | p onde o valor marginal do 2º agente é máximo |
|---|---|---|---|---|
| 0,2 | 10 | 0 · 0 · 1 · 2 · 2 · 2 · 3 · 3 · 2 · 2 · 2 · 2 · 2 · 1 · 1 | 0,8 | 0,5 |
| 0,2 | 20 | 0 · 2 · 4 · 4 · 4 · 4 · 4 · 4 · 4 · 3 · 3 · 3 · 2 · 2 · 1 | 0,9 | 0,5 |
| 0,2 | 50 | 3 · 7 · 8 · 8 · 8 · 7 · 7 · 6 · 6 · 5 · 4 · 4 · 3 · 2 · 2 | 0,95 | 0,5 |
| 0,4 | 10 | 0 · 0 · 1 · 1 · 2 · 2 · 2 · 2 · 2 · 2 · 2 · 2 · 2 · 1 · 1 | 0,8 | 0,5 |
| 0,4 | 20 | 0 · 2 · 3 · 3 · 3 · 4 · 4 · 3 · 3 · 3 · 3 · 3 · 2 · 2 · 1 | 0,9 | 0,5 |
| 0,4 | 50 | 1 · 5 · 6 · 7 · 7 · 7 · 6 · 6 · 6 · 5 · 4 · 4 · 3 · 2 · 2 | 0,95 | 0,5 |
| 0,55 | 10 | 0 · 0 · 1 · 1 · 1 · 2 · 2 · 2 · 2 · 2 · 2 · 2 · 1 · 1 · 1 | 0,7 | 0,5 |
| 0,55 | 20 | 0 · 1 · 2 · 3 · 3 · 3 · 3 · 3 · 3 · 3 · 3 · 2 · 2 · 2 · 1 | 0,9 | 0,5 |
| 0,55 | 50 | 1 · 3 · 5 · 5 · 5 · 6 · 6 · 5 · 5 · 5 · 4 · 4 · 3 · 2 · 2 | 0,95 | 0,5 |
| 0,7 | 10 | 0 · 0 · 1 · 1 · 1 · 1 · 1 · 2 · 2 · 2 · 2 · 1 · 1 · 1 · 1 | 0,6 | 0,5 |
| 0,7 | 20 | 0 · 1 · 2 · 2 · 2 · 2 · 2 · 3 · 3 · 2 · 2 · 2 · 2 · 1 · 1 | 0,8 | 0,5 |
| 0,7 | 50 | 1 · 2 · 3 · 4 · 4 · 4 · 5 · 5 · 4 · 4 · 4 · 4 · 3 · 2 · 2 | 0,95 | 0,5 |

- O **valor marginal do 2º agente é máximo em p≈0,5** em todas as células e decresce acima disso — forma parecida com o relato de ~45%, mas aqui por um motivo trivial: o ganho de uma 2ª tentativa com teste de aceite é ∝ P(1ª falha e 2ª acerta) ≈ p(1−p), máximo em 0,5.
- Mesmo assim, com teste de aceite confiável, **N ≥ 2 continua ótimo até p = 0,6–0,95** (depende de V e ρ). Ou seja, no modelo, a retentativa verificada não "satura" em 45%; a saturação relatada exige mecanismos ausentes aqui (overhead de coordenação, propagação de erro, ausência de verificador).
- ρ alto reduz o N ótimo e o valor do 2º agente (ρ=0,7, V=10: o swarm só compensa para p entre 0,4 e 0,6).

## Interpretação
- **P2 suportada com folga** — o resultado principal: maximizando utilidade, a regra de ganho marginal empata com N=1 quando V é baixo (V=2) e supera o melhor N fixo por 0,2 a 5,9 unidades/tarefa quando V cresce. A regra converte-se em um **limite de tentativas K*(V)** (1, 3, 5, 10, 23, 32 para V=2…100) que se adapta à tarefa pela parada no primeiro aceite.
- **P1 não suportada — e o motivo importa:** o `fixo-1` tem o menor custo por tarefa aceita (1,67) porque aceita só as fáceis (aceite 66%). Custo por aceita **não pode ser métrica única**; precisa vir junto de taxa de aceite ou utilidade. Contra fixo-3/5/9 o elástico é mais barato **e** aceita mais.
- **P3 parcialmente suportada:** a classe fácil passa a 2–3 agentes com V ≥ 15 (10% de falha × valor alto paga uma retentativa) — previsão errada; acoplada vira macro só com V ≥ 70.
- **P4 não suportada pelo critério (parcialmente na direção prevista):** o controlador que ignora a correlação superexpande (custo/aceita 3,63 vs 2,73 em V=20) e eleva o falso aceite (4,6% vs 2,8%); em V=100 ambos batem no teto de 32 tentativas e empatam.
- **P5 não suportada pelo critério (parcialmente):** a sonda ajuda pouco (+0,06–0,07 de utilidade em V=10–20) e deixa de ajudar em V ≥ 50 (o controlador já tenta tudo). O valor de estimar dificuldade antes depende do V.
- **Falso aceite cresce com a expansão** (fixo-1 0,7% → elástico V=100 4,6%): mesmo efeito de `sim-verificador` — cada tentativa a mais é uma nova chance de o teste deixar passar um erro.

## Limitações
- Tentativas sequenciais condicionalmente independentes dado (classe, S); sem aprendizado entre tentativas (um agente LLM vê a falha anterior), sem decomposição de tarefas acopladas, sem custo de latência na utilidade.
- O controlador conhece o modelo gerador (exceto em `elastico-mis`); na prática, ΔP precisa ser estimado com dados.
- **O que precisa de validação com LLM real:** curva P(acerto na tentativa k+1 | k falhas) por tipo de tarefa; especificidade real dos testes de aceite; se K*(V) estimado em um conjunto de calibração generaliza para tarefas reservadas.
