---
id: lit-debate-or-vote
title: "Debate or Vote (Choi, Zhu & Li, NeurIPS 2025) — o voto majoritário explica a maior parte do ganho do debate"
area: literature
evidence: relato-autores
tags: [debate, majority-voting, martingale, teoria, conformidade, ensemble]
sources:
  - "Choi, H. K., Zhu, X. & Li, S. (2025). Debate or Vote: Which Yields Better Decisions in Multi-Agent Large Language Models? arXiv:2508.17536v2 (23 out 2025; v1 24 ago 2025). Comentário arXiv: 'NeurIPS 2025 Spotlight'. doi:10.48550/arXiv.2508.17536. https://arxiv.org/abs/2508.17536v2"
related: [lit-multiagent-debate-du, lit-stop-overvaluing-mad, lit-should-we-be-going-mad, lit-debate-routing-matched-ceiling]
updated: 2026-11-07
primary_opened: true
version: "v2 (2025-10-23)"
summary: Decompondo o debate em voto + interação, o voto majoritário de 5 agentes supera todas as variantes de debate testadas, e um modelo teórico mostra que o debate sozinho é um martingale — não aumenta a correção esperada.
---

## Pergunta
O ganho do multi-agent debate (MAD) vem da troca de argumentos entre agentes ou simplesmente do ensemble (voto majoritário) de várias respostas?

## Método
- Decomposição: voto majoritário (MV) é o caso T=0 do debate; debate adiciona T rodadas de atualização (T = 2, 3, 5).
- N = 5 agentes; Qwen2.5-7B-Instruct e Llama3.1-8B-Instruct (Tabela 1); Qwen2.5-32B em GSM8K e HellaSwag (Tabela 3); temperatura 1,0, top-p 0,9, máx. 512 tokens (Apêndice A.1).
- 7 benchmarks: Arithmetics, GSM8K, MMLU Professional Medicine, MMLU Formal Logic, HellaSwag, CommonsenseQA, HH-RLHF.
- Topologias de debate: descentralizada, esparsa, centralizada.
- Teoria: agentes como Dirichlet-Compound-Multinomial; debate como atualização bayesiana de contagens.

## Resultado relatado
Tabela 1 (média nos 7 benchmarks):

| Modelo | Agente único | Voto majoritário | Melhor MAD |
|---|---|---|---|
| Qwen2.5-7B | 0,7205 | **0,7691** | 0,7377 (Decentralized T=2) |
| Llama3.1-8B | 0,6203 | **0,7242** | 0,6990 (Sparse T=2) |

- MV vence todas as variantes de MAD na média para os dois modelos; MAD vence pontualmente (ex.: Formal Logic 0,5556 vs 0,5397). MAD centralizado é o pior (Qwen 0,6551–0,6672).
- Mais rodadas tendem a piorar o MAD vanilla (Tabela 2, Qwen, descentralizado: T=2 0,7332; T=3 0,7112; T=5 0,7084).
- Qwen2.5-32B (Tabela 3): GSM8K MV 0,9433 vs melhor MAD 0,9400; HellaSwag empate 0,8667.
- **Teorema 2 (martingale):** sob a condição de que a crença média dos vizinhos iguala a do agente, a crença esperada na resposta correta é constante entre rodadas — o debate, sozinho, não melhora a correção esperada. Fig. 4 mostra trajetórias de acurácia média essencialmente planas.
- **Teorema 1:** se N > K/Δ², P(MV correto) ≥ 1 − exp(−N(Δ/√K − 1/√N)²) — o voto melhora exponencialmente com N quando há margem Δ.
- Intervenções que enviesam para a correção (Tabela 2, Qwen, média): vanilla Dec. T=2 0,7332 → Conformist 0,7625 → Follower 0,7629 → Oracle 0,8236 (oracle usa gabarito; não é implantável). Nem Conformist nem Follower superam o MV (0,7691).
- Personas diferentes no mesmo modelo (Tabela 4): MV 0,9367 em GSM8K (melhor); em MMLU Pro. Med., MAD descentralizado 0,8419 > MV 0,8235 — único sinal de valor de diversidade.

## Custo/compute considerado?
Não explicitamente. O paper não pareia tokens/gerações. Pelo protocolo (MV = rodada 0 do debate), MAD com T rodadas usa ~(T+1)×N gerações contra N do voto — **inferência nossa a partir do desenho**, não número do paper. Logo, o voto vence usando menos compute.

## Ameaças à validade
- Modelos pequenos (7–8B) e um 32B; sem modelos de fronteira nem reasoning models.
- Teorema 2 depende de uma condição de homogeneidade (Eq. 1); o paper alega extensão a agentes heterogêneos no Apêndice D.4 (não verificada por nós).
- Heterogeneidade testada só como personas, não como modelos diferentes.
- Inconsistência interna: MAD Dec. T=2 = 0,7377 na Tabela 1 e 0,7332 na Tabela 2; o texto fala em "seis" tarefas e o abstract em sete.

## Relevância para a pergunta central
Talvez o resultado mais direto contra "interação entre agentes gera inteligência coletiva" em agentes homogêneos: **o valor vem da agregação de amostras independentes, não da conversa**. Para Norevia: um micro-swarm homogêneo deveria começar como amostragem + voto; interação só se houver um sinal que enviesa para a correção (verificador, teste, oráculo parcial). O teorema dá forma matemática a "debate sem informação nova é um passeio aleatório na crença".

## Hipóteses candidatas
- candidata: em agentes homogêneos sem verificador, cooperação iterativa tem ganho esperado ~0 sobre o voto; todo ganho exige uma fonte de assimetria (verificador externo, modelo diferente, ferramenta).
- candidata: o retorno do voto segue a cota de Hoeffding — depende da margem Δ do agente individual; quando Δ ≤ 0 (maioria errada), mais agentes pioram.
- candidata: rodadas extras de debate sem sinal de correção degradam (T=2 > T=3 > T=5).

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2508.17536 e https://arxiv.org/abs/2508.17536v2 (versões, comentário "NeurIPS 2025 Spotlight"); https://arxiv.org/html/2508.17536v2 (primeiros 100 mil caracteres: setup, Tabelas 1–5, teoremas).
- Lacuna: os últimos ~21 mil caracteres do HTML (provavelmente apêndices finais/limitações) não foram lidos; página dos proceedings NeurIPS não conferida; Apêndice D.4 não verificado.
