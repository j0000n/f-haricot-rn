import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

import type { UserInventoryEntry } from "../types/food";

const CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

type HouseholdDoc = Doc<"households">;
type UserDoc = Doc<"users">;

type HouseholdMember = {
  id: Id<"users">;
  name: string | null;
  email: string | null;
  image: string | null;
};

type PendingMember = HouseholdMember & {
  requestedAt: number;
};

type HouseholdChild = {
  id: string;
  name: string;
  allergies: string[];
  createdAt: number;
};

type HouseholdPayload = {
  _id: Id<"households">;
  code: string;
  ownerId: Id<"users">;
  members: HouseholdMember[];
  pendingMembers: PendingMember[];
  inventory: UserInventoryEntry[];
  children: HouseholdChild[];
};

type HouseholdResponse =
  | { status: "none"; household: null }
  | { status: "pending" | "member"; household: HouseholdPayload };

const normalizeCode = (code: string) => code.trim().toUpperCase();

const buildMember = (user: UserDoc | null): HouseholdMember | null => {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  };
};

const loadHouseholdPayload = async (
  ctx: QueryCtx | MutationCtx,
  household: HouseholdDoc
): Promise<HouseholdPayload> => {
  const memberDocs = await Promise.all(
    household.members.map((memberId) => ctx.db.get(memberId))
  );
  const members = memberDocs
    .map((doc) => buildMember(doc))
    .filter((entry): entry is HouseholdMember => entry !== null);

  const pendingSource = household.pendingMembers ?? [];
  const pendingDocs = await Promise.all(
    pendingSource.map(async (pending) => {
      const user = await ctx.db.get(pending.userId);
      const member = buildMember(user);
      if (!member) {
        return null;
      }
      return { ...member, requestedAt: pending.requestedAt };
    })
  );

  const pendingMembers = pendingDocs.filter(
    (entry): entry is PendingMember => entry !== null
  );

  const children = [...(household.children ?? [])].sort(
    (a, b) => a.createdAt - b.createdAt
  );

  return {
    _id: household._id,
    code: household.code,
    ownerId: household.ownerId,
    members,
    pendingMembers,
    inventory: (household.inventory ?? []) as UserInventoryEntry[],
    children,
  };
};

const findHouseholdByCode = async (ctx: MutationCtx, code: string) => {
  return await ctx.db
    .query("households")
    .withIndex("by_code", (q) => q.eq("code", code))
    .unique();
};

const generateRandomCode = () => {
  let output = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    const random = Math.floor(Math.random() * CODE_CHARACTERS.length);
    output += CODE_CHARACTERS[random];
  }
  return output;
};

const generateUniqueCode = async (ctx: MutationCtx): Promise<string> => {
  let attempts = 0;
  while (attempts < 20) {
    const candidate = generateRandomCode();
    const existing = await findHouseholdByCode(ctx, candidate);
    if (!existing) {
      return candidate;
    }
    attempts += 1;
  }
  throw new Error("Unable to generate a unique household code");
};

const generateChildId = () =>
  `child_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

const normalizeAllergyList = (allergies: string[]) => {
  const trimmed = allergies.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  return Array.from(new Set(trimmed));
};

const requireHouseholdMembership = async (
  ctx: MutationCtx
): Promise<{ user: UserDoc; household: HouseholdDoc }> => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("User must be authenticated");
  }

  const user = await ctx.db.get(userId);
  if (!user?.householdId) {
    throw new Error("No household to manage");
  }

  const household = await ctx.db.get(user.householdId);
  if (!household) {
    throw new Error("Household not found");
  }

  if (!household.members.includes(userId)) {
    throw new Error("You must be a household member to manage household details");
  }

  return { user, household };
};

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

const createHouseholdForUser = async (
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<Id<"households">> => {
  const code = await generateUniqueCode(ctx);
  const householdId = await ctx.db.insert("households", {
    code,
    ownerId: userId,
    members: [userId],
    pendingMembers: [],
    inventory: [],
    children: [],
    createdAt: Date.now(),
  });
  await ctx.db.patch(userId, {
    householdId,
    pendingHouseholdId: undefined,
  });
  return householdId;
};

export const getHousehold = query({
  args: {},
  handler: async (ctx): Promise<HouseholdResponse | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    if (user.householdId) {
      const household = await ctx.db.get(user.householdId);
      if (!household) {
        return { status: "none", household: null };
      }
      return {
        status: "member",
        household: await loadHouseholdPayload(ctx, household),
      };
    }

    if (user.pendingHouseholdId) {
      const household = await ctx.db.get(user.pendingHouseholdId);
      if (!household) {
        return { status: "none", household: null };
      }
      return {
        status: "pending",
        household: await loadHouseholdPayload(ctx, household),
      };
    }

    return { status: "none", household: null };
  },
});

export const ensureHousehold = mutation({
  args: {},
  handler: async (ctx): Promise<HouseholdResponse> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User record not found");
    }

    if (user.householdId) {
      const existing = await ctx.db.get(user.householdId);
      if (existing) {
        return {
          status: "member",
          household: await loadHouseholdPayload(ctx, existing),
        };
      }
    }

    if (user.pendingHouseholdId) {
      await removePendingMembership(ctx, user.pendingHouseholdId, userId);
      await ctx.db.patch(userId, { pendingHouseholdId: undefined });
    }

    const newHouseholdId = await createHouseholdForUser(ctx, userId);
    const household = await ctx.db.get(newHouseholdId);
    if (!household) {
      throw new Error("Failed to create household");
    }

    return {
      status: "member",
      household: await loadHouseholdPayload(ctx, household),
    };
  },
});

export const joinHouseholdByCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const normalized = normalizeCode(args.code);
    if (!normalized) {
      throw new Error("Enter a valid household code");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User record not found");
    }

    const household = await findHouseholdByCode(ctx, normalized);
    if (!household) {
      return { status: "not_found" as const };
    }

    if (user.householdId && user.householdId !== household._id) {
      return { status: "already_in_household" as const };
    }

    if (household.members.includes(userId)) {
      await ctx.db.patch(userId, {
        householdId: household._id,
        pendingHouseholdId: undefined,
      });
      return { status: "member" as const };
    }

    if (user.pendingHouseholdId && user.pendingHouseholdId !== household._id) {
      await removePendingMembership(ctx, user.pendingHouseholdId, userId);
    }

    const pendingMembers = household.pendingMembers ?? [];
    if (!pendingMembers.some((entry) => entry.userId === userId)) {
      pendingMembers.push({ userId, requestedAt: Date.now() });
      await ctx.db.patch(household._id, { pendingMembers });
    }

    await ctx.db.patch(userId, {
      pendingHouseholdId: household._id,
      householdId: undefined,
    });

    return { status: "pending" as const };
  },
});

export const confirmHouseholdMember = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<HouseholdResponse> => {
    const { household } = await requireHouseholdMembership(ctx);

    const pendingMembers = household.pendingMembers ?? [];
    if (!pendingMembers.some((entry) => entry.userId === args.userId)) {
      throw new Error("This user is not awaiting approval");
    }

    const updatedPending = pendingMembers.filter(
      (entry) => entry.userId !== args.userId
    );
    const updatedMembers = household.members.includes(args.userId)
      ? household.members
      : [...household.members, args.userId];

    await ctx.db.patch(household._id, {
      pendingMembers: updatedPending,
      members: updatedMembers,
    });

    await ctx.db.patch(args.userId, {
      householdId: household._id,
      pendingHouseholdId: undefined,
    });

    const updatedHousehold = await ctx.db.get(household._id);
    if (!updatedHousehold) {
      throw new Error("Failed to load updated household");
    }

    return {
      status: "member",
      household: await loadHouseholdPayload(ctx, updatedHousehold),
    };
  },
});

export const acknowledgePendingMembers = mutation({
  args: { latestSeenRequestAt: v.number() },
  handler: async (ctx, args) => {
    const { user } = await requireHouseholdMembership(ctx);

    const latest = Math.max(args.latestSeenRequestAt, 0);
    await ctx.db.patch(user._id, { lastPendingApprovalSeenAt: latest });
    return { success: true };
  },
});

export const addHouseholdChild = mutation({
  args: {
    name: v.string(),
    allergies: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<HouseholdResponse> => {
    const { household } = await requireHouseholdMembership(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Enter a name for the child");
    }

    const allergies = normalizeAllergyList(args.allergies);
    const children = household.children ?? [];
    const newChild: HouseholdChild = {
      id: generateChildId(),
      name,
      allergies,
      createdAt: Date.now(),
    };

    await ctx.db.patch(household._id, { children: [...children, newChild] });
    const updatedHousehold = await ctx.db.get(household._id);
    if (!updatedHousehold) {
      throw new Error("Failed to update household children");
    }

    return {
      status: "member",
      household: await loadHouseholdPayload(ctx, updatedHousehold),
    };
  },
});

export const updateHouseholdChild = mutation({
  args: {
    childId: v.string(),
    name: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<HouseholdResponse> => {
    const { household } = await requireHouseholdMembership(ctx);
    const children = household.children ?? [];
    const index = children.findIndex((child) => child.id === args.childId);
    if (index < 0) {
      throw new Error("Child not found");
    }

    const updatedChild = { ...children[index] };
    if (args.name !== undefined) {
      const trimmed = args.name.trim();
      if (!trimmed) {
        throw new Error("Enter a name for the child");
      }
      updatedChild.name = trimmed;
    }

    if (args.allergies !== undefined) {
      updatedChild.allergies = normalizeAllergyList(args.allergies);
    }

    const nextChildren = [...children];
    nextChildren[index] = updatedChild;

    await ctx.db.patch(household._id, { children: nextChildren });
    const updatedHousehold = await ctx.db.get(household._id);
    if (!updatedHousehold) {
      throw new Error("Failed to update household child");
    }

    return {
      status: "member",
      household: await loadHouseholdPayload(ctx, updatedHousehold),
    };
  },
});

export const removeHouseholdChild = mutation({
  args: { childId: v.string() },
  handler: async (ctx, args): Promise<HouseholdResponse> => {
    const { household } = await requireHouseholdMembership(ctx);
    const children = household.children ?? [];
    const nextChildren = children.filter((child) => child.id !== args.childId);
    if (nextChildren.length === children.length) {
      throw new Error("Child not found");
    }

    await ctx.db.patch(household._id, { children: nextChildren });
    const updatedHousehold = await ctx.db.get(household._id);
    if (!updatedHousehold) {
      throw new Error("Failed to remove household child");
    }

    return {
      status: "member",
      household: await loadHouseholdPayload(ctx, updatedHousehold),
    };
  },
});

export const leaveHousehold = mutation({
  args: {},
  handler: async (ctx): Promise<HouseholdResponse> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User record not found");
    }

    if (user.pendingHouseholdId) {
      await removePendingMembership(ctx, user.pendingHouseholdId, userId);
    }

    if (user.householdId) {
      const household = await ctx.db.get(user.householdId);
      if (household) {
        const remainingMembers = household.members.filter(
          (memberId) => memberId !== userId
        );
        const remainingPending = (household.pendingMembers ?? []).filter(
          (entry) => entry.userId !== userId
        );

        if (remainingMembers.length === 0) {
          await ctx.db.delete(household._id);
        } else {
          const nextOwner = household.ownerId === userId
            ? remainingMembers[0]
            : household.ownerId;
          await ctx.db.patch(household._id, {
            members: remainingMembers,
            pendingMembers: remainingPending,
            ownerId: nextOwner,
          });
        }
      }
    }

    await ctx.db.patch(userId, {
      householdId: undefined,
      pendingHouseholdId: undefined,
    });

    const newHouseholdId = await createHouseholdForUser(ctx, userId);
    const household = await ctx.db.get(newHouseholdId);
    if (!household) {
      throw new Error("Failed to create new household");
    }

    return {
      status: "member",
      household: await loadHouseholdPayload(ctx, household),
    };
  },
});

export const changeHouseholdCode = mutation({
  args: { desiredCode: v.optional(v.string()) },
  handler: async (ctx, args): Promise<HouseholdResponse> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User must be authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user?.householdId) {
      throw new Error("No household to update");
    }

    const household = await ctx.db.get(user.householdId);
    if (!household) {
      throw new Error("Household not found");
    }

    if (!household.members.includes(userId)) {
      throw new Error("You must be a household member to manage the code");
    }

    let newCode: string;
    if (args.desiredCode) {
      newCode = normalizeCode(args.desiredCode);
      if (!newCode) {
        throw new Error("Enter a valid household code");
      }
      const existing = await findHouseholdByCode(ctx, newCode);
      if (existing && existing._id !== household._id) {
        throw new Error("That code is already in use");
      }
    } else {
      newCode = await generateUniqueCode(ctx);
    }

    await ctx.db.patch(household._id, { code: newCode });
    const updatedHousehold = await ctx.db.get(household._id);
    if (!updatedHousehold) {
      throw new Error("Failed to update household code");
    }

    return {
      status: "member",
      household: await loadHouseholdPayload(ctx, updatedHousehold),
    };
  },
});
