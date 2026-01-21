import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

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
      item.translations as unknown as Record<string, string>,
    ) as Doc<"foodLibrary">["translations"],
    categoryTranslations: transformCategoryTranslations(
      item.categoryTranslations as unknown as Record<string, string>,
    ) as Doc<"foodLibrary">["categoryTranslations"],
    varieties: item.varieties.map((variety) => ({
      ...variety,
      translations: transformVarietyTranslations(
        variety.translations as unknown as Record<string, string>,
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

export const getByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodLibrary")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
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

// Infer storage location from category name
function inferStorageLocation(category: string): "pantry" | "fridge" | "freezer" | "spicecabinet" {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("frozen") || categoryLower.includes("freezer")) {
    return "freezer";
  }
  if (categoryLower.includes("refrigerat") || categoryLower.includes("dairy") || categoryLower.includes("produce") || categoryLower.includes("fresh")) {
    return "fridge";
  }
  if (categoryLower.includes("spice") || categoryLower.includes("herb")) {
    return "spicecabinet";
  }
  return "pantry";
}

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

    const userId = await getAuthUserId(ctx);
    const fallbackName = args.name || args.code;
    const namespace = args.namespace || args.code.split(".")[0] || "provisional";
    const baseCategory = args.category || "Provisional";
    const storageLocation = inferStorageLocation(baseCategory);
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

    // Infer common aliases from name
    const aliases: string[] = [];
    const nameLower = fallbackName.toLowerCase();
    // Add plural form
    if (!nameLower.endsWith("s")) {
      aliases.push(`${fallbackName}s`);
    }
    // Add common variations
    if (nameLower.includes(" ")) {
      aliases.push(fallbackName.replace(/\s+/g, ""));
    }

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
      storageLocation,
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
      isProvisional: true,
      createdBy: userId ?? undefined,
      standardizedName: fallbackName.toLowerCase(),
      aliases: aliases.length > 0 ? aliases : undefined,
    });

    return insertedId;
  },
});

export const updateProvisionalEntry = mutation({
  args: {
    foodLibraryId: v.id("foodLibrary"),
    updates: v.object({
      name: v.optional(v.string()),
      category: v.optional(v.string()),
      storageLocation: v.optional(
        v.union(
          v.literal("pantry"),
          v.literal("fridge"),
          v.literal("freezer"),
          v.literal("spicecabinet")
        )
      ),
      nutritionPer100g: v.optional(
        v.object({
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
              })
            )
          ),
        })
      ),
      allergenTags: v.optional(v.array(v.string())),
      dietaryCompatibility: v.optional(v.array(v.string())),
      aliases: v.optional(v.array(v.string())),
      shelfLifeDays: v.optional(v.number()),
      storageTips: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.foodLibraryId);
    if (!entry) {
      throw new Error("Food library entry not found");
    }

    if (!entry.isProvisional) {
      throw new Error("Can only update provisional entries");
    }

    const updates: Partial<Doc<"foodLibrary">> = {};

    if (args.updates.name !== undefined) {
      updates.name = args.updates.name;
      updates.standardizedName = args.updates.name.toLowerCase();
      // Update translations
      const languages = ["en", "es", "zh", "fr", "ar", "ja", "vi", "tl"] as const;
      const newTranslations = languages.reduce(
        (acc, lang) => {
          acc[lang] = {
            singular: args.updates.name!,
            plural: `${args.updates.name}s`,
          };
          return acc;
        },
        {} as Record<(typeof languages)[number], { singular: string; plural: string }>
      );
      updates.translations = newTranslations;
    }

    if (args.updates.category !== undefined) {
      updates.category = args.updates.category;
      const languages = ["en", "es", "zh", "fr", "ar", "ja", "vi", "tl"] as const;
      const categoryTranslations = languages.reduce(
        (acc, lang) => {
          acc[lang] = args.updates.category!;
          return acc;
        },
        {} as Record<(typeof languages)[number], string>
      );
      updates.categoryTranslations = categoryTranslations;
    }

    if (args.updates.storageLocation !== undefined) {
      updates.storageLocation = args.updates.storageLocation;
    }

    if (args.updates.nutritionPer100g !== undefined) {
      updates.nutritionPer100g = args.updates.nutritionPer100g;
    }

    if (args.updates.allergenTags !== undefined) {
      updates.allergenTags = args.updates.allergenTags;
    }

    if (args.updates.dietaryCompatibility !== undefined) {
      updates.dietaryCompatibility = args.updates.dietaryCompatibility;
    }

    if (args.updates.aliases !== undefined) {
      updates.aliases = args.updates.aliases;
    }

    if (args.updates.shelfLifeDays !== undefined) {
      updates.shelfLifeDays = args.updates.shelfLifeDays;
    }

    if (args.updates.storageTips !== undefined) {
      updates.storageTips = args.updates.storageTips;
    }

    await ctx.db.patch(args.foodLibraryId, updates);
    return args.foodLibraryId;
  },
});

export const promoteProvisionalEntry = mutation({
  args: {
    foodLibraryId: v.id("foodLibrary"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.foodLibraryId);
    if (!entry) {
      throw new Error("Food library entry not found");
    }

    if (!entry.isProvisional) {
      // Already promoted
      return args.foodLibraryId;
    }

    await ctx.db.patch(args.foodLibraryId, {
      isProvisional: false,
    });

    return args.foodLibraryId;
  },
});

export const mergeDuplicateEntries = mutation({
  args: {
    sourceId: v.id("foodLibrary"), // Provisional entry to merge
    targetId: v.id("foodLibrary"), // Existing entry to merge into
    confirmMerge: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmMerge) {
      throw new Error("Merge must be confirmed");
    }

    const source = await ctx.db.get(args.sourceId);
    const target = await ctx.db.get(args.targetId);

    if (!source || !target) {
      throw new Error("One or both entries not found");
    }

    // Combine aliases
    const sourceAliases = source.aliases ?? [];
    const targetAliases = target.aliases ?? [];
    const combinedAliases = Array.from(
      new Set([...targetAliases, ...sourceAliases, source.name])
    );

    // Update target with combined aliases
    await ctx.db.patch(args.targetId, {
      aliases: combinedAliases,
    });

    // Update all inventory entries using sourceId to use targetId
    // Get all households
    const households = await ctx.db.query("households").collect();
    for (const household of households) {
      if (household.inventory) {
        const inventory = household.inventory as Array<{
          itemCode: string;
          varietyCode?: string;
          quantity: number;
          purchaseDate: number;
          note?: string;
          imageUrlOverride?: string;
        }>;

        let updated = false;
        const updatedInventory = inventory.map((item) => {
          if (item.itemCode === source.code) {
            updated = true;
            return { ...item, itemCode: target.code };
          }
          return item;
        });

        if (updated) {
          await ctx.db.patch(household._id, { inventory: updatedInventory });
        }
      }
    }

    // Delete source entry
    await ctx.db.delete(args.sourceId);

    return args.targetId;
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

export const updateTranslations = mutation({
  args: {
    foodLibraryId: v.id("foodLibrary"),
    translations: v.object({
      en: v.object({ singular: v.string(), plural: v.string() }),
      es: v.object({ singular: v.string(), plural: v.string() }),
      zh: v.object({ singular: v.string(), plural: v.string() }),
      fr: v.object({ singular: v.string(), plural: v.string() }),
      ar: v.object({ singular: v.string(), plural: v.string() }),
      ja: v.object({ singular: v.string(), plural: v.string() }),
      vi: v.object({ singular: v.string(), plural: v.string() }),
      tl: v.object({ singular: v.string(), plural: v.string() }),
    }),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.foodLibraryId);
    if (!entry) {
      throw new Error("Food library entry not found");
    }

    await ctx.db.patch(args.foodLibraryId, {
      translations: args.translations,
    });

    return args.foodLibraryId;
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
