import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Returns yearly analytics: 12-month breakdown (expense, income, netIncome, running balance)
 * plus totalExpense, totalIncome, avgExpense, avgIncome.
 */
export const getYearlyStats = query({
  args: {
    year: v.number(),
    accountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const startOfYear = new Date(args.year, 0, 1, 0, 0, 0, 0).getTime();
    const endOfYear = new Date(args.year, 11, 31, 23, 59, 59, 999).getTime();

    // Query all transactions in the year
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date", (q) =>
        q.gte("date", startOfYear).lte("date", endOfYear)
      )
      .collect();

    // Filter by accountId if supplied
    const filtered = args.accountId
      ? transactions.filter(
          (t) => t.accountId === args.accountId || t.toAccountId === args.accountId
        )
      : transactions;

    // Initialize 12 months data
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1, // 1 to 12
      monthName: MONTH_NAMES[i],
      expense: 0,
      income: 0,
      netIncome: 0,
      balance: 0,
    }));

    let totalExpense = 0;
    let totalIncome = 0;
    let monthsWithActivity = 0;

    for (const t of filtered) {
      const d = new Date(t.date);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        if (t.type === "expense") {
          months[mIdx].expense += t.amount;
          totalExpense += t.amount;
        } else if (t.type === "income") {
          months[mIdx].income += t.amount;
          totalIncome += t.amount;
        }
      }
    }

    // Calculate running balance and net income
    let runningBalance = 0;
    for (let i = 0; i < 12; i++) {
      const m = months[i];
      m.expense = Math.round(m.expense * 100) / 100;
      m.income = Math.round(m.income * 100) / 100;
      m.netIncome = Math.round((m.income - m.expense) * 100) / 100;

      if (m.expense > 0 || m.income > 0) {
        monthsWithActivity++;
      }

      runningBalance += m.netIncome;
      m.balance = Math.round(runningBalance * 100) / 100;
    }

    totalExpense = Math.round(totalExpense * 100) / 100;
    totalIncome = Math.round(totalIncome * 100) / 100;

    const divisor = monthsWithActivity > 0 ? monthsWithActivity : 1;
    const avgExpense = Math.round((totalExpense / divisor) * 100) / 100;
    const avgIncome = Math.round((totalIncome / divisor) * 100) / 100;

    return {
      year: args.year,
      totalExpense,
      totalIncome,
      avgExpense,
      avgIncome,
      months,
    };
  },
});

/**
 * Returns category breakdown (amount & percentage) for a given period and type (expense / income).
 */
export const getCategoryBreakdown = query({
  args: {
    year: v.number(),
    month: v.optional(v.number()), // 1-12 or 0-11
    type: v.union(v.literal("expense"), v.literal("income")),
    accountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    let startTimestamp: number;
    let endTimestamp: number;

    if (args.month !== undefined) {
      const mIdx = args.month >= 1 && args.month <= 12 ? args.month - 1 : args.month;
      startTimestamp = new Date(args.year, mIdx, 1, 0, 0, 0, 0).getTime();
      endTimestamp = new Date(args.year, mIdx + 1, 0, 23, 59, 59, 999).getTime();
    } else {
      startTimestamp = new Date(args.year, 0, 1, 0, 0, 0, 0).getTime();
      endTimestamp = new Date(args.year, 11, 31, 23, 59, 59, 999).getTime();
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date", (q) =>
        q.gte("date", startTimestamp).lte("date", endTimestamp)
      )
      .collect();

    let filtered = transactions.filter((t) => t.type === args.type);
    if (args.accountId) {
      filtered = filtered.filter((t) => t.accountId === args.accountId);
    }

    // Cache categories
    const categories = await ctx.db.query("categories").collect();
    const categoryMap = new Map<string, Doc<"categories">>();
    for (const c of categories) {
      categoryMap.set(c._id, c);
    }

    const totalsByCategory = new Map<string, number>();
    let overallTotal = 0;

    for (const t of filtered) {
      const catKey = t.categoryId ?? "unspecified";
      const current = totalsByCategory.get(catKey) || 0;
      totalsByCategory.set(catKey, current + t.amount);
      overallTotal += t.amount;
    }

    const breakdown: {
      categoryId?: string;
      name: string;
      icon: string;
      color: string;
      amount: number;
      percentage: number;
    }[] = [];

    for (const [catKey, amount] of totalsByCategory.entries()) {
      const catDoc = categoryMap.get(catKey);
      const roundedAmount = Math.round(amount * 100) / 100;
      const percentage =
        overallTotal > 0
          ? Math.round((amount / overallTotal) * 1000) / 10 // e.g. 24.5%
          : 0;

      breakdown.push({
        categoryId: catDoc?._id,
        name: catDoc?.name ?? "General",
        icon: catDoc?.icon ?? "Tag",
        color: catDoc?.color ?? "#94A3B8",
        amount: roundedAmount,
        percentage,
      });
    }

    // Sort descending by amount
    breakdown.sort((a, b) => b.amount - a.amount);

    return {
      type: args.type,
      totalAmount: Math.round(overallTotal * 100) / 100,
      breakdown,
    };
  },
});
