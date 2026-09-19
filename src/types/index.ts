export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  accountId: string;
  toAccountId?: string; // for transfer
  date: string; // YYYY-MM-DD
  memo: string;
  tags?: string[];
  createdAt: number;
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
