'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Trash2,
  Edit2,
  Calendar,
  Search,
} from 'lucide-react';
import { useBudget } from '@/lib/store';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Transaction } from '@/types';

interface HomeDashboardProps {
  onOpenNewEntry: () => void;
  onOpenAccounts: () => void;
  isSearchOpen: boolean;
  onEditTransaction?: (tx: Transaction) => void;
}

export function HomeDashboard({
  onOpenNewEntry,
  onOpenAccounts,
  isSearchOpen,
  onEditTransaction,
}: HomeDashboardProps) {
  const {
    transactions,
    accounts,
    categories,
    deleteTransaction,
    selectedAccountId,
    setSelectedAccountId,
    isBalanceHidden,
    toggleBalanceHidden,
  } = useBudget();

  // Current viewed month state: default to Sep 2026 to match seed and screenshots
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 0-indexed: 8 = September
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [activeActionTxId, setActiveActionTxId] = useState<string | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const monthTitle = `${monthNames[currentMonth]} ${currentYear}`;

  // Filter transactions for this month and selected account
  const monthTransactions = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return transactions.filter(tx => {
      const matchMonth = tx.date.startsWith(monthPrefix);
      const matchAccount = selectedAccountId === 'all' || tx.accountId === selectedAccountId;
      const matchSearch =
        !searchQuery.trim() ||
        tx.memo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMonth && matchAccount && matchSearch;
    });
  }, [transactions, currentYear, currentMonth, selectedAccountId, searchQuery]);

  // Financial summary for this month
  const { income, expense, netIncome } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    monthTransactions.forEach(tx => {
      if (tx.type === 'income') {
        inc += tx.amount;
      } else if (tx.type === 'expense') {
        exp += tx.amount;
      }
    });
    return {
      income: inc,
      expense: exp,
      netIncome: inc - exp,
    };
  }, [monthTransactions]);

  // Group transactions by date
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: { date: string; items: Transaction[]; total: number } } = {};
    
    // Sort transactions descending by date, then createdAt
    const sorted = [...monthTransactions].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });

    sorted.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = { date: tx.date, items: [], total: 0 };
      }
      groups[tx.date].items.push(tx);
      if (tx.type === 'expense') {
        groups[tx.date].total -= tx.amount;
      } else if (tx.type === 'income') {
        groups[tx.date].total += tx.amount;
      }
    });

    return Object.values(groups);
  }, [monthTransactions]);

  // Toggle collapse date accordion
  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Helper formatters
  const formatCurrency = (val: number, isExp = false) => {
    if (isBalanceHidden) return '$ •••••';
    const absVal = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (isExp || val < 0) return `-$${absVal}`;
    return `+$${absVal}`;
  };

  const formatDateHeader = (dateStr: string) => {
    // dateStr is 'YYYY-MM-DD'
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[d.getDay()];
    const dayNum = parts[2];
    const monthNum = parts[1];
    return `${dayName}, ${dayNum}/${monthNum}`;
  };

  // Current active account name
  const activeAccount = accounts.find(a => a.id === selectedAccountId);
  const accountLabel = selectedAccountId === 'all' ? 'All Accounts' : (activeAccount?.name || 'Account');

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-28 space-y-4">
      {/* Quick Search Bar (Collapsible / Toggleable) */}
      {isSearchOpen && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search memo, tag or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-white rounded-2xl border border-gray-200 text-xs font-medium text-[#2D3748] focus:outline-hidden focus:border-[#F46C6C] shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs text-gray-400 hover:text-gray-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Account Summary Card */}
      <div className="w-full bg-white rounded-3xl p-5 card-shadow border border-gray-100/80 transition-all">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          {/* Account Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="appearance-none bg-[#F7F8FA] hover:bg-gray-100 font-bold text-sm text-[#2D3748] py-1.5 pl-3 pr-8 rounded-full border border-gray-200/80 outline-hidden cursor-pointer"
            >
              <option value="all">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Action Icons: Settings, Lock, Eye */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenAccounts}
              aria-label="Manage Accounts Settings"
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-[#2D3748] hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleBalanceHidden}
              aria-label={isBalanceHidden ? 'Show balance' : 'Hide balance'}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-[#2D3748] hover:bg-gray-100 transition-colors"
            >
              {isBalanceHidden ? (
                <EyeOff className="w-3.5 h-3.5 text-[#F46C6C]" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* 3-Column Financial Summary */}
        <div className="grid grid-cols-3 gap-2 pt-4 text-center">
          {/* Income */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-tight text-[#718096] mb-1">
              Income
            </span>
            <span className="text-sm font-bold text-[#38A169] tracking-tight">
              {isBalanceHidden ? '$ •••••' : `$${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>

          {/* Expense */}
          <div className="flex flex-col items-center border-x border-gray-100 px-1">
            <span className="text-[11px] font-semibold tracking-tight text-[#718096] mb-1">
              Expense
            </span>
            <span className="text-sm font-bold text-[#E53E3E] tracking-tight">
              {isBalanceHidden ? '$ •••••' : `-$${expense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>

          {/* Net Income */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-tight text-[#718096] mb-1">
              Net Income
            </span>
            <span
              className={`text-sm font-bold tracking-tight ${
                netIncome >= 0 ? 'text-[#38A169]' : 'text-[#E53E3E]'
              }`}
            >
              {isBalanceHidden
                ? '$ •••••'
                : `${netIncome >= 0 ? '$' : '-$'}${Math.abs(netIncome).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </span>
          </div>
        </div>
      </div>

      {/* Period / Month Bar */}
      <div className="flex items-center justify-between px-2 py-1 select-none">
        {/* Left: Filter / List Icon */}
        <div className="flex items-center gap-1 text-gray-500">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        </div>

        {/* Center: Month Selector (< Sep 2026 >) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-white active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-sm text-[#2D3748] tracking-tight min-w-[70px] text-center">
            {monthTitle}
          </span>

          <button
            onClick={handleNextMonth}
            aria-label="Next Month"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-white active:scale-95 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: "by M. >" dropdown toggle */}
        <div className="flex items-center text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-800">
          <span>by M.</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </div>
      </div>

      {/* Grouped Date Transaction Feed */}
      {groupedByDate.length === 0 ? (
        <div className="w-full bg-white rounded-3xl p-8 text-center card-shadow border border-gray-100/80">
          <div className="w-12 h-12 rounded-full bg-[#FFF0F0] text-[#F46C6C] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-[#2D3748] mb-1">No transactions found</h4>
          <p className="text-xs text-gray-400 mb-4">
            {searchQuery
              ? 'Try searching with a different term'
              : `No activity recorded for ${monthTitle}`}
          </p>
          <button
            onClick={onOpenNewEntry}
            className="py-2 px-4 bg-[#F46C6C] hover:bg-[#E05A5A] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            + Add First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedByDate.map((group) => {
            const isCollapsed = !!collapsedDates[group.date];
            const dateTotalFormatted = isBalanceHidden
              ? '$ •••••'
              : `${group.total < 0 ? '-$' : '+$'}${Math.abs(group.total).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;

            return (
              <div
                key={group.date}
                className="bg-white rounded-2xl overflow-hidden card-shadow border border-gray-100/80 transition-all"
              >
                {/* Accordion Date Header */}
                <div
                  onClick={() => toggleDateCollapse(group.date)}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#FBFBFC] to-white flex items-center justify-between border-b border-gray-100/60 cursor-pointer select-none hover:bg-gray-50"
                >
                  <span className="text-xs font-bold text-[#4A5568]">
                    {formatDateHeader(group.date)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        group.total < 0 ? 'text-[#E53E3E]' : 'text-[#38A169]'
                      }`}
                    >
                      {dateTotalFormatted}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Day's Transactions List */}
                {!isCollapsed && (
                  <div className="divide-y divide-gray-50">
                    {group.items.map((tx) => {
                      const categoryDef = categories.find((c) => c.name === tx.category) || {
                        name: tx.category,
                        icon: 'Tag',
                        color: '#F46C6C',
                        bgColor: '#FFF0F0',
                      };
                      const accountObj = accounts.find((a) => a.id === tx.accountId);
                      const isActionsActive = activeActionTxId === tx.id;

                      return (
                        <div
                          key={tx.id}
                          className="relative px-4 py-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors group"
                        >
                          {/* Left: Icon & Memo */}
                          <div
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              if (isActionsActive) {
                                setActiveActionTxId(null);
                              } else {
                                setActiveActionTxId(tx.id);
                              }
                            }}
                          >
                            {/* Circular Category Badge */}
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                              style={{
                                backgroundColor: categoryDef.bgColor || '#FFF0F0',
                                color: categoryDef.color || '#F46C6C',
                              }}
                            >
                              <CategoryIcon
                                name={categoryDef.icon}
                                className="w-5 h-5"
                                strokeWidth={2.2}
                              />
                            </div>

                            {/* Memo & Account info */}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#2D3748] truncate">
                                {tx.memo || tx.category}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-medium text-gray-400 truncate">
                                  {accountObj?.name || 'Local'}
                                </span>
                                {tx.category && tx.memo && (
                                  <>
                                    <span className="text-gray-300 text-[10px]">•</span>
                                    <span className="text-[10px] font-medium text-[#718096]">
                                      {tx.category}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount or Action buttons */}
                          {isActionsActive ? (
                            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                              {onEditTransaction && (
                                <button
                                  onClick={() => {
                                    setActiveActionTxId(null);
                                    onEditTransaction(tx);
                                  }}
                                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-[#E0F4F1] hover:text-[#58B5A7] flex items-center justify-center text-gray-600 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  deleteTransaction(tx.id);
                                  setActiveActionTxId(null);
                                }}
                                className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="text-right cursor-pointer"
                              onClick={() => setActiveActionTxId(tx.id)}
                            >
                              <span
                                className={`text-xs font-bold tracking-tight ${
                                  tx.type === 'expense'
                                    ? 'text-[#E53E3E]'
                                    : tx.type === 'income'
                                    ? 'text-[#38A169]'
                                    : 'text-gray-600'
                                }`}
                              >
                                {isBalanceHidden
                                  ? '$ •••••'
                                  : `${tx.type === 'expense' ? '-$' : '+$'}${tx.amount.toLocaleString(
                                      'en-US',
                                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                    )}`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
