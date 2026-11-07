---
id: lit-correlated-errors
title: "Correlated Errors in Large Language Models (Kim, Garg, Peng & Garg, ICML 2025)"
area: literature
evidence: relato-autores
tags: [correlacao-de-erros, monocultura, diversidade, llm-as-judge, wisdom-of-crowds]
sources:
  - "Kim, E., Garg, A., Peng, K. & Garg, N. (2025). Correlated Errors in Large Language Models. ICML 2025 (aceito, conforme comentário arXiv). arXiv:2506.07962v1 (9 jun 2025). https://arxiv.org/abs/2506.07962v1 — HTML: https://arxiv.org/html/2506.07962v1"
related: [lit-great-models-think-alike, lit-hong-page-diversity, lit-silicon-crowd, lit-sintese]
updated: 2026-11-07
primary_opened: true
version: "v1 (2025-06-09; única versão listada)"
summary: Em mais de 350 LLMs, quando dois modelos erram eles escolhem a mesma resposta errada muito acima do acaso (≈60% no HELM), e modelos mais precisos erram de forma mais parecida — somar modelos diferentes não garante erros independentes.
---

## Pergunta
Os erros de LLMs distintos são independentes (premissa de qualquer ganho por agregação/votação) ou correlacionados? Que fatores (provedor, arquitetura, tamanho, acurácia) explicam a correlação, e quais as consequências para LLM-as-judge e para mercados (contratação) onde muitos usam LLMs?

## Método
- Três conjuntos (Sec. 3.1; App. A): HuggingFace Open LLM Leaderboard — 349 modelos (filtrados de 2.041) em 12.032 questões MMLU de múltipla escolha; HELM — 71 modelos em 14.042 questões; tarefa de triagem de currículos — 20 LLMs, 1.800 pares currículo-vaga (450 rotulados à mão).
- Métrica principal: taxa de concordância **condicionada a ambos errarem** (mesma alternativa errada), comparada ao baseline de escolha aleatória entre alternativas erradas.
- Regressão da concordância sobre mesmo provedor, mesma arquitetura base, tamanho e acurácia (Tabela 1).
- Estudos a jusante: LLM-as-judge (Sec. 4) e simulação de contratação/matching com teoria de monocultura algorítmica (Sec. 5).

## Resultado relatado
- Concordância quando ambos erram: média ≈0,6 no HELM (baseline aleatório ≈1/3) e 0,423 no HuggingFace (baseline 0,127) (Sec. 1, 3.2). 100% dos pares (HF) e 97,5% (HELM) ficam acima do baseline. Par extremo no HELM: google/text-unicorn@001 × writer/palmyra-x-v3 concordam em 0,9987 das questões em que ambos erram (Sec. 3.2).
- Mesmo provedor: +0,066 (HF) e +0,022 (HELM), significativos; não significativo em currículos (p=0,092). Mesma arquitetura base: +0,076 (HF) (Tabela 1).
- **Acurácia ↑ ⇒ correlação de erros ↑**: coeficientes positivos nos três conjuntos; termo de interação de acurácia significativo (HF 0,023; HELM 0,026; Resumes 0,043). R² = 0,340 (HF), 0,613 (HELM), 0,415 (Resumes) (Tabela 1; App. C). Modelos maiores e de tamanho semelhante também se correlacionam mais (Sec. 3.2).
- LLM-as-judge: juízes inflam a acurácia de modelos menos precisos (recompensam erros compartilhados) e subestimam modelos mais precisos; inflação maior para mesmo provedor/arquitetura (Sec. 4, Fig. 2).
- Contratação (Sec. 5): com p=0,25 e 20 firmas, ~20% dos candidatos ficam sistematicamente excluídos quando firmas usam LLMs aleatórios, contra ~0 com preferências aleatórias uniformes (Fig. 3). Um único LLM compartilhado dá o pior bem-estar às firmas (Fig. 4).
- Frase dos autores (Sec. 2): usar múltiplos modelos diferentes "is not a panacea".

## Custo/compute considerado?
Não. O paper não mede custo de inferência nem testa ensembles/votação diretamente; mede apenas a estrutura de correlação dos erros.

## Ameaças à validade
- Métrica trata todas as respostas erradas como equivalentes e ignora probabilidades (limitação declarada, Sec. 6).
- Só múltipla escolha e notas únicas de currículo; rótulos de adequação currículo-vaga são subjetivos.
- Leaderboards misturam fine-tunes do mesmo modelo base (inflando correlação “por construção” no HF).
- Simulação de mercado com 60 candidatos e 30 firmas.
- Não há experimento de agregação: a ligação “correlação ⇒ ganho menor de votação” é inferência, não teste.

## Relevância para a pergunta central
Fornece a variável que falta em muitos trabalhos de “mais agentes”: o ganho de votar/agregar N respostas depende da independência dos erros. Este paper mostra empiricamente que, entre LLMs, os erros são fortemente correlacionados e que a correlação **cresce com a capacidade** — justamente os modelos que se escolheria para um swarm de alta qualidade. Logo, ensembles de modelos fortes de provedores distintos podem render menos que a teoria de júri independente (Condorcet) sugere. Para Norevia: diversidade de provedor é uma alavanca fraca (+0,02 a +0,07 de concordância por mesmo provedor), e a correlação de base (0,42–0,6) domina.

## Hipóteses candidatas
- candidata: o ganho marginal de adicionar o k-ésimo agente votante satura mais cedo quanto maior a concordância-quando-erram (ρ) entre os agentes; ρ medido em uma amostra de calibração prevê o ponto de saturação.
- candidata: em tarefas de múltipla escolha/resposta fechada, um único modelo forte com raciocínio alto supera um ensemble de modelos fortes heterogêneos quando ρ > ~0,5 (limiar a estimar no Observatory).
- candidata: verificação por um juiz LLM do mesmo provedor/família do executor produz mais falso sucesso (FM-3.3 do MAST) do que juiz de família diferente ou verificador mecânico.

## Verificação
- Abertos em 2026-11-07: https://arxiv.org/abs/2506.07962 (metadados, v1, “Accepted to ICML 2025”) e https://arxiv.org/html/2506.07962v1 (até ~100k de 117k caracteres; o trecho final — apêndices tardios — não foi lido).
- Números acima conferidos no HTML v1 via extração; não houve reprodução local.
- Lacuna: página do PMLR (ICML 2025) não aberta; não confirmado se a versão de proceedings difere da v1.
