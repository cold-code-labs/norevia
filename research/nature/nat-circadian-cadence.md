---
id: nat-circadian-cadence
title: Relógios circadianos — hierarquia de osciladores e "horários de pico"
area: nature
evidence: fenomeno-natural
tags: [cadencia, multiplas-escalas-de-tempo, manutencao, agendamento]
sources:
  - "Mohawk, J. A., Green, C. B. & Takahashi, J. S. (2012). Central and peripheral circadian clocks in mammals. Annu. Rev. Neurosci. 35:445–462. doi:10.1146/annurev-neuro-060909-153128"
  - "Zhang, R., Lahens, N. F., Ballance, H. I., Hughes, M. E. & Hogenesch, J. B. (2014). A circadian gene expression atlas in mammals: implications for biology and medicine. PNAS 111(45):16219–16224. doi:10.1073/pnas.1408886111"
related: [nat-orbital-resonance, nat-homeostasis-allostasis, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumos lidos (OpenAlex)."
summary: Em 12 órgãos de camundongo, 43% dos genes codificadores de proteína oscilam em algum lugar do corpo, de forma específica por órgão e concentrada em "horários de pico" antes do amanhecer e do anoitecer.
---

## Mecanismo
- **Hierarquia (Mohawk et al. 2012):** osciladores nos níveis celular, tecidual e sistêmico com o **mesmo mecanismo molecular** autônomo; no núcleo supraquiasmático (SCN), uma população **acoplada** de osciladores neuronais atua como **marca-passo mestre**; o acoplamento dá robustez ao SCN, que dá estabilidade à arquitetura temporal do organismo. Na maioria das células, os relógios estão entrelaçados com vias metabólicas.
- **Atlas (Zhang et al. 2014):** transcriptomas de **12 órgãos** ao longo do tempo; **43%** dos genes codificadores de proteína mostraram ritmo circadiano de transcrição **em algum lugar** do corpo, em grande parte **específico do órgão**. Na maioria dos órgãos, picos concentrados em **"rush hours" antes do amanhecer e do anoitecer**. Mais de 1.000 ncRNAs oscilantes.

## Evidência
`fenomeno-natural`.

## Análogo de engenharia
Escalas de tempo distintas por função (evento, diário, semanal), com **um relógio de referência** e execução **local** (cada componente decide o que fazer na sua janela). Os "horários de pico" sugerem **agrupar** atividades de manutenção em janelas antecipatórias, em vez de distribuí-las uniformemente ou fazer polling contínuo. Só uma fração das funções precisa de ritmo; o resto é dirigido por evento.

## Hipótese testável
- **Variável:** manutenção — (A) polling contínuo de verificação de estado; (B) janelas agrupadas (batch) com gatilho por evento para urgências.
- **Métrica:** custo de manutenção por problema útil encontrado; latência de detecção de problemas urgentes; interferência com trabalho de usuário (contenção).
- **Previsão:** B reduz custo por problema útil ≥ 60% com latência de urgências igual (porque urgências são por evento) e menor contenção.
- **Refutação:** se problemas relevantes surgirem só detectáveis por polling (latência de B pior > 2× para não urgentes críticos) ou se as janelas concentrarem contenção.

## Limites da transferência
Ritmos biológicos seguem o ciclo dia/noite imposto pelo ambiente; carga de agentes segue usuários e fusos. Não implica que LLMs "dormem". Ver ressalvas do estudo anterior, seção 14.
