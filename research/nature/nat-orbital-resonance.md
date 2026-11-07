---
id: nat-orbital-resonance
title: Ressonâncias orbitais — cadeias estáveis e lacunas de instabilidade (analogia)
area: nature
evidence: fenomeno-natural
tags: [celeste-analogia, cadencia, dependencias, contencao, agendamento]
sources:
  - "Luger, R. et al. (2017). A seven-planet resonant chain in TRAPPIST-1. Nature Astronomy 1:0129. doi:10.1038/s41550-017-0129 (arXiv:1703.04166)"
  - "Murray, C. D. & Dermott, S. F. Solar System Dynamics. Cambridge University Press (Crossref registra 2000). doi:10.1017/CBO9781139174817"
  - "NASA — Astronomers Confirm Orbital Details of TRAPPIST-1h (citada no estudo anterior, seção 16; não reaberta)"
related: [nat-circadian-cadence, nat-lagrange-points, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumo arXiv de Luger 2017 lido (versão não registrada pela página — lacuna de vN). Murray & Dermott: descrição do livro (OpenAlex) menciona lacunas de Kirkwood."
summary: Os sete planetas de TRAPPIST-1 formam uma cadeia em que ressonâncias de três corpos ligam cada membro; já no cinturão de asteroides, ressonâncias com Júpiter abrem lacunas — a mesma relação de períodos pode estabilizar ou esvaziar.
---

## Mecanismo
- **TRAPPIST-1 (Luger et al. 2017, resumo):** período orbital de **18,77 dias** medido para o planeta mais externo, TRAPPIST-1h, consistente com o previsto pelas **relações de Laplace**; h é o **sétimo membro de uma cadeia complexa**, com **ressonâncias de três corpos ligando cada membro**. Razões específicas e escalas de estabilidade: `lacuna` (não estão no resumo lido).
- **Lacunas de Kirkwood (Murray & Dermott, descrição do livro):** o livro explica a origem das lacunas de Kirkwood no cinturão de asteroides — regiões esvaziadas associadas a ressonâncias de movimento médio com Júpiter (detalhe não conferido no texto).
- Ou seja, comensurabilidade de períodos é um mecanismo de acoplamento que **pode** proteger configurações (cadeia) ou **remover** objetos (lacunas), conforme a dinâmica.

## Evidência
`fenomeno-natural` (astronomia observacional + mecânica celeste). Transposição **estritamente analógica**; planetas não trocam informação.

## Análogo de engenharia
Rotinas e fluxos periódicos com períodos comensuráveis (ex.: 5 min, 15 min, 60 min) **coincidem** periodicamente — o que pode ser útil (pipeline em fase: cada etapa consome a versão validada da anterior) ou prejudicial (picos de contenção quando todas disparam no mesmo minuto). A ferramenta concreta é offset/jitter e dependências versionadas, não astronomia.

## Hipótese testável
- **Variável:** agendamento de M rotinas periódicas — (A) períodos comensuráveis alinhados em fase (todas no minuto :00); (B) mesmos períodos com offsets/jitter; (C) disparo por evento de dependência (versão nova da entrada).
- **Métrica:** pico de concorrência; latência p95; retrabalho por mudança de entrada.
- **Previsão:** B reduz o pico de concorrência ≥ 50% vs A com mesmo throughput; C reduz retrabalho ≥ 50% vs A/B quando entradas mudam raramente.
- **Refutação:** se a comensurabilidade não produzir picos mensuráveis (carga desprezível) — então a analogia não acrescenta nada à prática de jitter.

## Limites da transferência
Ressonância orbital é dinâmica gravitacional conservativa; agendamento é discreto e dissipativo. A analogia não prediz quais razões são "estáveis" para software. Ver ressalvas do estudo anterior, seção 16.
