---
id: oss-moa
title: Mixture-of-Agents (Together) — camadas de proponentes LLM agregadas por prompt de síntese
area: oss
evidence: implementacao-observada
tags: [llm, mixture-of-agents, agregador, camadas-fixas, llm-as-judge, retry-backoff, sem-contabilidade-de-custo]
sources:
  - "https://github.com/togethercomputer/MoA/tree/1b5cab0f0905d9da821e37322ac6df96ba65e1a7 (commit inspecionado, clone raso em 2026-11-07)"
  - "Wang, J.; Wang, J.; Athiwaratkun, B.; Zhang, C.; Zou, J. Mixture-of-Agents Enhances Large Language Model Capabilities. arXiv:2406.04692 (2024; citado em README.md:L4, L153-L159; versão não registrada). https://arxiv.org/abs/2406.04692"
related: [oss-gptswarm, oss-agentprune, oss-camel, oss-autogen, oss-matriz, oss-padroes]
updated: 2026-11-07
summary: O MoA chama em paralelo ou em sequência uma lista fixa de modelos proponentes por um número fixo de camadas e injeta as respostas num system prompt de síntese para um agregador; tem retry com backoff, mas não tem aceite mecânico, orçamento nem medição de custo, e a qualidade é avaliada só por juízes LLM.
---

## Identificação
- URL: https://github.com/togethercomputer/MoA
- SHA completo: `1b5cab0f0905d9da821e37322ac6df96ba65e1a7`; data do commit: 2025-01-06T22:21:19-05:00.
- Licença: `LICENSE` é o texto da **Apache License, Version 2.0, January 2004** (225 linhas; li o cabeçalho L1-L3). `README.md:L145-L147` também declara Apache 2.0.
- Escopo efetivamente lido:
  - inteiros: `utils.py`, `moa.py`, `advanced-moa.py`, `bot.py`, `generate_for_alpaca_eval.py`, `run_eval_*.sh`, `tests.py`, `README.md`, `requirements.txt`;
  - por grep e trechos: `generate_for_mt_bench.py`, `generate_for_flask.py`, `eval_mt_bench.py:L138-L240`, `FLASK/gpt_review/gpt4_eval.py`, `alpaca_eval/src/alpaca_eval/decoders/openai.py`;
  - `outputs/*.json`: contagem de registros e campo `generator`.
- As pastas vendorizadas `alpaca_eval/`, `FastChat/` e `FLASK/` são código de terceiros com modificações (`README.md:L78-L81`) e não foram lidas por inteiro.

## Mecanismo
1. **Topologia de comunicação.** **[código]** É uma rede em camadas totalmente conectada entre camadas consecutivas, sem comunicação dentro da camada. Cada proponente da camada *i+1* recebe todas as respostas da camada *i*, numeradas, num system prompt (`utils.py:L137-L160`). O agregador final recebe as respostas da última camada da mesma forma.
   - **[exemplo]** `moa.py`: 4 proponentes chamados com `asyncio.gather` (`moa.py:L10-L15, L38`), seguidos de 1 agregador (`moa.py:L16, L39-L46`).
   - **[exemplo]** `advanced-moa.py`: `layers = 3`, ou seja, 1 camada inicial, `layers-2` camadas intermediárias e o agregador (`advanced-moa.py:L21, L64-L83`).
2. **Quem decide quem age.** **[código]** Ninguém decide em runtime: as listas de proponentes e o agregador são fixos. Defaults:
   - `moa.py:L10-L16`: Llama-3.3-70B, Qwen2.5-72B, Qwen2.5-Coder-32B e WizardLM-2-8x22B; agregador Qwen2.5-72B.
   - `bot.py:L34-L39, L86`: Qwen2-72B, Qwen1.5-72B, Mixtral-8x22B e DBRX; agregador Qwen2-72B.
   - Scripts de avaliação, 6 referências: WizardLM-2-8x22B, Qwen1.5-110B, Qwen1.5-72B, Llama-3-70B, Mixtral-8x22B e DBRX; agregador Qwen1.5-72B-Chat (`run_eval_alpaca_eval.sh:L5-L12`, `run_eval_mt_bench.sh`, `run_eval_flask.sh`).
3. **Critério de término.** **[código]** A profundidade é fixa: `rounds=1` por default em `bot.py:L90`, `generate_for_alpaca_eval.py:L78`, `generate_for_flask.py:L90` e `generate_for_mt_bench.py:L185`; `layers=3` em `advanced-moa.py:L21`. O laço de rodadas está em `generate_for_alpaca_eval.py:L33-L60`. O README diz "num rounds == num of MoA layers - 1" (`README.md:L72`). Não há parada por qualidade ou consenso.
4. **Verificação/aceite mecânico.** Não encontrado no código inspecionado (busca: `verify`, `assert`, `check`, `score` em `*.py` de topo). O agregador recebe só a instrução textual "critically evaluate… some of it may be biased or incorrect" (`utils.py:L144-L146`), o que é texto de prompt, não verificação. A avaliação é **offline e por juiz LLM**:
   - MT-Bench com `--judge-model` default `gpt-4` (`eval_mt_bench.py:L184`);
   - FLASK com `gpt-4-0613` (`FLASK/gpt_review/gpt4_eval.py:L134`);
   - AlpacaEval contra as saídas de `gpt4_1106_preview` (`run_eval_alpaca_eval.sh:L14`).
5. **Controle de custo/orçamento técnico.** **[código]**
   - Só existe teto **por chamada**, via `max_tokens`: 2048 em `utils.py:L17, L103, L167`; 512 em `moa.py:L29`, `advanced-moa.py:L54` e `bot.py:L89`.
   - No script AlpacaEval, o agregador é chamado sem `temperature` nem `max_tokens` e herda 0.7/2048 (`generate_for_alpaca_eval.py:L62-L66`).
   - O número de chamadas é implícito: (nº de proponentes × rounds) + 1 por item. Não há contagem de tokens, preço nem orçamento total (busca: `cost`, `price`, `usage`, `prompt_tokens` nos `.py` de topo).
   - O `alpaca_eval` vendorizado calcula `price_per_example` para os seus decoders e anotadores (`alpaca_eval/src/alpaca_eval/decoders/openai.py:L33, L166-L175, L296-L299`), mas a geração MoA usa `utils.generate_together` e não passa por esse caminho.
6. **Memória.**
   - **[código]** O pipeline de avaliação é stateless por item.
   - **[exemplo]** `bot.py` com `multi_turn=True` acrescenta cada instrução do usuário e cada resposta final ao histórico de todos os proponentes, **sem janela nem truncamento** (`bot.py:L155-L158, L210-L214`).
   - O único tratamento de excesso de contexto é reativo: um `invalid_request_error` da API faz `generate_together` retornar `None` (`utils.py:L47-L51`).
7. **Falhas/retry.** **[código]**
   - `generate_together` faz até 6 tentativas com backoff fixo de 1, 2, 4, 8, 16 e 32 s, captura qualquer exceção (`utils.py:L24-L63`) e devolve `None` se esgotar (`utils.py:L65-L67`).
   - `generate_openai` tem o mesmo laço, mas sem guarda após esgotar: `output` fica indefinido antes de `.strip()` (`utils.py:L110-L132`). Isso é inferência por leitura (provável `UnboundLocalError`), não testado.
   - **[exemplo]** `moa.py` e `advanced-moa.py` repetem só em `RateLimitError`, 3 vezes (1/2/4 s). Se todas falharem, `response` fica indefinido (`moa.py:L21-L35`; `advanced-moa.py:L33-L61`).
   - **[código]** Proponentes que retornam `None` são **descartados** da lista de referências (`generate_for_alpaca_eval.py:L52-L54`; idem `generate_for_mt_bench.py:L130-L132`, `generate_for_flask.py:L61`). Em `bot.py`, `None` não é filtrado (`bot.py:L68-L82, L180`) e pode entrar no prompt como texto (inferência por `utils.py:L150`).
8. **Poda de comunicação.** — Não há poda por política. Só ocorre descarte de proponente que falhou (item 7). Todas as respostas válidas são concatenadas integralmente.
9. **Elástico vs fixo.** Fixo: listas de modelos e número de camadas definidos antes da execução (itens 2–3).
10. **Benchmark custo vs qualidade.**
    - **[README/relato dos autores]** 65,1% no AlpacaEval 2.0 contra 57,5% do GPT-4 Omni, "using only open-source models" (`README.md:L25, L130`); FLASK descrito qualitativamente (`README.md:L137`); figuras em `assets/`.
    - **[exemplo]** Os scripts de reprodução existem (`run_eval_*.sh`), e `outputs/Qwen-72B-round-1.json` e `outputs/Qwen-72B-round-2.json` trazem 805 gerações cada, com `generator` = `Qwen/Qwen1.5-72B-Chat-together`. Não há no repositório pontuações dessas saídas nem dados de custo ou latência.
    - **Custo vs qualidade não é medido no repositório.**
    - **[teste]** `tests.py` compara strings exatas de APIs ao vivo com temperatura 0 (`tests.py:L13-L21, L42-L50`). É não-hermético e não foi executado.
    - Divergência entre README e código: `README.md:L68, L73` cita `--aggregator` e `--num_proc`, mas `bot.py:main` só aceita `model, reference_models, temperature, max_tokens, rounds, multi_turn` (`bot.py:L85-L92`).

## Evidência
- **Implementação observada:** topologia em camadas fixa, prompt de agregação idêntico em `utils.py` e nos exemplos, retry com backoff, descarte de proponentes falhos, teto só por chamada e nenhuma contabilidade de custo.
- **Relato dos autores:** ganhos em AlpacaEval 2.0, MT-Bench e FLASK (README e paper arXiv:2406.04692, não lido nesta rodada). Todos medidos por juízes LLM, sem verificação mecânica de correção.
- **Lacunas:** custo por resposta e por ponto de qualidade ausentes; não há comparação com 1 modelo forte a custo igual.
- Nenhum código foi executado ou compilado; nenhum benchmark reproduzido.

## Análogo de engenharia
**Hipótese de engenharia.** O MoA é a linha de base natural para "N agentes" no Swarm Efficiency Observatory: N proponentes × L camadas + 1 agregador custa cerca de N·L+1 chamadas e mais contexto a cada camada, porque as respostas anteriores são concatenadas. O Observatory pode medir o que o repositório não mede:
- custo por tarefa aceita frente a 1 agente forte, em tarefas com verificador mecânico (testes, checagem exata) e não com juiz LLM;
- se o agregador escolhe ou sintetiza a resposta correta quando ela está entre as referências.

O descarte de proponente que falhou é um reparo delimitado barato. A falta de poda (concatenação integral) é o principal vetor de custo.

## Hipótese testável
1. **Hipótese:** em tarefas com verificador mecânico, MoA 6×1+1 com os defaults dos scripts tem custo por tarefa aceita ≥3× o de 1 modelo forte, com ganho de taxa de aceite <5 p.p. Métricas: tokens/US$ por tarefa aceita e taxa de aceite.
2. **Hipótese:** substituir a síntese do agregador por "verificar cada referência com o verificador e devolver a primeira aceita, sintetizando só se nenhuma passar" reduz custo por tarefa aceita em ≥40% sem perda de aceite. Métricas: as mesmas, mais a fração de casos resolvidos sem chamar o agregador.

## Limites/lacunas
- O paper não foi lido; os números do README não foram verificados.
- O código vendorizado (`alpaca_eval`, `FastChat`, `FLASK`) não foi auditado.
- As falhas em `generate_openai` e nos exemplos são inferências de leitura.
- Os modelos default podem estar descontinuados no provedor; não foi verificado.

## Linha da matriz
| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ profundidade fixa: `rounds=1` (`generate_for_alpaca_eval.py:L78`), `layers=3` (`advanced-moa.py:L21`); sem parada por qualidade | — só prompt de síntese (`utils.py:L144-L146`); avaliação offline por juiz GPT-4 (`eval_mt_bench.py:L184`) | — só `max_tokens` por chamada (`utils.py:L17`); sem orçamento nem contabilidade | — concatenação integral; só descarta proponente com `None` (`generate_for_alpaca_eval.py:L52-L54`) | — listas e camadas fixas (`moa.py:L10-L16`) | — histórico multi-turn cresce sem janela (`bot.py:L155-L158, L210-L214`) | Apache-2.0 (`LICENSE:L1-L3`; `README.md:L147`) |
