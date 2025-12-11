import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const EARTH_RADIUS_METERS = 6371000;
const MAX_TIME_DIFF_MS = 2 * 60 * 1000;
const MAX_DISTANCE_METERS = 50;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const distanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

export const recordScan = mutation({
  args: {
    payload: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("qrEvents")
      .withIndex("by_payload", (q) => q.eq("payload", args.payload))
      .collect();

    const timeCutoff = now - MAX_TIME_DIFF_MS;
    let matchedEvent: (typeof existing)[number] | null = null;
    let proximityMeters: number | null = null;

    for (const candidate of existing) {
      if (candidate.pairedAt) {
        continue;
      }
      if (candidate.userId === userId) {
        continue;
      }
      if (candidate.scannedAt < timeCutoff) {
        continue;
      }

      const distance = distanceInMeters(
        args.latitude,
        args.longitude,
        candidate.latitude,
        candidate.longitude,
      );

      if (distance <= MAX_DISTANCE_METERS) {
        matchedEvent = candidate;
        proximityMeters = distance;
        break;
      }
    }

    const insertId = await ctx.db.insert("qrEvents", {
      userId,
      payload: args.payload,
      latitude: args.latitude,
      longitude: args.longitude,
      accuracy: args.accuracy,
      scannedAt: now,
      pairedAt: matchedEvent ? now : undefined,
      pairedWith: matchedEvent ? matchedEvent._id : undefined,
    });

    if (matchedEvent) {
      await ctx.db.patch(matchedEvent._id, {
        pairedAt: matchedEvent.pairedAt ?? now,
        pairedWith: matchedEvent.pairedWith ?? insertId,
      });
    }

    return {
      eventId: insertId,
      paired: Boolean(matchedEvent),
      pairedWith: matchedEvent ? matchedEvent._id : null,
      proximityMeters,
      secondsOffset: matchedEvent ? Math.abs(now - matchedEvent.scannedAt) / 1000 : null,
    };
  },
});

export const getRecentForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("qrEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});
