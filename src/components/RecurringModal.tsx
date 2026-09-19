'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Repeat,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
} from 'lucide-react';
import { useBudget } from '@/lib/store';
import { CategoryIcon } from '@/components/CategoryIcon';
import { RecurringRule } from '@/types';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecurringModal({ isOpen, onClose }: RecurringModalProps) {
  const {
    recurring,
    accounts,
    categories,
    addRecurringRule,
    toggleRecurringRule,
    deleteRecurringRule,
  } = useBudget();

  const [isAdding, setIsAdding] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<RecurringRule | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('Housing');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc-main');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  if (!isOpen) return null;

  const handleCreate = () => {
    const val = parseFloat(amount);
    if (!title.trim() || !val || val <= 0) return;

    addRecurringRule({
      title: title.trim(),
      amount: val,
      type,
      category,
      accountId,
      frequency,
      nextDate: '2026-10-01',
      isActive: true,
    });

    setTitle('');
    setAmount('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={() => {
              if (isAdding) setIsAdding(false);
              else onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base text-[#2D3748]">
            {isAdding ? 'New Recurring Rule' : 'Recurring Rules'}
          </h2>
          <div className="w-8" />
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {!isAdding ? (
            <>
              {/* Add Rule Button */}
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full py-2.5 px-4 bg-[#FFF0F0] hover:bg-[#ffe4e4] text-[#F46C6C] rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Recurring Rule</span>
              </button>

              {/* Recurring Rules List */}
              <div className="space-y-2.5">
                {recurring.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">
                    No recurring rules yet. Add your rent, salary, or subscriptions!
                  </p>
                ) : (
                  recurring.map((rule) => {
                    const catDef = categories.find((c) => c.name === rule.category);
                    const accObj = accounts.find((a) => a.id === rule.accountId);

                    return (
                      <div
                        key={rule.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          rule.isActive
                            ? 'bg-white border-gray-100 card-shadow'
                            : 'bg-gray-50/70 border-gray-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Toggle Active Button */}
                          <button
                            type="button"
                            onClick={() => toggleRecurringRule(rule.id)}
                            className="text-gray-400 hover:text-[#58B5A7] transition-colors"
                          >
                            {rule.isActive ? (
                              <CheckCircle2 className="w-5 h-5 text-[#58B5A7]" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300" />
                            )}
                          </button>

                          {/* Info */}
                          <div>
                            <h4 className="font-bold text-xs text-[#2D3748]">{rule.title}</h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                              <span className="capitalize">{rule.frequency}</span>
                              <span>•</span>
                              <span>{rule.category}</span>
                              <span>•</span>
                              <span>{accObj?.name || 'Local'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Delete */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-bold ${
                              rule.type === 'income' ? 'text-[#38A169]' : 'text-[#E53E3E]'
                            }`}
                          >
                            {rule.type === 'income' ? '+$' : '-$'}
                            {rule.amount.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRuleToDelete(rule)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                            title="Delete recurring rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Add Form */
            <div className="space-y-3 animate-in fade-in">
              <div className="flex bg-[#F1F3F6] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    type === 'expense' ? 'bg-[#FF7676] text-white shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    type === 'income' ? 'bg-[#58B5A7] text-white shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Netflix Subscription, Salary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#718096] block mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#718096] block mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#718096] block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#718096] block mb-1">Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-xl bg-[#F46C6C] text-white font-bold text-xs hover:bg-[#E05A5A]"
                >
                  Save Rule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {ruleToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 select-none">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setRuleToDelete(null)}
          />
          <div className="relative bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl z-10 space-y-3 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-[#FFF0F0] text-[#F46C6C] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#2D3748]">Delete Recurring Rule?</h3>
            <p className="text-xs text-[#718096]">
              Are you sure you want to delete <strong>&ldquo;{ruleToDelete.title}&rdquo;</strong>?
            </p>
            <div className="p-2.5 bg-[#E8F8F5] rounded-xl text-[11px] text-[#2C5E6E] text-left font-medium">
              ✓ All previously created transactions from this recurring rule will be kept in your history.
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setRuleToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteRecurringRule(ruleToDelete.id);
                  setRuleToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#F46C6C] text-white font-bold text-xs hover:bg-[#E05A5A] transition-colors"
              >
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
