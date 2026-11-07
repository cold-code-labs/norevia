---
id: lit-rethinking-bounds-discussion
title: "Rethinking the Bounds of LLM Reasoning (Wang et al., ACL 2024) — agente único com prompt forte ≈ discussão"
area: literature
evidence: relato-autores
tags: [debate, discussao, agente-unico, prompting, demonstracoes, heterogeneidade]
sources:
  - "Wang, Q., Wang, Z., Su, Y., Tong, H. & Song, Y. (2024). Rethinking the Bounds of LLM Reasoning: Are Multi-Agent Discussions the Key? Proceedings of the 62nd Annual Meeting of the ACL (Volume 1: Long Papers), pp. 6106–6131, Bangkok. doi:10.18653/v1/2024.acl-long.331. https://aclanthology.org/2024.acl-long.331"
  - "arXiv:2402.18272v1 (28 fev 2024), versão única. https://arxiv.org/abs/2402.18272v1"
related: [lit-multiagent-debate-du, lit-stop-overvaluing-mad, lit-should-we-be-going-mad]
updated: 2026-11-07
primary_opened: true
version: "arXiv v1 (2024-02-28); ACL 2024"
summary: Com demonstrações no prompt, um agente único (ChatGPT-3.5) iguala ou supera discussões multiagente; a discussão só ajuda sem demonstrações ou quando mistura modelos de força diferente.
---

## Pergunta
A melhora atribuída à discussão multiagente persiste quando o agente único recebe um prompt forte (descrição detalhada + demonstrações)?

## Método
- Modelos: ChatGPT-3.5 (gpt-35-turbo 0613, Azure), Gemini Pro, Bard (chat-bison-001); temperatura 0,25 no CMD (§4.1).
- Dados (§4.2): ECQA (100 amostras de teste), GSM8K (100), FOLIO-wiki (460).
- Frameworks: Debate (Du et al.; 3 e 6 agentes, 3 rodadas), MAD (Liang et al.; 2 debatedores + juiz, até 3 rodadas), ReConcile (multi-LLM), e o proposto CMD (Conquer-and-Merge: 6 agentes em 2 grupos, até 3 rodadas, secretário desempata).
- Condições: "Direct" (sem demonstração) vs. "Demo" (com demonstrações).

## Resultado relatado
Tabela 2 (ChatGPT-3.5; Direct / Demo):

| Método | ECQA | GSM8K | FOLIO | Média |
|---|---|---|---|---|
| Agente único | 63 / 67 | 69 / 83 | 70,22 / 76,09 | 67,41 / **75,63** |
| MAD (3) | 55 / 58 | 74 / 78 | 61,25 / 74,13 | 63,42 / 70,04 |
| Debate (3) | 67 / 65 | 78 / 81 | 70,00 / 75,65 | **71,67** / 73,88 |
| Debate (6) | 65 / 64 | 74 / 78 | 69,13 / 74,78 | 69,38 / 72,26 |
| CMD (6) | 64 / 63 | 75 / 83 | 73,26 / 77,39 | 70,75 / 74,46 |

- Com demonstrações, o agente único (75,63) supera todos os métodos de discussão na média; sem demonstrações, Debate (3) ganha +4,26 pp e CMD +3,34 pp na média, Debate (6) +1,97 pp, enquanto MAD perde −3,99 pp (diferenças calculadas por nós a partir da Tabela 2).
- Debate com 6 agentes é pior que com 3 em ambas as condições (69,38 vs 71,67; 72,26 vs 73,88).
- Multi-LLM (Tabela 3, médias Direct / Demo): Gemini Pro sozinho 74,38 / 78,59; CMD com os 3 modelos 76,93 / 78,66; ReConcile 76,11 / 78,36. Com demonstrações, a mistura praticamente empata com o melhor modelo sozinho.
- Mecanismos de erro (§5.3, §6.2): erro do juiz (sobretudo em empates) e **propagação de resposta errada** — agentes abandonam resposta inicial correta por consenso errado; os autores a chamam de erro mais comum, sem contagens. O modelo mais forte puxa os mais fracos ao longo das rodadas (Fig. 5).

## Custo/compute considerado?
Só qualitativamente: mais agentes aumentam tokens de entrada (cada um lê mais pontos de vista), pressionando o contexto; motivação do desenho em grupos do CMD (Apêndice B.1). Não há contagem de tokens nem custo em US$; as amostras pequenas são justificadas por "computational and financial constraints" (§10).

## Ameaças à validade
- n=100 em ECQA e GSM8K: diferenças de 1–4 pp estão dentro do ruído amostral.
- A baseline de agente único "forte" foi calibrada pelos próprios autores (crítica de lit-stop-overvaluing-mad).
- Modelos de 2023–24, sem reasoning models.
- Comparação sem igualar compute; o agente único usa muito menos chamadas — o que fortalece a conclusão de custo, mas não a mede.

## Relevância para a pergunta central
Evidência direta de que **parte do ganho multiagente substitui informação faltante no prompt**: quando o contexto (demonstrações) é bom, um agente basta. Para Norevia: antes de ativar swarm, investir em contexto/prompt do agente único pode capturar o mesmo ganho a uma fração do custo. A mistura de modelos ajuda sobretudo quando eleva os fracos ao nível do forte — não supera claramente o forte sozinho.

## Hipóteses candidatas
- candidata: o ganho marginal da cooperação diminui conforme a qualidade do contexto do agente único aumenta (cooperação como substituto de contexto).
- candidata: acima de ~3 agentes, discussão homogênea perde por ruído/propagação de erro (6 < 3 agentes aqui).
- candidata: em mistura heterogênea, o teto é o melhor membro; o valor está em economizar quando o forte é caro, não em superar o forte.

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2402.18272 (v1 única); https://ar5iv.labs.arxiv.org/html/2402.18272 (texto completo, tabelas); https://aclanthology.org/2024.acl-long.331 (venue, páginas, DOI).
- PDF direto não pôde ser lido pela ferramenta; tabelas lidas no ar5iv (v1). Tabela 1 (ablação no FOLIO) veio truncada — não citada.
- Lacuna: contagens de propagação de erro e valores da Fig. 5 não estão no texto.
