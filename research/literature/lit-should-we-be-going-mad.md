---
id: lit-should-we-be-going-mad
title: "Should we be going MAD? (Smit et al., ICML 2024) — debate vs. ensembles com custo"
area: literature
evidence: relato-autores
tags: [debate, self-consistency, custo, hiperparametros, concordancia, medprompt]
sources:
  - "Smit, A. P., Grinsztajn, N., Duckworth, P., Barrett, T. D. & Pretorius, A. (2024). Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs. Proceedings of the 41st International Conference on Machine Learning (ICML 2024), PMLR 235:45883–45905. https://proceedings.mlr.press/v235/smit24a.html"
  - "arXiv:2311.17371v3 (18 jul 2024; v1 29 nov 2023, v2 14 mar 2024). https://arxiv.org/abs/2311.17371v3"
  - "Código: https://github.com/instadeepai/DebateLLM (não inspecionado)"
related: [lit-multiagent-debate-du, lit-debate-or-vote, lit-stop-overvaluing-mad]
updated: 2026-11-07
primary_opened: true
version: "arXiv v3 (2024-07-18); PMLR v235 (2024)"
summary: Com GPT-3.5, protocolos de debate não superam de forma confiável self-consistency/Medprompt e custam mais por acerto; o grau de concordância entre agentes é um hiperparâmetro decisivo e dependente da tarefa.
---

## Pergunta
Os protocolos de multi-agent debate (MAD) superam estratégias de ensemble de um único modelo (self-consistency, Medprompt, Ensemble Refinement) quando se olha acurácia, custo e tempo juntos?

## Método
- Modelo principal: GPT-3.5-turbo; GPT-4 e Mixtral 8x7B apenas em MedQA (Seção 3, Figs. 8–9).
- Conjuntos (Seção 3): MedQA (1.273 questões USMLE, 4 opções), PubMedQA (500), MMLU tópicos clínicos (123), CosmosQA (500), CIAR (50), GPQA (448), Chess (BIG-bench).
- MAD: Society of Mind (SoM, = Du et al.), Multi-Persona (anjo/diabo + juiz), ChatEval (3 modos). Baselines: Self-Consistency, Ensemble Refinement, Medprompt (sem kNN), agente único.
- Varredura de hiperparâmetros (nº de agentes, rodadas, sumarização, prompts) e registro de custo em US$ por configuração (Apêndice A.2, Tabela 3).

## Resultado relatado
Tabela 2 (melhor configuração; mediana entre parênteses), seleção:

| Sistema | MedQA | MMLU | CIAR | GPQA |
|---|---|---|---|---|
| Medprompt | 0,65 (0,63) | 0,74 (0,73) | 0,54 (0,50) | 0,27 (0,25) |
| Society of Mind | 0,64 (0,61) | 0,73 (0,70) | 0,56 (0,46) | 0,27 (0,25) |
| Self-Consistency | 0,60 (0,60) | 0,78 (0,75) | 0,56 (0,52) | 0,24 (0,29) |
| Single Agent | 0,60 (0,59) | 0,76 (0,72) | 0,50 (0,50) | 0,33 (0,28) |
| Multi-Persona | 0,58 (0,57) | 0,72 (0,69) | 0,52 (0,50) | 0,29 (0,29) |

- Conclusões (Seção 4): MAD "currently do not outperform other ensembling methods such as Medprompt and self-consistency" nas implementações originais; MAD exige mais chamadas de API e custo.
- Fig. 3: em conjuntos médicos quase todos os sistemas superam o agente único; nos não médicos, o agente único supera todos exceto Multi-Persona e Self-Consistency.
- Fig. 4: o debate melhora sobre a 1ª resposta em SoM, pouco em ChatEval e **piora** em Multi-Persona (o "diabo" é instruído a discordar mesmo de respostas certas).
- Modulação de concordância ("you should agree with the other agents X% of the time"; Seção 3, Figs. 5–6): no subconjunto USMLE (376 questões), ganho de ≈15% para Multi-Persona e ≈5% para SoM; MedQA/PubMedQA preferem alta concordância, CIAR (contraintuitivo) o inverso. Multi-Persona a 90% de concordância é reportado como SOTA para GPT-3.5 em MedQA (valor exato só no gráfico).
- Transferência: hiperparâmetros afinados no GPT-3.5 transferem para GPT-4, não para Mixtral 8x7B (Seção 3).

## Custo/compute considerado?
Sim — é um dos poucos trabalhos de 2023–24 que registram US$ por configuração. Na Tabela 3 (extração própria do PDF v3), na coluna mais cara (custos ~US$19–50, compatível com o maior conjunto, MedQA com 1.273 questões): Self-Consistency 0,63 a US$25,47; Medprompt 0,63–0,65 a US$19,10; SoM 4 agentes × 3 rodadas 0,64 a US$48,63; Ensemble Refinement (aggregation=9) 0,64 a US$50,30. Ou seja, a mesma acurácia custou ~2× mais com debate. **Ressalva:** os cabeçalhos da Tabela 3 se perdem na extração; a atribuição de colunas foi inferida pela proporção custo/tamanho do conjunto e pode estar errada — conferir no PDF renderizado.

## Ameaças à validade
- Um modelo principal de 2023; foco médico (generalização questionada por lit-stop-overvaluing-mad).
- Melhor-de-varredura vs. mediana: o "melhor" MAD depende de busca de hiperparâmetros cujo custo não é contabilizado.
- Ganho de agreement modulation medido num subconjunto de 376 questões, apresentado em gráfico.

## Relevância para a pergunta central
Mostra que (1) "mais agentes conversando" não é dominante quando a baseline é um ensemble de 1 modelo com compute similar; (2) a **dinâmica de concordância** (conformidade vs. contestação) é um botão de controle com efeito de sinal trocado por tarefa — relevante para um controlador adaptativo que decida quanto dissenso injetar.

## Hipóteses candidatas
- candidata: o valor do debate é dominado por um parâmetro de conformidade cujo ótimo depende do tipo de tarefa (intuitiva vs. contraintuitiva).
- candidata: em custo por acerto, ensembles de 1 modelo dominam o debate na maioria das tarefas de múltipla escolha.
- candidata: hiperparâmetros de coordenação não transferem entre famílias de modelos — um controlador precisa recalibrar por modelo.

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2311.17371 (v3 é a mais recente); https://arxiv.org/html/2311.17371v3 (Tabela 2 e texto); PDF v3 extraído localmente para a Tabela 3; https://proceedings.mlr.press/v235/smit24a.html (venue, páginas).
- arXiv não lista journal-ref; o venue ICML 2024 vem da página PMLR.
- Lacuna: valor numérico exato do SOTA de Multi-Persona (só em figura); ordem das colunas da Tabela 3 não confirmada visualmente.
