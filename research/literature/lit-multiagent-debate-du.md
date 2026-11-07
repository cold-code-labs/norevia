---
id: lit-multiagent-debate-du
title: "Multiagent Debate (Du et al., ICML 2024) — debate entre instâncias do mesmo LLM"
area: literature
evidence: relato-autores
tags: [debate, multiagente, factualidade, raciocinio, baseline-fundador]
sources:
  - "Du, Y., Li, S., Torralba, A., Tenenbaum, J. B. & Mordatch, I. (2024). Improving Factuality and Reasoning in Language Models through Multiagent Debate. Proceedings of the 41st International Conference on Machine Learning (ICML 2024), PMLR 235:11733–11763. https://proceedings.mlr.press/v235/du24e.html"
  - "arXiv:2305.14325v1 (23 maio 2023), versão única. https://arxiv.org/abs/2305.14325v1"
related: [lit-should-we-be-going-mad, lit-debate-or-vote, lit-stop-overvaluing-mad, lit-rethinking-bounds-discussion]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (2023-05-23); PMLR v235 (2024)"
summary: Trabalho fundador do debate multiagente — 3 instâncias de gpt-3.5 debatendo 2 rodadas superam agente único e voto majoritário, mas sem igualar compute e com consenso às vezes errado.
---

## Pergunta
Várias instâncias de um mesmo LLM (caixa-preta) que propõem respostas e as criticam mutuamente por rodadas melhoram raciocínio e factualidade em relação a um agente único?

## Método
- N agentes (instâncias do mesmo modelo) respondem independentemente; depois recebem as respostas dos outros e atualizam a sua por rodadas; a resposta final é o consenso.
- Modelo principal: `gpt-3.5-turbo-0301` (Apêndice A.2).
- Configuração principal: **3 agentes, 2 rodadas de debate** (nota da Tabela 1).
- Tarefas e tamanhos (Apêndice A.2): Arithmetic 100, GSM8K 100, Chess move optimality 300 jogos, Biografias 524 cientistas da computação, MMLU 100, Chess move validity 100.
- Baselines: agente único, agente único com reflexão, "Multi-Agent (Majority)" (voto majoritário).

## Resultado relatado
Tabela 1 (raciocínio; média ± dispersão):

| Método | Arithmetic | GSM8K | Chess (ΔPS) |
|---|---|---|---|
| Single Agent | 67,0 ± 4,7 | 77,0 ± 4,2 | 91,4 ± 10,6 |
| Single Agent (Reflection) | 72,1 ± 4,5 | 75,0 ± 4,3 | 102,1 ± 11,9 |
| Multi-Agent (Majority) | 69,0 ± 4,6 | 81,0 ± 3,9 | 102,2 ± 6,2 |
| Multi-Agent (Debate) | 81,8 ± 2,3 | 85,0 ± 3,5 | 122,9 ± 7,6 |

Tabela 2 (factualidade): Biografias 66,0 → 73,8; MMLU 63,9 → 71,1; Chess validity 29,3 → 45,2 (agente único → debate). Reflexão piorou MMLU (57,7).

- Seção 3.3 / Fig. 10: acurácia em Arithmetic sobe monotonicamente com o nº de agentes (rodadas fixas em 2) e com o nº de rodadas (3 agentes); acima de 4 rodadas o desempenho final é semelhante ao de 4 rodadas.
- Modelos diferentes (Seção 3.3, Fig. 11): em 20 problemas do GSM8K, Bard resolveu 11, ChatGPT 14, debate conjunto 17.
- Prompts mais "teimosos" alongam o debate; prompts mais longos convergem mais devagar porém para consenso final melhor (texto da Seção 3.3).

## Custo/compute considerado?
Parcialmente, só qualitativo. A Seção 5 (Limitações) admite que o debate é mais caro que outros métodos de prompting. **Não há igualação de compute** entre debate (3 agentes × várias gerações por rodada) e o baseline de voto; o número de amostras votadas no baseline "Majority" não é declarado explicitamente. Para muitos agentes, o contexto estoura e as respostas precisam ser resumidas (Fig. 13).

## Ameaças à validade
- Amostras pequenas (100 problemas em várias tarefas); ICs largos (±3–5 pp).
- Comparação com voto majoritário sem compute igualado; trabalhos posteriores (lit-debate-or-vote, lit-stop-overvaluing-mad) atribuem a maior parte do ganho ao voto/ensemble.
- Um único modelo de 2023 (gpt-3.5-turbo-0301), sem reasoning models.
- Seção 5 / Apêndice A.1: debates convergem para uma resposta que nem sempre é correta; agentes afirmam respostas erradas com confiança alegando consistência com os outros.
- Inconsistência menor: a Seção 3.1 descreve aritmética com seis números de dois dígitos; o Apêndice A.2 fala em inteiros entre 0 e 30.

## Relevância para a pergunta central
É o ponto de partida da tese "N agentes > 1 agente". Mas o desenho não responde "a que custo": falta curva acurácia × tokens contra self-consistency com o mesmo orçamento. Útil como referência histórica e como protocolo (`SoM`) reutilizado por vários benchmarks posteriores.

## Hipóteses candidatas
- candidata: o ganho do debate sobre o agente único é em boa parte ganho de ensemble (mais amostras), não de interação — testar com voto de mesmo nº de gerações.
- candidata: diversidade de modelo (ChatGPT + Bard) adiciona valor além de reamostrar o mesmo modelo — mas o n=20 não sustenta conclusão.
- candidata: rodadas têm retorno decrescente com platô (~4 rodadas aqui), enquanto o custo de contexto cresce a cada rodada.

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2305.14325 (v1 é a única versão); https://ar5iv.labs.arxiv.org/html/2305.14325 (texto completo renderizado da v1; tabelas lidas aí); https://proceedings.mlr.press/v235/du24e.html (venue e páginas).
- A extração direta do PDF falhou; os números vêm do ar5iv (v1). Não conferi se a versão PMLR altera números.
- Lacuna: definição exata do baseline "Majority" (quantas amostras) e contagem de rodadas (2 rodadas = inicial + 1 ou + 2) não estão explícitas no texto lido.
