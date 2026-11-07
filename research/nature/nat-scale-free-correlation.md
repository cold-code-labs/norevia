---
id: nat-scale-free-correlation
title: Correlações livres de escala em revoadas de estorninhos
area: nature
evidence: fenomeno-natural
tags: [propagacao-de-informacao, criticalidade, correlacao, cascata-de-erro]
sources:
  - "Cavagna, A., Cimarelli, A., Giardina, I., Parisi, G., Santagati, R., Stefanini, F. & Viale, M. (2010). Scale-free correlations in starling flocks. PNAS 107(26):11865–11870. doi:10.1073/pnas.1005766107 (PMC2900681)"
related: [nat-topological-neighbors, nat-vicsek-phase-transition, nat-condorcet-correlated, lit-correlated-errors, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumo + números via página PMC (WebFetch)."
summary: Em revoadas de 122 a 4.268 estorninhos, o alcance da correlação entre flutuações de velocidade cresce proporcional ao tamanho do bando (ξ ≈ 0,35 L) — a perturbação de um pássaro alcança o grupo todo.
---

## Mecanismo
- Reconstrução 3D de **24 eventos** de revoada, com **122 a 4.268** indivíduos e tamanho linear de 9,1 a 85,7 m; polarização média Φ = 0,96 ± 0,03.
- O comprimento de correlação das flutuações de orientação escala **linearmente com o tamanho do bando**: ξ = a·L, **a = 0,35** (n = 24, r = 0,98); para flutuações de velocidade escalar, **a = 0,36** (r = 0,97). Ou seja, correlações **livres de escala**: a mudança de estado de um animal afeta e é afetada por todos, por maior que seja o grupo.
- Isso dá a cada ave um alcance efetivo de percepção muito maior que seu alcance de interação direta. Os autores **sugerem** que bandos estão perto de um ponto crítico (hipótese deles, não resultado estabelecido).

## Evidência
`fenomeno-natural` (medição) + `relato-autores` (interpretação de criticalidade).

## Análogo de engenharia
Num swarm de LLM, correlação longa é faca de dois gumes: propaga rápido um achado correto (um agente encontra a causa e todos ajustam) **e** propaga rápido um erro (cascata de conformidade em debate). O parâmetro análogo é o quanto cada agente se ajusta ao estado dos vizinhos. Medir "comprimento de correlação" = quantos agentes mudam de resposta depois que um muda.

## Hipótese testável
- **Variável:** força de acoplamento social (agente vê respostas dos pares: nunca / após resposta independente / antes de responder) × injeção controlada de um agente "semente" certo ou errado.
- **Métrica:** fração do swarm que adota a resposta da semente (alcance da cascata) quando ela está certa vs errada; acurácia final.
- **Previsão:** maior acoplamento aumenta o alcance da cascata **simetricamente** para sementes certas e erradas (razão alcance_certo/alcance_errado < 1,5) — ou seja, acoplamento sem verificação não discrimina verdade.
- **Refutação:** se o alcance para sementes certas for ≥ 2× o de erradas sem verificador, LLMs discriminam por conteúdo e o risco de cascata é menor do que a analogia sugere.

## Limites da transferência
Velocidade de voo é um vetor contínuo de baixa dimensão; respostas de LLM são discretas e semânticas. Correlação útil para fugir de predador não é a mesma coisa que correlação útil para acertar uma resposta — no segundo caso, independência é valiosa (ver `nat-condorcet-correlated`).
