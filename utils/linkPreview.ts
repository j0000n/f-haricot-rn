/**
 * Link preview utilities for fetching and parsing web page metadata
 */

export type LinkPreviewData = {
  url: string;
  title: string;
  description?: string;
  image?: string | null;
};

/**
 * Creates a fallback SVG image for a link preview
 * @param label - The label to display in the image
 * @returns Data URL for the SVG image
 */
export function createFallbackImage(label: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 420'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f6d365'/><stop offset='100%' stop-color='%23fda085'/></linearGradient></defs><rect width='800' height='420' rx='32' fill='url(#g)'/><text x='400' y='210' font-family='Arial, Helvetica, sans-serif' font-size='42' text-anchor='middle' fill='%23ffffff' font-weight='700'>${label}</text></svg>`,
  )}`;
}

/**
 * Normalizes an image URL relative to a base URL
 * @param imageUrl - The image URL to normalize
 * @param baseUrl - Optional base URL for relative URLs
 * @returns Normalized absolute URL, or null if invalid
 */
export function normalizeImageUrl(imageUrl?: string | null, baseUrl?: string): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    return new URL(imageUrl, baseUrl).href;
  } catch (error) {
    return imageUrl;
  }
}

/**
 * Extracts meta content from HTML
 * @param html - The HTML string
 * @param key - The meta property or name to extract
 * @returns The extracted content value, or undefined if not found
 */
export function extractMetaContent(html: string, key: string): string | undefined {
  const propertyMatch = new RegExp(
    `<meta[^>]*property=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  ).exec(html);

  if (propertyMatch?.[1]) {
    return propertyMatch[1];
  }

  const nameMatch = new RegExp(
    `<meta[^>]*name=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  ).exec(html);

  return nameMatch?.[1];
}

/**
 * Extracts the title from HTML
 * @param html - The HTML string
 * @returns The title text, or undefined if not found
 */
export function getTitleFromHtml(html: string): string | undefined {
  const titleMatch = /<title>([^<]*)<\/title>/i.exec(html);
  return titleMatch?.[1]?.trim();
}

/**
 * Fetches link preview data for a URL
 * @param url - The URL to fetch preview for
 * @param fallback - Optional fallback data if fetch fails
 * @returns Link preview data
 */
export async function fetchLinkPreview(
  url: string,
  fallback?: Omit<LinkPreviewData, "url">,
): Promise<LinkPreviewData> {
  const defaultFallback: Omit<LinkPreviewData, "url"> = fallback || {
    title: url,
    description: undefined,
    image: createFallbackImage(new URL(url).hostname.replace(/^www\./, "")),
  };

  try {
    const response = await fetch(url, {
      mode: "cors",
      credentials: "omit",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    const title =
      extractMetaContent(html, "og:title") ||
      extractMetaContent(html, "twitter:title") ||
      getTitleFromHtml(html);
    const description =
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "description") ||
      extractMetaContent(html, "twitter:description") ||
      defaultFallback.description;
    const image = normalizeImageUrl(extractMetaContent(html, "og:image"), url) || defaultFallback.image;

    return {
      url,
      title: title || defaultFallback.title,
      description: description || defaultFallback.description,
      image,
    };
  } catch (error) {
    // If fetch fails (CORS or network error), return fallback
    console.warn(`Failed to fetch preview for ${url}:`, error);
    return { url, ...defaultFallback };
  }
}
