/**
 * Inventory categorization utilities
 */

import type { InventoryDisplayItem } from "@/types/food";

/**
 * Categories for fresh produce items
 */
export const FRESH_PRODUCE_CATEGORIES = ["Tree Fruits", "Berries"] as const;

/**
 * Categories for pantry staple items
 */
export const PANTRY_CATEGORIES = ["Rice", "Pasta", "Bread", "Oils"] as const;

/**
 * Categories for protein items
 */
export const PROTEIN_CATEGORIES = ["Poultry", "Beef", "Pork"] as const;

/**
 * Filters inventory items by category
 * @param items - Array of inventory items
 * @param categories - Array of category names to match
 * @returns Filtered array of items
 */
export function filterByCategory(
  items: InventoryDisplayItem[],
  categories: readonly string[],
): InventoryDisplayItem[] {
  return items.filter((item) => categories.includes(item.category));
}

/**
 * Gets fresh produce items from inventory
 */
export function getFreshProduceItems(items: InventoryDisplayItem[]): InventoryDisplayItem[] {
  return filterByCategory(items, FRESH_PRODUCE_CATEGORIES);
}

/**
 * Gets pantry staple items from inventory
 */
export function getPantryItems(items: InventoryDisplayItem[]): InventoryDisplayItem[] {
  return filterByCategory(items, PANTRY_CATEGORIES);
}

/**
 * Gets protein items from inventory
 */
export function getProteinItems(items: InventoryDisplayItem[]): InventoryDisplayItem[] {
  return filterByCategory(items, PROTEIN_CATEGORIES);
}





