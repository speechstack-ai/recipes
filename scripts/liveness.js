#!/usr/bin/env node
/**
 * Speechstack recipe URL liveness check.
 *
 * For each recipe, HEAD-requests github_source_url and demo_url.
 * Fails on 404. Warns on 4xx/5xx. Skips on network error (might be transient).
 *
 * Designed to run in CI on PR. Should NOT run on every push to main
 * (would create noise from third-party downtime).
 */

const fs = require('fs');
const path = require('path');

const RECIPES_DIR = path.join(__dirname, '..', 'recipes');
const TIMEOUT_MS = 8000;

const recipeFiles = fs
  .readdirSync(RECIPES_DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'));

const errors = [];
const warnings = [];

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Speechstack-Recipe-Validator/1.0 (+https://speechstack.com)'
      }
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

(async () => {
  for (const file of recipeFiles) {
    const recipe = JSON.parse(
      fs.readFileSync(path.join(RECIPES_DIR, file), 'utf8')
    );

    for (const field of ['github_source_url', 'demo_url']) {
      const url = recipe[field];
      if (!url) continue;

      const result = await checkUrl(url);

      if (result.error) {
        warnings.push(`[${file}] ${field} unreachable (${result.error}): ${url}`);
      } else if (result.status === 404) {
        errors.push(`[${file}] ${field} returns 404: ${url}`);
      } else if (result.status >= 400) {
        warnings.push(
          `[${file}] ${field} returns ${result.status}: ${url}`
        );
      }
    }
  }

  if (warnings.length) {
    console.log('\n⚠️  Liveness warnings:');
    for (const w of warnings) console.log('  ' + w);
  }

  if (errors.length) {
    console.log('\n❌ Liveness check failed:');
    for (const e of errors) console.log('  ' + e);
    process.exit(1);
  }

  console.log(`\n✅ All URLs reachable across ${recipeFiles.length} recipe(s).`);
  process.exit(0);
})();
