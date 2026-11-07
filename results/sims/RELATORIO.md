---
id: sim-relatorio
title: "Relatório das simulações Norevia — testes de hipótese em modelos de agentes abstratos"
area: simulation
evidence: validacao-local
tags: [simulacao, testes-de-hipotese, pre-registro, reprodutibilidade, sintese]
sources:
  - "Código: sims/*.mjs (Node 22, sem dependências, PRNG mulberry32, seed base 20261107)"
  - "Dados: results/sims/*.json · Pré-registro: results/sims/PREREGISTRO.jsonl"
related: [sim-voto-correlacionado, sim-verificador, sim-limiar-resposta, sim-estigmergia, sim-quorum, sim-elastico, sim-clonal, H-01, H-02, H-05, H-06, H-07, H-08, H-10, H-13, H-14, H-17, H-19, th-modelo]
updated: 2026-11-07
summary: "7 simulações pré-registradas, 33 previsões: 19 suportadas, 2 parcialmente, 12 não suportadas — dentro de modelos de agentes abstratos. Erros correlacionados limitam o voto; verificador e regras elásticas/clonais pagam; quórum e várias previsões detalhadas falharam."
---

> **Escopo da evidência — leia antes de citar.** Tudo aqui é `validacao-local` **dentro de modelos simulados** de agentes abstratos (probabilidade de acerto, custo por passo, fator latente de erro compartilhado). Nenhum número é medição de LLM. Os modelos encarnam suposições (curva de esforço, independência condicional, verificador com sens/spec fixos) que precisam ser medidas no Observatory antes de qualquer decisão de engenharia. Proposta de pesquisa, não autorização de implantação.

## Como reproduzir
```
node sims/run-all.mjs          # reexecuta as 7 simulações (~25 s), regrava os JSON e confere
                               # determinismo (JSON idêntico byte a byte) + manchetes e veredictos nos cartões
node sims/<id>.mjs             # uma simulação
```
Cada hipótese foi registrada em `results/sims/PREREGISTRO.jsonl` (data/hora + sha256 do código) **antes** da primeira execução; emendas posteriores estão no mesmo arquivo e nos cartões.

## Tabela-síntese

Força da evidência (dentro do modelo): **A** = resultado analítico confirmado por Monte Carlo; **B** = MC com IC95% estreitos e efeito grande, robusto nas varreduras feitas; **C** = depende de parâmetros escolhidos ou de critério limítrofe; **D** = não suportada / inconclusiva.

| Simulação | Hipótese (resumo) | Resultado no modelo | Força | H-xx | O que precisa de validação com LLM real |
|---|---|---|---|---|---|
| `sim-voto-correlacionado` | Correlação de erros impõe teto ao voto; acima de ρ_c, 1 agente de esforço alto vence qualquer N | **Suporta (4/4).** Teto Φ(z_L/√ρ); ρ_c ≈ 0,091 para p_L=0,6 vs p_H=0,8. Com ρ=0 o voto só vence a partir de N=19 (custo 19 vs 4); com ρ ≥ 0,075 nunca (N ≤ 64). φ entre erros de apenas 0,03 já desloca o ponto de virada de N=19 para N=49 | A | H-01, H-10, H-15 | Correlação de erros entre amostras/agentes por tipo de tarefa; curva acurácia × reasoning effort (β) |
| ↳ sensibilidade (coordenação) | Limiar ~45% de Kim et al. aparece? | **Não reproduzido por agregação pura:** a orçamento igual o voto só vence com p ≥ 0,7 e ρ baixo, nunca com ρ ≥ 0,55. Ganho do voto vs mesma p é máximo em p≈0,7–0,8 | C (exploratório) | H-17 | Se o limiar de ~45% vem de overhead/propagação de erro (não modelados) |
| `sim-verificador` | Verificador de spec alta reduz falso sucesso abaixo do voto e do único; FS cresce com N | **Misto (2 suporta, 1 parcial, 2 não).** sens=spec=0,95, ρ=0,3, N=9: FS 5,0% vs 35,4% (voto) vs 13,7% (único-alto). FS cresce com N e bate com a fórmula fechada (55/56). Verificador fraco (spec=0,5) é pior que o voto. Falhas: com ρ=0,6 e N ≥ 17 o único de esforço alto teve FS menor; vantagem do verificador não é monótona em ρ | B | H-02, H-13, H-18 | sens/spec reais de testes e de LLM-juiz; correlação juiz–gerador; FS de best-of-N vs N |
| `sim-limiar-resposta` | Limiares de resposta alocam sem mensagens; batem papéis fixos; vencem despachante com custo de mensagem/atraso | **Suporta (5/5).** Latência 1,46 vs 1,34 do despachante perfeito, com 0 mensagens e ~1,6 agente ativo a mais; despachante só compensa se mensagem < ~0,18 agente-passo (L=0) ou < ~0,07 (L=10) | B | H-06, H-16 | Custo real de mensagens/contexto do orquestrador vs leitura de estado compartilhado; atraso de observação |
| `sim-estigmergia` | Rastro com evaporação reduz duplicação sem mensagens; ε ótimo intermediário; rastro sem evaporação cresce sem limite | **3/4 suporta.** Tempo ~2,5× menor e duplicação 50% → 14% vs sem coordenação; U em ε (ótimo ε≈0,1); sem evaporação a memória cresce linearmente e a busca fica ~30% mais lenta. **P3 falhou:** mensagens todos-com-todos (1 165–5 778 msgs/episódio) não foram o mínimo — o rastro de recência empatou (K=4) ou venceu (K=16) | B | H-07, H-11 | Quadro "já tentei X" com TTL entre agentes LLM; custo de tokens de leitura vs mensagens |
| `sim-quorum` | Quórum maior: mais acurácia com retornos decrescentes; viés compartilhado cria platô | **Não suporta (0/4); inconclusivo.** Trade-off existe em escala (Q=1→50: ~18% → 96% de acerto, 1 → 58 passos), mas o ganho é **convexo** (Q pequeno = loteria de descoberta), não côncavo; viés compartilhado derruba 96% → 66% em uma célula e não em outra. Regime pré-registrado era degenerado (manada); regime principal definido pós-hoc; 1 bug corrigido | D | H-08, H-20 | Se "parar quando Q concordam" é convexo em tarefas reais; risco de manada quando agentes leem respostas uns dos outros |
| `sim-elastico` | Regra ΔP·V ≥ custo vence N fixo em custo por aceita mantendo aceite; transições 1→micro→macro | **Misto (2 suporta, 1 parcial, 3 não).** Utilidade líquida ≥ melhor N fixo em todo V (V=20: 14,9 vs 12,8; aceite 93% com 2,3 agentes). **P1 falhou** porque o agente único tem o menor custo por aceita desistindo das difíceis — a métrica isolada engana. Transições: média 1→micro em V≈7, →macro em V≈70; acoplada só vale a pena com V≥10. Controlador que ignora ρ superexpande (custo/aceita +33% em V=20) | B (utilidade) / C (transições) | H-05, H-12, H-16, H-17 | P(acerto na tentativa k+1 \| k falhas) real; especificidade dos testes de aceite; K*(V) generaliza fora da calibração? |
| ↳ sensibilidade (coordenação) | N ótimo vs p do agente único (ρ 0,2–0,7) | Valor do 2º agente é máximo em p≈0,5 (≈ p(1−p)), compatível em forma com ~45% e com H-17; mas N ≥ 2 segue ótimo até p=0,6–0,95 quando há teste de aceite | C (exploratório) | H-17 | Idem acima |
| `sim-clonal` | Expandir sob erro persistente e contrair depois: recuperação de pool grande com custo de pool pequeno | **3/5 suporta.** Recuperação 11,8 passos vs 12,9 de 16 agentes fixos, custo 2,85 vs 16 agentes/passo; memória por tipo −18% no tempo (+3% custo); contração lenta só aumenta custo. Falhas: comparação de custo ocioso com fixo-1 é enganosa (fixo-1 nunca fica ocioso, vive atrasado); filtro de persistência pouco útil com alarmes de 1 passo | B | H-14, H-19, H-05 | Custo de ativar/desativar agentes; confiabilidade do sinal de erro; reparos paralelos que se atrapalham ou introduzem falhas |

Contagem de previsões formais: 33 → 19 `suporta`, 2 `suporta-parcialmente`, 12 `nao-suporta` (veredictos por previsão abaixo; detalhes nos cartões).

## Veredictos por simulação (conferidos por `run-all.mjs`)
- sim-voto-correlacionado: P1:suporta P2:suporta P3:suporta P4:suporta
- sim-verificador: P1:nao-suporta P2:suporta P3:suporta-parcialmente P4:suporta P5:nao-suporta
- sim-limiar-resposta: P1:suporta P2:suporta P3:suporta P4:suporta P5:suporta
- sim-estigmergia: P1:suporta P2:suporta P3:nao-suporta P4:suporta
- sim-quorum: P1:nao-suporta P2:nao-suporta P3:nao-suporta P4:nao-suporta
- sim-elastico: P1:nao-suporta P2:suporta P3:suporta-parcialmente P4:nao-suporta P5:nao-suporta P6:suporta
- sim-clonal: P1:suporta P2:nao-suporta P3:nao-suporta P4:suporta P5:suporta

## O que os sete modelos dizem juntos (hipóteses de engenharia, não conclusões sobre LLMs)
1. **Redundância sem informação nova não escala.** Voto e quórum herdam o fator de erro comum: o teto Φ(z_L/√ρ) aparece no voto e um efeito análogo no quórum com viés compartilhado. Medir ρ entre agentes é pré-requisito para decidir N.
2. **Informação independente vale mais que mais cópias.** O verificador (gerador e juiz com erros não correlacionados) e o rastro estigmérgico agregam informação que o voto não tem; ambos superaram mais agentes ou mais mensagens. Quando o verificador compartilha o viés da tarefa, a vantagem encolhe.
3. **Expandir sob sinal, contrair cedo.** Limiar de resposta, regra elástica e regra clonal — três mecanismos diferentes — chegaram ao mesmo padrão: pouco custo em repouso, expansão só enquanto há sinal (backlog, falha de teste, erro persistente), retorno rápido ao repouso. Em todos, um pool fixo grande comprou pouca latência a custo muito maior.
4. **Métricas isoladas enganam.** Custo por tarefa aceita favorece desistir das difíceis (elástico, P1); custo ocioso favorece pools subdimensionados que nunca ficam ociosos (clonal, P2). Relatar sempre o par (custo, taxa de aceite) ou a utilidade líquida.
5. **Falso sucesso cresce com a expansão.** Best-of-N e o swarm elástico aumentam o falso aceite com N (0,7% → 4,6% em `sim-elastico`; saturação r_w/(r_c+r_w) em `sim-verificador`). Aceite verificável precisa de especificidade alta, não só de mais tentativas.
6. **Realimentação forte demais = manada.** O regime degenerado do quórum (recrutamento forte) decide rápido e erra — risco direto para swarms de LLM que leem as respostas uns dos outros.

## Lacunas e limitações gerais
- Modelos abstratos; parâmetros escolhidos, não calibrados com dados de LLM. As curvas de esforço p(e), sens/spec e α são suposições.
- Tarefas binárias ou de sucesso/fracasso; sem decomposição real, sem aprendizado entre tentativas (agentes LLM veem falhas anteriores), sem custo de latência na utilidade (exceto métricas separadas).
- `sim-quorum` teve o regime principal escolhido após a 1ª execução e uma correção de bug; seus resultados são os mais frágeis.
- Robustez a parâmetros foi varrida só onde indicado nos cartões (ρ, β, N, V, ε, θ, L, f); outras escolhas (tamanhos de grade, taxas de chegada) não foram variadas.
- Correspondências com a literatura (Kim et al.; Kim, Garg et al.) usam relatos dos autores; não reproduzimos esses estudos.

## Próximos passos sugeridos (pesquisa; nada aqui autoriza implantação)
- Observatory: estimar ρ e p por tarefa com ≥ 10 execuções independentes de A-low (alimenta H-01/H-15); medir sens/spec de testes visíveis vs ocultos (H-02/H-13); medir P(acerto na tentativa k+1 | k falhas) (H-05/H-12).
- Simulação: acrescentar custo de ativação de agentes (`sim-clonal`, `sim-limiar-resposta`), aprendizado entre tentativas e decomposição em tarefas acopladas (`sim-elastico`), e um modelo de quórum com mudança de modo ao atingir Q.
