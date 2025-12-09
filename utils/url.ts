/**
 * URL utilities for decoding and parsing URLs
 */

/**
 * Safely decodes a URL-encoded string
 * @param encoded - The URL-encoded string
 * @returns The decoded string, or the original string if decoding fails
 */
export function decodeUrl(encoded: string | string[] | undefined | null): string {
  if (!encoded) {
    return "";
  }

  const raw = Array.isArray(encoded) ? encoded[0] : encoded;

  try {
    return decodeURIComponent(raw);
  } catch (error) {
    console.warn("Failed to decode URL", error);
    return raw;
  }
}

/**
 * Extracts the hostname from a URL, removing 'www.' prefix
 * @param url - The URL string
 * @returns The hostname without 'www.' prefix, or the original string if parsing fails
 */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return url;
  }
}




