---
id: lit-diversity-of-thought
title: "Diversity of Thought Improves Reasoning Abilities of LLMs — DIV-SE / IDIV-SE (Naik et al., 2023–2024)"
area: literature
evidence: relato-autores
tags: [diversidade, self-consistency, prompting, ensemble, custo, pareto]
sources:
  - "Naik, R., Chandrasekaran, V., Yuksekgonul, M., Palangi, H. & Nushi, B. (2024). Diversity of Thought Improves Reasoning Abilities of LLMs. arXiv:2310.07088v2 (23 fev 2024; v1 11 out 2023). https://arxiv.org/abs/2310.07088v2 — HTML: https://arxiv.org/html/2310.07088v2"
related: [lit-hong-page-diversity, lit-correlated-errors, lit-sintese]
updated: 2026-11-07
primary_opened: true
version: "v2 (2024-02-23); preprint sem venue no abs"
summary: Ensemblar abordagens de solução diferentes (diversidade no prompt) bate self-consistency com mais amostras em planejamento e matemática com GPT-4, sugerindo que diversidade de abordagem vale mais que repetição — com ressalvas de inconsistências numéricas no texto.
---

## Pergunta
Variar a **abordagem** de solução no prompt (em vez de só a temperatura de decodificação) gera diversidade de raciocínio que melhora o ensemble, com melhor relação acurácia-custo que self-consistency (SC)?

## Método
- O próprio LLM propõe abordagens/personas adequadas ao problema; DIV-SE executa uma chamada por abordagem e vota; IDIV-SE coloca várias abordagens numa única chamada (Sec. 3).
- Benchmarks: AQuA-RAT (254), GSM8K (1.319), MATH Counting & Probability (474), Blocksworld 3 (100), Blocksworld 4/5 (500), Graph Coloring (100), CommonsenseQA (1.221). Modelos: GPT-3.5 Turbo, GPT-4, LLaMA-2 70B (App. B).
- Ensembles de 3 ou 5 abordagens; SC com temperatura 0,7 até 10 amostras.

## Resultado relatado
- GPT-4 zero-shot (Tabela 1): Graph Coloring — CoT 15,0; SC-10 23,0; IDIV-SE 74,0; DIV-SE 97,0. Blocksworld 3 — CoT 70; SC-10 73; DIV-SE 94. Blocksworld 4/5 — CoT 40,0; SC-10 41,2; DIV-SE 69,6.
- Tabela 2 (AQuA-RAT): GPT-4 ZS CoT 70,47 → DIV-SE 80,31; GPT-4 FS 71,90 → 84,25; GPT-3.5 ZS 59,00 → 72,83 (SC-5 63,37). CommonsenseQA: ganhos pequenos (GPT-4 ZS 81,60 → 81,70).
- GSM8K (App. C.2): GPT-4 94–95% → 96,3% com DIV-SE (ganho pequeno); IDIV-SE sem ganho significativo.
- GPT-3.5 em Blocksworld (baselines 6% e 0,6%): nenhum método ajudou (Sec. 4.1.3) — diversidade não cria capacidade ausente.
- LLaMA-2 70B AQuA-RAT ZS: CoT 31,32; DIV-SE 32,00 (ganho desprezível).
- Inconsistências entre texto e tabelas (Sec. 4.1.1; ex.: ganhos de AQuA-RAT no texto ≠ diferenças das Tabelas) foram apontadas pela extração; os números acima são os das tabelas.

## Custo/compute considerado?
Sim, parcialmente. Custos estimados por preço de tokens (GPT-4 US$0,03/1k entrada, US$0,06/1k saída; GPT-3.5 US$0,003/US$0,004) e curvas de fronteira de Pareto (Figs. 1, 3). Os autores afirmam que DIV-SE/IDIV-SE são Pareto-ótimos e que, em Blocksworld 3 com GPT-4, a abordagem ZS supera SC-10 (FS) a custo 4× menor (Sec. 3). Contagens exatas de tokens só nas figuras (não extraídas).

## Ameaças à validade
- Ganhos grandes concentrados em planejamento/grafo, onde Graph Coloring usa verificador externo sólido para escolher a solução — parte do ganho pode vir da verificação, não só da diversidade.
- Inconsistências numéricas texto × tabela; avaliação open-source mínima.
- Abordagens geradas pelo próprio modelo; a “diversidade” continua dentro de um único modelo.
- Preprint sem venue confirmado.

## Relevância para a pergunta central
Mostra que, **com o mesmo modelo**, diversificar o método de solução rende mais por chamada do que repetir amostras (SC) — então “mais agentes” idênticos é um baseline fraco, e a unidade de valor é a diversidade de abordagem. Também indica limites: sem capacidade de base (GPT-3.5 em Blocksworld), N abordagens não ajudam; e ganhos somem em tarefas saturadas (GSM8K com GPT-4).

## Hipóteses candidatas
- candidata: para orçamento fixo de chamadas, k abordagens distintas > k amostras da mesma abordagem quando a tarefa admite estratégias de solução diferentes e há verificador; a vantagem desaparece em tarefas saturadas.
- candidata: diversidade não compensa falta de capacidade — abaixo de uma acurácia individual mínima, nenhum tamanho de ensemble ajuda (limiar a estimar).

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2310.07088 (v2, 23 fev 2024; sem venue/comments) e https://arxiv.org/html/2310.07088v2 (tabelas e seções).
- Lacunas: custos exatos (só nas Figs. 1 e 3, não lidos numericamente); verificação manual das inconsistências apontadas não foi feita linha a linha.
