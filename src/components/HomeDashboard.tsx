'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  X,
  Globe,
  CreditCard,
  Repeat,
  Sparkles,
  Check,
} from 'lucide-react';
import { useBudget } from '@/lib/store';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Transaction } from '@/types';

interface HomeDashboardProps {
  onOpenNewEntry: () => void;
  onOpenAccounts: () => void;
  isSearchOpen: boolean;
  onCloseSearch?: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

const THEME_CONFIG: Record<string, { bgGradient: string }> = {
  obsidian: { bgGradient: 'from-[#1A202C] via-[#2D3748] to-[#171923]' },
  coral: { bgGradient: 'from-[#FF6B6B] via-[#F46C6C] to-[#E05A5A]' },
  emerald: { bgGradient: 'from-[#0D9488] via-[#14B8A6] to-[#0F766E]' },
  ocean: { bgGradient: 'from-[#1D4ED8] via-[#2563EB] to-[#1E40AF]' },
  purple: { bgGradient: 'from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9]' },
};

const POPULAR_SEARCH_CHIPS = [
  { label: 'Food', query: 'Food' },
  { label: 'Transport', query: 'Transport' },
  { label: 'Groceries', query: 'Groceries' },
  { label: 'Salary', query: 'Salary' },
  { label: 'DBS Card', query: 'DBS' },
  { label: 'Overseas', query: 'Overseas' },
  { label: '>$50', query: '>50' },
  { label: '>$100', query: '>100' },
];

export function HomeDashboard({
  onOpenNewEntry,
  onOpenAccounts,
  isSearchOpen,
  onCloseSearch,
  onEditTransaction,
}: HomeDashboardProps) {
  const {
    transactions,
    accounts,
    cards,
    recurring,
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
  const [searchScope, setSearchScope] = useState<'all_months' | 'current_month'>('all_months');
  const [searchTypeFilter, setSearchTypeFilter] = useState<
    'all' | 'expense' | 'income' | 'transfer' | 'cards_accounts' | 'recurring'
  >('all');
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});
  const [activeActionTxId, setActiveActionTxId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Category filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [catModalTypeFilter, setCatModalTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [catModalSearch, setCatModalSearch] = useState('');

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthTitle = `${monthNames[currentMonth]} ${currentYear}`;

  // Helper date matching function (e.g. "sep", "september", "2026", "19/09", "sat")
  const matchDateString = (dateStr: string, q: string): boolean => {
    if (dateStr.toLowerCase().includes(q)) return true;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;

    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthIndex = monthNum - 1;
    const day = parts[2];
    const dayNum = parseInt(day, 10);

    const monthNamesFull = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
    ];
    const monthNamesShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const daysFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daysShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    const d = new Date(parseInt(year), monthIndex, dayNum);
    const dayOfWeekFull = daysFull[d.getDay()];
    const dayOfWeekShort = daysShort[d.getDay()];
    const monthFull = monthNamesFull[monthIndex];
    const monthShort = monthNamesShort[monthIndex];

    if (year.includes(q)) return true;
    if (monthFull?.includes(q) || monthShort?.includes(q)) return true;
    if (dayOfWeekFull?.includes(q) || dayOfWeekShort?.includes(q)) return true;
    if (`${day}/${parts[1]}`.includes(q) || `${dayNum}/${monthNum}`.includes(q)) return true;
    if (`${day}/${parts[1]}/${year}`.includes(q) || `${dayNum}/${monthNum}/${year}`.includes(q)) return true;
    if (`${day} ${monthShort}`.toLowerCase().includes(q) || `${dayNum} ${monthShort}`.toLowerCase().includes(q)) return true;
    if (`${day} ${monthFull}`.toLowerCase().includes(q) || `${dayNum} ${monthFull}`.toLowerCase().includes(q)) return true;
    if (`${monthShort} ${year}`.toLowerCase().includes(q) || `${monthFull} ${year}`.toLowerCase().includes(q)) return true;

    return false;
  };

  // Helper amount matching function (e.g. "34.44", "$34", ">100", "<50")
  const matchAmount = (amount: number, q: string): boolean => {
    const cleanQ = q.trim().toLowerCase();
    const opMatch = cleanQ.match(/^([><]=?)\s*\$?(\d+(\.\d+)?)$/);
    if (opMatch) {
      const op = opMatch[1];
      const val = parseFloat(opMatch[2]);
      if (op === '>' && amount > val) return true;
      if (op === '>=' && amount >= val) return true;
      if (op === '<' && amount < val) return true;
      if (op === '<=' && amount <= val) return true;
      return false;
    }

    const qWithoutDollar = cleanQ.replace(/^\$/, '').trim();
    if (!qWithoutDollar) return false;

    const amtStr = amount.toString();
    const amtFormatted = amount.toFixed(2);
    return amtStr.includes(qWithoutDollar) || amtFormatted.includes(qWithoutDollar);
  };

  // Matched accounts (for across all data search)
  const matchedAccounts = useMemo(() => {
    if (!searchQuery.trim() || !isSearchOpen) return [];
    const q = searchQuery.trim().toLowerCase();
    return accounts.filter(
      (acc) =>
        acc.name.toLowerCase().includes(q) ||
        acc.type.toLowerCase().includes(q) ||
        acc.currency.toLowerCase().includes(q) ||
        acc.balance.toString().includes(q.replace(/^\$/, ''))
    );
  }, [accounts, searchQuery, isSearchOpen]);

  // Matched cards (for across all data search)
  const matchedCards = useMemo(() => {
    if (!searchQuery.trim() || !isSearchOpen) return [];
    const q = searchQuery.trim().toLowerCase();
    return cards.filter(
      (card) =>
        card.name.toLowerCase().includes(q) ||
        card.cardColor.toLowerCase().includes(q) ||
        card.rewardCategories.some((cat) => cat.toLowerCase().includes(q)) ||
        (card.isUnlimitedMax && q.includes('unlimited')) ||
        (card.maxLimit && card.maxLimit.toString().includes(q.replace(/^\$/, ''))) ||
        (card.minSpend && card.minSpend.toString().includes(q.replace(/^\$/, '')))
    );
  }, [cards, searchQuery, isSearchOpen]);

  // Matched recurring rules (for across all data search)
  const matchedRecurring = useMemo(() => {
    if (!searchQuery.trim() || !isSearchOpen) return [];
    const q = searchQuery.trim().toLowerCase();
    return recurring.filter(
      (rec) =>
        rec.title.toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q) ||
        rec.frequency.toLowerCase().includes(q) ||
        rec.type.toLowerCase().includes(q) ||
        rec.amount.toString().includes(q.replace(/^\$/, '')) ||
        rec.nextDate.includes(q)
    );
  }, [recurring, searchQuery, isSearchOpen]);

  // Active Category item definition
  const activeCategoryDef = useMemo(() => {
    if (!selectedCategoryFilter || selectedCategoryFilter === 'all') return null;
    return categories.find((c) => c.name === selectedCategoryFilter) || null;
  }, [categories, selectedCategoryFilter]);

  // Base transactions for the current period (before category filter)
  const basePeriodTransactions = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return transactions.filter((tx) => {
      // Month Scope: If search is closed OR searchScope is 'current_month', match only current month
      if (!isSearchOpen || searchScope === 'current_month') {
        if (!tx.date.startsWith(monthPrefix)) return false;
      }

      // Account filter
      if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId) {
        return false;
      }

      return true;
    });
  }, [transactions, currentYear, currentMonth, isSearchOpen, searchScope, selectedAccountId]);

  // Pre-calculate count and sum for each category in current period
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};

    basePeriodTransactions.forEach((tx) => {
      if (!stats[tx.category]) {
        stats[tx.category] = { count: 0, total: 0 };
      }
      stats[tx.category].count += 1;
      stats[tx.category].total += tx.amount;
    });

    return stats;
  }, [basePeriodTransactions]);

  // Modal filtered categories list
  const filteredCategoriesForModal = useMemo(() => {
    return categories.filter((cat) => {
      if (catModalTypeFilter !== 'all') {
        if (cat.type !== 'both' && cat.type !== catModalTypeFilter) return false;
      }
      if (catModalSearch.trim()) {
        return cat.name.toLowerCase().includes(catModalSearch.trim().toLowerCase());
      }
      return true;
    });
  }, [categories, catModalTypeFilter, catModalSearch]);

  // Filtered transactions (searching across all months and across all data)
  const displayTransactions = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const q = searchQuery.trim().toLowerCase();

    return transactions.filter((tx) => {
      // 1. Month Scope: If search is closed OR searchScope is 'current_month', match only current month
      if (!isSearchOpen || searchScope === 'current_month') {
        if (!tx.date.startsWith(monthPrefix)) return false;
      }

      // 2. Account filter
      if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId) {
        return false;
      }

      // 2.5 Category filter
      if (selectedCategoryFilter && selectedCategoryFilter !== 'all') {
        if (tx.category !== selectedCategoryFilter) return false;
      }

      // 3. Search type filter
      if (isSearchOpen) {
        if (searchTypeFilter === 'expense' && tx.type !== 'expense') return false;
        if (searchTypeFilter === 'income' && tx.type !== 'income') return false;
        if (searchTypeFilter === 'transfer' && tx.type !== 'transfer') return false;
        if (searchTypeFilter === 'cards_accounts' || searchTypeFilter === 'recurring') return false;
      }

      // 4. Query matching across all data
      if (!q) return true;

      // Memo
      if (tx.memo && tx.memo.toLowerCase().includes(q)) return true;

      // Category
      if (tx.category && tx.category.toLowerCase().includes(q)) return true;

      // Account name / type
      const acc = accounts.find((a) => a.id === tx.accountId);
      if (acc) {
        if (acc.name.toLowerCase().includes(q) || acc.type.toLowerCase().includes(q)) return true;
      }
      if (tx.toAccountId) {
        const toAcc = accounts.find((a) => a.id === tx.toAccountId);
        if (toAcc && (toAcc.name.toLowerCase().includes(q) || toAcc.type.toLowerCase().includes(q)))
          return true;
      }

      // Credit card name & perks
      if (tx.cardId) {
        const card = cards.find((c) => c.id === tx.cardId);
        if (card) {
          if (card.name.toLowerCase().includes(q)) return true;
          if (card.rewardCategories.some((cat) => cat.toLowerCase().includes(q))) return true;
        }
      }

      // Transaction type
      if (tx.type.toLowerCase().includes(q)) return true;

      // Tags
      if (tx.tags && tx.tags.some((tag) => tag.toLowerCase().includes(q))) return true;

      // Date string representation
      if (matchDateString(tx.date, q)) return true;

      // Amount representation
      if (matchAmount(tx.amount, q)) return true;

      return false;
    });
  }, [
    transactions,
    currentYear,
    currentMonth,
    selectedAccountId,
    selectedCategoryFilter,
    isSearchOpen,
    searchScope,
    searchTypeFilter,
    searchQuery,
    accounts,
    cards,
  ]);

  // Financial summary for displayed transactions
  const { income, expense, netIncome } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    displayTransactions.forEach((tx) => {
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
  }, [displayTransactions]);

  // Group transactions by date
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: { date: string; items: Transaction[]; total: number } } = {};

    // Sort transactions descending by date, then createdAt
    const sorted = [...displayTransactions].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });

    sorted.forEach((tx) => {
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
  }, [displayTransactions]);

  // Toggle collapse date accordion
  const toggleDateCollapse = (date: string) => {
    setCollapsedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const formatDateHeader = (dateStr: string) => {
    // dateStr is 'YYYY-MM-DD'
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[d.getDay()];
    const dayNum = parts[2];
    const monthNum = parts[1];
    const monthName = months[parseInt(parts[1]) - 1];
    const year = parts[0];

    // If searching across all months, show month abbreviation and year for crystal clarity
    if (isSearchOpen && searchScope === 'all_months') {
      return `${dayName}, ${dayNum} ${monthName} ${year}`;
    }
    return `${dayName}, ${dayNum}/${monthNum}`;
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-28 space-y-4">
      {/* Expanded Search Console (Across all months & all data) */}
      {isSearchOpen && (
        <div className="bg-white rounded-3xl p-4 card-shadow border border-gray-100/90 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Main Search Input Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-[#F46C6C] absolute left-3.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search across all months & data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white rounded-2xl border border-gray-200 text-xs font-semibold text-[#2D3748] outline-hidden focus:border-[#F46C6C] shadow-2xs transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center absolute right-2.5 text-xs transition-colors"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {onCloseSearch && (
              <button
                type="button"
                onClick={onCloseSearch}
                className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
              >
                Done
              </button>
            )}
          </div>

          {/* Search Scope Switcher (All Months vs Current Month) */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSearchScope('all_months')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                searchScope === 'all_months'
                  ? 'bg-white text-[#2D3748] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#58B5A7]" />
              <span>All Months & History</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchScope('current_month')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                searchScope === 'current_month'
                  ? 'bg-white text-[#2D3748] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#F46C6C]" />
              <span>{monthTitle}</span>
            </button>
          </div>

          {/* Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All Data' },
              { id: 'expense', label: 'Expenses' },
              { id: 'income', label: 'Income' },
              { id: 'transfer', label: 'Transfers' },
              {
                id: 'cards_accounts',
                label: `Cards & Accounts${
                  matchedCards.length + matchedAccounts.length > 0
                    ? ` (${matchedCards.length + matchedAccounts.length})`
                    : ''
                }`,
              },
              {
                id: 'recurring',
                label: `Recurring Rules${
                  matchedRecurring.length > 0 ? ` (${matchedRecurring.length})` : ''
                }`,
              },
            ].map((chip) => {
              const isSelected = searchTypeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSearchTypeFilter(chip.id as any)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#2D3748] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Quick Suggestions & Tips (when query is empty) */}
          {!searchQuery.trim() && (
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Popular searches across all data:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCH_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setSearchQuery(chip.query)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#FFF0F0] text-[#F46C6C] hover:bg-[#FFE4E4] border border-[#F46C6C]/20 transition-all active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed bg-[#F7F8FA] p-2.5 rounded-xl border border-gray-100">
                💡 <span className="font-semibold text-gray-600">All-Data Search:</span> Type any memo, category (e.g. Food), account (e.g. Overseas), credit card (e.g. DBS), amount (e.g. $50, &gt;100), dates (e.g. Sep 2026, Feb), or recurring rules.
              </p>
            </div>
          )}

          {/* Search Result Counter & Micro Breakdown */}
          {searchQuery.trim() && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-bold text-[11px]">
                {displayTransactions.length} transaction{displayTransactions.length === 1 ? '' : 's'} found
                {searchScope === 'all_months' ? ' across all months' : ` in ${monthTitle}`}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#F46C6C] hover:underline font-bold"
              >
                Clear
              </button>
            </div>
          )}
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
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Action Icons: Settings, Eye */}
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
              {isSearchOpen && searchQuery ? 'Matched Income' : 'Income'}
            </span>
            <span className="text-sm font-bold text-[#38A169] tracking-tight">
              {isBalanceHidden
                ? '$ •••••'
                : `$${income.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </span>
          </div>

          {/* Expense */}
          <div className="flex flex-col items-center border-x border-gray-100 px-1">
            <span className="text-[11px] font-semibold tracking-tight text-[#718096] mb-1">
              {isSearchOpen && searchQuery ? 'Matched Expense' : 'Expense'}
            </span>
            <span className="text-sm font-bold text-[#E53E3E] tracking-tight">
              {isBalanceHidden
                ? '$ •••••'
                : `-$${expense.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
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

      {/* Matched Cards & Accounts Section (when searching across all data) */}
      {isSearchOpen &&
        (searchTypeFilter === 'all' || searchTypeFilter === 'cards_accounts') &&
        (matchedCards.length > 0 || matchedAccounts.length > 0) && (
          <div className="bg-white rounded-3xl p-4 card-shadow border border-gray-100/80 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4A5568] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#F46C6C]" />
                Matching Cards & Accounts ({matchedCards.length + matchedAccounts.length})
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Credit Cards */}
              {matchedCards.map((card) => {
                const theme =
                  THEME_CONFIG[card.colorTheme || card.cardColor || 'obsidian'] ||
                  THEME_CONFIG.obsidian;
                return (
                  <div
                    key={card.id}
                    className={`p-3.5 rounded-2xl bg-gradient-to-br ${theme.bgGradient} text-white shadow-xs flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-xs tracking-wide">
                        {card.name}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                        {card.isUnlimitedMax || (card.maxLimit ?? card.maxSpendLimit ?? 0) <= 0
                          ? 'Limit: Unlimited ∞'
                          : `Limit: $${(card.maxLimit ?? card.maxSpendLimit ?? 0).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {card.rewardCategories.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs"
                        >
                          ★ {c}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Accounts */}
              {matchedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-[#2D3748] block">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize">
                      {acc.type} Account
                    </span>
                  </div>
                  <span className="font-extrabold text-xs text-[#2D3748]">
                    {isBalanceHidden
                      ? '$ •••••'
                      : `$${acc.balance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Matched Recurring Rules Section (when searching across all data) */}
      {isSearchOpen &&
        (searchTypeFilter === 'all' || searchTypeFilter === 'recurring') &&
        matchedRecurring.length > 0 && (
          <div className="bg-white rounded-3xl p-4 card-shadow border border-gray-100/80 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4A5568] flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#58B5A7]" />
                Matching Recurring Rules ({matchedRecurring.length})
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {matchedRecurring.map((rec) => (
                <div
                  key={rec.id}
                  className="py-2.5 flex items-center justify-between first:pt-1 last:pb-1"
                >
                  <div>
                    <span className="font-bold text-xs text-[#2D3748] block">
                      {rec.title}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize">
                      {rec.frequency} • {rec.category} • Next: {rec.nextDate}
                    </span>
                  </div>
                  <span
                    className={`font-extrabold text-xs ${
                      rec.type === 'expense' ? 'text-[#E53E3E]' : 'text-[#38A169]'
                    }`}
                  >
                    {rec.type === 'expense' ? '-$' : '+$'}
                    {rec.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Period / Month Bar */}
      <div className="flex items-center justify-between px-2 py-1 select-none">
        {/* Left: Filter / List Icon */}
        <button
          type="button"
          onClick={() => setIsCategoryFilterOpen(true)}
          aria-label="Filter transactions by category"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            selectedCategoryFilter && selectedCategoryFilter !== 'all'
              ? 'bg-[#E8F8F5] text-[#0D9488] ring-1 ring-[#58B5A7]/50 shadow-2xs font-bold'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 active:scale-95'
          }`}
          title={
            selectedCategoryFilter && selectedCategoryFilter !== 'all'
              ? `Filtered by ${selectedCategoryFilter}`
              : 'Filter by category'
          }
        >
          <div className="relative flex items-center justify-center">
            <SlidersHorizontal
              className={`w-4 h-4 ${
                selectedCategoryFilter && selectedCategoryFilter !== 'all'
                  ? 'text-[#0D9488]'
                  : 'text-gray-500'
              }`}
            />
            {selectedCategoryFilter && selectedCategoryFilter !== 'all' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#0D9488] ring-1.5 ring-white" />
            )}
          </div>
          {selectedCategoryFilter && selectedCategoryFilter !== 'all' ? (
            <span className="text-xs font-bold truncate max-w-[85px]">
              {selectedCategoryFilter}
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-400 hidden xs:inline">
              Filter
            </span>
          )}
        </button>

        {/* Center: Month Selector (< Sep 2026 >) or Global Search Scope indicator */}
        {isSearchOpen && searchScope === 'all_months' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-gray-200/80 shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-[#58B5A7]" />
            <span className="font-bold text-xs text-[#2D3748] tracking-tight">
              All Months & History
            </span>
            <span className="text-[10px] font-black bg-[#E8F8F5] text-[#0D9488] px-1.5 py-0.2 rounded-md">
              {displayTransactions.length}
            </span>
          </div>
        ) : (
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
        )}

        {/* Right: "by M. >" dropdown toggle or Toggle Scope button */}
        {isSearchOpen && searchScope === 'all_months' ? (
          <button
            onClick={() => setSearchScope('current_month')}
            className="text-[11px] font-bold text-[#F46C6C] hover:underline"
          >
            Go to {monthNames[currentMonth]} &gt;
          </button>
        ) : (
          <div className="flex items-center text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-800">
            <span>by M.</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </div>
        )}
      </div>

      {/* Active Category Filter Chip */}
      {selectedCategoryFilter && selectedCategoryFilter !== 'all' && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-[#E8F8F5] to-white rounded-2xl border border-[#58B5A7]/30 shadow-2xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-gray-500 shrink-0">Filtered by:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl border border-gray-100 shadow-2xs min-w-0">
              {activeCategoryDef && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: activeCategoryDef.bgColor || '#FFF0F0',
                    color: activeCategoryDef.color || '#F46C6C',
                  }}
                >
                  <CategoryIcon name={activeCategoryDef.icon} className="w-2.5 h-2.5" />
                </div>
              )}
              <span className="text-xs font-bold text-[#2D3748] truncate">
                {selectedCategoryFilter}
              </span>
              <span className="text-[10px] font-bold text-[#0D9488] bg-[#E8F8F5] px-1.5 py-0.2 rounded-md shrink-0">
                {displayTransactions.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter(null)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-white px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Clear category filter"
            aria-label="Clear category filter"
          >
            <span>Clear</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grouped Date Transaction Feed */}
      {groupedByDate.length === 0 ? (
        <div className="w-full bg-white rounded-3xl p-8 text-center card-shadow border border-gray-100/80">
          <div className="w-12 h-12 rounded-full bg-[#FFF0F0] text-[#F46C6C] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-[#2D3748] mb-1">No transactions found</h4>
          <p className="text-xs text-gray-400 mb-4">
            {selectedCategoryFilter && selectedCategoryFilter !== 'all'
              ? `No transactions in "${selectedCategoryFilter}" found for ${
                  searchScope === 'all_months' ? 'all months' : monthTitle
                }`
              : searchQuery
              ? `No transactions matching "${searchQuery}" found across ${
                  searchScope === 'all_months' ? 'all months' : monthTitle
                }`
              : `No activity recorded for ${
                  searchScope === 'all_months' ? 'any month' : monthTitle
                }`}
          </p>
          {selectedCategoryFilter && selectedCategoryFilter !== 'all' ? (
            <button
              onClick={() => setSelectedCategoryFilter(null)}
              className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-[#2D3748] rounded-xl text-xs font-bold transition-all"
            >
              Clear Category Filter
            </button>
          ) : searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-[#2D3748] rounded-xl text-xs font-bold transition-all"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={onOpenNewEntry}
              className="py-2 px-4 bg-[#F46C6C] hover:bg-[#E05A5A] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              + Add First Entry
            </button>
          )}
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
                      const cardObj = tx.cardId ? cards.find((c) => c.id === tx.cardId) : null;
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
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-medium text-gray-400 truncate">
                                  {accountObj?.name || 'Local'}
                                </span>
                                {cardObj && (
                                  <>
                                    <span className="text-gray-300 text-[10px]">•</span>
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-gray-100 text-gray-700">
                                      💳 {cardObj.name}
                                    </span>
                                  </>
                                )}
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

      {/* Category Filter Modal / Bottom Sheet */}
      {isCategoryFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsCategoryFilterOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
              <button
                type="button"
                onClick={() => setIsCategoryFilterOpen(false)}
                aria-label="Close category filter"
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h2 className="font-bold text-base text-[#2D3748]">
                  Filter by Category
                </h2>
                <p className="text-[11px] text-gray-400 font-medium">
                  {isSearchOpen && searchScope === 'all_months' ? 'All Months & History' : monthTitle}
                </p>
              </div>

              <div className="w-8 flex justify-end">
                {selectedCategoryFilter && selectedCategoryFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(null);
                      setIsCategoryFilterOpen(false);
                    }}
                    className="text-xs font-bold text-[#F46C6C] hover:underline"
                  >
                    Reset
                  </button>
                ) : (
                  <div className="w-8" />
                )}
              </div>
            </div>

            {/* Filter controls & Search */}
            <div className="px-5 pt-3 pb-3 space-y-2.5 border-b border-gray-100/80 bg-gray-50/50">
              {/* Type Filter Pills */}
              <div className="flex bg-[#EAECEF] p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setCatModalTypeFilter('all')}
                  className={`flex-1 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    catModalTypeFilter === 'all'
                      ? 'bg-white text-[#2D3748] shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  All ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatModalTypeFilter('expense')}
                  className={`flex-1 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    catModalTypeFilter === 'expense'
                      ? 'bg-[#FF7676] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Expense ({categories.filter((c) => c.type === 'expense' || c.type === 'both').length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatModalTypeFilter('income')}
                  className={`flex-1 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    catModalTypeFilter === 'income'
                      ? 'bg-[#58B5A7] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Income ({categories.filter((c) => c.type === 'income' || c.type === 'both').length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={catModalSearch}
                  onChange={(e) => setCatModalSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-[#2D3748] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#58B5A7]"
                />
                {catModalSearch && (
                  <button
                    type="button"
                    onClick={() => setCatModalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {/* "All Categories" Row */}
              {(!catModalSearch || 'all categories'.includes(catModalSearch.toLowerCase())) &&
                catModalTypeFilter === 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(null);
                      setIsCategoryFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      !selectedCategoryFilter || selectedCategoryFilter === 'all'
                        ? 'bg-[#E8F8F5]/70 border-[#58B5A7] shadow-xs ring-1 ring-[#58B5A7]/30'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#E8F8F5] text-[#0D9488] flex items-center justify-center shrink-0 shadow-2xs">
                        <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2D3748]">
                            All Categories
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                            All
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {basePeriodTransactions.length}{' '}
                          {basePeriodTransactions.length === 1 ? 'transaction' : 'transactions'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-2">
                      {!selectedCategoryFilter || selectedCategoryFilter === 'all' ? (
                        <div className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-gray-200 shrink-0" />
                      )}
                    </div>
                  </button>
                )}

              {/* Individual Categories */}
              {filteredCategoriesForModal.map((cat) => {
                const isSelected = selectedCategoryFilter === cat.name;
                const stats = categoryStats[cat.name] || { count: 0, total: 0 };

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(isSelected ? null : cat.name);
                      setIsCategoryFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#E8F8F5]/70 border-[#58B5A7] shadow-xs ring-1 ring-[#58B5A7]/30'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: cat.bgColor || '#FFF0F0',
                          color: cat.color || '#F46C6C',
                        }}
                      >
                        <CategoryIcon name={cat.icon} className="w-5 h-5" strokeWidth={2.2} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2D3748] truncate">
                            {cat.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              cat.type === 'expense'
                                ? 'bg-[#FFF0F0] text-[#E53E3E]'
                                : cat.type === 'income'
                                ? 'bg-[#E8F8F5] text-[#0D9488]'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {cat.type === 'expense' ? 'Expense' : cat.type === 'income' ? 'Income' : 'Both'}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 mt-0.5">
                          {stats.count === 0 ? (
                            '0 transactions'
                          ) : (
                            <>
                              {stats.count} {stats.count === 1 ? 'transaction' : 'transactions'}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-2">
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold block ${
                            stats.count === 0
                              ? 'text-gray-300'
                              : cat.type === 'expense'
                              ? 'text-[#E53E3E]'
                              : cat.type === 'income'
                              ? 'text-[#38A169]'
                              : 'text-gray-700'
                          }`}
                        >
                          {stats.count === 0
                            ? '$0.00'
                            : `${cat.type === 'expense' ? '-$' : cat.type === 'income' ? '+$' : '$'}${stats.total.toLocaleString(
                                'en-US',
                                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                              )}`}
                        </span>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-gray-200 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredCategoriesForModal.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No categories found matching &quot;{catModalSearch}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
