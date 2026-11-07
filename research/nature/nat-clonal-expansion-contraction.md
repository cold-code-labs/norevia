---
id: nat-clonal-expansion-contraction
title: Seleção clonal — expansão maciça, contração de 90–95% e memória pequena
area: nature
evidence: fenomeno-natural
tags: [elastic-swarm, expansao-contracao, memoria-limitada, retorno-ao-repouso]
sources:
  - "Murali-Krishna, K., Altman, J. D., Suresh, M., Sourdive, D. J. D., Zajac, A. J., Miller, J. D., Slansky, J. & Ahmed, R. (1998). Counting antigen-specific CD8 T cells: a reevaluation of bystander activation during viral infection. Immunity 8(2):177–187. doi:10.1016/S1074-7613(00)80470-7"
  - "Kaech, S. M. & Cui, W. (2012). Transcriptional control of effector and memory CD8+ T cell differentiation. Nat. Rev. Immunol. 12:749–761. doi:10.1038/nri3307 (PMC4137483)"
  - "Kaech, S. M., Wherry, E. J. & Ahmed, R. (2002). Effector and memory T-cell differentiation: implications for vaccine development. Nat. Rev. Immunol. 2:251–262. doi:10.1038/nri778 (resumo)"
related: [nat-danger-theory, nat-wound-healing-resolution, nat-inactive-reserve, lit-agentnet, nat-candidatas, sim-clonal]
updated: 2026-11-07
verificacao: "Murali-Krishna 1998: resumo (OpenAlex). Kaech & Cui 2012: texto do manuscrito (PMC4137483 via E-utilities), frase dos 5–10% conferida. Kaech 2002: só resumo. Burnet (teoria da seleção clonal, 1957) não consultado."
summary: Na infecção aguda, linfócitos T específicos se expandem até ~2×10⁷ por baço e, eliminado o vírus, ~90–95% morrem; os 5–10% restantes viram memória estável que se reexpande rápido na reinfecção.
---

## Mecanismo
- **Expansão (Murali-Krishna et al. 1998, LCMV em camundongo):** **50–70%** das células T CD8 ativadas eram específicas para o vírus — cerca de **2 × 10⁷ células específicas por baço** no pico.
- **Contração:** após a eliminação viral, o número caiu para **10⁶ por baço** e **manteve-se nesse nível pela vida do animal**. Na reinfecção com o mesmo vírus, houve **expansão rápida** das células de memória; infecção por vírus heterólogo não alterou essas células.
- **Fração sobrevivente (Kaech & Cui 2012):** após eliminar o patógeno, as efetoras passam por uma **contração precipitada** em que a maioria morre por apoptose, mas **tipicamente ~5–10% sobrevivem** e amadurecem em memória. (Logo, contração de ~90–95%, consistente com 2×10⁷ → 10⁶.)
- Expansão e contração são **específicas** do antígeno: só o clone relevante cresce.

## Evidência
`fenomeno-natural` (imunologia experimental em camundongos).

## Análogo de engenharia
**Swarm elástico com memória:** ao surgir um problema verificado ("antígeno"), clonar o agente/configuração que resolveu algo semelhante e expandir só esse clone; resolvido o problema, **contrair ~90–95%** (encerrar agentes, liberar contexto) e reter **um resíduo pequeno** (5–10%: receita, prompt, casos-teste, configuração de effort) que reexpande rápido na recorrência. Expansão é guiada pelo **tipo** de problema, não genérica.

## Hipótese testável
- **Variável:** política — (A) swarm grande permanente; (B) expandir/contrair sem memória; (C) expandir/contrair retendo uma "memória" compacta (≤ 10% do contexto/artefatos gerados) indexada por tipo de problema.
- **Métrica:** custo por aceite em sequência com problemas recorrentes (≥ 30% de recorrência); tempo até aceite na 2ª ocorrência; tamanho da memória retida.
- **Previsão:** C reduz o tempo até aceite na recorrência ≥ 40% vs B e custo total ≥ 30% vs A, com memória ≤ 10% do material gerado.
- **Refutação:** se a memória compacta não acelerar recorrências (≥ 40%) ou se reexpansões a partir dela errarem mais (memória "autoimune" — aplicar receita velha a problema novo parecido).

## Limites da transferência
Células de memória são cópias físicas do clone selecionado; "memória" de LLM é texto recuperado, sujeito a recuperação errada. A seleção clonal tem mecanismos de tolerância (contra autorreatividade) que não têm equivalente automático em agentes.
