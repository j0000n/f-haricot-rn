/**
 * Recipe list utilities for building recipe orders and decorations
 */

import type { RecipeList } from "@/hooks/useRecipeLists";
import type { Recipe } from "@/types/recipe";
import { calculateIngredientMatch } from "./inventory";

/**
 * Builds an array of recipe IDs from a recipe list
 * @param list - The recipe list
 * @returns Array of recipe IDs in order
 */
export function buildRecipeIds(list: RecipeList): Recipe["_id"][] {
  if (list.type === "cook-asap") {
    return list.entries.map((entry) => entry.recipeId);
  }

  return list.recipeIds;
}

/**
 * Decorated recipe with match information
 */
export type DecoratedRecipe = {
  recipe: Recipe;
  matchPercentage: number;
};

/**
 * Decorates recipes with ingredient match information
 * @param recipes - Array of recipes to decorate
 * @param inventoryCodes - Array of inventory item codes
 * @returns Array of decorated recipes
 */
export function decorateRecipesWithMatches(
  recipes: Recipe[],
  inventoryCodes: string[],
): DecoratedRecipe[] {
  return recipes.map((recipe) => ({
    recipe,
    matchPercentage: calculateIngredientMatch(recipe.ingredients, inventoryCodes).matchPercentage,
  }));
}

/**
 * Sorts decorated recipes by readiness (100% match first), then by match percentage, then by name
 * @param decoratedRecipes - Array of decorated recipes
 * @param language - Language code for name comparison
 * @returns Sorted array of recipes (not decorated)
 */
export function sortRecipesByReadiness(
  decoratedRecipes: DecoratedRecipe[],
  language: keyof Recipe["recipeName"],
): Recipe[] {
  return decoratedRecipes
    .slice()
    .sort((a, b) => {
      const readyDelta = Number(b.matchPercentage === 100) - Number(a.matchPercentage === 100);
      if (readyDelta !== 0) {
        return readyDelta;
      }

      const matchDelta = b.matchPercentage - a.matchPercentage;
      if (matchDelta !== 0) {
        return matchDelta;
      }

      const nameA =
        (a.recipe.recipeName[language] ?? a.recipe.recipeName.en ?? "").toLowerCase();
      const nameB =
        (b.recipe.recipeName[language] ?? b.recipe.recipeName.en ?? "").toLowerCase();

      return nameA.localeCompare(nameB);
    })
    .map((entry) => entry.recipe);
}





