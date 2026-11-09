---
pivot: keep
pivot_reason: "Direct integrity/resilience candidate; full text unavailable in existing card, so no efficacy claim is publishable."
id: lit-bio-autonomic
title: "Bio-Autonomic — resilience in LLM multi-agent systems via autonomic control and immune detection"
area: literature
evidence: gap
tags: [healing, immunity, mape-k, gossip, trust, resilience]
sources:
  - "Darabi, N.; Naik, D.; Tayebati, S.; Jayasuriya, D.; Trivedi, A. R. (2026). Resilience in Ambient Multi-Agent LLMs via Decentralized Bio-Autonomic Control and Immune-Inspired Anomaly Detection. Proceedings of the AAAI Conference on Artificial Intelligence 40(44):37332–37340. doi:10.1609/aaai.v40i44.41065. https://ojs.aaai.org/index.php/AAAI/article/view/41065"
related: [lit-mast, lit-selfheal]
updated: 2026-11-07
primary_opened: false
version: "AAAI-26, v40 n44, published online 2026-03-14 (Crossref); no arXiv version located"
summary: "Proposes MAPE-K autonomic control and immune detection (Dendritic Cell Algorithm) for LLM multi-agent resilience; the full text did not open, and the numbers remain unverified."
---

## Question
Does an architecture inspired by autonomic and immune systems improve the resilience and recovery of LLM agent ecosystems in Ambient Intelligence environments in the face of faulty agents or tampered messages?

## Method
According to the abstract, via Crossref and papers.cool.
- Per-agent MAPE-K: Monitor, Analyze, Plan and Execute over shared knowledge.
- Anomaly detection via the Dendritic Cell Algorithm.
- Probabilistic trust between agents.
- Decentralized gossip.
- Federated learning with homomorphic encryption.

The earlier study (inherited, not revalidated) reports tests with altered messages and agents replaced by faulty behavior, and the presence of a central server in the federated stage.

## Reported result
`gap`. The abstract only says "substantially better resilience and recovery" than state-of-the-art multi-agent baselines, without numbers. No number was checked.

## Cost/compute considered?
`gap`: not verifiable without the full text.

## Threats to validity
- Not assessable without the text.
- From the abstract, the architecture has many components, which makes it hard to attribute the effect to each mechanism.
- The decentralization claim coexists with a central federated server (inherited from the earlier study).

## Relevance to the central question
Indirect. It deals with resilience and repair (limited healing), not with the trade-off between a single agent and N agents nor with cost. Useful as a reference for separating timescales (local reaction, reputation, slow adaptation). It does not inform when to cooperate.

## Candidate hypotheses (hypothesis)
- candidate: detection and isolation mechanisms have a fixed per-agent cost; above a certain N, resilience requires overhead that must enter the swarm's cost accounting.

## Verification
- Attempted on 2026-11-07:
  - https://doi.org/10.1609/aaai.v40i44.41065 redirects to OJS.
  - OJS (article page and PDF 41065/45026) was **blocked by anti-bot** (BotStopper/Anubis).
  - The NSF PAR repository (par.nsf.gov/biblio/10676636) refused the connection.
- Checked via Crossref (api.crossref.org): title, authors, volume 40, issue 44, pages 37332–37340, date and DOI.
- papers.cool indicates the "Special Track on AI Alignment" — secondary source, not confirmed.
- Gaps: full text, numbers, cost and code. To close them, browser access (takeover) to the AAAI PDF or to NSF PAR is needed.
