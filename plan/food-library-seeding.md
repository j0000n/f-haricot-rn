## Food library seeding plan

This plan keeps the Convex `foodLibrary` table as the single source of truth and ensures every downstream pipeline (inventory capture, recipe matching) pulls from the same data.

### 1) Prepare the source data
- Expand `data/foodLibrarySeed.ts` until it contains every canonical item (including categories, translations, shelf life, storage location, nutrition, density hints, and varieties). Use codes/namespaces that match any external data you need to import so updates stay idempotent.
- Keep translations populated at least for `en` and mirror the value to other languages when translations are missing; the transformer in `convex/foodLibrary.ts` fills blanks but upstream parity reduces drift.
- Validate that `code` values are unique and stable; use `rg "code:" data/foodLibrarySeed.ts` to spot duplicates before shipping.

### 2) Seed the Convex table
- Run the Convex function `foodLibrary.seed` once per environment (dev, staging, prod). It will upsert by `code`, so reruns are safe:
  - From the Convex dashboard: call `foodLibrary.seed` with empty args.
  - Or via CLI/script: `convex functions run foodLibrary.seed`.
- Confirm row counts match the seed length via `foodLibrary.listAll`.

### 3) Keep inventory aligned to the library
- `inventory.mapSpeechToInventory` and `inventory.applyInventoryUpdates` now validate item codes and varieties against the library and auto-create provisional entries when a code is missing. Keep this behavior by running `foodLibrary.seed` before enabling new ingest paths.
- If you add new varieties to an item, re-run `foodLibrary.seed` so the variety validation map stays current for both voice mapping and manual inventory updates.

### 4) Recipe pipeline checks
- `recipes.ts` consumes the library to determine shelf life and match inventory codes. After seeding, run a quick smoke check (e.g., open the personalized rails) to ensure `readyToCook` and scoring paths see the updated shelf-life data.

### 5) Ongoing maintenance
- When adding new items at runtime (e.g., via `ensureProvisional`), schedule periodic reviews to promote or merge them back into `data/foodLibrarySeed.ts`, then rerun `foodLibrary.seed` so long-lived data stays normalized.

