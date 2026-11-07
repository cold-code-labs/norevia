---
id: oss-gptswarm
title: GPTSwarm — agentes como grafo computacional com arestas otimizadas por REINFORCE
area: oss
evidence: implementacao-observada
tags: [grafo-otimizavel, dag, reinforce, poda-de-comunicacao, termino-explicito, aceite-verificavel, rastreamento-de-custo, memoria-ilimitada]
sources:
  - "https://github.com/metauto-ai/GPTSwarm/tree/c23a827f561c934ce21dd950408f7606aa4a8821 (commit inspecionado, clone raso em 2026-11-07)"
  - "Zhuge et al., GPTSwarm: Language Agents as Optimizable Graphs, ICML 2024, https://proceedings.mlr.press/v235/zhuge24a.html (o README cita arXiv:2402.16823; versão não verificada)"
related: [oss-agentprune, oss-agentnet, oss-matriz]
updated: 2026-11-07
summary: "Biblioteca que representa agentes como subgrafos de um DAG e aprende, via REINFORCE com utilidade exact-match, a probabilidade de cada aresta entre agentes; mede custo, mas não o limita."
---

## Identificação

- Repositório: https://github.com/metauto-ai/GPTSwarm
- Commit: `c23a827f561c934ce21dd950408f7606aa4a8821`
- Data do commit (`git log -1 --format=%cI`): 2026-02-05T13:39:09+03:00
- Licença: **MIT** (arquivo lido: `LICENSE`, L1 "MIT License", "Copyright (c) 2024 metauto.ai"). O README também mostra um selo MIT (`README.md:L3`), mas o que vale é o arquivo.
- Arquivos lidos: `swarm/graph/graph.py`, `swarm/graph/node.py`, `swarm/graph/composite_graph.py`, `swarm/graph/swarm.py`, `swarm/optimizer/edge_optimizer/parameterization.py`, `swarm/optimizer/edge_optimizer/optimization.py`, `swarm/optimizer/node_optimizer/node_optimization.py`, `swarm/optimizer/node_optimizer/prompt_optimizer.py` (L40–L130), `swarm/memory/memory.py`, `swarm/llm/price.py` (L1–L60), `swarm/llm/gpt_chat.py` (L25–L114), `swarm/llm/llm.py` (via grep), `swarm/utils/globals.py`, `swarm/environment/operations/final_decision.py`, `swarm/environment/operations/humaneval/code_writing.py` (L55–L120), `swarm/environment/tools/coding/python_executor.py`, `swarm/environment/tools/coding/executor_utils.py`, `swarm/environment/domain/crosswords/evaluator.py`, `experiments/evaluator/evaluator.py` (L90–L309), `experiments/evaluator/accuracy.py`, `experiments/run_mmlu.py` (grep), `experiments/run_humaneval.py` (L60–L115), `experiments/run_gaia.py` (L95–L175), `README.md` (grep).

## Mecanismo

1. **Topologia de comunicação.** [código] É um DAG composto (`CompositeGraph`) em que cada agente é um subgrafo de nós (operações) e há um nó final de decisão (`swarm/graph/composite_graph.py:L13-L37`). Com `edge_optimize=True`, o conjunto de arestas *potenciais* inclui todos os pares de nós entre agentes diferentes, nos dois sentidos, mais arestas de cada nó para o nó de decisão (`swarm/graph/swarm.py:L79-L95`). Sem otimização, apenas as saídas de cada agente ligam-se ao nó de decisão, o que forma uma estrela de agregação (`swarm/graph/swarm.py:L97-L102`). Cada nó lê as saídas dos predecessores (`swarm/graph/node.py:L113-L126`). Arestas que fechariam ciclo são rejeitadas na amostragem (`swarm/optimizer/edge_optimizer/parameterization.py:L104-L106`).
2. **Quem decide quem age.** [código] É uma ordem topológica determinística (algoritmo de Kahn sobre os graus de entrada), sem seletor LLM (`swarm/graph/graph.py:L125-L152`). *Quais* arestas existem em cada execução é sorteado por Bernoulli a partir de `sigmoid(edge_logit/temperature)` (`parameterization.py:L107-L115`). Há uma opção para aprender também a ordem dos nós (`realize_ranks`, `parameterization.py:L62-L82`).
3. **Critério de término.**
   - [código] A execução de um grafo termina quando a fila topológica se esvazia (`graph.py:L133`). O DAG é garantido pela checagem de ciclo.
   - [código] Cada nó tem timeout `max_time=600` s e até `max_tries=3` tentativas apenas em `TimeoutError`. Qualquer outra exceção interrompe as tentativas e o fluxo segue (`graph.py:L111-L146`).
   - [código] O laço de otimização de arestas tem número fixo de iterações: `num_iter=100` por padrão em `optimize()` (`swarm/optimizer/edge_optimizer/optimization.py:L8-L13`). [exemplo] `--num-iterations` tem default 200 em `experiments/run_mmlu.py:L22`. Não há parada antecipada por convergência (busca: `early|converge|patience` em `swarm/optimizer` e `experiments/evaluator`; o único acerto é a palavra "clearly" num texto de prompt em `prompt_optimizer.py:L185`).
4. **Verificação/aceite mecânico.**
   - [código] O nó `CodeWriting` (domínio HumanEval) extrai asserts dos exemplos `>>>` do enunciado e roda `PyExecutor` sobre o código gerado, guardando `is_solved` e `feedback` (`swarm/environment/operations/humaneval/code_writing.py:L77-L91`). O executor faz `exec` em `globals()`, com timeout por thread e sem sandbox (`swarm/environment/tools/coding/python_executor.py:L34-L56`, `executor_utils.py:L37-L48`).
   - [código] O nó final `FinalDecision` tem estratégias determinísticas (`MajorityVote`, `RandomChoice`) e estratégias por LLM (`OutputsAsReferences`, `SelfConsistency`, `SelectBest`) (`swarm/environment/operations/final_decision.py:L19-L130`). A padrão é `OutputsAsReferences`, ou seja, agregação por LLM (`swarm.py:L33`).
   - [exemplo] A utilidade usada para otimizar arestas é exact-match (`experiments/evaluator/accuracy.py:L7-L8`, `experiments/evaluator/evaluator.py:L266-L275`). Em crosswords, a utilidade é a fração de palavras ou letras corretas no ambiente (`swarm/environment/domain/crosswords/evaluator.py:L44-L51`). Esses são checks determinísticos contra gabarito, mas estão nos scripts e avaliadores, não no núcleo do grafo.
5. **Controle de custo/orçamento.** [código] Só rastreia. `cost_count` acumula custo em US$ e tokens em singletons globais (`swarm/llm/price.py:L11-L52`, `swarm/utils/globals.py:L19-L29`), e nenhum código lido interrompe a execução com base nesses contadores (busca: `Cost.instance` aparece só em logs e scripts). Existe um teto por chamada, `DEFAULT_MAX_TOKENS = 1000` (`swarm/llm/llm.py:L8`), mas não um orçamento total. [exemplo] `experiments/run_gaia.py:L105` e `L167` registram custo acumulado e tokens junto com a acurácia.
6. **Memória.** [código] `GlobalMemory` é um singleton com um dicionário `id -> lista`, append sem limite e sem evicção; só existe `clear()` (`swarm/memory/memory.py:L35-L51`, `L99-L100`, `L115-L118`). A busca por similaridade (BERT) é opcional (`memory.py:L71-L96`). Limites locais:
   - demonstrações limitadas a `max_domenstrations=4` por amostragem aleatória (`swarm/optimizer/node_optimizer/node_optimization.py:L13-L16`; default em `swarm/environment/operations/optimizable_operation.py:L20`);
   - janelas de leitura `[-4:]` e `[-10:]` (`node_optimization.py:L7`, `code_writing.py:L110`).
7. **Falhas/retry.**
   - [código] A chamada assíncrona ao LLM tem `@retry(wait_random_exponential(max=100), stop_after_attempt(10))` e timeout de 1000 s (`swarm/llm/gpt_chat.py:L68-L101`). A versão síncrona `gpt_chat` não tem decorator de retry (`gpt_chat.py:L30`).
   - [código] No nó, exceções de tarefas são capturadas com `return_exceptions=True` e apenas logadas; o nó fica com saídas vazias e o grafo continua (`swarm/graph/node.py:L133-L141`). Não há circuit breaker nem fallback de modelo (busca: `fallback|circuit`).
8. **Poda de comunicação.**
   - [código] As arestas entre agentes são parâmetros aprendidos. Com probabilidade baixa, a aresta tende a não ser amostrada (`parameterization.py:L107-L115`). Na avaliação, a máscara é binarizada (`edge_probs > 0.5`, `experiments/evaluator/evaluator.py:L114-L117`) ou se usa `threshold` (`parameterization.py:L108-L109`). O README descreve isso como "edge pruning (value 0)" (`README.md:L71`) [README/docs].
   - [código] Em runtime, `Graph.run` executa apenas nós que alcançam o nó de saída (`is_node_useful`, `graph.py:L116-L127`), o que poupa chamadas de nós desconectados.
   - [código] `CompositeGraph.mutate` adiciona e remove arestas aleatoriamente (`composite_graph.py:L55-L86`), mas nenhum chamador foi encontrado (busca: `\.mutate(`).
9. **Tamanho do swarm.** [código] É fixo. Os agentes vêm de `agent_names` em `organize()` (`swarm.py:L63-L73`). Não há criação nem remoção de agentes por demanda (busca: `spawn|add_agent|remove_agent|elastic`, sem ocorrências).
10. **Benchmark custo vs qualidade.** [exemplo] `experiments/run_gaia.py:L155-L168` grava, por item, `Accuracy` e `Total Cost` acumulado. Nesse commit, porém, o swarm está comentado e roda um único `agent` (`run_gaia.py:L107-L119`). Os scripts MMLU e HumanEval registram só a acurácia (`experiments/run_humaneval.py:L84-L111`). Não há tabela de custo vs qualidade no README (grep por `cost|token` só acha a descrição do módulo `swarm.llm`, `README.md:L29`).

## Evidência

- **Implementação observada:** grafo, amostragem e otimização de arestas (REINFORCE com baseline de média móvel em `optimization.py:L24-L28`; sem baseline em `experiments/evaluator/evaluator.py:L274`), rastreamento de custo sem corte, memória global sem limite, retry com backoff na chamada assíncrona, executor de testes no domínio HumanEval.
- **Relato dos autores:** aceito no ICML 2024 como oral (`README.md:L43-L57`). Os ganhos de desempenho do paper não foram verificados aqui.
- **Lacunas:** não li `swarm/environment/agents/*` além dos nomes, nem os prompts ou `notebooks/`. Não verifiquei se os resultados do paper usam `optimization.py` ou `experiments/evaluator/evaluator.py`.
- Nenhum código foi executado; nenhum benchmark reproduzido.

## Análogo de engenharia

*Hipótese.* No Swarm Efficiency Observatory, o `EdgeWiseDistribution` serve de modelo para uma condição "N agentes com topologia aprendida", a comparar com "N agentes totalmente conectados" e "1 agente forte". A utilidade de treino já é um aceite mecânico (exact-match ou testes), o que se alinha à métrica de custo por tarefa aceita. O que falta é colocar custo na função de utilidade (hoje é só acurácia) e cortar a execução quando um teto for atingido; os contadores em `price.py` já existem para isso.

## Hipótese testável

- *Hipótese H1:* com o mesmo conjunto de agentes, o grafo com arestas aprendidas (máscara `>0.5`) tem custo por tarefa aceita (US$ ou tokens por item resolvido, por exact-match ou testes) pelo menos 20% menor que o grafo totalmente conectado (`realize_full`) no split de validação, sem queda de acurácia maior que 2 p.p. Ela é falsa se a redução de custo for menor que 20% ou a perda de acurácia passar de 2 p.p.
- *Hipótese H2:* somando o custo do treino de arestas (`num_iters × batch_size` execuções), a configuração otimizada só supera "1 agente forte" em custo por tarefa aceita depois de K tarefas de inferência. A métrica é o K de break-even. A hipótese é falsa se K for maior que o tamanho do conjunto de teste.

## Limites/lacunas

- O custo é medido, mas não entra na otimização nem limita a execução.
- O executor de código roda `exec` sem sandbox. Num benchmark, precisaria de isolamento externo.
- Exceções que não são timeout encerram as tentativas do nó em silêncio (`graph.py:L143-L145`), o que pode mascarar falhas na contagem de aceite.
- Dois caminhos de otimização coexistem (`swarm/optimizer/edge_optimizer/optimization.py` e `experiments/evaluator/evaluator.py`), com baselines diferentes.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ DAG + `max_tries=3`/`max_time=600` (`graph.py:L111-L146`); `num_iter` fixo (`optimization.py:L8`) | ✓ testes `PyExecutor` no nó HumanEval (`code_writing.py:L82`); exact-match na otimização (`accuracy.py:L7-L8`, exemplo); agregador padrão é LLM | — custo só acumulado (`price.py:L47-L49`); só `max_tokens=1000` por chamada (`llm.py:L8`) | ✓ arestas amostradas e binarizadas por probabilidade aprendida (`parameterization.py:L107-L115`; `evaluator.py:L116`) | — agentes fixos (`swarm.py:L63-L73`) | — `GlobalMemory` sem capacidade (`memory.py:L48-L51`); só demos limitadas a 4 | MIT (`LICENSE:L1`) |
