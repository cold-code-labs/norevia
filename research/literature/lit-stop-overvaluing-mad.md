---
id: lit-stop-overvaluing-mad
title: "Stop Overvaluing Multi-Agent Debate (Zhang et al., 2025) — MAD raramente vence CoT/SC; heterogeneidade como antídoto"
area: literature
evidence: relato-autores
tags: [debate, self-consistency, chain-of-thought, heterogeneidade, eficiencia-de-tokens, avaliacao]
sources:
  - "Zhang, H., Cui, Z., Chen, J., Wang, X., Zhang, Q., Wang, Z., Wu, D. & Hu, S. (2025). Stop Overvaluing Multi-Agent Debate — We Must Rethink Evaluation and Embrace Model Heterogeneity. arXiv:2502.08788v3 (21 jun 2025). Position paper. https://arxiv.org/abs/2502.08788v3"
  - "Título da v1 (12 fev 2025): 'If Multi-Agent Debate is the Answer, What is the Question?' https://arxiv.org/abs/2502.08788v1"
related: [lit-debate-or-vote, lit-should-we-be-going-mad, lit-multiagent-debate-du, lit-self-moa]
updated: 2026-11-07
primary_opened: true
version: "v3 (2025-06-21); v1 2025-02-12, v2 2025-02-17"
summary: Em 36 cenários (4 modelos × 9 benchmarks), cinco métodos de debate vencem CoT em no máximo ~15–20% dos casos e usam tokens pior que self-consistency; misturar modelos melhora todos os debates, mas não o melhor modelo sozinho com CoT.
---

## Pergunta
Métodos de multi-agent debate (MAD) superam baselines simples de agente único (CoT, Self-Consistency) quando avaliados de forma sistemática e com orçamento de inferência comparável?

## Método
- 5 MAD: Society-of-Minds (SoM), Multi-Persona (MP), Exchange-of-Thoughts (EoT), ChatEval, AgentVerse — implementações abertas dos autores. Baselines: agente único (SA), CoT, Self-Consistency (SC).
- 9 benchmarks (0-shot): MMLU, MMLU-Pro, CommonsenseQA, ARC-Challenge, AGIEval, GSM8K, MATH, HumanEval, MBPP (Tabela 1).
- 4 modelos: gpt-4o-mini-2024-07-18, claude-3-5-haiku-20241022, Llama3.1-8B-instruct, Llama3.1-70B-instruct; T=1, top-p=1 (Seção 3.1).
- Orçamento pareado em **6 chamadas de LLM** por questão (rodadas ajustadas); 3 repetições com desvio-padrão; ANOVA (α=0,05) para vitória/empate/derrota vs CoT.
- Heter-MAD (Seção 4): cada geração sorteia o modelo (GPT-4o-mini ou Llama3.1-70B, p=0,5).

## Resultado relatado
- Nenhum MAD tem taxa de vitória > 20% contra CoT nos 36 cenários (Seção 1); SoM, EoT, ChatEval e AgentVerse vencem CoT em ~15% dos casos; MP não vence de forma significativa (Fig. 2, Seção 3.2).
- GPT-4o-mini (Tabela 3): SoM fica abaixo de CoT nos 9 conjuntos; ChatEval e AgentVerse vencem CoT em 1 de 9. Exemplo: MMLU CoT 80,73 / SC 82,13 / SoM 74,73 / MP 75,47; MATH CoT 72,87 / SC 73,96 / SoM 75,40 / MP 51,87.
- SC é, na maioria dos casos aplicáveis, o melhor método (programação excluída para SC).
- MAD vence o agente único sem CoT (SA) em 34 de 45 condições com GPT-4o-mini — o que reproduz os papers originais, cuja baseline era fraca.
- Hiperparâmetros (Fig. 3; GSM8K, MMLU, HumanEval): aumentar rodadas (2→4) ou agentes (3→9) "does not significantly change the outcomes"; exceção: EoT em GSM8K melhora continuamente e passa CoT com 9 agentes.
- Eficiência de tokens (Fig. 6, Apêndice D): SC usa bem o orçamento extra; MAD ou não escala com mais tokens ou fica abaixo de SC com tokens comparáveis.
- Por que perde (Fig. 4): MP, ChatEval e AgentVerse corrigem muitos erros mas **revertem muitas respostas corretas**; SoM e EoT são conservadores e corrigem pouco.
- Heter-MAD (Tabela 4, médias de 9 conjuntos): SoM-Heter 76,7 vs SoM-GPT 74,3 e SoM-Llama 69,9 (+6,4% sobre a média dos dois); EoT-Heter 75,7 (+8,2%); AgentVerse-Heter 74,0 (+2,7%). Contra "CoT-Average" (72,5) os ganhos chegam a +5,8%.

## Custo/compute considerado?
Sim — orçamento pareado por nº de chamadas (6) e análise de acurácia × tokens consumidos contra SC com nº crescente de amostras. Sem custo em US$.

## Ameaças à validade
- Position paper; código em link anônimo (não inspecionado).
- **A comparação de Heter-MAD é com a média de dois modelos**, não com o melhor. Cálculo nosso a partir das Tabelas 3 e 7: CoT de GPT-4o-mini sozinho tem média 77,0 e CoT de Llama3.1-70B 68,0 (média 72,5, igual ao "CoT-Average" do paper). Logo SoM-Heter (76,7) **não supera** o melhor modelo sozinho com CoT (77,0) com 6 chamadas contra 1. Heter-MAD também não é comparado com SC.
- Modelos não-reasoning; parte dos efeitos pode mudar com reasoning models.
- Seleção de 5 métodos e implementação dos autores originais pode herdar bugs.

## Relevância para a pergunta central
Evidência ampla (36 cenários) de que, **com compute igual, cooperação por debate perde para "mais raciocínio/amostras do mesmo agente"** (CoT/SC) na maioria das tarefas de QA e código. O mecanismo de perda (reversão de respostas corretas) dá uma variável medível para Norevia: taxa de correção vs. taxa de dano por rodada. A heterogeneidade ajuda os debates, mas a tensão com lit-self-moa permanece: o ganho parece vir de puxar o modelo fraco para perto do forte.

## Hipóteses candidatas
- candidata: o valor líquido de uma rodada de cooperação = P(corrigir errado) − P(estragar certo); protocolos agressivos têm ambos altos, conservadores ambos baixos — o ótimo depende da acurácia inicial.
- candidata: a vantagem multiagente aparece mais em matemática (passos verificáveis) do que em conhecimento geral e programação sem execução.
- candidata: a heterogeneidade vale como redução de custo (misturar modelo barato e caro), não como aumento de teto.

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2502.08788 (v3), https://arxiv.org/abs/2502.08788v1 (título original); HTML v1–v3 sem corpo (erros de build); **PDF v3 baixado e extraído localmente** com script próprio — tabelas e texto citados vêm dele.
- Lacuna: Figs. 2, 3, 4, 6 lidas só pelo texto que as descreve (sem valores); Tabela 8 (Claude-3.5-haiku) não transcrita; sem venue revisado por pares identificado.
