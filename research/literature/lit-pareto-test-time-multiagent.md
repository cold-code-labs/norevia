---
id: lit-pareto-test-time-multiagent
title: "Multi-Agent Reasoning Improves Compute Efficiency (Wunderlich et al., ACL 2026 SRW) — fronteira de Pareto com compute pareado"
area: literature
evidence: relato-autores
tags: [test-time-compute, pareto, mixture-of-agents, debate, self-consistency, dificuldade, roteamento]
sources:
  - "Wunderlich, F. V., Kaesberg, L. B., Wahle, J. P., Ruas, T. & Gipp, B. (2026). Multi-Agent Reasoning Improves Compute Efficiency: Pareto-Optimal Test-Time Scaling. Proceedings of the 64th Annual Meeting of the ACL (Volume 4: Student Research Workshop), pp. 1–14, San Diego. doi:10.18653/v1/2026.acl-srw.1. https://aclanthology.org/2026.acl-srw.1/"
  - "Código declarado: https://github.com/Multi-Agent-LLMs/lm-evaluation-harness (não inspecionado)"
related: [lit-mixture-of-agents, lit-self-moa, lit-debate-or-vote, lit-stop-overvaluing-mad]
updated: 2026-11-07
primary_opened: true
version: "ACL 2026 SRW (julho 2026), PDF da ACL Anthology"
summary: Com compute pareado (FLOPs + transferência de memória), MoA de modelo único e debate superam self-consistency em 2,7 e 1,3 pp no MMLU-Pro; o ganho de compute extra é maior em tarefas difíceis e um modelo maior com CoT vence um menor muito escalado.
---

## Pergunta
Sob orçamento de compute igual, sistemas multiagente (debate, MoA) são mais eficientes que métodos de agente único (self-consistency, self-refinement)? Como parametrizá-los?

## Método
- 4 pipelines: self-consistency (SC), self-refinement, debate (variante com voto majoritário), MoA em **configuração de proponente único** (mesmo LLM em todos os papéis — ou seja, próximo de Self-MoA).
- Llama 3.1 70B (principal) e 8B; MMLU-Pro (amostra de 1.000 questões) e BBH para robustez; zero-shot, T=0,7, top-p 0,95.
- 34 configurações, >100 avaliações; custo estimado teoricamente em tempo por tarefa considerando FLOPs **e** transferência de memória (Tabela 4, Apêndice B).
- Fronteira de Pareto acurácia × compute; análise por dificuldade (taxa de acerto de CoT em 20 amostras: fácil >75%, médio 25–75%, difícil <25%).

## Resultado relatado
- MMLU-Pro, até ~20× o compute de CoT (Seção 4.1): CoT 64,3%; melhor SC 68,7% (10 amostras); melhor debate 70,0% (4 agentes, 2 rodadas); melhor MoA 71,4% (5 modelos, 4 camadas). Com compute comparável, debate +1,3 pp e MoA +2,7 pp sobre SC (o texto da Introdução diz +1,4 para debate).
- Self-refinement fica **abaixo de CoT** apesar de mais compute.
- Saturação: SC satura em ~10 amostras e debate em ~4 agentes; MoA melhora quase linearmente até 5 modelos/4 camadas.
- Debate (Fig. 3): acurácia sobe até 4 agentes e cai com mais; mais rodadas pioram com 2 agentes e não ajudam com mais — "priorizar agentes sobre rodadas"; melhor debate sempre com 2 rodadas.
- MoA (Fig. 4): ótimo de Pareto quando nº de propositores = nº de camadas + 1 (3/2, 4/3, 5/4).
- Dificuldade (Tabela 1): ganho de 15–20× CoT sobre CoT — fácil +2,2 (94,4→96,6), médio +8,5 (53,0→61,5), difícil +9,0 (8,4→17,4).
- Tamanho do modelo (Seção 4.4): nenhuma configuração do 8B passa de 53% no MMLU-Pro, abaixo do CoT do 70B (64,3%); com o mesmo compute do CoT-70B, o melhor 8B fica ~13% abaixo.
- Papéis (Tabela 2): MoA 5×4 — 70B/70B 71,4; propositores 70B + agregador 8B 69,6; propositores 8B + agregador 70B 52,9; 8B/8B 51,2. Propositores importam mais que o agregador. Misturar 8B e 70B como propositores piora (3×70B+2×8B = 67,5% vs 3×70B sozinhos 70,1%).
- Conclusão: ~5× CoT captura a maior parte do ganho; abaixo de ~3× CoT, SC é a opção viável.

## Custo/compute considerado?
Sim — é o núcleo do paper: compute pareado em tempo teórico (FLOPs + memória), não em nº de chamadas. Não mede custo real de API nem latência medida.

## Ameaças à validade
- IC de 95% de ±2,8–3,0 pp por ponto (n=1.000; seção Limitations) — maior que as diferenças de 1,3 e 2,7 pp entre métodos; os autores apelam à consistência de padrões.
- Só modelos não-reasoning (Llama 3.1); limitação declarada.
- Compute teórico pode divergir do runtime real (batching, frameworks).
- Workshop de estudantes (SRW), não trilha principal.
- Possível efeito da quantização maior no 8B (declarado).

## Relevância para a pergunta central
**Contraponto importante** a lit-debate-or-vote e lit-stop-overvaluing-mad: com compute pareado de forma mais fina e estruturas bem parametrizadas, multiagente (especialmente MoA de modelo único) fica na fronteira de Pareto — mas o ganho sobre SC é pequeno (1–3 pp, dentro do IC) e o **tamanho do modelo domina** (8B escalado não alcança 70B com CoT). Também dá evidência direta para Adaptive Swarm Activation: tarefas fáceis ganham +2,2 pp com 15–20× compute; difíceis, +9,0.

## Hipóteses candidatas
- candidata: a escolha do modelo base é a alavanca de 1ª ordem; topologia multiagente é de 2ª ordem (≤3 pp).
- candidata: o ganho marginal de compute extra cresce com a dificuldade da tarefa — um roteador por dificuldade poupa a maior parte do custo em tarefas fáceis.
- candidata: topologias sem acúmulo de contexto (MoA) escalam melhor que topologias com memória acumulada (debate).
- candidata: proporção ótima de paralelismo/profundidade ≈ (camadas + 1) propositores.

## Verificação
- Abertos em 2026-11-07: https://aclanthology.org/2026.acl-srw.1/ (metadados, DOI); PDF https://aclanthology.org/2026.acl-srw.1.pdf baixado e extraído localmente (Seções 1–5, Tabelas 1–2, Limitations).
- Lacuna: não há versão arXiv aberta por nós (um site de terceiros citou arXiv 2605.01566 — **não verificado**); Figs. 2–7 lidas só pelo texto; código não inspecionado.
