import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const isSeeded = query({
  args: {},
  handler: async (ctx) => {
    const existingAccounts = await ctx.db.query("accounts").first();
    const existingCategories = await ctx.db.query("categories").first();
    return !!(existingAccounts && existingCategories);
  },
});

export const seedInitialData = mutation({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const alreadySeeded = await ctx.db.query("accounts").first();
    if (alreadySeeded && !args.force) {
      return { status: "already_seeded" };
    }

    if (args.force) {
      // Clear existing records if force seeding
      for (const t of await ctx.db.query("transactions").collect()) await ctx.db.delete(t._id);
      for (const r of await ctx.db.query("recurringRules").collect()) await ctx.db.delete(r._id);
      for (const m of await ctx.db.query("memoTags").collect()) await ctx.db.delete(m._id);
      for (const a of await ctx.db.query("accounts").collect()) await ctx.db.delete(a._id);
      for (const c of await ctx.db.query("categories").collect()) await ctx.db.delete(c._id);
      for (const u of await ctx.db.query("userProfile").collect()) await ctx.db.delete(u._id);
    }

    // 1. User Profile
    await ctx.db.insert("userProfile", {
      name: "Darryl",
      email: "darryl@miimoo.local",
      currency: "SGD",
      hiddenBalance: false,
    });

    // 2. Accounts
    const mainAccountId = await ctx.db.insert("accounts", {
      name: "Main Account (Local)",
      type: "local",
      currency: "SGD",
      balance: 12450.00,
      isArchived: false,
    });

    const overseasAccountId = await ctx.db.insert("accounts", {
      name: "Overseas Card",
      type: "overseas",
      currency: "SGD",
      balance: 1500.00,
      isArchived: false,
    });

    // 3. Categories
    const categoryDefs = [
      { name: "Food", type: "expense" as const, icon: "Utensils", color: "#F97316" },
      { name: "Groceries", type: "expense" as const, icon: "ShoppingCart", color: "#10B981" },
      { name: "Utilities", type: "expense" as const, icon: "Zap", color: "#EAB308" },
      { name: "Entertainment", type: "expense" as const, icon: "Film", color: "#8B5CF6" },
      { name: "Housing", type: "expense" as const, icon: "Home", color: "#3B82F6" },
      { name: "Health", type: "expense" as const, icon: "HeartPulse", color: "#EF4444" },
      { name: "Transportation", type: "expense" as const, icon: "Car", color: "#06B6D4" },
      { name: "Clothing", type: "expense" as const, icon: "Shirt", color: "#EC4899" },
      { name: "Education", type: "expense" as const, icon: "GraduationCap", color: "#6366F1" },
      { name: "Insurance", type: "expense" as const, icon: "ShieldCheck", color: "#14B8A6" },
      { name: "Shopping", type: "expense" as const, icon: "ShoppingBag", color: "#F43F5E" },
      // Income categories
      { name: "Salary", type: "income" as const, icon: "Briefcase", color: "#22C55E" },
      { name: "Investment", type: "income" as const, icon: "TrendingUp", color: "#0EA5E9" },
      { name: "Bonus / Gift", type: "income" as const, icon: "Gift", color: "#A855F7" },
      { name: "Other Income", type: "income" as const, icon: "Wallet", color: "#64748B" },
    ];

    const categoryMap = new Map<string, Id<"categories">>();
    for (const cat of categoryDefs) {
      const catId = await ctx.db.insert("categories", {
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isCustom: false,
      });
      categoryMap.set(cat.name, catId);
    }

    // 4. Memo Tags
    const sampleTags = [
      { tag: "for fam dinner", useCount: 14 },
      { tag: "Dinner for fam", useCount: 12 },
      { tag: "Malaysia spenditure", useCount: 9 },
      { tag: "JB food", useCount: 8 },
      { tag: "yakiniku", useCount: 7 },
      { tag: "Didi birthday cake", useCount: 5 },
      { tag: "premium soup", useCount: 4 },
      { tag: "pizza", useCount: 4 },
      { tag: "Liquor", useCount: 3 },
      { tag: "tori q", useCount: 3 },
    ];

    for (const item of sampleTags) {
      await ctx.db.insert("memoTags", item);
    }

    // 5. Recurring Rules
    await ctx.db.insert("recurringRules", {
      title: "Monthly Salary",
      amount: 1185.00,
      type: "income",
      frequency: "monthly",
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      nextRun: new Date(2026, 9, 1, 9, 0, 0).getTime(), // 1st October 2026
      isActive: true,
    });

    await ctx.db.insert("recurringRules", {
      title: "House maintenance",
      amount: 180.00,
      type: "expense",
      frequency: "monthly",
      accountId: mainAccountId,
      categoryId: categoryMap.get("Housing"),
      nextRun: new Date(2026, 9, 1, 9, 0, 0).getTime(),
      isActive: true,
    });

    await ctx.db.insert("recurringRules", {
      title: "SP Services Utilities",
      amount: 115.40,
      type: "expense",
      frequency: "monthly",
      accountId: mainAccountId,
      categoryId: categoryMap.get("Utilities"),
      nextRun: new Date(2026, 9, 12, 9, 0, 0).getTime(),
      isActive: true,
    });

    await ctx.db.insert("recurringRules", {
      title: "Gym & Club membership",
      amount: 45.00,
      type: "expense",
      frequency: "monthly",
      accountId: mainAccountId,
      categoryId: categoryMap.get("Health"),
      nextRun: new Date(2026, 9, 15, 9, 0, 0).getTime(),
      isActive: true,
    });

    // 6. September 2026 Transactions (Matching screenshot)
    // Month Income: $1,185.00
    await ctx.db.insert("transactions", {
      type: "income",
      amount: 1185.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      date: new Date(2026, 8, 1, 10, 0, 0).getTime(), // Sep 1, 2026
      memo: "Monthly Salary",
    });

    // Earlier September expenses (Rent/Housing & Utilities to align with $1,142.51 monthly total)
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 550.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Housing"),
      date: new Date(2026, 8, 2, 11, 0, 0).getTime(),
      memo: "House maintenance & room rent",
    });

    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 185.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Utilities"),
      date: new Date(2026, 8, 5, 14, 0, 0).getTime(),
      memo: "SP Services electricity and water",
    });

    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 143.93,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Groceries"),
      date: new Date(2026, 8, 8, 16, 30, 0).getTime(),
      memo: "FairPrice monthly staples",
    });

    // Sat, 12/09: -$18.75
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 18.75,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Food"),
      date: new Date(2026, 8, 12, 19, 30, 0).getTime(),
      memo: "pizza",
    });

    // Sun, 13/09: -$56.80
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 56.80,
      accountId: overseasAccountId,
      categoryId: categoryMap.get("Food"),
      date: new Date(2026, 8, 13, 13, 15, 0).getTime(),
      memo: "JB food",
    });

    // Mon, 14/09: -$7.30
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 7.30,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Transportation"),
      date: new Date(2026, 8, 14, 8, 45, 0).getTime(),
      memo: "MRT transport",
    });

    // Tue, 15/09: -$12.65
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 12.65,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Food"),
      date: new Date(2026, 8, 15, 12, 30, 0).getTime(),
      memo: "tori q",
    });

    // Fri, 18/09: Shopping -$9.27, Food -$34.44, Food -$23.11 (total -$66.82)
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 9.27,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Shopping"),
      date: new Date(2026, 8, 18, 15, 10, 0).getTime(),
      memo: "Daiso stationery",
    });

    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 34.44,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Food"),
      date: new Date(2026, 8, 18, 18, 45, 0).getTime(),
      memo: "Dinner for fam",
    });

    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 23.11,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Food"),
      date: new Date(2026, 8, 18, 21, 20, 0).getTime(),
      memo: "premium soup",
    });

    // Sat, 19/09: -$101.26
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 101.26,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Food"),
      date: new Date(2026, 8, 19, 12, 30, 0).getTime(),
      memo: "for fam dinner yakiniku",
    });

    // 7. Historical 2026 Monthly Expenses for Analytics (Jan - Aug)
    // Jan: $1,332.17
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 1332.17,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Food"),
      date: new Date(2026, 0, 15, 12, 0, 0).getTime(),
      memo: "Jan total expenditures",
    });
    await ctx.db.insert("transactions", {
      type: "income",
      amount: 1185.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      date: new Date(2026, 0, 1, 9, 0, 0).getTime(),
      memo: "Monthly Salary",
    });

    // Feb: $1,641.07
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 1641.07,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Shopping"),
      date: new Date(2026, 1, 15, 12, 0, 0).getTime(),
      memo: "Feb total expenditures & CNY festivities",
    });
    await ctx.db.insert("transactions", {
      type: "income",
      amount: 1685.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      date: new Date(2026, 1, 1, 9, 0, 0).getTime(),
      memo: "Salary & CNY Bonus",
    });

    // Mar: $1,420.50
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 1420.50,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Groceries"),
      date: new Date(2026, 2, 15, 12, 0, 0).getTime(),
      memo: "Mar total expenditures",
    });
    await ctx.db.insert("transactions", {
      type: "income",
      amount: 1185.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      date: new Date(2026, 2, 1, 9, 0, 0).getTime(),
      memo: "Monthly Salary",
    });

    // Apr: $1,280.90
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 1280.90,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Utilities"),
      date: new Date(2026, 3, 15, 12, 0, 0).getTime(),
      memo: "Apr total expenditures",
    });
    await ctx.db.insert("transactions", {
      type: "income",
      amount: 1185.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      date: new Date(2026, 3, 1, 9, 0, 0).getTime(),
      memo: "Monthly Salary",
    });

    // May: $1,510.40
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 1510.40,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Entertainment"),
      date: new Date(2026, 4, 15, 12, 0, 0).getTime(),
      memo: "May total expenditures",
    });
    await ctx.db.insert("transactions", {
      type: "income",
      amount: 1185.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      date: new Date(2026, 4, 1, 9, 0, 0).getTime(),
      memo: "Monthly Salary",
    });

    // Jun: $1,395.20
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 1395.20,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Housing"),
      date: new Date(2026, 5, 15, 12, 0, 0).getTime(),
      memo: "Jun total expenditures",
    });
    await ctx.db.insert("transactions", {
      type: "income",
      amount: 1185.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      date: new Date(2026, 5, 1, 9, 0, 0).getTime(),
      memo: "Monthly Salary",
    });

    // Jul: $1,460.10
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 1460.10,
      accountId: overseasAccountId,
      categoryId: categoryMap.get("Food"),
      date: new Date(2026, 6, 15, 12, 0, 0).getTime(),
      memo: "Jul total expenditures & Malaysia trip",
    });
    await ctx.db.insert("transactions", {
      type: "income",
      amount: 1185.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      date: new Date(2026, 6, 1, 9, 0, 0).getTime(),
      memo: "Monthly Salary",
    });

    // Aug: $1,215.80
    await ctx.db.insert("transactions", {
      type: "expense",
      amount: 1215.80,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Health"),
      date: new Date(2026, 7, 15, 12, 0, 0).getTime(),
      memo: "Aug total expenditures",
    });
    await ctx.db.insert("transactions", {
      type: "income",
      amount: 1185.00,
      accountId: mainAccountId,
      categoryId: categoryMap.get("Salary"),
      date: new Date(2026, 7, 1, 9, 0, 0).getTime(),
      memo: "Monthly Salary",
    });

    return {
      status: "success",
      seeded: {
        accounts: 2,
        categories: categoryDefs.length,
        memoTags: sampleTags.length,
        recurringRules: 4,
        totalExpenses2026: 12398.65,
      },
    };
  },
});
