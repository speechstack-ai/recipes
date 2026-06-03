# Speechstack Recipes

> 94+ production-ready voice AI agent stacks. Every recipe ships with real prompts, measured latency, and per-minute unit economics.

🌐 **Browse the directory:** [speechstack.com](https://speechstack.com)

📊 **What's inside:** 94+ recipes · 10+ frameworks (Vapi, Pipecat, LiveKit, Retell, Bland, Vocode) · 8 STT vendors (Deepgram, AssemblyAI, Whisper, Google, Speechmatics…) · 7 TTS vendors (ElevenLabs, Cartesia, PlayHT, Azure, Resemble…) · 12+ industries

## What's a recipe?

A working voice agent documented as a single JSON file:

- **Framework** (Vapi / Pipecat / LiveKit / Retell / Bland / Vocode / …)
- **STT** + **LLM** + **TTS** + **Telephony**
- The actual system prompt (long-form Markdown)
- Measured latency (P50/P90 where known)
- Per-minute cost breakdown
- A link to public source code or a live demo

If it doesn't ship all of that, it's a blog post link — not a recipe.

## Scope

**SpeechStack covers voice + AI templates that combine 2+ tools for a specific outcome. We do not cover general AI tools.**

Every recipe must satisfy the [4-criteria template definition](./CONTRIBUTING.md#the-4-criteria-template-definition): schema-able artifact, forkable or copyable, specific named outcome, multi-component stack. PRs that don't clear the bar are closed, not merged "as drafts."

## Contributing a recipe

Got a voice agent you've built? We'd love to feature it.

1. Copy [`recipes/_template.json`](./recipes/_template.json) to `recipes/your-recipe-slug.json`
2. Fill in the fields (see [`schema/recipe.schema.json`](./schema/recipe.schema.json) for the spec)
3. Open a pull request
4. Our bot validates it automatically in ~30 seconds
5. We review and merge within 48 hours

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide. New contributors: check the [`good first issue`](https://github.com/speechstack-ai/recipes/labels/good%20first%20issue) label for recipes the community has specifically requested.

## What makes a good recipe

✅ **A real, working voice agent** — not a hello-world
✅ **Anchored to a specific use case** — "dental front desk," not "voice agent"
✅ **Documents the full stack** — telephony + STT + LLM + TTS + framework
✅ **Includes a public source** — GitHub repo, demo video, or live URL
✅ **Reports economics** — estimated $/min and latency, where known

Anything less is a blog post link, not a recipe. We hold this line so the directory stays useful.

## Repo structure

```
speechstack-recipes/
├── recipes/                    # The recipe JSON files
│   ├── _template.json          # Template for new submissions
│   ├── prompts/                # Long-form prompt content (Markdown)
│   └── *.json                  # One file per recipe
├── schema/
│   └── recipe.schema.json      # JSON Schema (enforced on every PR)
├── data/
│   ├── vendors.json            # Allowed vendor names per stack layer
│   ├── use-cases.json          # Controlled vocabulary
│   ├── industries.json         # Controlled vocabulary
│   └── github-metrics.json     # Generated: stars/watchers per recipe (CI)
├── scripts/
│   ├── validate.js             # Local validation (also runs in CI)
│   ├── liveness.js             # URL liveness checks
│   └── enrich-github-metrics.js # Refresh GitHub popularity sidecar
└── .github/workflows/
    └── validate.yml            # Runs validation on every PR
```

## Validation

Before opening a PR, validate locally:

```bash
npm install
npm run validate
```

This runs the same checks CI does:
- JSON schema validation
- Recipe ID and slug uniqueness
- Vendor name allowlist
- Use case / industry controlled vocabulary
- URL liveness (with `npm run liveness`)

## License

This repository uses a dual license:

- **Code** (schemas, validators, scripts, workflows) is [MIT](./LICENSE-CODE).
- **Recipe data** (everything in `recipes/`) is [CC-BY 4.0](./LICENSE-DATA).

Plain English: use the code however you want; use the recipes in commercial work as long as you credit Speechstack. See [LICENSE.md](./LICENSE.md) for the explainer.

## Stats

This will populate automatically as recipes are added.

- Total recipes: _generated at build_
- Vendors covered: _generated at build_
- Industries: _generated at build_
- Last updated: _generated at build_

## Links

- 🌐 [speechstack.com](https://speechstack.com)
- 🐦 [@speechstack](https://twitter.com/speechstack)
- 📬 [hello@speechstack.com](mailto:hello@speechstack.com)
