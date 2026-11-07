---
id: lit-debate-routing-matched-ceiling
title: "Statistical Scouting Finds Debate-Safe but Not Debate-Useful Cases (Hu, Shen & Lakshmipathi, 2026) — roteamento por exemplo entre greedy, voto e debate"
area: literature
evidence: relato-autores
tags: [roteamento, ativacao-adaptativa, debate, voto, entropia, oraculo, custo]
sources:
  - "Hu, J., Shen, A. & Lakshmipathi, K. (2026). Statistical Scouting Finds Debate-Safe but Not Debate-Useful Cases: A Matched-Ceiling Study of Open-Weight LLM Reasoning Protocols. arXiv:2605.09618v1 (10 mai 2026), relatório técnico/preprint, Amazon Web Services. https://arxiv.org/abs/2605.09618v1"
related: [lit-debate-or-vote, lit-pareto-test-time-multiagent, lit-stop-overvaluing-mad]
updated: 2026-11-07
primary_opened: true
version: "v1 (2026-05-10)"
summary: Escolher o protocolo certo por exemplo daria +14 pp no MuSiQue, mas sinais baratos (entropia do voto) recuperam só 11–19% disso, porque 66% dos casos em que o debate ajuda têm voto unânime e errado.
---

## Pergunta
Com um teto igual de tokens gerados, quanto ganho existe em escolher por exemplo entre responder direto, votar ou debater — e quanto dele se recupera com sinais baratos obtidos antes de deliberar?

## Método
- Protocolos com teto de 960 tokens gerados por exemplo: greedy (1 chamada, T=0); vote3 (3 chamadas, T=0,7, 320 tokens cada); debate crítica-revisão com 2 agentes, 3 rodadas + moderador (7 chamadas).
- Modelos: Llama 3.1 8B Instruct e Ministral 3 8B Instruct (Amazon Bedrock).
- Dados: MuSiQue-Ans v1.0 (N=300; F1 de tokens ≥ 0,5 = correto), GSM8K (N=150).
- Controladores: limiar de entropia do voto (H > 1,0 → escalar para debate), regressão logística e gradient-boosted trees sobre entropia, margem, tamanho de pergunta e de contexto; CV estratificada 5-fold; bootstrap pareado com 10.000 reamostragens.

## Resultado relatado
Tabela 1 (acurácia; oráculo = qualquer protocolo correto):

| Dados | Modelo | Greedy | Vote3 | Debate | Oráculo | Gap |
|---|---|---|---|---|---|---|
| MuSiQue | Llama 8B | 39,7 | 40,3 | 43,7 | 57,7 | +14,0 |
| MuSiQue | Ministral 8B | 48,3 | 49,0 | 47,0 | 62,7 | +13,7 |
| GSM8K | Llama 8B | 81,3 | 83,3 | 60,7 | 90,7 | +7,3 |
| GSM8K | Ministral 8B | 90,7 | 74,7 | 79,3 | 95,3 | +4,7 |

- O melhor protocolo fixo muda em cada uma das 4 células; nenhum é default seguro.
- Debate em Llama/MuSiQue: acerta sozinho em 13,7% e estraga resposta correta do voto em 12,3% — quase se cancelam (Seção 4.2). Em Ministral, estraga mais que ajuda (15,7% vs 7,0%). Em GSM8K, quase nenhuma vitória exclusiva.
- 66,7% dos debates (Llama/MuSiQue) têm troca de posição; muitas trocas são certo→errado.
- Estratos de entropia (Tabela 2, Llama): unânime (H=0) ajuda 13,4% / atrapalha 14,2%; dividido ajuda 14,1% / atrapalha 17,2%; 3-way (H>1) ajuda 21,6% / atrapalha 2,7% (net +14). Ministral: mesma direção, mais fraca (H>1: atrapalha 9,7%, net +5).
- Controladores (Tabela 4, MuSiQue): limiar de entropia +1,3 pp (Llama) e +1,7 pp (Ministral) sobre o melhor fixo, recuperando 11% e 19% do gap de oráculo de 2 vias (+12,3 e +9,0 pp); ICs individuais incluem zero; meta-análise +1,6 pp (p=0,125). Controladores aprendidos não superam o limiar (GBT negativo no Llama, atribuído a overfitting).
- 66% dos exemplos em que o debate ajuda ocorrem com **voto unânime e errado** — invisíveis a sinais de desacordo.
- Sonda de autocrítica de 1 prompt no Llama troca a resposta em 127/127 casos unânimes (zero informação; pode ser artefato de formato do prompt, como os autores admitem).
- Tokens: debates errados consomem mais tokens que os certos (mediana 547 vs 475).

## Custo/compute considerado?
Sim, como teto de tokens gerados (prompt não conta). Os autores destacam que **o teto não é orçamento**: no MuSiQue o voto gasta mediana 26–117 tokens e o debate 422–518 — qualquer ganho do debate é confundido por usar mais tokens.

## Ameaças à validade
- Amostras pequenas (300/150), dois modelos 8B; o "colapso" de dano em H>1 no Llama se apoia em 2 casos.
- Anomalia sinalizada pelos autores: vote3 do Ministral em GSM8K 16 pp abaixo do greedy (temperatura não recalibrada).
- Relatório técnico/preprint (14 páginas), sem revisão por pares; autores de um provedor de nuvem (Bedrock), sem conflito declarado avaliado por nós.

## Relevância para a pergunta central
Mede diretamente o problema de Norevia — **ativação adaptativa**: há muito ganho latente em escolher o protocolo por exemplo (+14 pp), mas os sinais baratos de incerteza só dizem quando a cooperação é **segura**, não quando é **necessária**. Erro correlacionado (todas as amostras concordam no erro) é exatamente o caso que a cooperação deveria resolver e que a entropia não enxerga. Isso aponta para a necessidade de sinais externos (verificador, teste, ferramenta) em vez de concordância interna.

## Hipóteses candidatas
- candidata: desacordo entre amostras prevê baixo risco da cooperação, não alto benefício; o benefício se concentra em erros correlacionados (unânimes).
- candidata: o teto de um roteador por exemplo é grande (≈+14 pp), mas recuperá-lo exige sinais de verificação, não de consenso.
- candidata: mais tokens gastos num debate indicam maior chance de erro (sinal de parada/escalonamento).

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2605.09618 (v1 única; comentários; licença CC BY 4.0); PDF v1 baixado e extraído localmente (Seções 1–5, Tabelas 1–4).
- Lacuna: Seções 6+ (discussão do confundimento de tokens, Apêndice B) não lidas por inteiro; trabalhos citados de "selective debate"/DOWN não verificados.
