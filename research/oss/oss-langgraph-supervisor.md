---
id: oss-langgraph-supervisor
title: LangGraph Supervisor — supervisor ReAct em estrela com output_mode last_message como poda padrão
area: oss
evidence: implementacao-observada
tags: [supervisor, hierarquia, langgraph, handoff, poda-de-historico, output-mode, parallel-tool-calls, send]
sources:
  - "https://github.com/langchain-ai/langgraph-supervisor-py/tree/88859b34017ac3569bbd4a3092c7e77593a0a960 (commit inspecionado, clone raso em 2026-11-07)"
related: [oss-langgraph-swarm, oss-openai-agents-sdk, oss-openai-swarm, oss-crewai, oss-agentprune, oss-metagpt, oss-matriz, oss-padroes]
updated: 2026-11-07
summary: Biblioteca fina sobre LangGraph que monta um supervisor ReAct em topologia estrela (supervisor → worker → supervisor), com handoff por tools, fan-out paralelo opcional via Send e poda padrão das saídas dos workers para a última mensagem; término e limites dependem do núcleo LangGraph, não inspecionado.
---

## Identificação

- URL: https://github.com/langchain-ai/langgraph-supervisor-py
- SHA inspecionado: `88859b34017ac3569bbd4a3092c7e77593a0a960`
- Data do commit: 2026-07-14T23:32:51-07:00
- Licença: MIT ("MIT License / Copyright (c) 2025 LangChain, Inc."), lida em `LICENSE`.
- Versão declarada: `0.0.31` (`pyproject.toml`) **[código]**.
- Status: README recomenda usar o "supervisor pattern directly via tools" em vez desta biblioteca na maioria dos casos (`README.md:L3`) **[README/docs]**.
- Escopo efetivamente lido: `langgraph_supervisor/supervisor.py` (inteiro, 469 linhas), `langgraph_supervisor/handoff.py` (L40-L213), `README.md` (Features, Message History Management, Multi-level Hierarchies, Message Forwarding), nomes de testes em `tests/`. Não lidos: `agent_name.py` (só via chamada), corpo dos testes. **Núcleo `langgraph` (incl. `create_react_agent`, `ToolNode`, `Send`, `recursion_limit`) não clonado → não inspecionado.**

## Mecanismo

1. **Topologia de comunicação.** Estrela: `START → supervisor` (`langgraph_supervisor/supervisor.py:L456`), supervisor pode ir para qualquer worker ou `END` (`destinations=tuple(agent_names) + (END,)`, `L455`), e cada worker tem aresta fixa de volta ao supervisor (`L467`) **[código]**. Workers não falam entre si diretamente. Hierarquia multinível: um supervisor compilado é um `Pregel` e pode ser passado como "agente" de outro supervisor (`create_supervisor(agents: list[Pregel], ...)`, `L211-L212`; exemplo em `README.md`, seção "Multi-level Hierarchies") **[código]/[README/docs]**.
2. **Quem decide quem age.** O LLM do supervisor (um agente ReAct criado com `create_react_agent`, `supervisor.py:L443-L452`) escolhendo tools `transfer_to_<agente>` geradas automaticamente para todos os workers (`supervisor.py:L175-L186`; `langgraph_supervisor/handoff.py:L82-L86`) **[código]**. A tool retorna `Command(goto=agent_name, graph=Command.PARENT, ...)` (`handoff.py:L122-L126`) **[código]**. **Paralelismo**: `parallel_tool_calls: bool = False` por default (`supervisor.py:L222`), aplicado via `bind_tools` quando o modelo suporta (`L432-L438`; exclusões `{"o3-mini", "o3", "o4-mini"}` em `L45`) **[código]**. Com handoffs paralelos, cada tool emite `Send(agent_name, ...)` para fan-out (`handoff.py:L100-L115`) **[código]**.
3. **Critério de término.** Termina quando o supervisor encerra sem handoff (destino `END` declarado em `supervisor.py:L455`) **[código]**; o loop ReAct do supervisor e o limite de passos (`recursion_limit`) são do núcleo LangGraph — **não inspecionado**. Não há `max_*`, contador ou `recursion_limit` no repo (busca: `recursion_limit`, `retry`, `usage`, `max_` em `langgraph_supervisor/`) **[código]**. `create_forward_message_tool` retorna `Command(goto="__end__")`, com comentário "NOTE: this does nothing." (`handoff.py:L204-L211`) **[código]**.
4. **Verificação/aceite mecânico.** Não há validação própria. `response_format` (schema Pydantic/JSON/TypedDict) é repassado a `create_react_agent` para gerar `structured_response` (`supervisor.py:L217-L219`, `L251-L272`, `L449`) — validação ocorre no núcleo, não inspecionada **[código]/[README/docs]**. `post_model_hook` é ponto de extensão "useful for implementing ... guardrails, validation" (`supervisor.py:L305-L309`, docstring) — sem implementação pronta **[código]**. Validações estruturais na construção: nomes únicos e definidos (`L409-L422`), handoffs customizados cobrindo todos os workers (`L164-L170`) **[código]**.
5. **Controle de custo/orçamento.** Nenhum limite nem rastreamento de tokens no repo **[código]**. Mecanismos que reduzem tokens sem impor teto: `output_mode="last_message"` (item 8) e `create_forward_message_tool`, cuja docstring diz que "can save some tokens" (`handoff.py:L155-L160`) **[código]**.
6. **Memória.** Estado do grafo (`messages` com reducer `add_messages`, `supervisor.py:L205-L208`) persistido por checkpointer/store do LangGraph (`README.md`, "Adding Memory") **[README/docs]**. Sem janela/eviction neste repo; `pre_model_hook` é o ponto documentado para trimming/sumarização (`supervisor.py:L273-L304`, docstring) **[código]**. Para workers `RemoteGraph`, um `thread_id` derivado por `uuid5(thread_id, agent.name)` isola o estado (`L102-L108`) **[código]**.
7. **Falhas/retry.** Não encontrado no repo (busca: `retry`). O tratamento de erro de tools é herdado do `ToolNode` de entrada (`handle_tool_errors=input_tool_node._handle_tool_errors`, `supervisor.py:L192-L198`) — semântica no núcleo, não inspecionada **[código]**.
8. **Poda de comunicação.** Mecanismo central: `output_mode: OutputMode = "last_message"` por default (`supervisor.py:L225`). Em `last_message` só a última mensagem do worker volta ao estado compartilhado (ou as 2 últimas se a última for `ToolMessage`); em `full_history` tudo volta (`supervisor.py:L77-L91`) **[código]**. `add_handoff_messages=False` remove do histórico o par AIMessage/ToolMessage do handoff (`handoff.py:L116-L121`) e, em handoff paralelo, `_remove_non_handoff_tool_calls` filtra tool calls não relacionadas (`handoff.py:L42-L51`, `L101-L109`) **[código]**. Atenção: o **input** do worker é o estado inteiro (`agent.invoke(state, ...)`, `supervisor.py:L103-L104`) — a poda padrão é só no retorno **[código]**.
9. **Elástico vs fixo.** Conjunto de workers fixo na construção (`supervisor.py:L457-L467`) **[código]**. Fan-out paralelo via `Send` é dinâmico em número de chamadas por passo, mas limitado aos workers pré-declarados (`handoff.py:L110-L115`) **[código]**.
10. **Benchmark custo vs qualidade.** Nenhum no repo; testes funcionais (`tests/test_supervisor.py:L165`, `L333`, `L428`) **[teste]** (não executados).

## Evidência

Nenhum código foi executado; nenhum benchmark reproduzido. Leitura estática no SHA indicado. A recomendação de preferir supervisor manual via tools é relato dos autores (`README.md:L3`).

## Análogo de engenharia

*Hipótese de engenharia.* É o braço "orquestrador central + N workers" do Swarm Efficiency Observatory, com uma alavanca de poda explícita (`output_mode`). Permite isolar o efeito de **poda de retorno** sobre custo por tarefa aceita mantendo topologia e modelos fixos. Como o worker recebe o estado inteiro, a economia de `last_message` é apenas sobre as chamadas subsequentes do supervisor; um verificador determinístico precisaria entrar como `post_model_hook` ou nó extra.

## Hipótese testável

- H1: Em tarefas com testes automáticos e ≥ 3 delegações, `output_mode="last_message"` reduz tokens de entrada do supervisor por tarefa aceita em ≥ 30% vs `full_history`, com perda de aceite ≤ 3 p.p. Métrica: tokens de entrada (supervisor) / tarefa aceita.
- H2: `parallel_tool_calls=True` reduz latência de wall-clock em tarefas decomponíveis, mas aumenta custo por tarefa aceita (≥ 10%) por delegações redundantes; medir nº de `Send` por tarefa e aceite.

## Limites/lacunas

- `create_react_agent`, `ToolNode`, `Send`, `recursion_limit` e validação de `response_format` são do núcleo LangGraph, não inspecionado.
- Semântica de merge dos `Send` paralelos e do reducer `add_messages` não verificada.
- Não verificado se `full_history` duplica mensagens já presentes no estado (depende de deduplicação por id no reducer).

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ? supervisor declara destino `END` (`langgraph_supervisor/supervisor.py:L455`), mas limite de passos é do núcleo LangGraph (não inspecionado) | ? `response_format` repassado ao núcleo (`supervisor.py:L449`); `post_model_hook` só ponto de extensão | — nenhum limite/usage no repo | ✓ `output_mode="last_message"` default (`supervisor.py:L225`, `L77-L91`); `add_handoff_messages=False` (`handoff.py:L116-L121`) | — workers fixos; `Send` paralelo só entre pré-declarados (`handoff.py:L110-L115`) | ? delegado a checkpointer/`pre_model_hook` (`supervisor.py:L273-L304`), não implementado no repo | MIT (`LICENSE`) |
