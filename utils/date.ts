/**
 * Date formatting utilities
 */

const MS_IN_DAY = 86_400_000;

/**
 * Formats a timestamp to a short date string (MM/DD/YY)
 * @param timestamp - Unix timestamp in seconds
 * @param language - Optional language code for locale formatting
 * @returns Formatted date string
 */
export function formatShortDate(timestamp: number, language?: string): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(language || undefined, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

/**
 * Calculates the age of an item in days from a purchase date
 * @param purchaseTimestamp - Unix timestamp in seconds
 * @returns The number of days since purchase
 */
export function calculateDaysOld(purchaseTimestamp: number): number {
  const now = Date.now();
  const purchaseMs = purchaseTimestamp * 1000;
  return Math.max(0, Math.floor((now - purchaseMs) / MS_IN_DAY));
}

export { MS_IN_DAY };






