import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const record = mutation({
  args: {
    message: v.string(),
    name: v.optional(v.string()),
    stack: v.optional(v.string()),
    cause: v.optional(v.string()),
    isFatal: v.optional(v.boolean()),
    source: v.optional(v.string()),
    platform: v.string(),
    platformVersion: v.optional(v.string()),
    appVersion: v.optional(v.string()),
    buildVersion: v.optional(v.string()),
    releaseChannel: v.optional(v.string()),
    deviceName: v.optional(v.string()),
    deviceModel: v.optional(v.string()),
    deviceManufacturer: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    await ctx.db.insert("crashReports", {
      ...args,
      userId: userId ?? undefined,
      reportedAt: now,
    });
  },
});
