---
id: oss-openai-swarm
title: OpenAI Swarm — handoff como função que retorna Agent num loop único de chat completions
area: oss
evidence: implementacao-observada
tags: [handoff, orquestracao-leve, loop-de-agente, context-variables, educacional, sem-orcamento]
sources:
  - "https://github.com/openai/swarm/tree/6af0b4caf37dca4526dfd98e9fbd8ce36e7eeb22 (commit inspecionado, clone raso em 2026-11-07)"
related: [oss-openai-agents-sdk, oss-langgraph-swarm, oss-langgraph-supervisor, oss-crewai, oss-autogen, oss-matriz, oss-padroes]
updated: 2026-11-07
summary: Biblioteca educacional mínima (~420 linhas) em que um único loop alterna o agente ativo quando uma tool retorna outro Agent, encerrando quando não há tool calls; não há orçamento, retry, validação de saída nem poda de histórico.
---

## Identificação

- URL: https://github.com/openai/swarm
- SHA inspecionado: `6af0b4caf37dca4526dfd98e9fbd8ce36e7eeb22`
- Data do commit (`git log -1 --format=%cI`): 2026-04-15T13:10:28-04:00
- Licença: MIT ("MIT License / Copyright (c) 2024 OpenAI"), lida em `LICENSE`.
- Status declarado: `README.md:L3` "Swarm (experimental, educational)"; `README.md:L6-L8` afirma que foi substituído pelo OpenAI Agents SDK e recomenda migrar para uso em produção **[README/docs]**.
- Escopo efetivamente lido: `swarm/core.py` (inteiro, 292 linhas), `swarm/types.py` (inteiro), `swarm/util.py` (inteiro), `README.md` (trechos via busca), `tests/test_core.py` (nomes de testes), `examples/triage_agent/evals.py` e `evals_util.py` (início). Não lidos: `swarm/repl/`, demais exemplos.

## Mecanismo

1. **Topologia de comunicação.** Um único histórico linear compartilhado; em cada iteração apenas o `active_agent` é chamado com `system = instructions` + histórico inteiro (`swarm/core.py:L41-L47`) **[código]**. O grafo de handoffs é implícito: qualquer função de um agente pode devolver outro `Agent` (`swarm/core.py:L76-L80`) **[código]**. Não há broadcast nem paralelismo entre agentes; só tool calls paralelas dentro de um turno (`parallel_tool_calls: bool = True`, `swarm/types.py:L20`; repassado em `swarm/core.py:L66-L67`) **[código]**.
2. **Quem decide quem age.** O LLM do agente ativo, ao escolher chamar uma função que retorna `Agent`/`Result(agent=...)`; o loop troca `active_agent` (`swarm/core.py:L134-L135`, `L285-L286`) **[código]**. Se várias tool calls do mesmo turno retornarem agentes, prevalece o último processado (sobrescrita em `L134-L135`) **[código]**.
3. **Critério de término.** (a) mensagem do modelo sem tool calls ou `execute_tools=False` → `break` (`swarm/core.py:L275-L277`; streaming `L198-L200`) **[código]**; (b) `max_turns`, cujo default é infinito: `max_turns: int = float("inf")` (`swarm/core.py:L239`, também `L146`) **[código]**. Observação: a condição `len(history) - init_len < max_turns` (`swarm/core.py:L257`) conta **mensagens** acrescentadas (assistente + mensagens de tool), não turnos, embora o README descreva "conversational turns" (`README.md:L133`) **[código]/[README/docs]**.
4. **Verificação/aceite mecânico.** Não há validação de saída final, schema de output nem guardrails no núcleo — não encontrado no código inspecionado (busca: `guardrail`, `validate`, `output_type`, `schema` em `swarm/`). A única checagem é estrutural: tool inexistente vira mensagem `"Error: Tool {name} not found."` (`swarm/core.py:L103-L113`) **[código]**. Os evals de exemplo usam LLM-judge (`gpt-4o` via `instructor`, `examples/triage_agent/evals_util.py:L14-L23`) e asserts determinísticos sobre o nome da tool chamada (`examples/triage_agent/evals.py:L44-L48`) **[exemplo]**.
5. **Controle de custo/orçamento.** Nenhum limite de tokens/custo/chamadas; nenhum rastreamento de usage — não encontrado (busca: `usage`, `token`, `cost`, `budget`). Único freio é `max_turns` (default ∞) **[código]**.
6. **Memória.** `context_variables` (dict) copiado por `deepcopy` no início (`swarm/core.py:L253`) e atualizado por `Result.context_variables` (`swarm/core.py:L133`, `L284`) **[código]**; o histórico cresce sem limite e é reenviado inteiro a cada chamada (`swarm/core.py:L47`, `L271-L273`, `L283`) **[código]**. README: "stateless between calls" (`README.md:L81`) **[README/docs]**. Sem janela, sumarização ou eviction.
7. **Falhas/retry.** Sem retry: a chamada `self.client.chat.completions.create(**create_params)` (`swarm/core.py:L69`) não tem tratamento; `json.loads` dos argumentos (`L114`) e a execução da função (`L122`) não estão em `try`, logo exceções propagam e abortam o run **[código]**. Só a conversão do resultado para `str` tem `try` e relança `TypeError` (`swarm/core.py:L82-L87`) **[código]**.
8. **Poda de comunicação.** Nenhuma; o histórico completo é sempre enviado ao próximo agente (`swarm/core.py:L47`). `context_variables` são ocultados do schema das tools (`swarm/core.py:L51-L56`) — isso é ocultação de parâmetro, não poda de histórico **[código]**.
9. **Elástico vs fixo.** Conjunto de agentes definido pelo usuário em Python; um agente pode retornar um `Agent` construído dinamicamente, mas não há mecanismo de dimensionamento por demanda nem execução simultânea de N agentes **[código]** (inferência a partir de `swarm/core.py:L76-L80`).
10. **Benchmark custo vs qualidade.** Nenhum. Há evals de exemplo (LLM-judge + asserts de roteamento) e pasta `logs/` com sessões JSON de 2024 não analisadas **[exemplo]**.

## Evidência

Nenhum código foi executado; nenhum benchmark reproduzido. Todas as afirmações vêm de leitura estática no SHA indicado; números e status vêm do README (relato dos autores).

## Análogo de engenharia

*Hipótese de engenharia.* No Swarm Efficiency Observatory, o Swarm serve como **linha de base mínima de "N agentes por handoff"**: mesmo modelo, mesmo histórico, troca de prompt/tools. Como o histórico inteiro é reenviado a cada chamada e não há poda, o custo por tarefa aceita deve crescer aproximadamente com (nº de chamadas × tamanho do histórico), sem ganho de paralelismo. Útil como controle contra "1 agente forte com todas as tools", isolando o efeito puro da especialização de instruções.

## Hipótese testável

- H1: Em tarefas verificáveis (ex.: roteamento + resposta com testes), um arranjo Swarm com triagem + 2 especialistas consome ≥ 20% mais tokens de entrada por tarefa aceita que um agente único com as mesmas tools, sem aumento estatisticamente significativo da taxa de aceite. Métrica: tokens de entrada/tarefa aceita, taxa de aceite (teste automático), n ≥ 100 tarefas.
- H2: Com `max_turns` infinito (default), uma fração não-nula de execuções com tools defeituosas não termina dentro de um limite externo de wall-clock; impor `max_turns` finito reduz o custo de cauda (p95 de tokens) sem reduzir o aceite.

## Limites/lacunas

- `swarm/repl/repl.py` e exemplos complexos (airline, support_bot) não lidos.
- Comportamento real do loop com modelos atuais não verificado (nada executado).
- Ambiguidade documentação×código em `max_turns` (mensagens vs turnos) identificada apenas por leitura.
- Projeto declarado como substituído (`README.md:L6`); não representa prática de produção.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ (só como config) — `max_turns` é parâmetro de `run` mas default `float("inf")` (`swarm/core.py:L239`); parada natural depende do LLM não emitir tool calls (`L275-L277`) | — sem validação de saída; evals só em exemplos (LLM-judge) | — nenhum limite/usage; só `max_turns` (∞) | — histórico completo sempre reenviado (`L47`) | — agentes fixos definidos em código | — histórico sem limite; `context_variables` dict livre | MIT (`LICENSE`) |
