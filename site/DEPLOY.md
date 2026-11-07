# Norevia Labs — rebuild e republicação do site

Site: https://norevia.coldcodelabs.com
Hospedagem: Cloudflare Workers + **Static Assets**. Conta "Cold Code Labs" (`0322dfe28640d56dbda3929744a51fc4`), zona `coldcodelabs.com` (`957d6bafdcc985eb048619403adb6b35`).
Worker: **`norevia`** (exclusivo deste site). Custom domain: `norevia.coldcodelabs.com` → Worker `norevia`.
O deploy toca somente no script `norevia` e nesse hostname. Nenhum outro Worker nem registro DNS é alterado.

## TL;DR (republicar com os cartões finais)

```bash
node /data/OpenBot/Shared/Norevia/norevia/site/build.mjs        # 1. gera dist/ + deploy/
```
2. Passe o **conteúdo inteiro** de `site/deploy/step1-session.js` como `code` em `mcp__cloudflare__execute` (account_id `0322dfe28640d56dbda3929744a51fc4`).
3. Salve o JWT retornado em `site/deploy/session.json` no formato `{"jwt":"cfwau_…"}`. O campo `changed`, que diz quantos arquivos mudaram, é só informativo.
```bash
node /data/OpenBot/Shared/Norevia/norevia/site/deploy.mjs upload  # 4. envia os arquivos e gera deploy/step3-deploy.js
```
5. Passe o conteúdo de `site/deploy/step3-deploy.js` como `code` em `mcp__cloudflare__execute` (mesmo account_id). Faça isso em até 1 h depois do passo 4: o JWT expira.
6. Verifique:
```bash
curl -sI https://norevia.coldcodelabs.com/ | grep -i -E '^HTTP|x-norevia-build'
curl -s https://norevia.coldcodelabs.com/ | grep -o '<dd>[0-9]*</dd>' | head -1   # nº de cartões
rm -f /data/OpenBot/Shared/Norevia/norevia/site/deploy/session.json /data/OpenBot/Shared/Norevia/norevia/site/deploy/step3-deploy.js
```
O cabeçalho `x-norevia-build` traz o timestamp e o commit do build publicado.

## Por que o deploy tem três passos

- Não há token da Cloudflare na máquina nem wrangler autenticado. A única credencial de conta fica na ferramenta MCP `mcp__cloudflare__execute`, que roda JS isolado: o sandbox **não lê arquivos locais** e o `fetch` dele é bloqueado para a internet.
- Por isso os bytes do site **não** passam pelo MCP (seriam centenas de KB no prompt). Só passam o *manifest* (caminho → hash/tamanho, cerca de 12 KB) e dois JWTs.
- O upload dos arquivos (passo 4) usa o **JWT de upload** que a sessão de assets devolve. Ele vale 1 h e só serve para enviar os arquivos daquela sessão. Não dá acesso à conta. Assim o passo 4 roda localmente com `fetch` contra `api.cloudflare.com`.
- O passo 2 envia todos os arquivos do manifest em lotes de 40 (cerca de 4–5 MB, poucos segundos), e a Cloudflare deduplica por hash. Se preferir enviar só o que mudou, inclua `"buckets"` (da resposta crua da sessão) no `session.json`: o script respeita esse campo.

## O que o build gera

`node site/build.mjs` (Node ≥ 20, sem dependências):

- lê os cartões Markdown com frontmatter de `research/{literature,oss,nature,theory}`, `hypotheses`, `results/{sims,observatory}`. Ignora `README.md`, `index.md` e arquivos que começam com `_`. Arquivos sem frontmatter também ficam de fora e geram aviso.
- lê os dados `.json/.jsonl/.csv` em `results/sims` e `results/observatory`. Ignora `raw/`, `runs*`, `ledger`, `status-*` e o pré-registro. Com esses dados gera gráficos SVG inline, tabela de dados e o bloco "headline/tests" quando ele existe.
- grava em `site/dist/` (o site estático, idêntico ao publicado) e em `site/deploy/`:
  - `manifest.json`: mapa caminho → `{hash, size}`, com hash = sha256(base64(conteúdo) + extensão) truncado em 32 hex.
  - `worker.js`: Worker companheiro. Só roda quando nenhum asset casa: redireciona caminhos com maiúsculas e devolve `404`.
  - `headers.txt`: conteúdo `_headers` (CSP, nosniff, HSTS e cache imutável para `/assets/*`).
  - `step1-session.js`: código do passo 1, com o manifest embutido.
- `site/build-report.json`: contagens e avisos (ids duplicados, `related` quebrado, campos ausentes). Os mesmos avisos aparecem em /metodo/#saude.

Pré-visualização local: sirva `site/dist/` com qualquer servidor estático. Os caminhos são absolutos (`/assets/...`), então `file://` não funciona.

## Código usado em cada passo

### Passo 1: `deploy/step1-session.js` (gerado; o modelo fica em `src/step1-session.template.js`)
```js
async () => {
  const ACCOUNT = '0322dfe28640d56dbda3929744a51fc4';
  const manifest = { "/index.html": { "hash": "…32 hex…", "size": 28134 }, /* … todos os arquivos de dist/ … */ };
  const r = await cloudflare.request({ method: 'POST', path: `/accounts/${ACCOUNT}/workers/scripts/norevia/assets-upload-session`, body: { manifest } });
  return { jwt: r.result.jwt, changed: (r.result.buckets || []).flat().length };
}
```

### Passo 2 (local): `node site/deploy.mjs upload`
Divide os hashes do manifest em lotes de 40 (ou usa `buckets`, se estiver no `session.json`). Para cada lote, faz `POST https://api.cloudflare.com/client/v4/accounts/<conta>/workers/assets/upload?base64=true` com `Authorization: Bearer <jwt de upload>`. O corpo vai em `multipart/form-data`, com um campo por hash e o conteúdo do arquivo em base64. A última resposta (HTTP 201) traz o **JWT de conclusão**. O script então escreve `deploy/step3-deploy.js`.

### Passo 3: `deploy/step3-deploy.js` (gerado por `deploy.mjs`)
```js
async () => {
  const ACCOUNT = '0322dfe28640d56dbda3929744a51fc4';
  const ZONE = '957d6bafdcc985eb048619403adb6b35';
  const NAME = 'norevia';
  const HOST = 'norevia.coldcodelabs.com';
  const code = "<conteúdo de deploy/worker.js>";
  const metadata = {
    main_module: 'worker.js',
    compatibility_date: '2025-10-01',
    bindings: [{ type: 'assets', name: 'ASSETS' }],
    assets: {
      jwt: "<JWT de conclusão>",
      config: { html_handling: 'auto-trailing-slash', not_found_handling: '404-page', _headers: "<conteúdo de deploy/headers.txt>" },
    },
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('worker.js', new Blob([code], { type: 'application/javascript+module' }), 'worker.js');
  const up = await cloudflare.request({ method: 'PUT', path: `/accounts/${ACCOUNT}/workers/scripts/${NAME}`, body: form });

  // custom domain (idempotente; aborta se o hostname pertencer a outro Worker ou se houver registro DNS)
  const list = await cloudflare.request({ method: 'GET', path: `/accounts/${ACCOUNT}/workers/domains`, query: { hostname: HOST } });
  let dom = (list.result || []).find((d) => d.hostname === HOST);
  if (dom && dom.service !== NAME) throw new Error(`hostname ${HOST} já pertence ao Worker ${dom.service}; abortado`);
  if (!dom) {
    const dns = await cloudflare.request({ method: 'GET', path: `/zones/${ZONE}/dns_records`, query: { name: HOST } });
    if ((dns.result || []).length) throw new Error(`já existe registro DNS para ${HOST}; abortado`);
    dom = (await cloudflare.request({ method: 'PUT', path: `/accounts/${ACCOUNT}/workers/domains`, body: { hostname: HOST, service: NAME, zone_id: ZONE } })).result;
  }
  return { ok: up.success, script: up.result && { id: up.result.id, modified_on: up.result.modified_on, has_assets: up.result.has_assets }, domain: dom && { id: dom.id, hostname: dom.hostname, service: dom.service } };
}
```
Nas republicações o domínio já existe, então essa parte só confirma que ele aponta para `norevia`.

## Histórico de deploys deste agente

- v1: 2026-11-07 22:43 UTC, build `2026-11-07T22:41:38Z` (commit `dde76e691e9a`), 89 cartões, 95 páginas HTML. Criou o Worker `norevia` e o custom domain (id `8972335bb2d93bab0371b8033dcac8f1e7039ffb`).
- v2: 2026-11-07 23:13 UTC, build `2026-11-07T23:11:44Z` (commit `e740ab901041`), 136 cartões, 142 páginas HTML, 149 arquivos.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `hash … não está no manifest` no passo 4 | Houve rebuild entre o passo 1 e o 4. Refaça os passos 1→4 com o mesmo build. |
| Passo 3 falha com JWT inválido/expirado | Passou 1 h desde o passo 1/4. Refaça os passos 1→5. |
| `changed: 0` no passo 1 | Nada mudou. Rode o passo 4 assim mesmo: ele reenvia (a Cloudflare deduplica) e gera o passo 5 normalmente. |
| Página antiga após o deploy | O HTML usa `max-age=0, must-revalidate` (padrão dos assets). Recarregue sem cache. CSS/JS têm hash no nome. |
| Reverter | Faça o rebuild de uma versão anterior do repo e republique. Também há rollback de versões do Worker `norevia` no painel da Cloudflare. |

## Convenções opcionais para os cartões (melhoram o site)

- Experimentos: `data: arquivo.json` (relativo ao cartão ou à raiz do repo) liga o cartão ao arquivo de resultados. Sem isso, o build associa automaticamente um JSON cujo nome começa com o `id` do cartão.
- `chart: { x: n_agents, y: [accuracy, cost], group: arch, type: line }` fixa o gráfico. Cada `y` vira um gráfico próprio: nunca há dois eixos verticais.
- Os JSON de resultado podem trazer `headline: [..]` e `tests: [{id, verdict, detail}]`. O site mostra esses campos como "Do arquivo …", com veredito por predição.
- Hipóteses: `status: aberta | em-teste | suportada-preliminar | suportada | refutada | inconclusiva | arquivada`.
- Links entre cartões: `[[H-03]]` ou citação direta do id (`H-03`, `nat-stigmergy`) no texto. As duas formas viram link automaticamente.
