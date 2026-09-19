import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Accounts (Local & Overseas balances)
  accounts: defineTable({
    name: v.string(), // e.g. "Main Account (Local)", "Overseas Card"
    type: v.union(v.literal("local"), v.literal("overseas")),
    currency: v.string(), // default "SGD"
    balance: v.number(),
    isArchived: v.boolean(),
  })
    .index("by_type", ["type"])
    .index("by_isArchived", ["isArchived"]),

  // Categories (Default & Custom)
  categories: defineTable({
    name: v.string(), // "Food", "Entertainment", "Transportation", "Groceries", "Clothing", "Utilities", "Health", "Insurance", "Shopping", etc.
    type: v.union(v.literal("expense"), v.literal("income")),
    icon: v.string(), // Lucide icon name, e.g. "Utensils", "Film", "Car", etc.
    color: v.string(), // Hex or CSS color string
    isCustom: v.boolean(),
  })
    .index("by_type", ["type"])
    .index("by_isCustom", ["isCustom"]),

  // Transactions
  transactions: defineTable({
    type: v.union(v.literal("expense"), v.literal("income"), v.literal("transfer")),
    amount: v.number(),
    accountId: v.id("accounts"),
    toAccountId: v.optional(v.id("accounts")), // for transfers
    categoryId: v.optional(v.id("categories")), // optional for transfers
    date: v.number(), // timestamp in milliseconds
    memo: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_account", ["accountId"])
    .index("by_category", ["categoryId"])
    .index("by_type", ["type"]),

  // Recurring Rules
  recurringRules: defineTable({
    title: v.string(),
    amount: v.number(),
    type: v.union(v.literal("expense"), v.literal("income")),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    accountId: v.id("accounts"),
    categoryId: v.optional(v.id("categories")),
    nextRun: v.number(), // timestamp in milliseconds
    isActive: v.boolean(),
  })
    .index("by_isActive", ["isActive"])
    .index("by_nextRun", ["nextRun"]),

  // Memo Tags (Frequent & Recent Tags)
  memoTags: defineTable({
    tag: v.string(),
    useCount: v.number(),
  })
    .index("by_tag", ["tag"])
    .index("by_useCount", ["useCount"]),

  // User Profile
  userProfile: defineTable({
    name: v.string(),
    email: v.string(),
    currency: v.string(),
    hiddenBalance: v.boolean(),
  })
    .index("by_email", ["email"]),
});
