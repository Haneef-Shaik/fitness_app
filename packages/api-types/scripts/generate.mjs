/**
 * Regenerate src/schema.d.ts from the live API's OpenAPI document.
 *
 * One command, used identically by a developer and by CI, so the drift gate
 * checks the same thing a developer would produce:
 *
 *     pnpm --filter @volt/api-types generate
 *
 * It boots the API itself on a scratch port, waits for the document, writes the
 * types and stops the server. Set VOLT_OPENAPI_URL to generate from a server
 * that is already running instead.
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../..');
const OUT = resolve(here, '../src/schema.d.ts');
const PORT = Number(process.env.VOLT_OPENAPI_PORT ?? 8077);
const EXTERNAL = process.env.VOLT_OPENAPI_URL;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  return false;
}

async function main() {
  const url = EXTERNAL ?? `http://127.0.0.1:${PORT}/v1/openapi.json`;
  let server = null;

  if (!EXTERNAL) {
    server = spawn('uv', ['run', 'uvicorn', 'app.main:app', '--port', String(PORT)], {
      cwd: resolve(repo, 'services/api'),
      stdio: 'ignore',
      detached: false,
    });
  }

  try {
    if (!(await waitFor(url))) {
      throw new Error(
        `The API never served ${url}.\n` +
        `Is Postgres up? \`docker compose -f infra/docker-compose.yml up -d\``,
      );
    }

    // openapi-typescript writes to stdout; capture it so we control the file.
    const res = spawnSync('pnpm', ['exec', 'openapi-typescript', url], {
      cwd: resolve(here, '..'),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (res.status !== 0) throw new Error(res.stderr || 'openapi-typescript failed');

    const banner =
      '/**\n' +
      ' * GENERATED FILE — DO NOT EDIT.\n' +
      ' *\n' +
      ' * Produced from the API\'s OpenAPI document by:\n' +
      ' *   pnpm --filter @volt/api-types generate\n' +
      ' *\n' +
      ' * CI regenerates this and fails the build if it differs (D3b). A hand-edit here\n' +
      ' * is drift with extra steps: change the Pydantic schema instead.\n' +
      ' */\n\n';

    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, banner + res.stdout);
    console.log(`wrote ${OUT}`);
  } finally {
    if (server) server.kill('SIGTERM');
  }
}

main().catch((e) => { console.error(String(e.message ?? e)); process.exit(1); });
