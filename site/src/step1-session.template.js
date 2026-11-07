async () => {
  // PASSO 1/3 — abre sessão de upload de Static Assets para o Worker "norevia" (build __BUILD_ID__).
  // Rodar com mcp__cloudflare__execute (account_id 0322dfe28640d56dbda3929744a51fc4).
  // Devolve { jwt, changed }: salve {"jwt": "…"} em site/deploy/session.json (o passo 2 envia todos os arquivos;
  // a Cloudflare deduplica por hash). `changed` = nº de arquivos novos/alterados, só informativo.
  const ACCOUNT = '0322dfe28640d56dbda3929744a51fc4';
  const manifest = "__MANIFEST__";
  const r = await cloudflare.request({ method: 'POST', path: `/accounts/${ACCOUNT}/workers/scripts/norevia/assets-upload-session`, body: { manifest } });
  return { jwt: r.result.jwt, changed: (r.result.buckets || []).flat().length };
}
