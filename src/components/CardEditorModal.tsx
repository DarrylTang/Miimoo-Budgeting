'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard as CardIcon,
  Check,
  Sparkles,
  Wifi,
  ShieldCheck,
} from 'lucide-react';
import { useBudget } from '@/lib/store';
import { CreditCard, CardColorTheme } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';

interface CardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardToEdit?: CreditCard | null;
}

export const THEME_CONFIG: Record<
  CardColorTheme,
  {
    name: string;
    bgGradient: string;
    accentColor: string;
    previewDot: string;
    badgeBg: string;
    chipBorder: string;
  }
> = {
  obsidian: {
    name: 'Dark Obsidian',
    bgGradient: 'from-[#1e232a] via-[#14171c] to-[#0d0f12]',
    accentColor: '#94A3B8',
    previewDot: '#1e232a',
    badgeBg: 'bg-white/10 text-white',
    chipBorder: 'border-yellow-600/30',
  },
  coral: {
    name: 'Coral Sunrise',
    bgGradient: 'from-[#FF6565] via-[#F46C6C] to-[#E54848]',
    accentColor: '#FFE4E4',
    previewDot: '#F46C6C',
    badgeBg: 'bg-white/20 text-white',
    chipBorder: 'border-amber-600/30',
  },
  emerald: {
    name: 'Emerald Forest',
    bgGradient: 'from-[#0D9488] via-[#14B8A6] to-[#0F766E]',
    accentColor: '#A7F3D0',
    previewDot: '#10B981',
    badgeBg: 'bg-white/20 text-white',
    chipBorder: 'border-amber-600/30',
  },
  ocean: {
    name: 'Ocean Blue',
    bgGradient: 'from-[#1D4ED8] via-[#2563EB] to-[#1E40AF]',
    accentColor: '#93C5FD',
    previewDot: '#3B82F6',
    badgeBg: 'bg-white/20 text-white',
    chipBorder: 'border-amber-600/30',
  },
  purple: {
    name: 'Sunset Purple',
    bgGradient: 'from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9]',
    accentColor: '#E9D5FF',
    previewDot: '#8B5CF6',
    badgeBg: 'bg-white/20 text-white',
    chipBorder: 'border-amber-600/30',
  },
};

export function CardEditorModal({
  isOpen,
  onClose,
  cardToEdit,
}: CardEditorModalProps) {
  const { categories, addCard, updateCard, cards } = useBudget();

  const [name, setName] = useState('');
  const [colorTheme, setColorTheme] = useState<CardColorTheme>('obsidian');
  const [maxLimit, setMaxLimit] = useState('3000');
  const [minSpend, setMinSpend] = useState('600');
  const [billingCycleDay, setBillingCycleDay] = useState(1);
  const [rewardCategories, setRewardCategories] = useState<string[]>([
    'Food',
    'Shopping',
  ]);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (cardToEdit) {
      setName(cardToEdit.name);
      const theme = (cardToEdit.colorTheme || cardToEdit.cardColor || 'obsidian') as CardColorTheme;
      setColorTheme(theme);
      const limit = cardToEdit.maxLimit ?? cardToEdit.maxSpendLimit ?? 3000;
      setMaxLimit(limit.toString());
      const min = cardToEdit.minSpend ?? cardToEdit.minSpendRequirement ?? 600;
      setMinSpend(min.toString());
      const cycle = cardToEdit.billingCycleDay ?? cardToEdit.billingCycleStartDay ?? 1;
      setBillingCycleDay(cycle);
      setRewardCategories(cardToEdit.rewardCategories || []);
      setIsDefault(cardToEdit.isDefault);
    } else {
      setName('');
      setColorTheme('obsidian');
      setMaxLimit('3000');
      setMinSpend('600');
      setBillingCycleDay(1);
      setRewardCategories(['Food', 'Shopping', 'Entertainment']);
      setIsDefault(cards.length === 0);
    }
  }, [cardToEdit, isOpen, cards.length]);

  if (!isOpen) return null;

  const handleToggleCategory = (catName: string) => {
    if (rewardCategories.includes(catName)) {
      setRewardCategories(rewardCategories.filter((c) => c !== catName));
    } else {
      setRewardCategories([...rewardCategories, catName]);
    }
  };

  const handleSave = () => {
    const parsedLimit = parseFloat(maxLimit) || 0;
    const parsedMin = parseFloat(minSpend) || 0;
    const cleanName = name.trim() || 'Credit Card';

    const cardPayload = {
      name: cleanName,
      cardColor: colorTheme,
      colorTheme,
      maxSpendLimit: parsedLimit,
      maxLimit: parsedLimit,
      minSpendRequirement: parsedMin,
      minSpend: parsedMin,
      billingCycleStartDay: billingCycleDay,
      billingCycleDay,
      rewardCategories,
      isDefault,
    };

    if (cardToEdit) {
      updateCard(cardToEdit.id, cardPayload);
    } else {
      addCard(cardPayload);
    }

    onClose();
  };

  const availableCategories = categories.filter(
    (c) => c.type === 'expense' || c.type === 'both'
  );

  const activeTheme = THEME_CONFIG[colorTheme];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base text-[#2D3748]">
            {cardToEdit ? 'Edit Credit Card' : 'Add New Credit Card'}
          </h2>
          <div className="w-8" />
        </div>

        {/* Scrollable Form */}
        <div className="overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* Live Card Preview */}
          <div
            className={`w-full rounded-2xl bg-gradient-to-br ${activeTheme.bgGradient} p-4 text-white shadow-lg transition-all duration-300 relative overflow-hidden`}
          >
            {/* Ambient glare pattern */}
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-black/10 rounded-full blur-lg pointer-events-none" />

            {/* Top row: Chip & Contactless */}
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                {/* Metallic EMV Chip */}
                <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 p-0.5 shadow-inner border border-amber-400/40 relative overflow-hidden">
                  <div className="w-full h-full border border-amber-600/30 rounded-[3px] grid grid-cols-2 grid-rows-2">
                    <div className="border-r border-b border-amber-600/40" />
                    <div className="border-b border-amber-600/40" />
                    <div className="border-r border-amber-600/40" />
                    <div />
                  </div>
                </div>

                {/* Contactless Wave */}
                <Wifi className="w-4 h-4 text-white/70 rotate-90" />
              </div>

              {isDefault && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                  DEFAULT
                </span>
              )}
            </div>

            {/* Card Name */}
            <div className="relative z-10 mb-2">
              <span className="text-[10px] tracking-wider uppercase text-white/70 font-semibold block">
                Card Name
              </span>
              <h3 className="font-extrabold text-base tracking-wide drop-shadow-xs">
                {name.trim() || 'Your Card Name'}
              </h3>
            </div>

            {/* Reward categories tags preview */}
            <div className="relative z-10 pt-1 flex flex-wrap gap-1">
              {rewardCategories.length === 0 ? (
                <span className="text-[10px] text-white/60 italic">
                  No reward categories configured
                </span>
              ) : (
                rewardCategories.slice(0, 4).map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-white border border-white/20"
                  >
                    ★ {cat}
                  </span>
                ))
              )}
              {rewardCategories.length > 4 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-white">
                  +{rewardCategories.length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Card Name Input */}
          <div>
            <label className="text-xs font-bold text-[#718096] block mb-1">
              Card Name
            </label>
            <input
              type="text"
              placeholder="e.g. DBS Live Fresh, Citi Cash Back"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden focus:border-[#FF7676]"
            />
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="text-xs font-bold text-[#718096] block mb-1.5">
              Card Theme
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(THEME_CONFIG) as CardColorTheme[]).map((themeKey) => {
                const conf = THEME_CONFIG[themeKey];
                const isSelected = colorTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setColorTheme(themeKey)}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#2D3748] ring-2 ring-gray-400 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full shadow-xs mb-1 flex items-center justify-center text-white"
                      style={{ backgroundColor: conf.previewDot }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-[9px] font-bold text-gray-600 truncate max-w-full">
                      {conf.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Limits: Min Spend & Max Limit */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-[#718096] block mb-1">
                Min Spend Req ($)
              </label>
              <input
                type="number"
                step="50"
                min="0"
                placeholder="600"
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden focus:border-[#58B5A7]"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Cashback / perks target
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#718096] block mb-1">
                Max Spend Limit ($)
              </label>
              <input
                type="number"
                step="100"
                min="0"
                placeholder="3000"
                value={maxLimit}
                onChange={(e) => setMaxLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden focus:border-[#F46C6C]"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Credit line / budget cap
              </span>
            </div>
          </div>

          {/* Billing Cycle Start Day */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#718096]">
                Billing Cycle Start Day
              </label>
              <span className="text-xs font-bold text-[#2C5E6E]">
                Day {billingCycleDay} of month
              </span>
            </div>
            <select
              value={billingCycleDay}
              onChange={(e) => setBillingCycleDay(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Day {day} ({day === 1 ? '1st of month' : day === 15 ? 'Mid month' : `${day}th`})
                </option>
              ))}
            </select>
          </div>

          {/* Reward Categories Multi-select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#718096] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Reward Categories ({rewardCategories.length})</span>
              </label>
              <span className="text-[10px] text-gray-400">Tap to toggle</span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-2xl border border-gray-200 max-h-36 overflow-y-auto no-scrollbar">
              {availableCategories.map((cat) => {
                const isSelected = rewardCategories.includes(cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleCategory(cat.name)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#E8F8F5] text-[#2C5E6E] border-2 border-[#58B5A7] shadow-2xs scale-100'
                        : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-100'
                    }`}
                  >
                    <CategoryIcon name={cat.icon} className="w-3 h-3" />
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#58B5A7] stroke-[3]" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Transactions in these categories will highlight this card as a top pick in New Entry.
            </p>
          </div>

          {/* Set as Default Card Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer hover:bg-gray-100/80 transition-colors">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-[#F46C6C] focus:ring-[#F46C6C] border-gray-300"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-[#2D3748] block">
                  Set as Default Card
                </span>
                <span className="text-[10px] text-gray-500 block">
                  Auto-selected for new expense entries
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2.5 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#F46C6C] hover:bg-[#E05A5A] text-white font-bold text-xs shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{cardToEdit ? 'Save Changes' : 'Create Card'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
