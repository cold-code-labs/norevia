---
id: nat-vicsek-phase-transition
title: Modelo de Vicsek — transição de fase entre desordem e movimento coletivo
area: nature
evidence: relato-autores
tags: [transicao-de-fase, ruido, consenso, diversidade, temperatura]
sources:
  - "Vicsek, T., Czirók, A., Ben-Jacob, E., Cohen, I. & Shochet, O. (1995). Novel type of phase transition in a system of self-driven particles. Phys. Rev. Lett. 75(6):1226–1229. doi:10.1103/PhysRevLett.75.1226 (arXiv cond-mat/0611743)"
related: [nat-scale-free-correlation, nat-small-groups-correlated-cues, lit-diverse-debate-hegazy, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumo lido (OpenAlex)."
summary: Partículas que copiam a direção média dos vizinhos com ruído η passam de desordem a movimento coletivo quando o ruído cai abaixo de um valor crítico — uma transição contínua com expoente β ≈ 0,45.
---

## Mecanismo
- Partículas com velocidade escalar constante; a cada passo, cada uma adota a **direção média dos vizinhos** num raio, mais uma perturbação aleatória η.
- Evidência numérica de **transição de fase cinética**: de transporte nulo (velocidade média |v_a| = 0) a transporte líquido finito, por quebra espontânea de simetria rotacional.
- A transição é **contínua**: |v_a| ∝ (η_c − η)^β com **β ≃ 0,45** (resumo). A posição de η_c depende da densidade (detalhe não conferido no texto integral).

## Evidência
`relato-autores` (modelo numérico de física estatística; não é medição em animais).

## Análogo de engenharia
"Ruído" = diversidade/temperatura de amostragem/independência dos agentes; "alinhar com vizinhos" = ajustar resposta às dos pares. Previsão qualitativa: existe um regime de ruído abaixo do qual o swarm **sempre** converge (consenso, inclusive prematuro) e acima do qual não converge — e a passagem pode ser abrupta, não gradual. Projetar o swarm perto, mas do lado certo, da transição.

## Hipótese testável
- **Variável:** temperatura de amostragem / grau de diversidade de prompts (η) × densidade de interação (k vizinhos lidos).
- **Métrica:** parâmetro de ordem = fração de agentes na resposta modal após R rodadas; acurácia da resposta modal.
- **Previsão:** o parâmetro de ordem cai de forma não linear (sigmoide íngreme) num η_c que diminui quando k diminui; a acurácia da resposta modal é máxima ligeiramente abaixo de η_c (consenso ainda forma-se, mas com mais exploração).
- **Refutação:** se o parâmetro de ordem cair linearmente com η (sem transição) ou se a acurácia for monotônica em η (sem ótimo intermediário).

## Limites da transferência
Partículas de Vicsek não têm "resposta certa": ordem não é acurácia. Respostas de LLM são discretas e multimodais; transições podem ser de primeira ordem ou inexistentes. Uso estritamente heurístico para desenhar varreduras de parâmetro.
