---
id: oss-matriz
title: Matriz comparativa de mecanismos de coordenação em 19 projetos open source de swarms/multiagentes
area: oss
evidence: implementacao-observada
tags: [matriz, termino-explicito, aceite-verificavel, orcamento, poda-de-comunicacao, elastic-swarm, memoria-limitada, licenca]
sources:
  - "Cartões oss-* desta pasta, cada um com URL do repositório fixada em commit SHA (clones rasos em 2026-11-07)"
related: [oss-padroes, oss-gptswarm, oss-agentprune, oss-agentnet, oss-swarmsys, oss-symbiont, oss-stigmergic, oss-selfheal, oss-buzz, oss-plexil, oss-moa, oss-openai-swarm, oss-openai-agents-sdk, oss-langgraph-swarm, oss-langgraph-supervisor, oss-crewai, oss-autogen, oss-camel, oss-metagpt, oss-chatdev-macnet]
updated: 2026-11-07
summary: Dos 18 projetos com código lido, só 2 frameworks LLM (MetaGPT e AutoGen) interrompem a execução por custo/tokens, ambos depois do passo, e nenhum combina aceite mecânico, orçamento técnico e poda.
---

# Matriz OSS: término, aceite, orçamento, poda, elasticidade, memória, licença

**Nível de evidência:** implementação observada por leitura estática nos commits listados. Nada foi executado, compilado ou instalado, e nenhum benchmark foi reproduzido. Cada célula resume a "Linha da matriz" do cartão correspondente, onde estão as âncoras `arquivo:linha`. As principais estão repetidas abaixo da tabela. Âncoras de todos os cartões foram checadas por script próprio (existência do arquivo e da faixa de linhas no clone): 1.008 âncoras nos 18 cartões com código resolvidas, 0 quebradas; as âncoras desta matriz e de `oss-padroes` foram conferidas manualmente no conteúdo. Nos cartões, uma amostra de ~25 âncoras teve o conteúdo conferido manualmente.

## Critérios (como ler ✓ / — / ?)
- **Término explícito:** há critério de parada imposto por código, seja por default ou como configuração de primeira classe. Não basta o LLM "decidir parar".
- **Aceite verificável:** o laço usa uma checagem determinística da saída (testes executados, validação de schema, exact-match, pós-condição). LLM-judge sozinho = —.
- **Orçamento técnico:** um limite de tokens, custo ou chamadas verificado por código **interrompe** a execução. "Grosso" = a checagem acontece entre passos e admite overshoot. `max_turns` sozinho e limites de rate (RPM) não contam.
- **Poda de comunicação:** algum mecanismo remove arestas, mensagens, histórico ou agentes.
- **Elástico:** o número de agentes ou membros muda em runtime conforme a demanda.
- **Memória limitada:** há capacidade, janela, TTL ou eviction explícitos.
- **Qualificadores:** "opt-in" = existe mas está desligado por padrão. "parcial" = cobre só parte do sistema. "?" = não verificado (código não disponível ou fora do repo inspecionado). "n/a" = a coluna não se aplica (registrado como —).

## Tabela

| Projeto (cartão) | Commit | Topologia · quem decide | Término explícito | Aceite verificável | Orçamento técnico | Poda de comunicação | Elástico | Memória limitada | Licença (arquivo lido) |
|---|---|---|---|---|---|---|---|---|---|
| GPTSwarm (`oss-gptswarm`) | `c23a827` | DAG de operações; arestas amostradas por probabilidade aprendida | ✓ | ✓ (nó HumanEval roda testes; exact-match na otimização) | — (custo só acumulado) | ✓ | — | — | MIT |
| AgentPrune (`oss-agentprune`) | `c544dd6` | grafo espacial + temporal com máscaras; rodadas fixas | ✓ (`num_rounds`=3) | ✓ (só como utilidade de treino, em scripts) | — (`cost_count` nunca chamado) | ✓ | — | ✓ (janela de 1 rodada) | — sem arquivo LICENSE |
| AgentNet (`oss-agentnet`) | `325d39f` | DAG descentralizado; cada agente decide por LLM forward/split/execute | — (parcial: limite de saltos só por prompt) | ✓ (exact-match no treino) | — | ✓ (aresta com peso ≤0,3 removida) | — | ✓ parcial (pool executor = 40; eviction inoperante) | — sem arquivo LICENSE |
| SwarmSys (`oss-swarmsys`) | sem código | paper: Explorers/Workers/Validators | ? | ? | ? | ? | ? | ? | ? sem repositório |
| SYMBIONT (`oss-symbiont`) | `0c19117` | canais "micélio" reforçados por volume; Queen faz spawn | ✓ (pipeline de 5 fases) | — (LLM + substring "approve"; sucesso = existir artefato) | — | ✓ (por ociosidade, não por qualidade) | ✓ (só cresce) | ✓ parcial (logs e scratchpad com TTL; Mound sem limite) | Apache-2.0 |
| Stigmergic (`oss-stigmergic`) | `a90e93c` | quadro compartilhado (SQLite/Postgres); claim atômico + lease | ✓ por tarefa (`max_retries`=3 → DLQ) | — (quorum NLI 2/3, mesmo modelo × 3 framings) | — | — | — | — (só telemetria tem ring buffer) | Apache-2.0 |
| SelfHeal (`oss-selfheal`) | `812e6a3` | fixer → crítico (mesmo modelo) | ✓ (3 tentativas; para em "ACCEPT") | — (testes nunca executados; crítico LLM) | — | — | — | — | MIT |
| Buzz (`oss-buzz`) | `49ea418` | vizinhança situada (1 salto) + stigmergy virtual LWW | — (só fim do programa) | — | ✓ parcial (1 pacote/step na integração ARGoS) | ✓ (coalescência por chave) | ✓ (`join`/`leave`/`select` em runtime) | ✓ parcial (pertencimento expira em 50 steps) | MIT/Expat (texto sem nome) |
| PLEXIL (`oss-plexil`) | `0e7439f` | árvore de nós com condições; executivo determinístico (docs) | ✓ (End/Repeat; quiescência sem teto) | ✓ (pós-condição vira `POST_CONDITION_FAILED`, se escrita) | — | — (n/a; Skip/Exit podam execução) | — | — (n/a) | BSD-3-Clause (USRA) |
| Mixture-of-Agents (`oss-moa`) | `1b5cab0` | camadas de proponentes → agregador por prompt | ✓ (profundidade fixa) | — (juízes LLM offline) | — | — (concatenação integral) | — | — | Apache-2.0 |
| OpenAI Swarm (`oss-openai-swarm`) | `6af0b4c` | handoff: tool retorna `Agent`; histórico único | ✓ só config (`max_turns` default ∞) | — | — | — | — | — | MIT |
| OpenAI Agents SDK (`oss-openai-agents-sdk`) | `27c75c5` | handoffs + Runner; saída final tipada | ✓ (`DEFAULT_MAX_TURNS`=10) | ✓ (schema strict + guardrails tripwire de código) | — (só rastreio de `Usage`) | ✓ opt-in (`input_filter`, trimmer) | — | ✓ opt-in (`SessionSettings.limit`) | MIT |
| LangGraph Swarm (`oss-langgraph-swarm`) | `8956b13` | handoff por `Command(goto)`; roteador de `active_agent` | ? (núcleo LangGraph não inspecionado) | — | — | — (histórico completo no handoff) | — | ? | MIT |
| LangGraph Supervisor (`oss-langgraph-supervisor`) | `88859b3` | estrela supervisor ↔ workers; hierarquia possível | ? (núcleo) | ? (`response_format` repassado ao núcleo) | — | ✓ (`output_mode="last_message"` default) | — | ? | MIT |
| CrewAI (`oss-crewai`) | `3df7fd0` | sequencial ou hierárquico (manager LLM delega) | ✓ (`max_iter`=25 força resposta) | ✓ (guardrail de função, 3 retries, falha dura) | — (RPM é rate; usage só rastreio) | ✓ opt-in (`Task.context`) | — | — | MIT (texto) |
| AutoGen (`oss-autogen`) | `d07c667` | gerente central: round-robin, selector LLM, swarm, MagenticOne | ✓ (condições componíveis `&`/`\|`; `max_turns` default None) | — (fim decidido por LLM; testes só em exemplo) | ✓ grosso, opt-in (`TokenUsageTermination` pós-turno) | ✓ parcial (replanejamento limpa thread) | — | ✓ opt-in (contextos Buffered/TokenLimited) | MIT (código) + CC-BY-4.0 (docs) |
| CAMEL (`oss-camel`) | `123f0c6` | RolePlaying (par) e Workforce (coordenador LLM, canal central) | ✓ (Workforce; retries 3; timeout 600 s) | — (juiz LLM nota ≥60) | — (tokens só registrados) | ✓ fraco, opt-in | ✓ (`CREATE_WORKER`; só cresce) | ✓ (sumarização a 50% do limite) | Apache-2.0 |
| MetaGPT (`oss-metagpt`) | `11cdf46` | pub/sub em Environment; default via hub TeamLeader | ✓ (`n_round`=3, ociosidade, orçamento) | — (QA roda testes, mas veredito é LLM) | ✓ grosso (US$ 10 default, entre rodadas; modelo sem preço = 0) | — | — | ✓ (`memory_k`=200 em RoleZero) | MIT |
| ChatDev + MacNet (`oss-chatdev-macnet`) | main `464a681` · macnet `e7a3582` | DAG gerado (chain/star/tree/net/mlp/random), ordem topológica | ✓ (DAG se esgota) | — (execução só ranqueia/poda) | — | ✓ (`prune_test` corta metade inferior) | — macnet · ✓ opt-in main | ✓ (agente novo por chamada; só predecessor) | Apache-2.0 (main) · ? (macnet sem LICENSE) |

## Âncoras-chave (repo@SHA → arquivo:linha)
- **Término por default finito.** Agents SDK `27c75c5…`: `src/agents/run_config.py:L45` (`DEFAULT_MAX_TURNS = 10`). CrewAI `3df7fd0…`: `lib/crewai/src/crewai/agents/agent_builder/base_agent.py:L285-L287` (`max_iter=25`). MetaGPT `11cdf46…`: `metagpt/team.py:L123-L138`.
- **Término infinito por default.** OpenAI Swarm `6af0b4c…`: `swarm/core.py:L239` (`max_turns: int = float("inf")`). AutoGen `d07c667…`: `max_turns=None` em RoundRobin/Selector/Swarm (cartão `oss-autogen`).
- **Orçamento que interrompe.** MetaGPT `11cdf46…`: `metagpt/team.py:L98-L100` (`NoMoneyException`), `metagpt/utils/cost_manager.py:L31` (`max_budget: float = 10.0`); a exceção é capturada por `serialize_decorator` (`metagpt/utils/common.py:L675-L686`). AutoGen `d07c667…`: `python/packages/autogen-agentchat/src/autogen_agentchat/conditions/_terminations.py:L275-L286`.
- **Custo medido mas nunca limitado.** GPTSwarm `c23a827…`: `swarm/llm/price.py:L47-L49` (contador global, só usado em logs). AgentPrune `c544dd6…`: `cost_count` definido e não chamado. Agents SDK: `src/agents/usage.py:L196-L230`.
- **Poda aprendida.** AgentPrune `c544dd6…`: `AgentPrune/graph/graph.py:L317-L339` (`update_masks`). GPTSwarm: `parameterization.py:L107-L115`. AgentNet `325d39f…`: `AgentNet_Code/src/agentgraph.py:L155-L160`.
- **Poda por ociosidade (não por qualidade).** SYMBIONT `0c19117…`: `symbiont/core/topology.py:L134-L143`. Reforço por volume: `symbiont/core/topology.py:L118-L119`.
- **Poda por seleção de saídas.** LangGraph Supervisor `88859b3…`: `langgraph_supervisor/supervisor.py:L225`. ChatDev macnet `e7a3582…`: `chatdev/waiting.py:L267-L314`.
- **Aceite mecânico.** Agents SDK: `src/agents/agent_output.py:L142-L153`. CrewAI: `lib/crewai/src/crewai/task.py:L1450-L1459`. PLEXIL `0e7439f…`: `src/exec/NodeImpl.cc:L1236-L1246`.
- **Aceite falso.** SelfHeal `812e6a3…`: `run_agent.py:L176-L197` (`validate_fixed_code` só procura `"def "`/`"return"`) e `run_agent.py:L394` (`"ACCEPT" in critic_output`). CrewAI `3df7fd0…`: `lib/crewai/src/crewai/tasks/hallucination_guardrail.py:L97-L103` (sem hook, registra aviso e retorna `True`). CAMEL `123f0c6…`: `camel/societies/workforce/utils.py:L405-L417` (nota LLM ≥60).
- **Votação correlacionada.** Stigmergic `a90e93c…`: `src/stigmergic/core/consensus.py:L75-L84` (três "perspectivas" de um único modelo), `L441`.
- **Elasticidade.** CAMEL `123f0c6…`: `camel/societies/workforce/workforce.py:L2010-L2016`, `L4321` (`CREATE_WORKER`). SYMBIONT `0c19117…`: `symbiont/agents/queen.py:L71-L79` (spawn por sinal de demanda). Buzz `49ea418…`: `src/buzz/buzzswarm.c:L377-L476`.

## Leituras transversais (hipótese, a partir da matriz)
1. **Orçamento é a coluna mais vazia.** Só MetaGPT (por default) e AutoGen (opt-in) interrompem por custo ou tokens, e ambos checam entre passos. Nenhum projeto faz admissão por orçamento *antes* da chamada. Para o Observatory, isso significa que o teto precisa ficar fora dos frameworks, no harness.
2. **Aceite mecânico é raro e costuma ser opcional.** Onde existe por padrão (schema do Agents SDK, pós-condição do PLEXIL), verifica forma, não correção da tarefa. Onde há testes, eles servem para ranquear ou treinar (GPTSwarm, AgentPrune, MacNet), não para impedir uma entrega final errada.
3. **Poda existe em dois sabores:** aprendida por utilidade (GPTSwarm/AgentPrune/AgentNet, que exigem fase de treino com gabarito) e estrutural, por seleção de saídas (`last_message`, `Task.context`, `prune_test`). A segunda é barata e testável sem treino.
4. **Elasticidade, quando existe, só cresce** (SYMBIONT, CAMEL). Nenhum projeto LLM inspecionado remove agentes por falta de demanda. O caso mais próximo é o `AgentPool` do CAMEL, que remove clones ociosos após 180 s (cartão `oss-camel`). O Buzz faz isso em robótica, por expiração de pertencimento.
5. **Licenças:** AgentPrune e AgentNet não têm arquivo LICENSE, e o branch macnet do ChatDev também não. Código público sem licença não autoriza reuso; essas implementações valem só como referência de leitura.

## Limites/lacunas
- Leitura estática, sem execução: defaults efetivos podem mudar com configuração externa, variáveis de ambiente ou dependências não lidas.
- O núcleo do LangGraph (`recursion_limit`, checkpointers) não foi clonado, daí os "?" nas duas linhas LangGraph.
- O sucessor do AutoGen (Microsoft Agent Framework) e o branch `chatdev1.0` não foram inspecionados.
- SwarmSys não tem código oficial.
- A oficialidade do AgentNet (`zoe-yyx/AgentNet`) é autodeclarada no readme; a página arXiv 2504.00587v2 não cita repositório.
- O YAML do frontmatter dos cartões foi conferido por heurística (chaves obrigatórias), não por parser YAML: não há Python no ambiente.
