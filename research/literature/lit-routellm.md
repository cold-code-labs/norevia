---
id: lit-routellm
title: 'RouteLLM — roteador aprendido entre modelo forte e fraco'
area: literature
evidence: relato-autores
tags: [roteamento, custo, ativacao-adaptativa, preferencias-humanas]
sources:
  - "Ong, I., Almahairi, A., Wu, V., Chiang, W.-L., Wu, T., Gonzalez, J. E., Kadous, M. W. & Stoica, I. (2025). RouteLLM: Learning to Route LLMs from Preference Data. ICLR 2025. https://proceedings.iclr.cc/paper_files/paper/2025/hash/5503a7c69d48a2f86fc00b3dc09de686-Abstract-Conference.html"
  - "Preprint: arXiv:2406.18665v4 (23 fev. 2025), título 'RouteLLM: Learning to Route LLMs with Preference Data'. https://arxiv.org/abs/2406.18665v4 · doi:10.48550/arXiv.2406.18665"
related: [lit-frugalgpt, lit-nothinking]
updated: 2026-11-07
primary_opened: true
version: "v4 (23 fev. 2025); v1 26 jun. 2024"
summary: Um roteador barato treinado com preferências humanas decide antes da geração se a consulta vai ao GPT-4 ou ao Mixtral, cortando até ~3,7× as chamadas ao modelo forte no MT Bench, mas com ganhos pequenos em MMLU/GSM8K.
---

## Pergunta
Dá para prever, **antes** de gerar, se uma consulta precisa do modelo forte (caro) ou se o fraco basta, e assim reduzir custo mantendo qualidade?

## Método
Roteamento binário (forte = gpt-4-1106-preview; fraco = Mixtral-8x7B) com limiar sobre a probabilidade prevista de o forte vencer (Sec. 3–5). Quatro roteadores: similarity-weighted (SW) ranking, matrix factorization (MF), classificador BERT, classificador causal LLM (Sec. 4.2). Treino em preferências do Chatbot Arena + aumentos (≈1.500 amostras de validação do MMLU; ≈120 mil rótulos julgados por GPT-4, custo ≈US$ 700). Métricas (Sec. 3.2): PGR (fração do gap fraco→forte recuperada), APGR (média em 10 pontos de custo), CPT(x%) (mínima % de chamadas ao forte para atingir x% de PGR). Baseline: roteador aleatório.

## Resultado relatado
- MT Bench (Tabela 1): CPT(50%) aleatório 49,03% vs MF (Arena+Judge) 13,40%; APGR 0,802 (+60,4%). CPT(80%): 78,08% → 31,31%. Legenda: redução de custo "up to 75%" vs aleatório.
- MMLU (Tabela 2): CPT(50%) 50,07% → ~35,4% (Arena+Gold); só com Arena, roteadores ficam ≈ ou abaixo do aleatório.
- GSM8K (Tabela 3): CPT(50%) 50,00% → 33,64% (causal LLM, Arena+Judge); APGR 0,622.
- Economia vs aleatório (Tabela 6): MT Bench 3,66× (CPT50) / 2,49× (CPT80); MMLU 1,41× / 1,14×; GSM8K 1,49× / 1,27×.
- Transferência sem retreino (Tabela 4): Claude 3 Opus/Sonnet APGR 0,772; Llama 3.1 70B/8B APGR 0,767.
- Overhead (Tabela 7): MF US$ 3,32 por milhão de requisições; SW ranking ≤0,4% do custo de geração do GPT-4.

## Custo/compute considerado?
Sim: chamadas ao modelo forte como proxy de custo, mais custo/vazão do próprio roteador. Latência do roteador medida; custo de gerar rótulos (≈US$ 700) relatado.

## Ameaças à validade
Só dois modelos (roteamento multi-modelo é trabalho futuro, Sec. 6); rótulos de preferência esparsos (<0,1% por par); nenhum roteador é melhor em todos os benchmarks sem explicação clara; distribuição real de consultas pode diferir; ganhos dependem fortemente de dados em distribuição (MMLU-golden, GPT-4-judge). Venue: o arXiv não declara ICLR; o registro ICLR 2025 foi confirmado nos proceedings com título ligeiramente diferente ("from" vs "with").

## Relevância para a pergunta central
É a forma mais simples de "Adaptive Swarm Activation": decidir **quanto modelo** usar antes de gastar. Mostra que o ganho do roteamento depende do domínio (grande em chat aberto, pequeno em MMLU/GSM8K) e de dados de treino em distribuição. Não aborda N agentes nem reasoning effort, mas o desenho (roteador barato + limiar ajustável de custo) é diretamente transferível para escolher entre "1 agente / micro-swarm / reasoning alto".

## Hipóteses candidatas
- candidata: a vantagem de um roteador pré-geração sobre o aleatório cresce com a heterogeneidade de dificuldade das consultas e encolhe em benchmarks de dificuldade homogênea.
- candidata: roteadores pré-geração (sem ver a resposta) têm teto menor que cascatas pós-geração (com verificador), mas custo de decisão ~0; a escolha ótima depende do custo relativo da primeira tentativa.
- candidata: um roteador de "configuração" (1 agente vs N vs reasoning alto) exige rótulos de vitória por configuração — o Observatory Norevia pode produzi-los.

## Verificação
Aberto em 2026-11-07: https://arxiv.org/abs/2406.18665 (metadados), https://arxiv.org/html/2406.18665v4 (texto, tabelas 1–7), página de proceedings ICLR 2025 acima. Código não inspecionado.
