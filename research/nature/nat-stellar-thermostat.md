---
id: nat-stellar-thermostat
title: Equilíbrio hidrostático estelar e calor específico negativo (analogia física)
area: nature
evidence: fenomeno-natural
tags: [celeste-analogia, controle-de-admissao, capacidade, realimentacao-negativa, instabilidade]
sources:
  - "Lynden-Bell, D. & Wood, R. (1968). The gravo-thermal catastrophe in isothermal spheres and the onset of red-giant structure for stellar systems. MNRAS 138(4):495–525. doi:10.1093/mnras/138.4.495"
  - "Kippenhahn, R., Weigert, A. & Weiss, A. (2012). Stellar Structure and Evolution. Springer (Astronomy and Astrophysics Library). doi:10.1007/978-3-642-30304-3 (apenas bibliografia)"
  - "NASA — Life Cycles of Sun-like and Massive Stars (citada no estudo anterior, seção 15; não reaberta)"
related: [nat-homeostasis-allostasis, nat-inactive-reserve, nat-kessler-cascade, nat-candidatas]
updated: 2026-11-07
verificacao: "Resumo de Lynden-Bell & Wood 1968 lido (OpenAlex). Kippenhahn: só metadados. O argumento 'termostato' da sequência principal é dedução padrão de livro-texto NÃO conferida em texto aberto nesta rodada (lacuna)."
summary: Sistemas autogravitantes têm calor específico negativo — perder energia os aquece; numa estrela isso estabiliza a queima, mas em aglomerados concentrados leva a uma instabilidade que se autoacelera. Analogia física, sem intenção.
---

## Mecanismo
- **Equilíbrio hidrostático:** numa estrela em equilíbrio, o gradiente de pressão equilibra a gravidade (estudo anterior, seção 15, fonte NASA).
- **Calor específico negativo (Lynden-Bell & Wood 1968, resumo):** sistemas autogravitantes têm **calores específicos negativos**; se calor flui entre dois deles, o mais quente perde calor e **fica ainda mais quente**, o mais frio ganha e fica mais frio — a evolução se afasta do equilíbrio. Para uma esfera isotérmica de energia E < 0 e massa M numa caixa esférica, **não existem estados de equilíbrio** se o raio da caixa exceder **0,335 GM²/(−E)** (descoberta de Antonov). Sistemas extensos desenvolvem naturalmente estrutura núcleo–halo.
- **Termostato estelar (dedução padrão, `lacuna` de conferência):** numa estrela da sequência principal, excesso de produção de energia expande e esfria o núcleo, reduzindo a taxa de fusão — realimentação negativa que estabiliza a "carga". O mesmo calor específico negativo, em outra configuração (aglomerado muito concentrado), produz a **catástrofe gravotérmica** (realimentação positiva).
- **Sem intenção:** são equilíbrios e instabilidades físicas, não planejamento.

## Evidência
`fenomeno-natural` (física teórica de sistemas autogravitantes). A transposição é **estritamente analógica**.

## Análogo de engenharia
Duas lições de projeto de controle de admissão: (1) **realimentação negativa capacidade → carga**: quando a carga sobe, o sistema reduz admissão/concorrência antes de degradar (backpressure); (2) **alerta de instabilidade por concentração**: quando um componente central concentra carga e "transfere calor" para os outros (ex.: um coordenador que recebe tudo e gera mais trabalho quanto mais recebe), a dinâmica pode se autoacelerar. Não há correspondência quantitativa entre gravidade e filas.

## Hipótese testável
- **Variável:** admissão — (A) sem limite (todo pedido inicia agentes); (B) backpressure com limite de concorrência ajustado pela fila observada; e topologia — (i) coordenador central que redistribui tudo; (ii) coordenação via estado compartilhado.
- **Métrica:** custo por aceite, latência p95 e nº de agentes ativos sob carga crescente; presença de crescimento autoacelerado (agentes ativos crescendo superlinearmente com a carga).
- **Previsão:** B mantém custo por aceite estável até a capacidade e degrada graciosamente; A degrada abruptamente; a combinação A+(i) exibe crescimento superlinear de agentes ativos acima de uma carga crítica.
- **Refutação:** se A e B degradarem igual, ou se a topologia (i) não mostrar crescimento superlinear em nenhum regime.

## Limites da transferência
Astros não têm objetivos; estabilidade física não é conclusão de tarefa. A analogia só ajuda a nomear duas dinâmicas de controle (negativa/positiva) que a teoria de filas já descreve sem astrofísica.
