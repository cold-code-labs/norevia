---
id: oss-chatdev-macnet
title: "ChatDev + MacNet — DAG de agentes em ordem topológica, com agregação hierárquica e poda por execução"
area: oss
evidence: implementacao-observada
tags: [dag, topologia, ordem-topologica, agregacao, poda-mecanica, execucao-de-codigo, cross-team, workflow-yaml, contexto-por-no, chatdev-2]
sources:
  - "https://github.com/OpenBMB/ChatDev/tree/464a681ba7bda869db97a50c5fa707c9a0fb57a0 (commit inspecionado, clone raso em 2026-11-07; branch main = ChatDev 2.0/DevAll)"
  - "https://github.com/OpenBMB/ChatDev/tree/e7a35824fd683ffe8fc237e28ecc47d7b1a5da63 (commit inspecionado, clone raso em 2026-11-07; branch macnet)"
  - "MacNet — Scaling Large-Language-Model-based Multi-Agent Collaboration, arXiv:2406.07155 (citado no README da main; ICLR 2025 no README da macnet)"
  - "Croto — Multi-Agent Collaboration via Cross-Team Orchestration, arXiv:2406.08979 (citado no README da macnet)"
  - "ChatDev — Communicative Agents for Software Development, arXiv:2307.07924 (citado no README da macnet)"
related: [oss-matriz, oss-padroes, oss-gptswarm, oss-agentprune, oss-agentnet, oss-moa, oss-metagpt, oss-camel, oss-autogen]
updated: 2026-11-07
summary: "Na branch macnet, os agentes ocupam os nós de um DAG gerado (chain, star, tree, net, mlp, random) e são executados camada a camada em ordem topológica. Cada aresta revisa e reescreve código, e cada nó agrega as soluções dos predecessores, com poda mecânica pela execução de main.py. A main atual é o ChatDev 2.0, um orquestrador de workflows em YAML."
---

# ChatDev + MacNet

## Identificação

- **Repositório:** https://github.com/OpenBMB/ChatDev. Foram inspecionadas duas árvores.
- **Branch `main`**
  - SHA: `464a681ba7bda869db97a50c5fa707c9a0fb57a0`
  - Data do commit: 2026-10-30T13:36:43+01:00
  - O README se apresenta como **"ChatDev 2.0 - DevAll"** (`README.md:L1`). Segundo ele, "the classic ChatDev (v1.x) has been moved to the `chatdev1.0` branch" (`README.md:L26`) **[README/docs]**.
  - A branch `chatdev1.0` (SHA remoto `31fd994416a251ecdeb1f0a73c329271743bfb56`) **não foi clonada**. Ver Limites/lacunas.
- **Branch `macnet`**
  - SHA: `e7a35824fd683ffe8fc237e28ecc47d7b1a5da63`
  - Data do commit: 2025-06-06T07:58:06+08:00
- **Licença**
  - `main`: o arquivo `LICENSE` é a Apache License 2.0 (`LICENSE:L1-L2`, `@main`), com "Copyright 2025 OpenBMB" (`LICENSE:L189`, `@main`).
  - `macnet`: **não há arquivo LICENSE na árvore** (`find -iname "*licen*"` não retornou nada), e o README da branch não menciona licença. Não verifiquei se a Apache-2.0 da main se estende formalmente à branch.
- **Arquivos lidos**
  - `@macnet`:
    - Lidos inteiros: `graph.py` (500 linhas), `generate_graph.py`, `config.yaml` e `run.py`.
    - Lidos em trechos: `chatdev/waiting.py` (L15-L355 e L424-L520), `chatdev/competition.py` (L15-L156), `camel/model_backend.py` (L85-L110), `camel/agents/chat_agent.py` (L76-L262), `chatdev/statistics.py` (grep) e `README.md`.
  - `@main`:
    - Lidos em trechos: `README.md` (L1-L50), `workflow/runtime/execution_strategy.py`, `workflow/cycle_manager.py` (L9-L50), `entity/configs/node/node.py` (L69, L110-L120, L238-L270), `workflow/graph.py` (L590-L600), `runtime/node/executor/loop_counter_executor.py`, `runtime/node/executor/python_executor.py` (L118-L170), `workflow/executor/dynamic_edge_executor.py` (L1-L180), `entity/configs/node/agent.py` (L106-L115) e `utils/token_tracker.py` (grep).
    - Lidos parcialmente: `yaml_instance/ChatDev_v1.yaml` e `yaml_instance/MACNet_v1.yaml`.

## Mecanismo

As âncoras sem marcação são de **`@macnet` (e7a3582)**. As âncoras da main são marcadas com **`@main` (464a681)**.

**1. Topologia de comunicação**
- **Grafo.** É um DAG explícito, declarado em `config.yaml` como uma lista de arestas `"u->v"` (padrão `['0->1','0->2','0->3']`, `config.yaml:L1`). Ranges são aceitos (`graph.py:L224-L238`) **[código]**.
- **Nós sentinela.** `Node_in_id = -1` é ligado a toda a camada de entrada e `Node_out_id = -2` a toda a camada de saída (`graph.py:L248-L250`, `L283-L289`) **[código]**.
- **Ciclos.** O código rejeita grafos com ciclo e chama `exit(1)` (`graph.py:L291-L294`, DFS em `L475-L496`) **[código]**.
- **Gerador de topologias** (`generate_graph.py`) **[código]**:
  - `chain` (`L28-L33`);
  - `star` (`L35-L40`);
  - `tree` binária (`L42-L54`);
  - `net` completo com `u<v` (`L56-L63`);
  - `mlp` em camadas (`L65-L81`);
  - `random` com `u<v` (`L83-L94`);
  - `--reverse`, que inverte as arestas (`L100-L103`).
  - Não existe a opção "mesh"; o grafo completo se chama `net` (`L155`).
  - Como as arestas sempre seguem `u<v`, o grafo é acíclico por construção.
- **Main (2.0) `@main`.** O workflow é um grafo YAML de nós `agent`, `literal`, `loop_counter`, `passthrough`, `python`, `subgraph`, entre outros. Exemplos: `yaml_instance/ChatDev_v1.yaml:L6-L37` e `yaml_instance/MACNet_v1.yaml:L7-L40`. O MACNet_v1 usa subgrafos como nós.
  - A estratégia de execução é DAG ou de ciclos (`workflow/runtime/execution_strategy.py:L14-L60`) **[código/exemplo]**.

**2. Quem decide quem age**
- **Ninguém decide em tempo de execução: a estrutura decide.**
- **Ordem de execução.** `Graph.execute` repete o mesmo passo até o grafo esvaziar **[código]**:
  1. pega a camada de nós sem predecessores (`graph.py:L321`);
  2. para cada aresta `cur→next`, roda `next.optimize(...)` sobre a solução de `cur` (`L337-L357`);
  3. remove as arestas e os nós já consumidos (`L391-L394`).

  É um Kahn por camadas.
- **Trabalho de cada aresta** (`graph.py:L131-L183`) **[código]**:
  - uma chamada de "instrutor" com regras de revisão (`config.yaml:L7-L22`);
  - opcionalmente, uma verificação por compilação;
  - uma chamada de "assistente" que reescreve o código.

  Cada chamada usa um `ChatAgent` novo (`L75-L82`, `L145`, `L164`, `L174`).
- **Perfis e temperatura.** Os perfis vêm do `SRDD_Profile` sorteado ou do padrão "You are an experienced programmer." A temperatura cai com a profundidade, `1 - depth/graph_depth` (`graph.py:L410-L422`) **[código]**.

**3. Critério de término**
- **MacNet.** O término é estrutural: o laço acaba quando não há mais nós de entrada, e a solução do nó `-2` é gravada (`graph.py:L320-L327`, `L398`) **[código]**.
  - Não existe diálogo multi-turno por aresta, então não há `chat_turn_limit` no caminho MacNet. São no máximo 3 chamadas LLM por aresta (`L145`, `L164`, `L174`).
  - A agregação tem `Aggregate_retry_limit: 10` (`config.yaml:L5`; laço em `graph.py:L200-L213`) **[código]**.
- **Main `@main`.**
  - Nós `loop_counter` só liberam a saída ao atingir `max_iterations` (`runtime/node/executor/loop_counter_executor.py:L16-L46`).
  - Ciclos têm um teto padrão de 100 iterações quando `max_iterations` não é definido (`workflow/cycle_manager.py:L16`, `L23`; usado em `workflow/executor/cycle_executor.py:L130`).
  - No `ChatDev_v1.yaml`, os contadores usam 5, 3, 5, 1 e 10 (`L12`, `L20`, `L161`, `L355` e `L500`) **[código/exemplo]**.
  - Arestas com condição `keyword` reagem a `<INFO>` (`ChatDev_v1.yaml:L712-L739`) **[exemplo]**.

**4. Verificação e aceite mecânico**
- **Compilação sob demanda do LLM.** Só ocorre se o instrutor começar a resposta com `<API>compile()</API>` (`graph.py:L147-L165`).
  - `exist_bugs` roda `python3 main.py`, espera 3 s e mata o processo (`L84-L129`).
  - Observação de leitura, não executada: `return_code` é lido em `L106`, **antes** de `poll()` em `L107`. Na prática, o diagnóstico depende de haver "Traceback" no stderr (`L117-L121`).
  - O resultado volta como texto para o LLM. Não é um gate **[código]**.
- **Poda e ranqueamento por execução.** Isso é determinístico, salvo pelo `shuffle` **[código]**.
  - `competition_filter` atribui a nota `rate = (executability*10 + completeness)*10000 - need_complete_number` (`chatdev/competition.py:L138-L156`), onde:
    - `executability` vem de rodar `main.py` (`L57-L123`);
    - `completeness` é a ausência de `pass` ou `todo` (`L46-L55`);
    - `need_complete_number` conta funções não implementadas.
  - A nota é usada só para **selecionar** soluções (item 8). Não há aceite final: a saída do nó `-2` é gravada sem checagem (`graph.py:L398`).
- **Main `@main`.**
  - O nó `python` tem `success = returncode == 0` e timeout (`runtime/node/executor/python_executor.py:L139-L168`) **[código]**.
  - No `ChatDev_v1.yaml`, o "Software Test Engineer" é um agente LLM que roda o software via ferramentas e julga pass/fail pelo prompt. Um timeout pode contar como sucesso (`ChatDev_v1.yaml:L458-L476`) **[exemplo]**.

**5. Controle de custo e orçamento técnico**
- **MacNet.** Não encontrei teto de tokens, custo ou chamadas no código inspecionado (busca: `budget`, `max_cost`, `total_tokens` em `graph.py` e `chatdev/waiting.py`) **[código]**.
  - O backend define `max_tokens = limite_do_modelo - prompt_tokens` por chamada, usando uma tabela fixa em que `gpt-4o: 4096 #100000` (`camel/model_backend.py:L85-L99`).
  - O backend calcula `cost` (`L103-L107`), mas o log está comentado (`L111-L113`).
  - `ChatAgent.step` se recusa a chamar o modelo quando o prompt excede `model_token_limit` e marca `terminated` (`camel/agents/chat_agent.py:L235-L260`). Isso é limite de contexto, não orçamento.
  - `chatdev/statistics.py` (`prompt_cost`, `get_info`) não é chamado por `graph.py`, `run.py` nem `waiting.py`, segundo grep **[código]**.
  - O custo cresce com o número de arestas: há ≈2-3 chamadas por aresta, e o grafo `net` tem n(n-1)/2 arestas (`generate_graph.py:L62`) **[código]**.
- **Main `@main`.**
  - `utils/token_tracker.py:L36-L111` registra o uso por nó e por modelo. Não encontrei limite (busca: `budget`, `max_cost` em `workflow`, `runtime`, `utils` e `entity`) **[código]**.
  - Os retries de provedor são de até `max_attempts=5` (`entity/configs/node/agent.py:L106-L110`).

**6. Memória**
- **MacNet: limitada por construção.** Cada chamada usa um `ChatAgent` novo e recebe só a tarefa e a solução do predecessor (`graph.py:L139`, `L167-L168`). Na agregação, o nó recebe as soluções dos predecessores diretos (`L194-L199`) **[código]**.
  - O README afirma "without exceeding context limits" (`README.md:L9`, `@macnet`) **[README/docs]**.
- **Main `@main`.** Cada nó tem `context_window`, com padrão `0`:
  - `0` limpa tudo, exceto mensagens `keep`;
  - `-1` não limita;
  - `N` mantém as N mais recentes (`entity/configs/node/node.py:L69`, `L113-L120`, `L238-L270`). A aplicação está em `workflow/graph.py:L596-L597` **[código]**.

**7. Falhas e retry**
- **Agregação.** São até 10 tentativas (`graph.py:L200-L213`). Se falharem, o nó usa a primeira pré-solução (`L376-L383`) **[código]**.
- **Formato.** `error_check` refaz a chamada enquanto a resposta não tiver codebooks, até 3 vezes (`chatdev/waiting.py:L344-L355`). Uma falha de parse em `optimize` vira `Codes()` vazio (`graph.py:L177-L181`) **[código]**.
- **Erros fatais.**
  - Um número de soluções diferente do número de arquivos encerra o programa com `exit(1)` (`graph.py:L369-L371`).
  - `select_strategy` lança `ValueError` se `unit_num <= 1` (`waiting.py:L513-L514`) **[código]**.
- **Main `@main`.** Há retry por provedor (`entity/configs/node/agent.py:L106-L115`) **[código]**.

**8. Poda de comunicação** ✓
- **Croto, integrado ao MacNet.** O README atribui "greedy aggregation, hierarchy partitioning, and pruning strategy" a `chatdev.waiting` e a `graph.py` (`README.md:L80`, `@macnet`) **[README/docs]**.
- **Poda observada no código (`prune_test`).** Ela é acionada com mais de 4 soluções na fila (`waiting.py:L127-L128`) e com 4 ou mais após cada rodada (`L189-L192`) **[código]**.
  1. Embaralha as soluções.
  2. Ranqueia cada uma por `competition_filter`, com cache em `./Rate`.
  3. **Descarta a metade inferior**, mantendo `len//2` (`waiting.py:L267-L314`).
- **Particionamento hierárquico.** `select_strategy` agrupa `unit_num` soluções por chamada de agregação; o padrão é `Aggregate_unit_num: 2` (`config.yaml:L6`). As rodadas se repetem até restar ≤ `unit_num` (`waiting.py:L140-L200`), e `unit_num ≥ 4` é reduzido à metade (`L130-L131`) **[código]**.
- **Código morto.** `select_strategy_greedy`, que limita grupos por tokens via `tiktoken`, existe (`waiting.py:L424-L500`) mas não é chamado em lugar nenhum, segundo grep por `select_strategy_greedy()` **[código]**.
- **Agregação condicional.** O nó só agrega se recebeu todas as pré-soluções e se elas são ≥ `unit_num`. Caso contrário, usa a primeira (`graph.py:L373-L389`) **[código]**.

**9. Elástico vs fixo**
- **MacNet: fixo.** O número de nós e as arestas são definidos antes da execução por `config.yaml` e `generate_graph.py --node_num`. Durante a execução, os nós só são removidos depois de consumidos (`graph.py:L391-L394`) **[código]**.
- **Main `@main`: elástico opt-in.**
  - Arestas `dynamic` (map ou tree) dividem o payload e **instanciam virtualmente o nó-alvo uma vez por unidade**. As unidades rodam em paralelo com `min(len(units), max_parallel)` workers (`workflow/executor/dynamic_edge_executor.py:L1-L6`, `L59-L82`, `L162-L175`) **[código]**.
  - Exemplos: `yaml_instance/demo_dynamic.yaml` e `demo_dynamic_tree.yaml`, listados mas não lidos **[exemplo]**.

**10. Benchmark de custo vs qualidade no repositório**
- **MacNet.** Não encontrei harness de avaliação na branch. `statistics.py` tem funções de custo, mas elas não estão conectadas (item 5) **[código]**.
- **Relatos dos autores** **[README/docs]**:
  - O README da main afirma que o MacNet suporta "more than a thousand agents without exceeding context limits" (`README.md:L44`, `@main`).
  - O paper Puppeteer (arXiv:2505.19591, na branch `puppeteer`, não inspecionada) "reduces computational costs" (`README.md:L31-L34`, `@main`).
  - Nenhum número foi verificado.

## Evidência

Nenhum código foi executado; nenhum benchmark reproduzido. Tudo vem da leitura estática dos dois commits. A observação sobre `return_code` lido antes de `poll()` é uma inferência de leitura, sem teste.

## Análogo de engenharia

- **[hipótese]** O MacNet é o braço "N agentes com topologia variável" mais direto para o Swarm Efficiency Observatory: o gerador de topologias com `--node_num` permite varrer N e a forma do grafo mantendo o resto fixo.
- **Peças a reaproveitar (padrão de engenharia):**
  - `competition_filter`: execução de `main.py` mais uma heurística de completude. Pode servir de aceite mecânico barato, mas fraco (não tem testes).
  - A poda pela metade como mecanismo de controle de custo.
- **O que faltaria:**
  - um contador de tokens por aresta. O cálculo de custo já existe no backend, mas o log está comentado;
  - um aceite final com testes ocultos no nó `-2`;
  - um braço baseline "1 nó" (`chain` com `node_num=1`, ou uma única chamada) com o mesmo orçamento.

## Hipótese testável

1. **[hipótese]** Com tarefas de software com testes ocultos, o custo por tarefa aceita (tokens totais por tarefa que passa nos testes) cresce de forma superlinear em N na topologia `net` (≈N²/2 arestas) e de forma ~linear em `chain`. A taxa de aceite de `net` não supera a de `chain` em mais de 5 p.p. para N ≤ 8. A hipótese é falsificada se `net` ganhar mais de 5 p.p. em algum N ≤ 8, ou se o custo de `net` crescer de forma ≤ linear.
2. **[hipótese]** Desligar `prune_test`, isto é, agregar todas as soluções, aumenta os tokens de agregação sem ganho significativo na taxa de aceite. Métrica: Δtokens e Δaceite com e sem poda, mesma semente de grafo.

## Limites/lacunas

- **ChatDev 1.0 clássico** (ChatChain, phases, `chat_turn_limit`, fase de teste com compilação) **não foi inspecionado**. Ele está na branch `chatdev1.0` (SHA `31fd994416a251ecdeb1f0a73c329271743bfb56`), que não foi clonada.
  - A branch `macnet` contém `chatdev/chat_chain.py`, `phase.py` e `composed_phase.py`, mas o caminho de execução do MacNet (`run.py` → `graph.py`) não os importa: `graph.py` importa apenas `chatdev.codes`, `chatdev.richshell` e `chatdev.waiting`. Esses arquivos não foram lidos.
- **Licença da branch macnet não determinada**: não há LICENSE na árvore.
- **Main 2.0** foi lida de forma amostral. O executor de agentes, os providers, a semântica completa das arestas condicionais e o servidor não foram verificados. Os YAMLs `demo_dynamic*.yaml` não foram lidos.
- **Branch `puppeteer`** (orquestrador treinado por RL, que alega reduzir custo) não foi inspecionada.
- **Laço de espera em `state_pool_pop`.** Usa `max_duration = wait_time = 6000000` s e `client_number = 1` fixo (`waiting.py:L17`, `L58`, `L225-L262`). Não analisei se ele pode travar.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ estrutural: o DAG se esgota em ordem topológica (`graph.py:L320-L327`, `@macnet`); agregação com `retry_limit=10` (`config.yaml:L5`). Main: `loop_counter`/ciclo com padrão de 100 (`workflow/cycle_manager.py:L23`, `@main`) | — a execução de `main.py` serve só para ranquear e podar (`chatdev/competition.py:L138-L156`) e como feedback opcional ao LLM (`graph.py:L147-L165`). Não há gate final (`graph.py:L398`) | — só `max_tokens` por chamada = contexto − prompt (`camel/model_backend.py:L97-L99`). O custo é calculado, mas não registrado nem limitado. Main: `TokenTracker` só registra (`utils/token_tracker.py:L36-L111`, `@main`) | ✓ `prune_test` descarta a metade inferior por nota de execução (`chatdev/waiting.py:L267-L314`) e agrega hierarquicamente em grupos de `unit_num` | — MacNet tem grafo fixo (`config.yaml:L1`). ✓ opt-in na main: arestas `dynamic` instanciam o nó por unidade (`workflow/executor/dynamic_edge_executor.py:L162-L175`, `@main`) | ✓ `ChatAgent` novo por chamada, que vê só a solução do predecessor (`graph.py:L139`, `L174`). Main: `context_window` com padrão 0 (`entity/configs/node/node.py:L69`, `@main`) | Apache-2.0 na main (`LICENSE`, `@main`). ? na macnet: sem arquivo LICENSE na árvore |
