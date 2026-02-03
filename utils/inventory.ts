import { RecipeIngredient } from "@haricot/convex-client";

export interface IngredientMatchSummary {
  matchPercentage: number;
  missingIngredients: number;
}

export function calculateIngredientMatch(
  ingredients: RecipeIngredient[],
  inventoryCodes: string[] = []
): IngredientMatchSummary {
  if (ingredients.length === 0) {
    return { matchPercentage: 100, missingIngredients: 0 };
  }

  const inventorySet = new Set(inventoryCodes);
  let ownedCount = 0;

  for (const ingredient of ingredients) {
    if (inventorySet.has(ingredient.foodCode)) {
      ownedCount += 1;
      continue;
    }

    if (ingredient.varietyCode && inventorySet.has(ingredient.varietyCode)) {
      ownedCount += 1;
    }
  }

  const matchPercentage = Math.round((ownedCount / ingredients.length) * 100);
  return {
    matchPercentage,
    missingIngredients: ingredients.length - ownedCount,
  };
}

export function getMissingIngredients(
  ingredients: RecipeIngredient[],
  inventoryCodes: string[] = [],
): RecipeIngredient[] {
  if (!ingredients.length) {
    return [];
  }

  const inventorySet = new Set(inventoryCodes);

  return ingredients.filter((ingredient) => {
    if (inventorySet.has(ingredient.foodCode)) {
      return false;
    }

    if (ingredient.varietyCode && inventorySet.has(ingredient.varietyCode)) {
      return false;
    }

    return true;
  });
}

/**
 * Extracts a clean ingredient name from originalText by removing quantities, units, and common prefixes.
 * This is used as a fallback when the ingredient is not found in the food library.
 */
export function extractIngredientNameFromText(text: string): string {
  if (!text) return "";

  let cleaned = text.trim();

  // Remove parenthetical notes first (e.g., "(or other non-dairy milk) *see note")
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, "");
  cleaned = cleaned.replace(/\s*\*[^*]*\*/g, "");

  // Remove leading quantity/unit patterns (e.g., "2 lbs", "1/2 cup", "2½ tablespoons")
  // Pattern matches: numbers (including fractions), optional spaces, units
  // This needs to be more aggressive to catch patterns anywhere, not just at start
  cleaned = cleaned.replace(
    /\b\d+[½¼¾]?\s*(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|pound|pounds|lb|lbs|ounce|ounces|oz|gram|grams|g|milliliter|milliliters|ml|tbsp|tsp|count|clove|cloves|piece|pieces|item|items)\s+/gi,
    ""
  );

  // Remove fraction patterns (e.g., "1/2 cup", "¾ cup") - anywhere in text
  cleaned = cleaned.replace(/\b\d+\/\d+\s+(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|pound|pounds|lb|lbs|ounce|ounces|oz|gram|grams|g|milliliter|milliliters|ml|tbsp|tsp)\s+/gi, "");

  // Remove Unicode fraction patterns (e.g., "½ cup", "¼ cup") - anywhere in text
  cleaned = cleaned.replace(/\b[½¼¾]\s+(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|pound|pounds|lb|lbs|ounce|ounces|oz|gram|grams|g|milliliter|milliliters|ml|tbsp|tsp)\s+/gi, "");

  // Remove standalone numbers followed by units (e.g., "2 lbs", "1 cup") - anywhere
  cleaned = cleaned.replace(/\b\d+\s+(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|pound|pounds|lb|lbs|ounce|ounces|oz|gram|grams|g|milliliter|milliliters|ml|tbsp|tsp|count|clove|cloves|piece|pieces|item|items)\s+/gi, "");

  // Remove duplicated words (e.g., "lean ground lean" -> "lean ground")
  // Do this multiple times to catch chains like "lean lean lean"
  let previousLength = cleaned.length;
  do {
    previousLength = cleaned.length;
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, "$1");
  } while (cleaned.length < previousLength);

  // Remove common prefixes that are better handled as preparation (e.g., "fresh", "chopped")
  // But keep them if they're part of the ingredient name (e.g., "fresh parsley" -> "parsley" is wrong)
  // So we'll be more conservative and only remove if they're clearly preparation-related
  cleaned = cleaned.replace(/^\s*(fresh|chopped|diced|minced|sliced|cubed|grated|shredded|crushed|whole|peeled|seeded)\s+/gi, "");

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Remove trailing preparation words that might have been missed
  // But be careful - some ingredients end with these words legitimately
  cleaned = cleaned.replace(/\s+(chopped|diced|minced|sliced|cubed|grated|shredded|crushed|whole|peeled|seeded|small|large|fine|coarse)$/gi, "");

  // Final cleanup: remove any remaining standalone numbers at the start
  cleaned = cleaned.replace(/^\s*\d+\s+/g, "");

  return cleaned.trim();
}

export function formatIngredientQuantity(
  ingredient: RecipeIngredient,
  options?: {
    language?: string;
    t?: (key: string) => string;
  }
): string {
  // Use displayQuantity if available (for fractions like "1/2")
  const quantity = ingredient.displayQuantity
    ? ingredient.displayQuantity
    : (Number.isInteger(ingredient.quantity)
        ? ingredient.quantity.toString()
        : ingredient.quantity.toFixed(2).replace(/\.00$/, ""));

  // Use displayUnit if available, otherwise use unit
  let unit = ingredient.displayUnit || ingredient.unit;

  // Translate unit if language and t function are provided
  if (options?.language && options?.t) {
    const normalizedUnit = unit.toLowerCase().replace(/s$/, ""); // Remove plural 's' for lookup
    const isPlural = ingredient.quantity !== 1 && !ingredient.displayQuantity; // Check if plural needed

    // Map common unit variations to translation keys
    const unitKeyMap: Record<string, { singular: string; plural: string }> = {
      "cup": { singular: "recipe.units.cup", plural: "recipe.units.cups" },
      "tablespoon": { singular: "recipe.units.tablespoon", plural: "recipe.units.tablespoons" },
      "tbsp": { singular: "recipe.units.tablespoon", plural: "recipe.units.tablespoons" },
      "teaspoon": { singular: "recipe.units.teaspoon", plural: "recipe.units.teaspoons" },
      "tsp": { singular: "recipe.units.teaspoon", plural: "recipe.units.teaspoons" },
      "pound": { singular: "recipe.units.pound", plural: "recipe.units.pounds" },
      "lb": { singular: "recipe.units.pound", plural: "recipe.units.pounds" },
      "lbs": { singular: "recipe.units.pound", plural: "recipe.units.pounds" },
      "ounce": { singular: "recipe.units.ounce", plural: "recipe.units.ounces" },
      "oz": { singular: "recipe.units.ounce", plural: "recipe.units.ounces" },
      "gram": { singular: "recipe.units.gram", plural: "recipe.units.grams" },
      "g": { singular: "recipe.units.gram", plural: "recipe.units.grams" },
      "milliliter": { singular: "recipe.units.milliliter", plural: "recipe.units.milliliters" },
      "ml": { singular: "recipe.units.milliliter", plural: "recipe.units.milliliters" },
      "count": { singular: "recipe.units.count", plural: "recipe.units.count" },
    };

    const unitKey = unitKeyMap[normalizedUnit];
    if (unitKey) {
      const translationKey = isPlural ? unitKey.plural : unitKey.singular;
      const translatedUnit = options.t(translationKey);
      // Fallback to original unit if translation returns the key (translation missing)
      if (translatedUnit && translatedUnit !== translationKey) {
        unit = translatedUnit;
      }
    }
  }

  return `${quantity} ${unit}`.trim();
}
