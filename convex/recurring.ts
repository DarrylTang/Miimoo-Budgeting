import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

export interface EnrichedRecurringRule extends Doc<"recurringRules"> {
  account?: Doc<"accounts"> | null;
  category?: Doc<"categories"> | null;
}

/**
 * Helper to advance a timestamp accurately across recurrence intervals,
 * preserving specific days of month (e.g. 31st or 1st) across variable-length months.
 */
export function advanceNextRun(
  currentRun: number,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
  dayOfMonth?: number
): number {
  const d = new Date(currentRun);
  if (frequency === "daily") {
    d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  if (frequency === "weekly") {
    d.setDate(d.getDate() + 7);
    return d.getTime();
  }
  if (frequency === "monthly") {
    const targetDay = dayOfMonth ?? d.getDate();
    let nextYear = d.getFullYear();
    let nextMonth = d.getMonth() + 1; // 0-indexed month (0-11), so +1 is next month (1-12)
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    // max days in nextMonth: day 0 of nextMonth+1
    const maxDays = new Date(nextYear, nextMonth + 1, 0).getDate();
    const actualDay = Math.min(targetDay, maxDays);
    d.setFullYear(nextYear, nextMonth, actualDay);
    return d.getTime();
  }
  if (frequency === "yearly") {
    const targetDay = dayOfMonth ?? d.getDate();
    const nextYear = d.getFullYear() + 1;
    const month = d.getMonth();
    const maxDays = new Date(nextYear, month + 1, 0).getDate();
    const actualDay = Math.min(targetDay, maxDays);
    d.setFullYear(nextYear, month, actualDay);
    return d.getTime();
  }
  return currentRun + 86400000;
}

/**
 * List all recurring rules with enriched account and category data.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rules = await ctx.db.query("recurringRules").collect();

    const enriched: EnrichedRecurringRule[] = [];
    for (const rule of rules) {
      const account = await ctx.db.get(rule.accountId);
      const category = rule.categoryId ? await ctx.db.get(rule.categoryId) : null;
      enriched.push({
        ...rule,
        account,
        category,
      });
    }

    return enriched;
  },
});

/**
 * Create a new recurring rule.
 */
export const create = mutation({
  args: {
    title: v.string(),
    amount: v.number(),
    type: v.union(v.literal("expense"), v.literal("income")),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
    accountId: v.id("accounts"),
    categoryId: v.optional(v.id("categories")),
    nextRun: v.optional(v.number()),
    startDate: v.optional(v.string()),
    dayOfMonth: v.optional(v.number()),
    dayOfWeek: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    let nextRun = args.nextRun;
    if (nextRun === undefined) {
      if (args.startDate) {
        const parts = args.startDate.split("-").map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          nextRun = new Date(parts[0], parts[1] - 1, parts[2], 9, 0, 0).getTime();
        } else {
          nextRun = Date.now();
        }
      } else {
        nextRun = Date.now();
      }
    }

    const dayOfMonth =
      args.dayOfMonth ??
      (args.startDate
        ? parseInt(args.startDate.split("-")[2], 10)
        : new Date(nextRun).getDate());

    const ruleId = await ctx.db.insert("recurringRules", {
      title: args.title.trim(),
      amount: args.amount,
      type: args.type,
      frequency: args.frequency,
      accountId: args.accountId,
      categoryId: args.categoryId,
      nextRun,
      startDate: args.startDate,
      dayOfMonth,
      dayOfWeek: args.dayOfWeek,
      isActive: true,
    });

    return ruleId;
  },
});

/**
 * Update an existing recurring rule schedule or details.
 * Strictly preserves past transactions!
 */
export const update = mutation({
  args: {
    id: v.id("recurringRules"),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    type: v.optional(v.union(v.literal("expense"), v.literal("income"))),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
    accountId: v.optional(v.id("accounts")),
    categoryId: v.optional(v.id("categories")),
    nextRun: v.optional(v.number()),
    startDate: v.optional(v.string()),
    dayOfMonth: v.optional(v.number()),
    dayOfWeek: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error("Recurring rule not found");
    }

    if (args.amount !== undefined && args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    if (args.accountId !== undefined) {
      const account = await ctx.db.get(args.accountId);
      if (!account) {
        throw new Error("Account not found");
      }
    }

    const patchData: {
      title?: string;
      amount?: number;
      type?: "expense" | "income";
      frequency?: "daily" | "weekly" | "monthly" | "yearly";
      accountId?: Id<"accounts">;
      categoryId?: Id<"categories">;
      nextRun?: number;
      startDate?: string;
      dayOfMonth?: number;
      dayOfWeek?: string;
      isActive?: boolean;
    } = {};

    if (args.title !== undefined) patchData.title = args.title.trim();
    if (args.amount !== undefined) patchData.amount = args.amount;
    if (args.type !== undefined) patchData.type = args.type;
    if (args.frequency !== undefined) patchData.frequency = args.frequency;
    if (args.accountId !== undefined) patchData.accountId = args.accountId;
    if (args.categoryId !== undefined) patchData.categoryId = args.categoryId;
    if (args.nextRun !== undefined) {
      patchData.nextRun = args.nextRun;
    } else if (args.startDate !== undefined) {
      const parts = args.startDate.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        patchData.nextRun = new Date(parts[0], parts[1] - 1, parts[2], 9, 0, 0).getTime();
      }
    }
    if (args.startDate !== undefined) patchData.startDate = args.startDate;
    if (args.dayOfMonth !== undefined) patchData.dayOfMonth = args.dayOfMonth;
    if (args.dayOfWeek !== undefined) patchData.dayOfWeek = args.dayOfWeek;
    if (args.isActive !== undefined) patchData.isActive = args.isActive;

    await ctx.db.patch(args.id, patchData);
    return args.id;
  },
});

/**
 * Toggle whether a recurring rule is active.
 */
export const toggle = mutation({
  args: {
    id: v.id("recurringRules"),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error("Recurring rule not found");
    }

    const newActive = args.isActive !== undefined ? args.isActive : !rule.isActive;
    await ctx.db.patch(args.id, { isActive: newActive });
    return args.id;
  },
});

/**
 * Remove a recurring rule.
 */
export const remove = mutation({
  args: {
    id: v.id("recurringRules"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error("Recurring rule not found");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Apply all due active recurring rules: generates transactions, updates account balances,
 * and advances nextRun timestamps.
 *
 * Can be executed by Convex cron jobs (scheduled hourly) or triggered directly.
 */
export const applyDueRules = mutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Attempt authentication check safely; allow background cron jobs without authenticated user identity.
    try {
      await getAuthenticatedUser(ctx);
    } catch {
      // Cron / system task runner context - proceed safely
    }

    const currentTime = args.now ?? Date.now();

    // 1. Process recurringRules table
    const activeRules = await ctx.db
      .query("recurringRules")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const dueRules = activeRules.filter((r) => r.nextRun <= currentTime);
    let appliedCount = 0;
    const appliedTitles: string[] = [];

    for (const rule of dueRules) {
      const account = await ctx.db.get(rule.accountId);
      if (!account) continue;

      let runTime = rule.nextRun;
      let iterations = 0;

      // Catch up on all missed intervals up to currentTime (safety capped)
      while (runTime <= currentTime && iterations < 365) {
        iterations++;

        // 1. Generate transaction
        await ctx.db.insert("transactions", {
          type: rule.type,
          amount: rule.amount,
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          date: runTime,
          memo: rule.title,
        });

        // 2. Adjust account balance
        const currentAccount = await ctx.db.get(rule.accountId);
        if (currentAccount) {
          const diff = rule.type === "income" ? rule.amount : -rule.amount;
          await ctx.db.patch(rule.accountId, {
            balance: Math.round((currentAccount.balance + diff) * 100) / 100,
          });
        }

        appliedCount++;
        if (!appliedTitles.includes(rule.title)) {
          appliedTitles.push(rule.title);
        }

        // Advance to next interval
        runTime = advanceNextRun(runTime, rule.frequency, rule.dayOfMonth);
      }

      // Update nextRun to future timestamp
      await ctx.db.patch(rule._id, {
        nextRun: runTime,
      });
    }

    // 2. Also process cloudSyncStore if present (used by frontend sync)
    const syncEntry = await ctx.db
      .query("cloudSyncStore")
      .withIndex("by_syncKey", (q) => q.eq("syncKey", "miimoo_primary"))
      .first();

    if (syncEntry && syncEntry.data) {
      try {
        const syncData = JSON.parse(syncEntry.data);
        if (Array.isArray(syncData.recurring) && syncData.recurring.length > 0) {
          const nowLocalDate = new Date(currentTime);
          const todayStr = `${nowLocalDate.getFullYear()}-${String(nowLocalDate.getMonth() + 1).padStart(2, "0")}-${String(nowLocalDate.getDate()).padStart(2, "0")}`;
          let cloudModified = false;

          if (!Array.isArray(syncData.transactions)) syncData.transactions = [];
          if (!Array.isArray(syncData.accounts)) syncData.accounts = [];

          for (let i = 0; i < syncData.recurring.length; i++) {
            const rule = syncData.recurring[i];
            if (!rule.isActive) continue;

            const ruleNextDate = rule.nextDate || rule.startDate;
            if (!ruleNextDate || ruleNextDate > todayStr) continue;

            let curDate = ruleNextDate;
            let loopSafety = 0;

            while (curDate <= todayStr && loopSafety < 365) {
              loopSafety++;

              // Check for existing transaction deduplication
              const alreadyExists = syncData.transactions.some(
                (t: any) =>
                  (t.recurringRuleId === rule.id && t.date === curDate) ||
                  (t.memo === rule.title &&
                    Math.abs(t.amount - rule.amount) < 0.001 &&
                    t.type === rule.type &&
                    t.accountId === rule.accountId &&
                    t.date === curDate)
              );

              if (!alreadyExists) {
                const newTx = {
                  id: `tx-rec-${rule.id}-${curDate}`,
                  type: rule.type,
                  amount: rule.amount,
                  category: rule.category,
                  accountId: rule.accountId,
                  date: curDate,
                  memo: rule.title,
                  createdAt: currentTime,
                  recurringRuleId: rule.id,
                };
                syncData.transactions.unshift(newTx);

                // Update account balance in snapshot
                const targetAcc = syncData.accounts.find((a: any) => a.id === rule.accountId);
                if (targetAcc) {
                  const diff = rule.type === "income" ? rule.amount : -rule.amount;
                  targetAcc.balance = Math.round((targetAcc.balance + diff) * 100) / 100;
                }

                cloudModified = true;
                appliedCount++;
                if (!appliedTitles.includes(rule.title)) {
                  appliedTitles.push(rule.title);
                }
              }

              // Advance date
              const [y, m, d] = curDate.split("-").map(Number);
              if (rule.frequency === "daily") {
                const nd = new Date(y, m - 1, d);
                nd.setDate(nd.getDate() + 1);
                curDate = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
              } else if (rule.frequency === "weekly") {
                const nd = new Date(y, m - 1, d);
                nd.setDate(nd.getDate() + 7);
                curDate = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
              } else if (rule.frequency === "monthly") {
                const targetDay = rule.dayOfMonth ?? d;
                let ny = y;
                let nm = m + 1;
                if (nm > 12) {
                  nm = 1;
                  ny += 1;
                }
                const maxDays = new Date(ny, nm, 0).getDate();
                const actualDay = Math.min(targetDay, maxDays);
                curDate = `${ny}-${String(nm).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;
              } else if (rule.frequency === "yearly") {
                const targetDay = rule.dayOfMonth ?? d;
                const ny = y + 1;
                const maxDays = new Date(ny, m, 0).getDate();
                const actualDay = Math.min(targetDay, maxDays);
                curDate = `${ny}-${String(m).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;
              } else {
                break;
              }
            }

            if (curDate !== rule.nextDate) {
              rule.nextDate = curDate;
              cloudModified = true;
            }
          }

          if (cloudModified) {
            await ctx.db.patch(syncEntry._id, {
              data: JSON.stringify(syncData),
              lastSyncedAt: currentTime,
              version: (syncEntry.version || 0) + 1,
            });
          }
        }
      } catch (err) {
        console.warn("Failed to process recurring rules on cloudSyncStore:", err);
      }
    }

    return {
      appliedCount,
      appliedTitles,
    };
  },
});
