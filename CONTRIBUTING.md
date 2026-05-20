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

## The 4-criteria template definition

This is the scope bar for the directory. Every recipe PR is checked against all four. Failing any one is grounds for rejection — not "we'll fix it later," not "merge as draft."

1. **Schema-able artifact** — every field of the JSON schema can be filled (framework, stack, prompt, config, source URL). No mandatory narrative prose.
2. **Forkable or copyable** — a builder can clone something concrete: config block, prompt, JSON export, GitHub repo, Vapi assistant ID, etc.
3. **Specific named outcome** — solves one named use case ("AI receptionist for dental practices"; "post-meeting summary pipeline from Granola to Notion"). Not "how to think about voice AI."
4. **Multi-component stack** — at least 2 named tools/services wired together.

If your submission is a single-tool walkthrough, an opinion piece, a concept explainer, or a closed-runtime no-code flow with no exportable artifact, it fails one of these — please don't open the PR. See `SpeechStack Positioning.md` (internal) for the full out-of-scope list.

## Title rules

The recipe `title` describes the **use case** in plain words. The stack, framework, and customer brand are shown elsewhere on the recipe card — keep them out of the title.

- **No vendor names.** No `Vapi`, `Retell`, `LiveKit`, `Pipecat`, `ElevenLabs`, `Deepgram`, `Cartesia`, `Twilio`, `Claude`, `GPT`, etc. The validator checks the title against [`data/vendors.json`](./data/vendors.json) and rejects any brand match.
- **No em dashes or en dashes.** Use a colon, or rewrite the title.
- **No customer or persona names.** "Amy at VAPI Health Clinic" and "Charlotte at TripleTen" belong in the description, not the title.
- **Lead with the use case.** "Dental Office Receptionist", not "Deepgram Dental Office Receptionist (Twilio + Voice Agent API)".

Good examples:

- `Dental Office Receptionist`
- `Drive-Thru Order Taker`
- `Healthcare Appointment Scheduler`
- `Outbound Car Sales Agent`
- `Tier-1 Support with Warm Transfer`

The `id` and `slug` still encode the framework — that's where vendor scoping lives.

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
