---
id: nat-bacterial-quorum-sensing
title: Quorum sensing bacteriano — agir em conjunto só acima de uma densidade
area: nature
evidence: fenomeno-natural
tags: [quorum, limiar-de-densidade, quando-cooperar, sinal-difuso, ativacao-adaptativa]
sources:
  - "Miller, M. B. & Bassler, B. L. (2001). Quorum sensing in bacteria. Annu. Rev. Microbiol. 55:165–199. doi:10.1146/annurev.micro.55.1.165"
  - "Waters, C. M. & Bassler, B. L. (2005). Quorum sensing: cell-to-cell communication in bacteria. Annu. Rev. Cell Dev. Biol. 21:319–346. doi:10.1146/annurev.cellbio.21.012704.131001"
related: [nat-response-threshold, nat-quorum-nest-bees, nat-danger-theory, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumos das duas revisões lidos (OpenAlex). Concentrações-limiar e densidades celulares específicas NÃO conferidas → lacuna."
summary: Bactérias liberam autoindutores cuja concentração cresce com a densidade; ao cruzar um limiar, a população inteira muda a expressão gênica — porque certos comportamentos só rendem quando feitos por muitos ao mesmo tempo.
---

## Mecanismo
- Bactérias produzem e liberam **autoindutores**; a concentração cresce com a densidade celular. A detecção de uma **concentração mínima limiar** altera a expressão gênica (Miller & Bassler 2001, resumo). Gram-negativas usam em geral homosserina-lactonas aciladas; Gram-positivas, oligopeptídeos processados.
- Processos regulados incluem simbiose, virulência, competência, conjugação, produção de antibióticos, motilidade, esporulação e biofilme.
- **Justificativa funcional (Waters & Bassler 2005, resumo):** a maioria dos processos controlados por quorum sensing é **improdutiva quando feita por uma bactéria sozinha**, mas **benéfica quando feita simultaneamente por muitas células**.
- Valores numéricos de limiar/densidade: `lacuna` (não estão nos resumos).

## Evidência
`fenomeno-natural` (revisões de literatura experimental).

## Análogo de engenharia
**Ativação coletiva por densidade de sinal:** cada agente/rotina emite um sinal barato e padronizado (ex.: "observei o bloqueio X") num meio compartilhado; o modo coletivo caro (incidente, micro-swarm de diagnóstico, revisão de arquitetura) só é ativado quando a concentração do sinal — nº de observações **independentes** do mesmo problema numa janela — passa um limiar. Também classifica tarefas: há tarefas cujo valor é nulo abaixo de massa crítica (ex.: auditoria cruzada exige ≥ 2 perspectivas) e tarefas onde 1 agente basta.

## Hipótese testável
- **Variável:** gatilho de escalonamento — (A) cada alerta individual abre investigação; (B) investigação só quando ≥ q alertas independentes do mesmo problema em janela T (q ∈ {2, 3}).
- **Métrica:** investigações abertas por problema real; problemas reais não detectados; tempo até detecção.
- **Previsão:** B reduz investigações duplicadas/espúrias ≥ 60% com perda de detecção ≤ 5% e atraso ≤ T.
- **Refutação:** se os alertas forem correlacionados (mesma origem gerando múltiplos), B aciona sem ganho; se problemas reais raros gerarem só 1 alerta, B perde detecção > 5%.

## Limites da transferência
Autoindutor é difuso e lido por todos de graça; em sistemas de agentes "contar sinais independentes" exige deduplicação por origem. Bactérias também são enganadas por sinais de outras espécies — análogo de alertas falsificados ou duplicados.
