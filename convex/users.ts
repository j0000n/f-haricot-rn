import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

import { foodLibrarySeed } from "../data/foodLibrarySeed";
import { userInventorySeed } from "../data/userInventorySeed";
import type { FoodLibraryItem, UserInventoryEntry } from "../types/food";

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

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const user = await ctx.db.get(userId);
    return user;
  },
});

export const getCurrentInventory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      return [] as string[];
    }

    const user = await ctx.db.get(userId);
    if (!user?.householdId) {
      return [] as string[];
    }

    const household = await ctx.db.get(user.householdId);
    const inventory = (household?.inventory ?? []) as UserInventoryEntry[];

    if (!inventory.length) {
      return [] as string[];
    }

    const codes = new Set<string>();

    for (const item of inventory) {
      codes.add(item.itemCode);
      if (item.varietyCode) {
        codes.add(item.varietyCode);
      }
    }

    return Array.from(codes);
  },
});

export const updateProfile = mutation({
  args: {
    onboardingCompleted: v.optional(v.boolean()),
    userType: v.optional(
      v.union(v.literal(""), v.literal("creator"), v.literal("vendor"))
    ),
    dietaryRestrictions: v.optional(v.array(v.string())),
    customDiet: v.optional(
      v.union(
        v.null(),
        v.object({
          name: v.string(),
          description: v.optional(v.string()),
        })
      )
    ),
    allergies: v.optional(v.array(v.string())),
    householdSize: v.optional(v.number()),
    favoriteCuisines: v.optional(v.array(v.string())),
    cookingStylePreferences: v.optional(v.array(v.string())),
    mealPlanningPreferences: v.optional(v.array(v.string())),
    preferredTheme: v.optional(v.union(v.string(), v.null())),
    customThemeShareCode: v.optional(v.union(v.string(), v.null())),
    preferredTextSize: v.optional(
      v.union(
        v.literal("extraSmall"),
        v.literal("base"),
        v.literal("large"),
        v.literal("extraLarge")
      )
    ),
    dyslexiaMode: v.optional(v.boolean()),
    highContrastMode: v.optional(
      v.union(
        v.literal("off"),
        v.literal("light"),
        v.literal("dark"),
        v.boolean()
      )
    ),
    motionPreference: v.optional(
      v.union(v.literal("system"), v.literal("reduce"), v.literal("standard"))
    ),
    preferredLanguage: v.optional(
      v.union(
        v.literal("en"),
        v.literal("es"),
        v.literal("zh"),
        v.literal("fr"),
        v.literal("tl"),
        v.literal("vi"),
        v.literal("ar")
      )
    ),
    nutritionGoals: v.optional(
      v.object({
        preset: v.optional(v.union(v.string(), v.null())),
        categories: v.array(v.string()),
        targets: v.object({
          calories: v.optional(v.union(v.number(), v.null())),
          protein: v.optional(v.union(v.number(), v.null())),
          fat: v.optional(v.union(v.number(), v.null())),
          carbohydrates: v.optional(v.union(v.number(), v.null())),
          fiber: v.optional(v.union(v.number(), v.null())),
          addedSugar: v.optional(v.union(v.number(), v.null())),
          saturatedFat: v.optional(v.union(v.number(), v.null())),
          sodium: v.optional(v.union(v.number(), v.null())),
        }),
        trackedMetrics: v.array(
          v.union(
            v.literal("fiber"),
            v.literal("addedSugar"),
            v.literal("saturatedFat"),
            v.literal("sodium")
          )
        ),
        displayPreferences: v.object({
          showPerMealTargets: v.boolean(),
          showProteinOnly: v.boolean(),
          hideCalories: v.boolean(),
          showWarnings: v.boolean(),
          mealCount: v.number(),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated to update profile");
    }

    const updates: Record<string, unknown> = {};

    if (args.onboardingCompleted !== undefined) {
      updates.onboardingCompleted = args.onboardingCompleted;
    }
    if (args.userType !== undefined) {
      updates.userType = args.userType;
    }
    if (args.dietaryRestrictions !== undefined) {
      updates.dietaryRestrictions = args.dietaryRestrictions;
    }
    if (args.customDiet !== undefined) {
      updates.customDiet = args.customDiet;
    }
    if (args.allergies !== undefined) {
      const normalized = Array.from(
        new Set(
          args.allergies
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0)
        )
      );
      updates.allergies = normalized;
    }
    if (args.householdSize !== undefined) {
      updates.householdSize = args.householdSize;
    }
    if (args.favoriteCuisines !== undefined) {
      updates.favoriteCuisines = args.favoriteCuisines;
    }
    if (args.cookingStylePreferences !== undefined) {
      updates.cookingStylePreferences = args.cookingStylePreferences;
    }
    if (args.mealPlanningPreferences !== undefined) {
      updates.mealPlanningPreferences = args.mealPlanningPreferences;
    }
    if (args.preferredTheme !== undefined) {
      updates.preferredTheme = args.preferredTheme;
    }
    if (args.customThemeShareCode !== undefined) {
      updates.customThemeShareCode = args.customThemeShareCode;
    }
    if (args.preferredTextSize !== undefined) {
      updates.preferredTextSize = args.preferredTextSize;
    }
    if (args.dyslexiaMode !== undefined) {
      updates.dyslexiaMode = args.dyslexiaMode;
    }
    if (args.highContrastMode !== undefined) {
      updates.highContrastMode =
        args.highContrastMode === true
          ? "dark"
          : args.highContrastMode === false
          ? "off"
          : args.highContrastMode;
    }
    if (args.motionPreference !== undefined) {
      updates.motionPreference = args.motionPreference;
    }
    if (args.preferredLanguage !== undefined) {
      updates.preferredLanguage = args.preferredLanguage;
    }
    if (args.nutritionGoals !== undefined) {
      updates.nutritionGoals = args.nutritionGoals;
    }

    if (Object.keys(updates).length === 0) {
      return await ctx.db.get(userId);
    }

    await ctx.db.patch(userId, updates);
    return await ctx.db.get(userId);
  },
});

export const seedInventory = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated to seed inventory");
    }

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
      }
    }

    const user = await ctx.db.get(userId);
    if (!user?.householdId) {
      throw new Error("User must belong to a household to seed inventory");
    }

    const household = await ctx.db.get(user.householdId);
    if (!household) {
      throw new Error("Household not found for user");
    }

    if (!household.members.includes(userId)) {
      throw new Error("You must be a household member to seed inventory");
    }

    await ctx.db.patch(user.householdId, {
      inventory: userInventorySeed,
    });

    return await ctx.db.get(userId);
  },
});

/**
 * Migration: Remove inventory field from user documents
 * This is a one-time migration to clean up old data after moving inventory to households.
 * Run this once to fix schema validation errors.
 * 
 * Usage: Call this mutation once from the Convex dashboard or via the API to clean up old data.
 */
export const migrateRemoveInventoryFromUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query("users").collect();
    
    let updated = 0;
    for (const user of users) {
      // Check if user has inventory field (using type assertion to check)
      const userDoc = user as any;
      if ("inventory" in userDoc && userDoc.inventory !== undefined) {
        // Create a new document without the inventory field
        const { inventory, ...userWithoutInventory } = userDoc;
        // Replace the document without the inventory field
        await ctx.db.replace(user._id, userWithoutInventory as any);
        updated += 1;
      }
    }
    
    return { updated, total: users.length };
  },
});
