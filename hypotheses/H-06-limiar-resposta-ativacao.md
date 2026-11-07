---
id: H-06
title: "Ativação por limiar de resposta (insetos sociais) reduz agentes sem perder aceite"
area: hypothesis
evidence: hipotese
status: em-teste
origin: "natureza (nat-candidatas C04; nat-response-threshold; Bonabeau et al. 1996) + teoria (th-modelo §8)"
experiment: "sims/sim-limiar-resposta (proposta) + variante do observatory C-elastic com estímulo = falha de teste visível e/ou discordância das 2 primeiras amostras (ver H-18)"
tags: [divisao-de-trabalho, adaptive-swarm-activation, limiar-de-resposta]
sources:
  - "Bonabeau, E., Theraulaz, G. & Deneubourg, J.-L. (1996). Proc. R. Soc. B 263(1376):1565–1569. doi:10.1098/rspb.1996.0229"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-response-threshold, nat-candidatas, nat-reflex-vs-cortex, sim-limiar-resposta, nat-inactive-reserve, H-05, H-16, H-18, lit-snell-test-time-compute, lit-routellm, lit-debate-routing-matched-ceiling]
updated: 2026-11-07
summary: "Como operárias com limiares diferentes, agentes extras só entram quando o estímulo (incerteza da tarefa) passa do seu limiar — um "oi" não ativa ninguém, uma tarefa ambígua ativa vários."
---

# H-06 — Ativação por limiar de resposta (insetos sociais) reduz agentes sem perder aceite

**Status:** `em-teste` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-candidatas C04; nat-response-threshold; Bonabeau et al. 1996) + teoria (th-modelo §8)

## Enunciado
Com limiares θ_i escalonados e estímulo s = incerteza estimada (p.ex. discordância entre as 2 primeiras respostas, ou falha do verificador), o nº de agentes ativos Σ T_{θ_i}(s) acompanha a dificuldade; em misturas com ≥ 50% de tarefas fáceis, isso reduz agentes por tarefa ≥ 40% vs N = 5 fixo, com perda de aceite ≤ 2 p.p.

## Variáveis
s (estímulo), θ_i, n (expoente; 2 no modelo original), mistura de dificuldades.

## Previsão (quantitativa/direcional)
- Ativos esperados (θ = 0,1…0,9; n = 2): s = 0,05 → 0,3; s = 0,3 → 2,5; s = 0,9 → 4,7.
- Correlação positiva entre agentes ativados e dificuldade real (taxa de erro de A-low na tarefa).
- Os limiares ≥ 40% e ≤ 2 p.p. são **critérios propostos**, não derivados.
- Condição de nat-C04: o ganho só aparece se o estímulo prever a dificuldade (AUC ≥ ~0,75) e custar ≤ 10% da tarefa média; com estímulo = discordância, a AUC fica limitada pelos erros unânimes (H-18).

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Economia < 20% ou perda de aceite > 2 p.p.; ou estímulo sem correlação com a dificuldade (então o mecanismo não discrimina).

## Experimento proposto
Simulação: agentes abstratos com p por tarefa, estímulo ruidoso, comparação com N fixo e com elástico de H-05. Observatório: C-elastic com regra de limiar.

## Evidência atual
Simulação `sim-limiar-resposta` (validacao-local no modelo de fila com estímulo = backlog, pré-registrada; P1–P5 suportadas): limiares sem mensagens chegam perto de um despachante central perfeito (latência 1,46 vs 1,34 passos) com ~22% mais agentes ativos, usam menos agentes que papéis fixos dimensionados pelo pico e vencem o despachante quando mensagens custam ou atrasam. Isso apoia o **mecanismo**, não a previsão específica para LLM (estímulo = incerteza, ≥ 40% menos agentes, ≤ 2 p.p.) — status `em-teste`. O modelo de limiar é fenômeno natural descrito (Bonabeau et al. 1996); a analogia não demonstra eficácia em LLMs.

## Limites
Limiar de inseto responde a estímulo físico; aqui o estímulo é uma estimativa que custa chamadas. Se o estímulo for só discordância, ele não enxerga erros unânimes (H-18; `lit-debate-routing-matched-ceiling`): usar também falha de teste/verificador como estímulo.
