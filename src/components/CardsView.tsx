'use client';

import React, { useState } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  Star,
  Edit2,
  Trash2,
  CheckCircle,
  Wifi,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { useBudget } from '@/lib/store';
import { CreditCard, CardColorTheme } from '@/types';
import { CardEditorModal, THEME_CONFIG } from '@/components/CardEditorModal';

export function CardsView() {
  const {
    cards,
    transactions,
    setDefaultCard,
    deleteCard,
  } = useBudget();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Month reference: default to September 2026
  const currentMonth = '2026-09';
  const monthName = 'September 2026';

  // Calculate monthly spend per card
  const getCardSpend = (cardId: string) => {
    return transactions
      .filter(
        (t) =>
          t.cardId === cardId &&
          t.type === 'expense' &&
          t.date.startsWith(currentMonth)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Total credit card spend across all cards this month
  const totalCardSpend = cards.reduce((sum, card) => sum + getCardSpend(card.id), 0);

  const handleOpenAdd = () => {
    setCardToEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (card: CreditCard) => {
    setCardToEdit(card);
    setIsEditorOpen(true);
  };

  const handleConfirmDelete = () => {
    if (cardToDelete) {
      deleteCard(cardToDelete.id);
      setCardToDelete(null);
    }
  };

  return (
    <div className="pb-24 px-4 space-y-4 animate-in fade-in duration-200">
      {/* Top Banner: Credit Card Spend & Stats */}
      <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
        {/* Ambient glow decoration */}
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-[#F46C6C]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-36 h-36 bg-[#58B5A7]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-semibold mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#58B5A7]" />
              <span>{monthName} Card Spend</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-white">
              ${totalCardSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Across {cards.length} {cards.length === 1 ? 'card' : 'active cards'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#F46C6C] to-[#FF7575] hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Cards List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#718096] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#F46C6C]" />
            <span>My Payment Cards ({cards.length})</span>
          </h3>
          <span className="text-[11px] font-semibold text-[#58B5A7]">
            Tap card to view recent spend
          </span>
        </div>

        {cards.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FFF0F0] text-[#F46C6C] flex items-center justify-center mx-auto">
              <CardIcon className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#2D3748]">No Credit Cards Added</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Add your credit cards to track minimum spend targets, credit limits, and smart reward categories.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#F46C6C] text-white rounded-xl text-xs font-bold hover:bg-[#E05A5A] transition-colors"
            >
              Add First Card
            </button>
          </div>
        ) : (
          cards.map((card) => {
            const themeKey = (card.colorTheme || card.cardColor || 'obsidian') as CardColorTheme;
            const theme = (THEME_CONFIG[themeKey as keyof typeof THEME_CONFIG] || THEME_CONFIG.obsidian);
            const minSpend = card.minSpend ?? card.minSpendRequirement ?? 0;
            const maxLimit = card.maxLimit ?? card.maxSpendLimit ?? 0;
            const billingCycleDay = card.billingCycleDay ?? card.billingCycleStartDay ?? 1;
            const spend = getCardSpend(card.id);
            const isMinMet = minSpend > 0 && spend >= minSpend;
            const minPercent = minSpend > 0 ? Math.min(100, Math.round((spend / minSpend) * 100)) : 0;
            const limitPercent = maxLimit > 0 ? Math.min(100, Math.round((spend / maxLimit) * 100)) : 0;
            const isExpanded = expandedCardId === card.id;

            // Transactions on this card
            const cardTxs = transactions.filter(
              (t) => t.cardId === card.id && t.type === 'expense'
            );

            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Sleek Realistic Payment Card Canvas */}
                <div
                  onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                  className={`w-full bg-gradient-to-br ${theme.bgGradient} p-5 text-white shadow-md relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all`}
                >
                  {/* Subtle Card Glow / Lighting Effect */}
                  <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute left-1/3 bottom-0 w-40 h-40 bg-black/15 rounded-full blur-xl pointer-events-none" />

                  {/* Top Row: Chip, Contactless, and Default Badge */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      {/* Realistic Metallic EMV Chip Graphic */}
                      <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 p-0.5 shadow-inner border border-amber-400/50 relative overflow-hidden">
                        <div className="w-full h-full border border-amber-700/30 rounded-[3px] grid grid-cols-2 grid-rows-2">
                          <div className="border-r border-b border-amber-700/40" />
                          <div className="border-b border-amber-700/40" />
                          <div className="border-r border-amber-700/40" />
                          <div />
                        </div>
                      </div>

                      {/* Contactless Wave Icon */}
                      <Wifi className="w-4 h-4 text-white/80 rotate-90" />
                    </div>

                    <div className="flex items-center gap-2">
                      {card.isDefault && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/25 backdrop-blur-md text-white border border-white/30 shadow-xs">
                          DEFAULT
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-white/70 bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Cycle: {billingCycleDay}th
                      </span>
                    </div>
                  </div>

                  {/* Card Name */}
                  <div className="mb-4 relative z-10">
                    <h3 className="font-extrabold text-lg tracking-wide drop-shadow-xs">
                      {card.name}
                    </h3>
                  </div>

                  {/* Spend Progress vs Min Spend Requirement */}
                  {minSpend > 0 && (
                    <div className="mb-3 relative z-10 bg-black/20 backdrop-blur-md rounded-2xl p-2.5 border border-white/10">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-white/80 font-semibold text-[11px]">
                          Min Spend Requirement:
                        </span>
                        {isMinMet ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#A7F3D0] bg-[#10B981]/30 px-2 py-0.5 rounded-md border border-[#10B981]/40">
                            <CheckCircle className="w-3 h-3" />
                            <span>Min Spend Met ✓</span>
                          </span>
                        ) : (
                          <span className="font-bold text-[11px] text-white">
                            ${spend.toFixed(2)} / ${minSpend.toFixed(0)}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMinMet ? 'bg-[#34D399]' : 'bg-[#FBBF24]'
                          }`}
                          style={{ width: `${minPercent}%` }}
                        />
                      </div>

                      {!isMinMet && (
                        <div className="text-[10px] text-white/70 mt-1 flex justify-between">
                          <span>${(minSpend - spend).toFixed(2)} left to reach perks</span>
                          <span>{minPercent}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Spend Progress vs Max Spend Limit */}
                  {card.isUnlimitedMax || maxLimit <= 0 ? (
                    <div className="mb-3 relative z-10 bg-black/20 backdrop-blur-md rounded-2xl p-2.5 border border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/80 font-semibold text-[11px]">
                          Monthly Limit:
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] text-[#A7F3D0] bg-[#10B981]/25 px-2 py-0.5 rounded-md border border-[#10B981]/40">
                          <span>Unlimited ∞</span>
                        </span>
                      </div>
                      <div className="text-[10px] text-white/70 mt-1 flex justify-between">
                        <span>Spent this cycle: ${spend.toFixed(2)}</span>
                        <span className="text-white/80 font-semibold">No spending cap</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 relative z-10 bg-black/20 backdrop-blur-md rounded-2xl p-2.5 border border-white/10">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-white/80 font-semibold text-[11px]">
                          Monthly Limit:
                        </span>
                        <span className="font-bold text-[11px] text-white">
                          ${spend.toFixed(2)} / ${maxLimit.toLocaleString()} limit
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            limitPercent > 90
                              ? 'bg-[#EF4444]'
                              : limitPercent > 70
                              ? 'bg-[#F59E0B]'
                              : 'bg-white'
                          }`}
                          style={{ width: `${limitPercent}%` }}
                        />
                      </div>

                      <div className="text-[10px] text-white/70 mt-1 flex justify-between">
                        <span>
                          ${(maxLimit - spend).toFixed(2)} remaining limit
                        </span>
                        <span>{limitPercent}% used</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom: Configured Reward Categories Pills */}
                  <div className="relative z-10 pt-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-white/70 block mb-1.5">
                      Reward Categories:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {card.rewardCategories.length === 0 ? (
                        <span className="text-[10px] text-white/60 italic">
                          No bonus categories selected
                        </span>
                      ) : (
                        card.rewardCategories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs"
                          >
                            <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                            <span>{cat}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Management Action Buttons */}
                <div className="px-4 py-3 bg-[#FAFAFC] border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!card.isDefault && (
                      <button
                        type="button"
                        onClick={() => setDefaultCard(card.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-[#2D3748] hover:border-gray-400 active:scale-95 transition-all shadow-2xs"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(card)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-[#2D3748] hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCardToDelete(card)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                    title="Delete card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Expandable Recent Transactions on this card */}
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-100 space-y-2 animate-in fade-in">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Recent Transactions on {card.name}
                    </h5>
                    {cardTxs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">
                        No transactions recorded for this card yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                        {cardTxs.slice(0, 8).map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-400 font-mono">
                                {tx.date.slice(5)}
                              </span>
                              <span className="font-semibold text-gray-700">
                                {tx.memo || tx.category}
                              </span>
                            </div>
                            <span className="font-bold text-[#F46C6C]">
                              -${tx.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Card Editor Modal */}
      <CardEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setCardToEdit(null);
        }}
        cardToEdit={cardToEdit}
      />

      {/* Delete Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setCardToDelete(null)}
          />
          <div className="relative bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl z-10 space-y-3 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-[#FFF0F0] text-[#F46C6C] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#2D3748]">Delete Credit Card?</h3>
            <p className="text-xs text-[#718096]">
              Are you sure you want to delete <strong>&ldquo;{cardToDelete.name}&rdquo;</strong>?
            </p>

            {/* Explicit preservation reassurance as required */}
            <div className="p-3 bg-[#E8F8F5] border border-[#58B5A7]/30 rounded-2xl text-[11px] text-[#2C5E6E] text-left font-semibold leading-relaxed">
              ✓ Past transactions made with this card will remain preserved in your history.
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-[#F46C6C] text-white font-bold text-xs hover:bg-[#E05A5A] transition-colors"
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
