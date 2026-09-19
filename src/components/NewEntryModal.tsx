'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ArrowRightLeft,
  DollarSign,
} from 'lucide-react';
import { useBudget } from '@/lib/store';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Transaction, TransactionType } from '@/types';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

export function NewEntryModal({
  isOpen,
  onClose,
  editingTransaction,
}: NewEntryModalProps) {
  const {
    accounts,
    categories,
    quickTags,
    addTransaction,
    updateTransaction,
    transferMoney,
    addCategory,
  } = useBudget();

  // Form states
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'acc-main');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || 'acc-overseas');
  const [dateStr, setDateStr] = useState('2026-09-19');
  const [memo, setMemo] = useState('');

  // Add category mini dialog state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Initialize form when opened or editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(editingTransaction.amount.toString());
      setSelectedCategory(editingTransaction.category);
      setSelectedAccountId(editingTransaction.accountId);
      if (editingTransaction.toAccountId) {
        setToAccountId(editingTransaction.toAccountId);
      }
      setDateStr(editingTransaction.date);
      setMemo(editingTransaction.memo || '');
    } else {
      setType('expense');
      setAmountStr('0');
      setSelectedCategory('Food');
      setSelectedAccountId(accounts[0]?.id || 'acc-main');
      setToAccountId(accounts[1]?.id || 'acc-overseas');
      setDateStr('2026-09-19'); // Default to Sep 19, 2026 matching screenshots
      setMemo('');
    }
  }, [editingTransaction, isOpen, accounts]);

  if (!isOpen) return null;

  // Amount parsing helper
  const parsedAmount = parseFloat(amountStr) || 0;

  // Handle amount keypad typing
  const handleKeypadPress = (val: string) => {
    if (val === 'backspace') {
      if (amountStr.length <= 1) {
        setAmountStr('0');
      } else {
        setAmountStr(amountStr.slice(0, -1));
      }
      return;
    }

    if (val === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(amountStr + '.');
      }
      return;
    }

    if (amountStr === '0') {
      setAmountStr(val);
    } else {
      // Limit to 2 decimal places
      const parts = amountStr.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      setAmountStr(amountStr + val);
    }
  };

  const handleSetToday = () => {
    // Return formatted today date: 2026-09-19
    const d = new Date();
    // Default to current simulated app date: 2026-09-19
    setDateStr('2026-09-19');
  };

  const handleSave = (keepOpen = false) => {
    if (parsedAmount <= 0) return;

    if (type === 'transfer') {
      transferMoney(selectedAccountId, toAccountId, parsedAmount, memo, dateStr);
    } else if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amount: parsedAmount,
        category: selectedCategory,
        accountId: selectedAccountId,
        toAccountId: undefined,
        date: dateStr,
        memo,
      });
    } else {
      addTransaction({
        type,
        amount: parsedAmount,
        category: selectedCategory,
        accountId: selectedAccountId,
        toAccountId: undefined,
        date: dateStr,
        memo,
      });
    }

    if (keepOpen) {
      // Reset amount and memo for rapid entry
      setAmountStr('0');
      setMemo('');
    } else {
      onClose();
    }
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      icon: 'Tag',
      color: type === 'income' ? '#58B5A7' : '#F46C6C',
      bgColor: type === 'income' ? '#E8F8F5' : '#FFF0F0',
      type: type === 'income' ? 'income' : 'expense',
    });
    setSelectedCategory(newCatName.trim());
    setNewCatName('');
    setIsAddingCategory(false);
  };

  // Filter categories by active type
  const visibleCategories = categories.filter(
    (c) => c.type === 'both' || c.type === type
  );

  const selectedAcc = accounts.find((a) => a.id === selectedAccountId);
  const toAcc = accounts.find((a) => a.id === toAccountId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Header Bar */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base text-[#2D3748]">
            {editingTransaction ? 'Edit Entry' : 'New Entry'}
          </h2>
          <div className="w-8" />
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-3 space-y-4 no-scrollbar">
          {/* Segmented Tabs: [Expense] | [Income] | [Transfer] */}
          <div className="flex bg-[#F1F3F6] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-[#FF7676] text-white shadow-xs'
                  : 'text-[#718096] hover:text-[#2D3748]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-[#58B5A7] text-white shadow-xs'
                  : 'text-[#718096] hover:text-[#2D3748]'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                type === 'transfer'
                  ? 'bg-[#2C5E6E] text-white shadow-xs'
                  : 'text-[#718096] hover:text-[#2D3748]'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Large Amount Display with decimal typing */}
          <div className="py-2 text-center">
            <div className="inline-flex items-baseline justify-center">
              <span
                className={`text-2xl font-bold mr-1 ${
                  type === 'expense'
                    ? 'text-[#F46C6C]'
                    : type === 'income'
                    ? 'text-[#58B5A7]'
                    : 'text-[#2C5E6E]'
                }`}
              >
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setAmountStr(val || '0');
                }}
                className={`text-4xl sm:text-5xl font-extrabold tracking-tight text-center bg-transparent border-none outline-hidden max-w-[260px] ${
                  type === 'expense'
                    ? 'text-[#F46C6C]'
                    : type === 'income'
                    ? 'text-[#58B5A7]'
                    : 'text-[#2C5E6E]'
                }`}
              />
            </div>
          </div>

          {/* Category Grid (2 rows x 4+ cols) - shown for Expense and Income */}
          {type !== 'transfer' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0]">
                  Category
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-xs font-semibold text-[#58B5A7] hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Custom</span>
                </button>
              </div>

              {/* Grid of categories */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {visibleCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                        isSelected
                          ? type === 'income'
                            ? 'bg-[#E8F8F5] ring-2 ring-[#58B5A7]'
                            : 'bg-[#FFF0F0] ring-2 ring-[#F46C6C]'
                          : 'bg-[#F9FAFB] hover:bg-gray-100'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 ${
                          isSelected
                            ? type === 'income'
                              ? 'bg-[#58B5A7] text-white'
                              : 'bg-[#F46C6C] text-white'
                            : 'bg-white shadow-2xs'
                        }`}
                        style={{
                          color: isSelected ? '#FFFFFF' : cat.color,
                        }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] font-semibold truncate max-w-full ${
                          isSelected
                            ? type === 'income'
                              ? 'text-[#58B5A7]'
                              : 'text-[#F46C6C]'
                            : 'text-[#4A5568]'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}

                {/* Inline Add Category Button */}
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center mb-1 text-gray-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500">More</span>
                </button>
              </div>

              {/* Inline Add Category Input Popup */}
              {isAddingCategory && (
                <div className="mt-2 p-2.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="New category name..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    autoFocus
                    className="flex-1 px-3 py-1.5 bg-white rounded-xl text-xs border border-gray-200 outline-hidden font-medium"
                  />
                  <button
                    onClick={handleCreateCategory}
                    className="px-3 py-1.5 bg-[#58B5A7] text-white rounded-xl text-xs font-bold hover:bg-[#4EABA0]"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setIsAddingCategory(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Account Selector Row */}
          <div className="bg-[#F8F9FA] p-3 rounded-2xl space-y-2">
            {type === 'transfer' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#718096]">From Account:</span>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="text-xs font-bold text-[#2D3748] bg-white border border-gray-200 rounded-xl px-2.5 py-1 outline-hidden"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (${a.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#718096]">To Account:</span>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="text-xs font-bold text-[#2D3748] bg-white border border-gray-200 rounded-xl px-2.5 py-1 outline-hidden"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (${a.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#718096]">Account:</span>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="text-xs font-bold text-[#2D3748] bg-white border border-gray-200 rounded-xl px-3 py-1 outline-hidden"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Selector with [Today?] */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-bold text-[#718096]">Date:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="text-xs font-bold text-[#2D3748] bg-white border border-gray-200 rounded-xl px-2.5 py-1 outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="text-[11px] font-bold px-2 py-1 rounded-lg bg-[#E0F4F1] text-[#4EABA0] hover:bg-[#b9e8e0] active:scale-95 transition-all"
                >
                  Today?
                </button>
              </div>
            </div>

            {/* Memo Input */}
            <div className="pt-1 border-t border-gray-200/60 flex items-center">
              <span className="text-xs font-bold text-[#718096] mr-2">Memo: &gt;</span>
              <input
                type="text"
                placeholder="e.g. Dinner for fam, yakiniku..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="flex-1 text-xs font-semibold text-[#2D3748] bg-white border border-gray-200 rounded-xl px-3 py-1.5 outline-hidden focus:border-[#FF7676]"
              />
            </div>
          </div>

          {/* Quick Memo Tag Chips */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] block mb-1.5">
              Quick Tags
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar py-0.5">
              {quickTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMemo(tag)}
                  className="text-[11px] font-medium px-2.5 py-1 bg-[#F4F5F7] hover:bg-[#FFE4E4] hover:text-[#F46C6C] text-[#4A5568] rounded-full border border-gray-200/70 active:scale-95 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dual Footer Action Buttons */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2.5 pb-safe">
          {/* Save & Continue button (mint/teal) */}
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={parsedAmount <= 0}
            className="flex-1 py-3 px-3 rounded-2xl bg-[#6EC5B8] hover:bg-[#58B5A7] disabled:opacity-50 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1"
          >
            <span>Save & Continue</span>
          </button>

          {/* SAVE button (coral) */}
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={parsedAmount <= 0}
            className="flex-1 py-3 px-3 rounded-2xl bg-[#FF7676] hover:bg-[#F46C6C] disabled:opacity-50 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>SAVE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
