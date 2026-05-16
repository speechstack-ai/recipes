# Contributing to Speechstack

Thanks for considering a recipe contribution. This guide is short by design — if you've shipped a voice agent, contributing should take under 10 minutes.

## The 5-step flow

1. **Fork this repo.**
2. **Copy `recipes/_template.json`** to `recipes/your-recipe-slug.json`. The slug should be lowercase, hyphen-separated, and follow the pattern `{framework}-{industry-or-use-case}-{descriptor}` — for example: `vapi-dental-scheduler`, `retell-saas-onboarding`, `livekit-multilingual-support`.
3. **Fill in every required field.** Refer to [`schema/recipe.schema.json`](./schema/recipe.schema.json) for the full spec.
4. **Validate locally** (optional but recommended):
   ```bash
   npm install
   npm run validate
   ```
5. **Open a PR.** The CI will run validation automatically. We aim to review within 48 hours.

## What we look for

A recipe is publishable if:

- It documents a **real, working voice agent**. We can tell when something's been built versus theorized.
- It includes a **public source** (GitHub repo, demo video, blog post with code, or a live demo URL).
- The **full stack** is named — telephony, STT, LLM, TTS, framework.
- **Economics** are reported (cost per minute and latency), even as estimates.
- **Vendor names** match the canonical list in [`data/vendors.json`](./data/vendors.json). If your stack uses a vendor not on the list, propose its addition in the same PR.

## What we reject

- Recipes without a public source link
- Sales pages or marketing content
- Recipes that don't name specific vendors ("an LLM," "some TTS provider")
- Duplicate recipes (use the dedup check before submitting)
- Recipes promoting practices banned by jurisdiction (e.g., undisclosed AI calling in markets where disclosure is legally required)

## The prompt file

For recipes with prompts longer than ~200 words, put the prompt in a separate Markdown file at `recipes/prompts/your-recipe-slug.md` and reference it via the `prompt_file` field in your JSON. This keeps the JSON readable in diffs and lets you use full Markdown formatting in the prompt.

For shorter prompts, the inline `raw_prompt` field is fine.

## Attribution

Add your details in the `contributor` field:

```json
"contributor": {
  "github": "your-username",
  "twitter": "your-handle",
  "name": "Your Name"
}
```

We'll credit you on the recipe's public page on speechstack.com.

## Updating an existing recipe

Open a PR that modifies the recipe's JSON file. Increment the `updated_at` timestamp. If you're not the original contributor, add yourself to a `contributors` array (we'll add the schema field if multiple-contributor recipes become common).

## Questions

Open an issue or DM [@speechstack](https://twitter.com/speechstack). We're responsive.

## Code of conduct

Be kind. Don't be a jerk in PR reviews. We reserve the right to close PRs and block users who can't.
