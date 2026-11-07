---
id: nat-danger-theory
title: Teoria do perigo — responder a dano, não a novidade
area: nature
evidence: hipotese
tags: [deteccao-de-anomalia, gatilho-de-escalonamento, alarme-falso, imunidade]
sources:
  - "Matzinger, P. (1994). Tolerance, danger, and the extended family. Annu. Rev. Immunol. 12:991–1045. doi:10.1146/annurev.iy.12.040194.005015"
  - "Matzinger, P. (2002). The danger model: a renewed sense of self. Science 296(5566):301–305. doi:10.1126/science.1071059"
related: [nat-bacterial-quorum-sensing, nat-clonal-expansion-contraction, nat-wound-healing-resolution, lit-bio-autonomic, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumos das duas publicações lidos (OpenAlex). O status de consenso da teoria na imunologia atual não foi avaliado."
summary: Matzinger propôs que o sistema imune é guiado mais por sinais de dano vindos dos tecidos do que pela distinção próprio/não-próprio — um modelo influente, mas proposto como ponto de vista, não como fato estabelecido.
---

## Mecanismo
- **1994 (resumo):** propõe que o sistema imune "não se importa" com próprio vs não-próprio; sua força motriz principal é **detectar e proteger contra perigo**, e ele **não age sozinho**: recebe comunicações positivas e negativas de uma rede estendida de outros tecidos.
- **2002 (Viewpoint, resumo):** modelo em que o sistema imune está mais preocupado com **entidades que causam dano** do que com as estrangeiras.
- É uma **proposta teórica** (essay/viewpoint); o grau de suporte experimental atual não foi avaliado aqui.

## Evidência
`hipotese` (no campo de origem: modelo teórico proposto pela autora). Por isso o cartão não é `fenomeno-natural`.

## Análogo de engenharia
Escalonar/abrir incidente com base em **sinais de dano** confirmados (teste que passava agora falha, regressão observada, erro visível ao usuário, critério de aceite violado) e **não** com base em novidade/estranheza (log nunca visto, saída de formato incomum, agente desconhecido). Os "tecidos" são os componentes que reportam dano; o detector central não decide sozinho.

## Hipótese testável
- **Variável:** gatilho de escalonamento — (A) anomalia/novidade (desvio estatístico do comportamento usual); (B) dano (violação de critério verificável); (C) A ∧ B.
- **Métrica:** alarmes falsos por semana; problemas reais detectados; tempo até detecção (em ambiente com falhas injetadas e mudanças benignas injetadas).
- **Previsão:** B reduz alarmes falsos ≥ 70% vs A, detectando ≥ 90% das falhas com dano; A detecta antes algumas falhas silenciosas (sem dano ainda observável).
- **Refutação:** se B perder > 20% das falhas reais (dano não observável a tempo), o gatilho por dano é insuficiente e precisa de A como sinal secundário.

## Limites da transferência
A teoria é contestável no próprio campo; usá-la só como gerador de hipótese. Em software, muitos danos são silenciosos (corrupção de dados) — esperar o dano pode ser tarde.
