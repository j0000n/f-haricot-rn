/**
 * Kitchen inventory utilities for location ordering and sorting
 */

export const LOCATION_ORDER = ["fridge", "freezer", "pantry", "spicecabinet"] as const;

export type StorageLocation = (typeof LOCATION_ORDER)[number];

/**
 * Gets the sort index for a storage location
 * @param value - The storage location value
 * @returns The index in LOCATION_ORDER, or LOCATION_ORDER.length if not found
 */
export function getLocationIndex(value: string): number {
  const index = LOCATION_ORDER.indexOf(value as StorageLocation);
  return index === -1 ? LOCATION_ORDER.length : index;
}

/**
 * Sorts inventory items by location, then by name
 */
export function sortByLocation<T extends { storageLocation: string; displayName: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const locationDelta = getLocationIndex(a.storageLocation) - getLocationIndex(b.storageLocation);
    if (locationDelta !== 0) {
      return locationDelta;
    }
    return a.displayName.localeCompare(b.displayName);
  });
}

/**
 * Sorts inventory items by quantity (descending), then by location
 */
export function sortByQuantity<T extends { quantity: number; storageLocation: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const quantityDelta = b.quantity - a.quantity;
    if (quantityDelta !== 0) {
      return quantityDelta;
    }
    return getLocationIndex(a.storageLocation) - getLocationIndex(b.storageLocation);
  });
}

/**
 * Sorts inventory items by purchase date (descending), then by location
 */
export function sortByPurchaseDate<T extends { purchaseDate: number; storageLocation: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const purchaseDelta = b.purchaseDate - a.purchaseDate;
    if (purchaseDelta !== 0) {
      return purchaseDelta;
    }
    return getLocationIndex(a.storageLocation) - getLocationIndex(b.storageLocation);
  });
}



