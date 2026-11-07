---
id: nat-kessler-cascade
title: Síndrome de Kessler — densidade crítica em que detritos geram mais detritos (analogia)
area: nature
evidence: fenomeno-natural
tags: [celeste-analogia, trabalho-orfao, cascata, densidade-critica, limpeza]
sources:
  - "Kessler, D. J. & Cour-Palais, B. G. (1978). Collision frequency of artificial satellites: the creation of a debris belt. J. Geophys. Res. 83(A6):2637–2646. doi:10.1029/JA083iA06p02637"
  - "Liou, J.-C. & Johnson, N. L. (2006). Risks in space from orbiting debris. Science 311(5759):340–341. doi:10.1126/science.1121337"
  - "ESA — Space Environment Report 2026 (citado no estudo anterior, seção 18; não reaberto)"
related: [nat-wound-healing-resolution, nat-stellar-thermostat, lit-mast, nat-candidatas]
updated: 2026-11-07
verificacao: "Kessler 1978: resumo (OpenAlex). Liou & Johnson 2006: texto lido de cópia PDF hospedada em vesta.astro.amu.edu.pl (não é o site da editora), extraído localmente."
summary: Acima de uma densidade espacial crítica, colisões produzem fragmentos mais rápido do que o arrasto os remove; o modelo da NASA de 2006 projetou crescimento da população em LEO após ~2055 mesmo sem novos lançamentos.
---

## Mecanismo
- **Kessler & Cour-Palais 1978 (resumo):** à medida que o número de satélites cresce, cresce a probabilidade de colisões; cada colisão produz fragmentos que **aumentam a probabilidade de novas colisões**, levando à formação de um cinturão de detritos. Implementação precoce de restrições de lançamento e procedimentos operacionais poderia **atrasar significativamente** a formação.
- **Liou & Johnson 2006 (texto):** em algumas altitudes de LEO, onde a densidade de objetos está **acima de uma densidade espacial crítica**, a taxa de produção de novos detritos por colisões **excede a perda** por decaimento orbital. Na projeção LEGEND (Monte Carlo, 200 anos, objetos ≥ 10 cm, LEO 200–2.000 km), com **cenário sem novos lançamentos**, fragmentos de colisão substituem os detritos que decaem **até ~2055**, mantendo a população aproximadamente constante; **depois de 2055**, a criação de fragmentos supera o decaimento e a população cresce. Colisão catastrófica: razão energia de impacto/massa do alvo > **40 J/g**.

## Evidência
`fenomeno-natural` (modelagem de engenharia espacial) — a projeção é modelo, não observação; transposição **estritamente analógica**.

## Análogo de engenharia
Trabalho órfão (rotinas, callbacks, delegações sem dono) pode gerar mais trabalho órfão: um diagnóstico dispara outro, mensagens de progresso viram novas demandas. Existe uma **razão crítica R = taxa de geração de trabalho derivado / taxa de limpeza (conclusão + cancelamento)**; com R > 1 o estoque cresce sozinho mesmo sem novos pedidos do usuário. Medidas: deduplicação por ocorrência, limite de profundidade, dono obrigatório, cancelamento transitivo.

## Hipótese testável
- **Variável:** (i) probabilidade p de um job gerar um job filho sem dedup; (ii) política de contenção — nenhuma vs dedup + limite de profundidade + dono obrigatório.
- **Métrica:** estoque de jobs ativos ao longo do tempo após cessar a entrada de novos pedidos; jobs órfãos; ações por incidente.
- **Previsão:** sem contenção, existe p_c (≈ ponto em que o nº médio de filhos por job ≥ 1, como num processo de ramificação) acima do qual o estoque cresce após cessar a entrada; com contenção, o estoque decai a zero para todo p testado.
- **Refutação:** se não houver comportamento de limiar (crescimento gradual em p) ou se a contenção não evitar crescimento acima de p_c.

## Limites da transferência
Detritos obedecem física orbital; jobs obedecem regras que nós escrevemos e podemos mudar. A analogia não autoriza apagar registros/obrigações de terceiros (ver estudo anterior, seção 18).
