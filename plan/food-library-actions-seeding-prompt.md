# Prompt for Codex: Food Library and Actions Seeding Plan

## Context

We have a React Native recipe app using:
- **Food Library**: Convex table (`foodLibrary`) storing ingredients with translations in 8 languages (en, es, zh, fr, ar, ja, vi, tl)
- **Actions/Techniques**: URES encoding system with action codes (A.XX.XXX) and technique codes (T.XX.XXX) defined in `plan/actions.json`
- **Translation Guides**: System for translating encoded recipe steps (`translationGuides` table seeded from `data/translationGuideSeed.ts`)

## Current Problem

When recipes are ingested via `convex/recipes.ts::ingestUniversal`:
1. Missing ingredients create **provisional entries** via `convex/foodLibrary.ts::ensureProvisional` with only English names
2. These provisional entries lack proper translations, causing mixed English/translated copy in the UI
3. Actions/techniques may be missing from translation guides, causing similar issues in recipe step displays

## Requirements

Based on stakeholder input:

1. **Scope**: Seed everything comprehensively upfront (all ingredients + all actions)
2. **Data Source**: Use external APIs (food databases, translation services)
3. **Provisional Handling**: Delete existing provisional entries and recreate them properly with full translations
4. **Translation Quality**: Hybrid approach - machine translation with human review for common items
5. **Actions Priority**: Seed ALL actions from `plan/actions.json` (not just used ones)
6. **Ingredient Completeness**: Complete entries including:
   - Translations (all 8 languages)
   - Category + category translations
   - Nutrition data (per 100g)
   - Shelf life (days)
   - Storage location (pantry/fridge/freezer/spicecabinet)
   - Storage tips
   - Varieties (with translations)
   - Images/emoji
   - Aliases
7. **Language Priority**: English and French must be 100% accurate day one. Other languages (es, zh, ar, ja, vi, tl) can be less careful initially
8. **Validation**: Sample-based review (review subset, auto-approve similar)
9. **Ongoing Maintenance**: Automated process to prevent future mixed-language issues
10. **Rollout**: Test with small subset first, then expand

## Key Files to Understand

- `convex/schema.ts`: Food library schema (lines 178-274)
- `convex/foodLibrary.ts`: Food library mutations/queries, `ensureProvisional` function
- `data/foodLibrarySeed.ts`: Current seed data (1339+ lines)
- `convex/recipes.ts`: Recipe ingestion, creates provisional entries (lines 3170-3235)
- `plan/actions.json`: Complete actions catalog
- `data/translationGuideSeed.ts`: Current translation guide seed data
- `convex/translationGuides.ts`: Translation guide mutations/queries
- `types/food.ts`: TypeScript interfaces for food library items

## Technical Constraints

- Food library uses codes like `1.11.003` (namespace.subcategory.item)
- Actions use codes like `A.01.001` (action namespace.action number)
- Techniques use codes like `T.03.003` (technique namespace.technique number)
- Translations stored as objects: `{ en: { singular: "...", plural: "..." }, ... }`
- Provisional entries have `isProvisional: true` flag
- Seed functions should be idempotent (upsert by code)

## Questions to Address in Plan

1. **Data Collection Strategy**: How to gather ingredient data from external APIs? Which APIs? How to handle rate limits?
2. **Translation Pipeline**: How to get translations for all 8 languages? Which translation service? How to ensure EN/FR quality?
3. **Actions Translation**: How to translate action codes? Should actions have the same translation structure as ingredients?
4. **Data Enrichment**: How to get nutrition data, shelf life, storage info? Single API or multiple sources?
5. **Image/Asset Collection**: How to source images for ingredients? Emoji assignment strategy?
6. **Varieties Handling**: How to identify and translate varieties for each ingredient?
7. **Migration Script**: How to identify and delete provisional entries? How to map them to proper codes?
8. **Validation Framework**: What sampling strategy? How to flag entries needing review?
9. **Automation**: How to prevent future provisional entries? Should `ensureProvisional` be updated to fetch translations?
10. **Testing Strategy**: What subset to test with? How to validate translations work in UI?
11. **Rollback Plan**: How to rollback if seeding causes issues?
12. **Performance**: How to handle large batch inserts? Should seeding be done in chunks?

## Expected Deliverables

The plan should include:
- Step-by-step implementation approach
- Data sources and APIs to use
- Scripts/functions to create
- Migration strategy for provisional entries
- Validation and quality control process
- Automation strategy for ongoing maintenance
- Testing and rollout plan
- Risk mitigation strategies

## Success Criteria

- All ingredients in food library have proper translations (EN/FR 100%, others reasonable)
- All actions from `plan/actions.json` have translations in translation guides
- No more mixed English/translated copy in UI
- Provisional entries are eliminated or properly translated
- Automated process prevents future issues
- System can handle new ingredients/actions gracefully

---

**Please create a comprehensive, actionable plan that addresses all these requirements and questions.**
