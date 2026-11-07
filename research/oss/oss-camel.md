---
id: oss-camel
title: "CAMEL — RolePlaying de dois agentes e Workforce com coordenador LLM, recuperação por estratégia e workers criados sob demanda"
area: oss
evidence: implementacao-observada
tags: [role-playing, workforce, coordinator, task-decomposition, failure-recovery, llm-judge, dynamic-workers, agent-pool, context-summarization, apache-2-0]
sources:
  - "https://github.com/camel-ai/camel/tree/123f0c60f6efce7b420d6de2c3e046adb1f2cacc (commit inspecionado, clone raso em 2026-11-07)"
  - "CAMEL: Communicative Agents for 'Mind' Exploration of Large Language Model Society — https://arxiv.org/abs/2303.17760 (link 'Paper' no README.md:L39)"
related: [oss-autogen, oss-metagpt, oss-chatdev-macnet, oss-crewai, oss-langgraph-supervisor, oss-selfheal, oss-matriz, oss-padroes]
updated: 2026-11-07
summary: "Duas sociedades: RolePlaying (par usuário/assistente alternado, término por token de prompt e limite de turnos no chamador) e Workforce (coordenador LLM atribui subtarefas via canal central, juiz LLM com nota ≥60, até 3 tentativas e criação de workers em runtime), sem orçamento de tokens imposto por código."
---

## Identificação

- **URL:** https://github.com/camel-ai/camel
- **SHA completo:** `123f0c60f6efce7b420d6de2c3e046adb1f2cacc`
- **Data do commit:** 2026-11-02T18:15:00+08:00 (`git log -1 --format=%cI`)
- **Licença:** Apache License 2.0 — `LICENSE:L1-L2` ("Apache License / Version 2.0, January 2004"), `LICENSE:L189` ("Copyright 2023 @ CAMEL-AI.org"). Os cabeçalhos de arquivo usam "Copyright 2023-2026 @ CAMEL-AI.org" sob Apache-2.0 (`licenses/license_template.txt:L1-L13`).
- **Escopo (arquivos efetivamente lidos, em trechos):** `LICENSE`; `README.md` (L30-L52, L116, L141, L350, L470); `camel/societies/role_playing.py`; `camel/societies/workforce/{workforce.py, utils.py, single_agent_worker.py, role_playing_worker.py, task_channel.py}`; `camel/agents/chat_agent.py`; `camel/memories/blocks/chat_history_block.py`; `camel/memories/context_creators/score_based.py`; `camel/terminators/{token_limit_terminator.py, base.py}`; `camel/tasks/task.py`; `camel/prompts/ai_society.py`; `camel/utils/constants.py`; `camel/benchmarks/{gaia.py, browsecomp.py}`; `examples/ai_society/role_playing.py`. Não lidos: demais toolkits, `services/`, `apps/`, testes (só listados em `test/workforce/`).

## Mecanismo

**1. Topologia de comunicação**
- **RolePlaying:** par fixo usuário → assistente, em alternância estrita dentro de `step` — o usuário responde à mensagem do assistente e o assistente responde ao usuário (`camel/societies/role_playing.py:L661-L693`) **[código]**. Opcionalmente entra um critic (`CriticAgent` ou `Human`) que escolhe uma entre várias opções de mensagem (`role_playing.py:L516-L545`, `L490-L502`) **[código]**.
- **Workforce:** estrela hierárquica. Um `TaskChannel` central guarda os pacotes de tarefa num dict, indexados por status e com filas por assignee e por publisher (`camel/societies/workforce/task_channel.py:L85-L100`). O Workforce publica uma tarefa (`_post_task`, `workforce.py:L4146`) e espera o retorno (`_get_returned_task`, `workforce.py:L4362-L4396`) **[código]**. Os filhos podem ser `SingleAgentWorker`, `RolePlayingWorker` ou outro `Workforce` aninhado (`workforce.py:L3031`, `L3094`, `L3172-L3193`) **[código]**. As subtarefas têm dependências declaradas pelo coordenador (`TaskAssignment.dependencies`, `utils.py:L176-L181`), o que forma um DAG de tarefas **[código]**.
- Com `share_memory=True` (padrão `False`), coordenador, planner e SingleAgentWorkers recebem o histórico consolidado de todos (`workforce.py:L1362-L1380`; docstring `L224-L232`) **[código]**. É broadcast, o oposto de poda.

**2. Quem decide quem age**
- **RolePlaying:** a ordem é fixa no código (usuário, depois assistente) e não há seletor (`role_playing.py:L661-L693`) **[código]**.
- **Workforce:**
  - O *Task Planner Agent* (LLM) decompõe a tarefa (`_decompose_task`, `workforce.py:L1549-L1575`). Em modo `PIPELINE` não há decomposição (`L1571-L1572`) **[código]**.
  - O *Coordinator Agent* (LLM) atribui as subtarefas aos workers por ID (`_call_coordinator_for_assignment`, `workforce.py:L3768`) **[código]**.
  - Uma IDs inválidos o código reage de forma determinística: separa as atribuições inválidas (`_validate_assignments`, `L3883-L3905`), tenta de novo e, como fallback, **cria um worker novo** (`L3907-L3931`, `L3933+`) **[código]**.

**3. Critério de término**
- **RolePlaying:** a classe não tem laço. `step` só devolve `terminated` (`role_playing.py:L662-L706`). O laço e o limite ficam com o chamador:
  - `RolePlayingWorker`: `chat_turn_limit=20` por padrão, `while n < self.chat_turn_limit`, e para se a mensagem do usuário contém `"CAMEL_TASK_DONE"` (`role_playing_worker.py:L74`, `L149`, `L190`) **[código]**.
  - `Workforce.add_role_playing_worker`: `chat_turn_limit=3` (`workforce.py:L3102`) **[código]**.
  - Exemplo: `chat_turn_limit=50` (`examples/ai_society/role_playing.py:L20`, `L50`, `L81`) **[exemplo]**.
  - O token `<CAMEL_TASK_DONE>` é instrução de prompt (`camel/prompts/ai_society.py:L106-L107`) **[código]**, ou seja, o término é autodeclarado pelo LLM.
- **ChatAgent:**
  - `max_iteration=None`: sem limite de chamadas ao modelo por step (`chat_agent.py:L432-L435`, `L522`, `L3120-L3125`) **[código]**.
  - `response_terminators` e `stop_event` são opcionais (`L520`, `L524`, `L3062-L3071`, `L3132-L3155`) **[código]**.
  - `step_timeout` usa `Constants.TIMEOUT_THRESHOLD = None` (`chat_agent.py:L532`; `camel/utils/constants.py:L40`) **[código]**.
- **Workforce:**
  - O laço principal roda enquanto houver tarefas pendentes ou em voo e não houver pedido de parada (`workforce.py:L5294-L5298`) **[código]**.
  - Falha permanente: `max_retries=3` por tarefa (`utils.py:L281-L285`) e `halt_on_max_retries=True` interrompe o Workforce em `AUTO_DECOMPOSE` (`utils.py:L294-L297`; `workforce.py:L4693-L4720`) **[código]**.
  - Timeout de espera por tarefa: 600 s (`workforce.py:L129`, `L355`, `L4370-L4375`) **[código]**.
  - Há também `stop_gracefully` / `stop_immediately` (`L2098`, `L2171`) **[código]**.

**4. Verificação/aceite mecânico**
- O aceite de qualidade é um **juiz LLM**. `_analyze_task(..., for_failure=False)` (`workforce.py:L1645-L1700`, chamado em `L5522-L5523`) produz `TaskAnalysisResult`. A propriedade `quality_sufficient` exige `quality_score >= 60` e nenhuma estratégia de recuperação (`utils.py:L405-L417`) **[código]**. O limiar é determinístico, mas a nota vem do LLM.
- A única checagem mecânica é superficial: `is_task_result_insufficient` → `validate_task_content` rejeita resultado `None`, vazio ou com frases de falha ("i cannot", "task failed", prefixo "error"…) (`camel/tasks/task.py:L148-L168`, `L85-L137`; uso em `single_agent_worker.py:L577-L582`) **[código]**. Não executa testes nem valida o conteúdo contra uma especificação.
- **Aceite degradado:** quando a tarefa atinge `max(1, max_retries-1)` falhas de qualidade, ela é **marcada como concluída mesmo com nota baixa** (`workforce.py:L5534-L5560`) **[código]**.
- Os workers criados dinamicamente recebem `CodeExecutionToolkit` como ferramenta (`workforce.py:L4348-L4353`) **[código]**. É capacidade do agente, não gate de aceite.
- **Benchmarks no repo:**
  - GAIA compara a resposta por match exato normalizado (`camel/benchmarks/gaia.py:L385-L424`) **[código]**.
  - BrowseComp usa grader LLM (`camel/benchmarks/browsecomp.py:L163-L171`, `L714-L715`) **[código]**.

**5. Controle de custo/orçamento técnico**
- **Não há limite rígido de tokens, custo ou chamadas que pare a execução por padrão.**
- `TokenLimitTerminator` existe (`camel/terminators/token_limit_terminator.py:L19-L52`), mas não é instanciado fora de `camel/terminators/` (busca: `TokenLimitTerminator` em `camel/`) **[código]**.
- `token_limit` do ChatAgent define a janela de contexto e dispara sumarização, não interrupção (`chat_agent.py:L402-L405`, `L556-L564`, `L1032-L1066`) **[código]**.
- O caminho `_step_terminate(..., "max_tokens_exceeded")` só roda se `_get_context_with_summarization` lançar `RuntimeError` (`chat_agent.py:L3025-L3033`). Nos context creators/memórias não achei quem o lance (busca: `RuntimeError` em `camel/memories/`, só `memanto.py:L61`) **[código]**. Ver lacunas.
- `on_request_usage` é callback de medição. Exceções do callback são capturadas e só geram log (`chat_agent.py:L3533-L3558`), então não servem como freio **[código]**.
- No Workforce, o uso de tokens por tarefa é **registrado** em eventos e no logger (`workforce.py:L4944-L4992`; `workforce_logger.py:L229-L243`) **[código]**. É tracking, não orçamento.
- Limites que existem mas não são orçamento: `max_retries=3`, timeout de 600 s, `chat_turn_limit`.

**6. Memória**
- `ChatHistoryMemory(context_creator, window_size=message_window_size)` (`chat_agent.py:L560-L569`). `message_window_size=None` por padrão (`L509`), e então não há janela **[código]**.
- Com janela, a recuperação preserva a mensagem de sistema e devolve as últimas `window_size` (`chat_history_block.py:L76-L118`). O armazenamento continua completo, só a visão é truncada **[código]**.
- `ScoreBasedContextCreator`: "token_limit … No longer used to filter records" (`score_based.py:L35-L36`). Só ordena e conta tokens (`L112-L171`) **[código]**.
- **Compressão por sumarização LLM ativa por padrão:** `summarize_threshold=50`, ou seja, 50 % do `token_limit` (`chat_agent.py:L510`, `L590-L601`) **[código]**. Note que o docstring diz default `None` (`L398-L401`), divergente do código.
- Ao estourar o limiar: `summarize()`, depois `clear_memory()`, depois reinsere os resumos anteriores, o novo resumo e a última mensagem do usuário (`L1054-L1064`, `L1146-L1200`) **[código]**.
- Quando os resumos passam de `token_limit * summary_window_ratio` (0,6, `L536`), há compressão total (`L1043-L1052`) **[código]**.
- Se `num_tokens > token_limit`, a função retorna **sem** sumarizar (`L1038-L1039`) **[código]**.
- Agentes do pool fazem `reset()` a cada empréstimo, com memória limpa por tarefa (`single_agent_worker.py:L128-L129`) **[código]**.

**7. Falhas/retry**
- **LLM:** retry só para `RateLimitError` (OpenAI/Anthropic), com `retry_attempts=3` e backoff exponencial com jitter, teto de 60 s (`chat_agent.py:L161-L163`, `L530-L531`, `L3666-L3690`). Outras exceções sobem **[código]**.
- **Tarefa (Workforce):** cada falha incrementa `failure_count` (`workforce.py:L4651`). Um LLM escolhe a estratégia (`_analyze_task(for_failure=True)`, `L4836`). Se o parse falhar, o fallback é `RETRY` (`L1680-L1686`) **[código]**.
- Estratégias disponíveis (`utils.py:L211-L218`; aplicadas em `workforce.py:L1828-L2016`) **[código]**:
  - `RETRY`: mesmo worker.
  - `REPLAN`: o LLM reescreve o conteúdo da tarefa.
  - `REASSIGN`: outro worker.
  - `DECOMPOSE`: novas subtarefas.
  - `CREATE_WORKER`: worker novo.
- `enabled_strategies=[]` desliga a recuperação e também pula a avaliação de qualidade (`utils.py:L287-L292`; `workforce.py:L5500-L5520`) **[código]**.
- Em modo `PIPELINE`, a falha definitiva passa o erro adiante às tarefas dependentes sem parar o fluxo (`workforce.py:L4700-L4713`) **[código]**.
- Não achei limite explícito de profundidade de decomposição recursiva (busca: `max_depth`, `MAX_DEPTH`; só `task.get_depth()` como informação ao prompt em `workforce.py:L1765`).

**8. Poda de comunicação**
- Não há poda de arestas ou agentes por desempenho.
- Opt-in `prune_tool_calls_from_memory=False` remove mensagens de tool call do histórico do agente após cada step (`chat_agent.py:L449-L452`, `L528`, `L3183-L3185`) **[código]**.
- Opt-in `enable_snapshot_clean` remove marcadores de DOM de saídas antigas (`L453-L457`) **[código]**.
- RolePlaying com critic reduz N opções a uma mensagem (`role_playing.py:L540-L542`) **[código]**. É seleção, não poda de topologia.

**9. Elástico vs fixo**
- **Elástico, só para crescer.** O Workforce acrescenta `SingleAgentWorker` em runtime de duas formas: pela estratégia `CREATE_WORKER` e como fallback de atribuição inválida (`workforce.py:L2010-L2016`, `L3907-L3931`, `L4186-L4332` com `self._children.append(new_node)` em `L4321`). O papel e o prompt do worker novo são gerados por LLM (`CREATE_NODE_PROMPT`, `L4197-L4203`) **[código]**.
- Não achei teto de workers nem remoção de workers (busca: `max_worker`, `max_children`, `_children.remove`).
- Dentro de cada `SingleAgentWorker`, o `AgentPool` clona agentes por demanda (`single_agent_worker.py:L114`, `L131-L135`) **[código]**:
  - Com `auto_scale=True` (padrão, `L79`, `L241`), cria clones **mesmo acima de `max_size`**: `len(in_use) < max_size or self.auto_scale` (`L133`). `max_size` (10, `workforce.py:L130`) só limita os ociosos devolvidos ao pool (`single_agent_worker.py:L151-L160`).
  - Clones ociosos há mais de 180 s são removidos (`L77-L87`, `L162-L183`).

**10. Benchmark custo vs qualidade no repo**
- Ausente como comparação custo × qualidade.
- `camel/benchmarks/browsecomp.py:L547-L625` aceita `ChatAgent`, `RolePlaying` ou `Workforce` como `pipeline_template` intercambiável **[código]**. É o encaixe mais próximo de "1 vs N", mas não registra tokens nem custo (0 ocorrências de `token|cost|usage` em `browsecomp.py` e `gaia.py`).
- O README fala em "Simulate up to 1M agents" e "millions of agents" (`README.md:L116`, `L141`) **[README/docs]**. É relato dos autores; não verifiquei no código.

## Evidência

Nenhum código foi executado; nenhum benchmark reproduzido. Todas as afirmações vêm de leitura estática no SHA `123f0c60f6efce7b420d6de2c3e046adb1f2cacc`. As alegações de escala do README (1M agentes) e o paper (arXiv 2303.17760) não foram verificados. Os testes em `test/workforce/` foram só listados, não lidos.

## Análogo de engenharia

*(hipótese)* No Swarm Efficiency Observatory, o CAMEL dá dois braços prontos sobre o mesmo harness:
- **"1 agente forte":** `ChatAgent`.
- **"N agentes":** `RolePlaying` ou `Workforce`.

O `browsecomp.py` já troca esses três como `pipeline_template`. Para medir custo por tarefa aceita faltam duas peças:
- **Medição externa de tokens:** o Workforce só registra; o callback `on_request_usage` dá a medição por requisição.
- **Aceite mecânico externo:** o juiz interno (nota ≥60) aceita resultados ruins quando os retries acabam.

O Workforce é um bom objeto de estudo do "custo da autorrecuperação". Cada falha ou nota baixa custa uma chamada de análise LLM e pode criar workers novos sem teto. Isso deve aparecer como custo extra frente ao agente único.

## Hipótese testável

1. **H1 (custo da recuperação):** em tarefas com verificador determinístico (ex.: testes unitários), o `Workforce` com `enabled_strategies=None` gasta pelo menos 2× os tokens por tarefa *aceita pelo verificador externo* em relação a um único `ChatAgent` com o mesmo modelo. A taxa de aceite não sobe na mesma proporção.
   - **Métrica:** tokens totais (via `on_request_usage`) ÷ nº de tarefas que passam nos testes externos.
   - **Falsificação:** razão < 2× ou ganho de aceite proporcional.
2. **H2 (concordância do juiz interno):** a fração de tarefas que o Workforce marca DONE (nota ≥60 ou retry esgotado) e que falha no verificador externo é ≥ 20 %.
   - **Métrica:** falsos aceites ÷ tarefas DONE.

## Limites/lacunas

- Não li `_handle_completed_task` por inteiro (`workforce.py:L4941-L5100`), nem o laço `_listen_to_channel` completo (`L5282-L5800`), nem `_post_ready_tasks`. Pode haver outros caminhos de término ou de aceite.
- **Caminho `max_tokens_exceeded` aparentemente vestigial:** não achei quem lance `RuntimeError` em `memory.get_context()`. Pode haver uma memória alternativa (ex.: `VectorDB`, `memanto`) que o faça.
- O docstring de `summarize_threshold` (default `None`) diverge da assinatura (`50`), e o de `step_timeout` diverge do default efetivo. Vale o código.
- Não verifiquei se `REPLAN`/`DECOMPOSE` em cadeia podem gerar recursão ilimitada na prática: não há teto explícito encontrado, mas cada subtarefa tem seu próprio `failure_count`.
- O `RolePlaying` com critic e o modo `Human` não foram avaliados em profundidade.
- Integrações externas (MCP, `services/`, Eigent) ficaram fora do escopo.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ — Workforce termina sem pendências/stop (`workforce.py:L5294-L5298`), `max_retries=3`+`halt_on_max_retries=True` (`utils.py:L281-L297`), timeout 600 s (`workforce.py:L129`); RolePlaying só via `chat_turn_limit` no chamador (`role_playing_worker.py:L74,L149`) e token de prompt `CAMEL_TASK_DONE` | — — juiz LLM nota ≥60 (`utils.py:L405-L417`); checagem mecânica só de vazio/frases de falha (`tasks/task.py:L85-L137`); aceita nota baixa no limite de retry (`workforce.py:L5534-L5560`) | — — tokens só registrados (`workforce.py:L4944-L4992`); `TokenLimitTerminator` não ligado; `max_iteration=None` (`chat_agent.py:L522`); limites só de retries/turnos/tempo | ✓ (fraco, opt-in) — só histórico intra-agente: `prune_tool_calls_from_memory=False` (`chat_agent.py:L528,L3183-L3185`); sem poda de arestas/agentes; `share_memory` faz broadcast | ✓ — `CREATE_WORKER`/fallback criam workers em runtime (`workforce.py:L2010-L2016,L3907-L3931,L4321`); `AgentPool` clona sob demanda e remove ociosos >180 s (`single_agent_worker.py:L133,L162-L183`); sem teto/remoção de workers | ✓ — sumarização LLM por padrão a 50 % do `token_limit` com `clear_memory` (`chat_agent.py:L510,L1032-L1066,L1146-L1172`); `window_size` opt-in (`chat_history_block.py:L76-L118`) | Apache-2.0 (`LICENSE:L1-L2,L189`) |
