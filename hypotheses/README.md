---
id: H-index
title: Registro oficial de hipóteses Norevia
area: hypothesis
evidence: hipotese
tags: [registro, hipoteses, lei-da-eficiencia-coletiva]
sources:
  - "research/theory/MODELO.md (th-modelo)"
related: [th-modelo, H-01, H-02, H-03, H-04, H-05, H-06, H-07, H-08, H-09, H-10, H-11, H-12, H-13, H-14, H-15, H-16, H-17, H-18, H-19, H-20]
updated: 2026-11-07
summary: Registro oficial das hipóteses falsificáveis da Norevia sobre quando 1 agente, um micro-swarm ou um macro-swarm é a escolha mais eficiente.
---

# Registro oficial de hipóteses (H-index)

Mantido pelo agente de teoria. Cada cartão traz enunciado, variáveis, previsão, condições de refutação, experimento proposto, status e origem.
Modelo de referência: [`research/theory/MODELO.md`](../research/theory/MODELO.md) (`th-modelo`).

**Status possíveis:** `aberta` (sem teste), `em-teste` (experimento em andamento), `suportada-preliminar` / `refutada-preliminar` (resultado inicial, escopo declarado no cartão).
**Cautela:** "suportada-preliminar" aqui significa apoio **dentro de modelo simulado** (`sims/`, nível `validacao-local` no modelo) e/ou relato de autores — **nenhuma hipótese foi testada em LLM real com dados conclusivos** até 2026-11-07. O observatório concluiu smoke e piloto (sem dados conclusivos).

Contagem: suportada-preliminar: 3 · em-teste: 3 · aberta: 14 · total: 20.

| id | enunciado curto | status | experimento |
|---|---|---|---|
| [H-01](H-01-correlacao-limita-voto.md) | Correlação ρ limita o voto: acurácia satura em 1−I½(a,b) < 1 | `suportada-preliminar` | sims/sim-voto-correlacionado (feito, no modelo) + observatory B-vote3/B-vote5 com repetições de A-low por tarefa para estimar ρ |
| [H-02](H-02-verificador-fator-dominante.md) | Especificidade do verificador (f) pesa mais que N; teto = precisão π | `suportada-preliminar` | sims/sim-verificador (feito, no modelo) + observatory A-low-loop/C-elastic com verificador = testes visíveis, aceite = testes ocultos |
| [H-03](H-03-esforco-alto-vence-acopladas.md) | Acoplamento χ > χ* ≈ 2ι/(kμ): A-high vence C-decompose | `em-teste` | observatory A-high vs C-decompose em tarefas b* com bugs acoplados (variar χ) |
| [H-04](H-04-micro-swarm-decomponiveis.md) | k = 2–3, χ ≈ 0: micro-swarm ≥ A-high em aceite com custo ≤; macro não acrescenta | `em-teste` | observatory C-decompose (N = k) e B-pipeline (executor + verificador) vs A-high e vs N > k em tarefas b* independentes |
| [H-05](H-05-elasticidade-ganho-marginal.md) | Elástico (parar no 1º aceite / ganho marginal < custo) < fixo em custo por acerto | `aberta` | observatory C-elastic vs B-vote5 / best-of-N fixo; sims de mistura de dificuldade |
| [H-06](H-06-limiar-resposta-ativacao.md) | Ativar agentes por T_θ(s) = s²/(s²+θ²) sobre a incerteza reduz agentes/tarefa ≥ 40% vs N fixo | `aberta` | sims/sim-limiar-resposta (proposta) + variante do observatory C-elastic com estímulo = falha de teste visível e/ou discordância das 2 primeiras amostras (ver H-18) |
| [H-07](H-07-estigmergia-evaporacao.md) | Quadro compartilhado com decaimento λ: mensagens O(N) vs O(N²); peso obsoleto h/(h+λ) | `aberta` | sims/sim-estigmergia (proposta: ambiente que muda a taxa h) + observatory com quadro de estado vs mensagens diretas |
| [H-08](H-08-quorum-speed-accuracy.md) | Quórum Q: acurácia ↑ e votos ↑ com Q; sob ρ o ganho satura no teto do voto | `aberta` | sims/sim-quorum (proposta) + observatory com parada por quórum Q ∈ {1,2,3,5} |
| [H-09](H-09-joelho-de-esforco.md) | Dividir E em N vence ⇔ E/N acima de e_knee = h(β−1)^{1/β} | `aberta` | observatory A-low/A-mid/A-high por classe de tarefa (ajustar p(e)) + comparação 1×E vs N×E/N |
| [H-10](H-10-voto-nao-monotono-dificuldade.md) | Itens com p < ½ pioram com N; acurácia agregada tem máximo interior | `aberta` | observatory B-vote com N ∈ {1,3,5,9,15} em conjunto com tarefas fáceis e difíceis; sims |
| [H-11](H-11-usl-coordenacao.md) | Produção útil × N segue USL (σ, κ > 0); topologia completa tem κ maior | `aberta` | observatory: varrer N ∈ {1,2,3,5,8} em tarefa decomponível com topologias estrela / quadro / todos-com-todos; ajustar USL |
| [H-12](H-12-parada-sequencial-descalibrada.md) | SPRT/early-stop i.i.d.: erro realizado ≫ α nominal quando ρ > 0 | `aberta` | sims (já reproduzível em model.mjs: sprt_correlation) + observatory com parada por margem de votos |
| [H-13](H-13-falso-sucesso-cresce-com-N.md) | P_false ↑ com N; precisão dos aceitos constante (iid) ou ↓ (ρ > 0) | `suportada-preliminar` | observatory best-of-N com testes visíveis como verificador e testes ocultos como aceite; sims/sim-verificador (feito) |
| [H-14](H-14-reparo-limitado.md) | q_j decai (δ < 1): parar em R* = 1 + ⌊ln((c+gL)/(V q1))/ln δ⌋ | `aberta` | observatory A-low-loop com teto variável R ∈ {1,2,4,8}; medir q_j por tentativa |
| [H-15](H-15-diversidade-vale-mais-que-N.md) | Δρ 0,3 → 0,1 em N = 5 > aumentar N de 5 → 21 em ρ = 0,3 | `aberta` | observatory B-vote5 homogêneo vs heterogêneo (prompts/abordagens/modelos diferentes) vs B-vote com N maior |
| [H-16](H-16-triagem-nao-paga-orquestracao.md) | "Oi" não paga orquestração: controlador vale se c_ctrl < Σ w_j·(custo evitado_j) | `em-teste` | observatory: controlador adaptativo vs A-low e vs C-elastic em mistura com fração variável de tarefas triviais |
| [H-17](H-17-limiar-capacidade-por-mecanismo.md) | Pico do ganho de cooperar: p* = (1−f)/(2(s−f)) ≈ 0,5 (seleção verificada) vs ≈ 0,79 (voto) | `aberta` | observatory: estratificar tarefas por p̂ do agente único; medir ganho de A-low-loop/C-elastic (seleção por testes) e de B-vote3 vs p̂ |
| [H-18](H-18-consenso-mede-seguranca-nao-necessidade.md) | Fração de erros unânimes E[(1−P)^N]/(1−A_N) cresce com ρ: discordância não detecta necessidade | `aberta` | observatory: comparar controladores com estímulo = discordância vs estímulo = falha de teste visível/verificador; medir fração de erros unânimes |
| [H-19](H-19-memoria-vale-mais-que-agentes.md) | Aumentar p via memória validada > aumentar N (sob ρ > 0) | `aberta` | observatory: A-low com memória de soluções aceitas (tarefas de dev) vs B-vote5 sem memória, em tarefas reservadas |
| [H-20](H-20-alocacao-proporcional-a-qualidade.md) | Recrutamento tipo dança das abelhas: mais orçamento para candidatos com mais testes passando | `aberta` | observatory: best-of-N uniforme vs refinamento dos candidatos com maior fração de testes visíveis passando (piso de exploração) |

## Hipóteses obrigatórias do briefing → cartões
- Correlação limitando ganho de voto → H-01 (e H-10, H-15)
- Verificador como fator dominante → H-02 (e H-13)
- Esforço alto de 1 agente vence em tarefas acopladas → H-03 (e H-09)
- Micro-swarm (2–3) vence em tarefas decomponíveis → H-04
- Elasticidade por ganho marginal vence tamanho fixo → H-05 (e H-12, H-14)
- Limiar de resposta (insetos) para ativação adaptativa → H-06 (e H-16)
- Estigmergia/evaporação reduz comunicação → H-07 (e H-11)
- Quórum (speed-accuracy) → H-08

## Candidatas integradas de outras áreas
- `lit-sintese` §5: candidata 1 → H-01, H-17; candidata 2 → H-02, H-09; candidata 3 → H-03, H-04; candidata 4 → H-18; candidata 5 (cascata) → H-05, H-16; candidata 6 (memória) → H-19.
- `nat-*`: nat-response-threshold → H-06; nat-stigmergy, nat-pheromone-evaporation-aco → H-07; nat-quorum-nest-bees, nat-speed-accuracy-quorum, nat-stop-signal-cross-inhibition → H-08; nat-colony-size-scaling → H-11; nat-interaction-rate-foraging → H-05; nat-waggle-dance-recruitment, nat-recruitment-benefit-conditions → H-20.
- Ainda não registradas (sem derivação no th-modelo; aguardam CANDIDATAS.md do agente de natureza): nat-inactive-reserve (reserva de capacidade sob rajadas), nat-stop-signal-cross-inhibition como protocolo próprio (inibição cruzada por contraexemplo verificável).
- `nat-small-groups-correlated-cues` (Kao & Couzin 2014) → H-04, H-10; nat-clonal-expansion-contraction → H-05; nat-wound-healing-resolution → H-14; nat-reflex-vs-cortex → H-16.
- Resultados de simulação usados: `sim-voto-correlacionado` (H-01, H-09), `sim-verificador` (H-02, H-13). Observatório: smoke + piloto (45 execuções, aceite 100% em todas as arquiteturas — efeito teto; só H-16 passa a `em-teste`). **Recomendação ao observatório:** pelo modelo, só tarefas com p̂(A-low) entre ~0,2 e ~0,8 discriminam arquiteturas (H-17).

**Linha de base:** Kim et al. (arXiv:2512.08296v3, `lit-scaling-agent-systems`) já propõem lei preditiva de escala de sistemas de agentes; as hipóteses daqui buscam refiná-la por mecanismo (H-17, H-18, H-03/H-04), não reivindicam novidade sobre ela.

## Regras de atualização
- Mudança de status exige artefato (arquivo em `results/`) e escopo (modelo simulado vs LLM real).
- Resultados de autores (`lit-*`) não mudam status sozinhos.
- Hipóteses novas recebem o próximo número livre; hipóteses refutadas permanecem no registro.
