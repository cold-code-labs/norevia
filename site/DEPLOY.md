# Rebuild and publish Norevia

Production site: <https://norevia.coldcodelabs.com>
Hosting: Cloudflare Workers Static Assets. Worker: `norevia`. Custom hostname: `norevia.coldcodelabs.com`.

## Publish

The deployment process uses a short-lived Cloudflare asset-upload token. The Cloudflare MCP connection creates the upload session; the local script sends the asset bytes; the MCP connection then publishes the Worker and checks the custom domain. No account token is stored in the repository.

1. Build the site:

   ```bash
   node site/build.mjs
   ```

2. Submit the contents of `site/deploy/step1-session.js` to `mcp__cloudflare__execute` for the configured account. Save the returned upload JWT and optional `buckets` to `site/deploy/session.json`.

3. Upload the requested assets and generate the deployment request:

   ```bash
   node site/deploy.mjs upload
   ```

4. Submit the contents of `site/deploy/step3-deploy.js` to `mcp__cloudflare__execute` within one hour. It updates only the `norevia` Worker and the `norevia.coldcodelabs.com` custom domain. It refuses to take over a hostname attached to another service or overwrite an existing DNS record.

5. Verify the live response and `x-norevia-build` header. Remove the temporary `site/deploy/session.json` and `site/deploy/step3-deploy.js` files after the deployment completes.

The upload JWT is short-lived and restricted to the asset session. The local uploader sends content in batches of 40 and Cloudflare deduplicates assets by hash. Do not rebuild between steps 2 and 3; the session is tied to the generated manifest.

## Build output

`node site/build.mjs` reads Markdown cards and experiment data from the repository, writes the static site to `site/dist/`, and creates `site/deploy/manifest.json`, `headers.txt`, `worker.js`, and `step1-session.js`. It also writes `site/build-report.json` with card, page, dataset, and warning counts.

The build has no package dependencies and requires Node 20 or newer. The site uses absolute asset paths; preview `site/dist/` through an HTTP static server rather than `file://`.

## Troubleshooting

- If upload reports that a hash is missing from the manifest, the site was rebuilt after the upload session was created. Re-run the build and restart the upload steps.
- If the asset token expires, create a new session and upload again.
- If the custom hostname is already attached to a different Worker or has an existing DNS record, inspect that Cloudflare state manually. The deployment script intentionally stops without changing it.
- `site/build-report.json` is the source of truth for local build warnings; fix broken card relations before publishing.
