import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";
import { Id } from "./_generated/dataModel";

export const exportAll = query({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);

    const accounts = await ctx.db.query("accounts").collect();
    const categories = await ctx.db.query("categories").collect();
    const transactions = await ctx.db.query("transactions").collect();
    const recurringRules = await ctx.db.query("recurringRules").collect();
    const memoTags = await ctx.db.query("memoTags").collect();
    const userProfile = await ctx.db.query("userProfile").first();

    return {
      version: "1.0",
      exportDate: Date.now(),
      appName: "Miimoo Budgeting",
      data: {
        accounts,
        categories,
        transactions,
        recurringRules,
        memoTags,
        userProfile,
      },
    };
  },
});

export const restoreAll = mutation({
  args: {
    wipeExisting: v.boolean(),
    jsonData: v.string(),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    let parsed: any;
    try {
      parsed = JSON.parse(args.jsonData);
    } catch {
      throw new Error("Invalid JSON format");
    }

    const payload = parsed.data || parsed;
    const {
      accounts = [],
      categories = [],
      transactions = [],
      recurringRules = [],
      memoTags = [],
      userProfile,
    } = payload;

    if (args.wipeExisting) {
      // Clear tables
      const existingTxs = await ctx.db.query("transactions").collect();
      for (const t of existingTxs) await ctx.db.delete(t._id);

      const existingRecs = await ctx.db.query("recurringRules").collect();
      for (const r of existingRecs) await ctx.db.delete(r._id);

      const existingTags = await ctx.db.query("memoTags").collect();
      for (const tag of existingTags) await ctx.db.delete(tag._id);

      const existingAccs = await ctx.db.query("accounts").collect();
      for (const a of existingAccs) await ctx.db.delete(a._id);

      const existingCats = await ctx.db.query("categories").collect();
      for (const c of existingCats) await ctx.db.delete(c._id);
    }

    // Map old IDs to newly inserted IDs
    const accountIdMap = new Map<string, Id<"accounts">>();
    const categoryIdMap = new Map<string, Id<"categories">>();

    for (const acc of accounts) {
      const newId = await ctx.db.insert("accounts", {
        name: acc.name,
        type: acc.type,
        currency: acc.currency || "SGD",
        balance: acc.balance || 0,
        isArchived: !!acc.isArchived,
      });
      if (acc._id) accountIdMap.set(acc._id, newId);
    }

    for (const cat of categories) {
      const newId = await ctx.db.insert("categories", {
        name: cat.name,
        type: cat.type,
        icon: cat.icon || "Tag",
        color: cat.color || "#6366F1",
        isCustom: !!cat.isCustom,
      });
      if (cat._id) categoryIdMap.set(cat._id, newId);
    }

    for (const tx of transactions) {
      const mappedAccountId = accountIdMap.get(tx.accountId) || (tx.accountId as Id<"accounts">);
      const mappedToAccountId = tx.toAccountId
        ? accountIdMap.get(tx.toAccountId) || (tx.toAccountId as Id<"accounts">)
        : undefined;
      const mappedCategoryId = tx.categoryId
        ? categoryIdMap.get(tx.categoryId) || (tx.categoryId as Id<"categories">)
        : undefined;

      await ctx.db.insert("transactions", {
        type: tx.type,
        amount: tx.amount,
        accountId: mappedAccountId,
        toAccountId: mappedToAccountId,
        categoryId: mappedCategoryId,
        date: tx.date || Date.now(),
        memo: tx.memo,
      });
    }

    for (const r of recurringRules) {
      const mappedAccountId = accountIdMap.get(r.accountId) || (r.accountId as Id<"accounts">);
      const mappedCategoryId = r.categoryId
        ? categoryIdMap.get(r.categoryId) || (r.categoryId as Id<"categories">)
        : undefined;

      await ctx.db.insert("recurringRules", {
        title: r.title,
        amount: r.amount,
        type: r.type,
        frequency: r.frequency,
        accountId: mappedAccountId,
        categoryId: mappedCategoryId,
        nextRun: r.nextRun || Date.now(),
        isActive: r.isActive !== undefined ? r.isActive : true,
      });
    }

    for (const tag of memoTags) {
      const existing = await ctx.db
        .query("memoTags")
        .withIndex("by_tag", (q) => q.eq("tag", tag.tag))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          useCount: existing.useCount + (tag.useCount || 1),
        });
      } else {
        await ctx.db.insert("memoTags", {
          tag: tag.tag,
          useCount: tag.useCount || 1,
        });
      }
    }

    if (userProfile) {
      const existingProf = await ctx.db.query("userProfile").first();
      if (existingProf) {
        await ctx.db.patch(existingProf._id, {
          name: userProfile.name,
          currency: userProfile.currency,
          hiddenBalance: !!userProfile.hiddenBalance,
        });
      } else {
        await ctx.db.insert("userProfile", {
          name: userProfile.name || "Darryl",
          email: userProfile.email || "darryl@miimoo.local",
          currency: userProfile.currency || "SGD",
          hiddenBalance: !!userProfile.hiddenBalance,
        });
      }
    }

    return {
      restoredAccounts: accounts.length,
      restoredCategories: categories.length,
      restoredTransactions: transactions.length,
      restoredRecurringRules: recurringRules.length,
    };
  },
});
