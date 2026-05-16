# Speechstack Recipes

> The open-source collection of production-ready recipes for building voice AI agents.

This repository powers [speechstack.com](https://speechstack.com) — a curated directory of real-world voice agent implementations across Vapi, Retell, LiveKit, Cartesia, ElevenLabs, Pipecat, Bland, and the rest of the voice AI stack.

Each recipe is a single JSON file that documents a working voice agent: its use case, the full stack (telephony + STT + LLM + TTS), unit economics, latency, prompt, configuration, and a link to a public source repo or demo.

## Contributing a recipe

Got a voice agent you've built? We'd love to feature it.

1. Copy [`recipes/_template.json`](./recipes/_template.json) to `recipes/your-recipe-slug.json`
2. Fill in the fields (see [`schema/recipe.schema.json`](./schema/recipe.schema.json) for the spec)
3. Open a pull request
4. Our bot will validate it automatically in ~30 seconds
5. We review and merge within 48 hours

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

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
│   └── industries.json         # Controlled vocabulary
├── scripts/
│   ├── validate.js             # Local validation (also runs in CI)
│   └── liveness.js             # URL liveness checks
└── .github/workflows/
    └── validate.yml            # Runs validation on every PR
```

## Validation

Before opening a PR, validate locally:

```bash
npm install
npm run validate
```

This runs the same checks the CI does:
- JSON schema validation
- Recipe ID and slug uniqueness
- Vendor name allowlist
- Use case / industry controlled vocabulary
- URL liveness (with `npm run liveness`)

## License

This repository uses a dual license:

- **Code** (schemas, validators, scripts, workflows) is licensed under [MIT](./LICENSE-CODE).
- **Recipe data** (everything in `recipes/`) is licensed under [CC-BY 4.0](./LICENSE-DATA).

In plain English: you can use the recipes in commercial work as long as you credit Speechstack. You can use the code however you want. See [LICENSE.md](./LICENSE.md) for the explainer.

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
