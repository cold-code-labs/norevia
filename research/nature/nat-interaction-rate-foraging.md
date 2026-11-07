---
id: nat-interaction-rate-foraging
title: Taxa de interação regula o forrageio em formigas colhedoras
area: nature
evidence: fenomeno-natural
tags: [recrutamento, controle-por-retorno, elastic-swarm, contracao, memoria-limitada]
sources:
  - "Gordon, D. M., Holmes, S. & Nacu, S. (2008; online 2007). The short-term regulation of foraging in harvester ants. Behavioral Ecology 19(1):217–222. doi:10.1093/beheco/arm125"
  - "Prabhakar, B., Dektar, K. N. & Gordon, D. M. (2012). The regulation of ant colony foraging activity without spatial information. PLoS Comput. Biol. 8(8):e1002670. doi:10.1371/journal.pcbi.1002670"
  - "Gordon, D. M. (1996). The organization of work in social insect colonies. Nature 380:121–124. doi:10.1038/380121a0 (apenas bibliografia conferida)"
  - "Gordon, D. M. & Mehdiabadi, N. J. (1999). Encounter rate and task allocation in harvester ants. Behav. Ecol. Sociobiol. 45:370–377. doi:10.1007/s002650050573 (apenas bibliografia conferida)"
related: [nat-response-threshold, nat-waggle-dance-recruitment, nat-recruitment-benefit-conditions, nat-candidatas, sim-elastico]
updated: 2026-11-07
verificacao: "Resumos de 2008 e 2012 lidos (OpenAlex). 1996 e 1999: só metadados Crossref."
summary: Formigas colhedoras decidem sair para forragear pela taxa recente de colegas que voltam com comida; a colônia acelera ou freia em minutos sem ninguém saber quanto alimento existe.
---

## Mecanismo
- Em *Pogonomyrmex barbatus*, o retorno de forrageiras **bem-sucedidas** estimula forrageiras inativas a sair. A taxa de retorno depende da disponibilidade de alimento (mais comida → retornos mais rápidos).
- Experimento de campo (2008): reduzir a taxa de retorno por **3–5 min** fez a atividade de forrageio cair em **2–3 min** e se recuperar em **até 5 min**. Os autores inferem que a decisão de sair depende da experiência *muito recente* de encontros — uma memória curta que torna a colônia avessa a risco.
- Modelo (2012): os intervalos entre retornos seguem um **processo de Poisson**; um algoritmo de realimentação com um parâmetro ajustado (efeito de cada retorno sobre a taxa de saída) reproduz as correlações observadas. Não há informação espacial (sem trilhas): a regulação é puramente pela taxa de contatos antenais no ninho.

## Evidência
`fenomeno-natural` (experimento de campo) + `relato-autores` (modelo ajustado).

## Análogo de engenharia
**Recrutamento acoplado a aceite:** a taxa de lançamento de novas tentativas/agentes paralelos é função da taxa recente de *resultados aceitos* (testes que passam, subtarefas verificadas), com janela curta. Se nada aceito retorna, o swarm contrai sozinho; se retornos aceitos aceleram, expande. É análogo a controle de congestionamento (AIMD), mas o sinal é **sucesso verificado**, não ausência de erro.

## Hipótese testável
- **Variável:** política de spawn — (A) N fixo de tentativas paralelas; (B) spawn proporcional à taxa de aceites na janela W (W ∈ {1, 3, 10} eventos).
- **Métrica:** chamadas desperdiçadas em tarefas inviáveis (sem solução aceitável); tempo até 1º aceite em tarefas viáveis; custo por aceite.
- **Previsão:** B reduz ≥ 50% as chamadas em tarefas inviáveis, com aumento ≤ 20% no tempo até o 1º aceite em tarefas viáveis; W pequeno reage mais rápido, W grande é mais estável.
- **Refutação:** se em tarefas inviáveis B não contrair (porque falsos aceites alimentam o laço) ou se o atraso em tarefas viáveis passar de 20%, a hipótese cai. Falsos aceites são o ponto crítico: medir taxa de falso sucesso.

## Limites da transferência
Formigas não pagam custo fixo alto por "ligar" uma forrageira; agentes LLM têm latência de partida. O sinal biológico é físico e confiável (semente trazida); o sinal LLM ("aceito") só vale se o aceite for mecânico/verificável. Sem verificador, o laço amplifica falso sucesso.
