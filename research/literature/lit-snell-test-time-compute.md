---
id: lit-snell-test-time-compute
title: Snell et al. — alocação compute-optimal de test-time compute por dificuldade
area: literature
evidence: relato-autores
tags: [test-time-compute, compute-optimal, dificuldade, verificador, sequencial-vs-paralelo]
sources:
  - "Snell, C., Lee, J., Xu, K. & Kumar, A. (2024). Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters. arXiv:2408.03314v1. https://arxiv.org/abs/2408.03314v1"
related: [lit-large-language-monkeys, lit-self-consistency, lit-more-llm-calls]
updated: 2026-11-07
primary_opened: true
version: "v1 (6 ago. 2024), única versão no arXiv"
summary: A melhor forma de gastar compute de inferência depende da dificuldade de cada prompt; alocar por dificuldade iguala o best-of-N com até cerca de 4× menos compute, mas em problemas difíceis vale mais um modelo maior.
---

## Pergunta
Dado um orçamento de compute de inferência, como alocá-lo por prompt (busca com verificador ou revisões sequenciais)? Quando isso substitui um modelo maior?

## Método
Base: PaLM 2-S* no MATH (divisão 12k/500 de Lightman et al.). Dois mecanismos: (a) busca contra um PRM (best-of-N ponderado, beam search, lookahead); (b) modelo de revisão que refina respostas em sequência. A dificuldade é medida em 5 quantis de pass@1, com 2048 amostras por questão: "oracle" usa o gabarito, "predicted" usa o score médio do PRM (Sec. 3.2). Orçamentos de até 256 gerações. Comparação com FLOPs igualados contra um modelo cerca de 14× maior (Sec. 7).

## Resultado relatado
- Busca com PRM (Sec. 5.3, Fig. 3–4): com orçamento baixo, beam search supera best-of-N; com orçamento alto, a vantagem cai e muitas vezes inverte. Nos níveis fáceis (1–2), beam search piora com mais orçamento por sobre-otimização do verificador. Nos níveis 3–4, beam vence. No nível 5, nenhum método avança muito.
- Estratégia compute-optimal com busca: quase iguala o best-of-N com PRM usando até 4× menos compute (ex.: 16 vs 64 gerações; Fig. 4).
- Revisões (Sec. 6): revisões ingênuas transformam cerca de 38% das respostas corretas em incorretas. Revisões sequenciais superam por pouco a amostragem paralela. Fáceis rendem mais com compute todo sequencial; difíceis, com uma mistura (Fig. 7). A versão compute-optimal supera o best-of-N paralelo com até 4× menos compute (ex.: 64 vs 256; Fig. 8).
- FLOPs iguais vs modelo cerca de 14× maior (Sec. 7, Fig. 9), com R = D_inferência / D_pré-treino em {0,16; 0,79; 22}: test-time compute vence em questões fáceis e médias e com R baixo. Pré-treinar o modelo maior é melhor em questões difíceis (bins 4–5) e com R alto.
- O resumo diz "more than 4×"; pela leitura do HTML v1, o corpo fala em "up to 4×" e a discussão em 2–4×.

## Custo/compute considerado?
Sim, centralmente: FLOPs aproximados (6·N·D no pré-treino e 2·N·D na inferência) e orçamento em número de gerações. Ressalva dos autores: a estimativa de dificuldade custa compute que não entra na contabilidade (Sec. 3.2, App. C).

## Ameaças à validade
- Um modelo base (PaLM 2-S*) e um benchmark (MATH).
- Verificador e modelo de revisão são fine-tunados; os autores notam que essas capacidades não existem prontas nos LLMs proprietários da época.
- O custo da estimativa de dificuldade foi omitido, justamente a parte de "roteamento" que importa para a Norevia.
- Modelos de 2024, antes dos modelos com reasoning nativo.

## Relevância para a pergunta central
É a referência mais próxima de uma "política de alocação de esforço" condicionada à dificuldade, mas dentro de um agente (paralelo vs sequencial, busca vs revisão), não entre agentes cooperativos. Mostra também que o roteador por dificuldade precisa ser barato para o ganho não sumir.

## Hipóteses candidatas
- candidata: a configuração ótima (1 agente sequencial, N paralelos, verificador) muda com a dificuldade; uma política fixa é dominada por uma condicionada à dificuldade.
- candidata: em tarefas fáceis, mais compute paralelo é desperdício e pode piorar por sobre-otimização do verificador.
- candidata: acima de um limiar de dificuldade, nenhum arranjo de inferência compensa capacidade-base insuficiente; é preciso escalar o modelo.
- candidata: o ganho líquido de uma política adaptativa é ganho bruto menos o custo de estimar dificuldade; se esse custo não for pequeno, a política perde.

## Verificação
Abertos em 2026-11-07: https://arxiv.org/abs/2408.03314 (só v1; sem venue declarado no arXiv) e https://arxiv.org/html/2408.03314v1 (lidos cerca de 100k de 111k caracteres; o final, com apêndices, não foi lido). Números extraídos por leitor automático, sem conferência manual. Não verifiquei se houve publicação em conferência (lacuna).
