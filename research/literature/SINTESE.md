---
id: lit-sintese
title: 'Síntese da literatura — quando N agentes LLM superam 1 agente com mais raciocínio, e a que custo'
area: literature
evidence: relato-autores
tags: [sintese, escalonamento, debate, roteamento, correlacao-de-erros, test-time-compute, lacuna-de-novidade]
sources:
  - "39 trabalhos fichados em research/literature/lit-*.md (fonte primária aberta) + 1 lacuna (lit-bio-autonomic); referências completas em research/literature/BIBLIOGRAFIA.md"
related: [lit-scaling-agent-systems, lit-sas-equal-thinking-budget, lit-stop-overvaluing-mad, lit-debate-or-vote, lit-pareto-test-time-multiagent, lit-snell-test-time-compute, lit-debate-routing-matched-ceiling, lit-correlated-errors, lit-large-language-monkeys, lit-sas-vs-mas-hybrid]
updated: 2026-11-07
summary: 'Com compute igualado, um agente único bem configurado costuma empatar ou vencer N agentes. A cooperação compensa em faixas estreitas: tarefas decomponíveis, agente individual fraco, contexto degradado e erros pouco correlacionados. Leis de escala e roteadores para isso já existem. A lacuna está na política conjunta e online de raciocínio × agentes × verificação, com custo por resultado aceito.'
---

# Síntese da literatura (Norevia, 2026-11-07)

**Natureza deste documento.** Os números abaixo são *relato dos autores*, conferidos nas fontes primárias pelos agentes de literatura. Nenhum foi reproduzido localmente. As frases marcadas **[hipótese]** são nossas: são propostas de teste, não resultados. A busca **não foi sistemática** (não seguiu o padrão PRISMA). Foram cerca de 40 trabalhos escolhidos por relevância à pergunta central, então "ninguém fez X" significa apenas "não encontramos X nesta busca".

Nos números, "pp" significa pontos percentuais.

## 1. O que a literatura já responde

### 1.1 Com compute igualado, a linha de base de agente único é forte, e muitas vezes vence
- **Debate perde para CoT ou self-consistency (SC) na maioria dos casos.**
  - Em 36 cenários (4 modelos × 9 benchmarks), nenhum dos cinco métodos de debate testados vence CoT em mais de 20% dos casos. SC usa tokens melhor que todos eles ([lit-stop-overvaluing-mad]).
  - Separando o debate em voto e interação, o voto majoritário de 5 agentes supera todas as variantes de debate. Com Qwen2.5-7B, o voto dá 0,7691 e o melhor debate 0,7377. O debate sozinho é um *martingale*: não aumenta a correção esperada ([lit-debate-or-vote]).
  - Em MedQA, SC atinge 0,63 por US$ 25,47 e Society of Mind atinge 0,64 por US$ 48,63 ([lit-should-we-be-going-mad]). Ressalva: os cabeçalhos dessa tabela foram reconstruídos pelo agente que a leu.
- **Agente único com prompt forte empata com discussão.** Com demonstrações no prompt, um agente único faz 75,63 de média contra 74,46 do melhor método de discussão. Debate com 6 agentes rende menos que com 3 ([lit-rethinking-bounds-discussion]).
- **Com o mesmo orçamento de *thinking tokens*, o agente único vence a partir de cerca de 500 tokens.** Com 1k tokens, o agente único faz 0,418 e o debate 0,388. O multiagente (MAS) só vence com orçamento mínimo (100 tokens: 0,370 contra 0,290) ou quando o contexto do agente único está degradado. Os MAS também gastam muito mais tokens reais: no Qwen3/FRAMES com teto de 10k, o Ensemble gastou 5.571 tokens e o agente único 1.307 ([lit-sas-equal-thinking-budget]).
- **Eficiência por token.** Em 260 configurações, o agente único rende 67,7 sucessos por 1K tokens. As arquiteturas multiagente ficam entre 13,6 e 42,4 ([lit-scaling-agent-systems]).
- **A vantagem antiga do debate não igualava compute.** Du et al. relatam 85,0 para o debate, 81,0 para o voto e 77,0 para o agente único no GSM8K ([lit-multiagent-debate-du]). Esse ganho não igualava o compute e não se sustentou nos estudos posteriores citados acima.

### 1.2 O ganho da cooperação encolhe quando o agente individual fica forte
- **Acima de cerca de 45% de acerto do agente único, adicionar agentes rende menos ou piora** (β = −0,236, p = 0,004). Na mesma escala, o resultado relativo ao agente único vai de +80,8% (Finance-Agent, orquestração central) a −70% (PlanCraft) ([lit-scaling-agent-systems]).
- **Com modelos mais fortes, a vantagem do MAS cai.** MetaGPT/HumanEval passa de +10,7 para +3,0 pp e MathDebate/GSM8K de +9 para +0,8. Cerca de 80% dos exemplos são empates ([lit-sas-vs-mas-hybrid]).
- **O ganho relativo de amostrar e votar é maior em modelos fracos.** No MATH, foi +200% com Llama2-13B e +34% com GPT-3.5 ([lit-more-agents]).
- **A economia do early stopping acompanha a capacidade do modelo.** Com GPT-4, o número de amostras caiu 80,1% no GSM8K e 33,8% no MATH ([lit-early-stopping-sc]).

### 1.3 O ganho satura em N pequeno e pode até se inverter
- **Self-consistency satura rápido.** No AQuA com UL2-20B: 19,7 com 1 caminho, 24,9 com 5 e 26,9 com 40 ([lit-self-consistency]).
- **Pontos de saturação relatados:**
  - MacNet satura por volta de 16 nós. O voto estabiliza perto de 8 agentes, e os tokens crescem 7,51× de 1 para 16 agentes ([lit-macnet]).
  - SwarmSys tem pico em 14 agentes: 77,3 com 14 e 76,5 com 32 ([lit-swarmsys]).
  - Com compute pareado, SC satura em cerca de 10 amostras e o debate em cerca de 4 agentes ([lit-pareto-test-time-multiagent]).
  - No AgentPrune, passar de 5 para 9 agentes rende pouco ([lit-agentprune]).
- **A curva pode ser não monotônica.** O voto melhora as questões "fáceis" e piora as "difíceis", então a curva pode subir e depois cair. Uma fórmula prevê o número ótimo de chamadas a partir de poucas amostras ([lit-more-llm-calls]).

### 1.4 A dificuldade da tarefa governa a melhor forma de gastar
- **Alocar test-time compute por dificuldade iguala o best-of-N com até cerca de 4× menos compute.**
  - Com FLOPs iguais, o compute de inferência vence um modelo cerca de 14× maior só em questões fáceis e médias.
  - Nas difíceis, vence o modelo maior.
  - O custo de estimar a dificuldade não é contabilizado ([lit-snell-test-time-compute]).
- **Compute extra rende mais em itens difíceis.** Com 15–20× o compute de CoT, os itens fáceis ganham +2,2 pp e os difíceis +9,0 pp. Um Llama 8B escalado não alcança o 70B com CoT simples ([lit-pareto-test-time-multiagent]).

### 1.5 A verificação é o gargalo, não a geração
- **Gerar a resposta certa não basta; é preciso selecioná-la.** No MATH, a coverage (fração de problemas em que alguma amostra acerta) chega a 98,44% com 10.000 amostras. Já o voto e o reward model ficam em cerca de 41% e estabilizam perto de 100 amostras. No SWE-bench Lite, o acerto vai de 15,9% para 56% com 250 amostras, porque os testes funcionam como verificador ([lit-large-language-monkeys]).
- **Paralelo curto vence raciocínio longo quando há verificador.** No MiniF2F, NoThinking faz 36,38 contra 34,84, com latência 6,47× menor ([lit-nothinking]). A busca com verificador de passos escalou melhor que a extensão sequencial ([lit-s1-budget-forcing]).
- **Cascatas economizam quando há um sinal de aceite aprendido.** FrugalGPT, usando um verificador DistilBERT, manteve a acurácia com 98,3% menos custo no HEADLINES ([lit-frugalgpt]).
- **Falhas de verificação e de encerramento dominam os MAS.**
  - Em 1.642 execuções de 7 frameworks, a taxa de falha vai de 41% a 86,7%.
  - Por modo de falha: não reconhecer quando parar 12,4%, encerramento prematuro 6,2%, verificação ausente 8,2% e verificação incorreta 9,1% ([lit-mast]).

### 1.6 Erros correlacionados limitam o "wisdom of crowds" entre LLMs
- **Quando dois LLMs erram, costumam escolher a mesma resposta errada.** A taxa é cerca de 0,6 no HELM (o acaso daria cerca de 1/3) e 0,423 no HuggingFace (acaso 0,127). Modelos mais precisos erram de forma mais parecida. Ser do mesmo provedor acrescenta só +0,022 a +0,066 ([lit-correlated-errors]).
- **A semelhança entre modelos cresce com a capacidade e contamina a supervisão.** O juiz LLM favorece modelos parecidos com ele ([lit-great-models-think-alike]).
- **O viés compartilhado aparece até em previsões.** O ensemble de 12 LLMs empata com 925 humanos (Brier 0,20 contra 0,19), mas tem viés coletivo para o "sim": 57,35% de previsão média contra 45% de resolução positiva ([lit-silicon-crowd]).
- **Qualidade pesa mais que diversidade.** Agregar 6 amostras do melhor modelo (Self-MoA) faz 65,7 no AlpacaEval, contra 59,1 da mistura de modelos diferentes ([lit-self-moa]). No MoA original, porém, a diversidade ajuda com o mesmo número de propositores: 61,3 contra 56,7 ([lit-mixture-of-agents]).
- **Diversidade de *abordagem* (prompts) pode render muito com verificador.** Com GPT-4 em Graph Coloring, DIV-SE faz 97,0 contra 23,0 de SC ([lit-diversity-of-thought]). Mas não ajuda quando falta capacidade de base.
- **Evidências mais fracas:** o debate heterogêneo de [lit-diverse-debate-hegazy] e o modelo abstrato clássico de [lit-hong-page-diversity] (10 agentes aleatórios fazem 94,53 contra 92,56 dos 10 melhores).

### 1.7 Mais raciocínio individual também satura, e às vezes piora
- **A primeira solução já costuma estar certa.** Ela está correta em mais de 92% dos casos. Reduzir tokens de 2408 para 1331 no MATH500 deixou a acurácia praticamente igual (93,0 → 92,8) ([lit-overthinking]).
- **Budget forcing tem retorno limitado.** Forçar mais raciocínio leva o AIME24 de 50% para 57%, e o ganho estabiliza em cerca de 6 extensões ([lit-s1-budget-forcing]).
- **Há escala inversa em algumas tarefas.** No Misleading Math, o R1 cai de 70% para 30% com mais raciocínio ([lit-inverse-scaling-ttc]).
- **A ideia de parar adaptativamente é antiga e frágil quanto ao custo por passo** ([lit-adaptive-computation-time]).

### 1.8 Onde a cooperação comprovadamente agrega, segundo os autores
- **Tarefas decomponíveis com orquestrador central.** Finance-Agent chega a +80,8%. A coordenação central contém a amplificação de erros: 4,4× contra 17,2× em agentes independentes ([lit-scaling-agent-systems]).
- **Crítico ou validador separado em reparo de código.** SelfHeal (corretor + crítico) resolve 22 de 37 bugs, contra 13 do mesmo modelo sem o framework (zero-shot). O crítico sozinho acrescenta só 3 casos; as regras de correção pesam mais ([lit-selfheal]).
- **Estruturas bem parametrizadas ficam na fronteira de Pareto.** Com compute pareado, o MoA de modelo único supera SC em +2,7 pp e o debate em +1,3 pp ([lit-pareto-test-time-multiagent]). Essas diferenças ficam dentro do IC de ±2,8–3,0 pp.
- **Ganho com muito mais latência.** No GAIA Level 1, o GPTSwarm sobe de 25,66 para 30,56, mas o tempo vai de cerca de 71 s para 415 s ([lit-gptswarm]).
- **Memória de trajetórias rende mais que agentes extras.** No AgentNet, a memória acumulada rende 7–10 pontos, enquanto passar de 3 para 9 agentes rende 0,8 ([lit-agentnet]).

### 1.9 Roteamento e parada adaptativa funcionam, com limites conhecidos
- **RouteLLM economiza muito em conversa e pouco em raciocínio.** A economia é de 3,66× no MT Bench, mas só 1,41× no MMLU e 1,49× no GSM8K ([lit-routellm]).
- **Adaptive-Consistency** usa em média 3,2× menos amostras, com variação de acurácia de −0,07 ponto ([lit-adaptive-consistency]).
- **Cascata entre agente único e MAS.** Rodar o agente único primeiro e escalar para MAS só quando ele falha gasta 1.056 tokens no GSM8K, contra 8.837 do MAS (cerca de 88% menos) ([lit-sas-vs-mas-hybrid]).
- **Limite duro: sinais baratos de consenso não detectam quando o debate é necessário.**
  - Um oráculo que escolhesse o melhor protocolo por exemplo ganharia cerca de 14 pp no MuSiQue.
  - A entropia do voto recupera só 11–19% desse ganho, porque 66% dos casos em que o debate ajuda têm voto **unânime e errado** ([lit-debate-routing-matched-ceiling]).

## 2. Contradições e tensões

1. **MAS na fronteira de Pareto ou não?**
   - A favor: [lit-pareto-test-time-multiagent] coloca MoA e debate na fronteira.
   - Contra: [lit-stop-overvaluing-mad], [lit-debate-or-vote] e [lit-sas-equal-thinking-budget] concluem o oposto.
   - Diferenças de método que explicam parte da divergência:
     - Contabilidade de compute: FLOPs com memória, número de chamadas ou thinking tokens.
     - Modelos sem raciocínio estendido (Llama 3.1) contra modelos de reasoning (Qwen3, R1-distill, Gemini 2.5).
     - Tamanho de efeito (1–3 pp) dentro do IC.
   - **Conclusão provisória:** o sinal do efeito depende da métrica de custo e do tipo de modelo. Qualquer experimento da Norevia precisa fixar essas duas escolhas e relatá-las.
2. **Diversidade ajuda?** MoA diz que sim (61,3 contra 56,7). Self-MoA diz que qualidade domina (65,7 contra 59,1). A correlação de erros cresce com a capacidade ([lit-correlated-errors]). Leitura conciliadora **[hipótese]**: a diversidade só agrega quando não custa qualidade individual e quando reduz a correlação de *erros*, não só a de estilo.
3. **Ganho do voto e dificuldade.**
   - [lit-more-agents] mostra o ganho subindo e depois caindo com a dificuldade.
   - [lit-more-llm-calls] mostra o voto piorando nas questões difíceis.
   - As duas definem "difícil" de formas diferentes. Pela lógica do teorema do júri de Condorcet, o voto ajuda quando cada item é acertado com probabilidade acima de 0,5 e atrapalha abaixo disso. Essa leitura é nossa e não foi testada.
4. **Test-time compute contra modelo maior.** [lit-snell-test-time-compute] diz que mais compute de inferência substitui um modelo 14× maior em questões fáceis e médias. [lit-pareto-test-time-multiagent] diz que um 8B escalado não alcança o 70B. As duas coisas são compatíveis se o MMLU-Pro for "difícil" para o 8B; não há conflito direto, mas falta um mapa comum de dificuldade.
5. **Inconsistências internas** nos próprios papers (registradas nos cartões):
   - AgentPrune: Tabela 1 e custo do GPTSwarm no MMLU.
   - MoA: 65,8 no texto contra 65,1 na tabela.
   - Snell: "mais de 4×" contra "até 4×".
   - Overthinking: −48,6% atribuído ao dataset errado.
   - FrugalGPT, Silicon Crowd e Gao et al.: faixas do resumo que não conseguimos encontrar nas tabelas.

## 3. Lacuna de novidade para a Norevia, com honestidade sobre o que já foi feito

**Já existe, e a Norevia não deve alegar como novo:**
- **Lei preditiva de quando MAS ajuda.** [lit-scaling-agent-systems] modela o desempenho de agentes em função da capacidade, da coordenação e de propriedades da tarefa, com um limiar de saturação por volta de 45%. O R² de validação cruzada é só 0,37–0,41. É o trabalho mais próximo da "lei da eficiência coletiva" do documento norteador.
- **Lei do número ótimo de chamadas** para voto e filtragem ([lit-more-llm-calls]). **Lei de escala colaborativa** em função do número de nós ([lit-macnet]).
- **Alocação compute-optimal de test-time compute por dificuldade** para um agente ([lit-snell-test-time-compute]).
- **Roteadores e cascatas:**
  - entre modelos: [lit-frugalgpt], [lit-routellm];
  - entre agente único e MAS: [lit-sas-vs-mas-hybrid];
  - entre protocolos (direto, voto, debate) com teto de tokens igualado: [lit-debate-routing-matched-ceiling].
- **Parada adaptativa:** [lit-adaptive-computation-time], [lit-adaptive-consistency], [lit-early-stopping-sc].
- **Comparação de agente único contra MAS com o mesmo orçamento de thinking:** [lit-sas-equal-thinking-budget].

**O que parece em aberto nesta busca** (oportunidade, não originalidade comprovada):
1. **Política conjunta e online.** Os trabalhos otimizam um eixo por vez:
   - Snell: busca contra revisão, num só modelo.
   - Tran & Kiela: orçamento de thinking contra MAS, de forma estática.
   - Kim et al.: escolha de arquitetura, por previsão estática.
   - Gao et al. e Hu et al.: roteamento discreto.

   Não encontramos uma política que escolha *ao mesmo tempo* esforço de raciocínio × número de agentes × topologia × verificação, por tarefa, expandindo e contraindo *durante* a execução. Também não encontramos uma que contabilize o custo do próprio controlador.
2. **Custo por resultado *aceito* como métrica principal.** Quase tudo mede acurácia contra um gabarito. Poucos trabalhos tratam aceite verificável realista: testes executáveis, falso sucesso e encerramento prematuro. MAST mostra que essas falhas dominam; os testes do SWE-bench em Monkeys mostram o valor de um verificador.
3. **Estimador barato de ganho marginal.** Hu et al. mostram que sinais de consenso preveem *segurança*, não *necessidade*. Esse é o problema duro e o ponto onde a Norevia pode contribuir ou falhar. Sinais candidatos fora do consenso: execução de testes, verificadores externos, conflito com ferramentas.
4. **Correlação de erros como variável de decisão.** Ela foi medida ([lit-correlated-errors]), mas não encontramos uma política que decida expandir ou não o swarm a partir de uma estimativa online de ρ (a correlação entre os erros dos agentes).
5. **Domínio e modelos atuais.** A evidência está concentrada em QA e matemática, com modelos de 2023–2025. Há pouca evidência controlada em tarefas agênticas de código com várias etapas, modelos de reasoning e preços reais. Exceções parciais: [lit-scaling-agent-systems], [lit-selfheal], [lit-large-language-monkeys].

## 4. Implicações para o Observatory

Estas são propostas de desenho; nada foi implantado.
- **Controles mínimos para qualquer braço multiagente:**
  - agente único com o mesmo orçamento *real* de tokens (o orçamento nominal subestima o MAS, segundo [lit-sas-equal-thinking-budget]);
  - SC ou voto com o mesmo número de chamadas ([lit-more-agents], [lit-debate-or-vote]);
  - agente único com prompt forte ([lit-rethinking-bounds-discussion]).
- **Relatar** resultados por faixa de dificuldade e com IC. Registrar tokens reais, latência, custo por aceite, taxa de "unânime e errado" e taxa de reversão de respostas corretas.
- **Separar** o ganho de geração (coverage) do ganho de seleção e verificação ([lit-large-language-monkeys]).

## 5. Hipóteses candidatas consolidadas (para o agente de teoria registrar como H-xx)

Todas são **[hipótese]**:
- **candidata 1 — saturação por capacidade e correlação:** o ganho marginal de adicionar o agente *k+1* cai com a acurácia individual e com a correlação de erros ρ. Abaixo do limiar a cooperação vale; acima de ~45% (Kim et al.) ou com ρ alto, ela não compensa.
- **candidata 2 — verificador:** com verificador barato e confiável, a amostragem paralela curta domina o raciocínio sequencial longo. Sem verificador, um agente com mais raciocínio, até a saturação, domina N agentes que votam.
- **candidata 3 — decomponibilidade:** o MAS só compensa o custo em tarefas decomponíveis (subtarefas paralelizáveis com pouco acoplamento) ou quando o contexto de um agente único se degrada. Em tarefas sequenciais, ele perde.
- **candidata 4 — sinal de ativação:** a concordância entre agentes prevê quando expandir é seguro, não quando é necessário. Um controlador útil precisa de sinais fora do consenso.
- **candidata 5 — cascata:** "agente único → verificação → micro-swarm só se falhar" domina um MAS fixo em custo por aceite. O ganho depende da taxa de falso aceite do verificador.
- **candidata 6 — memória:** memória de trajetórias validadas rende mais por custo do que adicionar agentes (AgentNet).

## 6. Limites desta síntese
- Busca não sistemática.
- **Leitura dos textos:** a maioria foi lida com um leitor automático sobre o HTML do arXiv, sem conferir célula a célula no PDF. Alguns PDFs foram extraídos localmente.
- **Bio-Autonomic sem verificação:** o texto não abriu, e o cartão está marcado como `lacuna`.
- **Venues não confirmados:**
  - Snell, Monkeys, Chen et al., Gao et al., Kim et al. (2512.08296), Tran & Kiela e NoThinking: o arXiv não declara venue.
  - MAST: trilha da NeurIPS não confirmada.
  - SelfHeal: aceite no EASE não confirmado.
- **Versões publicadas não comparadas** (TMLR, Science Advances): números dos cartões do FrugalGPT e do Silicon Crowd vêm das versões arXiv.
- **Críticas a Hong & Page** (Thompson 2014) não foram abertas.
- **Trabalhos de 2025–2026 identificados mas não fichados** sobre alocação de compute entre perguntas: arXiv 2509.09864, 2506.12721, 2604.14853, 2605.26849 e um trabalho chamado DIPA. Os IDs foram vistos em busca e não verificados.
- **Nada foi reproduzido localmente.**
