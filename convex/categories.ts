import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

/**
 * List categories, optionally filtered by expense or income.
 */
export const list = query({
  args: {
    type: v.optional(v.union(v.literal("expense"), v.literal("income"))),
  },
  handler: async (ctx, args) => {
    const categories = args.type
      ? await ctx.db
          .query("categories")
          .withIndex("by_type", (q) => q.eq("type", args.type!))
          .collect()
      : await ctx.db.query("categories").collect();

    // Grouping helper
    const expenses = categories.filter((c) => c.type === "expense");
    const incomes = categories.filter((c) => c.type === "income");

    return {
      all: categories,
      expenses,
      incomes,
    };
  },
});

/**
 * Create a new custom category.
 */
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("expense"), v.literal("income")),
    icon: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    // Check if category with this name already exists
    const existing = await ctx.db
      .query("categories")
      .filter((q) => q.and(
        q.eq(q.field("name"), args.name.trim()),
        q.eq(q.field("type"), args.type)
      ))
      .first();

    if (existing) {
      return existing._id;
    }

    const categoryId = await ctx.db.insert("categories", {
      name: args.name.trim(),
      type: args.type,
      icon: args.icon.trim() || "Tag",
      color: args.color.trim() || "#6366F1",
      isCustom: true,
    });

    return categoryId;
  },
});

/**
 * Delete a custom category. Default non-custom categories are protected.
 */
export const deleteCustom = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Category not found.");
    }

    if (!category.isCustom) {
      throw new Error("Cannot delete default system categories.");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
