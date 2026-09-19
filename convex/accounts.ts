import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

/**
 * List all non-archived accounts with overall, local, and overseas balances.
 */
export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let accountsQuery = ctx.db.query("accounts");

    if (!args.includeArchived) {
      accountsQuery = accountsQuery.filter((q) => q.eq(q.field("isArchived"), false));
    }

    const accounts = await accountsQuery.collect();

    let totalBalance = 0;
    let localBalance = 0;
    let overseasBalance = 0;

    for (const acc of accounts) {
      if (!acc.isArchived) {
        totalBalance += acc.balance;
        if (acc.type === "local") {
          localBalance += acc.balance;
        } else if (acc.type === "overseas") {
          overseasBalance += acc.balance;
        }
      }
    }

    return {
      accounts,
      totalBalance,
      localBalance,
      overseasBalance,
    };
  },
});

/**
 * Create a new account.
 */
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("local"), v.literal("overseas")),
    currency: v.optional(v.string()),
    balance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const accountId = await ctx.db.insert("accounts", {
      name: args.name.trim(),
      type: args.type,
      currency: args.currency ?? "SGD",
      balance: args.balance ?? 0,
      isArchived: false,
    });

    return accountId;
  },
});

/**
 * Update an existing account's name, balance, or currency.
 */
export const update = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    balance: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const account = await ctx.db.get(args.id);
    if (!account) {
      throw new Error(`Account not found: ${args.id}`);
    }

    const updates: { name?: string; balance?: number; currency?: string } = {};
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.balance !== undefined) updates.balance = args.balance;
    if (args.currency !== undefined) updates.currency = args.currency;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Archive or unarchive an account.
 */
export const archive = mutation({
  args: {
    id: v.id("accounts"),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const account = await ctx.db.get(args.id);
    if (!account) {
      throw new Error(`Account not found: ${args.id}`);
    }

    const newArchived = args.isArchived !== undefined ? args.isArchived : !account.isArchived;
    await ctx.db.patch(args.id, { isArchived: newArchived });
    return args.id;
  },
});

/**
 * Transfer funds between two accounts and record a transfer transaction.
 */
export const transfer = mutation({
  args: {
    fromAccountId: v.id("accounts"),
    toAccountId: v.id("accounts"),
    amount: v.number(),
    date: v.optional(v.number()),
    memo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    if (args.amount <= 0) {
      throw new Error("Transfer amount must be greater than zero.");
    }
    if (args.fromAccountId === args.toAccountId) {
      throw new Error("Cannot transfer to the same account.");
    }

    const fromAccount = await ctx.db.get(args.fromAccountId);
    if (!fromAccount) throw new Error("Origin account not found.");

    const toAccount = await ctx.db.get(args.toAccountId);
    if (!toAccount) throw new Error("Destination account not found.");

    // Update balances
    await ctx.db.patch(args.fromAccountId, {
      balance: Math.round((fromAccount.balance - args.amount) * 100) / 100,
    });
    await ctx.db.patch(args.toAccountId, {
      balance: Math.round((toAccount.balance + args.amount) * 100) / 100,
    });

    const timestamp = args.date ?? Date.now();
    const memoText = args.memo || `Transfer to ${toAccount.name}`;

    // Record transfer transaction
    const transactionId = await ctx.db.insert("transactions", {
      type: "transfer",
      amount: args.amount,
      accountId: args.fromAccountId,
      toAccountId: args.toAccountId,
      date: timestamp,
      memo: memoText,
    });

    return {
      transactionId,
      fromBalance: fromAccount.balance - args.amount,
      toBalance: toAccount.balance + args.amount,
    };
  },
});
