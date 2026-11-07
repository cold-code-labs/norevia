---
id: oss-autogen
title: "AutoGen — group chat com gerente central e condições de término componíveis"
area: oss
evidence: implementacao-observada
tags: [group-chat, orquestrador-central, termination-conditions, selector-llm, handoff, magentic-one, ledger, replanejamento, contexto-limitado, projeto-arquivado]
sources:
  - "https://github.com/microsoft/autogen/tree/d07c667a3239ea4ab7af62a53b0f4ff205a1f23d (commit inspecionado, clone raso em 2026-11-07)"
related: [oss-matriz, oss-padroes, oss-openai-swarm, oss-openai-agents-sdk, oss-langgraph-swarm, oss-langgraph-supervisor, oss-crewai, oss-camel, oss-metagpt, oss-chatdev-macnet, oss-moa]
updated: 2026-11-07
summary: "No AutoGen (AgentChat), um gerente central escolhe quem fala: em rodízio, por LLM, por handoff ou por ledger com replanejamento. O término vem de condições componíveis (&, |); o limite de tokens é verificado só depois de cada turno, sobre o uso já relatado. Por padrão a equipe não tem aceite mecânico, e o repositório está arquivado."
---

# AutoGen (AgentChat): gerente central e condições de término componíveis

## Identificação

- **URL:** https://github.com/microsoft/autogen
- **SHA inspecionado:** `d07c667a3239ea4ab7af62a53b0f4ff205a1f23d`
- **Data do commit:** 2026-10-28T14:45:27+00:00 (`git log -1 --format=%cI`)
- **Licença:** licença dupla, conforme os arquivos lidos.
  - `LICENSE` é a Creative Commons Attribution 4.0 International (`LICENSE:L1`).
  - `LICENSE-CODE` é a MIT License, "Copyright (c) Microsoft Corporation." (`LICENSE-CODE:L1-L3`).
  - O README explica a divisão: CC-BY-4.0 cobre a documentação e o conteúdo, e MIT cobre o código (`README.md:L229-L231`) **[README/docs]**.
- **Status do projeto:** o README marca o projeto como arquivado. **[README/docs]**
  - Selo "status-archived" e o aviso "Project archived and no longer maintained" (`README.md:L14-L19`).
  - Novos usuários devem usar o Microsoft Agent Framework (`README.md:L29-L31`).
  - O README também se descreve como em "maintenance mode", aceitando só correções de bug, patches de segurança e documentação (`README.md:L222`).
- **Escopo do que foi lido** (os caminhos de `python/packages/` aparecem abreviados ao longo do card):
  - **Equipes** (`autogen-agentchat/src/autogen_agentchat/teams/_group_chat/`):
    - `_base_group_chat_manager.py` (inteiro);
    - `_round_robin_group_chat.py` (trechos);
    - `_selector_group_chat.py` (L60-L310 e a assinatura);
    - `_swarm_group_chat.py` (L20-L150);
    - `_magentic_one/_magentic_one_orchestrator.py` (L60-L536);
    - `_magentic_one/_magentic_one_group_chat.py` (assinatura);
    - `_chat_agent_container.py` (L1-L140);
    - `_graph/_digraph_group_chat.py` (só a guarda de ciclos);
    - `_base_group_chat.py` (só o construtor).
  - **Término:** `conditions/_terminations.py` (trechos) e `base/_termination.py` (L79-L160).
  - **Agentes:** `agents/_code_executor_agent.py` (L430-L640, por grep e trechos) e `agents/_assistant_agent.py` (por grep).
  - **Contexto:** `autogen-core/src/autogen_core/model_context/*.py`.
  - **Benchmark:**
    - `agbench/benchmarks/HumanEval/Templates/AgentChat/{scenario.py,custom_code_executor.py}`;
    - `agbench/benchmarks/GAIA/Templates/ParallelAgents/scenario.py` (trechos);
    - `agbench/src/agbench/tabulate_cmd.py` (por grep).
  - Não li `dotnet/`, `autogen-ext` (salvo um grep) nem `autogen-studio`.

## Mecanismo

**1. Topologia de comunicação.**
- **Barramento com gerente.** Um `BaseGroupChatManager` assina o tópico do grupo. Cada participante vive num `ChatAgentContainer` e recebe as respostas dos outros, que guarda em `_message_buffer`. A comunicação é um broadcast completo pelo tópico, mediado pelo gerente.
  - Fontes: `.../teams/_group_chat/_base_group_chat_manager.py:L25-L35`, `L116-L121` e `.../teams/_group_chat/_chat_agent_container.py:L53-L66` **[código]**.
- **Quem pode falar.** O gerente publica `GroupChatRequestPublish` só para os falantes escolhidos (`_base_group_chat_manager.py:L172-L193`) **[código]**.
- **Equipes aninhadas.** Uma `Team` pode participar como membro de outra equipe (`_chat_agent_container.py:L85-L105`) **[código]**.
- **`GraphFlow`.** Executa um grafo dirigido. Se o grafo tiver ciclos, a equipe exige uma condição de término ou `max_turns` (`.../_graph/_digraph_group_chat.py:L340-L341`) **[código]**.

**2. Quem decide quem age.** O gerente decide, por meio de `select_speaker`.
- **`RoundRobinGroupChat`:** índice circular, de forma determinística (`_round_robin_group_chat.py:L72-L82`) **[código]**.
- **`SelectorGroupChat`:**
  - Ordem de precedência:
    1. `selector_func`, se devolver um nome (`_selector_group_chat.py:L163-L177`);
    2. senão, `candidate_func` filtra os candidatos (`L180-L192`);
    3. senão, o falante anterior é removido quando `allow_repeated_speaker=False` (`L196-L199`).
  - Depois disso, um LLM escolhe com até `max_selector_attempts` tentativas, recebendo feedback quando cita zero nomes, vários nomes ou repete o falante (`L232-L300`).
  - Se todas as tentativas falharem, o falante anterior volta a falar, ou o primeiro candidato quando não há anterior (`L302-L308`).
  - Padrões: `allow_repeated_speaker=False` e `max_selector_attempts=3` (`L615-L616`) **[código]**.
- **`Swarm`:** o próximo falante é o `target` do último `HandoffMessage`. Sem handoff, o falante atual continua, e o primeiro participante começa (`_swarm_group_chat.py:L45`, `L81-L97`) **[código]**.
- **`MagenticOneGroupChat`:**
  - O orquestrador LLM gera fatos e um plano, que formam o *task ledger* (`_magentic_one_orchestrator.py:L156-L186`).
  - A cada passo, gera um *progress ledger* em JSON com os campos `is_request_satisfied`, `is_progress_being_made`, `is_in_loop`, `instruction_or_question` e `next_speaker` (`L300-L384`).
  - A estrutura do JSON é validada até `_max_json_retries=10` vezes (`L94`, `L318-L384`) **[código]**.

**3. Critério de término.**
- **Composição.** As condições são componíveis com `&` e `|` (`base/_termination.py:L79-L86`) **[código]**.
  - `AndTerminationCondition` só para quando todas as condições disparam (`L102-L121`).
  - `OrTerminationCondition` para quando qualquer uma dispara (`L153-L160`).
- **Ponto de checagem.** O gerente avalia a condição sobre o *delta* depois que todos os falantes ativos respondem, e em seguida aplica `max_turns` (`_base_group_chat_manager.py:L152-L161`, `L195-L228`) **[código]**.
- **Condições disponíveis** (`conditions/_terminations.py`) **[código]**:
  - `MaxMessageTermination` (`L62-L95`);
  - `TextMentionTermination` (`L111-L145`), que aceita filtro `sources`;
  - `TokenUsageTermination` (`L235-L292`);
  - `HandoffTermination` (`L313-L340`);
  - `TimeoutTermination` (`L358-L390`): o relógio começa no `__init__` (`L370`), não no início da execução;
  - `ExternalTermination`, acionada por `set()` (`L404-L450`);
  - `SourceMatchTermination` (`L463-L495`);
  - `TextMessageTermination` (`L513-L545`);
  - `FunctionCallTermination` (`L565-L600`);
  - `StopMessageTermination` (`L24-L45`).
- **Padrões de `max_turns`:**
  - `None`, sem limite, em `RoundRobinGroupChat` (`_round_robin_group_chat.py:L249`), `SelectorGroupChat` (`_selector_group_chat.py:L605`) e `Swarm` (`_swarm_group_chat.py:L240`) **[código]**. Portanto, essas três equipes podem rodar sem limite por padrão.
  - `20` em `MagenticOneGroupChat` (`_magentic_one_group_chat.py:L117`) **[código]**.
- **No MagenticOne,** a parada ocorre por três vias:
  - `is_request_satisfied` (um julgamento de LLM) (`_magentic_one_orchestrator.py:L388-L391`);
  - `n_rounds > max_turns`, que leva a `_prepare_final_answer` (`L303-L305`). A comparação usa `>`, então cabem `max_turns+1` passos;
  - a condição de término do usuário (`L203-L210`) **[código]**.

**4. Verificação e aceite mecânico.**
- **No núcleo das equipes, não há gate determinístico de aceite.** No MagenticOne, o fim da tarefa depende de um LLM avaliando `is_request_satisfied` (`_magentic_one_orchestrator.py:L388`). A validação de chaves JSON (`L346-L374`) verifica o formato do ledger, não a tarefa **[código]**.
- **Componente opt-in.** O `CodeExecutorAgent` executa código e repete até `max_retries_on_error` (padrão `0`, `agents/_code_executor_agent.py:L436`) **[código]**.
  - O laço para quando `exit_code == 0` ou na última tentativa (`L548`, `L627-L628`).
  - Entre tentativas, um LLM decide se vale repetir (`L631-L640`).
- **No benchmark há aceite mecânico.** **[exemplo]**
  - O template HumanEval junta os testes ao código do coder. Só imprime `TERMINATE` se `check(candidate)` passar (`agbench/benchmarks/HumanEval/Templates/AgentChat/custom_code_executor.py:L35-L46`).
  - A equipe termina por `TextMentionTermination("TERMINATE", sources=["executor"])` com `max_turns=12` (`.../scenario.py:L45-L48`).
  - O placar procura a string de sucesso (`agbench/src/agbench/tabulate_cmd.py:L19-L20`, `L68`).

**5. Controle de custo e orçamento técnico.**
- **`TokenUsageTermination` não é um limite rígido antes da chamada.** **[código]**
  - Ela soma `models_usage` das mensagens do delta depois que cada turno termina (`conditions/_terminations.py:L275-L286`).
  - Na prática, só interrompe entre turnos, depois que os tokens já foram gastos. Um turno longo, com muitas iterações de ferramenta, pode ultrapassar o teto.
- **Gastos fora da contagem.** No trecho lido de `_select_speaker`, o uso de tokens da chamada do seletor não é anexado a nenhuma mensagem (`_selector_group_chat.py:L232-L300`). Inferência de leitura: o custo do seletor não entra na conta **[código]**. O mesmo vale para as chamadas de ledger do MagenticOne (`_magentic_one_orchestrator.py:L318-L332`).
- **`TimeoutTermination` não interrompe um turno em andamento.** Ela também só é avaliada entre turnos (`_base_group_chat_manager.py:L159`) **[código]**.
- **Outros limites rígidos de laço:**
  - `max_selector_attempts`;
  - `_max_json_retries=10`;
  - `max_tool_iterations` com padrão `1` (`agents/_assistant_agent.py:L739`, laço em `L1149`) **[código]**.
- Não encontrei limite de custo em moeda (busca: `budget`, `max_cost`, `cost` em `autogen-agentchat/src`).

**6. Memória.**
- **Padrão sem limite.**
  - O `AssistantAgent` usa `UnboundedChatCompletionContext()` (`agents/_assistant_agent.py:L840`).
  - O seletor também, quando não recebe contexto (`_selector_group_chat.py:L99-L102`).
  - O `_message_thread` do gerente só cresce, via `extend` (`_base_group_chat_manager.py:L298-L303`) **[código]**.
- **Contextos limitados, opt-in.**
  - `BufferedChatCompletionContext(buffer_size)` devolve as últimas N mensagens (`autogen-core/.../model_context/_buffered_chat_completion_context.py:L28-L36`).
  - `HeadAndTailChatCompletionContext` devolve cabeça e cauda e omite o meio (`_head_and_tail_chat_completion_context.py:L32-L60`).
  - `TokenLimitedChatCompletionContext` remove mensagens do meio até caber em `token_limit` ou no `remaining_tokens` do modelo (`_token_limited_chat_completion_context.py:L57-L72`) **[código]**.
  - Ressalva: esses contextos limitam a *visão* enviada ao LLM, mas o armazenamento continua crescendo, porque `add_message` só faz `append` (`_chat_completion_context.py:L49-L57`) **[código]**.

**7. Falhas e retry.**
- Uma exceção no gerente ou num participante encerra o grupo com `GroupChatTermination(error=...)` e propaga o erro (`_base_group_chat_manager.py:L165-L170`, `L250-L260` e `_chat_agent_container.py:L106-L115`) **[código]**.
- Retries locais existem:
  - no seletor (feedback ao LLM);
  - no parsing do ledger do MagenticOne, com até 10 tentativas;
  - no `CodeExecutorAgent` (`max_retries_on_error`) **[código]**.
- **Replanejamento.** Cada passo sem progresso, ou em loop, soma 1 a `n_stalls`, e cada passo com progresso desconta 1 (`_magentic_one_orchestrator.py:L394-L399`). Ao atingir `max_stalls` (padrão `3`, `_magentic_one_group_chat.py:L119`), o orquestrador refaz fatos e plano (`_update_task_ledger`, `L451-L476`) e reentra no laço externo (`L402-L406`) **[código]**.
- **Saída abrupta.** Se o ledger indicar um `next_speaker` inválido, o `break` em `L370-L374` mantém `key_error=True` e lança `ValueError` sem tentar de novo (`L383-L384`) **[código]**.

**8. Poda de comunicação.**
- **Ao replanejar,** o MagenticOne envia `GroupChatReset` a todos os participantes e limpa o `_message_thread` do gerente antes de rebroadcastar o ledger (`_magentic_one_orchestrator.py:L262-L273`). Isso funciona como uma poda de histórico por episódio **[código]**.
- **Tool calls fora do contexto do orquestrador.** `_thread_to_context` descarta eventos de tool call (`L514-L520`) **[código]**.
- **Filtro de candidatos.** `candidate_func` e `allow_repeated_speaker` restringem quem pode falar, mas não podam mensagens **[código]**.
- **Opt-in.** Os contextos limitados podam o que o LLM vê (item 6).

**9. Elástico ou fixo.** Fixo.
- Os participantes são definidos no construtor (`_base_group_chat.py:L81-L85`).
- Não encontrei método para adicionar ou remover participantes em tempo de execução (busca: `def add_`, `def remove_`, `participants.append`) **[código]**.

**10. Benchmark de custo vs qualidade.**
- O `agbench` traz cenários de HumanEval e de GAIA, incluindo `MagenticOne`, `SelectorGroupChat` e `ParallelAgents` (`python/packages/agbench/benchmarks/`) **[código/exemplo]**.
- **`ParallelAgents`:** é o mais próximo de "1 vs N" no repositório. **[exemplo]**
  - Roda `num_teams=3` equipes MagenticOne em paralelo e espera `num_answers=3` respostas, cancelando as restantes (`.../GAIA/Templates/ParallelAgents/scenario.py:L298-L369`, `L376-L377`).
  - Agrega as respostas com um LLM (`L154-L256`).
  - Registra `prompt_tokens` e `completion_tokens` por chamada em JSONL (`L86-L96`).
- O tabulador padrão só conta sucessos e falhas e não tem colunas de custo (`agbench/src/agbench/tabulate_cmd.py:L217-L261`; busca: `cost`, `token` sem resultado relevante) **[código]**.
- O README não traz números de custo vs qualidade, apenas cita o AutoGen Bench (`README.md:L198`) **[README/docs]**.

## Evidência

Nenhum código foi executado; nenhum benchmark reproduzido. Tudo acima vem da leitura estática do commit `d07c667a`. O comportamento de tempo de execução, como a ordem de eventos no runtime assíncrono, foi inferido do código, não observado. Nenhum número de desempenho foi verificado.

## Análogo de engenharia

**[hipótese]** Para o Swarm Efficiency Observatory, o AutoGen oferece as peças de um braço "N agentes" com controle fino:
- **Término componível**, por exemplo `TextMentionTermination(sources=[executor]) | MaxMessageTermination | TokenUsageTermination`.
- **Aceite mecânico** já demonstrado no template HumanEval: os testes são executados e só então aparece `TERMINATE`.
- **Um harness de N equipes paralelas com log de tokens** (`ParallelAgents`).

Lacunas para usar como observatório:
- O orçamento de tokens não é rígido: a checagem é posterior ao turno e ignora o seletor e o ledger.
- Faltaria um contador por chamada, registrado no cliente de modelo, para medir o custo por tarefa aceita.
- Comparar `RoundRobin`, `Selector`, `Swarm` e `MagenticOne` contra um único `AssistantAgent` com o mesmo `CodeExecutorAgent` isolaria o custo da coordenação.

## Hipótese testável

1. **[hipótese]** Em tarefas HumanEval com o aceite mecânico do template, `MagenticOneGroupChat`, com seus 4 agentes e o overhead do ledger, terá um custo por tarefa aceita (tokens totais, contando seletor e ledger, divididos pelas tarefas que passam nos testes) ≥ 2× o do par coder + executor em `RoundRobinGroupChat`, sem ganho de taxa de aceite maior que 5 pontos percentuais. Ela é falsificada se o MagenticOne ficar abaixo de 2× ou ganhar mais de 5 p.p.
2. **[hipótese]** Com `TokenUsageTermination(max_total_token=B)`, o consumo real, medido no cliente de modelo, vai exceder B em uma fração mensurável das execuções. Isso decorre da checagem pós-turno e da omissão do seletor. Métrica: a distribuição de (consumo real − B)/B. A hipótese é falsificada se o excesso for ≤ 0 em ≥ 95% das execuções.

## Limites/lacunas

- O projeto está **arquivado** (`README.md:L14-L31`). O sucessor, o Microsoft Agent Framework, não foi inspecionado.
- Não li `autogen-ext`, onde ficam os clientes de modelo e seus `max_retries` (só um grep). Não sei se `models_usage` é sempre preenchido por todos os clientes.
- Li `GraphFlow` só na guarda de ciclos. A semântica de ativação e de arestas condicionais não foi verificada.
- O custo do seletor e do ledger ficar fora da contagem de `TokenUsageTermination` é uma inferência a partir do código lido. Não testei.
- Não li `dotnet/`.
- `TRANSPARENCY_FAQS.md`, a documentação em `docs/` e os papers não foram lidos. O README não cita arXiv.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ condições de término componíveis `&`/`\|` e `max_turns` (`base/_termination.py:L79-L86`; `_base_group_chat_manager.py:L195-L228`). O padrão é `max_turns=None`, exceto no MagenticOne (20, `_magentic_one_group_chat.py:L117`) | — no núcleo, o fim é decidido pelo LLM (`is_request_satisfied`, `_magentic_one_orchestrator.py:L388`). Testes executados + `TERMINATE` aparecem só em [exemplo] (`agbench/.../HumanEval/Templates/AgentChat/custom_code_executor.py:L35-L46`) | ✓ (grosso, opt-in) `TokenUsageTermination` interrompe o time, mas checa pós-turno sobre `models_usage` (`conditions/_terminations.py:L275-L286`), sem bloquear chamadas e sem contar o seletor; overshoot esperado (critério harmonizado com `oss-metagpt` em `oss-matriz`). Há `max_turns` e `max_tool_iterations=1` (`_assistant_agent.py:L739`) | ✓ (parcial) o replanejamento do MagenticOne reseta os agentes e limpa a thread (`_magentic_one_orchestrator.py:L262-L273`). Contextos limitados são opt-in | — participantes fixos no construtor (`_base_group_chat.py:L81-L85`) | ✓ opt-in: `Buffered`, `HeadAndTail` e `TokenLimited` (`autogen-core/.../model_context/_token_limited_chat_completion_context.py:L57-L72`). O padrão é `Unbounded` (`_assistant_agent.py:L840`) | MIT para código (`LICENSE-CODE`) + CC-BY-4.0 para docs/conteúdo (`LICENSE`) |
