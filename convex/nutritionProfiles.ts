import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByRecipe = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nutritionProfiles")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .first();
  },
});

export const upsertForRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    servings: v.number(),
    perServing: v.object({
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
    encodingVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nutritionProfiles")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        perServing: args.perServing,
        servings: args.servings,
        encodingVersion: args.encodingVersion,
        computedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("nutritionProfiles", {
      ...args,
      computedAt: Date.now(),
    });
  },
});
