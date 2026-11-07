# Norevia Labs — Collective Intelligence Research

> Qual é a menor quantidade de computação, raciocínio e coordenação necessária para produzir um resultado verificavelmente correto — e como um sistema pode descobrir essa configuração sozinho?

Norevia investiga **quando, como e por que** múltiplos agentes computacionais devem cooperar em vez de concentrar recursos em um único agente. A natureza (colônias, corpo humano, sistemas celestes) é usada como **fonte de hipóteses**; a engenharia experimental é o **instrumento de validação**.

## Disciplina de evidência
Todo conteúdo é marcado com um destes níveis:
- **Fenômeno natural** — mecanismo descrito em fonte primária (biologia/física). Analogia não prova eficácia em LLMs.
- **Relato dos autores** — resultados publicados, não reproduzidos aqui.
- **Implementação observada** — código inspecionado, com versão/commit.
- **Hipótese** — proposta falsificável, ainda sem teste.
- **Validação local** — resultado produzido neste repo, com script, dados e seed.
- **Lacuna** — o que ainda não sabemos.

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `research/literature` | Cartões de papers (versão arXiv/DOI, alegações, o que verificamos) |
| `research/oss` | Projetos open source inspecionados (commit, licença, mecanismo) |
| `research/nature` | Mecanismos naturais → análogo de engenharia → hipótese testável |
| `research/theory` | Formalização da "lei da eficiência coletiva" |
| `hypotheses` | Registro de hipóteses com critérios de refutação e status |
| `sims` | Simulações baseadas em agentes (Node.js, determinísticas por seed) |
| `observatory` | Swarm Efficiency Observatory — benchmarks com LLMs reais |
| `results` | Resultados versionados de simulações e benchmarks |
| `site` | Fonte da LP em norevia.coldcodelabs.com |

Licença: conteúdo de pesquisa CC BY 4.0; código MIT.
