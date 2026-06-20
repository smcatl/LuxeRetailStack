/**
 * Fetches per-site settings from stacksites-admin and writes
 * src/data/site-settings.json. Runs in the prebuild chain before
 * sync-affiliates.mjs. Falls back to existing local file if the
 * API is unreachable (so builds never break on network issues).
 *
 * Required env vars:
 *   SETTINGS_API_URL  — e.g. https://stacksites-admin.vercel.app/api/sites/<slug>/settings
 *
 * Optional env vars:
 *   SETTINGS_API_KEY  — Bearer token if the endpoint is gated
 *
 * Same pattern as scripts/sync-affiliates.mjs. Copy this file verbatim into
 * each site repo at scripts/sync-site-settings.mjs.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outPath = resolve(root, 'src/data/site-settings.json');

const apiUrl = process.env.SETTINGS_API_URL;
const apiKey = process.env.SETTINGS_API_KEY;

if (!apiUrl) {
  console.log('sync-site-settings: SETTINGS_API_URL not set, skipping sync');
  process.exit(0);
}

try {
  const headers = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(apiUrl, { headers });
  if (!res.ok) throw new Error(`API returned ${res.status}: ${await res.text()}`);

  const { settings } = await res.json();
  if (!settings) throw new Error('response missing { settings }');

  await mkdir(resolve(root, 'src/data'), { recursive: true });
  await writeFile(outPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  console.log(`sync-site-settings: wrote ${outPath}`);
} catch (err) {
  console.warn(`sync-site-settings: API fetch failed (${err.message}), keeping existing local file`);
}
