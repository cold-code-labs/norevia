async () => {
  // STEP 1/3 — open a Static Assets upload session for Worker "norevia" (build __BUILD_ID__).
  // Run through mcp__cloudflare__execute (account_id 0322dfe28640d56dbda3929744a51fc4).
  // Returns { jwt, changed }: save {"jwt": "…"} in site/deploy/session.json. Step 2 uploads all files;
  // Cloudflare deduplicates by hash. `changed` is the informational count of new or modified files.
  const ACCOUNT = '0322dfe28640d56dbda3929744a51fc4';
  const manifest = "__MANIFEST__";
  const r = await cloudflare.request({ method: 'POST', path: `/accounts/${ACCOUNT}/workers/scripts/norevia/assets-upload-session`, body: { manifest } });
  return { jwt: r.result.jwt, changed: (r.result.buckets || []).flat().length };
}
