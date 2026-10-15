// Self-check for the sync merge rules. Run: node --experimental-strip-types scripts/check-sync-merge.mjs
import assert from "node:assert/strict";
import { mergeSnapshots } from "../convex/syncMerge.ts";

const net = (txs, id) =>
  txs.reduce((sum, t) => {
    if (t.accountId === id) sum += t.type === "income" ? t.amount : -t.amount;
    if (t.type === "transfer" && t.toAccountId === id) sum += t.amount;
    return sum;
  }, 0);
const balance = (snap, id) =>
  snap.accounts.find((a) => a.id === id).openingBalance + net(snap.transactions, id);

const acc = { id: "acc-main", openingBalance: 1000, updatedAt: 1 };

// 1. Phone adds an expense, laptop is stale: after both sync, balances agree.
let cloud = { accounts: [acc], transactions: [] };
const phone = { accounts: [acc], transactions: [{ id: "tx-1", type: "expense", amount: 100, accountId: "acc-main", date: "2026-10-15" }] };
cloud = mergeSnapshots(cloud, phone); // phone push
const laptop = mergeSnapshots(cloud, { accounts: [acc], transactions: [] }); // laptop pull
assert.equal(balance(laptop, "acc-main"), 900);
assert.equal(balance(mergeSnapshots(laptop, cloud), "acc-main"), 900);

// 2. A stale device can't overwrite a newer edit; ties resolve to the cloud copy.
const edited = { id: "cat-food", name: "Meals", updatedAt: 200 };
const stale = { id: "cat-food", name: "Food", updatedAt: 1 };
assert.equal(mergeSnapshots({ categories: [edited] }, { categories: [stale] }).categories[0].name, "Meals");
assert.equal(mergeSnapshots({ categories: [stale] }, { categories: [edited] }).categories[0].name, "Meals");
assert.equal(mergeSnapshots({ categories: [{ ...stale, name: "Cloud" }] }, { categories: [stale] }).categories[0].name, "Cloud");

// 3. Items created on another device survive a stale push; tombstones remove items.
const m = mergeSnapshots(
  { cards: [{ id: "card-a" }, { id: "card-b" }], deletedIds: [] },
  { cards: [{ id: "card-a" }], deletedIds: ["card-a"] }
);
assert.deepEqual(m.cards.map((c) => c.id), ["card-b"]);
assert.deepEqual(m.deletedIds, ["card-a"]);

// 4. Clearing a field on the newer copy sticks (winner replaces loser wholesale).
const cleared = mergeSnapshots(
  { transactions: [{ id: "tx-2", cardId: "card-x", updatedAt: 5 }] },
  { transactions: [{ id: "tx-2", updatedAt: 9 }] }
);
assert.equal(cleared.transactions[0].cardId, undefined);

// 5. Recurring keeps the furthest-advanced nextDate even when the other copy wins the edit.
const rec = mergeSnapshots(
  { recurring: [{ id: "rec-1", amount: 10, nextDate: "2026-11-01", updatedAt: 1 }] },
  { recurring: [{ id: "rec-1", amount: 20, nextDate: "2026-10-01", updatedAt: 50 }] }
).recurring[0];
assert.equal(rec.amount, 20);
assert.equal(rec.nextDate, "2026-11-01");

// 6. Regenerated recurring transaction (unstamped) doesn't overwrite an edited one.
const regen = mergeSnapshots(
  { transactions: [{ id: "tx-rec-1-2026-10-01", amount: 1200, updatedAt: 70 }] },
  { transactions: [{ id: "tx-rec-1-2026-10-01", amount: 1185, createdAt: 99999 }] }
);
assert.equal(regen.transactions[0].amount, 1200);

console.log("syncMerge checks passed");
