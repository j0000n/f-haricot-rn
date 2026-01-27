# Food Library Seeding Plan (USDA-FDC Focus)

This document refines the “External ingredient data collection” task to fully leverage the USDA FoodData Central (FDC) API for scalable ingredient ingestion, enrichment, and normalization.

## Refined Task: Implement USDA-FDC–Driven Ingredient Ingestion

### Objectives
- Replace manual-only seeding with a USDA-FDC powered ingestion pipeline.
- Ensure all ingredients are normalized into the `foodLibrary` schema (translations, categories, nutrition, storage data).
- Respect API rate limits and support resumable batch processing.
- Use `USDA_API_KEY` from `.env.local` as the sole credential.

### USDA-FDC API Coverage
Leverage the FDC API guide endpoints to maximize completeness:
- **Search foods**: Use `POST /fdc/v1/foods/search` for broad discovery and taxonomy alignment.
- **Get food details**: Use `GET /fdc/v1/food/{fdcId}` for nutrition facts and nutrient breakdowns.
- **Get foods by IDs**: Use `POST /fdc/v1/foods` to hydrate nutrition in bulk.

### Proposed Pipeline
1. **Discovery phase**
   - Start from an internal taxonomy list (e.g., category → seed terms).
   - Use `foods/search` to retrieve candidate foods.
   - Track `fdcId`, `description`, `foodCategory`, and `dataType`.
   - Prefer SR Legacy/Foundation data types when available for nutritional completeness.

2. **Normalization & de-duplication**
   - Normalize names (lowercase, trimmed, remove packaging qualifiers).
   - Map food categories into internal `foodLibrary.category` + translations.
   - De-duplicate by normalized name + category (store USDA IDs as provenance metadata in the generated seed output).

3. **Nutrition enrichment**
   - Hydrate nutrition details using `GET /food/{fdcId}` or bulk `POST /foods` for batched lookups.
   - Map USDA nutrients into `nutritionPer100g` (calories, macros, optional micronutrients).
   - Store all amounts normalized to per 100g (convert where needed using USDA serving weight info).

4. **Storage & shelf life**
   - Apply internal mapping rules by category to infer `storageLocation`, `shelfLifeDays`, and `storageTips`.
   - Maintain an override file (e.g., `data/storageOverrides.json`) for exceptions.

5. **Images, emoji, varieties**
   - Use USDA data for descriptions/taxonomy only; pair with external image sources (Open Food Facts, Unsplash) in a later step.
   - Emoji mapping should be deterministic by category (e.g., `data/emojiMap.ts`).
   - Varieties should be derived from USDA description qualifiers and curated lists.

6. **Translations**
   - Use USDA English descriptions as the canonical English input to the translation pipeline.
   - Ensure EN/FR are human-reviewed; other languages can start as machine translation.

### Rate Limiting & Reliability
- Enforce a configurable per-minute rate limiter with exponential backoff on 429 responses.
- Persist ingestion progress by storing `fdcId` batches and successful IDs locally (e.g., `data/usdaProgress.json`) for resumability.
- Implement `--dry-run` and `--limit` flags for safe staging runs.

### Output Artifacts
- `data/foodLibrarySeed.generated.ts`: primary generated seed dataset.
- `data/usdaSourceIndex.json`: mapping of internal `code` to USDA `fdcId` and metadata for traceability.
- `data/usdaIngestionReport.json`: stats and validation summary from each run.

### Validation & QA
- Sample-based review of nutrition and category mappings (5–10% per category).
- Human review for EN/FR labels for top-frequency items.
- Automated check that all entries include all 8 language keys and nutrition macros.

### Rollout Plan
1. Pilot with 100–200 high-use ingredients using USDA only.
2. Validate in staging with existing UI flows and translation guide coverage.
3. Expand to full USDA ingestion once pilot is accepted.
