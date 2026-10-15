import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Cloud Sync Snapshot Store
  cloudSyncStore: defineTable({
    syncKey: v.string(), // e.g. "miimoo_primary"
    data: v.string(), // JSON snapshot containing all state
    lastSyncedAt: v.number(),
    version: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_syncKey", ["syncKey"]),
});

