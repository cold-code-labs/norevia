---
id: oss-langgraph-swarm
title: LangGraph Swarm — handoff por Command(goto) e roteador de active_agent sobre StateGraph
area: oss
evidence: implementacao-observada
tags: [handoff, langgraph, command-goto, active-agent, roteamento, historico-compartilhado, biblioteca-fina]
sources:
  - "https://github.com/langchain-ai/langgraph-swarm-py/tree/8956b138bbb475b00c98d040176dbb8da667c612 (commit inspecionado, clone raso em 2026-11-07)"
related: [oss-langgraph-supervisor, oss-openai-swarm, oss-openai-agents-sdk, oss-crewai, oss-matriz, oss-padroes]
updated: 2026-11-07
summary: Camada fina (~400 linhas) sobre LangGraph em que cada agente é um nó, handoffs são tools que retornam Command(goto=agente, graph=PARENT) e um roteador em START retoma o último active_agent; término, limites e memória ficam inteiramente no núcleo do LangGraph, não inspecionado aqui.
---

## Identificação

- URL: https://github.com/langchain-ai/langgraph-swarm-py
- SHA inspecionado: `8956b138bbb475b00c98d040176dbb8da667c612`
- Data do commit: 2026-10-29T02:30:06+09:00
- Licença: MIT ("MIT License / Copyright (c) 2025 LangChain, Inc."), lida em `LICENSE`.
- Dependências declaradas: `langchain>=1,<2`, `langchain-core>=1,<2`, `langgraph>=1,<2` (`pyproject.toml`, bloco `[project]`) **[código]**.
- Escopo efetivamente lido: `langgraph_swarm/swarm.py` (inteiro, 289 linhas), `langgraph_swarm/handoff.py` (inteiro, 117 linhas), `README.md` (introdução, Memory, How to customize), `tests/test_swarm.py` (nomes de testes). Não lidos: `examples/`. **O núcleo `langgraph` não está clonado: todo comportamento de execução (ciclo Pregel, `recursion_limit`, checkpointers, reducers) é marcado como não inspecionado.**

## Mecanismo

1. **Topologia de comunicação.** Grafo `StateGraph` com um nó por agente (`langgraph_swarm/swarm.py:L277-L287`); arestas de handoff declaradas a partir das tools de handoff de cada agente (`destinations=get_handoff_destinations(agent)`, `swarm.py:L283-L286`; extração por metadata em `langgraph_swarm/handoff.py:L99-L117`) **[código]**. Todos os agentes compartilham a mesma chave `messages` de `SwarmState(MessagesState)` (`swarm.py:L13-L19`); o README confirma que mensagens de **todos** os agentes são combinadas numa lista única (`README.md`, seção "Customizing agent implementation") **[código]/[README/docs]**.
2. **Quem decide quem age.** O LLM do agente ativo, chamando `transfer_to_<agente>`; a tool devolve `Command(goto=agent_name, graph=Command.PARENT, update={"messages": [...], "active_agent": agent_name})` (`langgraph_swarm/handoff.py:L73-L93`) **[código]**. No início de cada invocação, um roteador condicional em `START` lê `state["active_agent"]` (default `default_active_agent`) (`swarm.py:L163-L166`) **[código]** — isso permite retomar o último agente entre turnos de conversa, desde que haja checkpointer (`README.md:L119`) **[README/docs]**. `active_agent` é restringido a `Literal[nomes]` (`swarm.py:L60-L67`) **[código]**.
3. **Critério de término.** Nada no repositório: não há aresta para `END`, contador de passos, `recursion_limit` nem `max_*` — não encontrado (busca: `recursion_limit`, `END`, `max_`, `retry` em `*.py`) **[código]**. Presume-se que a execução termina quando o nó do agente retorna sem `Command` de handoff e que o limite de passos é o `recursion_limit` do LangGraph — **não inspecionado aqui** (núcleo ausente).
4. **Verificação/aceite mecânico.** Nenhum: não há validação de saída, schema, guardrail ou teste no loop — não encontrado (busca: `guardrail`, `structured`, `response_format`). A única validação é estrutural na construção do grafo (nomes de agentes, `default_active_agent` existente, lista não vazia: `swarm.py:L255-L268`) **[código]**.
5. **Controle de custo/orçamento.** Nenhum limite nem rastreamento de tokens no repositório (busca: `usage`, `token`, `max_`) **[código]**. Qualquer controle depende do núcleo LangGraph/LangChain (não inspecionado).
6. **Memória.** Memória = estado do grafo (`messages` + `active_agent`) persistido por checkpointer/store passados em `.compile()` (`README.md:L89-L119`) **[README/docs]**; capacidade, janela ou eviction não são tratados neste repositório **[código]**.
7. **Falhas/retry.** Não encontrado (busca: `retry`, `except`). `_get_field` levanta `TypeError` para estado de tipo não suportado (`handoff.py:L26-L31`) **[código]**.
8. **Poda de comunicação.** Por default **nenhuma**: o handoff envia `[*state["messages"], tool_message]` — histórico completo do agente que transfere (`handoff.py:L90`); README: "by default `create_handoff_tool` passes **full** message history" **[código]/[README/docs]**. Poda é possível apenas por customização manual (handoff próprio, chaves de mensagens privadas por agente com wrapper de transformação) (`README.md`, seções "Customizing handoff tools" e "Customizing agent implementation") **[README/docs]**.
9. **Elástico vs fixo.** Fixo: a lista de agentes é dada a `create_swarm` e compilada em nós (`swarm.py:L264-L287`) **[código]**.
10. **Benchmark custo vs qualidade.** Nenhum; os testes (`test_basic_swarm`, `test_basic_swarm_pydantic`, `tests/test_swarm.py:L48`, `L151`) são funcionais **[teste]** (não executados).

## Evidência

Nenhum código foi executado; nenhum benchmark reproduzido. Leitura estática do SHA indicado. O comportamento de runtime depende do LangGraph, cuja implementação não foi inspecionada.

## Análogo de engenharia

*Hipótese de engenharia.* Representa o braço "N agentes em malha com estado compartilhado" do Swarm Efficiency Observatory com o mínimo de lógica própria: o custo marginal de cada handoff é reenviar todo o histórico combinado. Para medir custo por tarefa aceita, o aceite e o orçamento precisariam ser adicionados como nós extras do grafo (p.ex. nó verificador com testes antes de `END`) — nada disso vem pronto.

## Hipótese testável

- H1: Num swarm de 3 agentes com histórico compartilhado (default), tokens de entrada por tarefa aceita crescem superlinearmente com o nº de handoffs (expoente ≥ 1,5 num ajuste log-log), enquanto com histórico privado por agente (wrapper do README) crescem ~linearmente; taxa de aceite não difere em mais de 3 p.p.
- H2: Sem `recursion_limit` explícito do chamador, pares de agentes com descrições sobrepostas produzem ciclos de handoff A↔B em ≥ 5% das tarefas ambíguas; medir via contagem de `active_agent` alternando ≥ 4 vezes.

## Limites/lacunas

- Núcleo LangGraph não clonado: término, `recursion_limit`, semântica de reducers (`add_messages`, deduplicação por id) e persistência não verificados.
- `examples/` não lidos.
- Não verificado o comportamento quando um agente emite múltiplos handoffs paralelos no mesmo passo.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ? nada no repo (busca `recursion_limit`/`END`/`max_`); depende do núcleo LangGraph, não inspecionado | — sem validação/guardrail (`langgraph_swarm/swarm.py`, `handoff.py`) | — nenhum limite/usage no repo | — default envia histórico completo (`langgraph_swarm/handoff.py:L90`); poda só por customização manual | — agentes fixos na construção (`langgraph_swarm/swarm.py:L277-L287`) | ? delegado a checkpointer/store do LangGraph (`README.md:L89-L119`), não inspecionado | MIT (`LICENSE`) |
