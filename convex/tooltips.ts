import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("tooltips")
      .withIndex("by_user_and_dismissed", (q) => q.eq("userId", userId).eq("isDismissed", false))
      .collect();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("tooltips")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const dismiss = mutation({
  args: { id: v.id("tooltips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const tooltip = await ctx.db.get(args.id);

    if (!tooltip || tooltip.userId !== userId) {
      throw new Error("Tooltip not found");
    }

    await ctx.db.patch(args.id, {
      isDismissed: true,
      dismissedAt: Date.now(),
    });
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const tooltipId = await ctx.db.insert("tooltips", {
      userId,
      title: args.title,
      content: args.content,
      isDismissed: false,
      createdAt: Date.now(),
    });

    return tooltipId;
  },
});
