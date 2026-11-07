---
id: oss-metagpt
title: "MetaGPT — SOP por publish/subscribe, hub TeamLeader e orçamento em dólares por rodada"
area: oss
evidence: implementacao-observada
tags: [sop, publish-subscribe, team-leader, hub, investment, cost-manager, react-loop, plan-and-act, tenacity, memoria-janela]
sources:
  - "https://github.com/FoundationAgents/MetaGPT/tree/11cdf466d042aece04fc6cfd13b28e1a70341b1f (commit inspecionado, clone raso em 2026-11-07)"
  - "MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework, ICLR 2024 — https://openreview.net/forum?id=VtmBAGCN7o (citado no README; sem arXiv id no README)"
related: [oss-matriz, oss-padroes, oss-chatdev-macnet, oss-camel, oss-autogen, oss-crewai, oss-langgraph-supervisor]
updated: 2026-11-07
summary: "No MetaGPT, os papéis assinam mensagens num Environment e reagem a elas; por padrão (MGXEnv), toda mensagem passa por um TeamLeader. Team.run para por n_round, por ociosidade ou quando o custo em dólares excede o investimento, mas o orçamento só é checado entre rodadas e não conta modelos sem preço cadastrado."
---

# MetaGPT: SOP por publish/subscribe, hub TeamLeader e orçamento por rodada

## Identificação

- **URL:** https://github.com/FoundationAgents/MetaGPT
- **SHA inspecionado:** `11cdf466d042aece04fc6cfd13b28e1a70341b1f`
- **Data do commit:** 2026-01-21T18:12:32+08:00 (`git log -1 --format=%cI`).
- **Licença:** MIT License, "Copyright (c) 2024 Chenglin Wu" (`LICENSE:L1-L3`).
- **Escopo do que foi lido:**
  - Lidos inteiros:
    - `metagpt/team.py`
    - `metagpt/utils/cost_manager.py`
    - `metagpt/environment/mgx/mgx_env.py`
  - Lidos em trechos:
    - Núcleo de papéis e ambiente: `metagpt/environment/base_env.py` (L120-L247), `metagpt/roles/role.py` (L82-L560) e `metagpt/memory/memory.py` (L20-L90).
    - Papéis DI: `metagpt/roles/di/role_zero.py` (L55-L110, L303-L335, por grep), `metagpt/roles/di/team_leader.py` (L23-L95) e `metagpt/roles/di/data_interpreter.py` (L39-L150).
    - Memória e utilitários: `metagpt/memory/role_zero_memory.py` (L24-L135) e `metagpt/utils/common.py` (L323-L332, L423-L431, L675-L716).
    - Ações: `metagpt/actions/action_node.py` (L420-L452), `metagpt/actions/run_code.py` (L29-L148) e `metagpt/actions/di/execute_nb_code.py` (por grep).
    - Papéis de SOP: `metagpt/roles/qa_engineer.py` (L47-L210), `metagpt/roles/product_manager.py` (L30-L55) e `metagpt/roles/architect.py` (L40-L52).
    - Estratégia e orquestração: `metagpt/strategy/planner.py` (L63-L145), `metagpt/software_company.py` (L14-L75) e `metagpt/tools/libs/software_development.py` (L118-L152).
    - LLM: `metagpt/provider/base_llm.py` (L245-L262).
  - Lidos só por grep:
    - `metagpt/provider/openai_api.py`
    - `metagpt/ext/aflow/benchmark/{benchmark.py,humaneval.py}`
  - `README.md`: linhas L34-L50 e L161-L175.

## Mecanismo

**1. Topologia de comunicação**
- **Barramento publish/subscribe no `Environment`.**
  - `publish_message` entrega a mensagem a cada papel cujo endereço casa com `send_to` (`metagpt/environment/base_env.py:L175-L195`). A regra de casamento está em `metagpt/utils/common.py:L423-L431`, onde `MESSAGE_ROUTE_TO_ALL` faz broadcast **[código]**.
  - Cada papel filtra o que lê em `_observe`. Só fica com mensagens cujo `cause_by` está em `rc.watch` ou que citam seu nome em `send_to` (`metagpt/roles/role.py:L399-L417`) **[código]**.
  - Essa filtragem é o "SOP": por exemplo, o `Architect` faz `_watch({WritePRD})` (`metagpt/roles/architect.py:L52`) **[código]**.
- **Padrão atual: hub com TeamLeader.**
  - `Team` usa `use_mgx=True` por padrão e instancia o `MGXEnv` (`metagpt/team.py:L43`, `L48-L51`) **[código]**.
  - No `MGXEnv`, toda mensagem comum ganha o TeamLeader como destinatário: "every regular message goes through team leader" (`metagpt/environment/mgx/mgx_env.py:L54-L57`). A mensagem só vai aos outros papéis depois que o TL a publica (`L48-L53`) **[código]**.
  - `is_public_chat=True` acrescenta `MESSAGE_ROUTE_TO_ALL` (`L16-L22`). Na prática, todos recebem tudo no buffer e filtram em `_observe` **[código]**.
- **SOP fixa é legado e opt-in.**
  - O pipeline clássico PM→Arquiteto→… só vale com `use_fixed_sop=True`. O padrão é `False` (`metagpt/roles/di/role_zero.py:L98`).
  - O comentário no `Architect` diz isso explicitamente: "only be effective when self.use_fixed_sop is changed to True" (`metagpt/roles/architect.py:L46`) **[código]**.

**2. Quem decide quem age**
- **Ativação por mensagens.** A cada rodada, `Environment.run` dispara `role.run()` em paralelo (`asyncio.gather`) para todo papel não ocioso (`base_env.py:L197-L211`) **[código]**.
- **No MGX, o TeamLeader (LLM) escolhe o destinatário** via `publish_team_message(content, send_to)` (`metagpt/roles/di/team_leader.py:L75-L87`) **[código]**.
- **Dentro de cada papel, depende do `react_mode`** (`metagpt/roles/role.py:L82-L85`, `L261-L282`) **[código]**:
  - `REACT`: um LLM escolhe o próximo estado em `_think`. Saída inválida vira `-1`, que encerra (`L340-L378`).
  - `BY_ORDER`: percorre as ações em ordem (`L353-L357`).
  - `PLAN_AND_ACT`: um `Planner` gera tarefas e as executa até acabarem (`L472-L496`).

**3. Critério de término**
- **`Team.run(n_round=3)`** termina por três vias (`metagpt/team.py:L123-L138`) **[código]**:
  - todos os papéis ociosos (`L129-L131`);
  - fim das rodadas;
  - estouro de orçamento (`L133`).
- **A CLI usa outros padrões:** `n_round=5` e `investment=3.0` (`metagpt/software_company.py:L16-L17`, `L71-L72`) **[código]**.
- **Limite de ciclos por papel (`max_react_loop`):**
  - Padrão do `Role`: `1` (`role.py:L113`).
  - `RoleZero`: `50`. Ao atingir o limite, se for ≥ 10, pergunta ao humano se deve continuar, e um "yes" zera o contador (`role_zero.py:L71`, `L314-L333`).
  - `TeamLeader`: `3` (`team_leader.py:L29`) **[código]**.
- **Comando `end` do LLM.** Para isso o `RoleZero` também usa o comando `end`, listado em `special_tool_commands` (`role_zero.py:L77`) **[código]**.

**4. Verificação/aceite mecânico**
- **`QaEngineer` executa testes de verdade, mas o veredito é do LLM.**
  - O `RunCode` roda um subprocesso com `timeout=10` (`metagpt/actions/run_code.py:L106-L116`).
  - Em seguida, um LLM lê stdout e stderr e escreve `PASS` ou `FAIL` e o destinatário (`L29-L48`, `L120-L147`). O código de retorno do processo não decide nada **[código]**.
  - O `QaEngineer` limita o ciclo de testes a `test_round_allowed=5` (`qa_engineer.py:L47`, `L164-L176`). Ele está comentado e fora do time padrão da CLI (`software_company.py:L59-L62`) **[código]**.
- **`DataInterpreter` (`PLAN_AND_ACT`, `auto_run=True`): o aceite da tarefa é mecânico.**
  - `confirmed = task_result.is_success` (`metagpt/strategy/planner.py:L140`).
  - `is_success` vem da execução do notebook: um traceback vira `False` (`metagpt/actions/di/execute_nb_code.py:L163-L197`).
  - O código é reescrito até `max_retry=3` (`data_interpreter.py:L107-L147`) **[código]**.
  - Com `auto_run=False` (padrão do `Planner`, `planner.py:L63`), quem revisa é um humano (`L132-L139`) **[código]**.
- **Validação de schema da saída.** `ActionNode._aask_v1` instancia um modelo pydantic com o parse da resposta (`action_node.py:L441-L451`). Uma falha cai no `@retry` de 6 tentativas (`L423-L427`). Isso valida o formato, não a correção da tarefa **[código]**.
- **Loops de documento.** Em `write_trd` e similares, o loop roda `while not is_pass and total_cost < max_budget`, mas `is_pass` vem de um avaliador LLM (`software_development.py:L129-L151`; prompt em `actions/requirement_analysis/trd/evaluate_trd.py:L114`) **[código]**.

**5. Controle de custo e orçamento técnico**
- **Funcionamento.** O `CostManager` acumula tokens e custo em dólar a partir de uma tabela de preços (`metagpt/utils/cost_manager.py:L25-L60`). O padrão é `max_budget=10.0` (`L31`), e `Team.invest` o sobrescreve (`team.py:L92-L96`) **[código]**.
- **É um limite rígido, mas grosso.**
  - `_check_balance` lança `NoMoneyException` quando `total_cost >= max_budget` (`team.py:L98-L100`), porém só **antes de cada rodada** (`L133`). Uma rodada inteira com todos os papéis em paralelo pode estourar o teto.
  - A exceção é capturada por `serialize_decorator`, que registra o erro e serializa o time em vez de propagar (`utils/common.py:L675-L686`) **[código]**.
- **Furos na contagem.**
  - Um modelo fora de `TOKEN_COSTS` só soma tokens, com custo 0, e o orçamento nunca dispara (`cost_manager.py:L48-L50`).
  - `TokenCostManager` não calcula custo (`L94-L108`) **[código]**.
- **Outros limites com teto:** `max_react_loop`, `test_round_allowed` e os retries do `tenacity`.

**6. Memória**
- **`Memory` base sem limite.** É uma lista mais um índice por `cause_by`. `get(k=0)` devolve tudo (`metagpt/memory/memory.py:L20-L35`, `L80-L82`) **[código]**.
- **Janela nos papéis `RoleZero`.** O contexto é `memory.get(self.memory_k)` com `memory_k=200` mensagens (`role_zero.py:L97`, `L241`) **[código]**.
- **Long-term opt-in.** Com `enable_longterm_memory`, `RoleZeroLongTermMemory` transfere para RAG a mensagem que sai da janela de `memory_k` (`metagpt/memory/role_zero_memory.py:L33`, `L71-L79`, `L119-L128`; ativação em `role_zero.py:L174-L188`) **[código]**.
- **Histórico de debug sem limite.** O `Environment.history` só acumula (`base_env.py:L134`, `L193`) **[código]**.
- **Saídas do `RunCode` truncadas** em 500 e 10000 caracteres (`run_code.py:L140-L141`) **[código]**.

**7. Falhas e retry**
- **Retries do `tenacity`** **[código]**:
  - `ActionNode._aask_v1`: 6 tentativas, backoff exponencial de 1 a 20 s, qualquer exceção (`action_node.py:L423-L427`).
  - `BaseLLM.acompletion_text`: 3 tentativas, só `ConnectionError` (`provider/base_llm.py:L249-L255`).
  - `openai_api.py:L165-L169`: 6 tentativas, só `APIConnectionError`.
- **Falha de papel.** `role_raise_decorator` apaga da memória a última mensagem observada, para que seja reobservada depois, e relança a exceção (`utils/common.py:L689-L716`) **[código]**.
- **Respostas repetidas.** `check_duplicates` detecta uma resposta idêntica dentro de uma janela de 10 e pede regeneração. Com 3 repetições, a saída é `end` (quando é `finish_current_task`) ou perguntar ao humano (`metagpt/utils/role_zero_utils.py:L68-L93`) **[código]**.
- **Planner.** Uma tarefa não confirmada leva a `update_plan()` (replanejamento), salvo quando a revisão pede "redo" (`planner.py:L102-L117`).
  - **[código]** Não encontrei um teto para o laço `while self.planner.current_task` em `role.py:L480-L486`. Busca feita: `max_` em `planner.py`, onde o único limite é `max_retries=3` para plano inválido (`L77-L93`).

**8. Poda de comunicação**
- **Filtro de entrada, não poda estrutural.**
  - `_observe` descarta mensagens não assinadas (`role.py:L410-L417`).
  - Papéis de SOP fixa usam `enable_memory=False` (`product_manager.py:L44`, `architect.py:L47`). Assim, mensagens já vistas não são deduplicadas contra a memória (`role.py:L408`) **[código]**.
- **Mensagens dummy.** O TL pode descartar mensagens com `send_to == {"no one"}` (`mgx_env.py:L48-L51`) **[código]**.
- **Grafo e papéis estáticos.** Não encontrei remoção de arestas ou de papéis (busca: `remove_role`, `prune`) **[código]**.

**9. Elástico vs fixo**
- **Fixo.** Os papéis são definidos por `Team.hire` antes da execução (`team.py:L83-L85`; `software_company.py:L45-L53`) **[código]**.
- O TL roteia entre os papéis existentes listados por `_get_team_info` (`team_leader.py:L45-L53`). Não encontrei criação dinâmica de papéis (busca: `add_role(`, `.hire(` fora da inicialização) **[código]**.

**10. Benchmark de custo vs qualidade no repositório**
- **Para o time multiagente:** não encontrado no código inspecionado.
- **AFlow**, um otimizador de workflow que não é o `Team`, registra `score`, `avg_cost` e `total_cost` por avaliação. Fontes: `metagpt/ext/aflow/benchmark/benchmark.py:L39-L46` e `L97-L104`, que limitam a concorrência a `max_concurrent_tasks=50` **[código]**.
  - No HumanEval, o AFlow faz `exec` da solução e dos testes com timeout de 15 s (`ext/aflow/benchmark/humaneval.py:L45-L98`). É aceite mecânico **[código]**.
- **README:** cita o paper do MetaGPT (ICLR 2024) e os de AFlow, SPO e AOT (`README.md:L34-L36`, `L161-L175`) **[README/docs]**. Não traz números de custo por tarefa.

## Evidência

Nenhum código foi executado; nenhum benchmark reproduzido. A análise é leitura estática do commit `11cdf466`. Não há comportamento observado em execução. As afirmações sobre fluxo (por exemplo, "estouro dentro de uma rodada") são inferências a partir do código.

## Análogo de engenharia

- **`CostManager` + `Team.invest`:** é o primitivo mais próximo de "custo por tarefa" entre os projetos lidos. Por tarefa, o projeto tem um orçamento em dólar, um contador acumulado e uma parada rígida, embora grosseira (por rodada) **[código]**.
- **Uso no Swarm Efficiency Observatory [hipótese]:**
  - Instrumentar `CostManager.get_costs()` por tarefa.
  - Usar como aceite o critério mecânico do `DataInterpreter` (execução sem traceback) ou testes externos, em vez do `PASS` escrito pelo LLM no `RunCode`.
  - Comparar dois braços:
    - um único `DataInterpreter`, isto é, um agente forte com plano e execução;
    - o `Team` MGX: TL + PM + Arquiteto + Engineer2 + DataAnalyst.
- **Cuidado:** a checagem por rodada exige registrar o excedente (custo final − investimento) como métrica própria.

## Hipótese testável

1. **[hipótese]** Em tarefas de código com testes ocultos, o `Team` MGX padrão (5 papéis, hub TL) terá um custo por tarefa aceita, em dólares segundo o `CostManager`, ≥ 3× o de um `DataInterpreter` isolado com o mesmo modelo. A taxa de aceite não cresceria mais de 10 p.p. A hipótese é falsificada se a razão de custo for < 3× ou o ganho de aceite for > 10 p.p.
2. **[hipótese]** Com `investment` = B, o custo final excederá B em ≥ 20% das execuções que terminam por `NoMoneyException`, porque a checagem ocorre só entre rodadas paralelas. Métrica: a distribuição de (custo_final − B)/B nas execuções interrompidas.

## Limites/lacunas

- `metagpt/roles/engineer.py` (Engineer clássico, `n_borg`), `engineer2.py` e os prompts do TL não foram lidos em detalhe. As instruções de roteamento do TL (`TL_INSTRUCTION`) também não foram verificadas.
- `RoleZero._think`, `_quick_think` e o parser de comandos foram lidos só parcialmente, por grep.
- `ExecuteNbCode` foi lido por grep. A regra exata de `is_success` merece leitura completa.
- `TOKEN_COSTS` (`utils/token_counter.py`) não foi lido, então não sei quais modelos estão cobertos.
- Não verifiquei se `NoMoneyException` também é lançada dentro de chamadas LLM em outros pontos. O grep só a encontrou em `team.py`.
- O README não traz arXiv id do paper principal, só o link do OpenReview.
- Não investiguei se o projeto está em manutenção ativa. O último commit é de 2026-01-21.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ `Team.run(n_round=3)` + ociosidade + orçamento (`team.py:L123-L138`); `max_react_loop` por papel (`role.py:L113`; `role_zero.py:L71`) | — no time padrão. O `QaEngineer` executa testes, mas o veredito `PASS`/`FAIL` é do LLM (`run_code.py:L29-L48`). Execução sem traceback = aceite só no `DataInterpreter` com `auto_run` (`planner.py:L140`) | ✓ (grosso) `NoMoneyException` com custo ≥ `max_budget`, checada só entre rodadas (`team.py:L98-L100`, `L133`). Modelos sem preço não contam (`cost_manager.py:L48-L50`) | — só filtro de assinatura em `_observe` (`role.py:L410-L417`), sem remoção de arestas, papéis ou histórico | — papéis fixos via `hire` (`team.py:L83-L85`) | ✓ janela `memory_k=200` nos `RoleZero` (`role_zero.py:L97`, `L241`). `Memory` base sem limite (`memory.py:L80-L82`) | MIT (`LICENSE:L1-L3`) |
