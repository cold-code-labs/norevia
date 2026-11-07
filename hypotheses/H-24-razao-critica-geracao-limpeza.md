---
id: H-24
title: "Sem limpeza ativa, a geração de subtarefas tem um limiar crítico acima do qual o estoque explode"
area: hypothesis
evidence: hipotese
status: aberta
origin: "natureza (nat-candidatas C09; nat-kessler-cascade; nat-wound-healing-resolution) + teoria (th-modelo §11; processo de Galton–Watson, Harris 1963)"
experiment: "sims (jobs que geram filhos com média m; com/sem cancelamento transitivo e deduplicação) + auditoria de traços do observatório (filhos por job)"
tags: [contracao, trabalho-orfao, healing-limitado, kessler]
sources:
  - "Harris, T. E. (1963). The Theory of Branching Processes. Springer. doi:10.1007/978-3-642-51866-9"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-candidatas, nat-kessler-cascade, nat-wound-healing-resolution, nat-clonal-expansion-contraction, sim-clonal, H-14, H-21]
updated: 2026-11-07
summary: "Se cada tarefa gera em média uma ou mais subtarefas e nada as cancela ou deduplica, o trabalho pendente cresce sem parar; o modelo dá a fração mínima de limpeza que mantém o sistema estável."
---

# H-24 — Sem limpeza ativa, a geração de subtarefas tem um limiar crítico acima do qual o estoque explode

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-candidatas C09; nat-kessler-cascade; nat-wound-healing-resolution) + teoria (th-modelo §11; processo de Galton–Watson, Harris 1963)

## Enunciado
Num sistema em que cada job gera em média m filhos e uma fração d deles é cancelada/deduplicada/limitada por profundidade, o trabalho total por job raiz é 1/(1 − m(1−d)) se m(1−d) < 1 e diverge caso contrário. Há transição abrupta em m_ef = 1 (não gradual), e d* = 1 − 1/m.

## Variáveis
m (filhos por job), d (limpeza), taxa de entrada, profundidade máxima.

## Previsão (quantitativa/direcional)
- m = 0,9 sem limpeza: 10 jobs por raiz; m = 1,5: diverge; com d = 0,3 → m_ef = 1,05 (ainda diverge); d* = 33%.
- O estoque continua crescendo depois de cessar a entrada sse m_ef ≥ 1.
- Medido nos traços: m̂ por tipo de tarefa e d̂; prever explosão/estabilidade antes de rodar.

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Crescimento gradual sem limiar em torno de m_ef = 1; ou estabilidade com m̂_ef > 1 medido.

## Experimento proposto
Simulação de ramificação com cancelamento; nos traços reais, contar subtarefas geradas e canceladas por job (sem mudar produção).

## Evidência atual
Somente modelo (progênie 1/(1−m) conferida por MC). Analogia física (cascata de Kessler) e biológica (resolução ativa), sem prova em LLMs.

## Limites
Supõe filhos independentes e identicamente distribuídos; filas com limite rígido truncam a explosão (custo vira espera/abandono).
