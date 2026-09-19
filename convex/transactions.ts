import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";
import { Id, Doc } from "./_generated/dataModel";

/**
 * Helper to update memo tag use counts
 */
async function recordMemoTag(ctx: any, rawMemo?: string) {
  if (!rawMemo) return;
  const tag = rawMemo.trim();
  if (!tag) return;

  const existing = await ctx.db
    .query("memoTags")
    .withIndex("by_tag", (q: any) => q.eq("tag", tag))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, { useCount: existing.useCount + 1 });
  } else {
    await ctx.db.insert("memoTags", { tag, useCount: 1 });
  }
}

/**
 * Create a new transaction (expense, income, or transfer)
 * and update account balances accordingly.
 */
export const create = mutation({
  args: {
    type: v.union(v.literal("expense"), v.literal("income"), v.literal("transfer")),
    amount: v.number(),
    accountId: v.id("accounts"),
    toAccountId: v.optional(v.id("accounts")),
    categoryId: v.optional(v.id("categories")),
    date: v.optional(v.number()),
    memo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Transaction amount must be greater than 0");
    }

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Primary account not found");
    }

    // Adjust balances based on transaction type
    if (args.type === "expense") {
      const newBal = Math.round((account.balance - args.amount) * 100) / 100;
      await ctx.db.patch(args.accountId, { balance: newBal });
    } else if (args.type === "income") {
      const newBal = Math.round((account.balance + args.amount) * 100) / 100;
      await ctx.db.patch(args.accountId, { balance: newBal });
    } else if (args.type === "transfer") {
      if (!args.toAccountId) {
        throw new Error("Destination account is required for transfers");
      }
      if (args.toAccountId === args.accountId) {
        throw new Error("Source and destination accounts must be different");
      }
      const toAccount = await ctx.db.get(args.toAccountId);
      if (!toAccount) {
        throw new Error("Destination account not found");
      }

      await ctx.db.patch(args.accountId, {
        balance: Math.round((account.balance - args.amount) * 100) / 100,
      });
      await ctx.db.patch(args.toAccountId, {
        balance: Math.round((toAccount.balance + args.amount) * 100) / 100,
      });
    }

    // Record memo tag
    await recordMemoTag(ctx, args.memo);

    // Insert transaction
    const date = args.date ?? Date.now();
    const transactionId = await ctx.db.insert("transactions", {
      type: args.type,
      amount: args.amount,
      accountId: args.accountId,
      toAccountId: args.toAccountId,
      categoryId: args.categoryId,
      date,
      memo: args.memo?.trim() || undefined,
    });

    return transactionId;
  },
});

/**
 * Update an existing transaction and reconcile account balances.
 */
export const update = mutation({
  args: {
    id: v.id("transactions"),
    type: v.optional(v.union(v.literal("expense"), v.literal("income"), v.literal("transfer"))),
    amount: v.optional(v.number()),
    accountId: v.optional(v.id("accounts")),
    toAccountId: v.optional(v.id("accounts")),
    categoryId: v.optional(v.id("categories")),
    date: v.optional(v.number()),
    memo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const oldTx = await ctx.db.get(args.id);
    if (!oldTx) {
      throw new Error("Transaction not found");
    }

    // Step 1: Revert old transaction balance effects
    const oldAccount = await ctx.db.get(oldTx.accountId);
    if (oldAccount) {
      if (oldTx.type === "expense") {
        await ctx.db.patch(oldTx.accountId, {
          balance: Math.round((oldAccount.balance + oldTx.amount) * 100) / 100,
        });
      } else if (oldTx.type === "income") {
        await ctx.db.patch(oldTx.accountId, {
          balance: Math.round((oldAccount.balance - oldTx.amount) * 100) / 100,
        });
      } else if (oldTx.type === "transfer" && oldTx.toAccountId) {
        await ctx.db.patch(oldTx.accountId, {
          balance: Math.round((oldAccount.balance + oldTx.amount) * 100) / 100,
        });
        const oldToAccount = await ctx.db.get(oldTx.toAccountId);
        if (oldToAccount) {
          await ctx.db.patch(oldTx.toAccountId, {
            balance: Math.round((oldToAccount.balance - oldTx.amount) * 100) / 100,
          });
        }
      }
    }

    // Step 2: Apply new transaction balance effects
    const newType = args.type ?? oldTx.type;
    const newAmount = args.amount ?? oldTx.amount;
    const newAccountId = args.accountId ?? oldTx.accountId;
    const newToAccountId = args.toAccountId !== undefined ? args.toAccountId : oldTx.toAccountId;

    const freshAccount = await ctx.db.get(newAccountId);
    if (!freshAccount) {
      throw new Error("Primary account not found");
    }

    if (newType === "expense") {
      await ctx.db.patch(newAccountId, {
        balance: Math.round((freshAccount.balance - newAmount) * 100) / 100,
      });
    } else if (newType === "income") {
      await ctx.db.patch(newAccountId, {
        balance: Math.round((freshAccount.balance + newAmount) * 100) / 100,
      });
    } else if (newType === "transfer") {
      if (!newToAccountId) {
        throw new Error("Destination account is required for transfers");
      }
      const freshToAccount = await ctx.db.get(newToAccountId);
      if (!freshToAccount) {
        throw new Error("Destination account not found");
      }
      await ctx.db.patch(newAccountId, {
        balance: Math.round((freshAccount.balance - newAmount) * 100) / 100,
      });
      await ctx.db.patch(newToAccountId, {
        balance: Math.round((freshToAccount.balance + newAmount) * 100) / 100,
      });
    }

    // Step 3: Record memo tag if changed
    if (args.memo) {
      await recordMemoTag(ctx, args.memo);
    }

    // Step 4: Patch transaction
    const patchData: {
      type?: "expense" | "income" | "transfer";
      amount?: number;
      accountId?: Id<"accounts">;
      toAccountId?: Id<"accounts">;
      categoryId?: Id<"categories">;
      date?: number;
      memo?: string;
    } = {};

    if (args.type !== undefined) patchData.type = args.type;
    if (args.amount !== undefined) patchData.amount = args.amount;
    if (args.accountId !== undefined) patchData.accountId = args.accountId;
    if (args.toAccountId !== undefined) patchData.toAccountId = args.toAccountId;
    if (args.categoryId !== undefined) patchData.categoryId = args.categoryId;
    if (args.date !== undefined) patchData.date = args.date;
    if (args.memo !== undefined) patchData.memo = args.memo.trim() || undefined;

    await ctx.db.patch(args.id, patchData);
    return args.id;
  },
});

/**
 * Remove a transaction and revert its balance impact.
 */
export const remove = mutation({
  args: {
    id: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const tx = await ctx.db.get(args.id);
    if (!tx) {
      throw new Error("Transaction not found");
    }

    const account = await ctx.db.get(tx.accountId);
    if (account) {
      if (tx.type === "expense") {
        await ctx.db.patch(tx.accountId, {
          balance: Math.round((account.balance + tx.amount) * 100) / 100,
        });
      } else if (tx.type === "income") {
        await ctx.db.patch(tx.accountId, {
          balance: Math.round((account.balance - tx.amount) * 100) / 100,
        });
      } else if (tx.type === "transfer" && tx.toAccountId) {
        await ctx.db.patch(tx.accountId, {
          balance: Math.round((account.balance + tx.amount) * 100) / 100,
        });
        const toAccount = await ctx.db.get(tx.toAccountId);
        if (toAccount) {
          await ctx.db.patch(tx.toAccountId, {
            balance: Math.round((toAccount.balance - tx.amount) * 100) / 100,
          });
        }
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export interface EnrichedTransaction extends Doc<"transactions"> {
  category?: Doc<"categories"> | null;
  account?: Doc<"accounts"> | null;
  toAccount?: Doc<"accounts"> | null;
}

export interface DayGroup {
  dateStr: string; // e.g. "19/09"
  fullDateStr: string; // e.g. "2026-09-19"
  dayOfWeek: string; // e.g. "Sat"
  displayDate: string; // e.g. "Sat, 19/09"
  timestamp: number;
  totalExpense: number;
  totalIncome: number;
  items: EnrichedTransaction[];
}

/**
 * List transactions for a given month and year, including summary totals
 * and grouped by date.
 */
export const listByMonth = query({
  args: {
    year: v.number(),
    month: v.number(), // Accepts 1-12 (or 0-11)
    accountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    // Standardize to 0-indexed month for JavaScript Date
    const monthIndex = args.month >= 1 && args.month <= 12 ? args.month - 1 : args.month;

    // Build timestamp range covering the entire month in local & UTC boundaries
    const startOfMonth = new Date(args.year, monthIndex, 1, 0, 0, 0, 0).getTime();
    const endOfMonth = new Date(args.year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();

    // Query transactions by date range
    const allInMonth = await ctx.db
      .query("transactions")
      .withIndex("by_date", (q) =>
        q.gte("date", startOfMonth).lte("date", endOfMonth)
      )
      .collect();

    // Filter by accountId if specified
    const filtered = args.accountId
      ? allInMonth.filter(
          (t) => t.accountId === args.accountId || t.toAccountId === args.accountId
        )
      : allInMonth;

    // Cache categories and accounts
    const categoryCache = new Map<string, Doc<"categories"> | null>();
    const accountCache = new Map<string, Doc<"accounts"> | null>();

    const enrichedList: EnrichedTransaction[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of filtered) {
      // Enrich category
      let category: Doc<"categories"> | null = null;
      if (t.categoryId) {
        if (!categoryCache.has(t.categoryId)) {
          categoryCache.set(t.categoryId, await ctx.db.get(t.categoryId));
        }
        category = categoryCache.get(t.categoryId) ?? null;
      }

      // Enrich primary account
      let account: Doc<"accounts"> | null = null;
      if (!accountCache.has(t.accountId)) {
        accountCache.set(t.accountId, await ctx.db.get(t.accountId));
      }
      account = accountCache.get(t.accountId) ?? null;

      // Enrich destination account
      let toAccount: Doc<"accounts"> | null = null;
      if (t.toAccountId) {
        if (!accountCache.has(t.toAccountId)) {
          accountCache.set(t.toAccountId, await ctx.db.get(t.toAccountId));
        }
        toAccount = accountCache.get(t.toAccountId) ?? null;
      }

      if (t.type === "income") {
        totalIncome += t.amount;
      } else if (t.type === "expense") {
        totalExpense += t.amount;
      }

      enrichedList.push({
        ...t,
        category,
        account,
        toAccount,
      });
    }

    // Sort descending by date
    enrichedList.sort((a, b) => b.date - a.date);

    // Group by day
    const dayMap = new Map<string, DayGroup>();
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (const item of enrichedList) {
      const d = new Date(item.date);
      const day = String(d.getDate()).padStart(2, "0");
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const y = d.getFullYear();
      const dateStr = `${day}/${m}`;
      const fullDateStr = `${y}-${m}-${day}`;
      const dayOfWeek = daysOfWeek[d.getDay()];
      const displayDate = `${dayOfWeek}, ${dateStr}`;

      if (!dayMap.has(fullDateStr)) {
        const midnight = new Date(y, d.getMonth(), d.getDate(), 0, 0, 0).getTime();
        dayMap.set(fullDateStr, {
          dateStr,
          fullDateStr,
          dayOfWeek,
          displayDate,
          timestamp: midnight,
          totalExpense: 0,
          totalIncome: 0,
          items: [],
        });
      }

      const group = dayMap.get(fullDateStr)!;
      group.items.push(item);
      if (item.type === "expense") {
        group.totalExpense += item.amount;
      } else if (item.type === "income") {
        group.totalIncome += item.amount;
      }
    }

    // Sort groups descending by date
    const groupedByDate = Array.from(dayMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    for (const g of groupedByDate) {
      g.totalExpense = Math.round(g.totalExpense * 100) / 100;
      g.totalIncome = Math.round(g.totalIncome * 100) / 100;
    }

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpense = Math.round(totalExpense * 100) / 100;
    const netIncome = Math.round((totalIncome - totalExpense) * 100) / 100;

    return {
      income: totalIncome,
      expense: totalExpense,
      netIncome,
      list: enrichedList,
      groupedByDate,
    };
  },
});

/**
 * List recent / top memo tags.
 */
export const listRecentMemos = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 15;
    const tags = await ctx.db
      .query("memoTags")
      .withIndex("by_useCount")
      .order("desc")
      .take(limit);

    return tags.map((t) => t.tag);
  },
});
