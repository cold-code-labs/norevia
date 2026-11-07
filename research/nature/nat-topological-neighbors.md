---
id: nat-topological-neighbors
title: Interação topológica com ~6–7 vizinhos em estorninhos
area: nature
evidence: fenomeno-natural
tags: [topologia, k-vizinhos, custo-de-comunicacao, robustez, macro-swarm]
sources:
  - "Ballerini, M., Cabibbo, N., Candelier, R., Cavagna, A., Cisbani, E., Giardina, I., Lecomte, V., Orlandi, A., Parisi, G., Procaccini, A., Viale, M. & Zdravkovic, V. (2008). Interaction ruling animal collective behavior depends on topological rather than metric distance: evidence from a field study. PNAS 105(4):1232–1237. doi:10.1073/pnas.0711437105 (PMC2234121)"
  - "Young, G. F., Scardovi, L., Cavagna, A., Giardina, I. & Leonard, N. E. (2013). Starling flock networks manage uncertainty in consensus at low cost. PLoS Comput. Biol. 9(1):e1002894. doi:10.1371/journal.pcbi.1002894"
related: [nat-scale-free-correlation, nat-physarum-network, lit-agentprune, lit-mixture-of-agents, nat-candidatas]
updated: 2026-11-07
verificacao: "Ballerini 2008: números via página PMC. Young 2013: resumo lido (OpenAlex)."
summary: Cada estorninho segue um número fixo de vizinhos (6,5 ± 0,9), não todos dentro de um raio; isso mantém a coesão sob ataque e, segundo modelo posterior, otimiza robustez por esforço individual.
---

## Mecanismo
- **Ballerini et al. 2008:** em **10** eventos reconstruídos (bandos com > 400 aves, até ~2.600), cada ave interage em média com um **número fixo de vizinhos, n_c = 6,5 ± 0,9 (EP)** — interação **topológica**, não métrica. Simulações de ataque de predador: com interação métrica, "desgarrados" foram **43%** dos componentes conectados; com topológica, **5%**. A interação topológica mantém a coesão sob grandes variações de densidade.
- **Young et al. 2013 (resumo):** com medida de robustez de consenso sob ruído, redes com **6 ou 7 vizinhos otimizam o trade-off entre coesão do grupo e esforço individual**; o nº ótimo **não depende do nº de aves**, mas da forma (espessura) do bando.

## Evidência
`fenomeno-natural` (medição) + `relato-autores` (modelo de otimalidade).

## Análogo de engenharia
Cada agente lê as saídas de **k pares fixos** (ex.: k vizinhos num anel/grafo esparso), não de todos os N: custo de comunicação O(N·k) em vez de O(N²); coesão preservada mesmo quando agentes entram/saem (densidade variável ≈ swarm elástico). O ótimo não depende de N, mas da "espessura" da tarefa (quantas dimensões/subproblemas independentes).

## Hipótese testável
- **Variável:** k ∈ {1, 2, 3, 4, 6, N−1} em debate/agregação com N ∈ {6, 12, 24}.
- **Métrica:** acurácia final; tokens de contexto lidos por agente; variância da resposta final entre réplicas (coesão).
- **Previsão:** acurácia satura num k* pequeno (k* ≤ 4) **independente de N**; k = N−1 custa O(N²) sem ganho > 1 p.p. sobre k*.
- **Refutação:** se k* crescer com N (dependência de escala) ou se k = N−1 superar k* por > 3 p.p.

## Limites da transferência
6–7 é específico de estorninhos em voo 3D e de uma medida de robustez particular; não é "número mágico" para LLMs. Agentes LLM leem textos longos — o custo por vizinho é muito maior que o de uma ave olhar outra, o que tende a puxar k* para baixo.
