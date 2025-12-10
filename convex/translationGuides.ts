import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { translationGuideSeed } from "../data/translationGuideSeed";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;

    for (const row of translationGuideSeed) {
      const existing = await ctx.db
        .query("translationGuides")
        .withIndex("by_code", (q) => q.eq("code", row.code))
        .filter((q) => q.eq(q.field("language"), row.language))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, row);
      } else {
        await ctx.db.insert("translationGuides", row);
        inserted += 1;
      }
    }

    return { inserted, total: translationGuideSeed.length };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("translationGuides").collect();
  },
});

export const lookup = query({
  args: { code: v.string(), language: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const base = ctx.db
      .query("translationGuides")
      .withIndex("by_code", (q) => q.eq("code", args.code));

    if (args.language) {
      return await base.filter((q) => q.eq(q.field("language"), args.language)).collect();
    }

    return await base.collect();
  },
});

export const overrideTranslation = mutation({
  args: {
    code: v.string(),
    language: v.string(),
    text: v.string(),
    context: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("translationGuides")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .filter((q) => q.eq(q.field("language"), args.language))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("translationGuides", args);
  },
});
