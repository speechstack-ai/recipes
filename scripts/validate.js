#!/usr/bin/env node
/**
 * Speechstack recipe validation.
 *
 * Runs:
 *   1. JSON schema validation (via AJV)
 *   2. ID and slug uniqueness
 *   3. ID-must-match-filename check
 *   4. Vendor allowlist check
 *   5. Use case / industry controlled vocabulary check
 *   6. Prompt file existence check
 *   7. Title rules (no em/en dashes, no vendor brand names)
 *
 * Exits 0 on success, 1 on failure. Designed to run both locally and in CI.
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ROOT = path.join(__dirname, '..');
const RECIPES_DIR = path.join(ROOT, 'recipes');
const PROMPTS_DIR = path.join(RECIPES_DIR, 'prompts');
const SCHEMA_PATH = path.join(ROOT, 'schema', 'recipe.schema.json');
const VENDORS_PATH = path.join(ROOT, 'data', 'vendors.json');
const USE_CASES_PATH = path.join(ROOT, 'data', 'use-cases.json');
const INDUSTRIES_PATH = path.join(ROOT, 'data', 'industries.json');

const errors = [];
const warnings = [];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const schema = readJson(SCHEMA_PATH);
const vendors = readJson(VENDORS_PATH);
const useCases = readJson(USE_CASES_PATH);
const industries = readJson(INDUSTRIES_PATH);

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

// Brand tokens derived from data/vendors.json. We take the first space-delimited
// word of each vendor entry, then the first hyphen chunk of that word — so
// "Deepgram Nova-3" → "Deepgram" and "GPT-4o-mini" → "GPT". `Custom` and `Web`
// are sentinel values, not brands, so we skip them.
const VENDOR_BRAND_SKIP = new Set(['Custom', 'Web']);

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getVendorBrandTokens(vendorsData) {
  const tokens = new Set();
  for (const category of Object.values(vendorsData)) {
    if (!Array.isArray(category)) continue;
    for (const value of category) {
      if (typeof value !== 'string') continue;
      const firstWord = value.split(/\s+/)[0] || '';
      const brand = firstWord.split('-')[0];
      if (brand && !VENDOR_BRAND_SKIP.has(brand)) tokens.add(brand);
    }
  }
  return [...tokens];
}

function checkTitleRules(title, brandTokens) {
  const issues = [];
  if (/[—–]/.test(title)) {
    issues.push(
      'title contains an em or en dash — use a colon or rewrite the title. ' +
        'Good titles describe the use case in plain words.'
    );
  }
  for (const token of brandTokens) {
    const re = new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i');
    if (re.test(title)) {
      issues.push(
        `title contains vendor name "${token}" — keep titles focused on the use case. ` +
          'The stack is already shown elsewhere on the recipe card.'
      );
    }
  }
  return issues;
}

const brandTokens = getVendorBrandTokens(vendors);

const recipeFiles = fs
  .readdirSync(RECIPES_DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'));

const seenIds = new Set();
const seenSlugs = new Set();

for (const file of recipeFiles) {
  const filePath = path.join(RECIPES_DIR, file);
  const baseName = file.replace(/\.json$/, '');
  let recipe;

  try {
    recipe = readJson(filePath);
  } catch (e) {
    errors.push(`[${file}] Invalid JSON: ${e.message}`);
    continue;
  }

  // 1. Schema validation
  if (!validate(recipe)) {
    for (const err of validate.errors) {
      errors.push(`[${file}] Schema: ${err.instancePath || '/'} ${err.message}`);
    }
    continue;
  }

  // 2. ID must match filename
  if (recipe.id !== baseName) {
    errors.push(
      `[${file}] ID mismatch: file is "${baseName}.json" but id is "${recipe.id}". They must match.`
    );
  }

  // 3. ID uniqueness
  if (seenIds.has(recipe.id)) {
    errors.push(`[${file}] Duplicate id: "${recipe.id}" is used in multiple files.`);
  }
  seenIds.add(recipe.id);

  // 4. Slug uniqueness
  if (seenSlugs.has(recipe.slug)) {
    errors.push(`[${file}] Duplicate slug: "${recipe.slug}" is used in multiple files.`);
  }
  seenSlugs.add(recipe.slug);

  // 5. Vendor allowlist
  if (!vendors.framework.includes(recipe.framework)) {
    errors.push(
      `[${file}] Unknown framework "${recipe.framework}". Allowed: ${vendors.framework.join(', ')}. ` +
        `To add a new framework, edit data/vendors.json in the same PR.`
    );
  }
  if (recipe.pipeline) {
    for (const layer of ['stt', 'llm', 'tts', 'telephony']) {
      const value = recipe.pipeline[layer];
      if (value === null && layer === 'telephony') continue;
      if (!vendors[layer].includes(value)) {
        errors.push(
          `[${file}] Unknown ${layer} vendor "${value}". Allowed values are in data/vendors.json. ` +
            `To add a new vendor, edit data/vendors.json in the same PR.`
        );
      }
    }
  }

  // 6. Controlled vocabularies
  if (!useCases.includes(recipe.use_case)) {
    errors.push(
      `[${file}] Unknown use_case "${recipe.use_case}". Allowed: ${useCases.join(', ')}.`
    );
  }
  if (!industries.includes(recipe.industry)) {
    errors.push(
      `[${file}] Unknown industry "${recipe.industry}". Allowed: ${industries.join(', ')}.`
    );
  }

  // 7. Title rules: no em/en dashes, no vendor brand names
  if (typeof recipe.title === 'string') {
    for (const issue of checkTitleRules(recipe.title, brandTokens)) {
      errors.push(`[${file}] ${issue}`);
    }
  }

  // 8. Prompt file existence
  if (recipe.prompt_file) {
    const promptPath = path.join(RECIPES_DIR, recipe.prompt_file);
    if (!fs.existsSync(promptPath)) {
      errors.push(
        `[${file}] prompt_file references "${recipe.prompt_file}" but the file does not exist.`
      );
    }
  }

  // 9. Either raw_prompt OR prompt_file should be present (warning, not error)
  if (!recipe.raw_prompt && !recipe.prompt_file) {
    warnings.push(
      `[${file}] No raw_prompt or prompt_file. The recipe will be missing prompt content on the site.`
    );
  }

  // 10. Both is suspicious
  if (recipe.raw_prompt && recipe.prompt_file) {
    warnings.push(
      `[${file}] Both raw_prompt and prompt_file are set. The site will prefer prompt_file.`
    );
  }
}

// Report
if (warnings.length) {
  console.log('\n⚠️  Warnings:');
  for (const w of warnings) console.log('  ' + w);
}

if (errors.length) {
  console.log('\n❌ Validation failed:');
  for (const e of errors) console.log('  ' + e);
  console.log(`\n${errors.length} error(s) across ${recipeFiles.length} recipe(s).`);
  process.exit(1);
}

console.log(`\n✅ All ${recipeFiles.length} recipe(s) valid.`);
process.exit(0);
