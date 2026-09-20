import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
 * Helper to parse a date string or timestamp to milliseconds for sorting.
 */
function parseDateToMillis(dateVal: any): number {
  if (typeof dateVal === "number") return dateVal;
  if (typeof dateVal === "string") {
    const parsed = Date.parse(dateVal);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

/**
 * Helper to extract the most recent edit/creation timestamp for a transaction.
 */
function getTxTimestamp(tx: any, fallbackTime: number): number {
  if (!tx || typeof tx !== "object") return 0;
  if (typeof tx.updatedAt === "number") return tx.updatedAt;
  if (typeof tx.lastModified === "number") return tx.lastModified;
  if (typeof tx.createdAt === "number") return tx.createdAt;
  return fallbackTime;
}

/**
 * Generic union-merge for collections keyed by `id`.
 * Preserves updated fields when existing in both server and client.
 */
function mergeById<T extends { id?: string }>(serverList: any[] = [], clientList: any[] = []): T[] {
  const map = new Map<string, any>();

  if (Array.isArray(serverList)) {
    for (const item of serverList) {
      if (item && typeof item === "object" && item.id) {
        map.set(item.id, item);
      }
    }
  }

  if (Array.isArray(clientList)) {
    for (const item of clientList) {
      if (item && typeof item === "object" && item.id) {
        const existing = map.get(item.id);
        if (existing) {
          map.set(item.id, { ...existing, ...item });
        } else {
          map.set(item.id, item);
        }
      }
    }
  }

  return Array.from(map.values());
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

    // Existing record found: Perform robust ID-based union merge
    let existingData: any = {};
    try {
      existingData = JSON.parse(existing.data);
    } catch (err) {
      existingData = {};
    }

    // 1. Transactions: union by id, prefer newer timestamp/edits, sort desc by date
    const txMap = new Map<string, any>();
    if (Array.isArray(existingData.transactions)) {
      for (const tx of existingData.transactions) {
        if (tx && typeof tx === "object" && tx.id) {
          txMap.set(tx.id, tx);
        }
      }
    }

    if (Array.isArray(parsedClient.transactions)) {
      for (const clientTx of parsedClient.transactions) {
        if (!clientTx || typeof clientTx !== "object" || !clientTx.id) continue;
        const serverTx = txMap.get(clientTx.id);
        if (!serverTx) {
          txMap.set(clientTx.id, clientTx);
        } else {
          const clientTime = getTxTimestamp(clientTx, args.clientTimestamp);
          const serverTime = getTxTimestamp(serverTx, existing.lastSyncedAt);
          if (clientTime >= serverTime) {
            txMap.set(clientTx.id, { ...serverTx, ...clientTx });
          } else {
            txMap.set(clientTx.id, { ...clientTx, ...serverTx });
          }
        }
      }
    }

    const mergedTransactions = Array.from(txMap.values());
    mergedTransactions.sort((a, b) => {
      const dateA = parseDateToMillis(a.date);
      const dateB = parseDateToMillis(b.date);
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      if (typeof a.date === "string" && typeof b.date === "string" && a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      const createdA = Number(a.createdAt || 0);
      const createdB = Number(b.createdAt || 0);
      return createdB - createdA;
    });

    // 2. Accounts: union by id, preserving updated fields
    const mergedAccounts = mergeById(existingData.accounts, parsedClient.accounts);

    // 3. Cards: union by id
    const mergedCards = mergeById(existingData.cards, parsedClient.cards);

    // 4. Categories: union by id
    const mergedCategories = mergeById(existingData.categories, parsedClient.categories);

    // 5. Recurring: union by id
    const mergedRecurring = mergeById(existingData.recurring, parsedClient.recurring);

    // 6. QuickTags: deduplicated union array
    const serverTags = Array.isArray(existingData.quickTags) ? existingData.quickTags : [];
    const clientTags = Array.isArray(parsedClient.quickTags) ? parsedClient.quickTags : [];
    const mergedQuickTags = Array.from(
      new Set(
        [...serverTags, ...clientTags]
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .map((t) => t.trim())
      )
    );

    // 7. Preferences: client preferences
    const userName =
      parsedClient.userName !== undefined ? parsedClient.userName : (existingData.userName ?? "Darryl");
    const isBalanceHidden =
      parsedClient.isBalanceHidden !== undefined
        ? parsedClient.isBalanceHidden
        : (existingData.isBalanceHidden ?? false);
    const selectedAccountId =
      parsedClient.selectedAccountId !== undefined
        ? parsedClient.selectedAccountId
        : (existingData.selectedAccountId ?? "acc-main");

    const mergedSnapshot = {
      ...existingData,
      ...parsedClient,
      transactions: mergedTransactions,
      accounts: mergedAccounts,
      cards: mergedCards,
      categories: mergedCategories,
      recurring: mergedRecurring,
      quickTags: mergedQuickTags,
      userName,
      isBalanceHidden,
      selectedAccountId,
      lastSyncedAt: now,
    };

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
