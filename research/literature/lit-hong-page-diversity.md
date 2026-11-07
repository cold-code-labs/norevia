---
id: lit-hong-page-diversity
title: "Diversidade vs habilidade: grupos diversos superam grupos dos melhores (Hong & Page, PNAS 2004)"
area: literature
evidence: relato-autores
tags: [diversidade, inteligencia-coletiva, busca-heuristica, composicao-de-grupo, classico]
sources:
  - "Hong, L. & Page, S. E. (2004). Groups of diverse problem solvers can outperform groups of high-ability problem solvers. Proc. Natl. Acad. Sci. USA 101(46):16385–16389. doi:10.1073/pnas.0403723101 — PMC528939: https://pmc.ncbi.nlm.nih.gov/articles/PMC528939/"
related: [lit-correlated-errors, lit-great-models-think-alike, lit-diversity-of-thought, lit-diverse-debate-hegazy, lit-sintese]
updated: 2026-11-07
primary_opened: true
version: "PNAS 101(46), 2004 (lido via PMC528939; página PNAS retornou 403)"
summary: Em simulação de busca, 10 agentes aleatórios superaram os 10 melhores agentes (94,53 vs 92,56) porque os melhores convergem para heurísticas parecidas — resultado clássico, de modelo idealizado e contestado, não sobre LLMs.
---

## Pergunta
Um grupo de solucionadores escolhidos ao acaso (diversos) pode superar um grupo formado pelos individualmente melhores?

## Método
- Modelo: cada agente = perspectiva + heurística. Função-valor aleatória em n = 2.000 pontos num anel (valores uniformes em [0,100]); n variado de 200 a 10.000.
- Heurística: checar k posições até l pontos à direita (1 ≤ k < l); principal k = 3, l = 12 ou 20 (variações l 6–20, k 2–7). Todos compartilham a mesma perspectiva; diferem só na heurística.
- Grupo busca sequencialmente; para quando nenhum agente melhora a solução.
- Compara os 10 ou 20 melhores contra 10 ou 20 aleatórios; 50 tentativas (Tabela 1).
- Teorema 1: com condições de dificuldade, diversidade (para todo x não ótimo algum agente o melhora), unicidade do melhor agente e suporte pleno, existem N > N1 tais que, com probabilidade 1, N1 agentes aleatórios superam os N1 melhores de um pool de N. É resultado de existência; não dá tamanhos.

## Resultado relatado (Tabela 1; desempenho = valor esperado do ponto de parada; diversidade em %)
| Composição | Melhores: desempenho | Melhores: diversidade | Aleatórios: desempenho | Aleatórios: diversidade |
|---|---|---|---|---|
| 10 agentes, l=12 | 92,56 (0,020) | 70,98 | 94,53 (0,007) | 90,99 |
| 20 agentes, l=12 | 93,78 (0,015) | 74,95 | 94,72 (0,005) | 91,46 |
| 10 agentes, l=20 | 93,52 (0,026) | 73,69 | 96,08 (0,006) | 94,31 |

- Rodada ilustrativa (l=12, 10 agentes): melhor indivíduo 87,3; pior 84,3; grupo dos melhores 93,2 (diversidade 0,72); grupo aleatório 94,7 (0,92).
- A vantagem do grupo aleatório **diminui de 10 para 20 agentes** (gap 1,97 → 0,94).

## Custo/compute considerado?
Não. Não há custo por agente nem por passo de busca; grupos têm o mesmo tamanho.

## Ameaças à validade
- Modelo abstrato de busca em anel; agentes compartilham a perspectiva; não há comunicação ruidosa nem erro de agregação.
- Críticas publicadas existem (Thompson 2014, Notices of the AMS, questionando a força do teorema; e trabalho de replicação em eScholarship/CogSci sobre modelos de cadeias binárias), mas **não foram lidas nesta revisão** (PDFs não extraíveis/403) — registradas como lacuna, sem atribuir conteúdo.
- Resultado é sobre composição com tamanho fixo, não sobre “mais agentes vs agente melhor”.

## Relevância para a pergunta central
Fundamento teórico clássico para “diversidade importa mais que habilidade individual” — mas o mecanismo é específico: os melhores ficam parecidos, logo redundantes. Para LLMs, lit-correlated-errors e lit-great-models-think-alike mostram exatamente esse padrão (modelos melhores erram de forma parecida), o que torna o argumento plausível por analogia, **sem demonstrar** que se transfere: aqui agentes melhoram uma solução compartilhada sequencialmente (não votam), e a diversidade é de heurística de busca, não de dados de treino.

## Hipóteses candidatas
- candidata: em busca/melhoria iterativa compartilhada (ex.: depuração com testes), um micro-swarm de estratégias distintas supera N cópias do melhor agente, e o ganho decresce com N.
- candidata: o benefício da diversidade cai quando o pool de estratégias é pequeno ou o grupo cresce (todos os grupos acabam cobrindo o espaço).

## Verificação
- Abertos em 2026-11-07: https://pmc.ncbi.nlm.nih.gov/articles/PMC528939/ (texto integral, Tabela 1, Teorema 1). https://doi.org/10.1073/pnas.0403723101 redireciona para pnas.org, que retornou HTTP 403.
- Contagem do pool de heurísticas para l=12 (1.320) é cálculo pela fórmula, não texto do paper; para l=20 o paper declara 6.840.
- Lacuna: críticas (Thompson 2014; replicação CogSci) não abertas com sucesso.
