'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PieChart,
} from 'lucide-react';
import { useBudget } from '@/lib/store';

type MetricType = 'Expense' | 'Income' | 'Net Income';

export function AnalyticsView() {
  const { transactions, accounts, categories, isBalanceHidden } = useBudget();

  const now = new Date();
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth();

  // Selected filter states
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [metric, setMetric] = useState<MetricType>('Expense');
  const [selectedYear, setSelectedYear] = useState(currentRealYear);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(currentRealMonth);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Dynamically filtered categories based on active metric tab
  const filterCategories = useMemo(() => {
    if (metric === 'Expense') {
      const expCats = categories.filter(c => c.type === 'expense' || c.type === 'both').map(c => c.name);
      return ['All', ...Array.from(new Set(expCats))];
    }
    if (metric === 'Income') {
      const incCats = categories.filter(c => c.type === 'income' || c.type === 'both').map(c => c.name);
      return ['All', ...Array.from(new Set(incCats))];
    }
    // Net Income tab: show all unique categories
    const allCats = categories.map(c => c.name);
    return ['All', ...Array.from(new Set(allCats))];
  }, [categories, metric]);

  // Handle switching metric tabs with category filter validation
  const handleMetricChange = (newMetric: MetricType) => {
    setMetric(newMetric);
    if (selectedCategory !== 'All') {
      let allowedNames: string[] = [];
      if (newMetric === 'Expense') {
        allowedNames = categories.filter(c => c.type === 'expense' || c.type === 'both').map(c => c.name);
      } else if (newMetric === 'Income') {
        allowedNames = categories.filter(c => c.type === 'income' || c.type === 'both').map(c => c.name);
      } else {
        allowedNames = categories.map(c => c.name);
      }
      if (!allowedNames.includes(selectedCategory)) {
        setSelectedCategory('All');
      }
    }
  };

  // Filter transactions by year, account, and category
  const yearTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchYear = tx.date.startsWith(`${selectedYear}-`);
      const matchAccount = selectedAccountId === 'all' || tx.accountId === selectedAccountId;
      const matchCategory = selectedCategory === 'All' || tx.category === selectedCategory;
      return matchYear && matchAccount && matchCategory;
    });
  }, [transactions, selectedYear, selectedAccountId, selectedCategory]);

  // Compute 12-month data array with separated expense & income category buckets
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: monthNames[i],
      monthIndex: i,
      expense: 0,
      income: 0,
      netIncome: 0,
      expenseCategories: {} as Record<string, number>,
      incomeCategories: {} as Record<string, number>,
    }));

    yearTransactions.forEach(tx => {
      const parts = tx.date.split('-');
      if (parts.length < 2) return;
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        if (tx.type === 'expense') {
          data[mIdx].expense += tx.amount;
          data[mIdx].expenseCategories[tx.category] = (data[mIdx].expenseCategories[tx.category] || 0) + tx.amount;
        } else if (tx.type === 'income') {
          data[mIdx].income += tx.amount;
          data[mIdx].incomeCategories[tx.category] = (data[mIdx].incomeCategories[tx.category] || 0) + tx.amount;
        }
      }
    });

    data.forEach(item => {
      item.netIncome = item.income - item.expense;
    });

    return data;
  }, [yearTransactions, monthNames]);

  // Determine value per month based on active metric (signed for Net Income)
  const getMonthValue = (item: (typeof monthlyData)[0]) => {
    if (metric === 'Expense') return item.expense;
    if (metric === 'Income') return item.income;
    return item.netIncome;
  };

  // Accurate totals & calculations
  const { totalValue, avgValue, maxValue } = useMemo(() => {
    if (metric === 'Expense') {
      const allExpenses = monthlyData.map(d => d.expense);
      const total = allExpenses.reduce((acc, curr) => acc + curr, 0);
      const activeCount = allExpenses.filter(v => v > 0).length;
      const avg = activeCount > 0 ? total / activeCount : 0;
      const max = Math.max(...allExpenses, 100);
      return { totalValue: total, avgValue: avg, maxValue: max };
    }

    if (metric === 'Income') {
      const allIncomes = monthlyData.map(d => d.income);
      const total = allIncomes.reduce((acc, curr) => acc + curr, 0);
      const activeCount = allIncomes.filter(v => v > 0).length;
      const avg = activeCount > 0 ? total / activeCount : 0;
      const max = Math.max(...allIncomes, 100);
      return { totalValue: total, avgValue: avg, maxValue: max };
    }

    // Net Income tab: sum of incomes minus sum of expenses (true signed net income)
    const totalNet = monthlyData.reduce((acc, curr) => acc + curr.netIncome, 0);
    const activeMonths = monthlyData.filter(d => d.expense > 0 || d.income > 0).length;
    const avg = activeMonths > 0 ? totalNet / activeMonths : 0;
    const max = Math.max(...monthlyData.map(d => Math.abs(d.netIncome)), 100);
    return { totalValue: totalNet, avgValue: avg, maxValue: max };
  }, [metric, monthlyData]);

  // Formatter helpers with explicit signs and colors
  const formatSignedCurrency = (val: number, forcedMetric?: MetricType) => {
    if (isBalanceHidden) return '$ •••••';
    const m = forcedMetric || metric;
    const formattedAbs = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (m === 'Expense') {
      return val > 0 ? `-$${formattedAbs}` : '$0.00';
    }
    if (m === 'Income') {
      return val > 0 ? `+$${formattedAbs}` : '$0.00';
    }
    // Net Income
    if (val > 0) return `+$${formattedAbs}`;
    if (val < 0) return `-$${formattedAbs}`;
    return '$0.00';
  };

  const getSignedTextColor = (val: number, forcedMetric?: MetricType) => {
    const m = forcedMetric || metric;
    if (m === 'Expense') {
      return val > 0 ? 'text-[#E53E3E]' : 'text-[#718096]';
    }
    if (m === 'Income') {
      return val > 0 ? 'text-[#38A169]' : 'text-[#718096]';
    }
    // Net Income
    if (val > 0) return 'text-[#38A169]';
    if (val < 0) return 'text-[#E53E3E]';
    return 'text-[#718096]';
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

      {/* Segmented Control: [Expense] | [Income] | [Net Income] */}
      <div className="flex bg-[#EEF0F4] p-1 rounded-2xl">
        {(['Expense', 'Income', 'Net Income'] as MetricType[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleMetricChange(m)}
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
          <span className={`text-base font-extrabold tracking-tight ${getSignedTextColor(totalValue)}`}>
            {formatSignedCurrency(totalValue)}
          </span>
        </div>

        {/* Responsive Bar Chart (Jan - Dec) with dashed AVG line */}
        <div className="relative pt-6 pb-2">
          {/* Dashed AVG Reference Line */}
          {Math.abs(avgValue) > 0 && (
            <div
              className="absolute left-0 right-0 border-b border-dashed border-[#F59E0B] pointer-events-none z-10 flex justify-end"
              style={{
                bottom: `${Math.min(90, Math.max(10, (Math.abs(avgValue) / maxValue) * 160 + 24))}px`,
              }}
            >
              <span className="text-[9px] font-bold text-[#D97706] bg-[#FEF3C7] px-1 rounded-sm -mr-1 -translate-y-1/2">
                AVG {formatSignedCurrency(avgValue)}
              </span>
            </div>
          )}

          {/* Bar chart columns container */}
          <div className="h-44 flex items-end justify-between gap-1 pt-4">
            {monthlyData.map((item) => {
              const val = getMonthValue(item);
              const absVal = Math.abs(val);
              const heightPercent = maxValue > 0 ? Math.round((absVal / maxValue) * 100) : 0;
              const isCurrentMonth = selectedYear === currentRealYear && item.monthIndex === currentRealMonth;
              const isSelected = selectedMonthIndex === item.monthIndex;

              // Color resolution based on metric and sign
              let barColorClass = 'bg-gray-100 h-1';
              if (absVal > 0) {
                if (metric === 'Expense') {
                  barColorClass = isSelected
                    ? 'bg-[#F46C6C] shadow-sm'
                    : isCurrentMonth
                    ? 'bg-[#FF9494]'
                    : 'bg-[#FFB4B4] group-hover:bg-[#FF9494]';
                } else if (metric === 'Income') {
                  barColorClass = isSelected
                    ? 'bg-[#38A169] shadow-sm'
                    : isCurrentMonth
                    ? 'bg-[#58B5A7]'
                    : 'bg-[#9FE1D7] group-hover:bg-[#58B5A7]';
                } else {
                  // Net Income: teal if positive, red if negative
                  if (val >= 0) {
                    barColorClass = isSelected
                      ? 'bg-[#38A169] shadow-sm'
                      : isCurrentMonth
                      ? 'bg-[#58B5A7]'
                      : 'bg-[#9FE1D7] group-hover:bg-[#58B5A7]';
                  } else {
                    barColorClass = isSelected
                      ? 'bg-[#F46C6C] shadow-sm'
                      : isCurrentMonth
                      ? 'bg-[#FF9494]'
                      : 'bg-[#FFB4B4] group-hover:bg-[#FF9494]';
                  }
                }
              }

              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center group cursor-pointer"
                  onClick={() => setSelectedMonthIndex(item.monthIndex)}
                >
                  {/* Tooltip on hover/selected */}
                  {isSelected && absVal > 0 && (
                    <div
                      className={`text-[9px] font-bold bg-gray-100 px-1 py-0.5 rounded-sm mb-1 whitespace-nowrap animate-in fade-in shadow-2xs ${getSignedTextColor(val)}`}
                    >
                      {formatSignedCurrency(val)}
                    </div>
                  )}

                  {/* Vertical bar */}
                  <div className="w-full flex items-end justify-center h-32">
                    <div
                      className={`w-full max-w-[18px] rounded-t-md transition-all duration-300 ${barColorClass}`}
                      style={{
                        height: absVal > 0 ? `${Math.max(6, heightPercent)}%` : '4px',
                      }}
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`text-[10px] mt-1.5 tracking-tight font-medium ${
                      isSelected
                        ? metric === 'Income' || (metric === 'Net Income' && val >= 0)
                          ? 'font-bold text-[#38A169]'
                          : 'font-bold text-[#F46C6C]'
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
          <span className={`text-xs font-bold ${getSignedTextColor(avgValue)}`}>
            AVG: {formatSignedCurrency(avgValue)}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {monthlyData.map((item) => {
            const val = getMonthValue(item);
            const absVal = Math.abs(val);
            const isExpanded = expandedMonth === item.monthIndex;

            // Visual bar percentage calculation
            let percent = 0;
            if (metric === 'Expense' || metric === 'Income') {
              percent = totalValue > 0 ? Math.round((absVal / totalValue) * 100) : 0;
            } else {
              percent = maxValue > 0 ? Math.round((absVal / maxValue) * 100) : 0;
            }

            // Categories list based on active metric
            const topExpenseCats = Object.entries(item.expenseCategories).sort((a, b) => b[1] - a[1]);
            const topIncomeCats = Object.entries(item.incomeCategories).sort((a, b) => b[1] - a[1]);

            // Progress bar color
            const barBgColor =
              metric === 'Income' || (metric === 'Net Income' && val >= 0)
                ? 'bg-[#58B5A7]'
                : 'bg-[#FF7676]';

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
                      className={`h-full rounded-full transition-all duration-300 ${barBgColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xs tracking-tight ${getSignedTextColor(val)}`}>
                      {formatSignedCurrency(val)}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? '-rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Month Details */}
                {isExpanded && (
                  <div className="px-6 pb-3 pt-2 bg-gray-50/60 space-y-2 border-t border-gray-100 animate-in fade-in">
                    {metric === 'Net Income' ? (
                      <>
                        {/* Summary lines for Income and Expense */}
                        <div className="pb-1 space-y-1.5 border-b border-gray-200/60">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-[#38A169]">Total Income</span>
                            <span className="text-[#38A169]">
                              {formatSignedCurrency(item.income, 'Income')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-[#E53E3E]">Total Expenses</span>
                            <span className="text-[#E53E3E]">
                              {formatSignedCurrency(item.expense, 'Expense')}
                            </span>
                          </div>
                        </div>

                        {/* Top Category breakdown */}
                        {(topIncomeCats.length > 0 || topExpenseCats.length > 0) && (
                          <div className="space-y-1 pt-0.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                              Category Breakdown
                            </div>
                            {topIncomeCats.map(([catName, catAmount]) => (
                              <div key={`inc-${catName}`} className="flex items-center justify-between text-xs">
                                <span className="text-[#718096] font-medium">{catName}</span>
                                <span className="font-semibold text-[#38A169]">
                                  {formatSignedCurrency(catAmount, 'Income')}
                                </span>
                              </div>
                            ))}
                            {topExpenseCats.map(([catName, catAmount]) => (
                              <div key={`exp-${catName}`} className="flex items-center justify-between text-xs">
                                <span className="text-[#718096] font-medium">{catName}</span>
                                <span className="font-semibold text-[#E53E3E]">
                                  {formatSignedCurrency(catAmount, 'Expense')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : metric === 'Expense' ? (
                      topExpenseCats.length > 0 ? (
                        <div className="space-y-1.5">
                          {topExpenseCats.map(([catName, catAmount]) => (
                            <div key={catName} className="flex items-center justify-between text-xs">
                              <span className="text-[#718096] font-medium">{catName}</span>
                              <span className="font-semibold text-[#E53E3E]">
                                {formatSignedCurrency(catAmount, 'Expense')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 py-1 text-center">No expense entries for this month</div>
                      )
                    ) : (
                      topIncomeCats.length > 0 ? (
                        <div className="space-y-1.5">
                          {topIncomeCats.map(([catName, catAmount]) => (
                            <div key={catName} className="flex items-center justify-between text-xs">
                              <span className="text-[#718096] font-medium">{catName}</span>
                              <span className="font-semibold text-[#38A169]">
                                {formatSignedCurrency(catAmount, 'Income')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 py-1 text-center">No income entries for this month</div>
                      )
                    )}
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
            <span className={`font-extrabold text-sm tracking-tight ${getSignedTextColor(totalValue)}`}>
              {formatSignedCurrency(totalValue)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0] block">
              Monthly Average
            </span>
            <span className={`font-extrabold text-sm tracking-tight ${getSignedTextColor(avgValue)}`}>
              {formatSignedCurrency(avgValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
