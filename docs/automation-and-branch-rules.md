# Automation vs open-source contributions

The `main` branch uses a repository ruleset that **requires pull requests**. That is intentional for external contributors. Internal automation should not open a daily PR for generated files.

## Recommended ruleset configuration

Open: **Settings → Rules → Rulesets → `rules`**  
(or https://github.com/speechstack-ai/recipes/rules/16490154)

### Keep these rules (default branch)

| Rule | Purpose |
|------|---------|
| **Require a pull request before merging** | Fork PRs and collaborator changes go through review (0 approvals is fine). |
| **Block force pushes** (`non_fast_forward`) | Prevents rewriting `main` history. |
| **Restrict deletions** | Prevents deleting `main`. |

### Bypass list (who can push directly to `main`)

| Actor | Bypass mode | Why |
|-------|-------------|-----|
| **GitHub Actions** | Always allow | Lets `GITHUB_TOKEN` in `.github/workflows/*` commit generated files (`data/github-metrics.json`, etc.). |
| *(optional)* **Repository admin** | Always allow | Emergency fixes by org owners only. |

Do **not** add **Write** or **Maintain** to the bypass list. Anyone with write access would be able to skip PRs.

Add **GitHub Actions** from the bypass picker in the UI. The REST API uses a different integration reference and may return `422` if added manually by app id.

### Actions settings

**Settings → Actions → General → Workflow permissions**

- **Read and write permissions** for `GITHUB_TOKEN`
- Enable **Allow GitHub Actions to create and approve pull requests** (helps when rules interact with PR flows)

## What this achieves

| Actor | Push to `main` |
|-------|----------------|
| External contributor (fork PR) | Via PR only |
| Collaborator with write | Via PR only |
| GitHub Actions workflow on `main` | Direct push allowed (bypass) |
| Admin (if listed in bypass) | Direct push allowed |

## Repos that sync from here

When `data/**` changes on `main`, the **Notify web** workflow dispatches `recipes-updated` to `speechstack-ai/web`. No extra step unless that workflow failed.

Apply the same pattern on **speechstack-ai/web** if you add branch rules there: bypass **GitHub Actions** only, keep PR requirement for humans.

## Troubleshooting `GH013`

If enrich or sync jobs fail with *Changes must be made through a pull request*:

1. Confirm **GitHub Actions** is on the bypass list (not empty).
2. Confirm workflow permissions are **read and write**.
3. Re-run **Enrich GitHub metrics** or **Sync recipes** from the Actions tab.

## Optional: machine-user PAT (not recommended)

If bypassing via GitHub Actions is unavailable, use a fine-grained PAT stored as `RECIPES_BOT_PAT` with contents write and add that user to the bypass list. Prefer GitHub Actions bypass so you do not store a long-lived PAT.
