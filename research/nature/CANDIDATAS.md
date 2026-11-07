---
id: nat-candidatas
title: 10 hipóteses candidatas vindas da natureza para o registro oficial
area: nature
evidence: hipotese
tags: [hipoteses-candidatas, ranking, elastic-swarm, quando-cooperar, quanto-cooperar]
sources:
  - "Derivadas dos cartões nat-* desta pasta; fontes primárias em cada cartão."
related: [nat-mapa, nat-condorcet-correlated, nat-small-groups-correlated-cues, nat-quorum-nest-bees, nat-speed-accuracy-quorum, nat-response-threshold, nat-interaction-rate-foraging, nat-topological-neighbors, nat-brain-energy-sparse, nat-recruitment-benefit-conditions, nat-kessler-cascade]
updated: 2026-11-07
summary: As 10 hipóteses de origem natural mais testáveis hoje e com mais poder para explicar quando 1 agente basta, quando um micro-swarm agrega valor e quando expandir desperdiça — para formalização pelo agente de teoria.
---

# Hipóteses candidatas (natureza → registro `H-xx`)

Propostas para o agente de teoria formalizar. **Nenhuma foi testada com LLM.** Os IDs `nat-C01…C10` são provisórios; o registro oficial atribui `H-xx`.

## Critério de ranking
- **Testabilidade hoje (T, 1–5):** dá para testar com o que existe (sims em `sims/`, tarefas com aceite mecânico, poucos dólares de API) sem infraestrutura nova?
- **Poder de transição (P, 1–5):** a hipótese prevê *onde* ficam as fronteiras 1 agente → micro-swarm (2–5) → macro-swarm (10+), com uma quantidade mensurável?
- **Ordem:** por T + P, desempate por P. Risco de não-novidade indicado quando a literatura já cobre parte (ver cartões `lit-*`).

| # | ID | Hipótese (curta) | Origem natural | T | P | Onde testar primeiro |
|---|---|---|---|---|---|---|
| 1 | nat-C01 | O ganho do voto satura em N ≈ 1/ρ̂ (correlação de erros) | Condorcet correlacionado; Kao & Couzin | 5 | 5 | CALC ✓ → sim existente → LLM |
| 2 | nat-C02 | Expandir só ajuda se a maioria traz evidência independente correta; senão há N* interior pequeno | Kao & Couzin 2014 | 4 | 5 | SIM → LLM |
| 3 | nat-C03 | Quórum ajustável: k* cresce com C_erro/C_tempo; k = 1 é o regime "1 agente" | Formigas/abelhas (Pratt & Sumpter; Franks; Seeley) | 5 | 4 | LLM |
| 4 | nat-C04 | Ativação por limiar sobre estímulo barato vence N fixo sse o estímulo prediz dificuldade | Limiar de resposta; alostase | 4 | 5 | SIM → LLM |
| 5 | nat-C05 | Independência antes, compartilhamento depois: debate só ajuda quando soluções são raras | Dornhaus 2006; Galton/Lorenz | 4 | 4 | LLM |
| 6 | nat-C06 | Spawn acoplado a aceites contrai sozinho em tarefas inviáveis | Formigas colhedoras (Gordon) | 4 | 4 | SIM → LLM |
| 7 | nat-C07 | Em macro-swarm, ler k fixo de pares satura em k* pequeno independente de N | Estorninhos (Ballerini; Young) | 4 | 3 | LLM |
| 8 | nat-C08 | Ativação esparsa k ≪ N iguala ativação densa com fração do custo | Orçamento cerebral; código esparso | 3 | 4 | LLM |
| 9 | nat-C09 | Expansão sem contração ativa tem razão crítica geração/limpeza > 1 → estoque explode | Kessler; resolução da inflamação; contração clonal | 4 | 3 | SIM |
| 10 | nat-C10 | Rotas reforçadas por aceite precisam de evaporação: sem decaimento há lock-in | Feromônio/ACO; Physarum | 4 | 3 | SIM |

---

## nat-C01 — Teto de correlação e regra N ≈ 1/ρ
- **Enunciado:** para N agentes votando com acurácia individual p̂ > 1/2 e correlação de erros ρ̂ medida num conjunto de calibração, a acurácia da maioria satura num teto A_∞(p̂, ρ̂) < 1, e ≥ 90% do ganho possível é obtido com N ≤ ⌈1/ρ̂⌉. Para ρ̂ ≥ 0,3, N > 3 é desperdício.
- **Base:** cálculo local (p = 0,6, ρ = 0,1 → teto 0,736; ρ = 0,3 → 0,643; n_ef ≤ 1/ρ) em `calc/`; Ladha 1992; Kao & Couzin 2014. Converge com `sim-voto-correlacionado` (cópula gaussiana) — dois modelos de correlação diferentes.
- **Variáveis:** N ∈ {1,3,5,9,15}; homogêneo (cópias) vs heterogêneo (modelos/prompts/evidências).
- **Métrica:** acurácia, ρ̂ por pares, custo por acerto; erro de previsão do modelo (p̂, ρ̂).
- **Refutação:** acurácia subindo > 3 p.p. além de N = 2/ρ̂; ou modelo de 2 parâmetros errando > 5 p.p.
- **Transição explicada:** fronteira micro → macro (quando expandir desperdiça). Também 1 → micro: se p̂ < 1/2 em tarefas difíceis, votar piora — 1 agente com effort alto deve ganhar.
- **Risco de não-novidade:** alto na forma (correlação limita votação é conhecido; ver `lit-correlated-errors`, `lit-more-agents`); a contribuição é a **regra operacional estimável** (ρ̂ → N_max) e sua validação.

## nat-C02 — Condição de Kao–Couzin para expandir
- **Enunciado:** seja q a fração de agentes com acesso a evidência independente (ferramenta, arquivo, teste próprio) e a a acurácia dessa evidência. Se q·a > 1/2, acurácia(N) é monotônica; se q·a < 1/2, existe máximo interior N* pequeno (3–7) e acurácia cai depois.
- **Base:** Kao & Couzin 2014 (condição p > 1/(2r_L)); Couzin 2005 (poucos informados bastam em grupos grandes).
- **Variáveis:** N × q ∈ {0; 0,25; 0,5; 0,75}.
- **Métrica:** argmax_N da acurácia; posição da fronteira observada vs 1/(2a).
- **Refutação:** acurácia monotônica em todas as condições; ou N* insensível a q.
- **Transição explicada:** micro → macro e **por que** macro-swarms precisam de evidência distribuída, não de mais cópias.

## nat-C03 — Quórum ajustável à urgência
- **Enunciado:** um único algoritmo de parada sequencial por quórum (parar quando k respostas canônicas concordam) com k escolhido pela razão C_erro/C_tempo declarada atinge utilidade ≥ 95% da melhor configuração fixa a posteriori; k = 1 (agente único) é ótimo quando C_tempo domina.
- **Base:** Pratt & Sumpter 2006 (quórum 5,7 vs 12,7; acerto 65% vs 90%; tempo 87 vs 565 min); Franks 2003; Seeley & Visscher 2003 (10–15 abelhas, sem consenso).
- **Métrica:** utilidade = valor·acerto − custo tokens − custo latência; fronteira de Pareto.
- **Refutação:** k ótimo independente da razão de custos; ou controlador < 90% do ótimo.
- **Transição explicada:** 1 agente ↔ micro-swarm, como função contínua de um parâmetro de urgência.
- **Risco de não-novidade:** parada adaptativa já existe (`lit-adaptive-consistency`, `lit-early-stopping-sc`); o novo é **acoplar k à razão de custos da tarefa** e prever o k* a partir dela.

## nat-C04 — Ativação por limiar de estímulo (e preditor alostático)
- **Enunciado:** escolher effort e N antes de executar, por limiares sobre um estímulo barato s (desacordo entre 2 amostras curtas, critérios de aceite em aberto, testes falhando), reduz custo por aceite ≥ 25% vs N fixo **sse** s prediz dificuldade com AUC ≥ ~0,75 e custa ≤ 10% da tarefa média. Abaixo disso, a política reativa (escada de escalonamento) vence.
- **Base:** Bonabeau 1996/Theraulaz 1998 (limiar e reforço); Sterling 2012 (alostase: antecipar vs corrigir); Kurtzer 2015/Pruszynski 2011 (camadas reflexo → transcortical → voluntário).
- **Refutação:** ganho sem relação com a AUC do estímulo; ou nenhum ganho com AUC ≥ 0,85.
- **Transição explicada:** 0 (checagem determinística) → 1 → micro, pela qualidade do estímulo. Fornece a condição de existência de um "controlador adaptativo" barato.

## nat-C05 — Independência primeiro; compartilhar só quando soluções são raras
- **Enunciado:** (a) expor agentes às respostas dos pares antes de responderem reduz dispersão sem reduzir erro (efeito Lorenz); (b) compartilhar achados intermediários reduz custo em tarefas de baixa densidade de solução e aumenta custo em tarefas de alta densidade.
- **Base:** Lorenz et al. 2011; Galton 1907; Dornhaus et al. 2006; Cavagna 2010 (correlação longa propaga erro e acerto).
- **Refutação:** benefício do compartilhamento independente da densidade de solução; ou debate reduzindo erro consistentemente (> 5% relativo).
- **Transição explicada:** quando um micro-swarm deve **conversar** vs apenas **votar** — relaciona-se a `lit-debate-or-vote`.

## nat-C06 — Recrutamento acoplado a aceite (elasticidade automática)
- **Enunciado:** taxa de lançamento de novas tentativas proporcional à taxa de aceites verificados numa janela curta contrai o swarm sozinho em tarefas inviáveis (≥ 50% menos chamadas) com ≤ 20% de atraso nas viáveis; a qualidade depende da taxa de falso aceite.
- **Base:** Gordon et al. 2008 (resposta em 2–3 min a queda de retornos); Prabhakar et al. 2012 (Poisson + realimentação).
- **Refutação:** sem contração em inviáveis, ou atraso > 20% nas viáveis.
- **Transição explicada:** expansão/contração **durante** a execução (Elastic Swarm), sem estimar dificuldade a priori.

## nat-C07 — Vizinhança topológica fixa em macro-swarms
- **Enunciado:** em agregação/debate com N ∈ {6, 12, 24}, ler k pares fixos satura a acurácia em k* ≤ 4, **independente de N**; ler todos (k = N−1) custa O(N²) sem ganho > 1 p.p.
- **Base:** Ballerini 2008 (6,5 ± 0,9; desgarrados 5% vs 43%); Young 2013 (ótimo independe de N); Tero 2010 (rede adaptativa com ~30% das ligações).
- **Refutação:** k* crescendo com N; ou k = N−1 superando k* por > 3 p.p.
- **Transição explicada:** como um macro-swarm mantém custo de coordenação linear em N.

## nat-C08 — Ativação esparsa
- **Enunciado:** com N = 12 especialistas e roteador barato, k = 2–3 ativos atingem aceite ≥ (k = 12) − 2 p.p. com ≤ 25% do custo; os k roteados têm erros menos correlacionados entre si que um grupo denso.
- **Base:** Raichle & Gusnard 2002 (2% da massa, 20% do O₂); Attwell & Laughlin 2001 (≤ 15% ativos); Lennie 2003 (< 1%); Olshausen & Field 1996.
- **Refutação:** aceite crescendo ~linearmente até k = 12; ou roteador errando a ponto de k pequeno perder > 5 p.p.
- **Transição explicada:** macro-swarm como **reserva** grande com ativação pequena — "tamanho disponível" ≠ "tamanho ativo".

## nat-C09 — Razão crítica geração/limpeza
- **Enunciado:** num sistema em que cada job gera filhos com probabilidade p, sem deduplicação/limite de profundidade/dono, existe p_c (média de filhos ≈ 1) acima do qual o estoque de jobs cresce mesmo após cessar a entrada; resolução ativa (cancelamento transitivo) mantém o estoque decaindo para todo p testado.
- **Base:** Kessler & Cour-Palais 1978; Liou & Johnson 2006 (densidade crítica; crescimento pós-2055 sem lançamentos); Serhan 2014 (resolução ativa); Kaech & Cui 2012 (contração de 90–95%).
- **Refutação:** crescimento gradual sem limiar; ou contenção falhando acima de p_c.
- **Transição explicada:** por que expandir **sem** contração programada é instável — custo de macro-swarms não é só o de execução.

## nat-C10 — Reforço com evaporação no roteador
- **Enunciado:** um roteador de configurações (1 agente vs micro-swarm, qual especialista) com pesos reforçados por aceite precisa de decaimento: sem ele, após mudança de distribuição, a readaptação é ≥ 3× mais lenta (lock-in); com meia-vida finita adequada, a perda estacionária é ≤ 5%.
- **Base:** Dorigo et al. 1996/1997 (realimentação positiva + evitar convergência prematura); Goss 1989/Deneubourg 1990 (lock-in relatado em fontes secundárias — lacuna); Tero 2010 (tubos sem fluxo desaparecem).
- **Refutação:** sem lock-in com h = ∞; ou qualquer decaimento custando > 5%.
- **Transição explicada:** como o sistema **descobre e redescobre** autonomamente a configuração mínima suficiente quando a carga muda.

---

## Ordem de execução sugerida (proposta, não autorização)
1. C01 e C02 juntos (mesma bateria de votação com ρ̂ e q medidos) — já há base em `sims/sim-voto-correlacionado.mjs` e `research/theory/`.
2. C03 e C05 em tarefas com aceite mecânico (ex.: código com testes) — barato.
3. C04 depois de existir um estímulo candidato com AUC medida.
4. C06, C09, C10 em simulação antes de qualquer LLM.
5. C07 e C08 quando houver ≥ 6 agentes/especialistas no Observatory.

## Relação com simulações já existentes no repo
Resumos lidos nos frontmatters de `results/sims/*.md` (trabalho do agente de simulação; não reexecutei nem auditei):
- C01 ↔ `sim-voto-correlacionado` (correlação latente 0,1 já impede 64 agentes p = 0,6 de alcançar 1 agente p = 0,8) e `sim-verificador`.
- C03 ↔ `sim-quorum` (quórum maior troca velocidade por acurácia; viés de avaliação compartilhado derruba a acurácia mesmo com quórum alto; previsões pré-registradas não suportadas) — reforça a cláusula de refutação de C03 sobre erros correlacionados.
- C04 ↔ `sim-limiar-resposta`; C06 ↔ `sim-elastico`; C09 ↔ `sim-clonal`; C10 ↔ `sim-estigmergia` (sem evaporação o rastro cresce sem limite).

## O que estas candidatas NÃO afirmam
Nenhum mecanismo natural demonstra eficácia em LLMs. As faixas numéricas das previsões (25%, 40%, k* ≤ 4, etc.) são **limiares de refutação propostos**, escolhidos para tornar as hipóteses falsificáveis — não estimativas derivadas das fontes.
