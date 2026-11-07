---
id: lit-mast
title: "MAST — por que sistemas multiagente LLM falham?"
area: literature
evidence: relato-autores
tags: [falhas, taxonomia, verificacao, encerramento-prematuro, diagnostico]
sources:
  - "Cemri, M.; Pan, M. Z.; Yang, S.; Agrawal, L. A.; Chopra, B.; Tiwari, R.; Keutzer, K.; Parameswaran, A.; Klein, D.; Ramchandran, K.; Zaharia, M.; Gonzalez, J. E.; Stoica, I. (2025). Why Do Multi-Agent LLM Systems Fail? arXiv:2503.13657v3 (26 out. 2025). https://arxiv.org/abs/2503.13657v3"
  - "NeurIPS 2025, spotlight poster: https://neurips.cc/virtual/2025/poster/121528"
related: [lit-selfheal, lit-swarmsys]
updated: 2026-11-07
primary_opened: true
version: "v3 (2025-10-26); v1 2025-03-17, v2 2025-04-22"
summary: "Em 1.642 traços de 7 frameworks multiagente, as falhas vêm sobretudo do desenho do sistema e da verificação, e consertar prompts ou topologia rende no máximo cerca de +15,6% de sucesso."
---

## Pergunta
Por que os sistemas multiagente LLM (MAS) entregam ganhos frequentemente mínimos nos benchmarks populares? Quais modos de falha aparecem e com que frequência?

## Método
- Teoria fundamentada sobre traços, com anotação humana iterativa e um anotador LLM-as-a-Judge (o1, few-shot) calibrado.
- MAST-Data com 1.642 traços (Tabela 1) de 7 frameworks: ChatDev, MetaGPT, HyperAgent, AppWorld, AG2/MathChat, Magentic-One e OpenManus.
- Modelos: GPT-4o, GPT-4, Claude-3.7-Sonnet, Qwen2.5-Coder-32B e CodeLlama-7b.
- Tarefas: ProgramDev, SWE-Bench Lite, GAIA, GSM-Plus, OlympiadBench e MMLU.

## Resultado relatado
Relato dos autores.
- **Taxa de falha** de 41% a 86,7% em 7 MAS de código aberto (Introdução). Os sistemas rodam benchmarks diferentes, então as taxas não são diretamente comparáveis.
- **14 modos de falha (Seção 4 / Apêndice A):**

| Modo | Descrição | Frequência |
|---|---|---|
| FM-1.1 | Desobedecer especificação da tarefa | 11,8% |
| FM-1.2 | Desobedecer papel | 1,5% |
| FM-1.3 | Repetição de passos | 15,7% |
| FM-1.4 | Perda de histórico | 2,8% |
| FM-1.5 | Não reconhece condição de término | 12,4% |
| FM-2.1 | Reset de conversa | 2,2% |
| FM-2.2 | Não pede esclarecimento | 6,8% |
| FM-2.3 | Desvio de tarefa | 7,4% |
| FM-2.4 | Retenção de informação | 0,85% |
| FM-2.5 | Ignora input de outro agente | 1,9% |
| FM-2.6 | Descompasso raciocínio-ação | 13,2% |
| FM-3.1 | Encerramento prematuro | 6,2% |
| FM-3.2 | Verificação ausente ou incompleta | 8,2% |
| FM-3.3 | Verificação incorreta | 9,1% |

- **Por categoria** (soma feita por esta fiche, não reportada no texto lido): desenho do sistema ≈ 44,2%, desalinhamento entre agentes ≈ 32,35%, verificação ≈ 23,5%.
- **Concordância:** κ humano = 0,88. O anotador o1 few-shot atinge acurácia de 0,94 e κ = 0,77; zero-shot fica em κ = 0,58. Fora do domínio, κ = 0,79.
- **Intervenções (Tabela 5):**
  - ChatDev no ProgramDev-v0: baseline 25,0; prompt melhorado 34,4; nova topologia 40,6. No HumanEval: 89,6 / 90,3 / 91,5.
  - AG2 no GSM-Plus com GPT-4: 84,75 / 89,75 / 85,50. A topologia não é significativa (Wilcoxon p = 0,4).
  - AG2 com GPT-4o: 84,25 / 89,00 / 88,83 (p = 0,03).
  - Os autores dizem que essas intervenções "não constituem melhorias substanciais".

## Custo/compute considerado?
Não. O foco é diagnóstico de falhas; não há contabilidade de tokens nem comparação com agente único de compute igual. A afirmação de "ganhos mínimos sobre agente único/best-of-N" vem de trabalhos citados (Agentless; Kapoor et al.), sem números próprios no texto lido.

## Ameaças à validade
- Cada MAS foi avaliado em um benchmark diferente, o que torna as taxas de falha não comparáveis.
- Só 30 traços por MAS em parte do conjunto.
- A anotação por LLM tem κ = 0,77 (não perfeito).
- O sistema de categorias tem nomenclatura que varia entre versões ("system design" vs "specification").

## Relevância para a pergunta central
Explica parte do custo oculto de expandir: a coordenação introduz modos de falha que não existem com um agente (FC2 ≈ 32%). Verificação e término (FM-1.5, FM-3.x) somam cerca de 36%, o que liga diretamente ao critério de "resultado verificavelmente correto" da Norevia. Também mostra que remendos de prompt ou topologia têm teto baixo.

## Hipóteses candidatas (hipótese)
- candidata: cada agente adicional aumenta a superfície de falhas de coordenação de forma que pode anular o ganho de cobertura; existe um N a partir do qual o custo de falha supera o ganho de diversidade.
- candidata: um verificador com critério mecânico (testes) agrega mais que agentes adicionais de geração, porque ataca FC3.
- candidata: uma condição de término explícita reduz FM-1.3 e FM-1.5 (≈28% somados) e é uma alavanca de custo direta.

## Verificação
- Aberto em 2026-11-07:
  - https://arxiv.org/abs/2503.13657 (v1–v3)
  - https://arxiv.org/html/2503.13657v3 (lido em duas partes: Tabela 1, Seções 3–5, Tabela 5)
  - https://neurips.cc/virtual/2025/poster/121528 (spotlight poster no NeurIPS 2025)
- Lacunas:
  - O track (Datasets & Benchmarks vs Main) não está declarado na página aberta; um resultado de busca sugere D&B, mas não está confirmado.
  - Os percentuais por categoria da Figura 1 não foram lidos diretamente.
  - Os números de "ganho mínimo vs agente único" estão em fontes secundárias citadas.
