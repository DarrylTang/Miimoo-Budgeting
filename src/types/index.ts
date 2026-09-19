export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  accountId: string;
  cardId?: string; // Optional credit card ID
  toAccountId?: string; // for transfer
  date: string; // YYYY-MM-DD
  memo: string;
  tags?: string[];
  createdAt: number;
}

export type CardColorTheme = 'obsidian' | 'coral' | 'emerald' | 'ocean' | 'purple';

export interface CreditCard {
  id: string;
  name: string;
  cardColor: string; // gradient or theme key e.g. 'obsidian' | 'coral' | 'emerald' | 'ocean' | 'purple'
  colorTheme?: CardColorTheme;
  maxSpendLimit: number; // e.g. 2500, or 0 for unlimited
  maxLimit?: number;
  isUnlimitedMax?: boolean;
  minSpendRequirement: number; // e.g. 600
  minSpend?: number;
  billingCycleStartDay: number; // 1-31, default 1
  billingCycleDay?: number;
  rewardCategories: string[]; // e.g. ["Food", "Shopping", "Entertainment"]
  isDefault: boolean;
}

export type AccountType = 'local' | 'overseas';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  isDefault?: boolean;
  color?: string;
}

export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  accountId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  dayOfMonth?: number; // 1-31
  weekday?: string; // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  dayOfWeek?: string; // alias
  isActive: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string; // Hex color for icon/accent
  bgColor: string; // Hex color for icon background
  type: 'expense' | 'income' | 'both';
}

export interface MonthSummary {
  income: number;
  expense: number;
  netIncome: number;
}
