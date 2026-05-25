#!/usr/bin/env node
/**
 * Fetch GitHub stars/watchers for recipe source repos and write data/github-metrics.json.
 *
 * - Reads recipes/*.json and parses github_source_url → owner/repo.
 * - Deduplicates repos (many recipes may point at the same repository).
 * - Fetches stats via GitHub GraphQL in batches (or REST fallback).
 * - Writes a sidecar keyed by recipe id (does not mutate recipe JSON files).
 *
 * Env:
 *   GITHUB_TOKEN — optional but strongly recommended (5k req/hr vs 60 unauthenticated).
 *
 * Usage: npm run enrich-github
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const RECIPES_DIR = path.join(ROOT, "recipes");
const OUTPUT_PATH = path.join(ROOT, "data", "github-metrics.json");

const BATCH_SIZE = 40;
const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_REST = "https://api.github.com/repos";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * @param {string | null | undefined} url
 * @returns {{ owner: string; name: string } | null}
 */
function parseGitHubRepoUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const name = parts[1];
    if (!owner || !name || name.endsWith(".git")) return null;
    return { owner, name };
  } catch {
    return null;
  }
}

function repoKey(owner, name) {
  return `${owner}/${name}`;
}

function log(msg) {
  console.log(`[enrich-github-metrics] ${msg}`);
}

function warn(msg) {
  console.warn(`[enrich-github-metrics] ⚠ ${msg}`);
}

/**
 * @param {Array<{ owner: string; name: string }>} repos
 * @param {string | undefined} token
 */
async function fetchReposGraphQL(repos, token) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json",
    "User-Agent": "speechstack-recipes-enrich",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const fields = repos
    .map((r, i) => {
      const alias = `r${i}`;
      return `${alias}: repository(owner: "${r.owner}", name: "${r.name}") {
        stargazerCount
        watchers { totalCount }
        forkCount
        pushedAt
        nameWithOwner
      }`;
    })
    .join("\n");

  const query = `query { ${fields} }`;
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(
      `GraphQL errors: ${body.errors.map((e) => e.message).join("; ")}`,
    );
  }

  const data = body.data ?? {};
  const out = new Map();

  for (let i = 0; i < repos.length; i++) {
    const key = repoKey(repos[i].owner, repos[i].name);
    const node = data[`r${i}`];
    if (!node) {
      warn(`no data for ${key}`);
      continue;
    }
    out.set(key, {
      stars: node.stargazerCount ?? 0,
      watchers: node.watchers?.totalCount ?? 0,
      forks: node.forkCount ?? 0,
      repoPushedAt: node.pushedAt ?? null,
      repo: node.nameWithOwner ?? key,
    });
  }

  return out;
}

/**
 * @param {{ owner: string; name: string }} repo
 * @param {string | undefined} token
 */
async function fetchRepoREST(repo, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "speechstack-recipes-enrich",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${GITHUB_REST}/${repo.owner}/${repo.name}`;
  const res = await fetch(url, { headers });
  if (res.status === 404) {
    warn(`repo not found: ${repo.owner}/${repo.name}`);
    return null;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST ${res.status} for ${repo.owner}/${repo.name}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    stars: data.stargazers_count ?? 0,
    watchers: data.subscribers_count ?? 0,
    forks: data.forks_count ?? 0,
    repoPushedAt: data.pushed_at ?? null,
    repo: `${repo.owner}/${repo.name}`,
  };
}

/**
 * @param {Array<{ owner: string; name: string }>} repos
 * @param {string | undefined} token
 */
async function fetchAllRepoStats(repos, token) {
  const stats = new Map();

  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    const batch = repos.slice(i, i + BATCH_SIZE);
    log(`fetching batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} repos)…`);

    try {
      const batchStats = await fetchReposGraphQL(batch, token);
      for (const [k, v] of batchStats) stats.set(k, v);
    } catch (err) {
      warn(`GraphQL batch failed (${err.message}); falling back to REST`);
      for (const repo of batch) {
        const key = repoKey(repo.owner, repo.name);
        if (stats.has(key)) continue;
        try {
          const row = await fetchRepoREST(repo, token);
          if (row) stats.set(key, row);
        } catch (restErr) {
          warn(`${key}: ${restErr.message}`);
        }
        await sleep(150);
      }
    }
  }

  return stats;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    warn("GITHUB_TOKEN not set — unauthenticated rate limits apply (60 req/hr)");
  }

  const recipeFiles = fs
    .readdirSync(RECIPES_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"));

  /** @type {Map<string, { id: string; owner: string; name: string }>} */
  const recipeToRepo = new Map();
  /** @type {Map<string, { owner: string; name: string }>} */
  const uniqueRepos = new Map();

  for (const file of recipeFiles) {
    const recipe = readJson(path.join(RECIPES_DIR, file));
    const parsed = parseGitHubRepoUrl(recipe.github_source_url);
    if (!parsed) continue;
    const key = repoKey(parsed.owner, parsed.name);
    recipeToRepo.set(recipe.id, { id: recipe.id, owner: parsed.owner, name: parsed.name });
    if (!uniqueRepos.has(key)) uniqueRepos.set(key, parsed);
  }

  log(`found ${recipeToRepo.size} recipe(s) with GitHub URLs (${uniqueRepos.size} unique repos)`);

  const repos = [...uniqueRepos.values()];
  const repoStats = await fetchAllRepoStats(repos, token);
  const fetchedAt = new Date().toISOString();

  /** @type {Record<string, object>} */
  const byRecipeId = {};

  for (const [recipeId, { owner, name }] of recipeToRepo) {
    const key = repoKey(owner, name);
    const stats = repoStats.get(key);
    if (!stats) {
      byRecipeId[recipeId] = {
        stars: 0,
        watchers: 0,
        forks: 0,
        repoPushedAt: null,
        fetchedAt,
        repo: key,
      };
      continue;
    }
    byRecipeId[recipeId] = { ...stats, fetchedAt };
  }

  const output = {
    version: 1,
    fetchedAt,
    recipes: byRecipeId,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const json = JSON.stringify(output, null, 2) + "\n";
  fs.writeFileSync(OUTPUT_PATH, json);
  log(`wrote ${Object.keys(byRecipeId).length} entries → ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
