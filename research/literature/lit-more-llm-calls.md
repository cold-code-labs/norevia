---
id: lit-more-llm-calls
title: Are More LLM Calls All You Need? — escala não monotônica de sistemas compostos
area: literature
evidence: relato-autores
tags: [lei-de-escala, nao-monotonicidade, dificuldade, voto-majoritario, numero-otimo-de-chamadas]
sources:
  - "Chen, L., Davis, J. Q., Hanin, B., Bailis, P., Stoica, I., Zaharia, M. & Zou, J. (2024). Are More LLM Calls All You Need? Towards Scaling Laws of Compound Inference Systems. arXiv:2403.02419v2. https://arxiv.org/abs/2403.02419v2"
related: [lit-more-agents, lit-self-consistency, lit-snell-test-time-compute]
updated: 2026-11-07
primary_opened: true
version: "v2 (4 jun. 2024); v1 4 mar. 2024"
summary: Mais chamadas e voto ajudam consultas fáceis e prejudicam as difíceis, de modo que a acurácia total pode subir e depois cair; o número ótimo de chamadas pode ser previsto a partir de poucas amostras.
---

## Pergunta
Como o desempenho de sistemas compostos de "voto" escala com o número K de chamadas ao LLM? Existe um K ótimo previsível?

## Método
Dois sistemas: Vote (K respostas e voto majoritário) e Filter-Vote (um filtro LLM descarta candidatas antes do voto). Modelo: GPT-3.5-turbo-0125, temperatura 0,1. Datasets: MMLU Physics (151), TruthfulQA (817), GPQA diamond (198) e AVERITEC (500). Foram 400 gerações por questão, reamostradas com reposição para cada K e médias sobre 1.000 execuções (App. D). Teoria: dificuldade d(x) = max_{a≠y} P[a] − P[y]; a questão é "difícil" se d(x) > 0, isto é, a resposta errada mais provável é mais frequente que a correta.

## Resultado relatado
- Escala não monotônica (Fig. 1, Sec. 5): no MMLU Physics, o Vote sobe e depois cai com K, enquanto o Filter-Vote cai e depois sobe. No AVERITEC, os dois sobem e depois caem entre K=2 e K=1.000 (Fig. 4a).
- Mecanismo: o voto leva a acurácia de cada questão a 1 (fácil) ou a 0 (difícil). O agregado depende da mistura α de questões fáceis.
- Teorema 2 (caso sintético com dois níveis, p1 > 1/2 fácil, p2 < 1/2 difícil): se p1 + p2 > 1 e α < 1 − 1/t, a curva é um "U invertido"; se p1 + p2 < 1 e α > 1 − 1/t, é um "U".
- Teorema 4: há fórmula fechada para K*. Exemplos da Tabela 2: (α=0,4; p1=0,85; p2=0,4) dá K*=3; (α=0,6; p1=0,65; p2=0,4) dá K*=30. O K* analítico bate com o ótimo empírico nos 15 cenários sintéticos.
- Modelo ajustável: G(K,x) = exp(−c1·K − c2·√K + c3) para questões difíceis e 1 − exp(−c1·K − c2·√K + c3) para as fáceis. Ajustado com K=1–5 e usado para prever K=1–100 no caso sintético, o MSE fica entre cerca de 1e-6 e 1e-4 (Fig. 6). No AVERITEC há "alta correlação", sem erro numérico informado.

## Custo/compute considerado?
Não. Os autores dizem que custo e latência não são analisados (Sec. 6). O "compute" é medido só pelo número de chamadas.

## Ameaças à validade
- Um modelo, temperatura baixa (0,1) e tarefas objetivas.
- Só dois desenhos compostos (Vote e Filter-Vote).
- Teoria exata só para |A|=2; supõe acurácia por questão convergindo para 0 ou 1.
- Estimar a dificuldade sem consultar o LM fica em aberto (App. B).
- O pico real de K nos datasets só aparece em figura.

## Relevância para a pergunta central
É a demonstração mais limpa de que mais agentes podem piorar. O voto amplifica o viés quando o erro dominante é sistemático (erros correlacionados entre amostras). Dá um modelo analítico de K ótimo em função da mistura de dificuldades, que é uma forma primitiva da "função de ganho marginal" que a Norevia procura.

## Hipóteses candidatas
- candidata: o ganho de expandir satura ou inverte quando o erro dominante é correlacionado entre agentes; o voto amplifica o modo de erro majoritário.
- candidata: o N ótimo depende da fração de tarefas fáceis no lote; uma política por item (rotear só as fáceis-mas-ruidosas ao voto) domina um N global.
- candidata: poucas chamadas (K ≤ 5) bastam para estimar a curva de ganho de um lote, viabilizando ajuste autônomo de N com custo pequeno.

## Verificação
Abertos em 2026-11-07: https://arxiv.org/abs/2403.02419 (v2; sem venue no arXiv) e https://arxiv.org/html/2403.02419v2. Números extraídos por leitor automático, sem conferência manual. Publicação em conferência não verificada (lacuna). Picos de K nos datasets reais não estão em texto (lacuna).
