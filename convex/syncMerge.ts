/**
 * Shared snapshot merge used by both the Convex push mutation and the client pull.
 * Pure function: no Convex/server imports so the client bundle can use it too.
 *
 * Rules:
 * - Every collection is a union by id minus tombstoned (deletedIds) items.
 * - When both sides have the same id, the one with the newer `updatedAt` wins
 *   wholesale (missing = 0; tie -> base, i.e. the cloud copy, so devices converge).
 *   Wholesale, not field-spread, so clearing a field (e.g. removing a card) sticks.
 * - Recurring rules always keep the furthest-advanced nextDate, since processing a
 *   rule advances nextDate without counting as an edit.
 * - Per-device prefs (isBalanceHidden, selectedAccountId) come from incoming.
 */

type Entity = { id?: string; updatedAt?: number; [key: string]: any };

function mergeCollection(base: unknown, incoming: unknown, deleted: Set<string>): any[] {
  const map = new Map<string, Entity>();
  const add = (item: Entity) => {
    if (!item || typeof item !== "object" || !item.id || deleted.has(item.id)) return;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }
    if ((item.updatedAt ?? 0) > (existing.updatedAt ?? 0)) map.set(item.id, item);
  };
  if (Array.isArray(base)) base.forEach(add);
  if (Array.isArray(incoming)) incoming.forEach(add);
  return Array.from(map.values());
}

export function mergeSnapshots(base: any, incoming: any): any {
  base = base && typeof base === "object" ? base : {};
  incoming = incoming && typeof incoming === "object" ? incoming : {};

  const deletedIds = Array.from(
    new Set<string>([
      ...(Array.isArray(base.deletedIds) ? base.deletedIds : []),
      ...(Array.isArray(incoming.deletedIds) ? incoming.deletedIds : []),
    ])
  );
  const deleted = new Set(deletedIds);

  const transactions = mergeCollection(base.transactions, incoming.transactions, deleted).sort((a, b) => {
    const byDate = String(b.date || "").localeCompare(String(a.date || ""));
    return byDate !== 0 ? byDate : Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });

  const baseNextDates = new Map<string, string>();
  if (Array.isArray(base.recurring)) {
    for (const r of base.recurring) if (r?.id && r.nextDate) baseNextDates.set(r.id, r.nextDate);
  }
  const recurring = mergeCollection(base.recurring, incoming.recurring, deleted).map((r) => {
    const other = baseNextDates.get(r.id);
    return other && (!r.nextDate || other > r.nextDate) ? { ...r, nextDate: other } : r;
  });

  const quickTags = Array.from(
    new Set(
      [...(Array.isArray(incoming.quickTags) ? incoming.quickTags : []), ...(Array.isArray(base.quickTags) ? base.quickTags : [])]
        .filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t: string) => t.trim())
    )
  );

  return {
    ...base,
    ...incoming,
    transactions,
    accounts: mergeCollection(base.accounts, incoming.accounts, deleted),
    cards: mergeCollection(base.cards, incoming.cards, deleted),
    categories: mergeCollection(base.categories, incoming.categories, deleted),
    recurring,
    quickTags,
    userName: incoming.userName || base.userName || "Darryl",
    isBalanceHidden:
      typeof incoming.isBalanceHidden === "boolean" ? incoming.isBalanceHidden : (base.isBalanceHidden ?? false),
    selectedAccountId: incoming.selectedAccountId || base.selectedAccountId || "acc-main",
    deletedIds,
  };
}
