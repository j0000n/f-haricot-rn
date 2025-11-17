export type WidgetInventoryItem = {
  code: string;
  name: string;
  quantity: number;
  storageLocation: string;
  emoji: string;
  daysRemaining: number | null;
  freshnessStatus: "fresh" | "warning" | "expired" | "unknown";
  category: string;
  variety?: string;
};

export type WidgetRecipe = {
  id: string;
  name: string;
  emojiTags: string[];
  totalTimeMinutes: number;
  servings: number;
  matchPercentage: number;
  missingIngredients: number;
};

export type WidgetSummary = {
  totalItems: number;
  totalQuantity: number;
  expiringSoon: number;
  expiringNow: number;
  storageBreakdown: Record<string, number>;
  topCategories: { category: string; count: number }[];
};

export type WidgetPayload = {
  updatedAt: number;
  summary: WidgetSummary;
  spotlightItems: WidgetInventoryItem[];
  recentlyAddedItems: WidgetInventoryItem[];
  cookableRecipes: WidgetRecipe[];
};
