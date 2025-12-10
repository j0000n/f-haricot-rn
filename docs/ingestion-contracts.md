# Universal Recipe Ingestion Contracts

The `recipes.ingestUniversal` Convex action ingests text, link, or oEmbed payloads and persists URES-aligned recipes with deterministic decoding support.

## Inputs
- **sourceType** (required): one of `website | audio | text | photograph | instagram | tiktok | pinterest | youtube | cookbook | magazine | newspaper | recipe_card | handwritten | voice_note | video | facebook | twitter | reddit | blog | podcast | other`.
- **sourceUrl** (optional): canonical URL for auditability.
- **rawText / extractedText** (optional): any already-extracted recipe body or OCR text.
- **oembedPayload** (optional): raw oEmbed/OpenGraph JSON for the source.
- **socialMetadata** (optional): `{ title?: string; description?: string }` used to disambiguate recipe intent.

## Outputs
- Inserts a recipe document containing:
  - Localized `recipeName` / `description` and a single-language fallback `steps` array (with optional timing/temperature detai
ls).
  - `encodedSteps` + `encodingVersion` to guarantee decoder determinism.
  - Structured ingredients with validation status, normalized metric quantities, and original display strings.
  - Timing fields (`prepTimeMinutes`, `cookTimeMinutes`, `totalTimeMinutes`) and temperatures when provided.
  - Source metadata (`source`, `sourceUrl`, `attribution`) for audit trails.
- Persists a computed `nutritionProfiles` record with per-serving macros based on the food library nutrition metadata.
- Returns `{ recipeId, encodingVersion, validationSummary }` so callers can surface review queues.

## Sample cURL
```bash
curl -X POST \
  -H "Authorization: Bearer $CONVEX_DEPLOY_KEY" \
  -H "Content-Type: application/json" \
  "https://YOUR-CONVEX-DEPLOYMENT.convex.site/api/recipes/ingestUniversal" \
  -d '{
    "sourceType": "website",
    "sourceUrl": "https://example.com/test-recipe",
    "rawText": "Sear chicken thighs with onions, then steam rice in the pan.",
    "socialMetadata": {"title": "Pantry Allium Pilaf"}
  }'
```

## Validation and review
- Ingredient validations flag `missing` or `ambiguous` food codes and store suggestions based on namespace proximity.
- Admins can call `recipes.listIngredientValidationIssues` to surface review queues and `recipes.overrideIngredientMatch` to correct individual entries.
- Translation overrides live in the `translationGuides` table and can be edited via `translationGuides.overrideTranslation` to keep decoding deterministic across languages.

## Rendering guidance
- Use `utils/decodeEncodedSteps.decodeEncodedSteps` to render runner/cards/voice/shopping modes, falling back to stored free-text steps when `encodedSteps` is absent.
- When a localized string is missing, default to English before displaying the encoded instruction to maintain a consistent user experience.
