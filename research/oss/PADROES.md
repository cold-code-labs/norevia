---
id: oss-padroes
title: Padrões e anti-padrões de coordenação extraídos do código OSS para o Swarm Efficiency Observatory
area: oss
evidence: hipotese
tags: [padroes, anti-padroes, observatory, termino-explicito, aceite-verificavel, orcamento, poda-de-comunicacao, elastic-swarm, consenso-correlacionado]
sources:
  - "Cartões oss-* desta pasta (cada mecanismo citado tem repo@SHA e arquivo:linha)"
  - "oss-matriz (MATRIZ.md)"
related: [oss-matriz, oss-openai-agents-sdk, oss-crewai, oss-plexil, oss-autogen, oss-metagpt, oss-agentprune, oss-gptswarm, oss-agentnet, oss-chatdev-macnet, oss-langgraph-supervisor, oss-stigmergic, oss-symbiont, oss-selfheal, oss-camel, oss-moa, oss-buzz, oss-openai-swarm, oss-langgraph-swarm]
updated: 2026-11-07
summary: Onze padrões reutilizáveis e nove anti-padrões vistos no código de swarms open source, convertidos em três arquiteturas comparáveis para o Observatory (solo verificado, micro-swarm com gate mecânico, swarm adaptativo com poda).
---

# Padrões e anti-padrões para o Observatory

## Como ler
- **Mecanismo de origem** = implementação observada (leitura estática, repo@SHA + `arquivo:linha`). Os SHAs completos estão nos cartões e em `oss-matriz`. As abreviações usadas aqui: GPTSwarm `c23a827`, AgentPrune `c544dd6`, AgentNet `325d39f`, SYMBIONT `0c19117`, Stigmergic `a90e93c`, SelfHeal `812e6a3`, Buzz `49ea418`, PLEXIL `0e7439f`, MoA `1b5cab0`, OpenAI Swarm `6af0b4c`, Agents SDK `27c75c5`, LangGraph Swarm `8956b13`, LangGraph Supervisor `88859b3`, CrewAI `3df7fd0`, AutoGen `d07c667`, CAMEL `123f0c6`, MetaGPT `11cdf46`, ChatDev main `464a681`, ChatDev macnet `e7a3582`.
- **Aplicação no Observatory** = hipótese de engenharia. Nada aqui foi implementado, simulado ou testado. Nenhum padrão autoriza implantação no OpenBot.
- **Escopo:** o harness do Observatory deve impor término, orçamento e aceite *fora* dos frameworks. A matriz mostra que nenhum framework inspecionado garante os três por padrão.

## Padrões reutilizáveis

### P1. Término em camadas, com default finito
- **Origem:**
  - Agents SDK: `src/agents/run_config.py:L45` define `DEFAULT_MAX_TURNS = 10`, que vira `MaxTurnsExceeded` (`src/agents/run.py:L1597-L1606`).
  - AutoGen: condições componíveis com `&`/`|` (`python/packages/autogen-agentchat/src/autogen_agentchat/base/_termination.py:L79-L86`).
  - MetaGPT: `Team.run` para por rodadas, por ociosidade ou por orçamento (`metagpt/team.py:L123-L138`).
- **Aplicação:** toda execução do Observatory termina pela primeira de quatro condições: (a) aceite mecânico, (b) orçamento esgotado, (c) teto de turnos, (d) ociosidade/estagnação. O motivo do término é registrado como campo obrigatório. Isso separa "parou porque acertou" de "parou porque acabou o dinheiro", que é a base da métrica de encerramento prematuro.

### P2. Admissão por orçamento *antes* da chamada
- **Origem (lacuna dos frameworks):** os únicos tetos que interrompem a execução checam *depois* do passo.
  - MetaGPT: `metagpt/team.py:L98-L100`, chamado entre rodadas.
  - AutoGen: `conditions/_terminations.py:L275-L286`, pós-turno.
  - Os demais só rastreiam: GPTSwarm `swarm/llm/price.py:L47-L49`; Agents SDK `src/agents/usage.py:L196-L230`.
- **Aplicação:** um ledger no harness estima o custo máximo da próxima chamada (`max_tokens` de saída + prompt) e recusa a chamada se o saldo não cobre. Mede-se o overshoot (consumo real − teto) contra os orçamentos pós-hoc.

### P3. Aceite mecânico como gate final, separado do ranqueamento
- **Origem:**
  - Agents SDK: validação strict do `output_type` (`src/agents/agent_output.py:L142-L153`).
  - CrewAI: guardrail de função com `guardrail_max_retries=3` e falha dura (`lib/crewai/src/crewai/task.py:L289-L291`, `L1450-L1459`).
  - PLEXIL: pós-condição avaliada pelo executivo vira o outcome tipado `POST_CONDITION_FAILED` (`src/exec/NodeImpl.cc:L1236-L1246`).
- **Aplicação:** a tarefa só conta como aceita se passar em testes ou checagens determinísticas que nenhum agente vê nem altera. Falha de aceite gera um outcome tipado (como no PLEXIL), não texto livre.

### P4. Poda estrutural de saídas (sem treino)
- **Origem:**
  - LangGraph Supervisor: `output_mode="last_message"` é o default (`langgraph_supervisor/supervisor.py:L225`, `L77-L91`).
  - CrewAI: `Task.context` escolhe quais saídas anteriores entram (`lib/crewai/src/crewai/crew.py:L1887-L1895`).
  - Agents SDK: `input_filter`/`remove_all_tools` nos handoffs (`src/agents/extensions/handoff_filters.py:L33`).
  - MacNet: cada nó vê só a solução do predecessor (`graph.py:L139`, `L174` @macnet).
- **Aplicação:** comparar "histórico completo" com "só o último artefato" entre agentes, medindo tokens de entrada por tarefa aceita e a perda de informação (tarefas que falham só na variante podada).

### P5. Poda aprendida por utilidade, com custo no objetivo
- **Origem:**
  - AgentPrune: `update_masks` zera, a cada `imp_per_iters`, a fração `pruning_rate` das arestas com menor logit (`AgentPrune/graph/graph.py:L317-L339`).
  - GPTSwarm: arestas amostradas por probabilidade aprendida via REINFORCE (`swarm/optimizer/edge_optimizer/parameterization.py:L107-L115`).
  - Nenhum dos dois coloca custo no objetivo: a utilidade é exact-match (cartões `oss-gptswarm`, `oss-agentprune`).
- **Aplicação:** só depois de P4. A utilidade passa a ser *aceite − λ·custo*, com conjunto de treino separado do de teste.

### P6. Reforço condicionado ao aceite, descontando custo
- **Origem:** AgentNet atualiza o peso da aresta por `success_factor` (1,1 ou 0,9) × `time_factor`, e remove a aresta com peso ≤0,3 (`AgentNet_Code/src/agentgraph.py:L140-L160`). No treino, `success` vem de exact-match (cartão `oss-agentnet`).
- **Contraste:** o reforço do SYMBIONT depende só de volume (anti-padrão A3).
- **Aplicação:** roteamento adaptativo (quem recebe qual tipo de tarefa) atualizado apenas por tarefas aceitas e penalizado por custo/tempo.

### P7. Quadro compartilhado com claim atômico, lease e dead-letter
- **Origem:** Stigmergic, `claim` atômico com lease em transação SQLite (`src/stigmergic/core/environment.py:L703-L786`); `max_retries=3` leva a tarefa à DLQ (`src/stigmergic/agents/base_ant.py:L257-L272`).
- **Aplicação:** cada subtarefa tem um dono único e um prazo. Trabalho órfão (lease expirado) volta para a fila; reincidência acima do limite vai para a DLQ e conta como falha explícita, não como silêncio. Mede trabalho órfão e duplicado.

### P8. Contador de estagnação com replanejamento delimitado
- **Origem:** no MagenticOne do AutoGen, `_n_stalls` sobe sem progresso ou em loop e desce com progresso. Ao chegar em `max_stalls`, o orquestrador replaneja e reseta a thread (`python/packages/autogen-agentchat/src/autogen_agentchat/teams/_group_chat/_magentic_one/_magentic_one_orchestrator.py:L394-L406`).
- **Aplicação:** progresso medido mecanicamente (por exemplo, mais testes passando), não declarado por LLM. Os replanejamentos têm teto e contam no custo.

### P9. Best-of-N com seleção mecânica
- **Origem:** o `prune_test` do MacNet ordena candidatos por nota de execução e mantém a metade superior (`chatdev/waiting.py:L267-L314` @macnet). O MoA mostra o oposto: agrega por prompt de síntese, sem seleção (`utils.py:L144-L146`).
- **Aplicação:** N proponentes independentes e um verificador determinístico escolhe. O ponto de comparação é N=1 com o mesmo orçamento total.

### P10. Memória com janela, TTL ou sumarização explícitas
- **Origem:**
  - MetaGPT: `memory_k=200` em RoleZero (`metagpt/roles/di/role_zero.py:L97`).
  - CAMEL: sumarização a 50% do `token_limit` (`camel/agents/chat_agent.py:L1032-L1066`).
  - SYMBIONT: scratchpad com TTL de 1800 s (cartão `oss-symbiont`).
  - Buzz: pertencimento alheio expira em 50 steps (`src/buzz/buzzswarm.c:L209-L248`).
- **Aplicação:** um limite de contexto por agente vira variável experimental. Medem-se o crescimento do contexto e a perda indevida de informação.

### P11. Elasticidade bidirecional
- **Origem:**
  - CAMEL: o `AgentPool` remove clones ociosos acima de `idle_timeout` (`camel/societies/workforce/single_agent_worker.py:L162-L184`); `CREATE_WORKER` cria workers (`camel/societies/workforce/workforce.py:L2010-L2016`).
  - Buzz: `join`/`leave` em runtime (`src/buzz/buzzswarm.c:L377-L476`).
- **Aplicação:** expandir só quando o aceite falha ou o backlog cresce, e contrair por ociosidade. Mede-se o custo marginal por agente adicionado.

## Arquiteturas implementáveis para o Observatory (hipótese)
Todas usam o mesmo harness: ledger de orçamento (P2), gate de aceite oculto (P3), registro do motivo de término (P1) e o mesmo conjunto de tarefas com casos reservados.

| | **A — Solo verificado** | **B — Micro-swarm com gate mecânico** | **C — Swarm adaptativo com poda** |
|---|---|---|---|
| Agentes | 1, reasoning alto | k ≤ 3 proponentes independentes (modelos/temperaturas distintos) | supervisor + especialistas; k varia em runtime |
| Comunicação | nenhuma | nenhuma entre proponentes; só artefato → verificador | estrela com `last_message` (P4) + quadro com claim/lease (P7) |
| Decisão de quem age | — | todos em paralelo; seleção por verificador (P9) | supervisor; roteamento reforçado só por aceite (P6) |
| Término | aceite, orçamento, `max_turns`, estagnação (P1) | primeiro candidato aceito ou orçamento | P1 + replanejamento limitado (P8) |
| Reparo | refazer com feedback do teste | nova rodada só para candidatos rejeitados | P8; DLQ (P7) |
| Elasticidade | — | k fixo | começa com k=1 e expande só após rejeição; contrai por ociosidade (P11) |
| Pergunta que responde | linha de base de custo por tarefa aceita | a diversidade independente compra aceite mais barato que reasoning extra? | a coordenação adaptativa compensa o próprio overhead? |

**Métricas comuns:** custo por tarefa aceita; taxa de aceite; falso sucesso (o agente declara sucesso e o gate rejeita); encerramento prematuro; overshoot de orçamento; tokens de entrada por tarefa; repasses; trabalho órfão ou duplicado; perda de informação por poda.

**Comparação justa:** mesmo orçamento total por tarefa entre A, B e C. Sem isso, B e C "vencem" por gastar mais.

## Anti-padrões (observados no código)

### A1. Consenso de modelos correlacionados
- **Stigmergic:** `DEFAULT_PERSPECTIVES` são três enquadramentos de um único juiz NLI (`src/stigmergic/core/consensus.py:L75-L84`, `L441`). No benchmark versionado, `single-judge`, `quorum-3` e `heterogeneous-panel` têm números idênticos (`benchmarks/injection_capture/RESULTS.md:L16-L19`; relato dos autores, modo torch-free).
- **SelfHeal:** fixer e crítico usam o mesmo modelo (cartão `oss-selfheal`).
- **Lição:** mais votos do mesmo modelo não acrescentam evidência independente. Diversidade deve vir de verificadores de natureza distinta (testes, schema), não de mais LLMs.

### A2. Laços sem término por default
- OpenAI Swarm: `max_turns: int = float("inf")` (`swarm/core.py:L239`).
- AutoGen: `max_turns=None` em RoundRobin/Selector/Swarm (cartão `oss-autogen`).
- PLEXIL: laço de quiescência sem teto de micro-passos (`src/exec/PlexilExec.cc:L282-L406`).
- AgentNet: o limite de saltos só troca o prompt (`AgentNet_Code/src/agent.py:L748-L749`); o laço é `while True`.

### A3. Mensagens ou atividade como proxy de qualidade
- SYMBIONT: `flow_score += (msg_count − usage_count) × weight` (`symbiont/core/topology.py:L118-L119`), sem sinal de resultado aceito. A poda é por ociosidade, não por qualidade (`L134-L143`).
- **Lição:** nenhum peso de roteamento deve subir com volume de mensagens. Usar P6.

### A4. Aceite teatral
Veredito por substring de LLM, validador estrutural ou placeholder que sempre aprova:
- SelfHeal: `"ACCEPT" in critic_output` (`run_agent.py:L394`); `validate_fixed_code` só procura `"def "`/`"return"` (`run_agent.py:L176-L197`).
- SYMBIONT: `"approve" in result.lower()` (`symbiont/agents/worker.py:L122`).
- CrewAI: `HallucinationGuardrail` sem hook registra um aviso e retorna `True` (`lib/crewai/src/crewai/tasks/hallucination_guardrail.py:L97-L103`).
- CAMEL: aceita tarefa de nota baixa quando os retries se esgotam (`camel/societies/workforce/workforce.py:L5534-L5560`).

### A5. Custo medido e nunca usado, e otimização cega ao custo
- AgentPrune: `cost_count` nunca é chamado (cartão `oss-agentprune`).
- GPTSwarm: só acumula custo (`swarm/llm/price.py:L47-L49`), e o REINFORCE otimiza só acurácia.
- **Lição:** relatos de economia de tokens precisam de medição no cliente do modelo, não de contadores do framework.

### A6. Orçamento pós-hoc com buracos
- MetaGPT: modelo ausente da tabela de preços não soma custo (`metagpt/utils/cost_manager.py:L48-L50`), e a `NoMoneyException` é capturada por `serialize_decorator` (`metagpt/utils/common.py:L675-L686`).
- AutoGen: `TokenUsageTermination` não conta seletor nem ledger (cartão `oss-autogen`; inferência por leitura).

### A7. Histórico completo reenviado a cada handoff
- OpenAI Swarm: `swarm/core.py:L47`.
- LangGraph Swarm: `[*messages, tool_message]` no handoff (`langgraph_swarm/handoff.py:L86-L93`).
- **Efeito esperado (hipótese):** o custo de entrada cresce com (número de passos × tamanho do histórico).

### A8. Elasticidade só de crescimento
- SYMBIONT: spawn por demanda (`symbiont/agents/queen.py:L71-L79`), mas `hibernate()` nunca é chamado (cartão `oss-symbiont`).
- CAMEL: `CREATE_WORKER` sem teto nem remoção de workers (cartão `oss-camel`).

### A9. Fallback silencioso tratado como resposta
- SYMBIONT: com o circuit breaker aberto, `think` devolve uma string de "degraded mode" como se fosse resposta (`symbiont/agents/base.py:L327-L329`), e ela pode virar artefato "bem-sucedido".
- CrewAI: falha de conversão para o schema devolve a string bruta (`lib/crewai/src/crewai/utilities/converter.py:L424-L431`).
- **Lição:** degradação deve produzir um outcome de falha tipado (P3), nunca conteúdo.

## Limites/lacunas
- Todos os mecanismos vieram de leitura estática; os efeitos de custo e qualidade são hipóteses até haver execução no Observatory.
- Alguns anti-padrões são inferências de leitura e estão marcados assim nos cartões: o selector fora da contagem no AutoGen, o fallback como artefato no SYMBIONT.
- As arquiteturas A/B/C são propostas de desenho experimental. A atribuição de IDs `H-xx` cabe à área de teoria/hipóteses.
