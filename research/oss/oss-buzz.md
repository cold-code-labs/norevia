---
id: oss-buzz
title: Buzz — VM e linguagem para enxames de robôs com swarms dinâmicos, vizinhança situada e stigmergy virtual
area: oss
evidence: implementacao-observada
tags: [robotica-de-enxame, stigmergy-virtual, gossip, membership-dinamica, last-writer-wins, fila-de-mensagens, c]
sources:
  - "https://github.com/buzz-lang/Buzz/tree/49ea418d2c3177355d1e993ac58bd5862b39232e (commit inspecionado, clone raso em 2026-11-07)"
  - "https://github.com/MISTLab/Buzz (resolve para o mesmo commit 49ea418d2c3177355d1e993ac58bd5862b39232e, conferido pelo orquestrador)"
  - "Pinciroli, C.; Beltrame, G. Buzz: An Extensible Programming Language for Self-Organizing Heterogeneous Robot Swarms. arXiv:1507.05946 (2015; versão não registrada). https://arxiv.org/abs/1507.05946"
related: [oss-stigmergic, oss-plexil, oss-selfheal, oss-agentprune, oss-matriz, oss-padroes]
updated: 2026-11-07
summary: Buzz implementa em C uma VM por robô com swarms de pertencimento dinâmico, vizinhança reconstruída a cada passo e stigmergy virtual last-writer-wins por chave, propagada por gossip com coalescência de mensagens; não tem critério de término de tarefa, aceite nem benchmark de custo.
---

## Identificação
- URL: https://github.com/buzz-lang/Buzz (o espelho `MISTLab/Buzz` aponta para o mesmo commit).
- SHA completo: `49ea418d2c3177355d1e993ac58bd5862b39232e`; data do commit: 2026-04-01T16:45:09-04:00 (`git log -1 --format=%cI`).
- Licença: `LICENSE.txt` traz "Copyright (c) 2015 Carlo Pinciroli" seguido do texto permissivo no formato MIT/Expat ("Permission is hereby granted, free of charge…"). O arquivo **não usa o nome "MIT"**, e o `README.md` não declara licença: a única ocorrência de "MIT" é "MIT Technology Review" (`README.md:L61`). O rótulo "MIT declarado" do estudo anterior é, portanto, uma classificação do texto, não uma declaração do repositório.
- Escopo efetivamente lido: `LICENSE.txt`; `README.md`; `TODO`; `doc/concepts/basics.md` (trechos L20–L45); `doc/api.md` (seções swarm, stigmergy e neighbors, L886–L1015); `src/buzz/buzzvstig.h` e `buzzvstig.c` (inteiros); `src/buzz/buzzvm.c:L1-L30, L236-L505, L553-L557` (processamento de mensagens); `src/buzz/buzzoutmsg.c` (inteiro); `src/buzz/buzzinmsg.c` (inteiro); `src/buzz/buzzswarm.c:L205-L617`; `src/buzz/buzzneighbors.c:L29-L170`; `src/buzz/buzzrun.c:L60-L133`; `src/buzz/argos/buzz_controller.cpp:L538-L580, L740-L870`; `src/testing/teststigmergy.bzz:L1-L40`. Não li parser, assembler, heap/GC nem os demais controladores ARGoS.

## Mecanismo
Buzz não é sistema multiagente de LLM: é uma linguagem com VM (BVM) em C, e **cada robô executa a mesma bytecode** (**[docs]** `doc/concepts/basics.md:L23`). A execução avança por *steps* — sensores, mensagens recebidas, trecho do script, envio e atuação — e o tamanho do step fica a cargo do integrador (**[docs]** `doc/concepts/basics.md:L27`).

1. **Topologia de comunicação.** Comunicação situada, descrita como "gossip-based" (**[docs]** `doc/concepts/basics.md:L30`). **[código]** A tabela `neighbors` é zerada e reconstruída a cada step a partir dos pacotes efetivamente recebidos, com distância, azimute e elevação (`src/buzz/buzzneighbors.c:L67-L131`; a integração ARGoS chama `buzzneighbors_reset` e `buzzneighbors_add` em `src/buzz/argos/buzz_controller.cpp:L758-L772`). O núcleo da VM não define alcance: a restrição topológica vem do sensor/rádio do hospedeiro (no ARGoS, o range-and-bearing). Os tipos de mensagem se propagam de forma diferente:
   - `neighbors.broadcast` é de **um salto**. O receptor chama o listener e não reenfileira a mensagem (`src/buzz/buzzvm.c:L251-L274`).
   - A stigmergy virtual é **multi-salto**: cada robô que aceita um PUT mais novo o reenfileira para os vizinhos (`src/buzz/buzzvm.c:L300-L305`).
   - Uma QUERY sobre stigmergy desconhecida é repassada adiante (`src/buzz/buzzvm.c:L363-L367`).
2. **Quem decide quem age.** **[código]** Cada robô decide por si. `swarm.select(cond)` grava o pertencimento a partir de uma condição local (`src/buzz/buzzswarm.c:L450-L476`), e `swarm.exec(f)` só executa a closure se o robô for membro (`src/buzz/buzzswarm.c:L481-L518`). As operações `union`/`intersection`/`difference` montam swarms derivados a partir do pertencimento local (`src/buzz/buzzswarm.c:L554-L614`). Não há coordenador nem alocação central.
3. **Critério de término.** **[código]** O único término é o do programa: `buzzrun` executa `buzzvm_step` enquanto o estado for `READY` e informa `DONE` ou erro (`src/buzz/buzzrun.c:L96-L126`). No ARGoS, `step()` é chamado a cada tick; um erro interrompe a execução daquele robô (`src/buzz/argos/buzz_controller.cpp:L546-L560`). Não existe critério de convergência ou de tarefa concluída; isso fica com o script do usuário. Também não há limite de instruções por step: a chamada `buzzvm_function_call(..., "step", 0)` roda até retornar (`buzz_controller.cpp:L549`).
4. **Verificação/aceite mecânico.** Não encontrado no código inspecionado (busca: `accept`, `verify`, `check` em `src/buzz/*.c`). Existe resolução determinística de conflitos na stigmergy (item 6), mas isso é consistência de dados, não aceite de resultado.
5. **Controle de custo/orçamento técnico.**
   - **[código, integração ARGoS]** Por step, cada robô envia **um único pacote** do tamanho do atuador range-and-bearing (`m_pcRABA->GetSize()`). As mensagens saem da fila até o buffer encher; o que não cabe permanece na fila para o próximo step. Mensagem maior que o buffer é **descartada** com log "Discarded oversize message" (`src/buzz/argos/buzz_controller.cpp:L803-L838`). Isso é um teto de banda que o código aplica.
   - **[código, núcleo]** As filas de saída (`src/buzz/buzzoutmsg.c:L96-L111`) e de entrada (`src/buzz/buzzinmsg.c:L20-L34`) são arrays dinâmicos **sem capacidade máxima**.
   - A ordem de envio segue prioridade fixa: BROADCAST > SWARM_LIST > VSTIG_PUT > VSTIG_QUERY > SWARM_JOIN > SWARM_LEAVE (`src/buzz/buzzoutmsg.c:L365-L441`).
   - **[docs]** O próprio `TODO` registra "bandwidth is limited and volatile" como problema em aberto (`TODO`, item "Information aggregation is an issue").
6. **Memória.**
   - **[código]** A stigmergy virtual é um dicionário chave→(dado, timestamp `uint16_t`, robô) (`src/buzz/buzzvstig.h:L14-L31`), sem capacidade nem evicção. Só sai uma entrada quando alguém faz `put(k, nil)`, que também propaga um tombstone com timestamp+1 (`src/buzz/buzzvstig.c:L222-L233`).
   - A consistência é **last-writer-wins por chave**:
     - `put` incrementa o contador da chave (`buzzvstig.c:L214-L220`);
     - o receptor aceita se o timestamp remoto for maior (`buzzvm.c:L300-L306`);
     - com timestamps iguais e robôs diferentes, chama `onconflict` do usuário ou o default "maior id de robô vence", preferindo o valor não-nil (`buzzvstig.c:L590-L608`);
     - o perdedor recebe `onconflictlost` (`buzzvm.c:L319-L329`).
   - O header chama o timestamp de "Lamport clock" (`buzzvstig.h:L17`), mas o código funciona como contador de versão por chave, não como relógio lógico global. **[docs]** `doc/api.md:L950` chama a estrutura de CRDT. **[hipótese]** O `uint16_t` pode dar a volta após 65535 escritas na mesma chave, e a comparação `<` em `buzzvm.c:L301` não trata esse caso. Não testado.
   - **[código]** O conhecimento sobre o pertencimento dos **outros** robôs tem envelhecimento explícito: cada entrada ganha +1 de idade por step e é removida acima de `MEMBERSHIP_AGE_MAX = 50` (`src/buzz/buzzswarm.c:L209-L248`, chamado em `buzzvm.c:L484-L485`). A vizinhança é recriada a cada step (item 1).
7. **Falhas/retry.**
   - **[código]** Não há ACK nem retransmissão. Mensagem malformada gera warning e é descartada (`src/buzz/buzzvm.c:L280-L283, L292-L296, L437-L450`).
   - A recuperação vem de dois mecanismos de reparo implícito:
     - (a) `get(k)` emite QUERY com o valor local. Um vizinho com versão mais nova responde com PUT, e um vizinho com versão mais velha se atualiza (`buzzvstig.c:L445-L483`; `buzzvm.c:L386-L398`). Na prática, é anti-entropia disparada por leitura.
     - (b) A lista de swarms do robô é retransmitida a cada `SWARM_BROADCAST_PERIOD = 10` steps (`buzzvm.c:L21, L491-L500`): soft state que compensa JOIN/LEAVE perdidos e combina com o envelhecimento de 50 steps.
   - Um erro na VM encerra a execução daquele robô, sem reinício automático (`buzz_controller.cpp:L549-L559`).
   - **[código]** O desenfileiramento de entrada tira a **última** mensagem do primeiro remetente encontrado na tabela hash (`buzzinmsg.c:L48-L64`), ou seja, LIFO por remetente. As consequências não foram avaliadas.
8. **Poda de comunicação.** **[código]**
   - Coalescência na fila de saída: para cada (stigmergy, chave) só a mensagem mais nova fica na fila; a mais antiga é removida (`src/buzz/buzzoutmsg.c:L337-L359`).
   - JOIN/LEAVE do mesmo swarm se cancelam e se deduplicam, e são absorvidos por uma SWARM_LIST pendente (`buzzoutmsg.c:L182-L306`).
   - PUT recebido com versão igual ou mais velha é ignorado e não é repassado (`buzzvm.c:L337-L341, L426-L430`), o que contém a inundação.
   - Broadcast não é repassado (item 1).
9. **Elástico vs fixo.** **[código]** O pertencimento a swarms muda em tempo de execução por condição local (`join`/`leave`/`select`, `src/buzz/buzzswarm.c:L377-L476`) e a vizinhança muda a cada step. **[docs]** `doc/api.md:L921` documenta `unselect`, que **não** está registrado na tabela de métodos (`buzzswarm.c:L257-L262`). `doc/api.md:L971-L972` descreve `onconflict`/`onconflictlost` com texto copiado de `create` (divergência entre docs e código).
10. **Benchmark custo vs qualidade.** Ausente no repositório. Há scripts de teste `.bzz` (ex.: **[teste]** `src/testing/teststigmergy.bzz:L11-L40`, que exercita `onconflict`) e um unit test C++ de tipos (`src/testing/unittest/buzztype_test.cpp`, não lido). Nada foi executado.

## Evidência
- **Implementação observada:** stigmergy LWW com tie-break por id e callbacks; propagação multi-salto com coalescência; swarms dinâmicos com soft state e envelhecimento (50 steps, rebroadcast a cada 10); teto de bytes por step na integração ARGoS; ausência de capacidade nas filas do núcleo.
- **Relato dos autores/docs:** "gossip-based" (`basics.md:L30`); "CRDT" (`api.md:L950`); auto-organização por runtime "purely distributed" (`README.md`); publicações listadas no README sem números de desempenho no repositório.
- **Lacunas:** sem benchmark nem medição de banda; não li o paper (arXiv 1507.05946, versão não registrada) nesta rodada; o comportamento após wrap do timestamp e o efeito do LIFO na entrada não foram verificados.
- Nenhum código foi executado ou compilado; nenhum benchmark reproduzido.

## Análogo de engenharia
**Hipótese de engenharia; a semântica robótica não se transfere automaticamente para LLMs.** Para o Swarm Efficiency Observatory (1 agente forte vs N agentes em tarefas verificáveis, com custo por tarefa aceita), três mecanismos do Buzz são candidatos:
- (i) **teto de banda por rodada com fila e descarte de mensagens grandes demais**, como orçamento de tokens trocados entre agentes por rodada;
- (ii) **coalescência por chave**, em que só a versão mais nova de um fato vai para o canal e reduz mensagens redundantes;
- (iii) **soft state com envelhecimento**, que permite pertencimento a subgrupos sem coordenador e corrige perdas por retransmissão periódica.

O LWW com tie-break por id é barato, mas descarta silenciosamente trabalho concorrente. Em LLMs, um "conflito perdido" pode ser justamente a resposta correta, então o tie-break deveria consultar o verificador, não o id.

## Hipótese testável
1. **Hipótese:** num quadro compartilhado entre N agentes LLM, coalescer escritas por chave (só a versão mais recente circula) reduz tokens trocados por tarefa aceita em ≥30% sem reduzir a taxa de aceite em mais de 2 p.p. frente ao broadcast integral. Métricas: tokens de comunicação por tarefa aceita e taxa de aceite mecânico.
2. **Hipótese:** resolver conflitos de escrita com o verificador mecânico, em vez de LWW por id, aumenta a taxa de aceite com custo extra de verificação menor que o ganho em custo por tarefa aceita. Métrica: custo por tarefa aceita (US$ ou tokens) e falso sucesso.

## Limites/lacunas
- O teto de banda está na integração ARGoS (`buzz_controller.cpp`), não na VM; outras integrações (ROS, Khepera) não foram lidas.
- Não há critério de término de tarefa, aceite nem orçamento de computação por step.
- As docs divergem do código (`unselect`, descrição de `onconflict`).
- O texto da licença é MIT/Expat sem nomeá-la; não consultei SPDX nem metadados do GitHub.
- O desempenho relatado em publicações não foi verificado.

## Linha da matriz
| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| — só fim de bytecode/erro (`buzzrun.c:L96-L126`); `step()` por tick sem critério de tarefa | — sem aceite; LWW (`buzzvstig.c:L590-L608`) é consistência, não verificação | ✓ parcial: 1 pacote de tamanho fixo por step e descarte de mensagens grandes demais na integração ARGoS (`buzz_controller.cpp:L803-L838`); núcleo sem limite | ✓ coalescência por chave (`buzzoutmsg.c:L337-L359`), PUT velho não repassado (`buzzvm.c:L337-L341`), broadcast de 1 salto | ✓ `join`/`leave`/`select` em runtime (`buzzswarm.c:L377-L476`); vizinhança recriada por step | ✓ parcial: membros alheios expiram em 50 steps (`buzzswarm.c:L209-L248`); stigmergy e filas sem limite | Texto MIT/Expat sem nome, © 2015 Carlo Pinciroli (`LICENSE.txt`) |
