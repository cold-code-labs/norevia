---
id: H-20
title: "Alocar tentativas proporcionalmente à qualidade parcial verificada vence amostragem uniforme"
area: hypothesis
evidence: hipotese
status: aberta
origin: "natureza (nat-candidatas C05b; nat-waggle-dance-recruitment; nat-recruitment-benefit-conditions) + teoria (th-modelo §3: P varia por tarefa)"
experiment: "observatory: best-of-N uniforme vs refinamento dos candidatos com maior fração de testes visíveis passando (piso de exploração)"
tags: [recrutamento, best-of-n, alocacao-de-orcamento]
sources:
  - "Passino, K. M. & Seeley, T. D. (2006). Modeling and analysis of nest-site selection by honeybee swarms: the speed and accuracy trade-off. Behav. Ecol. Sociobiol. 59(3):427–442. doi:10.1007/s00265-005-0067-y"
  - "research/theory/MODELO.md (th-modelo) e research/theory/model.mjs"
related: [th-modelo, nat-candidatas, nat-waggle-dance-recruitment, nat-recruitment-benefit-conditions, lit-snell-test-time-compute, lit-large-language-monkeys, H-02, H-05]
updated: 2026-11-07
summary: "Como abelhas que dançam mais para fontes melhores, gastar mais tentativas nos candidatos que já passam em mais testes deve resolver mais tarefas com o mesmo orçamento — mas só quando há sinal parcial confiável."
---

# H-20 — Alocar tentativas proporcionalmente à qualidade parcial verificada vence amostragem uniforme

**Status:** `aberta` · **Nível de evidência do cartão:** `hipotese` · **Origem:** natureza (nat-candidatas C05b; nat-waggle-dance-recruitment; nat-recruitment-benefit-conditions) + teoria (th-modelo §3: P varia por tarefa)

## Enunciado
Quando existe sinal parcial (fração de testes visíveis passando) correlacionado com a correção final, alocar o orçamento de tentativas proporcionalmente a esse sinal (com piso mínimo de exploração) aumenta pass@orçamento em relação a N amostras uniformes; sem sinal parcial confiável, a vantagem desaparece.

## Variáveis
orçamento B, correlação sinal-parcial × correção, piso de exploração, densidade de soluções da tarefa.

## Previsão (quantitativa/direcional)
- Direcional: pass@B(proporcional) > pass@B(uniforme) quando a correlação sinal parcial × aceite final > 0,3.
- Em tarefas com soluções abundantes (p alto), a vantagem some — como o benefício da comunicação de fontes que some quando o alimento é abundante (nat-recruitment-benefit-conditions).

Números do modelo: `research/theory/model.mjs` → `research/theory/curvas/*.json` (parâmetros ilustrativos, não medidos em LLM).

## Condições de refutação
Sem ganho com sinal parcial informativo, ou ganho com sinal parcial não informativo (indicaria outro mecanismo).

## Experimento proposto
Observatório: tarefas b* com vários testes visíveis; dois alocadores com o mesmo orçamento de tokens.

## Evidência atual
Nenhuma local. Fenômeno natural descrito nos cartões nat-* (analogia, não prova em LLMs). Sem derivação fechada neste modelo.

## Limites
Não derivada formalmente no th-modelo; registrada a partir da natureza.
