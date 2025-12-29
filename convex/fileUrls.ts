import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Get the best available image URL for a recipe card with fallback chain.
 * Follows Convex file serving best practices: https://docs.convex.dev/file-storage/serve-files
 *
 * Fallback order:
 * 1. transparentImageSmallStorageId (preferred for cards)
 * 2. originalImageSmallStorageId (fallback)
 * 3. imageUrls[0] (final fallback, returns as-is)
 */
export const getRecipeCardImageUrl = query({
  args: {
    transparentImageSmallStorageId: v.optional(v.id("_storage")),
    originalImageSmallStorageId: v.optional(v.id("_storage")),
    imageUrls: v.optional(v.array(v.string())),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // Try transparent image first (preferred for cards)
    if (args.transparentImageSmallStorageId) {
      const url = await ctx.storage.getUrl(args.transparentImageSmallStorageId);
      if (url) return url;
    }

    // Fallback to original small image
    if (args.originalImageSmallStorageId) {
      const url = await ctx.storage.getUrl(args.originalImageSmallStorageId);
      if (url) return url;
    }

    // Final fallback to imageUrls array
    if (args.imageUrls && args.imageUrls.length > 0) {
      return args.imageUrls[0];
    }

    return null;
  },
});
