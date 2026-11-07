---
id: oss-agentnet
title: AgentNet — roteamento descentralizado forward/split/execute com pesos de aresta e pools de experiência
area: oss
evidence: implementacao-observada
tags: [roteamento-descentralizado, dag, poda-de-comunicacao, memoria-limitada, rag-de-experiencia, evolucao-de-habilidades, termino-parcial, sem-licenca]
sources:
  - "https://github.com/zoe-yyx/AgentNet/tree/325d39f2a940be5fa903d28c411bd3426b8007f5 (commit inspecionado, clone raso em 2026-11-07)"
  - "Yang et al., AgentNet: Decentralized Evolutionary Coordination for LLM-Based Multi-Agent Systems, arXiv:2504.00587v2 (NeurIPS 2025); oficialidade do repositório autodeclarada no README, não confirmada pelo paper (página arXiv v2 não lista código, conferido pelo coordenador do swarm em 2026-11-07)"
related: [oss-gptswarm, oss-agentprune, oss-matriz]
updated: 2026-11-07
summary: "Cada agente decide por LLM entre encaminhar, dividir ou executar a tarefa; pesos de aresta multiplicativos removem vizinhos ruins e pools de experiência com capacidade alimentam o prompt — mas o limite de saltos é só por prompt e a evicção é degenerada."
---

## Identificação

- Repositório: https://github.com/zoe-yyx/AgentNet
- Commit: `325d39f2a940be5fa903d28c411bd3426b8007f5`
- Data do commit (`git log -1 --format=%cI`): 2025-10-02T22:04:55+08:00
- Licença: **nenhum arquivo de licença.** Busca: `find -iname "*licen*" -o -iname "COPYING*"`, sem resultado. O `readme.md` (82 linhas, lido até a L80) não declara licença. Situação: **lacuna**, sem permissão explícita de reuso.
- Oficialidade: o `readme.md:L3` diz "This is the official implementation" e lista os mesmos autores do paper (`readme.md:L9`). Segundo o coordenador, a página arXiv v2 não aponta repositório. Situação: **autodeclarada, não confirmada pelo paper.**
- Arquivos lidos: `readme.md`, `AgentNet_Code/run_bigbenchhard_train_test.py`, `AgentNet_Code/config/experiment/bigbenchhard_new_abilities.yaml`, `AgentNet_Code/src/experiment.py`, `AgentNet_Code/src/agentgraph.py`, `AgentNet_Code/src/agent.py` (L36–L260, L426–L595, L688–L926), `AgentNet_Code/src/pool.py` (L1–L275, L300–L384, mais grep), `AgentNet_Code/src/global_vars.py`, `AgentNet_Code/src/utils.py` (L55–L144), `AgentNet_Code/src/task.py` (grep), `AgentNet_Code/evaluator/evaluator.py`, `AgentNet_Code/evaluator/Accuracy.py`, `AgentNet_Code/utils/Result_Extractor.py`, `AgentNet_Code/config/setting.py` (L300–L345). O diretório `AgentNet_Code/models/` é uma implementação paralela que o ponto de entrada não importa (busca: `from models|import models` só acha `models/agent.py`). Não foi analisado.

## Mecanismo

1. **Topologia de comunicação.**
   - [código] O grafo dirigido é inicialmente **completo**. Só `graph_type == "complete"` está implementado (`AgentNet_Code/src/agentgraph.py:L49-L67`), com peso inicial 1,0 em toda aresta (`agentgraph.py:L37-L44`). [exemplo] A configuração usa 3 agentes (`config/experiment/bigbenchhard_new_abilities.yaml:L5`, `L29-L34`).
   - [código] A comunicação é um **handoff ponto a ponto**: a tarefa (`TaskChain`) passa de um agente para um vizinho de saída (`src/experiment.py:L116-L121`). Não há broadcast.
   - O README chama a estrutura de "DAG dinâmico" [README/docs] (`readme.md:L18`, `L31-L32`). No código, o que impede revisitas é apenas o prompt e o `forward_history` (ver item 3). Não encontrei checagem de aciclicidade no laço (busca: `cycle|acyclic` em `src/`).
2. **Quem decide quem age.**
   - [código] O primeiro agente é escolhido por heurística: maior média de habilidades para o `task_type`, com empate aleatório (`agentgraph.py:L74-L117`).
   - [código] Depois, **cada agente decide por LLM** entre `forward`, `split` ou `execute` (`src/agent.py:L63-L119`). O ID pedido pelo LLM só é aceito se o vizinho tiver habilidade média ≥0,5, carga <3 e estiver na lista de vizinhos. Caso contrário, entra `find_best_alternative_agent`, com score `0.4·habilidade + 0.3·(1−carga/3) + 0.2·sucesso + 0.1·saída` (`agent.py:L98-L110`, `L426-L449`).
   - [código] Após um `split`, o LLM decide `completed` ou `incompleted` e o próximo agente (`agent.py:L160-L211`; `experiment.py:L155-L206`).
3. **Critério de término.**
   - [código] `execute` encerra a tarefa (`experiment.py:L132-L152`). Após `split`, `completed` encerra (`experiment.py:L194-L195`), e `incompleted` incrementa um contador com teto duro `max_execution_times` (`experiment.py:L197-L206`). [exemplo] Esse teto vale 5 no YAML (`yaml:L7`).
   - [código] O **limite de saltos não é duro.** `forward_path_max_length` (3, `yaml:L6`) só troca o prompt para o modo "Split_and_Execute" quando `forward_times <= 0` (`agent.py:L748-L749`). Se o LLM ainda responder `forward`, o ramo de forward roda de novo sem checar o contador (`experiment.py:L116-L121`).
   - [código] O laço é `while True` sem ramo `else`: uma decisão vazia ou fora de {forward, execute, split}, ou um pós-split fora de {completed, incompleted}, faz o laço repetir com novas chamadas ao LLM (`experiment.py:L95-L207`). Não encontrei teto global de iterações nem timeout por tarefa (busca: `timeout|max_iter|max_steps` em `src/`).
4. **Verificação/aceite mecânico.**
   - [código] Exact-match normalizado contra o gabarito (yes/no, opção entre parênteses, string): `evaluator/evaluator.py:L100-L113`, com extração da última linha `RESULT:` (`utils/Result_Extractor.py:L9-L19`).
   - [código] O resultado (`success`) **realimenta o sistema durante o treino**: ele entra no pool de experiência, atualiza os pesos de aresta e as habilidades (`experiment.py:L240-L302`). No teste, só mede (`experiment.py:L352-L356`). Não há verificação interna sem gabarito, nem LLM-judge.
5. **Controle de custo/orçamento.** [código] Inexistente. Cada chamada tem `max_tokens=2048` (`src/utils.py:L72`, `L92`). Não há contagem de tokens ou custo para o modelo padrão `gpt-4o-mini` (busca: `usage|prompt_tokens|completion_tokens|cost`; a única ocorrência é um log de `usage` no caminho Qwen, `utils.py:L126`). Cada passo de roteamento faz pelo menos uma chamada ao LLM, e cada execução faz duas (pensamento + execução quando `user_react=True`: `agent.py:L795-L808`; `yaml:L8`).
6. **Memória (pools de experiência).**
   - [código] Cada agente tem um pool de roteador e um de executor (`agent.py:L43-L52`, `L478-L486`, `L720-L728`). Só trajetórias **bem-sucedidas** entram no pool de recuperação; as falhas vão para `failure_experiences`, uma lista sem limite (`src/pool.py:L108-L128`, `L306-L327`). A recuperação usa top-k=3 com limiar de cosseno 0,7 (BGE-large) (`pool.py:L237-L265`; `yaml:L26-L27`).
   - [código] **Capacidade:** o executor tem limite 40 (`yaml:L21`), aplicado em `pool.py:L324`. O roteador tem `-1`, ou seja, sem limite (`yaml:L23`; condição `self.capacity >= 0` em `pool.py:L125`). O pool global de roteador também tem `capacity=-1` (`src/global_vars.py:L4`). As listas `success_experiences` e `embedding_cache` não têm limite (`pool.py:L80-L84`, `L96-L103`). `embedding_cache_limit: 1000` (`yaml:L22`) não é lido em nenhum ponto de `src/` (busca: `embedding_cache_limit`).
   - [código] **A evicção é degenerada (inferência por leitura).** O docstring fala em "LLM decide" (`pool.py:L134`), mas `make_agent_decision` só calcula o embedding BGE do prompt e devolve `str(np.argmax(embedding))`, um índice de dimensão (`pool.py:L190-L206`). Os `task_id` têm o formato `"{chain}_{n}"` (`src/task.py`, ocorrências `task_id=f"{self.task_chain_id}_{self.task_id_count}"`), então nunca coincidem com esse índice. Pelo código de `remove_selected_trajectory` (`pool.py:L208-L220`), quando o pool lota, nada é removido e a nova experiência não é adicionada: o pool **congela** no limite.
   - [código] **Evolução de habilidades:** sucesso soma +0,1, com teto 2,0, e falha não muda nada (`agent.py:L849-L866`). O decaimento (`decay_abilities`) só é chamado de `set_executor_pool_result`, que não tem chamadores (busca: `set_executor_pool_result`), então é código morto. `get_newest_experience` retorna `experiences[:-k]`, isto é, as mais **antigas** (`pool.py:L268-L270`).
7. **Falhas/retry.**
   - [código] O LLM tem `MAX_RETRIES = 3` com espera fixa de 1 s e relança na última tentativa (`src/utils.py:L15`, `L59-L84`). Não há backoff exponencial nem fallback de modelo.
   - [código] Fragilidades no roteamento. `find_best_alternative_agent` pode retornar `None` quando não há vizinhos (`agent.py:L455-L457`), e `agents[None]` em `experiment.py:L120` levantaria `KeyError`. O handler em `agent.py:L113` chama `find_best_alternative_agent(task)` com um argumento a menos, o que levantaria `TypeError` dentro do `except`. O ponto de entrada não captura exceções (`run_bigbenchhard_train_test.py:L125-L130`, try comentado).
8. **Poda de comunicação.**
   - [código] O peso de aresta é atualizado multiplicativamente: ×1,1 no sucesso, ×0,9 na falha, vezes um fator de tempo `min(1, 1/(0.1·t))`, limitado a [0,1; 2,0] (`agentgraph.py:L140-L155`). Com peso ≤0,3, a aresta é **removida** de `outcoming_agent_id` (`agentgraph.py:L158-L160`) e o vizinho deixa de ser anunciado no prompt (`agentgraph.py:L125-L127`).
   - [código] A remoção é **irreversível**: só há `append` na inicialização (`agentgraph.py:L65`; busca `outcoming_agent_id"].append`). O `t` usado no fator de tempo é a latência da chamada de roteamento (`agent.py:L121`).
9. **Tamanho do swarm.** [código] É fixo. Um `assert agent_num == len(agent_config)` garante o número (`run_bigbenchhard_train_test.py:L93`), e os agentes são criados uma única vez (`agentgraph.py:L28-L46`). A especialização muda as habilidades, não o número de agentes (busca: `spawn|add_agent|remove_agent`, sem ocorrências).
10. **Benchmark custo vs qualidade.** Ausente como código. Só a acurácia de treino e teste é registrada (`experiment.py:L229-L235`). Há um log versionado, `AgentNet_Code/log/test.log` (3179 linhas, datado de 2025-03-02), com linhas de acurácia. É um artefato dos autores, não validado aqui. O README não traz números. O `AgentNet.pdf` incluído no repositório não foi lido.

## Evidência

- **Implementação observada:** roteamento LLM com validação heurística, término parcialmente duro, exact-match realimentando arestas, pools e habilidades, poda irreversível de arestas por limiar de peso, pools com capacidade e evicção inoperante, nenhum controle de custo.
- **Relato dos autores:** "Fully Decentralized Architecture… improving fault tolerance" e "Dynamically Evolving DAG Topology" (`readme.md:L28-L32`). A limitação declarada no paper (via contexto, paper não lido aqui) é que o roteador opera sobre um conjunto pequeno de candidatos predefinidos. Isso é coerente com o código: grafo completo de 3 agentes fixos.
- **"Descentralizado" na prática:** o controle de fluxo fica em uma única classe `Experiment`, que recebe o `success` global e atualiza todos os agentes (`experiment.py:L1-L6`, `L240-L260`). A decisão de rota é local a cada agente, mas a orquestração e o crédito são centrais.
- **Lacunas:** não li `src/task.py` por inteiro, `src/utils.py` fora de L55–L144, os prompts (exceto L300–L345 de `setting.py`) nem `models/`. As consequências de execução descritas nos itens 6 e 7 são inferências por leitura, não comportamento observado.
- Nenhum código foi executado; nenhum benchmark reproduzido.

## Análogo de engenharia

*Hipótese.* Para o Observatory, AgentNet é um caso de "N agentes com roteamento por LLM e crédito por aceite". O aceite mecânico (exact-match) já é o sinal que poda arestas e alimenta a memória, o que se alinha a custo por tarefa aceita. Para uma comparação justa com 1 agente forte, faltaria: (a) teto duro de saltos e de chamadas por tarefa, já que hoje um laço pode girar sem limite; (b) contagem de tokens por tarefa, considerando que cada salto custa ≥1 chamada e cada execução 2; (c) uma evicção real e limitada nos pools.

## Hipótese testável

- *Hipótese H1:* em BBH com 3 agentes, o número médio de chamadas ao LLM por tarefa aceita é pelo menos 3× o de um agente único que executa direto (1–2 chamadas por tarefa). A métrica é chamadas, ou tokens, por item com exact-match verdadeiro. A hipótese é falsa se a razão for menor que 3.
- *Hipótese H2:* com `executor_memory_limit=40`, depois que um agente acumula 40 sucessos a acurácia de teste deixa de melhorar com mais treino, porque o pool congela. A métrica é a acurácia de teste em função do número de tarefas de treino (40, 80, 120). A hipótese é falsa se a acurácia continuar subindo mais de 2 p.p. depois do congelamento.

## Limites/lacunas

- Sem licença, e a oficialidade é apenas autodeclarada.
- O término depende de o LLM obedecer o formato. Não há teto global de passos nem orçamento.
- A evicção "inteligente" não chama LLM e, pela leitura, nunca remove nada. O decaimento de habilidades é código morto. A correlação entre tipos de tarefa provavelmente nunca é calculada (ela é comparada só dentro do mesmo `task_type`; `agent.py:L870-L878`).
- A topologia "evolutiva" se resume a remover arestas de um grafo completo pequeno. Não há criação de arestas nem de agentes.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| — parcial: só o ramo split tem teto duro (`max_execution_times=5`, `experiment.py:L203-L206`); limite de forward só por prompt (`agent.py:L748`); `while True` sem else | ✓ exact-match com gabarito no laço de treino (`evaluator.py:L100-L113`; `experiment.py:L219`, `L240-L260`) | — só `max_tokens=2048` por chamada (`utils.py:L72`); sem contagem | ✓ aresta removida com peso ≤0,3 (`agentgraph.py:L155-L160`) | — `agent_num` fixo (`run_bigbenchhard_train_test.py:L93`) | ✓ parcial: executor com capacidade 40 (`pool.py:L324`; `yaml:L21`); roteador `-1` ilimitado; evicção inoperante (`pool.py:L190-L220`) | — sem arquivo LICENSE nem declaração no readme |
