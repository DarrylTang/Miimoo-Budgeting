import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { mergeSnapshots } from "./syncMerge";

const PRIMARY_SYNC_KEY = "miimoo_primary";

/**
 * Validates the provided master PIN against environment variables.
 * Rejects with an error if no master PIN is configured or if the pin does not match.
 * NEVER hardcodes any fallback PIN.
 */
export function verifyPin(pin: string): void {
  const masterPin = process.env.NEXT_PUBLIC_MASTER_PIN || process.env.MASTER_PIN;
  if (!masterPin) {
    throw new Error(
      "Master PIN is not configured on Convex. Please set NEXT_PUBLIC_MASTER_PIN or MASTER_PIN in your Convex Dashboard Settings -> Environment Variables."
    );
  }
  if (!pin || pin.trim() !== masterPin.trim()) {
    throw new Error("Unauthorized: Invalid Master PIN.");
  }
}

/**
 * Pull cloud sync data snapshot.
 */
export const pull = query({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    verifyPin(args.pin);

    const existing = await ctx.db
      .query("cloudSyncStore")
      .withIndex("by_syncKey", (q) => q.eq("syncKey", PRIMARY_SYNC_KEY))
      .first();

    const serverTime = Date.now();

    if (!existing) {
      return {
        found: false,
        data: null,
        lastSyncedAt: null,
        serverTime,
      };
    }

    return {
      found: true,
      data: existing.data,
      lastSyncedAt: existing.lastSyncedAt,
      serverTime,
    };
  },
});

/**
 * Verify Master PIN against server environment variables.
 * Allows fresh devices (e.g. mobile phones) to authenticate cleanly
 * even before local storage or build-time env vars are set.
 */
export const verifyMasterPin = query({
  args: {
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const masterPin = process.env.NEXT_PUBLIC_MASTER_PIN || process.env.MASTER_PIN;
    if (!masterPin) {
      return { valid: false, reason: "NOT_CONFIGURED" as const };
    }
    const isValid = !!args.pin && args.pin.trim() === masterPin.trim();
    return { valid: isValid, reason: (isValid ? "OK" : "INVALID_PIN") as "OK" | "INVALID_PIN" };
  },
});

/**
 * Push and merge client data into cloud sync store.
 */
export const push = mutation({
  args: {
    pin: v.string(),
    clientData: v.string(),
    clientTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    verifyPin(args.pin);

    let parsedClient: any;
    try {
      parsedClient = JSON.parse(args.clientData);
    } catch (err) {
      throw new Error("Invalid clientData: Expected valid JSON string");
    }

    if (!parsedClient || typeof parsedClient !== "object") {
      throw new Error("Invalid clientData: Expected a JSON object");
    }

    const existing = await ctx.db
      .query("cloudSyncStore")
      .withIndex("by_syncKey", (q) => q.eq("syncKey", PRIMARY_SYNC_KEY))
      .first();

    const now = Date.now();

    if (!existing) {
      await ctx.db.insert("cloudSyncStore", {
        syncKey: PRIMARY_SYNC_KEY,
        data: args.clientData,
        lastSyncedAt: now,
        version: 1,
        updatedBy: typeof parsedClient.userName === "string" ? parsedClient.userName : undefined,
      });

      return {
        success: true,
        mergedData: args.clientData,
        serverTime: now,
      };
    }

    // Existing record found: shared id-based merge (newer updatedAt wins, tombstones purged)
    let existingData: any = {};
    try {
      existingData = JSON.parse(existing.data);
    } catch (err) {
      existingData = {};
    }

    const mergedSnapshot = { ...mergeSnapshots(existingData, parsedClient), lastSyncedAt: now };
    const userName = mergedSnapshot.userName;

    const mergedDataString = JSON.stringify(mergedSnapshot);

    await ctx.db.patch(existing._id, {
      data: mergedDataString,
      lastSyncedAt: now,
      version: (existing.version || 0) + 1,
      updatedBy: typeof userName === "string" ? userName : undefined,
    });

    return {
      success: true,
      mergedData: mergedDataString,
      serverTime: now,
    };
  },
});
