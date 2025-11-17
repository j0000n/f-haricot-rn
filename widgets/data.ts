import type { InventoryDisplayItem } from "@/types/food";
import type { Recipe } from "@/types/recipe";
import { calculateIngredientMatch } from "@/utils/inventory";
import type { WidgetPayload, WidgetInventoryItem, WidgetRecipe } from "./types";

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const STORAGE_LABELS: Record<InventoryDisplayItem["storageLocation"], string> = {
  pantry: "pantry",
  fridge: "fridge",
  freezer: "freezer",
  spicecabinet: "spicecabinet",
};

type BuildPayloadOptions = {
  inventoryItems: InventoryDisplayItem[];
  recipes: Recipe[];
  inventoryCodes: string[];
  language: keyof Recipe["recipeName"];
  maxSpotlightItems?: number;
  maxCookableRecipes?: number;
};

type FreshnessStatus = WidgetInventoryItem["freshnessStatus"];

const getDaysRemaining = (item: InventoryDisplayItem): number | null => {
  if (!item.purchaseDate || !item.shelfLifeDays) {
    return null;
  }

  const daysElapsed = Math.floor(
    (Date.now() - item.purchaseDate) / MS_IN_DAY,
  );

  return item.shelfLifeDays - daysElapsed;
};

const resolveFreshnessStatus = (daysRemaining: number | null): FreshnessStatus => {
  if (daysRemaining === null) {
    return "unknown";
  }

  if (daysRemaining <= 0) {
    return "expired";
  }

  if (daysRemaining <= 2) {
    return "warning";
  }

  return "fresh";
};

const buildWidgetInventoryItem = (
  item: InventoryDisplayItem,
): WidgetInventoryItem => {
  const daysRemaining = getDaysRemaining(item);

  return {
    code: item.itemCode,
    name: item.displayName,
    variety: item.displayVariety,
    quantity: item.quantity,
    storageLocation: STORAGE_LABELS[item.storageLocation],
    emoji: item.emoji,
    daysRemaining,
    freshnessStatus: resolveFreshnessStatus(daysRemaining),
    category: item.categoryName,
  };
};

const buildWidgetRecipe = (
  recipe: Recipe,
  language: keyof Recipe["recipeName"],
  match: ReturnType<typeof calculateIngredientMatch>,
): WidgetRecipe => {
  const name = recipe.recipeName[language] ?? recipe.recipeName.en;

  return {
    id: recipe._id,
    name,
    emojiTags: recipe.emojiTags,
    totalTimeMinutes: recipe.totalTimeMinutes,
    servings: recipe.servings,
    matchPercentage: match.matchPercentage,
    missingIngredients: match.missingIngredients,
  };
};

const summarizeInventory = (
  items: WidgetInventoryItem[],
): WidgetPayload["summary"] => {
  const storageBreakdown: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  let expiringSoon = 0;
  let expiringNow = 0;
  let totalQuantity = 0;

  for (const item of items) {
    totalQuantity += item.quantity;
    storageBreakdown[item.storageLocation] =
      (storageBreakdown[item.storageLocation] ?? 0) + 1;
    categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1;

    if (item.freshnessStatus === "expired") {
      expiringNow += 1;
    } else if (item.freshnessStatus === "warning") {
      expiringSoon += 1;
    }
  }

  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }));

  return {
    totalItems: items.length,
    totalQuantity,
    expiringSoon,
    expiringNow,
    storageBreakdown,
    topCategories,
  };
};

const sortSpotlightItems = (items: WidgetInventoryItem[]): WidgetInventoryItem[] => {
  return [...items].sort((a, b) => {
    const aDays = a.daysRemaining ?? Number.POSITIVE_INFINITY;
    const bDays = b.daysRemaining ?? Number.POSITIVE_INFINITY;

    if (a.freshnessStatus === b.freshnessStatus) {
      return aDays - bDays;
    }

    const statusPriority: Record<FreshnessStatus, number> = {
      expired: 0,
      warning: 1,
      fresh: 2,
      unknown: 3,
    };

    return statusPriority[a.freshnessStatus] - statusPriority[b.freshnessStatus];
  });
};

const sortCookableRecipes = (
  recipes: WidgetRecipe[],
): WidgetRecipe[] => {
  return [...recipes].sort((a, b) => {
    if (a.missingIngredients === b.missingIngredients) {
      if (a.matchPercentage === b.matchPercentage) {
        return a.totalTimeMinutes - b.totalTimeMinutes;
      }

      return b.matchPercentage - a.matchPercentage;
    }

    return a.missingIngredients - b.missingIngredients;
  });
};

export const buildWidgetPayload = ({
  inventoryItems,
  recipes,
  inventoryCodes,
  language,
  maxSpotlightItems = 6,
  maxCookableRecipes = 6,
}: BuildPayloadOptions): WidgetPayload => {
  const widgetItemsWithMeta = inventoryItems.map((item) => ({
    widget: buildWidgetInventoryItem(item),
    purchaseDate: item.purchaseDate,
  }));

  const widgetItems = widgetItemsWithMeta.map((entry) => entry.widget);
  const summary = summarizeInventory(widgetItems);

  const spotlightItems = sortSpotlightItems(widgetItems).slice(
    0,
    maxSpotlightItems,
  );

  const recentlyAddedItems = [...widgetItemsWithMeta]
    .sort((a, b) => b.purchaseDate - a.purchaseDate)
    .map((entry) => entry.widget)
    .slice(0, maxSpotlightItems);

  const inventoryMatches = recipes.map((recipe) => ({
    recipe,
    match: calculateIngredientMatch(recipe.ingredients, inventoryCodes),
  }));

  const cookableRecipes = sortCookableRecipes(
    inventoryMatches
      .map(({ recipe, match }) => buildWidgetRecipe(recipe, language, match))
      .filter((recipe) => recipe.matchPercentage > 0)
      .slice(0, maxCookableRecipes),
  );

  return {
    updatedAt: Date.now(),
    summary,
    spotlightItems,
    recentlyAddedItems,
    cookableRecipes,
  };
};
