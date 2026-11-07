---
id: nat-renal-filtration
title: Filtração renal maciça com reabsorção seletiva
area: nature
evidence: fenomeno-natural
tags: [memoria-limitada, compactacao-de-contexto, retencao-seletiva, custo]
sources:
  - "Betts, J. G. et al. (2022). Anatomy and Physiology 2e, seção 25.5 'Physiology of Urine Formation'. OpenStax (Rice University). https://openstax.org/books/anatomy-and-physiology-2e/pages/25-5-physiology-of-urine-formation"
  - "NIDDK — Your Kidneys & How They Work. https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work (citado no estudo anterior, seção 13; não reaberto)"
related: [nat-brain-energy-sparse, lit-agentnet, nat-candidatas]
updated: 2026-11-07
verificacao: "Página OpenStax lida (números abaixo). Livro-texto aberto, não paper primário — lacuna de fonte primária para os valores."
summary: Os rins filtram ~180 L de plasma por dia e devolvem ~99% à circulação, eliminando só 1–2 L — filtrar tudo e reabsorver o que importa, em vez de escolher o que filtrar.
---

## Mecanismo
- Taxa de filtração glomerular média de **~125 mL/min** (homens), equivalente a **~180 L/dia em homens e ~150 L/dia em mulheres** (OpenStax 25.5).
- **"Noventa e nove por cento** deste filtrado retorna à circulação por reabsorção", de modo que **só cerca de 1–2 L** de urina são produzidos por dia.
- A estratégia é **filtrar de forma não seletiva** (por tamanho/pressão) e então **reabsorver seletivamente** água e solutos necessários ao longo dos túbulos; resíduos e excessos seguem para eliminação.

## Evidência
`fenomeno-natural`, com fonte de livro-texto aberto (fonte primária experimental → `lacuna`).

## Análogo de engenharia
Compactação de memória/contexto em duas etapas: (1) **descartar por padrão** tudo que é transitório (logs, tentativas, mensagens de progresso); (2) **reabsorver explicitamente** o que tem função: compromissos abertos, decisões com origem, preferências do usuário, evidência de aceite. É o inverso de "resumir tudo um pouco": é filtrar quase tudo e reter, por regra, um conjunto pequeno e tipado.

## Hipótese testável
- **Variável:** estratégia de compactação — (A) resumo livre por LLM; (B) filtrar-e-reabsorver: descarte por padrão + retenção tipada (compromissos, decisões, preferências, evidências) por regra/esquema.
- **Métrica:** razão de compressão; recall de compromissos abertos e de fatos necessários em perguntas de sonda posteriores; perda indevida de informação.
- **Previsão:** B atinge compressão ≥ 90% com recall de compromissos ≥ 98%, enquanto A, na mesma compressão, perde ≥ 10% dos compromissos.
- **Refutação:** se A igualar B em recall na mesma compressão, ou se B exigir esquema tão grande que a compressão caia abaixo de 70%.

## Limites da transferência
O rim conhece de antemão o que reabsorver (glicose, sódio, água) por transportadores evoluídos; num sistema de agentes, o "esquema de reabsorção" precisa ser definido e pode omitir algo importante. Não autoriza exclusão de memórias de terceiros (ver estudo anterior).
