---
id: lit-bio-autonomic
title: "Bio-Autonomic — resiliência em multiagentes LLM via controle autonômico e detecção imune"
area: literature
evidence: lacuna
tags: [healing, imunidade, mape-k, gossip, confianca, resiliencia]
sources:
  - "Darabi, N.; Naik, D.; Tayebati, S.; Jayasuriya, D.; Trivedi, A. R. (2026). Resilience in Ambient Multi-Agent LLMs via Decentralized Bio-Autonomic Control and Immune-Inspired Anomaly Detection. Proceedings of the AAAI Conference on Artificial Intelligence 40(44):37332–37340. doi:10.1609/aaai.v40i44.41065. https://ojs.aaai.org/index.php/AAAI/article/view/41065"
related: [lit-mast, lit-selfheal]
updated: 2026-11-07
primary_opened: false
version: "AAAI-26, v40 n44, publicado online 2026-03-14 (Crossref); sem versão arXiv localizada"
summary: "Propõe controle autonômico MAPE-K e detecção imune (Dendritic Cell Algorithm) para resiliência de multiagentes LLM; o texto completo não abriu, e os números seguem não verificados."
---

## Pergunta
Uma arquitetura inspirada em sistemas autonômicos e imunes melhora a resiliência e a recuperação de ecossistemas de agentes LLM em ambientes de Ambient Intelligence diante de agentes falhos ou mensagens adulteradas?

## Método
Segundo o resumo, via Crossref e papers.cool.
- MAPE-K por agente: Monitor, Analyze, Plan e Execute sobre conhecimento compartilhado.
- Detecção de anomalias pelo Dendritic Cell Algorithm.
- Confiança probabilística entre agentes.
- Gossip descentralizado.
- Aprendizado federado com criptografia homomórfica.

O estudo anterior (herdado, não revalidado) relata testes com mensagens alteradas e agentes substituídos por comportamento falho, e a presença de servidor central na etapa federada.

## Resultado relatado
`lacuna`. O resumo diz apenas "resiliência e recuperação substancialmente melhores" que baselines multiagente de ponta, sem números. Nenhum número foi conferido.

## Custo/compute considerado?
`lacuna`: não verificável sem o texto completo.

## Ameaças à validade
- Não avaliáveis sem o texto.
- Pelo resumo, a arquitetura tem muitos componentes, o que dificulta atribuir o efeito a cada mecanismo.
- A afirmação de descentralização convive com um servidor central federado (herdado do estudo anterior).

## Relevância para a pergunta central
Indireta. Trata de resiliência e reparo (healing limitado), não do trade-off entre agente único e N agentes nem do custo. Útil como referência de separação entre escalas de tempo (reação local, reputação, adaptação lenta). Não informa quando cooperar.

## Hipóteses candidatas (hipótese)
- candidata: os mecanismos de detecção e isolamento têm custo fixo por agente; acima de certo N, a resiliência exige overhead que deve entrar na conta de custo do swarm.

## Verificação
- Tentado em 2026-11-07:
  - https://doi.org/10.1609/aaai.v40i44.41065 redireciona para o OJS.
  - O OJS (página do artigo e PDF 41065/45026) foi **bloqueado por anti-bot** (BotStopper/Anubis).
  - O repositório NSF PAR (par.nsf.gov/biblio/10676636) recusou a conexão.
- Conferido via Crossref (api.crossref.org): título, autores, volume 40, edição 44, páginas 37332–37340, data e DOI.
- papers.cool indica o "Special Track on AI Alignment" — fonte secundária, não confirmado.
- Lacunas: texto completo, números, custo e código. Para fechar, é preciso acesso pelo navegador (takeover) ao PDF da AAAI ou ao NSF PAR.
