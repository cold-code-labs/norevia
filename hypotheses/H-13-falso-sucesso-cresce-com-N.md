---
id: H-13
title: "Com verificador imperfeito, o falso sucesso cresce com N e a precisão dos aceitos não melhora"
area: hypothesis
evidence: hipotese
status: suportada-preliminar
origin: "teoria (th-modelo §3) + literatura (Stroebl et al.; lit-mast FM-3.x)"
experiment: "observatory best-of-N com testes visíveis como verificador e testes ocultos como aceite; sims/sim-verificador (feito)"
tags: [falso-sucesso, verificacao, best-of-n, aceite-verificavel]
sources:
  - "Stroebl, B., Kapoor, S. & Narayanan, A. The Limits of Inference Scaling Through Resampling. arXiv:2411.17501v3"
  - "Brown, B. et al. (2024). Large Language Monkeys. arXiv:2407.21787v3"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, sim-verificador, lit-large-language-monkeys, lit-mast, H-02, H-05]
updated: 2026-11-07
summary: "Cada tentativa extra é uma nova chance de o verificador aprovar algo errado: o falso sucesso sobe com o número de tentativas, concentrado nas tarefas mais difíceis."
---

# H-13 — Com verificador imperfeito, o falso sucesso cresce com N e a precisão dos aceitos não melhora

**Status:** `suportada-preliminar` · **Nível de evidência do cartão:** `hipotese` · **Origem:** teoria (th-modelo §3) + literatura (Stroebl et al.; lit-mast FM-3.x)

## Enunciado
Em best-of-N, P_false(N) = (1−π)(1 − r^N) cresce com N; a precisão dos aceitos é π (iid) e cai com N quando há heterogeneidade/correlação (ρ > 0), porque tarefas quase insolúveis consomem tentativas até um falso aceite.

## Variáveis
p, s, f, ρ, N.

## Previsão (quantitativa/direcional)
- Precisão dos aceitos(N = 8) ≥ precisão dos aceitos(N = 64) com ρ > 0 (p = 0,1, f = 0,01, ρ = 0,3: P_true 0,50 vs P_false 0,27 em N = 64).
- Os falsos sucessos concentram-se nas tarefas com menor p̂.
- Abster-se e escalar preserva o aceite verificável melhor que "fallback para o voto".

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Precisão dos aceitos crescente em N (IC95%) com verificador fixo.

## Experimento proposto
Observatório: N ∈ {1,2,4,8,16}; marcar aceite pelo verificador (visível) vs aceite real (oculto); estratificar por dificuldade.

## Evidência atual
Simulação `sim-verificador` (validacao-local no modelo, pré-registrada): P2 suportada — FS monotônico em N e fórmula fechada dentro do IC em 55/56 pontos; `bon-fallback` mascara falhas. Sem medição em LLM.

## Limites
Supõe verificador estacionário; verificadores LLM-juiz podem ter f dependente do candidato.
