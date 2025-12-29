# Rail + Card Combo Audit

## Scope
Audit the rail/card pairings used in the app, their data inputs, and the degree to which card customization reflects the profile data defined in `app/profile.tsx`. The focus is on recipe discovery rails, inventory rails, and auxiliary rails/cards shown on the Home tab.

## Profile Data Inventory (`app/profile.tsx`)
The profile screen exposes or edits the following user/household data that should influence cards/rails where applicable:

- **Household context**: household membership, invite code, pending members, children (name + allergies).
- **Personal allergies**: saved to `user.allergies`.
- **Nutrition goals & display preferences**: preset, categories, per-metric targets, tracked metrics, display preferences (`showPerMealTargets`, `showProteinOnly`, `hideCalories`, `showWarnings`, `mealCount`).
- **Appearance/theme**: theme selection via `ThemeSwitcher`.
- **Language**: `LanguageSwitcher` updates i18n language.
- **Accessibility preferences**: base text size, high contrast mode, dyslexia font, motion preference.

## Rail + Card Combos
### Inventory rails (`components/Rail.tsx` → `CompactCard`, `StandardCard`, `DetailedCard`)
**Where used**: Home tab (`app/(tabs)/index.tsx`) for Fresh Produce, Pantry Staples, and Proteins.

**Data inputs**:
- Rails receive `items: { id, data }[]` from `useInventoryDisplay`.
- Card fields expected:
  - `displayName`, `displayVariety`, `quantity`, `purchaseDate`, `categoryName`, `storageLocation`, `shelfLifeDays`, `imageUrl`.

**Profile alignment**:
- **Theme/appearance**: uses `ThemeTokens` for colors, typography, padding, shadows.
- **Accessibility**: respects text size/font tokens (assuming token updates flow from accessibility settings).
- **Language**: hard-coded English labels (`Qty`, `Category`, `Location`, `Purchased`) and `toLocaleDateString('en-US')` in `StandardCard`/`DetailedCard` are not localized.

### Recipe rails (`components/RecipeRail.tsx` → `RecipeCard` variants)
**Where used**: Home tab rails for Featured/For You, Ready to Cook, Quick & Easy, Favorite Cuisines, Household Compatible.

**Data inputs**:
- `RecipeRail` takes `recipes: Recipe[]`, `variant`, `userInventory`.
- `RecipeCard` renders:
  - Translated name/description (based on i18n language).
  - Image via `convex/fileUrls.getRecipeCardImageUrl`.
  - Match badges from inventory comparison.
  - Servings, time, description (variant dependent).

**Profile alignment**:
- **Language**: uses `i18n.language` to select localized recipe name/description.
- **Theme/appearance**: uses theme tokens for colors, typography, spacing.
- **Allergies/nutrition goals**: data depends on upstream Convex queries; card itself does not display allergy or nutrition warnings.

### Compact recipe rail (`components/RecipeRailCompact.tsx` → `RecipeCardCompact`)
**Where used**: Not currently rendered (imported in `app/(tabs)/index.tsx` but unused).

**Data inputs**:
- `RecipeCardCompact` renders name, time badge, inventory match badge, image via `getRecipeCardImageUrl`.

**Profile alignment**:
- **Language**: uses `i18n.language` for recipe name.
- **Theme/appearance**: partially tokenized; some badge colors and shadow settings are hard-coded.

### Link preview rail (`components/LinkPreviewRail.tsx` → `LinkPreviewCard`)
**Where used**: Home tab (web preview rail) using `useLinkPreviews` and static fallback data.

**Data inputs**:
- `LinkPreviewData`: `url`, `title`, `description`, `image`.

**Profile alignment**:
- **Theme/appearance**: uses tokens.
- **Language**: titles/descriptions are source-provided (not localized).

### Nutrient rail (`components/NutrientRail.tsx` → `NutrientCard`)
**Where used**: Home tab using static `nutrientDishes`.

**Data inputs**:
- `NutrientDish`: `name`, `description`, `imageUrl`, `calories`, `macronutrients`, `micronutrients`.

**Profile alignment**:
- **Theme/appearance**: uses tokens.
- **Nutrition goals**: does not reflect display preferences (e.g., hide calories, per-meal targets, protein-only).
- **Language**: uses hard-coded English labels (Calories, Protein, Carbs, Fat, Micronutrients).

## Convex Queries Populating Recipe Rails
**Home tab queries** (`app/(tabs)/index.tsx`):
- `api.recipes.listPersonalized` for `forYou`, `readyToCook`, `householdCompatible`.
- `api.recipes.listByPreferences` for `quickMeals` and `cuisineRecipes` (only when user has preferences).
- `api.recipes.listFeatured` fallback.

**Preference coverage** (in `convex/recipes.ts`):
- `listPersonalized` uses:
  - Personal allergies + dietary restrictions (hard filters).
  - Favorite cuisines, cooking style preferences (rail-specific filters).
  - Nutrition goals (scoring only).
  - Household members (for `householdCompatible`), but **not children**.
- `listByPreferences` can filter allergies, dietary restrictions, cuisines, and cooking styles **if passed**, but current calls only pass cooking styles or cuisines.

## Identified Blindspots
### 1) Household children allergies not used in `householdCompatible` rail
- Profile supports household children + allergies, and Convex has compatibility logic that can include children, but `listPersonalized` only builds household members from `household.members` (users) for `householdCompatible`.

### 2) Quick & Easy and Favorite Cuisines rails skip allergy/dietary filters
- `listByPreferences` supports allergies/dietary restrictions, but the home screen calls only pass cooking style or cuisines, which can surface recipes that conflict with allergies/restrictions from the profile.

### 3) Nutrition display preferences are not reflected in nutrient/recipe cards
- Profile captures nutrition display preferences (hide calories, protein-only, per-meal targets, warnings), but `NutrientCard` always shows calories/macros/micro labels. `RecipeCard` also does not expose any nutrition-goal-specific indicators.

### 4) Language preferences are inconsistently applied across cards
- Recipe cards use translated names/descriptions, but inventory and nutrient cards have hard-coded English labels and `toLocaleDateString('en-US')` formatting.

### 5) High-contrast/dyslexia preferences bypassed in a few card styles
- Most cards use theme tokens, but some badges and colors in `RecipeCardCompact` and `DetailedCard` are hard-coded (badge backgrounds, expiry banner colors), which may not align with high-contrast theme settings.

## Follow-up Considerations
- Determine whether household-wide filtering should be applied to non-household rails (e.g., For You, Quick & Easy) when a user is in a household.
- Align inventory and nutrient card labels with i18n so language preferences apply consistently.
- Decide how nutrition goals should visually influence cards (e.g., hide calories, show per-meal targets, or highlight goal alignment).
- Ensure theme-driven styling replaces hard-coded colors where accessibility or theming preferences should apply.
