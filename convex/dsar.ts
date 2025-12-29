import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const RAIL_TYPES = [
  "forYou",
  "readyToCook",
  "quickEasy",
  "cuisines",
  "dietaryFriendly",
  "householdCompatible",
] as const;

const removePendingMembership = async (
  ctx: MutationCtx,
  householdId: Id<"households">,
  userId: Id<"users">
) => {
  const household = await ctx.db.get(householdId);
  if (!household) {
    return;
  }

  const updatedPending = (household.pendingMembers ?? []).filter(
    (entry) => entry.userId !== userId
  );

  if (updatedPending.length === (household.pendingMembers ?? []).length) {
    return;
  }

  await ctx.db.patch(householdId, { pendingMembers: updatedPending });
};

export const exportMyData = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User record not found");
    }

    const [tasks, qrEvents, customThemes] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("qrEvents").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db
        .query("customThemes")
        .withIndex("by_creator", (q) => q.eq("creatorId", userId))
        .collect(),
    ]);

    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const personalizedRecipes = [];
    for (const railType of RAIL_TYPES) {
      const entries = await ctx.db
        .query("userPersonalizedRecipes")
        .withIndex("by_user_and_type", (q) =>
          q.eq("userId", userId).eq("railType", railType)
        )
        .collect();
      personalizedRecipes.push(...entries);
    }

    let household: Record<string, unknown> | null = null;
    if (user.householdId) {
      const householdDoc = await ctx.db.get(user.householdId);
      if (householdDoc) {
        household = {
          _id: householdDoc._id,
          code: householdDoc.code,
          ownerId: householdDoc.ownerId,
          members: householdDoc.members,
          pendingMembers: householdDoc.pendingMembers ?? [],
          inventory: householdDoc.inventory ?? [],
          children: householdDoc.children ?? [],
          createdAt: householdDoc.createdAt,
        };
      }
    }

    return {
      generatedAt: Date.now(),
      user,
      authAccounts,
      household,
      tasks,
      qrEvents,
      customThemes,
      userPersonalizedRecipes: personalizedRecipes,
    };
  },
});

export const deleteMyAccount = mutation({
  args: {},
  returns: v.object({
    deleted: v.boolean(),
    deletedAt: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User record not found");
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(tasks.map((task) => ctx.db.delete(task._id)));

    const qrEvents = await ctx.db
      .query("qrEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(qrEvents.map((event) => ctx.db.delete(event._id)));

    const themes = await ctx.db
      .query("customThemes")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();
    await Promise.all(themes.map((theme) => ctx.db.delete(theme._id)));

    for (const railType of RAIL_TYPES) {
      const entries = await ctx.db
        .query("userPersonalizedRecipes")
        .withIndex("by_user_and_type", (q) =>
          q.eq("userId", userId).eq("railType", railType)
        )
        .collect();
      await Promise.all(entries.map((entry) => ctx.db.delete(entry._id)));
    }

    const recipes = await ctx.db
      .query("recipes")
      .filter((q) => q.eq(q.field("createdBy"), userId))
      .collect();
    await Promise.all(recipes.map((recipe) => ctx.db.patch(recipe._id, { createdBy: undefined })));

    const foodEntries = await ctx.db
      .query("foodLibrary")
      .filter((q) => q.eq(q.field("createdBy"), userId))
      .collect();
    await Promise.all(
      foodEntries.map((entry) => ctx.db.patch(entry._id, { createdBy: undefined }))
    );

    if (user.pendingHouseholdId) {
      await removePendingMembership(ctx, user.pendingHouseholdId, userId);
    }

    if (user.householdId) {
      const household = await ctx.db.get(user.householdId);
      if (household) {
        const remainingMembers = household.members.filter((memberId) => memberId !== userId);
        const remainingPending = (household.pendingMembers ?? []).filter(
          (entry) => entry.userId !== userId
        );

        if (remainingMembers.length === 0) {
          await ctx.db.delete(household._id);
        } else {
          const nextOwner = household.ownerId === userId ? remainingMembers[0] : household.ownerId;
          await ctx.db.patch(household._id, {
            members: remainingMembers,
            pendingMembers: remainingPending,
            ownerId: nextOwner,
          });
        }
      }
    }

    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    for (const session of authSessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      await Promise.all(refreshTokens.map((token) => ctx.db.delete(token._id)));
      await ctx.db.delete(session._id);
    }

    const authVerifiers = await ctx.db.query("authVerifiers").collect();
    const sessionIds = new Set(authSessions.map((session) => session._id));
    await Promise.all(
      authVerifiers
        .filter((verifier) => verifier.sessionId && sessionIds.has(verifier.sessionId))
        .map((verifier) => ctx.db.delete(verifier._id))
    );

    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const account of authAccounts) {
      const verificationCodes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      await Promise.all(verificationCodes.map((code) => ctx.db.delete(code._id)));
      await ctx.db.delete(account._id);
    }

    const identifiers = [user.email, user.phone].filter(Boolean) as string[];
    for (const identifier of identifiers) {
      const rateLimit = await ctx.db
        .query("authRateLimits")
        .withIndex("identifier", (q) => q.eq("identifier", identifier))
        .unique();
      if (rateLimit) {
        await ctx.db.delete(rateLimit._id);
      }
    }

    await ctx.db.delete(userId);

    return { deleted: true, deletedAt: Date.now() };
  },
});
