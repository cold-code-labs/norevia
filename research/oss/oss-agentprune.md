---
id: oss-agentprune
title: AgentPrune — poda periódica de arestas espaciais/temporais por magnitude de logit aprendido
area: oss
evidence: implementacao-observada
tags: [poda-de-comunicacao, mascara-de-arestas, reinforce, grafo-espacio-temporal, termino-explicito, rodadas-fixas, sem-licenca, contabilidade-de-tokens-inativa]
sources:
  - "https://github.com/yanweiyue/AgentPrune/tree/c544dd6a1858c02c6d5d371d23c6e6ff55e0be21 (commit inspecionado, clone raso em 2026-11-07)"
  - "Zhang et al., Cut the Crap: An Economical Communication Pipeline for LLM-based Multi-Agent Systems, arXiv:2410.02506v1; ICLR 2025 (https://openreview.net/forum?id=LkzuPorQ5L, citado no README)"
related: [oss-gptswarm, oss-agentnet, oss-autogen, oss-matriz]
updated: 2026-11-07
summary: "Derivado do GPTSwarm, aprende logits de arestas espaciais (intra-rodada) e temporais (entre rodadas) via REINFORCE e zera periodicamente as de menor logit; a contagem de tokens existe mas não é chamada no código inspecionado."
---

## Identificação

- Repositório: https://github.com/yanweiyue/AgentPrune
- Commit: `c544dd6a1858c02c6d5d371d23c6e6ff55e0be21`
- Data do commit (`git log -1 --format=%cI`): 2025-03-23T21:10:20+08:00
- Licença: **nenhum arquivo de licença.** Busca: `find -iname "*licen*" -o -iname "COPYING*"` no repositório inteiro, sem resultado. O README também não declara licença (lido por inteiro, 90 linhas). Ele diz "This code refers to GPTSwarm" (`README.md:L89`), que é MIT, mas isso não concede licença a este repositório. Situação: **lacuna**, ou seja, sem permissão explícita de reuso.
- Arquivos lidos: `README.md`, `AgentPrune/graph/graph.py`, `AgentPrune/graph/node.py`, `AgentPrune/graph/autogen_graph.py`, `AgentPrune/agents/final_decision.py`, `AgentPrune/agents/analyze_agent.py`, `AgentPrune/llm/gpt_chat.py`, `AgentPrune/llm/price.py` (L1–L45), `AgentPrune/llm/llm.py` (grep), `AgentPrune/utils/globals.py`, `AgentPrune/graph/autogen_node.py` (grep), `experiments/run_mmlu.py`, `experiments/train_mmlu.py`, `experiments/evaluate_mmlu.py`, `experiments/accuracy.py`, `experiments/run_humaneval.py` (L30–L228), `dataset/mmlu_dataset.py` (L73–L85), e greps em `experiments/run_gsm8k.py` e `experiments_autogen/*`.

## Mecanismo

1. **Topologia de comunicação.**
   - [código] Há dois grafos sobre os mesmos N agentes. O **espacial** é um DAG dentro da rodada: o nó lê as saídas atuais dos predecessores (`AgentPrune/graph/node.py:L114-L128`). O **temporal** liga rodadas: o nó lê a saída da rodada anterior via `last_memory` (`node.py:L130-L143`).
   - [código] As arestas potenciais são todos os pares N×N (`AgentPrune/graph/graph.py:L135-L142`), filtrados por máscaras fixas. O default espacial é completo sem laços e o temporal é completo (`graph.py:L47-L50`).
   - [exemplo] Os scripts definem as topologias Chain, Star, Mesh, Layered, Debate, Random e FullConnected como máscaras (`experiments/run_mmlu.py:L87-L149`).
   - [código] No fim, todos os nós (`"all connected"`) ou só o último (`"last connected"`) ligam-se ao nó de decisão (`graph.py:L162-L167`, `L295-L298`).
2. **Quem decide quem age.** [código] Ordem topológica de Kahn sobre o grafo espacial amostrado em cada rodada (`graph.py:L273-L291`), sem seletor LLM. Cada aresta não mascarada é sorteada por Bernoulli com `sigmoid(logit/temperature)` (`graph.py:L182-L190`, `L209-L216`). Se a otimização estiver desligada, o logit inicial vale 10, ou seja, a aresta fica praticamente sempre ligada (`graph.py:L71`, `L76`).
3. **Critério de término.**
   - [código] O número de rodadas é fixo: `num_rounds` tem default 3 em `Graph.run`/`arun` (`graph.py:L221-L228`, `L264-L270`). [exemplo] Os scripts usam 1 (MMLU, GSM8K) ou 2 (HumanEval, AutoGen) (`run_mmlu.py:L38`; `run_humaneval.py:L50`).
   - [código] Por nó: `max_tries=3`, timeout `max_time=600` s (`graph.py:L276-L285`).
   - [exemplo] O treino roda `num_iterations` fixo, default 10 (`run_mmlu.py:L34`; `train_mmlu.py:L35`).
4. **Verificação/aceite mecânico.**
   - [código] `FinalWriteCode` roda `PyExecutor` sobre asserts extraídos dos exemplos `>>>` do enunciado para cada código recebido e coloca "passes internal testing? True/False" no prompt do LLM decisor (`AgentPrune/agents/final_decision.py:L16-L46`). O teste **informa** o LLM, mas não bloqueia a resposta.
   - [código] `FinalMajorVote` é um voto majoritário determinístico sobre respostas pós-processadas (`final_decision.py:L142-L169`). O default dos scripts MMLU é `FinalRefer`, agregação por LLM (`run_mmlu.py:L46`; `final_decision.py:L68-L105`).
   - [exemplo] A utilidade do treino é exact-match (`experiments/accuracy.py`; `train_mmlu.py:L62-L66`) ou os testes oficiais do HumanEval (`run_humaneval.py:L125-L131`).
5. **Controle de custo/orçamento.**
   - [código] `cost_count` conta tokens com `tiktoken` e acumula em singletons (`AgentPrune/llm/price.py:L7-L44`), **mas nunca é chamada**. É importada em `gpt_chat.py:L10`, e `achat` não a chama (`gpt_chat.py:L23-L30`; busca `cost_count(` só acha a definição). Os scripts importam `Cost/PromptTokens/CompletionTokens` sem lê-los (busca: `Cost.instance`, nenhuma ocorrência fora de `price.py`).
   - [código] `GPTChat.agen` calcula `max_tokens` (default 1000, `AgentPrune/llm/llm.py:L8`), mas não o repassa à API (`gpt_chat.py:L47-L56` → `achat(self.model_name, messages)`).
   - Conclusão: não há orçamento técnico nem medição de tokens ativa neste commit.
6. **Memória.** [código] Cada nó guarda só a última rodada (`last_memory`, que é sobrescrita em `update_memory`: `node.py:L64`, `L109-L112`), uma janela estrutural de 1 rodada. Na variante AutoGen, `conversation_history` é reconstruído concatenando o histórico do vizinho a cada passo, sem limite explícito (`AgentPrune/graph/autogen_node.py:L38-L39`, só via grep). `GraphAutoGen.chain_idx_list/chain_str_list` só crescem (`autogen_graph.py:L22-L23`, `L31-L32`, `L44-L45`).
7. **Falhas/retry.**
   - [código] O LLM tem `@retry(wait_random_exponential(max=300), stop_after_attempt(3))` (`gpt_chat.py:L23`).
   - [código] No grafo, qualquer exceção é capturada e o nó é re-tentado até 3 vezes. Depois disso a execução segue com o nó sem saída (`graph.py:L278-L285`).
   - [código] `GPTChat.gen` (síncrono) é `pass` e devolve `None` (`gpt_chat.py:L58-L65`), então só o caminho `arun` é funcional.
8. **Poda de comunicação (núcleo do projeto).**
   - [código] `update_masks(pruning_rate)` ordena os logits (as arestas já mascaradas ficam forçadas para o fim, com `min-1`) e zera as `round(arestas_ativas × rate)` de menor logit, com mínimo de 1, nos grafos espacial e temporal (`graph.py:L317-L339`). A poda é **cumulativa e irreversível**: a máscara zerada nunca é restaurada (busca: `spatial_masks\[.*\] = 1`, sem ocorrências).
   - [exemplo] **Quando:** a cada `imp_per_iters` iterações de treino (`train_mmlu.py:L82-L83`), default 5, com `pruning_rate` default 0,25 (`run_mmlu.py:L36-L41`). O help do argumento diz "Default 0.05" (`run_mmlu.py:L41`), mas o valor real é 0,25. A assinatura de `train()` tem `pruning_rate=0.05` e `imp_per_iters=1` (`train_mmlu.py:L20-L21`), sobrescritos pelo script. Nos scripts HumanEval e GSM8K, a poda só ocorre enquanto `i_batch < num_iterations`, e depois a otimização é desligada (`run_humaneval.py:L159-L163`).
   - Com os defaults de MMLU (10 iterações, poda a cada 5), são **2 eventos de poda**: periódica, não one-shot. Não confirmei se isso corresponde ao procedimento "one-shot" descrito no paper (paper não lido).
   - [código] Na inferência, as arestas não mascaradas continuam sorteadas estocasticamente pelos logits (`arun` chama `construct_spatial_connection()` sem `threshold`, `graph.py:L271`).
   - [código] **Inconsistência:** `GraphAutoGen.construct_spatial_connection` não consulta `spatial_masks` (`autogen_graph.py:L25-L49`), então a poda por máscara não tem efeito no grafo espacial da variante AutoGen.
   - Regularização de baixo posto ou esparsidade: não encontrada no código inspecionado (busca: `nuclear|svd|low.?rank|regulari|sparsit|one.?shot`).
9. **Tamanho do swarm.** [código] É fixo: os nós vêm de `agent_names × agent_nums` (`graph.py:L124-L133`; `run_mmlu.py:L63`). A poda pode isolar um agente (sem arestas), mas o nó continua sendo executado em toda rodada (Kahn percorre todos os nós com grau 0, `graph.py:L273-L274`). Isso não corta o custo do agente, só a comunicação.
10. **Benchmark custo vs qualidade.** [código/exemplo] Ausente como código: só a acurácia é gravada (`run_humaneval.py:L133-L145`; `evaluate_mmlu.py:L60-L71`). O README não traz números. Relato dos autores, informado no contexto da tarefa (paper não lido aqui): redução de tokens de 28,1% a 72,8%. Esse valor **não é reproduzível com o código deste commit**, porque o contador de tokens está desconectado (item 5).

## Evidência

- **Implementação observada:** máscaras espaciais e temporais, REINFORCE sobre logits (`train_mmlu.py:L57-L73`), poda periódica por magnitude, rodadas fixas, retry com backoff, contabilidade de tokens presente mas não chamada.
- **Relato dos autores:** ICLR 2025 (`README.md:L8`); "prune redundant or even malicious communication messages to improve the reasoning accuracy and efficiency" (`README.md:L15`); redução de tokens de 28,1% a 72,8% (paper, via contexto).
- **Lacunas:** não li os prompt sets, os datasets GSM8K e HumanEval nem `agents/*_ag.py` por inteiro. Não verifiquei como os autores mediram os tokens do paper; possivelmente o fizeram com código que não está neste commit.
- Nenhum código foi executado; nenhum benchmark reproduzido.

## Análogo de engenharia

*Hipótese.* `update_masks` é um mecanismo de poda simples e auditável (top-k por logit, cumulativo) que pode virar uma condição do Observatory: "N agentes, comunicação podada após um aquecimento de K tarefas". Duas lições de engenharia saem da leitura. Primeiro, a poda de **arestas** não reduz o custo fixo de **nós**, pois todo agente continua sendo chamado; para custo por tarefa aceita, também seria preciso podar nós. Segundo, a métrica de tokens precisa de instrumentação ativa no wrapper do LLM, coisa que aqui está desligada.

## Hipótese testável

- *Hipótese H1:* com N=5 agentes e mesmo número de rodadas, aplicar `update_masks` até a densidade de arestas cair a ≤50% reduz os tokens de entrada por tarefa aceita em pelo menos 25% em relação a FullConnected, sem queda de acurácia maior que 2 p.p. Métrica: tokens de prompt por item aceito, medidos no wrapper. A hipótese é falsa se a redução for menor que 25%.
- *Hipótese H2:* como os nós isolados continuam sendo chamados, a redução de tokens de **saída** por tarefa é menor que 10%. A hipótese é falsa se a redução for maior ou igual a 10%.

## Limites/lacunas

- Sem licença: o reuso de código não está autorizado. Por ora, só a ideia pode ser citada.
- A contagem de tokens está desconectada e `max_tokens` não é repassado, então o próprio repositório não sustenta números de custo.
- Na variante AutoGen, as máscaras não afetam o grafo espacial.
- No HumanEval, treino e avaliação são online sobre o mesmo fluxo de dados, e a acurácia gravada é cumulativa sobre todos os lotes, incluindo os de treino (`run_humaneval.py:L93-L163`).
- A poda é irreversível e depende de logits treinados com poucos lotes (10 iterações × 4 por default).

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ `num_rounds` fixo (default 3, `graph.py:L264-L270`) + `max_tries=3`/600 s | ✓ exact-match/testes HumanEval como utilidade de treino (exemplo, `run_humaneval.py:L125`); no núcleo, testes só informam o LLM (`final_decision.py:L42-L43`) | — `cost_count` nunca chamado (`gpt_chat.py:L23-L30`); `max_tokens` não repassado | ✓ `update_masks` zera os logits mais baixos a cada `imp_per_iters` (`graph.py:L317-L339`; `train_mmlu.py:L82-L83`) | — agentes fixos; nó isolado ainda executa (`graph.py:L273`) | ✓ janela de 1 rodada (`node.py:L109-L112`); variante AutoGen sem limite | — sem arquivo LICENSE nem declaração no README |
