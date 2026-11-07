---
id: lit-sas-equal-thinking-budget
title: Agente único vence MAS em raciocínio multi-hop com orçamento de thinking tokens igual
area: literature
evidence: relato-autores
tags: [single-vs-multi, thinking-budget, compute-igualado, contexto, data-processing-inequality]
sources:
  - "Tran, D. & Kiela, D. (2026). Single-Agent LLMs Outperform Multi-Agent Systems on Multi-Hop Reasoning Under Equal Thinking Token Budgets. arXiv:2604.02460v2. doi:10.48550/arXiv.2604.02460. https://arxiv.org/abs/2604.02460v2"
related: [lit-scaling-agent-systems, lit-sas-vs-mas-hybrid, lit-snell-test-time-compute]
updated: 2026-11-07
primary_opened: true
version: "v2 (11 abr. 2026); v1 2 abr. 2026"
summary: Com o mesmo orçamento de tokens de raciocínio, um agente único iguala ou supera cinco arquiteturas MAS em multi-hop a partir de 500 tokens; o MAS só compete quando o uso de contexto pelo agente único está degradado.
---

## Pergunta
As vantagens relatadas de MAS em raciocínio multi-hop vêm da arquitetura ou de compute de inferência não contabilizado?

## Método
Argumento teórico pela Data Processing Inequality: se M é uma função do contexto C, então I(Y;C) ≥ I(Y;M) e Pe(C) ≤ Pe(M). Com contexto completo e bem usado, um agente único é pelo menos tão bom quanto qualquer MAS construído sobre o mesmo contexto (Sec. 3). Experimento com orçamentos de thinking tokens de 100 a 10.000. Modelos: Qwen3-30B-A3B, DeepSeek-R1-Distill-Llama-70B e Gemini 2.5 Flash/Pro. Benchmarks: FRAMES e MuSiQue 4-hop. Arquiteturas: SAS, SAS-L (prompt para pensar mais), Sequential, Subtask, Parallel-roles, Debate e Ensemble. Experimento de degradação de contexto (mascaramento, substituição, deleção, distratores) com orçamento fixo de 1.000 tokens (Sec. 5.3).

## Resultado relatado
- Tabela 1, média de modelos e datasets: no orçamento de 100 tokens, SAS 0,290 fica atrás da maioria dos MAS (Debate 0,370; Sequential 0,364). De 500 tokens em diante, o SAS tem a maior média: 1k: SAS 0,418 vs Debate 0,388, Sequential 0,379; 10k: SAS 0,426 vs Parallel-roles 0,423, Debate e Ensemble 0,420.
- DeepSeek-R1-Distill-Llama-70B, FRAMES (Tabela 5): SAS 0,456 vs Sequential 0,397 com 10k.
- Gemini 2.5 Pro, FRAMES com 1k (Tabela 1): SAS 0,680, Sequential 0,670, Debate 0,638, Ensemble 0,430.
- Orçamento não usado: no Qwen3/FRAMES com 10k pedidos, o SAS usa em média 1.307 tokens, enquanto Ensemble usa 5.571 e Parallel-roles 4.850. Comparações por orçamento nominal subestimam o compute do MAS.
- Degradação de contexto (Qwen3/MuSiQue, Fig. 3, só qualitativa): o SAS lidera com degradação leve (α=0,3); o Sequential vence com degradação forte (α=0,7) por mascaramento ou substituição. Com distratores, o SAS fica à frente o tempo todo.
- Análise de erro (Tabela 2, MuSiQue com 1k): nos casos em que o MAS acerta e o SAS erra, o gabarito aparece no raciocínio do SAS em só 12,5% (Gemini Flash) e 18,3% (Qwen3).
- Artefatos: a contabilidade de thinking tokens da API do Gemini é aproximada (App. C, G); paráfrases dos benchmarks mudam os resultados (App. A).

## Custo/compute considerado?
Sim, é o foco: orçamento igualado de thinking tokens e medição do uso real. Ressalva: os orçamentos são tetos, não uso forçado.

## Ameaças à validade
- Só dois datasets, ambos multi-hop e só texto. Não cobre tarefas agênticas com ferramentas, código ou decomposição paralela.
- Os resultados de degradação de contexto aparecem só em figura.
- Contabilidade de tokens do Gemini aproximada.
- Preprint recente sem venue declarado.

## Relevância para a pergunta central
Contraponto forte para a Norevia: em raciocínio sobre um contexto compartilhado, cooperar não adiciona informação, só reorganiza o compute. O MAS só ajuda quando o agente único não consegue usar bem o contexto (contexto longo, ruidoso ou degradado) ou quando o MAS gasta mais compute. Isso dá uma condição explícita para quando cooperar.

## Hipóteses candidatas
- candidata: com orçamento de tokens igual e contexto bem utilizado, o agente único domina; o MAS só agrega valor quando a utilização efetiva de contexto pelo agente único cai.
- candidata: a vantagem do MAS aparece em orçamentos muito baixos por agente, abaixo do mínimo para um raciocínio útil, e some com orçamento moderado.
- candidata: benchmarks e comparações de swarms precisam medir tokens consumidos de fato, não orçamentos nominais, ou a vantagem do MAS fica inflada.

## Verificação
Abertos em 2026-11-07: https://arxiv.org/abs/2604.02460 (v2, DOI arXiv) e https://arxiv.org/html/2604.02460v2 (lidos cerca de 100k de 123k caracteres; parte dos apêndices F–H não foi lida). Números extraídos por leitor automático, sem conferência manual. Afiliação dos autores não verificada (lacuna).
