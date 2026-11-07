---
id: nat-inactive-reserve
title: Trabalhadoras inativas como reserva de capacidade
area: nature
evidence: fenomeno-natural
tags: [reserva, capacidade-ociosa, resiliencia, elastic-swarm, custo]
sources:
  - "Charbonneau, D., Sasaki, T. & Dornhaus, A. (2017). Who needs 'lazy' workers? Inactive workers act as a 'reserve' labor force replacing active workers, but inactive workers are not replaced when they are removed. PLOS ONE 12(9):e0184074. doi:10.1371/journal.pone.0184074"
  - "Charbonneau, D. & Dornhaus, A. (2015). Workers 'specialized' on inactivity: behavioral consistency of inactive workers and their role in task allocation. Behav. Ecol. Sociobiol. 69:1459–1472. doi:10.1007/s00265-015-1958-1 (metadados + resumo parcial via índice secundário)"
  - "Hasegawa, E., Ishii, Y., Tada, K., Kobayashi, K. & Yoshimura, J. (2016). Lazy workers are necessary for long-term sustainability in insect societies. Scientific Reports 6:20846. doi:10.1038/srep20846"
related: [nat-response-threshold, nat-stellar-thermostat, nat-clonal-expansion-contraction, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumos de 2017 e 2016 lidos (OpenAlex). 2015: frase do resumo vista em índice secundário (scite); percentuais de inatividade divergem entre reportagens e NÃO foram usados."
summary: Formigas consistentemente inativas substituem rapidamente as ativas removidas — a colônia mantém um número de ativas, não de inativas; a ociosidade é reserva, paga com produtividade de curto prazo.
---

## Mecanismo
- **Experimento de remoção (2017, *Temnothorax rugatulus*):** removidas as trabalhadoras mais ativas, as colônias **mantiveram o nível de atividade**: ex-inativas tornaram-se ativas, com substituição em **até 1 semana**. Removidas as inativas, a inatividade **caiu e permaneceu baixa** — não houve reposição mesmo **2 semanas** depois. Interpretação dos autores: a colônia regula um número de ativas, não de inativas; inativas funcionam como reserva (e talvez estoque alimentar), papel de comunicação improvável.
- **Consistência (2015):** a inatividade é consistente por indivíduo e difere entre indivíduos — algumas "especializam-se" em inatividade; ritmos circadianos ou turnos não explicam o padrão (resumo parcial via índice). Percentuais: `lacuna`.
- **Modelo (2016):** colônias com limiares variáveis persistem mais que com limiares invariáveis, porque inativas substituem ativas **fatigadas**; a presença de inativas aumenta persistência de longo prazo **à custa de produtividade de curto prazo** (aposta de proteção — *bet-hedging*).

## Evidência
`fenomeno-natural` (2017, experimental) + `relato-autores` (modelo 2016).

## Análogo de engenharia
Folga deliberada de capacidade: cota de API/concorrência reservada e agentes "frios" que não consomem tokens até serem ativados por falha, fadiga (contexto saturado, limite de taxa) ou pico de demanda. O análogo de "fadiga" é concreto: janela de contexto cheia, rate-limit, degradação após muitas iterações.

## Hipótese testável
- **Variável:** fração de capacidade reservada r ∈ {0, 10%, 25%} sob carga com rajadas e falhas injetadas (agente travado, rate-limit).
- **Métrica:** latência p95 até aceite; tarefas perdidas/abandonadas; utilização média; custo por aceite.
- **Previsão:** r = 10–25% reduz latência p95 ≥ 30% e tarefas abandonadas ≥ 50% sob rajadas, com aumento de custo por aceite ≤ 10% (reserva fria não consome tokens). Sem rajadas/falhas, r > 0 só reduz utilização.
- **Refutação:** se a reserva não melhorar p95 sob rajadas, ou se o custo subir > 10% (indicando que a reserva não é realmente fria).

## Limites da transferência
Formigas inativas consomem pouco e podem servir de estoque alimentar; agentes "quentes" ociosos consomem dinheiro se mantidos com contexto carregado. Na colônia a reposição leva dias; em software deve levar segundos — a analogia é sobre a **política** (manter ativas, não inativas), não sobre a escala de tempo.
