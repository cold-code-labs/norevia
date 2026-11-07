---
id: nat-reflex-vs-cortex
title: Reflexo espinal, reflexo transcortical e resposta voluntária — camadas de latência
area: nature
evidence: fenomeno-natural
tags: [roteamento-por-camadas, latencia, reflexo, effort, ativacao-adaptativa]
sources:
  - "Kurtzer, I. L. (2015). Long-latency reflexes account for limb biomechanics through several supraspinal pathways. Front. Integr. Neurosci. 8:99. doi:10.3389/fnint.2014.00099"
  - "Pruszynski, J. A., Kurtzer, I., Nashed, J. Y., Omrani, M., Brouwer, B. & Scott, S. H. (2011). Primary motor cortex underlies multi-joint integration for fast feedback control. Nature 478:387–390. doi:10.1038/nature10436 (PMC4974074)"
  - "Pruszynski, J. A. & Scott, S. H. (2012). Optimal feedback control and the long-latency stretch response. Exp. Brain Res. 218:341–359. doi:10.1007/s00221-012-3041-8"
  - "Estudo anterior (só leitura): ESTUDO-SWARMS-BIOINSPIRADOS-2026-11-07.txt rev. 2, seção 11 (fonte NIH NBK20367, acesso parcial)."
related: [nat-speed-accuracy-quorum, nat-homeostasis-allostasis, lit-routellm, lit-frugalgpt, lit-adaptive-computation-time, oss-plexil, nat-candidatas]
updated: 2026-11-07
verificacao: "Kurtzer 2015: página Frontiers lida (citações abaixo). Pruszynski 2011: texto do manuscrito (PMC4974074, via E-utilities). Pruszynski & Scott 2012: resumo (Europe PMC)."
summary: O braço corrige perturbações em três camadas — espinal (20–45 ms), transcortical (50–100 ms) e voluntária (>100 ms) — e a camada intermediária já é quase tão sofisticada quanto a voluntária.
---

## Mecanismo
- **Três épocas após deslocamento súbito do membro (Kurtzer 2015):** reflexo de curta latência (SLR) **20–45 ms**, gerado inteiramente por circuitos espinais; reflexo de longa latência (LLR) **50–100 ms**; reações voluntárias com atraso **> 100 ms**.
- **A camada intermediária é sofisticada (Pruszynski et al. 2011):** neurônios do córtex motor primário (M1) de macacos integram movimento de ombro e cotovelo em comandos que contrapõem o torque real **em ~50 ms**; em humanos, respostas do ombro **~50 ms** após deslocamento só do cotovelo são potencializadas por TMS (ligação causal com M1). A integração aparece em M1 **8–20 ms antes** que nos músculos. Conclusão dos autores: processamento transcortical permite que respostas de feedback tenham sofisticação que **rivaliza com o controle voluntário**.
- Revisão (Pruszynski & Scott 2012): sob controle ótimo por realimentação, o LLR e o controle voluntário compartilham circuitos (incluindo M1).
- Limites das épocas não são rígidos (respostas voluntárias podem invadir a janela do LLR em tarefas simples — nota da busca, não conferida no original).

## Evidência
`fenomeno-natural` (neurofisiologia humana e de primatas).

## Análogo de engenharia
Não é "reflexo burro vs cérebro caro", e sim **três camadas com custo e latência crescentes**: (1) checagem determinística por código (estado, critérios de aceite, CI pendente) — ms, custo ~0; (2) modelo rápido/effort baixo com contexto mínimo, capaz de integrar 2–3 sinais; (3) agente com effort alto ou micro-swarm. A lição de Pruszynski: a camada 2 pode resolver muito mais do que se supõe — o escalonamento para 3 deve ser exceção.

## Hipótese testável
- **Variável:** roteamento — (A) sempre camada 3; (B) 1 → 3; (C) 1 → 2 → 3 com escalonamento por falha de verificação.
- **Métrica:** custo por tarefa aceita; latência p50/p95; aceite por faixa de dificuldade; taxa de escalonamento desnecessário.
- **Previsão:** C reduz custo ≥ 50% e latência p50 ≥ 60% vs A num conjunto com ≥ 50% de tarefas fáceis, com aceite total ≥ A − 1 p.p.; a camada 2 resolve ≥ 60% do que não é resolvido pela 1.
- **Refutação:** se o escalonamento falhar silenciosamente (camada 2 marca sucesso falso) e o aceite de C cair > 2 p.p., ou se a camada 2 resolver < 30% — a camada intermediária não se paga.

## Limites da transferência
O sistema nervoso tem caminhos paralelos que rodam simultaneamente; um roteador de LLM geralmente executa camadas em série, somando latências. Reflexos nunca "decidem" que terminaram uma tarefa; checagens determinísticas só conhecem critérios registrados (ver estudo anterior, seção 11).
