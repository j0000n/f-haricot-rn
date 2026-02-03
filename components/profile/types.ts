import type { Id } from "@haricot/convex-client";

export type HouseholdMember = {
  id: Id<"users">;
  name?: string | null;
  email?: string | null;
};

export type PendingMember = HouseholdMember & {
  requestedAt: number;
};

export type HouseholdChild = {
  id: string;
  name: string;
  allergies: string[];
};

export type HouseholdDetails = {
  code: string;
  members: HouseholdMember[];
  pendingMembers: PendingMember[];
  children: HouseholdChild[];
};
