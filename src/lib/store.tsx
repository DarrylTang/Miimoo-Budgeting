'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Transaction, Account, RecurringRule, CategoryItem, CreditCard, CardColorTheme } from '@/types';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-food', name: 'Food', icon: 'UtensilsCrossed', color: '#F46C6C', bgColor: '#FFF0F0', type: 'expense' },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'Sparkles', color: '#8B5CF6', bgColor: '#F5F3FF', type: 'expense' },
  { id: 'cat-transport', name: 'Transportation', icon: 'Car', color: '#10B981', bgColor: '#ECFDF5', type: 'expense' },
  { id: 'cat-groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#58B5A7', bgColor: '#E8F8F5', type: 'expense' },
  { id: 'cat-clothing', name: 'Clothing', icon: 'Shirt', color: '#F97316', bgColor: '#FFF7ED', type: 'expense' },
  { id: 'cat-utilities', name: 'Utilities', icon: 'Zap', color: '#E89E38', bgColor: '#FFF7ED', type: 'expense' },
  { id: 'cat-health', name: 'Health', icon: 'HeartPulse', color: '#EC4899', bgColor: '#FDF2F8', type: 'expense' },
  { id: 'cat-insurance', name: 'Insurance', icon: 'ShieldCheck', color: '#6366F1', bgColor: '#EEF2FF', type: 'expense' },
  { id: 'cat-shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#06B6D4', bgColor: '#ECFEFF', type: 'expense' },
  { id: 'cat-salary', name: 'Salary', icon: 'BadgeDollarSign', color: '#10B981', bgColor: '#ECFDF5', type: 'income' },
  { id: 'cat-freelance', name: 'Side Income', icon: 'Coins', color: '#14B8A6', bgColor: '#F0FDFA', type: 'income' },
  { id: 'cat-transfer', name: 'Transfer', icon: 'ArrowRightLeft', color: '#64748B', bgColor: '#F1F5F9', type: 'both' },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-main', name: 'Main Account (Local)', type: 'local', currency: 'SGD', balance: 4850.50, isDefault: true, color: '#F46C6C' },
  { id: 'acc-overseas', name: 'Overseas Card', type: 'overseas', currency: 'SGD', balance: 620.00, color: '#58B5A7' },
];

export const DEFAULT_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card-dbs',
    name: 'DBS Live Fresh',
    cardColor: 'from-[#FF5E62] to-[#FF9966]',
    maxSpendLimit: 2500,
    minSpendRequirement: 600,
    billingCycleStartDay: 1,
    rewardCategories: ['Food', 'Shopping', 'Entertainment'],
    isDefault: true,
    colorTheme: 'coral',
    maxLimit: 2500,
    minSpend: 600,
    billingCycleDay: 1,
  },
  {
    id: 'card-citi',
    name: 'Citi Cash Back',
    cardColor: 'from-[#0F2027] via-[#203A43] to-[#2C5364]',
    maxSpendLimit: 3500,
    minSpendRequirement: 800,
    billingCycleStartDay: 1,
    rewardCategories: ['Groceries', 'Utilities', 'Transportation'],
    isDefault: false,
    colorTheme: 'ocean',
    maxLimit: 3500,
    minSpend: 800,
    billingCycleDay: 1,
  },
];

export const DEFAULT_CARDS = DEFAULT_CREDIT_CARDS;

export const DEFAULT_RECURRING: RecurringRule[] = [
  { id: 'rec-1', title: 'Monthly Salary', amount: 1185.00, type: 'income', category: 'Salary', accountId: 'acc-main', frequency: 'monthly', nextDate: '2026-10-01', startDate: '2026-09-01', dayOfMonth: 1, isActive: true },
  { id: 'rec-2', title: 'House maintenance', amount: 100.00, type: 'expense', category: 'Housing', accountId: 'acc-main', frequency: 'monthly', nextDate: '2026-10-01', startDate: '2026-09-01', dayOfMonth: 1, isActive: true },
  { id: 'rec-3', title: 'SP Services Utilities', amount: 115.40, type: 'expense', category: 'Utilities', accountId: 'acc-main', frequency: 'monthly', nextDate: '2026-10-12', startDate: '2026-09-12', dayOfMonth: 12, isActive: true },
  { id: 'rec-4', title: 'Gym & Club membership', amount: 45.00, type: 'expense', category: 'Health', accountId: 'acc-main', frequency: 'monthly', nextDate: '2026-10-15', startDate: '2026-09-15', dayOfMonth: 15, isActive: true },
];

export const DEFAULT_QUICK_TAGS = [
  'for fam dinner',
  'Dinner for fam',
  'Malaysia spenditure',
  'JB food',
  'yakiniku',
  'Didi birthday cake',
  'premium soup',
  'pizza',
  'Liquor',
  'tori q',
  'Grab ride',
  'FairPrice groceries',
  'Kopi & toast',
  'Gas petrol',
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // 2026-09-19
  { id: 'tx-1', type: 'expense', amount: 34.44, category: 'Food', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-19', memo: 'Dinner for fam', createdAt: 1789800000000 },
  { id: 'tx-2', type: 'expense', amount: 18.20, category: 'Food', accountId: 'acc-overseas', date: '2026-09-19', memo: 'Malaysia spenditure', createdAt: 1789799000000 },
  { id: 'tx-3', type: 'expense', amount: 12.50, category: 'Food', accountId: 'acc-overseas', date: '2026-09-19', memo: 'JB food', createdAt: 1789798000000 },
  
  // 2026-09-18
  { id: 'tx-4', type: 'expense', amount: 45.80, category: 'Food', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-18', memo: 'yakiniku', createdAt: 1789700000000 },
  { id: 'tx-5', type: 'expense', amount: 8.90, category: 'Food', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-18', memo: 'tori q', createdAt: 1789699000000 },
  { id: 'tx-6', type: 'expense', amount: 62.30, category: 'Groceries', accountId: 'acc-main', cardId: 'card-citi', date: '2026-09-18', memo: 'FairPrice groceries', createdAt: 1789698000000 },
  
  // 2026-09-15
  { id: 'tx-7', type: 'expense', amount: 198.44, category: 'Entertainment', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-15', memo: 'Didi birthday party', createdAt: 1789400000000 },
  { id: 'tx-8', type: 'expense', amount: 3.20, category: 'Transportation', accountId: 'acc-main', cardId: 'card-citi', date: '2026-09-15', memo: 'MRT transport', createdAt: 1789399000000 },
  { id: 'tx-9', type: 'expense', amount: 14.50, category: 'Food', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-15', memo: 'premium soup', createdAt: 1789398000000 },

  // 2026-09-12
  { id: 'tx-10', type: 'expense', amount: 28.00, category: 'Food', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-12', memo: 'pizza', createdAt: 1789100000000 },
  { id: 'tx-11', type: 'expense', amount: 42.00, category: 'Entertainment', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-12', memo: 'Liquor', createdAt: 1789099000000 },
  { id: 'tx-12', type: 'expense', amount: 115.40, category: 'Utilities', accountId: 'acc-main', cardId: 'card-citi', date: '2026-09-12', memo: 'SP Services Utilities', createdAt: 1789098000000 },

  // 2026-09-08
  { id: 'tx-13', type: 'expense', amount: 48.00, category: 'Food', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-08', memo: 'for fam dinner', createdAt: 1788750000000 },
  { id: 'tx-14', type: 'expense', amount: 16.50, category: 'Transportation', accountId: 'acc-main', cardId: 'card-citi', date: '2026-09-08', memo: 'Grab ride', createdAt: 1788749000000 },

  // 2026-09-05
  { id: 'tx-15', type: 'expense', amount: 29.90, category: 'Clothing', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-05', memo: 'Uniqlo T-shirt', createdAt: 1788500000000 },
  { id: 'tx-16', type: 'expense', amount: 10.32, category: 'Health', accountId: 'acc-main', cardId: 'card-dbs', date: '2026-09-05', memo: 'Pharmacy vitamins', createdAt: 1788499000000 },

  // 2026-09-01
  { id: 'tx-17', type: 'income', amount: 1185.00, category: 'Salary', accountId: 'acc-main', date: '2026-09-01', memo: 'Monthly Salary', createdAt: 1788100000000 },
  { id: 'tx-18', type: 'expense', amount: 100.00, category: 'Housing', accountId: 'acc-main', date: '2026-09-01', memo: 'House maintenance', createdAt: 1788099000000 },

  // Prior months in 2026 for rich analytics bar charts
  // Jan 2026
  { id: 'tx-jan-inc', type: 'income', amount: 2400.00, category: 'Salary', accountId: 'acc-main', date: '2026-01-01', memo: 'Salary Jan', createdAt: 1767225600000 },
  { id: 'tx-jan-1', type: 'expense', amount: 1332.17, category: 'Food', accountId: 'acc-main', date: '2026-01-15', memo: 'Jan expenses', createdAt: 1768435200000 },

  // Feb 2026
  { id: 'tx-feb-inc', type: 'income', amount: 2400.00, category: 'Salary', accountId: 'acc-main', date: '2026-02-01', memo: 'Salary Feb', createdAt: 1769904000000 },
  { id: 'tx-feb-1', type: 'expense', amount: 1641.07, category: 'Entertainment', accountId: 'acc-main', date: '2026-02-14', memo: 'Feb expenses & CNY', createdAt: 1771027200000 },

  // Mar 2026
  { id: 'tx-mar-inc', type: 'income', amount: 2400.00, category: 'Salary', accountId: 'acc-main', date: '2026-03-01', memo: 'Salary Mar', createdAt: 1772323200000 },
  { id: 'tx-mar-1', type: 'expense', amount: 1120.50, category: 'Groceries', accountId: 'acc-main', date: '2026-03-20', memo: 'Mar living expenses', createdAt: 1773964800000 },

  // Apr 2026
  { id: 'tx-apr-inc', type: 'income', amount: 2400.00, category: 'Salary', accountId: 'acc-main', date: '2026-04-01', memo: 'Salary Apr', createdAt: 1775001600000 },
  { id: 'tx-apr-1', type: 'expense', amount: 980.20, category: 'Housing', accountId: 'acc-main', date: '2026-04-10', memo: 'Apr bills', createdAt: 1775779200000 },

  // May 2026
  { id: 'tx-may-inc', type: 'income', amount: 2400.00, category: 'Salary', accountId: 'acc-main', date: '2026-05-01', memo: 'Salary May', createdAt: 1777593600000 },
  { id: 'tx-may-1', type: 'expense', amount: 1450.00, category: 'Food', accountId: 'acc-main', date: '2026-05-22', memo: 'May food & outings', createdAt: 1779408000000 },

  // Jun 2026
  { id: 'tx-jun-inc', type: 'income', amount: 2600.00, category: 'Salary', accountId: 'acc-main', date: '2026-06-01', memo: 'Salary Jun + bonus', createdAt: 1780272000000 },
  { id: 'tx-jun-1', type: 'expense', amount: 1280.90, category: 'Clothing', accountId: 'acc-main', date: '2026-06-18', memo: 'Jun shopping & mid-year', createdAt: 1781740800000 },

  // Jul 2026
  { id: 'tx-jul-inc', type: 'income', amount: 2400.00, category: 'Salary', accountId: 'acc-main', date: '2026-07-01', memo: 'Salary Jul', createdAt: 1782864000000 },
  { id: 'tx-jul-1', type: 'expense', amount: 1510.40, category: 'Entertainment', accountId: 'acc-main', date: '2026-07-25', memo: 'Jul travel & dining', createdAt: 1784937600000 },

  // Aug 2026
  { id: 'tx-aug-inc', type: 'income', amount: 2400.00, category: 'Salary', accountId: 'acc-main', date: '2026-08-01', memo: 'Salary Aug', createdAt: 1785542400000 },
  { id: 'tx-aug-1', type: 'expense', amount: 1390.00, category: 'Utilities', accountId: 'acc-main', date: '2026-08-16', memo: 'Aug living expenses', createdAt: 1786838400000 },
];

const STORAGE_KEY = 'miimoo_budget_data_v1';

interface BudgetState {
  transactions: Transaction[];
  accounts: Account[];
  cards: CreditCard[];
  categories: CategoryItem[];
  recurring: RecurringRule[];
  quickTags: string[];
  isBalanceHidden: boolean;
  selectedAccountId: string; // 'all' or specific account id
  userName: string;
}

interface BudgetContextType extends BudgetState {
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (acc: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, acc: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferMoney: (fromId: string, toId: string, amount: number, memo?: string, date?: string) => void;
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCard: (id: string) => void;
  setDefaultCard: (id: string) => void;
  addRecurringRule: (rule: Omit<RecurringRule, 'id'>) => void;
  updateRecurringRule: (id: string, rule: Partial<RecurringRule>) => void;
  toggleRecurringRule: (id: string) => void;
  deleteRecurringRule: (id: string) => void;
  addCategory: (cat: Omit<CategoryItem, 'id'>) => void;
  toggleBalanceHidden: () => void;
  setSelectedAccountId: (id: string) => void;
  setUserName: (name: string) => void;
  exportJSON: () => void;
  exportCSV: () => void;
  importJSON: (jsonData: string) => boolean;
  resetToSampleData: () => void;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [userName, setUserName] = useState('Darryl');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('acc-main');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [cards, setCards] = useState<CreditCard[]>(DEFAULT_CARDS);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [recurring, setRecurring] = useState<RecurringRule[]>(DEFAULT_RECURRING);
  const [quickTags, setQuickTags] = useState<string[]>(DEFAULT_QUICK_TAGS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.cards && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
          setCards(parsed.cards);
        } else {
          setCards(DEFAULT_CARDS);
        }
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.recurring) setRecurring(parsed.recurring);
        if (parsed.quickTags) setQuickTags(parsed.quickTags);
        if (parsed.userName) setUserName(parsed.userName);
        if (typeof parsed.isBalanceHidden === 'boolean') setIsBalanceHidden(parsed.isBalanceHidden);
        if (parsed.selectedAccountId) setSelectedAccountId(parsed.selectedAccountId);
      }
    } catch (e) {
      console.error('Error loading budget data from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const dataToSave: BudgetState = {
        transactions,
        accounts,
        cards,
        categories,
        recurring,
        quickTags,
        isBalanceHidden,
        selectedAccountId,
        userName,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Error saving budget data to localStorage:', e);
    }
  }, [isLoaded, transactions, accounts, categories, recurring, quickTags, isBalanceHidden, selectedAccountId, userName]);

  const addTransaction = useCallback((txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const id = 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newTx: Transaction = {
      ...txData,
      id,
      createdAt: Date.now(),
    };

    setTransactions(prev => [newTx, ...prev]);

    // Update account balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === txData.accountId) {
        const diff = txData.type === 'income' ? txData.amount : -txData.amount;
        return { ...acc, balance: Math.round((acc.balance + diff) * 100) / 100 };
      }
      return acc;
    }));

    // If memo exists and is not already in quick tags, add it
    if (txData.memo && txData.memo.trim().length > 1) {
      const cleanMemo = txData.memo.trim();
      setQuickTags(prev => {
        if (prev.includes(cleanMemo)) return prev;
        return [cleanMemo, ...prev].slice(0, 30);
      });
    }
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id !== id) return tx;
      return { ...tx, ...updates };
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const target = prev.find(t => t.id === id);
      if (target) {
        // Reverse account balance effect
        setAccounts(accs => accs.map(acc => {
          if (acc.id === target.accountId) {
            const rev = target.type === 'income' ? -target.amount : target.amount;
            return { ...acc, balance: Math.round((acc.balance + rev) * 100) / 100 };
          }
          return acc;
        }));
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const addAccount = useCallback((accData: Omit<Account, 'id'>) => {
    const id = 'acc-' + Date.now();
    const newAcc: Account = { ...accData, id };
    setAccounts(prev => [...prev, newAcc]);
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }, []);

  const transferMoney = useCallback((fromId: string, toId: string, amount: number, memo?: string, date?: string) => {
    const txDate = date || new Date().toISOString().split('T')[0];
    const toAcc = accounts.find(a => a.id === toId);

    const fromTx: Transaction = {
      id: 'tx-tr-out-' + Date.now(),
      type: 'transfer',
      amount: amount,
      category: 'Transfer',
      accountId: fromId,
      toAccountId: toId,
      date: txDate,
      memo: memo || `Transfer to ${toAcc?.name || 'Account'}`,
      createdAt: Date.now(),
    };

    setTransactions(prev => [fromTx, ...prev]);

    setAccounts(prev => prev.map(acc => {
      if (acc.id === fromId) return { ...acc, balance: Math.round((acc.balance - amount) * 100) / 100 };
      if (acc.id === toId) return { ...acc, balance: Math.round((acc.balance + amount) * 100) / 100 };
      return acc;
    }));
  }, [accounts]);

  const addRecurringRule = useCallback((rule: Omit<RecurringRule, 'id'>) => {
    const id = 'rec-' + Date.now();
    setRecurring(prev => [...prev, { ...rule, id }]);
  }, []);

  const updateRecurringRule = useCallback((id: string, updates: Partial<RecurringRule>) => {
    setRecurring(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const toggleRecurringRule = useCallback((id: string) => {
    setRecurring(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }, []);

  const deleteRecurringRule = useCallback((id: string) => {
    setRecurring(prev => prev.filter(r => r.id !== id));
  }, []);

  const addCard = useCallback((cardData: Omit<CreditCard, 'id'>) => {
    const id = 'card-' + Date.now();
    setCards(prev => {
      if (cardData.isDefault || prev.length === 0) {
        return [...prev.map(c => ({ ...c, isDefault: false })), { ...cardData, isDefault: true, id }];
      }
      return [...prev, { ...cardData, id }];
    });
  }, []);

  const updateCard = useCallback((id: string, updates: Partial<CreditCard>) => {
    setCards(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, ...updates };
      }
      if (updates.isDefault) {
        return { ...c, isDefault: false };
      }
      return c;
    }));
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards(prev => {
      const filtered = prev.filter(c => c.id !== id);
      const deletedWasDefault = prev.find(c => c.id === id)?.isDefault;
      if (deletedWasDefault && filtered.length > 0) {
        filtered[0] = { ...filtered[0], isDefault: true };
      }
      return filtered;
    });
  }, []);

  const setDefaultCard = useCallback((id: string) => {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
  }, []);

  const addCategory = useCallback((cat: Omit<CategoryItem, 'id'>) => {
    const id = 'cat-' + Date.now();
    setCategories(prev => [...prev, { ...cat, id }]);
  }, []);

  const toggleBalanceHidden = useCallback(() => {
    setIsBalanceHidden(prev => !prev);
  }, []);

  const exportJSON = useCallback(() => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      userName,
      accounts,
      cards,
      transactions,
      categories,
      recurring,
      quickTags,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `miimoo-budget-backup-${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [userName, accounts, cards, transactions, categories, recurring, quickTags]);

  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Category', 'Account', 'Card', 'Memo'];
    const rows = transactions.map(t => {
      const acc = accounts.find(a => a.id === t.accountId);
      const crd = cards.find(c => c.id === t.cardId);
      return [
        t.id,
        t.date,
        t.type,
        t.amount.toFixed(2),
        `"${t.category.replace(/"/g, '""')}"`,
        `"${(acc?.name || t.accountId).replace(/"/g, '""')}"`,
        `"${(crd?.name || '').replace(/"/g, '""')}"`,
        `"${(t.memo || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `miimoo-transactions-${timestamp}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [transactions, accounts, cards]);

  const importJSON = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
      if (Array.isArray(parsed.accounts)) setAccounts(parsed.accounts);
      if (Array.isArray(parsed.cards)) setCards(parsed.cards);
      if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
      if (Array.isArray(parsed.recurring)) setRecurring(parsed.recurring);
      if (Array.isArray(parsed.quickTags)) setQuickTags(parsed.quickTags);
      if (parsed.userName) setUserName(parsed.userName);
      return true;
    } catch (e) {
      console.error('Failed to import JSON data:', e);
      return false;
    }
  }, []);

  const resetToSampleData = useCallback(() => {
    setTransactions(INITIAL_TRANSACTIONS);
    setAccounts(DEFAULT_ACCOUNTS);
    setCards(DEFAULT_CARDS);
    setCategories(DEFAULT_CATEGORIES);
    setRecurring(DEFAULT_RECURRING);
    setQuickTags(DEFAULT_QUICK_TAGS);
    setUserName('Darryl');
    setIsBalanceHidden(false);
    setSelectedAccountId('acc-main');
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: BudgetContextType = {
    transactions,
    accounts,
    cards,
    categories,
    recurring,
    quickTags,
    isBalanceHidden,
    selectedAccountId,
    userName,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    transferMoney,
    addCard,
    updateCard,
    deleteCard,
    setDefaultCard,
    addRecurringRule,
    updateRecurringRule,
    toggleRecurringRule,
    deleteRecurringRule,
    addCategory,
    toggleBalanceHidden,
    setSelectedAccountId,
    setUserName,
    exportJSON,
    exportCSV,
    importJSON,
    resetToSampleData,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return ctx;
}
