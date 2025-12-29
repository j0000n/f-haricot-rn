/**
 * General formatting utilities for displaying data
 */

/**
 * Formats a key string into a readable label
 * Converts snake_case and camelCase to Title Case
 * @param key - The key to format
 * @returns Formatted label string
 */
export function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats a value for display
 * @param value - The value to format
 * @returns Formatted string representation
 */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  // Handle large numbers as timestamps
  if (typeof value === "number" && Number.isFinite(value) && value > 1e10) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  // Handle arrays and objects
  if (Array.isArray(value) || typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Creates display entries from an object, filtering out hidden fields
 * @param obj - The object to convert to entries
 * @param hiddenFields - Set of field names to exclude
 * @returns Array of display entries with label and value
 */
export function createDisplayEntries(
  obj: Record<string, unknown> | null | undefined,
  hiddenFields: Set<string> = new Set(),
): Array<{ label: string; value: string }> {
  if (!obj) {
    return [];
  }

  return Object.entries(obj)
    .filter(([key]) => !hiddenFields.has(key))
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: formatValue(value),
    }));
}






