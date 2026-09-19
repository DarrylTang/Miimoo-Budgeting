import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Calculates the billing cycle start and end dates for a given start day and reference date.
 */
export function getCycleRange(billingCycleStartDay: number, refDate: Date = new Date()) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-indexed
  const day = refDate.getDate();

  let startYear = year;
  let startMonth = month;
  let endYear = year;
  let endMonth = month;

  if (day >= billingCycleStartDay) {
    // Current cycle started this month
    startYear = year;
    startMonth = month;
    endMonth = month + 1;
    if (endMonth > 11) {
      endMonth = 0;
      endYear++;
    }
  } else {
    // Current cycle started last month
    startMonth = month - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear--;
    }
    endYear = year;
    endMonth = month;
  }

  // Cap day to the max days in each month
  const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const effectiveStartDay = Math.min(billingCycleStartDay, daysInStartMonth);
  const cycleStart = new Date(startYear, startMonth, effectiveStartDay, 0, 0, 0, 0);

  const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
  const effectiveEndDay = Math.min(billingCycleStartDay, daysInEndMonth);
  const cycleEnd = new Date(endYear, endMonth, effectiveEndDay, 0, 0, 0, 0);

  return { cycleStart, cycleEnd };
}

export interface EnrichedCreditCard extends Doc<"creditCards"> {
  cycleSpend: number;
  cycleStartDate: string;
  cycleEndDate: string;
}

/**
 * List all credit cards with calculated cycle spend for the current cycle.
 */
export const list = query({
  args: {
    referenceDate: v.optional(v.number()), // timestamp in milliseconds
  },
  handler: async (ctx, args) => {
    const cards = await ctx.db.query("creditCards").collect();
    const ref = args.referenceDate ? new Date(args.referenceDate) : new Date();

    const result: EnrichedCreditCard[] = [];

    for (const card of cards) {
      const { cycleStart, cycleEnd } = getCycleRange(card.billingCycleStartDay, ref);
      const startMs = cycleStart.getTime();
      const endMs = cycleEnd.getTime();

      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_card", (q) => q.eq("cardId", card._id))
        .collect();

      let cycleSpend = 0;
      for (const tx of txs) {
        if (tx.date >= startMs && tx.date < endMs && tx.type === "expense") {
          cycleSpend += tx.amount;
        }
      }
      cycleSpend = Math.round(cycleSpend * 100) / 100;

      result.push({
        ...card,
        cycleSpend,
        cycleStartDate: cycleStart.toISOString().slice(0, 10),
        cycleEndDate: cycleEnd.toISOString().slice(0, 10),
      });
    }

    return result;
  },
});

/**
 * Create a new credit card.
 */
export const create = mutation({
  args: {
    name: v.string(),
    cardColor: v.string(),
    maxSpendLimit: v.number(),
    minSpendRequirement: v.number(),
    billingCycleStartDay: v.number(),
    rewardCategories: v.array(v.string()),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    if (args.billingCycleStartDay < 1 || args.billingCycleStartDay > 31) {
      throw new Error("Billing cycle start day must be between 1 and 31");
    }

    if (args.isDefault) {
      const defaultCards = await ctx.db
        .query("creditCards")
        .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
        .collect();
      for (const dc of defaultCards) {
        await ctx.db.patch(dc._id, { isDefault: false });
      }
    }

    const cardId = await ctx.db.insert("creditCards", {
      name: args.name.trim(),
      cardColor: args.cardColor,
      maxSpendLimit: args.maxSpendLimit,
      minSpendRequirement: args.minSpendRequirement,
      billingCycleStartDay: args.billingCycleStartDay,
      rewardCategories: args.rewardCategories,
      isDefault: args.isDefault,
    });

    return cardId;
  },
});

/**
 * Update an existing credit card.
 */
export const update = mutation({
  args: {
    id: v.id("creditCards"),
    name: v.optional(v.string()),
    cardColor: v.optional(v.string()),
    maxSpendLimit: v.optional(v.number()),
    minSpendRequirement: v.optional(v.number()),
    billingCycleStartDay: v.optional(v.number()),
    rewardCategories: v.optional(v.array(v.string())),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const card = await ctx.db.get(args.id);
    if (!card) {
      throw new Error("Credit card not found");
    }

    if (
      args.billingCycleStartDay !== undefined &&
      (args.billingCycleStartDay < 1 || args.billingCycleStartDay > 31)
    ) {
      throw new Error("Billing cycle start day must be between 1 and 31");
    }

    if (args.isDefault) {
      const defaultCards = await ctx.db
        .query("creditCards")
        .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
        .collect();
      for (const dc of defaultCards) {
        if (dc._id !== args.id) {
          await ctx.db.patch(dc._id, { isDefault: false });
        }
      }
    }

    const patchData: {
      name?: string;
      cardColor?: string;
      maxSpendLimit?: number;
      minSpendRequirement?: number;
      billingCycleStartDay?: number;
      rewardCategories?: string[];
      isDefault?: boolean;
    } = {};

    if (args.name !== undefined) patchData.name = args.name.trim();
    if (args.cardColor !== undefined) patchData.cardColor = args.cardColor;
    if (args.maxSpendLimit !== undefined) patchData.maxSpendLimit = args.maxSpendLimit;
    if (args.minSpendRequirement !== undefined)
      patchData.minSpendRequirement = args.minSpendRequirement;
    if (args.billingCycleStartDay !== undefined)
      patchData.billingCycleStartDay = args.billingCycleStartDay;
    if (args.rewardCategories !== undefined)
      patchData.rewardCategories = args.rewardCategories;
    if (args.isDefault !== undefined) patchData.isDefault = args.isDefault;

    await ctx.db.patch(args.id, patchData);
    return args.id;
  },
});

/**
 * Set a card as the default card.
 */
export const setDefault = mutation({
  args: {
    id: v.id("creditCards"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const targetCard = await ctx.db.get(args.id);
    if (!targetCard) {
      throw new Error("Credit card not found");
    }

    const allCards = await ctx.db.query("creditCards").collect();
    for (const c of allCards) {
      if (c._id === args.id) {
        if (!c.isDefault) {
          await ctx.db.patch(c._id, { isDefault: true });
        }
      } else if (c.isDefault) {
        await ctx.db.patch(c._id, { isDefault: false });
      }
    }

    return args.id;
  },
});

/**
 * Remove a credit card.
 * STRICT REQUIREMENT: Ensures past transactions are NEVER deleted.
 */
export const remove = mutation({
  args: {
    id: v.id("creditCards"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const card = await ctx.db.get(args.id);
    if (!card) {
      throw new Error("Credit card not found");
    }

    // Find linked transactions and unlink them without deleting
    const linkedTxs = await ctx.db
      .query("transactions")
      .withIndex("by_card", (q) => q.eq("cardId", args.id))
      .collect();

    for (const tx of linkedTxs) {
      // Past transactions are NEVER deleted, card reference is simply cleared
      await ctx.db.patch(tx._id, { cardId: undefined });
    }

    await ctx.db.delete(args.id);

    // If removed card was default, set another remaining card to default
    if (card.isDefault) {
      const remaining = await ctx.db.query("creditCards").first();
      if (remaining) {
        await ctx.db.patch(remaining._id, { isDefault: true });
      }
    }

    return args.id;
  },
});
