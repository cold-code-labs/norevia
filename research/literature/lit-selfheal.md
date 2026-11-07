---
id: lit-selfheal
title: "SelfHeal — padrões de correção e reparo de bugs em agentes LLM com crítico separado"
area: literature
evidence: relato-autores
tags: [reparo, healing, critico, verificacao, custo, micro-swarm]
sources:
  - "Islam, N.; Raza, M. A.; Wardat, M. (2026). SelfHeal: Empirical Fix Pattern Analysis and Bug Repair in LLM Agents. arXiv:2604.17699v1 (20 abr. 2026). Comentário arXiv: 'Accepted at EASE 2026'. doi:10.48550/arXiv.2604.17699. https://arxiv.org/abs/2604.17699v1"
  - "Código declarado: https://github.com/Laboratory-software-Innovation/SelfHeal"
related: [lit-mast]
updated: 2026-11-07
primary_opened: true
version: "v1 (2026-04-20; única versão)"
summary: "Um par agente-de-correção + crítico conserta 22 de 37 bugs reais de agentes, e as regras de correção pesam mais que o crítico, que acrescenta só 3 casos."
---

## Pergunta
Quais padrões de correção resolvem bugs reais em código de agentes LLM (LangChain/LlamaIndex), e um sistema de reparo com agente de correção e agente crítico, ambos ReAct, supera abordagens de agente único?

## Método
- **Estudo empírico:** 2.734 posts no Stack Overflow, dos quais 665 foram anotados, mais 51 issues e 129 commits do GitHub e 85 posts nos fóruns HuggingFace. São 930 instâncias, ou 1.025 entradas, organizadas em 23 categorias de correção.
- **Benchmark AgentDefect:** 37 instâncias executáveis.
- **SelfHeal:** agente de correção e agente crítico, ambos ReAct, com regras de correção e busca na web, sem executar o código.
- **Backbones:** Gemini 3 Pro, Claude Sonnet 4 e GPT-5.2.
- **Baselines:** zero-shot (agente único) e SWE-Agent.

## Resultado relatado
Relato dos autores; Tabelas 1 e 2.
- **SelfHeal:** 22/37 com Gemini 3 Pro (0,5946), 21/37 com Claude Sonnet 4 e 20/37 com GPT-5.2.
- **Zero-shot:** Claude Sonnet 4 15/37, Gemini 3 Pro 13/37, GPT-5.2 12/37.
- **SWE-Agent com GPT-5.2:** 14/37.
- **Ablações com Gemini 3 Pro:**
  - Sem regras de correção: 15/37 (−18,92 pp).
  - Sem busca na web: 17/37 (−13,51 pp).
  - **Sem crítico: 19/37.** A diferença de 3 casos (≈8,1 pp) foi calculada por esta ficha; os autores dizem que o crítico barrou correções erradas em 3 instâncias.
- **Tentativas médias:** SelfHeal entre 1,05 e 1,35; SWE-Agent 3,78.

## Custo/compute considerado?
Sim, para o SelfHeal. Custo e tempo por segmento:
- Gemini 3 Pro: US$ 0,4442 e 322,72 s.
- Claude Sonnet 4: US$ 0,0759 e 43,40 s.
- GPT-5.2: US$ 0,0492 e 41,77 s.

Os autores notam que o melhor desempenho é também o mais caro. O custo dos baselines está só em uma figura (não lida). Tokens não reportados. Não há comparação com compute igualado entre agente único e par.

## Ameaças à validade
- Benchmark pequeno (37 instâncias) e restrito a LangChain e LlamaIndex.
- Sem execução em tempo de reparo nem avaliação em nível de repositório.
- Risco de vazamento mitigado por exclusão de fonte na busca.
- Os autores dizem que as médias "+21,72%" e "+16,21%" não têm cálculo explicado.

## Relevância para a pergunta central
É um micro-swarm de 2 agentes (correção + crítico). O segundo agente acrescenta 3/37 casos, enquanto o conhecimento injetado (regras de correção) acrescenta 7/37. Escolher o backbone muda o custo em cerca de 9× (Gemini vs GPT-5.2) para uma diferença de 2 casos. Isso sugere que conhecimento e ferramentas superam a cooperação como alavanca, e que o crítico funciona como verificador barato.

## Hipóteses candidatas (hipótese)
- candidata: em um micro-swarm de reparo, o papel de verificador acrescenta valor pequeno mas positivo; regras de domínio e recuperação valem mais que agentes adicionais.
- candidata: o custo por acerto é dominado pela escolha de modelo, não pelo número de agentes, em pares de 2 agentes.

## Verificação
- Aberto em 2026-11-07:
  - https://arxiv.org/abs/2604.17699 (somente a v1; comentário "Accepted at EASE 2026")
  - https://arxiv.org/html/2604.17699v1 (Tabelas 1–2, seções de custo, ameaças e dados)
- Lacunas:
  - A aceitação na EASE 2026 consta só no comentário do arXiv; os proceedings não foram abertos.
  - O custo dos baselines (Figura 4) não foi lido.
  - Licença do repositório não verificada.
