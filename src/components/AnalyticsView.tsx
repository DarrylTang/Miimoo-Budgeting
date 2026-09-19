'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PieChart,
  Filter,
} from 'lucide-react';
import { useBudget } from '@/lib/store';
import { CategoryIcon } from '@/components/CategoryIcon';

type MetricType = 'Expense' | 'Income' | 'Net Income' | 'Balance';

export function AnalyticsView() {
  const { transactions, accounts, categories, isBalanceHidden } = useBudget();

  // Selected filter states
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [metric, setMetric] = useState<MetricType>('Expense');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(8); // default Sep (idx 8)
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Filter transactions by year, account, and category
  const yearTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchYear = tx.date.startsWith(`${selectedYear}-`);
      const matchAccount = selectedAccountId === 'all' || tx.accountId === selectedAccountId;
      const matchCategory = selectedCategory === 'All' || tx.category === selectedCategory;
      return matchYear && matchAccount && matchCategory;
    });
  }, [transactions, selectedYear, selectedAccountId, selectedCategory]);

  // Compute 12-month data array
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: monthNames[i],
      monthIndex: i,
      expense: 0,
      income: 0,
      netIncome: 0,
      categories: {} as Record<string, number>,
    }));

    yearTransactions.forEach(tx => {
      const parts = tx.date.split('-');
      if (parts.length < 2) return;
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        if (tx.type === 'expense') {
          data[mIdx].expense += tx.amount;
          data[mIdx].categories[tx.category] = (data[mIdx].categories[tx.category] || 0) + tx.amount;
        } else if (tx.type === 'income') {
          data[mIdx].income += tx.amount;
          data[mIdx].categories[tx.category] = (data[mIdx].categories[tx.category] || 0) + tx.amount;
        }
      }
    });

    data.forEach(item => {
      item.netIncome = item.income - item.expense;
    });

    return data;
  }, [yearTransactions, monthNames]);

  // Determine value per month based on active metric
  const getMonthValue = (item: (typeof monthlyData)[0]) => {
    if (metric === 'Expense') return item.expense;
    if (metric === 'Income') return item.income;
    if (metric === 'Net Income') return item.netIncome;
    // For Balance: cumulative net income
    return item.netIncome;
  };

  const values = monthlyData.map(d => Math.abs(getMonthValue(d)));
  const totalValue = values.reduce((acc, curr) => acc + curr, 0);
  const activeMonthCount = values.filter(v => v > 0).length || 1;
  const avgValue = totalValue / (activeMonthCount || 12);
  const maxValue = Math.max(...values, 100);

  // Category filter list
  const filterCategories = useMemo(() => {
    const unique = new Set<string>();
    categories.forEach(c => unique.add(c.name));
    return ['All', ...Array.from(unique)];
  }, [categories]);

  // Colors for active metric
  const getMetricColor = () => {
    switch (metric) {
      case 'Expense':
        return { primary: '#FF7676', bg: '#FFF0F0', text: 'text-[#E53E3E]' };
      case 'Income':
        return { primary: '#58B5A7', bg: '#E8F8F5', text: 'text-[#38A169]' };
      case 'Net Income':
        return { primary: '#2C5E6E', bg: '#E0F4F1', text: 'text-[#2C5E6E]' };
      case 'Balance':
        return { primary: '#6366F1', bg: '#EEF2FF', text: 'text-[#6366F1]' };
    }
  };
  const metricColor = getMetricColor();

  const formatCurrency = (val: number) => {
    if (isBalanceHidden) return '$ •••••';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-28 space-y-4">
      {/* Top Bar: Analytics Title & Account Dropdown */}
      <div className="flex items-center justify-between pt-1 select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FFF0F0] text-[#F46C6C] flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-[#2D3748]">Analytics & Trends</h2>
        </div>

        {/* Account Selector */}
        <div className="relative">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="appearance-none bg-white font-semibold text-xs text-[#2D3748] py-1.5 pl-3 pr-7 rounded-full border border-gray-200 outline-hidden cursor-pointer shadow-2xs"
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
      </div>

      {/* Segmented Control: [Expense] | [Income] | [Net Income] | [Balance] */}
      <div className="flex bg-[#EEF0F4] p-1 rounded-2xl">
        {(['Expense', 'Income', 'Net Income', 'Balance'] as MetricType[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              metric === m
                ? 'bg-white text-[#2D3748] shadow-xs'
                : 'text-[#718096] hover:text-[#2D3748]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Horizontal Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filterCategories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#2D3748] text-white shadow-2xs'
                  : 'bg-white text-[#718096] hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Year Selector (< 2026 >) */}
      <div className="flex items-center justify-center gap-3 select-none">
        <button
          onClick={() => setSelectedYear(prev => prev - 1)}
          className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-500 hover:text-gray-800 shadow-2xs transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-sm text-[#2D3748] tracking-tight min-w-[60px] text-center">
          {selectedYear}
        </span>
        <button
          onClick={() => setSelectedYear(prev => prev + 1)}
          className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-500 hover:text-gray-800 shadow-2xs transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* TOTAL Card Header */}
      <div className="bg-white rounded-3xl p-5 card-shadow border border-gray-100/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0]">
            TOTAL {selectedYear}
          </span>
          <span className="text-base font-extrabold text-[#2D3748] tracking-tight">
            {formatCurrency(totalValue)}
          </span>
        </div>

        {/* SVG Responsive Bar Chart (Jan - Dec) with dashed AVG line */}
        <div className="relative pt-6 pb-2">
          {/* Dashed AVG Reference Line */}
          {avgValue > 0 && (
            <div
              className="absolute left-0 right-0 border-b border-dashed border-[#F59E0B] pointer-events-none z-10 flex justify-end"
              style={{
                bottom: `${Math.min(90, Math.max(10, (avgValue / maxValue) * 160 + 24))}px`,
              }}
            >
              <span className="text-[9px] font-bold text-[#D97706] bg-[#FEF3C7] px-1 rounded-sm -mr-1 -translate-y-1/2">
                AVG {formatCurrency(avgValue)}
              </span>
            </div>
          )}

          {/* Bar chart columns container */}
          <div className="h-44 flex items-end justify-between gap-1 pt-4">
            {monthlyData.map((item) => {
              const val = Math.abs(getMonthValue(item));
              const heightPercent = maxValue > 0 ? Math.round((val / maxValue) * 100) : 0;
              const isCurrentMonth = item.monthIndex === 8; // Sep
              const isSelected = selectedMonthIndex === item.monthIndex;

              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center group cursor-pointer"
                  onClick={() => setSelectedMonthIndex(item.monthIndex)}
                >
                  {/* Tooltip on hover/selected */}
                  {isSelected && val > 0 && (
                    <div className="text-[9px] font-bold text-[#2D3748] bg-gray-100 px-1 rounded-xs mb-1 whitespace-nowrap animate-in fade-in">
                      ${Math.round(val)}
                    </div>
                  )}

                  {/* Vertical bar */}
                  <div className="w-full flex items-end justify-center h-32">
                    <div
                      className={`w-full max-w-[18px] rounded-t-md transition-all duration-300 ${
                        isSelected
                          ? 'bg-[#F46C6C] shadow-sm'
                          : isCurrentMonth
                          ? 'bg-[#FF9494]'
                          : val > 0
                          ? 'bg-[#CBD5E1] group-hover:bg-[#94A3B8]'
                          : 'bg-gray-100 h-1'
                      }`}
                      style={{
                        height: val > 0 ? `${Math.max(6, heightPercent)}%` : '4px',
                      }}
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`text-[10px] mt-1.5 tracking-tight font-medium ${
                      isSelected
                        ? 'font-bold text-[#F46C6C]'
                        : isCurrentMonth
                        ? 'font-bold text-[#2D3748]'
                        : 'text-gray-400'
                    }`}
                  >
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Month-by-Month Breakdown Table */}
      <div className="bg-white rounded-3xl overflow-hidden card-shadow border border-gray-100/80">
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#FBFBFC] to-white border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#718096]">
            Monthly Breakdown
          </h3>
          <span className="text-xs font-bold text-[#2D3748]">
            AVG: {formatCurrency(avgValue)}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {monthlyData.map((item) => {
            const val = Math.abs(getMonthValue(item));
            const isExpanded = expandedMonth === item.monthIndex;
            const percent = totalValue > 0 ? Math.round((val / totalValue) * 100) : 0;
            const topCategories = Object.entries(item.categories).sort((a, b) => b[1] - a[1]);

            return (
              <div key={item.month} className="transition-colors hover:bg-gray-50/70">
                <div
                  className="px-5 py-3 flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setExpandedMonth(isExpanded ? null : item.monthIndex)}
                >
                  <div className="flex items-center gap-3 min-w-[70px]">
                    <span className="font-bold text-xs text-[#2D3748]">{item.month}</span>
                    <span className="text-[10px] font-medium text-gray-400">
                      {percent}%
                    </span>
                  </div>

                  {/* Progress bar visual */}
                  <div className="flex-1 mx-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#FF7676]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#2D3748]">
                      {formatCurrency(val)}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? '-rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Month Category breakdown */}
                {isExpanded && topCategories.length > 0 && (
                  <div className="px-6 pb-3 pt-1 bg-gray-50/50 space-y-1.5 border-t border-gray-50 animate-in fade-in">
                    {topCategories.map(([catName, catAmount]) => (
                      <div key={catName} className="flex items-center justify-between text-xs">
                        <span className="text-[#718096] font-medium">{catName}</span>
                        <span className="font-semibold text-[#2D3748]">
                          {formatCurrency(catAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Total & Avg Summary */}
        <div className="p-4 bg-[#FBFBFC] border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] block">
              Year Total
            </span>
            <span className="font-extrabold text-sm text-[#2D3748]">
              {formatCurrency(totalValue)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] block">
              Monthly Average
            </span>
            <span className="font-extrabold text-sm text-[#F59E0B]">
              {formatCurrency(avgValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
