/**
 * Hook for fetching link previews
 */

import { useEffect, useState } from "react";
import type { LinkPreviewData } from "@/utils/linkPreview";
import { fetchLinkPreview, createFallbackImage } from "@/utils/linkPreview";

/**
 * Fetches link previews for an array of URLs
 * @param urls - Array of URLs to fetch previews for
 * @param fallbacks - Optional fallback data for each URL
 * @returns Object with previews array and loading state
 */
export function useLinkPreviews(
  urls: string[],
  fallbacks?: Record<string, Omit<LinkPreviewData, "url">>,
): { previews: LinkPreviewData[]; isLoading: boolean } {
  const [previews, setPreviews] = useState<LinkPreviewData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadPreviews = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.all(
          urls.map((url) => fetchLinkPreview(url, fallbacks?.[url])),
        );
        if (!isCancelled) {
          setPreviews(results);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (urls.length > 0) {
      loadPreviews();
    }

    return () => {
      isCancelled = true;
    };
  }, [urls, fallbacks]);

  return { previews, isLoading };
}

export { createFallbackImage };




