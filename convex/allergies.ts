import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Verifies and maps user-entered allergy names to food codes.
 * This runs automatically when allergies are saved during onboarding.
 *
 * TODO: Implement allergy verification logic:
 * - Map user-entered allergy names to standardized food codes
 * - Add fuzzy matching and multilingual support
 * - Pull food code mappings from the pantry library
 * - Store verified mappings with user profile for recipe/task filtering
 */
export const verifyAllergies = mutation({
  args: {
    allergies: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated to verify allergies");
    }

    // TODO: Implement verification logic
    // For now, just return the allergies as-is
    return args.allergies;
  },
});
