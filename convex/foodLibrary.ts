import { mutation, query } from "./_generated/server";

import { foodLibrarySeed } from "../data/foodLibrarySeed";
import type { FoodLibraryItem } from "../types/food";

// Transform seed data to match schema format
function transformFoodLibraryItem(item: FoodLibraryItem) {
  // Helper to convert string to singular/plural format and add missing languages
  const transformTranslations = (
    translations: Record<string, string>
  ): Record<string, { singular: string; plural: string }> => {
    const result: Record<string, { singular: string; plural: string }> = {};
    const languages = ["en", "es", "zh", "fr", "ar", "ja", "vi", "tl"];

    for (const lang of languages) {
      const value = translations[lang] || translations.en || "";
      // Use same value for singular and plural (can be improved later)
      result[lang] = {
        singular: value,
        plural: value,
      };
    }

    return result;
  };

  // Transform category translations (just strings, not singular/plural)
  const transformCategoryTranslations = (
    translations: Record<string, string>
  ): Record<string, string> => {
    const result: Record<string, string> = {};
    const languages = ["en", "es", "zh", "fr", "ar", "ja", "vi", "tl"];

    for (const lang of languages) {
      result[lang] = translations[lang] || translations.en || "";
    }

    return result;
  };

  // Transform variety translations
  const transformVarietyTranslations = (
    translations: Record<string, string>
  ): Record<string, string> => {
    const result: Record<string, string> = {};
    const languages = ["en", "es", "zh", "fr", "ar", "ja", "vi", "tl"];

    for (const lang of languages) {
      result[lang] = translations[lang] || translations.en || "";
    }

    return result;
  };

  return {
    ...item,
    translations: transformTranslations(item.translations as unknown as Record<string, string>),
    categoryTranslations: transformCategoryTranslations(
      item.categoryTranslations as unknown as Record<string, string>
    ),
    varieties: item.varieties.map((variety) => ({
      ...variety,
      translations: transformVarietyTranslations(
        variety.translations as unknown as Record<string, string>
      ),
    })),
  } as {
    code: string;
    namespace: string;
    name: string;
    translations: {
      en: { singular: string; plural: string };
      es: { singular: string; plural: string };
      zh: { singular: string; plural: string };
      fr: { singular: string; plural: string };
      ar: { singular: string; plural: string };
      ja: { singular: string; plural: string };
      vi: { singular: string; plural: string };
      tl: { singular: string; plural: string };
    };
    category: string;
    categoryTranslations: {
      en: string;
      es: string;
      zh: string;
      fr: string;
      ar: string;
      ja: string;
      vi: string;
      tl: string;
    };
    defaultImageUrl: string;
    emoji?: string;
    shelfLifeDays: number;
    storageLocation: "pantry" | "fridge" | "freezer" | "spicecabinet";
    storageTips: string;
    varieties: Array<{
      code: string;
      translations: {
        en: string;
        es: string;
        zh: string;
        fr: string;
        ar: string;
        ja: string;
        vi: string;
        tl: string;
      };
      defaultImageUrl?: string;
    }>;
  };
}

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("foodLibrary").collect();
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;

    for (const item of foodLibrarySeed) {
      const existing = await ctx.db
        .query("foodLibrary")
        .withIndex("by_code", (q) => q.eq("code", item.code))
        .unique();

      const transformedItem = transformFoodLibraryItem(item);

      if (existing) {
        await ctx.db.patch(existing._id, transformedItem);
      } else {
        await ctx.db.insert("foodLibrary", transformedItem);
        inserted += 1;
      }
    }

    return { inserted, total: foodLibrarySeed.length };
  },
});
