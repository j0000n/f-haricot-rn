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

  let cleaned = text
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, " ")
    .replace(/\s*\*[^*]*\*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const leadingQuantifierPattern =
    /^\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])\s*/i;
  const leadingUnitPattern =
    /^\s*(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|pound|pounds|lb|lbs|ounce|ounces|oz|gram|grams|g|milliliter|milliliters|ml|tbsp|tsp|count|clove|cloves|piece|pieces|item|items|stalk|stalks)\b\s*/i;
  const leadingDescriptorPattern =
    /^\s*(fresh|chopped|diced|minced|sliced|cubed|grated|shredded|crushed|whole|peeled|seeded|small|medium|large|extra|virgin|boneless|skinless)\b[\s,]*/i;
  const leadingContainerPattern =
    /^\s*(can|cans|jar|jars|bottle|bottles|packet|packets|package|packages|tin|tins)\b[\s,]*/i;

  for (let index = 0; index < 5; index += 1) {
    const before = cleaned;
    cleaned = cleaned
      .replace(leadingQuantifierPattern, "")
      .replace(leadingUnitPattern, "")
      .replace(leadingDescriptorPattern, "")
      .replace(leadingContainerPattern, "")
      .replace(/^\s*of\s+/i, "")
      .replace(/^\s*[\/,.-]+\s*/, "")
      .trim();

    if (before === cleaned) {
      break;
    }
  }

  cleaned = cleaned
    .replace(/\s+/g, " ")
    .replace(/\b(\w+)\s+\1\b/gi, "$1")
    .replace(/\s+(chopped|diced|minced|sliced|cubed|grated|shredded|crushed|whole|peeled|seeded|small|medium|large|fine|coarse)$/gi, "")
    .replace(/^[,./-]+|[,./-]+$/g, "")
    .trim();

  return cleaned;
}

export function formatIngredientQuantity(
  ingredient: RecipeIngredient,
  options?: {
    language?: string;
    t?: (key: string) => string;
  }
): string {
  const normalizeUnitToken = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ");

  const measurementUnits = new Set([
    "cup",
    "cups",
    "tablespoon",
    "tablespoons",
    "tbsp",
    "teaspoon",
    "teaspoons",
    "tsp",
    "pound",
    "pounds",
    "lb",
    "lbs",
    "ounce",
    "ounces",
    "oz",
    "gram",
    "grams",
    "g",
    "milliliter",
    "milliliters",
    "ml",
    "count",
    "piece",
    "pieces",
    "clove",
    "cloves",
  ]);

  const isMeasurementUnit = (value: string | undefined) => {
    if (!value) return false;
    return measurementUnits.has(normalizeUnitToken(value));
  };

  const parseDisplayQuantity = (value: string | undefined) => {
    if (!value) return { amount: undefined as string | undefined, unit: undefined as string | undefined };

    const trimmed = value.trim();
    if (!trimmed) return { amount: undefined as string | undefined, unit: undefined as string | undefined };

    const match = trimmed.match(
      /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])\s*(.*)$/i
    );
    if (!match) {
      return { amount: trimmed, unit: undefined as string | undefined };
    }

    const amount = match[1]?.trim();
    const unit = match[2]?.trim() || undefined;
    return { amount, unit };
  };

  const parsedDisplay = parseDisplayQuantity(ingredient.displayQuantity);

  const parseNumericQuantity = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const mixedFraction = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedFraction) {
      const whole = Number(mixedFraction[1]);
      const numerator = Number(mixedFraction[2]);
      const denominator = Number(mixedFraction[3]);
      if (denominator) {
        return whole + numerator / denominator;
      }
    }

    const fraction = trimmed.match(/^(\d+)\/(\d+)$/);
    if (fraction) {
      const numerator = Number(fraction[1]);
      const denominator = Number(fraction[2]);
      if (denominator) {
        return numerator / denominator;
      }
    }

    const unicodeFractions: Record<string, number> = {
      "¼": 0.25,
      "½": 0.5,
      "¾": 0.75,
      "⅓": 1 / 3,
      "⅔": 2 / 3,
      "⅛": 0.125,
      "⅜": 0.375,
      "⅝": 0.625,
      "⅞": 0.875,
    };
    if (trimmed in unicodeFractions) {
      return unicodeFractions[trimmed];
    }

    const parsed = Number(trimmed.replace(",", "."));
    if (Number.isFinite(parsed)) {
      return parsed;
    }

    return undefined;
  };

  const quantity = ingredient.displayQuantity
    ? parsedDisplay.amount || ingredient.displayQuantity
    : (Number.isInteger(ingredient.quantity)
        ? ingredient.quantity.toString()
        : ingredient.quantity.toFixed(2).replace(/\.00$/, ""));

  // Prefer displayQuantity's explicit unit when it's truly a unit (e.g., "1.5 lb").
  // Ignore ingredient-like displayUnit values (e.g., "chicken thighs").
  let unit = "";
  if (isMeasurementUnit(parsedDisplay.unit)) {
    unit = parsedDisplay.unit!;
  } else if (isMeasurementUnit(ingredient.displayUnit)) {
    unit = ingredient.displayUnit!;
  } else {
    unit = ingredient.unit;
  }

  // Translate unit if language and t function are provided
  if (options?.language && options?.t) {
    const normalizedUnit = unit.toLowerCase().replace(/s$/, ""); // Remove plural 's' for lookup
    const parsedNumericQuantity = ingredient.displayQuantity
      ? parseNumericQuantity(parsedDisplay.amount)
      : ingredient.quantity;
    const isPlural =
      typeof parsedNumericQuantity === "number"
        ? parsedNumericQuantity !== 1
        : ingredient.quantity !== 1;

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
