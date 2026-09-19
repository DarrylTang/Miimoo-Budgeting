import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

export interface EnrichedRecurringRule extends Doc<"recurringRules"> {
  account?: Doc<"accounts"> | null;
  category?: Doc<"categories"> | null;
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

    const nextRun = args.nextRun ?? Date.now();

    const ruleId = await ctx.db.insert("recurringRules", {
      title: args.title.trim(),
      amount: args.amount,
      type: args.type,
      frequency: args.frequency,
      accountId: args.accountId,
      categoryId: args.categoryId,
      nextRun,
      startDate: args.startDate,
      dayOfMonth: args.dayOfMonth,
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
    if (args.nextRun !== undefined) patchData.nextRun = args.nextRun;
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
 */
export const applyDueRules = mutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const currentTime = args.now ?? Date.now();

    // Query active recurring rules
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

      // 1. Generate transaction
      await ctx.db.insert("transactions", {
        type: rule.type,
        amount: rule.amount,
        accountId: rule.accountId,
        categoryId: rule.categoryId,
        date: rule.nextRun,
        memo: rule.title,
      });

      // 2. Adjust account balance
      if (rule.type === "expense") {
        await ctx.db.patch(rule.accountId, {
          balance: Math.round((account.balance - rule.amount) * 100) / 100,
        });
      } else if (rule.type === "income") {
        await ctx.db.patch(rule.accountId, {
          balance: Math.round((account.balance + rule.amount) * 100) / 100,
        });
      }

      // 3. Compute nextRun
      const nextDate = new Date(rule.nextRun);
      if (rule.frequency === "daily") {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (rule.frequency === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (rule.frequency === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (rule.frequency === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      await ctx.db.patch(rule._id, {
        nextRun: nextDate.getTime(),
      });

      appliedCount++;
      appliedTitles.push(rule.title);
    }

    return {
      appliedCount,
      appliedTitles,
    };
  },
});
