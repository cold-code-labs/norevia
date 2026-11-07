---
id: lit-frugalgpt
title: 'FrugalGPT — cascata de LLMs com função de aceite aprendida'
area: literature
evidence: relato-autores
tags: [roteamento, cascata, custo, ativacao-adaptativa, diversidade-de-erros]
sources:
  - "Chen, L., Zaharia, M. & Zou, J. (2024). FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance. Transactions on Machine Learning Research (TMLR). OpenReview: https://openreview.net/forum?id=cSimKw5p6R"
  - "Preprint: arXiv:2305.05176v1 (9 mai. 2023). https://arxiv.org/abs/2305.05176v1 · doi:10.48550/arXiv.2305.05176"
related: [lit-routellm, lit-adaptive-consistency, lit-early-stopping-sc]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (9 mai. 2023), única versão; versão TMLR 2024 não aberta"
summary: Uma cascata barato→caro com verificador aprendido igualou GPT-4 com até 98,3% menos custo em um dataset de classificação, mas exige dados rotulados da mesma distribuição.
---

## Pergunta
É possível consultar LLMs de preço muito diferente (até duas ordens de grandeza) em sequência e parar no primeiro cuja resposta "pareça confiável", reduzindo custo sem perder qualidade?

## Método
Três estratégias discutidas (adaptação de prompt, aproximação, cascata); a avaliada é a **cascata**: lista ordenada de APIs (comprimento 3); após cada resposta, uma função de score (DistilBERT ajustado para regressão, prediz se a resposta está correta dado pergunta+resposta) compara com um limiar; se passar, para; senão chama o próximo modelo (Sec. 3–4). Lista e limiares são escolhidos por otimização com restrição de orçamento esperado (problema inteiro-misto, aproximado por poda e interpolação). 12 APIs de 5 provedores, preços de março de 2023 (Tabela 1). Datasets: HEADLINES (10.000), OVERRULING (2.400), COQA (7.982) (Tabela 2), divisão treino/teste aleatória.

## Resultado relatado
- Tabela 3 (mesma acurácia do melhor modelo individual): HEADLINES custo 33,1→0,6 (−98,3%, vs GPT-4); OVERRULING 9,7→2,6 (−73,3%, vs GPT-4); COQA 72,5→29,6 (−59,2%, vs GPT-3).
- Abstract: "up to 98% cost reduction" ou "+4%" de acurácia sobre GPT-4 ao mesmo custo; a legenda da Fig. 5 fala em "up to 5%" e o texto da Sec. 4 em "50% to 98%" — inconsistências internas do próprio paper.
- Exemplo HEADLINES (Sec. 4): aceitar GPT-J se score > 0,96; senão J1-L se score > 0,37; senão GPT-4. A US$ 6,5 (1/5 do custo do GPT-4): −80% de custo e +1,5% de acurácia.
- Mecanismo do ganho (Fig. 4, "MPI"): em ~6% dos casos de HEADLINES e ~13% de COQA, um modelo mais barato acerta onde o GPT-4 erra — diversidade de erros. Os autores dizem que MPI é limite superior, "may not always be attainable".

## Custo/compute considerado?
Sim, é o objeto central (US$ por API, tokens de entrada/saída e por requisição). Não inclui latência nem o custo de treinar o scorer, tratado como custo único inicial (Sec. 5).

## Ameaças à validade
Tarefas curtas de classificação/QA com resposta verificável; preços de 2023 obsoletos; o scorer precisa de rótulos "from the same or similar distribution" (Sec. 5); números internos inconsistentes (4% vs 5%; 50% vs 59,2%); não detecta quando todos os modelos baratos erram de forma concordante ("open problem", Sec. 5). Só a versão arXiv v1 foi aberta; a versão TMLR pode ter números diferentes.

## Relevância para a pergunta central
Evidência direta de que **ativar mais capacidade só quando um verificador barato rejeita** reduz custo muito em tarefas onde a maioria das consultas é fácil. É o análogo "Êxodo 18" (escalonamento seletivo) já implementado — Norevia não pode reivindicar novidade em cascata por confiança. Também mostra que combinar modelos diferentes pode superar o melhor individual por erros não correlacionados.

## Hipóteses candidatas
- candidata: a economia de uma cascata é proporcional à fração de consultas "fáceis" detectáveis por um verificador barato; com distribuição de dificuldade uniforme-alta, a economia tende a zero.
- candidata: o ganho de qualidade acima do melhor modelo único é limitado pela fração de casos em que modelos baratos acertam e o caro erra (MPI) — i.e., pela descorrelação de erros.
- candidata: o custo de calibrar o verificador (rótulos em distribuição) é o termo que decide se a cascata compensa para volumes pequenos.

## Verificação
Aberto em 2026-11-07: https://arxiv.org/abs/2305.05176 (metadados), https://ar5iv.labs.arxiv.org/html/2305.05176 (texto, renderização da v1), https://mlanthology.org/tmlr/2024/chen2024tmlr-frugalgpt (venue). Lacuna: PDF TMLR/OpenReview não aberto; números acima são da v1.
