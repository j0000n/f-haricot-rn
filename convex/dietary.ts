import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitCustomDiet = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    userDietarySelections: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated to submit dietary preferences");
    }

    // TODO: Map the custom diet to canonical dietary tags so we can personalize recipes.
    // TODO: Evaluate conflicts between the custom diet and saved dietaryRestrictions before saving.

    return {
      status: "queued" as const,
      receivedAt: Date.now(),
    };
  },
});
