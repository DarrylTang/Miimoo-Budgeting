import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";
import { Doc } from "./_generated/dataModel";

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
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    accountId: v.id("accounts"),
    categoryId: v.optional(v.id("categories")),
    nextRun: v.optional(v.number()),
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
      isActive: true,
    });

    return ruleId;
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
