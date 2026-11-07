---
id: nat-wound-healing-resolution
title: Cicatrização em fases com término ativo (resolução da inflamação)
area: nature
evidence: fenomeno-natural
tags: [healing-limitado, encerramento, reparo-delimitado, retorno-ao-repouso]
sources:
  - "Gurtner, G. C., Werner, S., Barrandon, Y. & Longaker, M. T. (2008). Wound repair and regeneration. Nature 453:314–321. doi:10.1038/nature07039"
  - "Serhan, C. N. (2014). Pro-resolving lipid mediators are leads for resolution physiology. Nature 510:92–101. doi:10.1038/nature13479 (PMC4263681)"
  - "Larouche, J., Sheoran, S., Maruyama, K. & Martino, M. M. (2018). Immune regulation of skin wound healing: mechanisms and novel therapeutic targets. Adv. Wound Care 7(7):209–231. doi:10.1089/wound.2017.0761 (resumo)"
  - "Ellis, S., Lin, E. J. & Tartar, D. (2018). Immunology of wound healing. Curr. Dermatol. Rep. 7:350–358. doi:10.1007/s13671-018-0234-9 (PMC6244748; fonte da seção 12 do estudo anterior — identidade conferida via NCBI esummary; conteúdo não reaberto)"
related: [nat-clonal-expansion-contraction, nat-danger-theory, nat-kessler-cascade, lit-selfheal, lit-mast, nat-candidatas]
updated: 2026-11-07
verificacao: "Gurtner 2008 e Larouche 2018: resumos. Serhan 2014: texto do manuscrito (PMC4263681 via E-utilities), frases sobre resolução ativa e autolimitada conferidas. PMC6244748 (estudo anterior) identificado como Ellis, Lin & Tartar 2018; texto não reaberto."
summary: A resposta inflamatória aguda é autolimitada e sua resolução é um programa ativo — não uma diluição passiva; inflamação em excesso é a principal causa de cicatrização desregulada.
---

## Mecanismo
- **Fases sincronizadas (Gurtner et al. 2008, resumo):** após lesão, múltiplas vias são ativadas imediatamente e sincronizadas; em adultos o reparo costuma terminar em cicatriz fibrótica não funcional, enquanto tecidos fetais iniciais regeneram sem fibrose. (A sequência hemostasia–inflamação–proliferação–remodelação está no estudo anterior, seção 12; não reconferida aqui.)
- **Resolução ativa (Serhan 2014, texto):** a resposta inflamatória aguda, por ser protetora, é idealmente **autolimitada**, levando à **resolução completa e retorno à homeostase**. Evidências indicam que a resolução é uma **resposta programada ativa**, "ligada" por mediadores pró-resolução (lipoxinas, resolvinas, protectinas, maresinas), **não simplesmente diluição passiva** de quimioatraentes. Há índices de resolução, como o **intervalo de resolução (R_i)**, que identificam agentes que aceleram ou atrasam a resolução.
- **Excesso (Larouche et al. 2018, resumo):** inflamação em excesso é a **principal culpada** pela desregulação da cicatrização normal; limitá-la reduz cicatrizes.

## Evidência
`fenomeno-natural` (revisões de biologia experimental). Durações típicas de cada fase: `lacuna` (não conferidas).

## Análogo de engenharia
Um incidente/reparo tem **fase de resolução explícita e ativa**: um evento que encerra agentes extras, retira supervisão adicional, cancela esperas e consolida evidência — e não apenas um *timeout* que deixa o sistema "inflamado". Medir um **intervalo de resolução** (do pico de agentes ativos até 50% deles) como métrica de saúde. Inflamação excessiva = swarm de reparo grande demais que gera regressões.

## Hipótese testável
- **Variável:** encerramento — (A) passivo (agentes param por timeout/inatividade); (B) ativo (sinal de resolução disparado por verificação de aceite, com cancelamento de descendentes).
- **Métrica:** intervalo de resolução R_i (tempo do pico de agentes ativos até 50%); trabalho órfão residual; reincidência em 7 dias; regressões introduzidas pelo reparo.
- **Previsão:** B reduz R_i ≥ 70% e trabalho órfão ≥ 80% sem aumentar reincidência; swarms de reparo maiores que o necessário aumentam regressões (relação dose-resposta).
- **Refutação:** se B encerrar cedo demais (reincidência sobe > 5 p.p.) ou se o tamanho do swarm de reparo não tiver relação com regressões.

## Limites da transferência
Não há equivalência entre tipos celulares e papéis de agentes. Em software, rollback/backup e autorização são mecanismos explícitos sem análogo biológico direto. Resolução biológica é química e local; em sistemas distribuídos, cancelar descendentes depende de capacidades do runtime que precisam ser verificadas.
