# Recipes

This directory contains the canonical recipe data for Speechstack.

## Structure

```
recipes/
├── _template.json                # Skeleton to copy when creating a new recipe
├── prompts/                      # Long-form prompt files in Markdown
│   └── *.md
└── *.json                        # One file per recipe
```

## Naming convention

Recipe filenames must match this pattern: `{framework}-{descriptor}.json`

Good examples:
- `vapi-dental-scheduler.json`
- `retell-saas-onboarding.json`
- `livekit-multilingual-support.json`
- `pipecat-hvac-after-hours.json`

The filename (without `.json`) must exactly equal the recipe's `id` and `slug` fields.

## Required fields

Every recipe must include:
- `id`, `slug`, `title`, `description`
- `framework`
- `use_case` (from `data/use-cases.json`)
- `industry` (from `data/industries.json`)
- `languages` (array of BCP-47 codes)
- `pipeline` (stt, llm, tts, telephony)
- `contributor` (at minimum, the GitHub username)
- `source` (how the recipe entered the directory)
- `created_at`, `updated_at` (ISO 8601)
- `license` (the underlying source's license)

See [`schema/recipe.schema.json`](../schema/recipe.schema.json) for the full spec including optional fields.

## Adding a recipe

1. Copy `_template.json` to a new file with your slug name
2. Fill in the fields
3. If your prompt is long (>200 words), put it in `prompts/{slug}.md` and reference via `prompt_file`
4. Run `npm run validate` from the repo root to check your work
5. Open a PR

See [CONTRIBUTING.md](../CONTRIBUTING.md) at the repo root for more.
