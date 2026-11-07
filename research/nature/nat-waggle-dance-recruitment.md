---
id: nat-waggle-dance-recruitment
title: Dança do requebrado — recrutamento proporcional à qualidade
area: nature
evidence: fenomeno-natural
tags: [recrutamento, alocacao-proporcional, best-of-n, quanto-cooperar]
sources:
  - "Seeley, T. D., Mikheyev, A. S. & Pagano, G. J. (2000). Dancing bees tune both duration and rate of waggle-run production in relation to nectar-source profitability. J. Comp. Physiol. A 186:813–819. doi:10.1007/s003590000134 (PMID 11085635)"
  - "Seeley, T. D., Camazine, S. & Sneyd, J. (1991). Collective decision-making in honey bees: how colonies choose among nectar sources. Behav. Ecol. Sociobiol. 28(4). doi:10.1007/BF00175101 (apenas bibliografia)"
  - "Seeley, T. D. & Buhrman, S. C. (2001). Nest-site selection in honey bees: how well do swarms implement the 'best-of-N' decision rule? Behav. Ecol. Sociobiol. 49:416–427. doi:10.1007/s002650000299 (apenas bibliografia + TLDR automático do Semantic Scholar)"
related: [nat-quorum-nest-bees, nat-recruitment-benefit-conditions, nat-interaction-rate-foraging, lit-large-language-monkeys, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumo de 2000 lido (PubMed). 1991 e 2001: só metadados; a afirmação de 2001 vem de TLDR automático — tratada como lacuna."
summary: Abelhas dançam mais tempo e mais rápido para fontes melhores; o recrutamento escala com a qualidade sem que nenhuma abelha compare as opções.
---

## Mecanismo
- Seeley, Mikheyev & Pagano (2000, resumo PubMed): forrageiras ajustam a **duração D** e a **taxa R** de produção de corridas de requebrado, de modo que o nº de corridas por viagem **W = D·R** é função da rentabilidade da fonte; **D e R crescem com a rentabilidade**. A taxa é ajustada pela duração da fase de retorno do circuito de dança.
- Consequência coletiva (Seeley et al. 1991, não aberto): a colônia direciona forrageiras para as melhores fontes sem comparação individual entre fontes — a comparação emerge da competição entre recrutamentos de intensidades diferentes. **Detalhes e números de 1991: `lacuna`.**
- Na escolha de ninho, batedoras ajustariam a força da dança à qualidade do local (Seeley & Buhrman 2001) — afirmação vista só em resumo automático → `lacuna`.

## Evidência
`fenomeno-natural` (resumo de 2000 lido); demais → `lacuna` no detalhe.

## Análogo de engenharia
**Alocação proporcional de computação de continuação:** em best-of-N/busca em árvore, cada candidato parcial recebe novas expansões proporcionais a um **sinal verificável de qualidade** (testes passando, cobertura, score de verificador), e não uniformemente. Nenhum agente precisa comparar todas as opções: a comparação emerge da competição por orçamento.

## Hipótese testável
- **Variável:** política de alocação de orçamento entre candidatos — (A) uniforme (N amostras independentes); (B) proporcional à qualidade verificada parcial (ex.: fração de testes passando), com piso mínimo de exploração.
- **Métrica:** pass@orçamento (fração de tarefas resolvidas para B tokens fixos); custo até 1ª solução aceita.
- **Previsão:** B resolve ≥ 15% mais tarefas a orçamento igual quando o sinal parcial é informativo (correlação ≥ 0,4 com sucesso final); sem sinal informativo, B ≈ A.
- **Refutação:** se B não superar A mesmo com sinal informativo, ou se perder > 5% por colapso prematuro em candidato localmente bom (falta de exploração).

## Limites da transferência
A rentabilidade do néctar é medida pela própria abelha de forma direta; sinais parciais em código podem ser enganosos (passar testes fracos). Recrutamento proporcional sem piso de exploração pode convergir cedo demais.
