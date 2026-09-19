import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const profile = await ctx.db.query("userProfile").first();
    if (!profile) {
      return {
        name: user.name,
        email: user.email,
        currency: user.currency,
        hiddenBalance: user.hiddenBalance,
      };
    }
    return profile;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    currency: v.optional(v.string()),
    hiddenBalance: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);
    const existing = await ctx.db.query("userProfile").first();

    if (existing) {
      const updateData: { name?: string; currency?: string; hiddenBalance?: boolean } = {};
      if (args.name !== undefined) updateData.name = args.name;
      if (args.currency !== undefined) updateData.currency = args.currency;
      if (args.hiddenBalance !== undefined) updateData.hiddenBalance = args.hiddenBalance;

      await ctx.db.patch(existing._id, updateData);
      return existing._id;
    } else {
      return await ctx.db.insert("userProfile", {
        name: args.name ?? "Darryl",
        email: "darryl@miimoo.local",
        currency: args.currency ?? "SGD",
        hiddenBalance: args.hiddenBalance ?? false,
      });
    }
  },
});
