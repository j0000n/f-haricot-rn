import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

import { foodLibrarySeed } from "../data/foodLibrarySeed";
import type { FoodLibraryItem } from "../types/food";

// Transform seed data to match schema format
function transformFoodLibraryItem(
  item: FoodLibraryItem,
): Omit<Doc<"foodLibrary">, "_id" | "_creationTime"> {
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
    translations: transformTranslations(
      item.translations as Record<string, string>,
    ) as Doc<"foodLibrary">["translations"],
    categoryTranslations: transformCategoryTranslations(
      item.categoryTranslations as Record<string, string>,
    ) as Doc<"foodLibrary">["categoryTranslations"],
    varieties: item.varieties.map((variety) => ({
      ...variety,
      translations: transformVarietyTranslations(
        variety.translations as Record<string, string>,
      ) as Doc<"foodLibrary">["varieties"][number]["translations"],
    })),
  } satisfies Omit<Doc<"foodLibrary">, "_id" | "_creationTime">;
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

export const ensureProvisional = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    namespace: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("foodLibrary")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      return existing._id;
    }

    const fallbackName = args.name || args.code;
    const namespace = args.namespace || args.code.split(".")[0] || "provisional";
    const baseCategory = args.category || "Provisional";
    const languages = ["en", "es", "zh", "fr", "ar", "ja", "vi", "tl"] as const;
    const blankTranslations = languages.reduce(
      (acc, lang) => {
        acc[lang] = {
          singular: fallbackName,
          plural: `${fallbackName}s`,
        } as { singular: string; plural: string };
        return acc;
      },
      {} as Record<(typeof languages)[number], { singular: string; plural: string }>,
    );

    const categoryTranslations = languages.reduce(
      (acc, lang) => {
        acc[lang] = baseCategory;
        return acc;
      },
      {} as Record<(typeof languages)[number], string>,
    );

    const insertedId = await ctx.db.insert("foodLibrary", {
      code: args.code,
      namespace,
      name: fallbackName,
      translations: blankTranslations,
      category: baseCategory,
      categoryTranslations,
      defaultImageUrl:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      emoji: "🧾",
      shelfLifeDays: 7,
      storageLocation: "pantry",
      storageTips: "Auto-generated placeholder ingredient. Confirm details in admin tools.",
      varieties: [],
      nutritionPer100g: {
        calories: 0,
        macronutrients: {
          protein: 0,
          carbohydrates: 0,
          fat: 0,
        },
      },
      densityHints: { defaultUnit: "g", gramsPerPiece: 50 },
    });

    return insertedId;
  },
});

export const listNutritionSummaries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("foodLibrary")
      .collect()
      .then((rows) =>
        rows.map((row) => ({
          code: row.code,
          name: row.name,
          nutritionPer100g: row.nutritionPer100g,
          densityHints: row.densityHints,
        })),
      );
  },
});

export const overrideNutritionMapping = mutation({
  args: {
    code: v.string(),
    nutritionPer100g: v.object({
      calories: v.number(),
      macronutrients: v.object({
        protein: v.number(),
        carbohydrates: v.number(),
        fat: v.number(),
        fiber: v.optional(v.number()),
        sugars: v.optional(v.number()),
      }),
      micronutrients: v.optional(
        v.array(
          v.object({
            label: v.string(),
            amount: v.number(),
            unit: v.string(),
            dailyValuePercent: v.optional(v.number()),
          }),
        ),
      ),
    }),
    densityHints: v.optional(
      v.object({
        gramsPerMilliliter: v.optional(v.number()),
        gramsPerPiece: v.optional(v.number()),
        defaultUnit: v.optional(
          v.union(v.literal("g"), v.literal("ml"), v.literal("piece")),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("foodLibrary")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!existing) {
      throw new Error(`Food item not found for code ${args.code}`);
    }

    await ctx.db.patch(existing._id, {
      nutritionPer100g: args.nutritionPer100g,
      densityHints: args.densityHints,
    });

    return existing._id;
  },
});
