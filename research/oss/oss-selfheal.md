---
id: oss-selfheal
title: SelfHeal — fixer ReAct + crítico LLM separado em até 3 tentativas, sem execução de testes no laço
area: oss
evidence: implementacao-observada
tags: [reparo-de-bugs, fixer-critic, llm-judge, react, dataset, agentdefect, sem-aceite-verificavel, sem-orcamento]
sources:
  - "https://github.com/Laboratory-software-Innovation/SelfHeal/tree/812e6a3252a45d102a652695673010e4ca8c8807 (commit inspecionado, clone raso em 2026-11-07)"
  - "SelfHeal: Empirical Fix Pattern Analysis and Bug Repair in LLM Agents, arXiv 2604.17699v1 (preprint abr/2026; indicado pelo estudo anterior; não citado no README do repo; não lido nesta inspeção)"
related: [oss-stigmergic, oss-symbiont, oss-metagpt, oss-chatdev-macnet, oss-autogen, oss-matriz, oss-padroes]
updated: 2026-11-07
summary: Script único em que um agente fixer propõe código e um crítico LLM separado decide ACCEPT/REJECT em até 3 tentativas; os testes do dataset são lidos como texto e nunca executados, e o "Resolved" das planilhas vem de um processo de fora do repo.
---

## Identificação

- URL: https://github.com/Laboratory-software-Innovation/SelfHeal
- SHA inspecionado: `812e6a3252a45d102a652695673010e4ca8c8807`
- Data do commit (`git log -1 --format=%cI`): 2026-04-19T16:00:09-04:00
- Licença: **MIT License**, "Copyright (c) 2026 Laboratory-software-Innovation", lida em `LICENSE:L1-L3` (21 linhas, texto MIT padrão). O README não declara licença (`README.md`, 39 linhas) **[README/docs]**.
- Escopo efetivamente lido: `run_agent.py` (inteiro, 465 linhas), `README.md`, `LICENSE`, `requirements.txt`, `preproceesing/readme.md`, `preproceesing/*.py` (busca por arquivos CSV e modelos). Listagem de `AgentDefect.zip` com `zipinfo`, sem extrair, e leitura de `AgentDefect/76062338/{readme.md,test.py}` com `unzip -p`. Imports de `run_fixed.py` dos 37 casos, por busca. XML de `Detailed Result.xlsx` (nomes de abas, cabeçalhos, soma da coluna "Resolved") e strings de `Agreement Scores.xlsx`/`Fix Patterns.xlsx`. Nada do repo foi executado ou instalado.

## Mecanismo

1. **Topologia de comunicação.** Pipeline sequencial de dois agentes por tentativa: `create_fix_agent()` → `create_critic_agent()`, ambos `create_react_agent` do LangGraph (`run_agent.py:L232-L278`) **[código]**. Não há mensagem direta entre eles. O código passa por uma variável global `CURRENT_FIXED_CODE`, escrita pela tool `submit_fixed_code` (`run_agent.py:L143-L150`) e lida por `generate_diff` e `validate_fixed_code` (`run_agent.py:L153-L197`) **[código]**. O veredito do crítico **não volta ao fixer**: o `fix_prompt` é idêntico em todas as tentativas (`run_agent.py:L306-L323`) e cada tentativa cria agentes novos (`run_agent.py:L303`, `L331`) **[código]**.
2. **Quem decide quem age.** Ordem fixa em código: fixer e depois crítico, por tentativa (`run_agent.py:L300-L381`) **[código]**. Ferramentas do fixer: `web_search` (exclui stackoverflow.com, `run_agent.py:L57`), `list_fix_patterns`, `get_fix_pattern_summary` e `submit_fixed_code` (`run_agent.py:L247-L252`). Ferramentas do crítico: `generate_diff`, `validate_fixed_code` e `verify_api_usage` (`run_agent.py:L272-L276`) **[código]**. Os dois usam o **mesmo modelo** com `temperature=0`: `google/gemini-3-pro-preview` via OpenRouter se houver chave, senão `gpt-5.2` (`run_agent.py:L237-L245`, `L262-L270`) **[código]**.
3. **Critério de término.** `max_attempts: int = 3` (`run_agent.py:L281`, `L300`). O laço para no primeiro crítico cuja saída contém a substring `"ACCEPT"` (`run_agent.py:L394-L406`); senão retorna `FAILED` (`run_agent.py:L408-L419`) **[código]**. O laço ReAct interno de cada agente é consumido por `stream(...)` sem `recursion_limit` ou `config` (`run_agent.py:L325-L329`, `L377-L381`). O limite interno depende do default da biblioteca, não verificado aqui **[código]**. Fragilidade: qualquer resposta que mencione "ACCEPT", por exemplo citando a saída da tool `validate_fixed_code` antes de concluir REJECT, encerra como aceita (inferência a partir de `L197` + `L394`).
4. **Verificação/aceite mecânico.** **Nenhum teste é executado.** `test.py` é lido como texto e colado no prompt do crítico (`run_agent.py:L97-L111`, `L334-L355`) **[código]**. A tool `validate_fixed_code` é só heurística de string: rejeita se não houver `"def "` ou se faltar `"return"` quando o teste contém `assert` (`run_agent.py:L176-L197`) **[código]**. `verify_api_usage` faz busca web e devolve snippets para o LLM interpretar (`run_agent.py:L200-L229`) **[código]**. O aceite é, portanto, **LLM-judge** (crítico) com checagem sintática trivial. O "Resolved" das planilhas não é produzido pelo script, que só escreve `ACCEPTED`/`FAILED` em `results/<id>_result.txt` (`run_agent.py:L436-L462`); o processo que gerou "Resolved" não está no repo **[código]/[README/docs]**. Nos dados, `test.py` importa `run_fixed` (a correção de referência), não o candidato, e chama um LLM real verificando substring na saída (`AgentDefect/76062338/test.py`, linhas 2 e 19-21 do arquivo dentro do zip) **[teste]**.
5. **Controle de custo/orçamento técnico.** Nenhum limite de tokens/custo — não encontrado (busca: `budget`, `cost`, `token`, `max_tokens`, `recursion`). Os únicos limites são `max_attempts=3` (que conta tentativas, não custo), `timeout=10` e `num=5` na busca web (`run_agent.py:L38-L47`) **[código]**. As planilhas registram "Attempts" e "Time" por caso, mas não tokens nem custo (`Detailed Result.xlsx`, cabeçalho ID/Localized/Line/Function/Component/Resolved/Attempts/Time) **[README/docs]**.
6. **Memória.** Não há memória entre tentativas nem entre casos: agentes recriados a cada tentativa (`run_agent.py:L303`, `L331`), `CURRENT_FIXED_CODE` zerado só no início do caso (`run_agent.py:L286`) **[código]**. Efeito colateral (inferência): se o fixer da tentativa *k* não chamar `submit_fixed_code`, o crítico avalia o código da tentativa anterior. O "conhecimento" vem de um CSV de padrões de correção (`FIX_PATTERN_PATH`, `run_agent.py:L18`, `L114-L140`) gerado offline por LLM no pré-processamento (`preproceesing/make_rules.py:L9-L11`, `L51`, modelo `o3-mini`) **[código]**.
7. **Falhas/retry.** O retry é a própria repetição de tentativas, com prompt idêntico e `temperature=0` (`run_agent.py:L300-L323`, `L239`). Não há feedback do crítico, então a diversidade entre tentativas depende do não determinismo do provedor (inferência) **[código]**. Erros de ferramentas viram strings ("Error ...", `run_agent.py:L35-L50`, `L84-L94`). A falta de `run_buggy.py` não interrompe o caso: a string `"Error run_buggy.py missing"` entra no prompt como se fosse o código (`run_agent.py:L88-L89`, `L295`, `L312-L315`) **[código]**. Retomada: casos com resultado já gravado são pulados (`run_agent.py:L430-L433`) **[código]**.
8. **Poda de comunicação.** Não aplicável: há 2 agentes fixos e nenhuma remoção de mensagens. O contexto é descartado a cada tentativa por recriação, não por poda **[código]**.
9. **Elástico vs fixo.** Fixo: 1 fixer + 1 crítico por tentativa (`run_agent.py:L303`, `L331`) **[código]**.
10. **Benchmark custo vs qualidade.** Não há custo. Os dados de qualidade estão em `Detailed Result.xlsx`, com 8 abas. Contagem que fiz lendo o XML (soma da coluna "Resolved", sem executar código do repo): `results-agent-gpt` 20/37, `results-agent-gemini` **22/37**, `results-agent-claude` 21/37, `zero-shot-claude` 15/37, `results-zero-shot-gpt` 12/37, `swe-gpt5.2` 14/36, `no-web-search` 17/37, `No-pattern` 15/36 **[README/docs: dados dos autores]**. O modelo usado nas ablações `no-web-search`/`No-pattern` e o critério de "Resolved" não estão documentados no repo.

## Evidência

- **Implementação observada:** laço fixer→crítico com `max_attempts=3`, aceite por substring `"ACCEPT"`, nenhuma execução de teste, mesmo modelo nos dois papéis (itens 1–4).
- **Dataset (dados, não código):** `AgentDefect.zip` tem 37 diretórios de caso (36 IDs de posts do Stack Overflow + `hf-26`). Cada um tem `test.py`, `run_fixed.py`, `requirements.txt` e `readme.md`; `run_buggy.py` existe em 36 (ausente em `hf-26`) (via `zipinfo`). Por imports em `run_fixed.py`: 29 casos usam `langchain` (1 deles com `langgraph`), 6 usam `llama_index` e 2 sem framework detectado pela busca. Os `requirements.txt` parecem ser o mesmo dump de ambiente (pacotes LangChain e LlamaIndex em quase todos), então não indicam o framework do caso.
- **Reprodutibilidade (leitura estática):** `run_agent.py` espera `Fix-Agent/Dataset-Benchmark/<id>/` e dois CSV (`run_agent.py:L16-L20`) que não estão no repo. O zip tem raiz `AgentDefect/`. `make_rules.py` grava `fix_pattern_rules.csv` (`preproceesing/make_rules.py:L11`), mas o script lê `fix_pattern_summaries.csv` (`run_agent.py:L18`). `langgraph` é importado (`run_agent.py:L12`) mas não consta em `requirements.txt`. O print usa `total_cases = 10` fixo, embora o laço percorra todos os casos (`run_agent.py:L424-L434`).
- **Relato dos autores:** modelos citados no README (GPT-5.2, Gemini 3 Pro, Claude Sonnet 4) (`README.md:L30-L33`); números do paper não verificados.
- Nenhum código foi executado; nenhum benchmark reproduzido.

**Confronto com o estudo anterior (A4 Master, rev. 2):**
- **Confirmado:** agente fixer + crítico separado (`run_agent.py:L232-L278`); AgentDefect com 37 casos, majoritariamente LangChain/LlamaIndex (29 + 6 por imports); o melhor resultado 22/37 coincide com a aba `results-agent-gemini`.
- **Precisões/correções:** (i) "37 casos executáveis" vale para os dados: os testes existem, mas importam `run_fixed` e chamam LLM real. O laço de reparo **não** executa nada, e um caso (`hf-26`) não tem `run_buggy.py`. (ii) A licença, que o estudo anterior não leu, é **MIT** (`LICENSE`). (iii) O crítico é o mesmo modelo do fixer, e o veredito não volta ao fixer, então "crítico separado" significa um papel separado, não um modelo ou sinal independente. (iv) O paper não é citado no README; a referência arXiv vem só do estudo anterior.

## Análogo de engenharia

*(hipótese de engenharia)* Para o Swarm Efficiency Observatory, o SelfHeal é uma configuração "N=2 com crítico LLM" a comparar diretamente com "1 agente forte + teste executado como aceite". O próprio dataset já traz o par buggy/fixed e um `test.py` por caso. Substituir `if "ACCEPT" in critic_output` por "executar `test.py` contra o candidato" converteria o laço em aceite verificável e permitiria medir custo por tarefa aceita e a taxa de **falso aceite do crítico** (ACCEPT com teste reprovado). As abas `zero-shot-*` (12–15/37) vs `results-agent-*` (20–22/37) já sugerem o ganho do laço agêntico, mas sem custo associado.

## Hipótese testável

1. *(hipótese)* No AgentDefect, a fração de casos com `ACCEPTED` pelo crítico que falham ao executar `test.py` contra o código final é ≥ 20%. Métrica: falso aceite = (ACCEPTED ∧ teste falha) / ACCEPTED; falseável se < 5%.
2. *(hipótese)* Devolver o veredito do crítico ao fixer e aceitar por teste executado aumenta casos resolvidos por US$ em relação ao laço atual (prompt idêntico, `temperature=0`) com o mesmo `max_attempts=3`. Métrica: casos com teste aprovado / custo total em tokens; falseável se a razão não melhorar.

## Limites/lacunas

- Não li o paper; os números das planilhas foram contados por mim no XML (soma de 0/1 da coluna E, sem a linha de cabeçalho) e podem divergir do que o paper reporta.
- Não li os scripts de pré-processamento linha a linha (`create_env.py` cria venvs e roda `pip`, segundo a busca: `preproceesing/create_env.py:L35-L43`).
- Não sei como "Resolved", "Localized" e "Attempts" foram anotados (manual? execução de testes fora do repo?).
- `Fix Patterns.xlsx` (abas StackOverflow/Commits/Issues/Hugginface) e `Agreement Scores.xlsx` foram vistos só pelos cabeçalhos.

## Linha da matriz

| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ — `max_attempts=3` e parada no primeiro `"ACCEPT"` (`run_agent.py:L281`, `L300`, `L394-L406`); laço ReAct interno sem `recursion_limit` explícito (`L325-L329`) | — — crítico LLM decide por substring (`run_agent.py:L394`); `validate_fixed_code` só checa `"def "`/`"return"` (`L176-L197`); `test.py` só entra como texto no prompt (`L334-L355`) | — — sem limite de tokens/custo; só tentativas (`L281`) e timeout da busca web (`L47`) | — — 2 agentes fixos; contexto descartado por recriação, não podado (`L303`, `L331`) | — — 1 fixer + 1 crítico fixos (`L232-L278`) | — — sem memória entre tentativas/casos; estado global de 1 slot (`L26-L27`, `L286`) | MIT (`LICENSE:L1-L3`) |
