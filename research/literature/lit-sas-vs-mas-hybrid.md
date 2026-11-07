---
id: lit-sas-vs-mas-hybrid
title: Single-agent or Multi-agent Systems? Why Not Both? — vantagem do MAS encolhe com modelos melhores; roteamento e cascata
area: literature
evidence: relato-autores
tags: [single-vs-multi, cascata, roteamento, custo, modelos-de-fronteira]
sources:
  - "Gao, M., Li, Y., Liu, B., Yu, Y., Wang, P., Lin, C.-Y. & Lai, F. (2025). Single-agent or Multi-agent Systems? Why Not Both? arXiv:2505.18286v1. https://arxiv.org/abs/2505.18286v1"
related: [lit-scaling-agent-systems, lit-sas-equal-thinking-budget]
updated: 2026-11-07
primary_opened: true
version: "v1 (23 mai. 2025), única versão no arXiv"
summary: Com modelos mais fortes, a vantagem de acurácia de MAS publicados sobre um agente único cai para poucos pontos, enquanto o custo em tokens fica de 2× a mais de 200× maior; uma cascata SAS→MAS verificada recupera parte do ganho a custo menor.
---

## Pergunta
A vantagem de sistemas multiagente (MAS) sobre agente único (SAS) persiste com LLMs mais capazes? Como combinar os dois para equilibrar custo e acurácia?

## Método
Reavaliação de MAS publicados (MetaGPT, Self-Collaboration, MathDebate e outros) contra SAS em código, matemática e verificação de fatos. Modelos avaliados (App. B.1): Gemini-2.0-Flash (padrão), Gemini-2.5-Pro-Preview, GPT-3.5-Turbo, GPT-4o e LLaMA-3.1 8B/70B. Custo em tokens de prefill e decode. Propostas: (a) identificar o agente mais propenso a erro por confiança autodeclarada e upgrade de modelo; (b) roteamento por um avaliador LLM de dificuldade; (c) cascata em que o SAS roda primeiro e escala para o MAS se a saída falhar numa checagem barata.

## Resultado relatado
- Vantagem encolhendo (Sec. 3.2, Tabela 2), no original com ChatGPT → com Gemini-2.0-Flash: MetaGPT/HumanEval +10,7 → +3,0; Self-Collaboration/MBPP +16,0 → +1,2; MathDebate/GSM8K +9 → +0,8. Os modelos diferem entre colunas, então não é uma comparação controlada.
- Tabela 4: SAS vs MAS com GSM8K 94,0 vs 93,6; AIME 25,0 vs 38,3; DS1000 62,9 vs 62,3; BigCodeBench 47,4 vs 46,0.
- Cerca de 80% dos exemplos são empates, com ambos acertando ou ambos errando (Fig. 2, Obs. 1).
- Custo (Tabela 3): razão MAS/SAS de prefill entre 1,20× (HoVer) e 220,22× (AIME); de decode entre 2,10× e 21,64×. O texto dá faixas diferentes da tabela ("4–220×", "2–12×").
- Roteamento por dificuldade em GSM8K+AIME: cerca de 2% mais acurácia com cerca de 50% do custo do MAS (Fig. 4b). Cascata no GSM8K: 1.056 tokens vs 8.837 do MAS, cerca de 88% menos (Tabela 4). O resumo diz "1,1–12%" de ganho e "até 20%" de redução de custo; não consegui mapear esses valores a células específicas, e o corpo também fala em até 88,1%.

## Custo/compute considerado?
Sim, em tokens; não em dólares nem em orçamento igualado. A fórmula da cascata é custo = (1−p)·C_MAS + C_SAS.

## Ameaças à validade
- A comparação "antes/depois" mistura modelos diferentes.
- Números do resumo inconsistentes com o corpo (faixas de custo e de redução).
- A cascata conta acerto se SAS ou MAS acertar (App. B.4), o que infla a acurácia, e exige verificação barata das saídas.
- Self-Collaboration foi reduzido de 3 para 2 agentes, e os autores não reproduziram os resultados originais.
- Modelos de raciocínio de fronteira (o3) citados mas não avaliados.

## Relevância para a pergunta central
Evidência direta de que o ganho do MAS depende da capacidade-base: com modelo forte, o MAS empata na maioria dos casos e custa muito mais. A cascata SAS→MAS com aceite verificável é um protótipo do "micro-swarm sob demanda" que a Norevia propõe; ou seja, a ideia de escalonamento condicional já foi testada por outros.

## Hipóteses candidatas
- candidata: o ganho do MAS sobre o SAS diminui à medida que a capacidade do modelo-base aumenta; o custo relativo não diminui.
- candidata: "tentar barato primeiro e escalar só em caso de falha verificável" domina "MAS sempre" em custo por acerto quando existe um verificador barato.
- candidata: os casos em que só o MAS acerta concentram-se em problemas difíceis (ex.: AIME); um preditor de dificuldade pode capturar quase todo o ganho.

## Verificação
Abertos em 2026-11-07: https://arxiv.org/abs/2505.18286 (só v1; sem venue declarado) e https://arxiv.org/html/2505.18286v1 (lidos cerca de 100k de 148k caracteres). Números extraídos por leitor automático, sem conferência manual. A origem exata de "1,1–12%" e "até 20%" não foi localizada (lacuna).
