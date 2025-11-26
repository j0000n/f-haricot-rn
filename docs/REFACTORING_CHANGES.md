# Refactoring Changes Documentation

This document details all the changes made during the refactoring of the `/app` directory to extract reusable code into `/components` and `/utils`.

## Summary

The refactoring extracted reusable logic and utilities from screen components into dedicated utility files and hooks, improving code organization, reusability, and maintainability.

## New Utility Files Created

### `/utils/fonts.ts`
- **Purpose**: Centralizes font loading configuration
- **Exports**: `FONT_SOURCES` - Font sources object for expo-font
- **Moved from**: `app/_layout.tsx`

### `/utils/url.ts`
- **Purpose**: URL decoding and parsing utilities
- **Exports**:
  - `decodeUrl()` - Safely decodes URL-encoded strings
  - `getHostname()` - Extracts hostname from URL, removing 'www.' prefix
- **Used in**: `app/search/[query].tsx`, `app/webview/[id].tsx`

### `/utils/translation.ts`
- **Purpose**: Translation and language utilities for food library and recipes
- **Exports**:
  - `SUPPORTED_LANGUAGES` - Array of supported food languages
  - `normalizeLanguage()` - Normalizes language code to supported food language
  - `resolveTranslation()` - Resolves translation value from translations object
- **Used in**: `app/ingredient/[id].tsx`

### `/utils/date.ts`
- **Purpose**: Date formatting utilities
- **Exports**:
  - `formatShortDate()` - Formats timestamp to short date string (MM/DD/YY)
  - `calculateDaysOld()` - Calculates age of item in days from purchase date
  - `MS_IN_DAY` - Constant for milliseconds in a day
- **Used in**: `app/(tabs)/kitchen.tsx`

### `/utils/kitchen.ts`
- **Purpose**: Kitchen inventory utilities for location ordering and sorting
- **Exports**:
  - `LOCATION_ORDER` - Array of storage locations in order
  - `getLocationIndex()` - Gets sort index for storage location
  - `sortByLocation()` - Sorts items by location, then by name
  - `sortByQuantity()` - Sorts items by quantity (descending), then by location
  - `sortByPurchaseDate()` - Sorts items by purchase date (descending), then by location
- **Used in**: `app/(tabs)/kitchen.tsx`

### `/utils/formatting.ts`
- **Purpose**: General formatting utilities for displaying data
- **Exports**:
  - `formatLabel()` - Formats a key string into a readable label
  - `formatValue()` - Formats a value for display
  - `createDisplayEntries()` - Creates display entries from an object, filtering hidden fields
- **Used in**: `app/profile.tsx`

### `/utils/linkPreview.ts`
- **Purpose**: Link preview utilities for fetching and parsing web page metadata
- **Exports**:
  - `LinkPreviewData` - Type definition for link preview data
  - `createFallbackImage()` - Creates fallback SVG image for link preview
  - `normalizeImageUrl()` - Normalizes image URL relative to base URL
  - `extractMetaContent()` - Extracts meta content from HTML
  - `getTitleFromHtml()` - Extracts title from HTML
  - `fetchLinkPreview()` - Fetches link preview data for a URL
- **Used in**: `app/(tabs)/index.tsx` (via hook)

### `/utils/inventoryCategories.ts`
- **Purpose**: Inventory categorization utilities
- **Exports**:
  - `FRESH_PRODUCE_CATEGORIES` - Categories for fresh produce items
  - `PANTRY_CATEGORIES` - Categories for pantry staple items
  - `PROTEIN_CATEGORIES` - Categories for protein items
  - `filterByCategory()` - Filters inventory items by category
  - `getFreshProduceItems()` - Gets fresh produce items from inventory
  - `getPantryItems()` - Gets pantry staple items from inventory
  - `getProteinItems()` - Gets protein items from inventory
- **Used in**: `app/(tabs)/index.tsx`

### `/utils/recipeLists.ts`
- **Purpose**: Recipe list utilities for building recipe orders and decorations
- **Exports**:
  - `buildRecipeIds()` - Builds array of recipe IDs from a recipe list
  - `DecoratedRecipe` - Type for decorated recipe with match information
  - `decorateRecipesWithMatches()` - Decorates recipes with ingredient match information
  - `sortRecipesByReadiness()` - Sorts decorated recipes by readiness
- **Used in**: `app/(tabs)/lists.tsx`, `app/lists/[id].tsx`

## New Hooks Created

### `/hooks/useLinkPreviews.ts`
- **Purpose**: Hook for fetching link previews
- **Exports**:
  - `useLinkPreviews()` - Fetches link previews for an array of URLs
  - `createFallbackImage()` - Re-exported from utils
- **Used in**: `app/(tabs)/index.tsx`

## Files Modified

### `app/_layout.tsx`
- **Changes**:
  - Removed `FONT_SOURCES` constant (moved to `/utils/fonts.ts`)
  - Added import from `/utils/fonts.ts`

### `app/(tabs)/index.tsx`
- **Changes**:
  - Removed link preview fetching logic (moved to `/hooks/useLinkPreviews.ts`)
  - Removed `createFallbackImage()` function (moved to utils)
  - Removed HTML parsing utilities (moved to `/utils/linkPreview.ts`)
  - Replaced inventory categorization logic with utility functions from `/utils/inventoryCategories.ts`
  - Fixed API path for `generateRecipeImagePrompt` (was `api.generateRecipeImagePrompt.generateRecipeImagePrompt`, now `api.promptGenerators.generateRecipeImagePrompt`)

### `app/(tabs)/kitchen.tsx`
- **Changes**:
  - Removed `LOCATION_ORDER`, `getLocationIndex()`, sorting functions (moved to `/utils/kitchen.ts`)
  - Removed `MS_IN_DAY` constant and date formatting logic (moved to `/utils/date.ts`)
  - Updated to use `formatShortDate()` and `calculateDaysOld()` from utils
  - Updated to use sorting utilities from `/utils/kitchen.ts`

### `app/(tabs)/lists.tsx`
- **Changes**:
  - Removed `buildRecipeIds()` function (moved to `/utils/recipeLists.ts`)
  - Removed recipe decoration and sorting logic (moved to `/utils/recipeLists.ts`)
  - Updated to use `buildRecipeIds()`, `decorateRecipesWithMatches()`, and `sortRecipesByReadiness()` from utils

### `app/profile.tsx`
- **Changes**:
  - Removed `formatLabel()`, `formatValue()`, `createEntries()` functions (moved to `/utils/formatting.ts`)
  - Updated to use `createDisplayEntries()` from utils

### `app/ingredient/[id].tsx`
- **Changes**:
  - Removed `SUPPORTED_LANGUAGES`, `normalizeLanguage()`, `resolveTranslation()` functions (moved to `/utils/translation.ts`)
  - Updated to use translation utilities from utils

### `app/search/[query].tsx`
- **Changes**:
  - Removed URL decoding logic (moved to `/utils/url.ts`)
  - Updated to use `decodeUrl()` from utils

### `app/webview/[id].tsx`
- **Changes**:
  - Removed URL decoding and hostname extraction logic (moved to `/utils/url.ts`)
  - Updated to use `decodeUrl()` and `getHostname()` from utils

### `app/lists/[id].tsx`
- **Changes**:
  - Removed `buildRecipeOrder()` function (moved to `/utils/recipeLists.ts`)
  - Updated to use `buildRecipeIds()` from utils

## Benefits of Refactoring

1. **Code Reusability**: Utilities can now be imported and used across multiple components
2. **Better Organization**: Related functionality is grouped together in dedicated files
3. **Easier Testing**: Utilities can be tested independently
4. **Improved Maintainability**: Changes to utility functions only need to be made in one place
5. **Type Safety**: All utilities are properly typed with TypeScript
6. **Documentation**: Each utility file includes JSDoc comments explaining purpose and usage

## Migration Notes

- All imports have been updated to use the new utility locations
- No breaking changes to component APIs or functionality
- All existing functionality remains intact
- Type definitions have been preserved and improved



