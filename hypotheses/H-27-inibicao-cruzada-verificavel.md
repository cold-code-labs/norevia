---
id: H-27
title: "Inibição cruzada por contraexemplo verificável quebra impasses entre opções igualmente apoiadas"
area: hypothesis
evidence: hipotese
status: aberta
origin: "natureza (nat-stop-signal-cross-inhibition — Seeley et al. 2012) + teoria (th-modelo §11)"
experiment: "observatory: agregação por rodadas de apoio vs apoio + eliminação por contraexemplo executável (teste que falha)"
tags: [agregacao, impasse, verificacao, debate]
sources:
  - "Seeley, T. D. et al. (2012). Stop Signals Provide Cross Inhibition in Collective Decision-Making by Honeybee Swarms. Science 335(6064):108–111. doi:10.1126/science.1210361"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-stop-signal-cross-inhibition, nat-candidatas, lit-debate-or-vote, H-08, H-02]
updated: 2026-11-07
summary: "Abelhas dão "sinais de parada" nas que dançam por locais rivais e assim evitam empates; num swarm de agentes, um contraexemplo verificável que elimina uma opção encurta impasses entre respostas igualmente apoiadas."
---

# H-27 — Inibição cruzada por contraexemplo verificável quebra impasses entre opções igualmente apoiadas

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-stop-signal-cross-inhibition — Seeley et al. 2012) + teoria (th-modelo §11)

## Enunciado
Entre duas opções com apoio igual, a margem de votos segue passeio simétrico e leva E[T] = m² rodadas para atingir a margem de decisão m. Se, a cada rodada, um contraexemplo verificável elimina a opção errada com prob. v, E[T] = E[min(T_passeio, Geom(v))], com taxa de impasse (sem decisão após R rodadas) menor; contraexemplos não verificáveis (opinião) não têm esse efeito.

## Variáveis
m (margem de decisão), v (taxa de contraexemplos verificáveis), R (teto de rodadas).

## Previsão (quantitativa/direcional)
- m = 3: 9 → 6,7 (v = 0,05) → 3,8 (v = 0,2) rodadas; m = 5: 25 → 12,3 → 4,7.
- Inibição por contraexemplo executável reduz impasses sem reduzir acurácia; inibição por argumento não verificável pode reduzir acurácia (manada, cf. regime recrutamento-forte de sim-quorum).

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Nenhuma redução de rodadas/impasse com v̂ > 0,05; ou queda de acurácia > 2 p.p. com inibição verificável.

## Experimento proposto
Observatório: tarefas com duas correções plausíveis; agregação com/sem etapa "gerar teste que derruba a outra".

## Evidência atual
Somente modelo (E[T] = m² conferido por MC). Fenômeno natural relatado (Seeley et al. 2012), analogia.

## Limites
Duas opções e apoio simétrico; com várias opções, a inibição pode eliminar a correta se o contraexemplo for falso (f > 0).
