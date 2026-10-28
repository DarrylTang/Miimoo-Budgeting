// Run: node --experimental-strip-types scripts/check-budget.mjs
import assert from 'node:assert';
import { budgetForMonth, setBudgetFrom, budgetSpent, EMPTY_BUDGET } from '../src/lib/budget.ts';
import { mergeSnapshots } from '../convex/syncMerge.ts';

let b = setBudgetFrom(EMPTY_BUDGET, '2026-09', 1500);
b = setBudgetFrom(b, '2026-12', 2000);
b = setBudgetFrom(b, '2026-11', 1800); // edit Nov: past kept, Dec override dropped
assert.equal(budgetForMonth(b, '2026-08'), 0);
assert.equal(budgetForMonth(b, '2026-10'), 1500);
assert.equal(budgetForMonth(b, '2027-03'), 1800);

const tx = (amount, type, extra = {}) => ({ id: String(amount), type, amount, date: '2026-10-05', ...extra });
assert.equal(budgetSpent([tx(10, 'expense'), tx(20, 'expense', { excludeFromBudget: true }), tx(40, 'income'), tx(80, 'transfer')], '2026-10'), 10);

const older = { amounts: { '2026-01': 1 }, updatedAt: 1 }, newer = { amounts: { '2026-01': 2 }, updatedAt: 2 };
assert.deepEqual(mergeSnapshots({ monthlyBudget: newer }, { monthlyBudget: older }).monthlyBudget, newer);
assert.deepEqual(mergeSnapshots({ monthlyBudget: older }, { monthlyBudget: newer }).monthlyBudget, newer);
assert.deepEqual(mergeSnapshots({}, { monthlyBudget: older }).monthlyBudget, older);
console.log('budget checks ok');
