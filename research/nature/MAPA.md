---
id: nat-mapa
title: Mapa natureza → princípio → engenharia → hipótese → onde testar
area: nature
evidence: hipotese
tags: [mapa, indice, natureza, hipoteses-candidatas]
sources:
  - "Ver os 35 cartões nat-* desta pasta; cada um lista suas fontes primárias e o que foi conferido."
related: [nat-candidatas]
updated: 2026-11-07
summary: Tabela que liga 35 mecanismos naturais verificados a princípios, mecanismos de engenharia para swarms de LLM, hipóteses falsificáveis e o lugar onde cada uma pode ser testada (simulação ou benchmark com LLM).
---

# Mapa do acervo de natureza (agente de natureza, 2026-11-07)

**Como ler:** cada linha é um cartão `nat-*`. "Princípio" é a regularidade extraída da fonte (com o número-chave quando a fonte o dá). "Hipótese candidata" resume a previsão do cartão; o texto completo, com variável manipulada, métrica, previsão e refutação, está no cartão. "Onde testar": **SIM** = simulação baseada em agentes (`sims/`), **LLM** = benchmark com modelos reais (`observatory/`), **CALC** = cálculo analítico já feito localmente (`calc/`). As 10 mais promissoras estão em `CANDIDATAS.md` (`nat-candidatas`).

**Disciplina:** a natureza gera hipóteses; não as prova. Linhas celestes (★) são **analogias estritas**, sem intenção atribuída a astros. Nenhuma linha foi testada em LLM nesta rodada; só as linhas CALC têm `validacao-local`, e apenas da matemática.

## Colônias de insetos

| Cartão | Princípio (fonte) | Mecanismo de engenharia | Hipótese candidata | Onde testar |
|---|---|---|---|---|
| `nat-response-threshold` | Entra na tarefa quem tem limiar θ < estímulo s; T(s)=sⁿ/(sⁿ+θⁿ); reforço cria especialistas (Bonabeau 1996; Theraulaz 1998) | Limiar por papel sobre estímulo barato (critérios abertos, testes falhando, desacordo) | Ativação por limiar reduz ≥25% o custo/aceite vs N fixo, se o estímulo prediz dificuldade (ρ_S ≥ 0,3) | SIM → LLM |
| `nat-interaction-rate-foraging` | Saída de forrageiras segue a taxa recente de retornos com comida; resposta em 2–3 min (Gordon 2008; Prabhakar 2012) | Spawn proporcional à taxa de aceites na janela W | Contração automática corta ≥50% das chamadas em tarefas inviáveis, ≤20% de atraso nas viáveis | SIM → LLM |
| `nat-stigmergy` | Indivíduos "trabalham como se sozinhos"; o artefato coordena (Grassé 1959; Theraulaz & Bonabeau 1999) | Coordenação só por estado compartilhado (repo, testes, checklist) | −40% tokens de coordenação em tarefas decomponíveis; perde em tarefas acopladas | LLM |
| `nat-pheromone-evaporation-aco` | Reforço positivo + evaporação evita convergência prematura/lock-in (Goss 1989; Dorigo 1996/1997) | Roteador com pesos reforçados por aceite e meia-vida h | h finito readapta ≥3× mais rápido após mudança, custo ≤5% no estacionário | SIM |
| `nat-quorum-nest-bees` | Piping começa com 10–15 batedoras num local, sem consenso (Seeley & Visscher 2003) | Parada sequencial quando k respostas canônicas concordam | k=3 → ≥40% menos chamadas que N=9 com acurácia ≥ −1 p.p. | LLM (+SIM) |
| `nat-speed-accuracy-quorum` | Quórum 5,7 (crise) vs 12,7 (calma); acerto 65% vs 90%; tempo 87 vs 565 min (Pratt & Sumpter 2006; Franks 2003) | k e taxa de exploração ajustados à razão custo-do-erro/custo-do-tempo | k ótimo cresce com C_erro/C_tempo; controlador ≤5% do ótimo | SIM → LLM |
| `nat-stop-signal-cross-inhibition` | Sinais de parada entre facções evitam impasse (Seeley et al. 2012) | Objeção por contraexemplo verificável reduz peso da opção rival | −50% impasses, −30% rodadas, acurácia ≥ −2 p.p. | LLM |
| `nat-waggle-dance-recruitment` | Corridas por viagem W = D·R crescem com a rentabilidade (Seeley et al. 2000) | Orçamento de continuação proporcional à qualidade parcial verificada | +15% resolvidas a orçamento igual quando o sinal parcial é informativo | LLM |
| `nat-recruitment-benefit-conditions` | Comunicar ajuda com recursos poucos/pobres/variáveis; atrapalha com abundância; tamanho sem efeito (Dornhaus 2006) | Compartilhar achados entre agentes paralelos condicionado à raridade de soluções | Interação: −20% custo em baixa densidade de solução, +5% em alta | SIM → LLM |
| `nat-inactive-reserve` | Inativas substituem ativas removidas em ≤1 semana; inativas não são repostas (Charbonneau 2017) | Reserva fria de capacidade (cota/concorrência) | r=10–25% reduz p95 ≥30% sob rajadas, custo ≤ +10% | SIM |
| `nat-colony-size-scaling` | Metabolismo ∝ massa^0,81 (IC 0,55–1,08); mais divisão de trabalho em colônias maiores (Hou 2010; Holbrook 2011) | Especialização só acima de N_e; expoente de custo depende do modo de coordenação | N_e ≈ 3–5; b<1 com estado compartilhado, b>1 par-a-par | LLM |

## Microrganismos e física de coletivos

| Cartão | Princípio (fonte) | Mecanismo de engenharia | Hipótese candidata | Onde testar |
|---|---|---|---|---|
| `nat-bacterial-quorum-sensing` | Expressão muda acima de limiar de autoindutor; processos improdutivos sozinhos (Miller & Bassler 2001; Waters & Bassler 2005) | Modo coletivo só quando q sinais independentes se acumulam | −60% investigações espúrias, perda de detecção ≤5% | SIM |
| `nat-physarum-network` | dD/dt = f(\|Q\|) − D; I₀ maior → mais redundância e custo; ~30% das ligações possíveis (Tero 2010) | Grafo de comunicação reforçado por fluxo útil e com decaimento | ≤40% dos tokens da topologia completa, aceite ≥ −2 p.p.; I₀ regula custo×robustez | SIM → LLM |
| `nat-scale-free-correlation` | Correlação ξ ≈ 0,35·L em bandos de 122–4.268 (Cavagna 2010) | Acoplamento social propaga acerto e erro | Acoplamento sem verificação propaga sementes certas e erradas por igual (razão < 1,5) | LLM |
| `nat-topological-neighbors` | n_c = 6,5 ± 0,9; desgarrados 5% vs 43% (Ballerini 2008); ótimo 6–7 independe de N (Young 2013) | Cada agente lê k pares fixos | Acurácia satura em k* ≤ 4 independente de N | LLM (+SIM) |
| `nat-vicsek-phase-transition` | Transição contínua ordem/desordem, β ≈ 0,45 (Vicsek 1995) | Temperatura/diversidade como parâmetro de ordem | Queda não linear da ordem em η_c; acurácia máxima logo abaixo de η_c | SIM → LLM |
| `nat-informed-leaders` | Grupos maiores precisam de proporção menor de informados (Couzin 2005); desinformados devolvem controle à maioria (Couzin 2011) | Poucos agentes com ferramenta/verificador; agregadores neutros | Saturação com f ≤ 2/12; neutros reduzem captura por agente teimoso ≥30% | LLM |
| `nat-small-groups-correlated-cues` | Wisdom of crowds só se p·r_L > 1/2; senão N* finito, pequeno, >1 (Kao & Couzin 2014) | Expandir só se a maioria traz evidência independente correta | Máximo interior N* ∈ [3,7] quando q·acc < 1/2 | SIM → LLM |

## Corpo humano

| Cartão | Princípio (fonte) | Mecanismo de engenharia | Hipótese candidata | Onde testar |
|---|---|---|---|---|
| `nat-reflex-vs-cortex` | SLR 20–45 ms, LLR 50–100 ms, voluntário >100 ms (Kurtzer 2015); camada transcortical ~50 ms já sofisticada (Pruszynski 2011) | Roteamento em 3 camadas: código → modelo barato → effort alto/swarm | −50% custo, −60% latência p50, aceite ≥ −1 p.p. | LLM |
| `nat-clonal-expansion-contraction` | ~2×10⁷ células específicas → 10⁶ estáveis; 5–10% sobrevivem (Murali-Krishna 1998; Kaech & Cui 2012) | Expandir clone do agente útil; contrair 90–95%; reter memória ≤10% | −40% tempo até aceite em recorrências; −30% custo vs swarm permanente | SIM → LLM |
| `nat-danger-theory` | Resposta guiada por dano, não por estranheza (Matzinger 1994/2002 — proposta teórica) | Escalonar por violação verificável, não por novidade | −70% alarmes falsos com ≥90% de detecção | SIM |
| `nat-homeostasis-allostasis` | Feedback é ineficiente; antecipar, casar capacidades, compartilhar reservas (Sterling 2012) | Preditor barato de dificuldade escolhe effort/N antes | Preditivo vence reativo sse AUC ≥ ~0,75 e custo do preditor ≤10% | LLM |
| `nat-wound-healing-resolution` | Resolução da inflamação é programa ativo e autolimitado; excesso desregula (Serhan 2014; Larouche 2018) | Sinal de resolução ativo com cancelamento de descendentes; métrica R_i | −70% R_i, −80% trabalho órfão, sem aumento de reincidência | SIM → LLM |
| `nat-renal-filtration` | ~180 L/dia filtrados, 99% reabsorvidos, 1–2 L eliminados (OpenStax A&P 2e) | Compactação: descarte por padrão + retenção tipada | ≥90% compressão com recall de compromissos ≥98% | LLM |
| `nat-circadian-cadence` | 43% dos genes codificadores oscilam em algum órgão; "rush hours" (Zhang 2014); marca-passo acoplado (Mohawk 2012) | Manutenção em janelas agrupadas + eventos para urgências | −60% custo por problema útil, latência de urgências igual | SIM |
| `nat-brain-energy-sparse` | 2% da massa, 20% do O₂ (Raichle 2002); ≤15% (Attwell 2001) ou <1% (Lennie 2003) de neurônios ativos | Ativação esparsa k ≪ N de especialistas roteados | k = 2–3 de 12 ≈ aceite de k = 12 com ≤25% do custo | LLM |

## Sistemas celestes (★ analogia estrita, sem intenção)

| Cartão | Princípio (fonte) | Mecanismo de engenharia | Hipótese candidata | Onde testar |
|---|---|---|---|---|
| ★ `nat-stellar-thermostat` | Calor específico negativo; sem equilíbrio além de 0,335 GM²/(−E) (Lynden-Bell & Wood 1968) | Backpressure; alerta de autoaceleração por concentração | Admissão com backpressure degrada graciosamente; coordenador central + sem limite cresce superlinearmente | SIM |
| ★ `nat-orbital-resonance` | Cadeia de 7 planetas com ressonâncias de 3 corpos; TRAPPIST-1h 18,77 d (Luger 2017) | Offsets/jitter e disparo por versão de dependência | −50% pico de concorrência; −50% retrabalho por mudança | SIM |
| ★ `nat-lagrange-points` | L4/L5 estáveis só se μ < μ_G ≈ 0,0385 (Gascheau; Sicardy 2010; recalculado) | Contratos de fronteira com dono assimétrico + station keeping | Coautoria simétrica ≥2× divergências vs dono único | LLM |
| ★ `nat-kessler-cascade` | Acima de densidade crítica, colisões > decaimento; LEO cresce após ~2055 sem lançamentos (Liou & Johnson 2006) | Razão geração/limpeza de jobs; dedup, profundidade, dono | Limiar p_c de ramificação; contenção leva estoque a zero | SIM |

## Teoria coletiva

| Cartão | Princípio (fonte) | Mecanismo de engenharia | Hipótese candidata | Onde testar |
|---|---|---|---|---|
| `nat-condorcet-jury` | p=0,6: n=1→0,600; 3→0,648; 21→0,826; 51→0,926 (binomial; Boland 1989) | Voto majoritário; comparação 1 forte vs N fracos a custo igual | Observado ±3 p.p. da binomial quando ρ≈0; voto só vence se p_baixo > 1/2 | CALC ✓ → LLM |
| `nat-condorcet-correlated` | p=0,6, ρ=0,1 → teto 0,736; n_ef ≤ 1/ρ (Ladha 1992; cálculo local) | Regra de parada N ≈ 1/ρ̂; trocar cópias por heterogeneidade | Ganho satura em N ≈ 1/ρ̂; modelo (p̂, ρ̂) prevê ±3 p.p. | CALC ✓ → SIM → LLM |
| `nat-diversity-prediction` | Erro coletivo = erro médio − diversidade (Page 2007; identidade verificada) | Medir competência e diversidade separadamente | Prompts/modelos diversos reduzem erro coletivo só se Δdiversidade > Δerro médio | CALC ✓ → LLM |
| `nat-hong-page-critique` | Times aleatórios > top (Hong & Page 2004); teorema exige cópias idênticas; maximamente diverso < mediana aleatória (Thompson 2014) | Evitar cópias redundantes; não maximizar diversidade cegamente | Cópias ≈ 1 agente; "max diversidade" não supera sorteio | LLM |
| `nat-galton-vox-populi` | Mediana de 787 = 1.207 vs 1.198 lb (Galton 1907); influência social mina o efeito (Lorenz 2011) | Respostas independentes antes de qualquer exposição | Debate reduz dispersão ≥50% sem reduzir erro da mediana | LLM |

## Lacunas transversais
- Números não conferidos no texto original: experimento das pontes duplas (Goss 1989, PDF digitalizado), forma sⁿ/(sⁿ+θⁿ) de Bonabeau 1996 (só fonte secundária), % de inativas (Charbonneau 2015), % de informados por N (Couzin 2005, em figuras), limiares de autoindutor, μ∞ de Sicardy.
- Fonte de livro-texto, não primária: rins (OpenStax).
- Teoria do perigo é proposta teórica no próprio campo.
- Nenhuma hipótese foi testada com LLM; "validacao-local" cobre só matemática (calc/).
