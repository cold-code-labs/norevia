---
id: oss-openai-agents-sdk
title: OpenAI Agents SDK — loop de turnos com handoffs, max_turns=10 e guardrails tripwire
area: oss
evidence: implementacao-observada
tags: [handoff, agents-as-tools, max-turns, guardrails, structured-output, input-filter, usage-tracking, retry-opt-in, sessions]
sources:
  - "https://github.com/openai/openai-agents-python/tree/27c75c5f9c5fd957d28c04fb7e9eeacaad4630a9 (commit inspecionado, clone raso em 2026-11-07)"
related: [oss-openai-swarm, oss-langgraph-swarm, oss-langgraph-supervisor, oss-crewai, oss-autogen, oss-agentprune, oss-matriz, oss-padroes]
updated: 2026-11-07
summary: Sucessor de produção do Swarm; o Runner executa turnos até haver saída final validada por schema, com limite padrão de 10 turnos, guardrails tripwire definidos pelo usuário, filtros de histórico em handoffs e contabilidade de usage sem limite rígido de tokens/custo.
---

## Identificação

- URL: https://github.com/openai/openai-agents-python
- SHA inspecionado: `27c75c5f9c5fd957d28c04fb7e9eeacaad4630a9`
- Data do commit: 2026-11-06T16:21:40+00:00
- Licença: MIT ("MIT License / Copyright (c) 2025 OpenAI"), lida em `LICENSE`.
- Escopo efetivamente lido (trechos): `src/agents/run.py` (docstring de `Runner.run` e ramos do loop), `src/agents/run_config.py`, `src/agents/agent.py` (campos de `Agent`), `src/agents/handoffs/__init__.py`, `src/agents/handoffs/history.py`, `src/agents/extensions/handoff_filters.py`, `src/agents/extensions/tool_output_trimmer.py`, `src/agents/agent_output.py`, `src/agents/run_internal/turn_resolution.py` (resolução de saída final, múltiplos handoffs), `src/agents/run_internal/model_retry.py`, `src/agents/retry.py`, `src/agents/model_settings.py`, `src/agents/guardrail.py`, `src/agents/run_error_handlers.py`, `src/agents/usage.py`, `src/agents/tool.py` (erro padrão de tool), `src/agents/memory/session_settings.py`, `src/agents/memory/openai_responses_compaction_session.py`, `src/agents/exceptions.py`; exemplos `examples/agent_patterns/{input_guardrails,output_guardrails,llm_as_a_judge,parallelization}.py` (trechos). Não lidos: `realtime/`, `voice/`, `sandbox/`, `mcp/`, a maior parte de `run_internal/`, testes (só nomes listados).

## Mecanismo

1. **Topologia de comunicação.** Dois padrões: (a) **handoff** — o agente ativo transfere o controle e o próximo agente recebe o histórico (por padrão inteiro) (`src/agents/handoffs/__init__.py:L159-L163`); (b) **agents-as-tools** — `Agent.as_tool` (`src/agents/agent.py:L630`) mantém um orquestrador central que chama subagentes como tools **[código]**. Paralelismo entre agentes só via código do usuário (`asyncio.gather` em `examples/agent_patterns/parallelization.py:L30`) **[exemplo]**.
2. **Quem decide quem age.** O LLM do agente ativo, chamando a tool `transfer_to_<nome>` (`src/agents/handoffs/__init__.py:L228-L232`); o runner troca `current_agent` em `NextStepHandoff` (`src/agents/run.py:L1543-L1555`) **[código]**. Se o modelo pedir vários handoffs no mesmo turno, só o primeiro é executado e os demais recebem "Multiple handoffs detected, ignoring this one." (`src/agents/run_internal/turn_resolution.py:L580-L590`) **[código]**. Handoffs podem ser habilitados/desabilitados dinamicamente por `is_enabled` (`src/agents/handoffs/__init__.py:L193-L195`) **[código]**.
3. **Critério de término.** Termina quando há saída final (texto sem tool calls pendentes, ou JSON válido para `output_type`) (`src/agents/run.py:L300-L304`; `src/agents/run_internal/turn_resolution.py:L1206-L1333`) **[código]**. Limite de turnos com default: `DEFAULT_MAX_TURNS = 10` (`src/agents/run_config.py:L45`), parâmetro `max_turns: int | None = DEFAULT_MAX_TURNS` (`src/agents/run.py:L287`); excedido → `MaxTurnsExceeded` salvo se houver `error_handlers["max_turns"]` (`src/agents/run.py:L1597-L1622`; `src/agents/run_error_handlers.py:L53`) **[código]**. `None` desativa o limite (`src/agents/run.py:L319-L321`) **[código]**. `tool_use_behavior` (default `"run_llm_again"`; também `"stop_on_first_tool"`, `StopAtTools`, função) permite encerrar a partir do resultado de tool (`src/agents/agent.py:L400-L420`) **[código]**. `reset_tool_choice=True` existe para que "the agent doesn't enter an infinite loop of tool usage" (`src/agents/agent.py:L422-L424`) **[código]**.
4. **Verificação/aceite mecânico.** (a) **Schema**: com `output_type` não-texto, a saída é validada via Pydantic `TypeAdapter` em modo strict (`src/agents/agent_output.py:L142-L153`; chamada em `src/agents/run_internal/turn_resolution.py:L1252`); falha → `ModelBehaviorError` levantado (sem re-prompt automático) a menos que `error_handlers["invalid_final_output"]` trate (`turn_resolution.py:L1253-L1268`; `run_error_handlers.py:L55`) **[código]**. (b) **Guardrails tripwire**: input guardrails (só do primeiro agente, só no turno 0: `src/agents/run.py:L1047-L1051`), output guardrails na saída final (`src/agents/agent.py:L382-L385`), e tool guardrails (`src/agents/tool_guardrails.py:L152`, `L181`); `tripwire_triggered=True` interrompe a execução (`src/agents/guardrail.py:L29-L32`, `L81-L83`) **[código]**. O SDK não traz guardrails prontos no núcleo: a função é do usuário e pode ser determinística — p.ex. checagem de substring `"650"` (`examples/agent_patterns/output_guardrails.py:L41-L49`) — ou LLM-based — um agente classificador (`examples/agent_patterns/input_guardrails.py:L38-L57`) **[exemplo]**. Input guardrails rodam em paralelo por default (`run_in_parallel: bool = True`, `src/agents/guardrail.py:L100`) **[código]**.
5. **Controle de custo/orçamento.** `Usage` acumula `requests`, `input_tokens`, `output_tokens`, `total_tokens` e entradas por request (`src/agents/usage.py:L196-L230`) **[código]** — é rastreamento, não limite. Não foi encontrado limite rígido de tokens/custo por run (busca: `budget`, `max_cost`, `usage_limit`, `token_budget`, `max_total_tokens` em `src/agents`, excluindo `sandbox`) **[código]**. Existem apenas: `max_turns` (default 10), `ModelSettings.max_tokens` por chamada (default `None`, `src/agents/model_settings.py:L129-L130`) e `timeout` por tentativa de chamada que explicitamente não limita o run inteiro (`src/agents/model_settings.py:L215-L220`) **[código]**.
6. **Memória.** Sessions opcionais; `SessionSettings.limit: int | None = None` — "If None, retrieves all items" (`src/agents/memory/session_settings.py:L44-L45`) **[código]**. `OpenAIResponsesCompactionSession` chama `responses.compact` da API quando há ≥ 10 itens candidatos (`DEFAULT_COMPACTION_THRESHOLD = 10`, `src/agents/memory/openai_responses_compaction_session.py:L37`, `L68-L70`, `L465`) — compactação delegada ao servidor OpenAI, não inspecionada **[código]**. Por default, sem janela/eviction.
7. **Falhas/retry.** Retry de modelo é **opt-in**: `ModelSettings.retry: ModelRetrySettings | None = None` (`src/agents/model_settings.py:L188-L189`), `max_retries: int | None = None` (`src/agents/retry.py:L213`), backoff default 0,25 s inicial, 2,0 s máx., multiplicador 2, jitter (`src/agents/run_internal/model_retry.py:L46-L49`) **[código]**. Retries internos do provedor podem ocorrer e só são desativados com `max_retries<=0` (`model_retry.py:L517-L531`) **[código]**. Erros de tool viram, por default, a mensagem "An error occurred while running the tool. Please try again." devolvida ao LLM (`src/agents/tool.py:L1997-L2002`) **[código]**.
8. **Poda de comunicação.** Handoff `input_filter` por handoff ou global (`RunConfig.handoff_input_filter`, `src/agents/run_config.py:L377-L383`) pode remover/redigir histórico; filtro pronto `remove_all_tools` remove itens de tool (`src/agents/extensions/handoff_filters.py:L33-L58`) **[código]**. `nest_handoff_history` (beta, default `False`, `run_config.py:L385-L398`) colapsa o transcript anterior em mensagem-resumo **formatada deterministicamente** (não-LLM) (`src/agents/handoffs/history.py:L321-L327`, `L386-L400`) **[código]**. `call_model_input_filter` (`run_config.py:L455-L462`) e `ToolOutputTrimmer` (janela deslizante: `recent_turns=2`, `max_output_chars=500`, `preview_chars=200`, `src/agents/extensions/tool_output_trimmer.py:L112-L114`) cortam saídas antigas de tools **[código]**. Tudo opt-in.
9. **Elástico vs fixo.** Grafo de agentes declarado em código; `is_enabled` liga/desliga handoffs em runtime, mas não cria agentes por demanda **[código]**. Não encontrado mecanismo de escala automática (busca: `spawn`, `autoscal`, `agent_pool` em `src/agents`, excluindo `sandbox`; só ocorrências de subprocessos MCP).
10. **Benchmark custo vs qualidade.** Não encontrado (busca `benchmark` retornou só docs de realtime e skills de manutenção em `.agents/skills/`). Há exemplo LLM-as-judge em loop `while True` sem limite (`examples/agent_patterns/llm_as_a_judge.py:L56`) **[exemplo]**.

## Evidência

Nenhum código foi executado; nenhum benchmark reproduzido. Leitura estática no SHA indicado; testes existentes (`tests/test_max_turns.py`, `tests/test_guardrails.py`, `tests/test_handoff_history_duplication.py`) foram apenas listados, não lidos nem executados.

## Análogo de engenharia

*Hipótese de engenharia.* É o candidato mais direto para implementar o Swarm Efficiency Observatory: `output_type` + validação strict fornecem aceite mecânico de formato; output guardrails determinísticos podem rodar os testes da tarefa como tripwire; `Usage` por request permite medir custo por tarefa aceita; `max_turns` fixa um teto comparável entre o braço "1 agente forte" e "N agentes". Falta um limite rígido de tokens — teria de ser implementado fora (p.ex. via `call_model_input_filter` ou hook que levante exceção ao exceder um orçamento).

## Hipótese testável

- H1: Em tarefas com testes automáticos, ligar `nest_handoff_history=True` (ou `remove_all_tools`) reduz tokens de entrada por tarefa aceita em ≥ 25% num arranjo triagem→especialista, com queda de aceite ≤ 2 p.p. Métrica: `Usage.input_tokens` / tarefas aceitas; taxa de aceite.
- H2: Com `max_turns=10` (default), a fração de runs encerrados por `MaxTurnsExceeded` é maior no arranjo multiagente (handoffs) que no agente único com as mesmas tools; elevar para 20 aumenta aceite menos que proporcionalmente ao custo de cauda (p95 de tokens).

## Limites/lacunas

- O loop de streaming (`run_internal/run_loop.py`) e caminhos de retomada (`RunState`) só foram vistos parcialmente.
- Política de retry do provedor (cliente `openai`) não inspecionada.
- Comportamento de `responses.compact` é do servidor; não verificável localmente.
- Não verificado se `Usage` é exposto a hooks de modo a permitir abortar por orçamento sem patch.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ `DEFAULT_MAX_TURNS = 10` → `MaxTurnsExceeded` (`src/agents/run_config.py:L45`; `src/agents/run.py:L1597-L1606`) | ✓ validação strict de `output_type` (`src/agents/agent_output.py:L142-L153`) + guardrails tripwire de código do usuário (`src/agents/guardrail.py:L29-L32`) | — só `Usage` (rastreio, `src/agents/usage.py:L196-L230`), `max_tokens` por chamada e `max_turns`; sem teto de tokens/custo por run | ✓ (opt-in) `input_filter`/`remove_all_tools`, `nest_handoff_history`, `ToolOutputTrimmer` (`src/agents/extensions/handoff_filters.py:L33`; `src/agents/extensions/tool_output_trimmer.py:L112-L114`) | — grafo fixo; só `is_enabled` dinâmico (`src/agents/handoffs/__init__.py:L193`) | ✓ (opt-in) `SessionSettings.limit` (default `None` = tudo) e compactação ≥10 itens (`src/agents/memory/openai_responses_compaction_session.py:L37`) | MIT (`LICENSE`) |
