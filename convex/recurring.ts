import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Apply due recurring rules inside the cloud sync snapshot (the app's only data store):
 * generates transactions and advances each rule's nextDate. Account balances are derived
 * from transactions on the client, so they are not touched here.
 *
 * Internal: only callable by the cron in crons.ts, not by clients.
 */
export const applyDueRules = internalMutation({
  args: {
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentTime = args.now ?? Date.now();
    let appliedCount = 0;
    const appliedTitles: string[] = [];

    const syncEntry = await ctx.db
      .query("cloudSyncStore")
      .withIndex("by_syncKey", (q) => q.eq("syncKey", "miimoo_primary"))
      .first();

    if (syncEntry && syncEntry.data) {
      try {
        const syncData = JSON.parse(syncEntry.data);
        if (Array.isArray(syncData.recurring) && syncData.recurring.length > 0) {
          const nowLocalDate = new Date(currentTime);
          const todayStr = `${nowLocalDate.getFullYear()}-${String(nowLocalDate.getMonth() + 1).padStart(2, "0")}-${String(nowLocalDate.getDate()).padStart(2, "0")}`;
          let cloudModified = false;

          if (!Array.isArray(syncData.transactions)) syncData.transactions = [];
          const deletedIds = new Set<string>(Array.isArray(syncData.deletedIds) ? syncData.deletedIds : []);

          for (let i = 0; i < syncData.recurring.length; i++) {
            const rule = syncData.recurring[i];
            if (!rule.isActive) continue;

            const ruleNextDate = rule.nextDate || rule.startDate;
            if (!ruleNextDate || ruleNextDate > todayStr) continue;

            let curDate = ruleNextDate;
            let loopSafety = 0;

            while (curDate <= todayStr && loopSafety < 365) {
              loopSafety++;

              // Check for existing transaction deduplication
              const alreadyExists = deletedIds.has(`tx-rec-${rule.id}-${curDate}`) || syncData.transactions.some(
                (t: any) =>
                  (t.recurringRuleId === rule.id && t.date === curDate) ||
                  (t.memo === rule.title &&
                    Math.abs(t.amount - rule.amount) < 0.001 &&
                    t.type === rule.type &&
                    t.accountId === rule.accountId &&
                    t.date === curDate)
              );

              if (!alreadyExists) {
                const newTx = {
                  id: `tx-rec-${rule.id}-${curDate}`,
                  type: rule.type,
                  amount: rule.amount,
                  category: rule.category,
                  accountId: rule.accountId,
                  date: curDate,
                  memo: rule.title,
                  createdAt: currentTime,
                  recurringRuleId: rule.id,
                };
                // Account balances are derived from transactions on the client; no balance edit here
                syncData.transactions.unshift(newTx);

                cloudModified = true;
                appliedCount++;
                if (!appliedTitles.includes(rule.title)) {
                  appliedTitles.push(rule.title);
                }
              }

              // Advance date
              const [y, m, d] = curDate.split("-").map(Number);
              if (rule.frequency === "daily") {
                const nd = new Date(y, m - 1, d);
                nd.setDate(nd.getDate() + 1);
                curDate = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
              } else if (rule.frequency === "weekly") {
                const nd = new Date(y, m - 1, d);
                nd.setDate(nd.getDate() + 7);
                curDate = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
              } else if (rule.frequency === "monthly") {
                const targetDay = rule.dayOfMonth ?? d;
                let ny = y;
                let nm = m + 1;
                if (nm > 12) {
                  nm = 1;
                  ny += 1;
                }
                const maxDays = new Date(ny, nm, 0).getDate();
                const actualDay = Math.min(targetDay, maxDays);
                curDate = `${ny}-${String(nm).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;
              } else if (rule.frequency === "yearly") {
                const targetDay = rule.dayOfMonth ?? d;
                const ny = y + 1;
                const maxDays = new Date(ny, m, 0).getDate();
                const actualDay = Math.min(targetDay, maxDays);
                curDate = `${ny}-${String(m).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;
              } else {
                break;
              }
            }

            if (curDate !== rule.nextDate) {
              rule.nextDate = curDate;
              cloudModified = true;
            }
          }

          if (cloudModified) {
            await ctx.db.patch(syncEntry._id, {
              data: JSON.stringify(syncData),
              lastSyncedAt: currentTime,
              version: (syncEntry.version || 0) + 1,
            });
          }
        }
      } catch (err) {
        console.warn("Failed to process recurring rules on cloudSyncStore:", err);
      }
    }

    return {
      appliedCount,
      appliedTitles,
    };
  },
});
