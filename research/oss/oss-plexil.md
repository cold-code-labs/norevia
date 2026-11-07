---
id: oss-plexil
title: PLEXIL — executivo de planos com máquina de estados por nó, condições verificadas e laço de quiescência
area: oss
evidence: implementacao-observada
tags: [plan-execution, maquina-de-estados, pos-condicao, quiescencia, mutex, prioridade, nasa, c-plus-plus]
sources:
  - "https://github.com/plexil-group/plexil/tree/0e7439fbcf9061b90e35a00e82ebdfa8257609f2 (commit inspecionado, clone raso em 2026-11-07)"
  - "https://plexil-group.github.io/plexil_docs/index.html (documentação oficial linkada em README.md:L5; consultada em 2026-11-07)"
related: [oss-buzz, oss-selfheal, oss-langgraph-supervisor, oss-matriz, oss-padroes]
updated: 2026-11-07
summary: O executivo PLEXIL avalia por nó condições Start/End/Pre/Post/Invariant/Exit/Skip/Repeat numa máquina de estados de 8 estados. Ele registra pós-condição falha como outcome mecânico, arbitra mutexes e variáveis por prioridade e roda um laço de quiescência sem limite de micro-passos. Não é swarm nem sistema de LLM.
---

## Identificação
- URL: https://github.com/plexil-group/plexil. É o repositório linkado pelo estudo anterior; `nasa/PLEXIL` não clonou nesta rodada.
- SHA completo: `0e7439fbcf9061b90e35a00e82ebdfa8257609f2`. Data do commit: 2026-05-12T11:33:34-07:00.
- Licença: `LICENSE` é **BSD de 3 cláusulas**, "Copyright (c) 2006-2020, Universities Space Research Association (USRA). All rights reserved.". Tem as três condições (retenção do aviso, reprodução em binário, não usar o nome da USRA para endosso) e o aviso "PROVIDED BY USRA ``AS IS''". Existe também `src/COPYING` com o mesmo modelo, mas datado de "2006-2016" e com conteúdo diferente de `LICENSE` (`diff -q`). Não detalhei as diferenças.
- Escopo efetivamente lido:
  - Arquivos de topo: `LICENSE`, `README.md:L1-L60`, `CAVEATS:L1-L40`, `doc/README`, `src/COPYING:L1-L5`.
  - Valores: `src/value/NodeConstants.hh:L30-L179`.
  - Núcleo do nó: `src/exec/NodeImpl.hh:L60-L115`; `src/exec/NodeImpl.cc:L50-L70, L570-L830, L1028-L1410`.
  - Executivo: `src/exec/PlexilExec.cc:L55-L95, L183-L240, L240-L430, L500-L670, L790-L830`.
  - Tipos de nó: `src/exec/ListNode.cc:L236-L330, L655-L680, L725-L772`; `src/exec/CommandNode.cc:L44-L90, L160-L200, L396-L420`; `src/exec/AssignmentNode.cc:L114-L140` (grep).
  - Utilitários: `src/utils/LinkedQueue.hh:L465-L490`.
  - Testes: nomes das funções de `src/exec/test/exec-test-module.cc`.
  - Página `index.html` da documentação oficial.

## Mecanismo
PLEXIL **não é sistema multiagente nem de LLM**: é uma linguagem de planos hierárquicos (árvore de nós) e o executivo que os interpreta. Itens de "swarm" são n/a ou análogos.

1. **Topologia de comunicação.** **[código]** É uma árvore pai→filhos. Os filhos herdam condições do ancestral: `AncestorExit` = Exit OU AncestorExit do pai, `AncestorInvariant` = Invariant E AncestorInvariant, `AncestorEnd` (`src/exec/ListNode.cc:L242-L308`). A notificação é por eventos: um nó cuja condição muda entra na fila de candidatos (`src/exec/NodeImpl.cc:L574-L621`). O mundo externo entra por comandos, lookups e o dispatcher (`PlexilExec.cc:L666-L670`).
2. **Quem decide quem age.** **[código]** O executivo central (`PlexilExecImpl::step`) avalia `getDestState()` para cada candidato (`src/exec/PlexilExec.cc:L303-L324`). Quando a transição para EXECUTING exige recursos (mutex ou variável de atribuição), o nó vai para uma **fila de pendentes ordenada por prioridade** (`PlexilExec.cc:L84, L509-L512, L794-L802`). `resolveResourceConflicts` percorre essa fila por faixa de prioridade e transiciona quem consegue adquirir (`PlexilExec.cc:L588-L647`). A prioridade default é `WORST_PRIORITY = 100000` (`src/exec/NodeImpl.hh:L66-L72`). A inserção é estável, então empates seguem a ordem de chegada (`src/utils/LinkedQueue.hh:L478-L490`). Variáveis de atribuição também são recursos (`AssignmentNode.cc:L114-L140`). Adquirir um mutex já detido por um ancestral é erro de plano (`NodeImpl.cc:L637-L659`).
3. **Critério de término.** **[código]**
   - **Estados** (8 + sentinela): `INACTIVE, WAITING, EXECUTING, ITERATION_ENDED, FINISHED, FAILING, FINISHING` (`src/value/NodeConstants.hh:L47-L57`).
   - **Condições**: `Skip, Start, Pre, Exit, Invariant, End, Post, Repeat`, mais as internas `ActionComplete` e `AbortComplete` (`src/exec/NodeImpl.hh:L86-L113`; nomes em `NodeImpl.cc:L53-L69`).
   - **Defaults**:
     - Sem `StartCondition`, o nó inicia (o teste só bloqueia se a condição existir; `NodeImpl.cc:L1087-L1097`).
     - Num nó List sem `EndCondition`, o End default é "todos os filhos FINISHED" (`AllFinished`, `ListNode.cc:L295-L298, L320-L323`).
     - Num nó Command, End é combinado por OU com "command handle interrompível" (DENIED/FAILED/INTERFACE_ERROR) (`CommandNode.cc:L55-L71, L174-L187`).
     - Sem `RepeatCondition`, ITERATION_ENDED vai para FINISHED; com Repeat verdadeiro, o nó volta a WAITING (`NodeImpl.cc:L1346-L1369`). **Não há teto de repetições**: ele só existe se o autor do plano escrever um.
   - **Laço de quiescência**: o macro-passo repete micro-passos até a fila de mudanças de estado ficar vazia ou surgir comando/update a despachar (`PlexilExec.cc:L282-L406`). **Não há limite de micro-passos.** O código traz `// TODO: instrument high-water-mark of max nodes transitioned in this step` (`PlexilExec.cc:L381`). O laço também termina quando todos os planos terminam (`allPlansFinished`, `PlexilExec.cc:L195-L215`).
4. **Verificação/aceite mecânico.** **[código]** O executivo aplica as verificações sozinho:
   - Pré-condição falsa leva a ITERATION_ENDED/FAILURE/`PRE_CONDITION_FAILED` (`NodeImpl.cc:L1098-L1108`).
   - Invariante falsa durante a execução leva a `INVARIANT_CONDITION_FAILED` (`NodeImpl.cc:L1211-L1224`).
   - Ao atingir End, a **PostCondition** é avaliada. Se for falsa ou desconhecida, o outcome é `FAILURE_OUTCOME`/`POST_CONDITION_FAILED`; caso contrário, `SUCCESS_OUTCOME`. Isso vale para nó vazio (`NodeImpl.cc:L1236-L1246`), Command (`CommandNode.cc:L402-L417`) e List (`ListNode.cc:L660-L675`).
   - Outcomes e tipos de falha disponíveis: `SUCCESS/FAILURE/SKIPPED/INTERRUPTED` e `PRE_CONDITION_FAILED, POST_CONDITION_FAILED, INVARIANT_CONDITION_FAILED, PARENT_FAILED, EXITED, PARENT_EXITED` (`NodeConstants.hh:L93-L145`).
   - A pós-condição é aceite mecânico, mas é **escrita pelo autor do plano**. Sem Post, o nó termina com SUCCESS (inclusive um Command cujo handle foi `COMMAND_FAILED`, que satisfaz End via `CommandHandleInterruptible`). Esse é um caso de "sucesso" sem verificação. Inferência pela leitura de `CommandNode.cc:L55-L71` e `L402-L417`; não testado.
5. **Controle de custo/orçamento técnico.** Não encontrado no código inspecionado (busca: `budget`, `limit`, `max`, `timeout`, `retry` em `src/exec`). Mutex e prioridade arbitram acesso, não custo. `COMMAND_DENIED` ("Insufficient resources") vem da interface externa (`CommandNode.cc:L59`), não de um orçamento do executivo.
6. **Memória.** n/a no sentido multiagente. **[código]** Ao repetir, o nó é resetado (`NodeImpl.cc:L1384-L1386`), e planos terminados podem ser removidos (`deleteFinishedPlans`, `PlexilExec.cc:L225-L240`). Não há janela de histórico a limitar.
7. **Falhas/retry.** **[código]**
   - Não há retry automático de nó ou comando (busca `retry` em `src/exec`: só "retry resource acquisition", `NodeImpl.cc:L752, L761`).
   - A falha é propagada **para baixo**: invariante falsa no ancestral leva o filho a `PARENT_FAILED`, e exit no ancestral leva a `PARENT_EXITED` (`NodeImpl.cc:L1166-L1208`; `ListNode.cc:L461-L524`).
   - Um List em FAILING espera os filhos ficarem WAITING ou FINISHED antes de concluir (`ListNode.cc:L731-L772`).
   - A recuperação vem de padrões do plano (Repeat, condições que leem outcomes), não do executivo. Não encontrei propagação automática de falha de filho para pai no caminho lido. Com o End default `AllFinished` e sem Post, o pai pode terminar SUCCESS mesmo com filho FAILURE (inferência a partir de `ListNode.cc:L295-L298, L660-L675`; não testado).
8. **Poda de comunicação.** n/a (não há canal entre agentes). O análogo seria a poda de execução: `Skip`/`AncestorExit`/`AncestorInvariant`/`AncestorEnd` encerram subárvores como SKIPPED ainda em WAITING (`NodeImpl.cc:L1032-L1085`).
9. **Elástico vs fixo.** **[código]** A árvore de cada plano é fixa depois de carregada. Novos planos raiz podem ser adicionados em runtime com `addPlan` (`PlexilExec.cc:L183-L193`), mas isso é decisão do hospedeiro, não adaptação por demanda.
10. **Benchmark custo vs qualidade.** Ausente. Existem testes de transição de estado (**[teste]** `src/exec/test/exec-test-module.cc`, ex.: `waitingDestTest`, `listFinishingDestTest`, que verifica `POST_CONDITION_FAILED` na L888) e diretórios de regressão em `test/`. Lidos só pelos nomes; nada executado.

**Determinismo (docs vs implementação).**
- **[docs]** A página oficial afirma: "It is compact, semantically clear, and deterministic given the same sequence of events from the external world." (`plexil_docs/index.html`, consultada em 2026-11-07). O repositório não traz essa afirmação: a busca por `determinis` em `.md/.txt/.dox/.hh/.cc` fora de `third-party` não teve resultado.
- **[código]** O que sustenta a afirmação no código lido:
  - filas FIFO (`LinkedQueue`) para candidatos e mudanças de estado (`PlexilExec.cc:L81-L93`);
  - fila de pendentes com inserção estável por prioridade (`LinkedQueue.hh:L478-L490`);
  - efeitos externos adiados para o fim do macro-passo (`PlexilExec.cc:L403-L418`);
  - nenhuma fonte de aleatoriedade encontrada (busca `rand(`).
- Não verifiquei se a ordem de inserção na fila de candidatos depende de algo além da sequência de eventos, como a ordem de listeners. Por isso não confirmo o determinismo por completo.

## Evidência
- **Implementação observada:** a máquina de estados, as condições, os outcomes e tipos de falha, a avaliação de Pre/Post/Invariant pelo executivo, o End default de List, a arbitragem de mutex e variáveis por prioridade e o laço de quiescência sem teto.
- **Relato da agência/docs:** determinismo dada a mesma sequência de eventos externos. Uso em missões e testes: payload Distributed Spacecraft Autonomy no enxame Starling ("demonstrating distributed reactive autonomy"); LADEE (experimento que não voou); EDSN; HDU/Desert RATS; ISS (simulação); DAME; K10. Tudo conforme `index.html`, sem verificação independente.
- **Lacunas:** o tradutor, o parser XML, a interface externa (`src/intfc`, `src/app-framework`) e a semântica de Update/LibraryCall não foram lidos; `nasa/PLEXIL` não foi comparado.
- Nenhum código foi executado ou compilado; nenhum benchmark reproduzido.

## Análogo de engenharia
**Hipótese de engenharia; a semântica de nave espacial e robótica não se transfere automaticamente para LLMs.** Para o Swarm Efficiency Observatory, o PLEXIL oferece um **contrato de nó** pronto: Pre (pode começar?), Invariant (pode continuar?), End (terminou?) e Post (o resultado é aceitável?), com tipos de falha distintos. Isso permite separar no relatório "agente parou" de "resultado aceito". O laço de quiescência é um modelo para rodadas síncronas de N agentes, em que nada externo é despachado até a rodada estabilizar. A ausência de teto de micro-passos e de repetições mostra o que um orquestrador de LLM precisa adicionar: limite de rodadas e de custo. A arbitragem de mutex por prioridade com desempate FIFO é um modelo determinístico para "quem age" sobre recurso compartilhado, como um arquivo do repositório.

## Hipótese testável
1. **Hipótese:** num orquestrador multiagente em que cada subtarefa tem Post mecânico (testes) e outcome tipado como no PLEXIL, a taxa de falso sucesso reportado (tarefa marcada como concluída sem passar no verificador final) cai para ≤1%, contra a linha de base sem Post por subtarefa. Métricas: falso sucesso e custo por tarefa aceita.
2. **Hipótese:** arbitrar a escrita em arquivos compartilhados com mutex por prioridade e desempate FIFO reduz retrabalho por conflito de edição entre N agentes em ≥50%, sem elevar a latência mediana em mais de 20%. Métrica: edições revertidas por tarefa aceita e latência.

## Limites/lacunas
- Não é swarm: as colunas de poda, elasticidade e memória são majoritariamente n/a.
- O aceite depende de o autor escrever Post. O default (sem Post) é SUCCESS.
- O determinismo foi checado só parcialmente no código (item "Determinismo").
- A divergência entre `LICENSE` (2006–2020) e `src/COPYING` (2006–2016) não foi detalhada.
- Os relatos de missão são da agência ou da documentação, não reproduzidos.

## Linha da matriz
| Término explícito | Aceite verificável | Orçamento técnico (não só prompt) | Poda de comunicação | Elástico (tamanho adapta) | Memória limitada | Licença |
|---|---|---|---|---|---|---|
| ✓ End/Repeat com defaults (`ListNode.cc:L295-L298`, `NodeImpl.cc:L1346-L1369`); quiescência sem teto de micro-passos (`PlexilExec.cc:L282-L406`) | ✓ Post/Pre/Invariant avaliadas pelo executivo e convertidas em `POST_CONDITION_FAILED` etc. (`NodeImpl.cc:L1236-L1246`); depende de Post escrita pelo autor | — nenhum limite de custo, tempo ou repetições no executivo (busca `budget/limit/retry`) | n/a não há canal entre agentes; análogo de poda de execução via Skip/AncestorExit (`NodeImpl.cc:L1032-L1085`) | — árvore fixa por plano; `addPlan` só pelo hospedeiro (`PlexilExec.cc:L183-L193`) | n/a sem histórico; reset no Repeat (`NodeImpl.cc:L1384-L1386`) | BSD-3-Clause, © 2006-2020 USRA (`LICENSE`) |
