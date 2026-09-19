export interface MockUserProfile {
  name: string;
  email: string;
  currency: string;
  hiddenBalance: boolean;
}

export interface MockAccount {
  _id: string;
  name: string;
  type: "local" | "overseas";
  currency: string;
  balance: number;
  isArchived: boolean;
}

export interface MockCategory {
  _id: string;
  name: string;
  type: "expense" | "income";
  icon: string;
  color: string;
  isCustom: boolean;
}

export interface MockTransaction {
  _id: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  date: number;
  memo?: string;
}

export interface MockRecurringRule {
  _id: string;
  title: string;
  amount: number;
  type: "expense" | "income";
  frequency: "daily" | "weekly" | "monthly";
  accountId: string;
  categoryId?: string;
  nextRun: number;
  isActive: boolean;
}

export const INITIAL_USER_PROFILE: MockUserProfile = {
  name: "Darryl",
  email: "darryl@miimoo.local",
  currency: "SGD",
  hiddenBalance: false,
};

export const INITIAL_ACCOUNTS: MockAccount[] = [
  {
    _id: "acc_main_local",
    name: "Main Account (Local)",
    type: "local",
    currency: "SGD",
    balance: 12450.00,
    isArchived: false,
  },
  {
    _id: "acc_overseas_card",
    name: "Overseas Card",
    type: "overseas",
    currency: "SGD",
    balance: 1500.00,
    isArchived: false,
  },
];

export const INITIAL_CATEGORIES: MockCategory[] = [
  { _id: "cat_food", name: "Food", type: "expense", icon: "Utensils", color: "#F97316", isCustom: false },
  { _id: "cat_groceries", name: "Groceries", type: "expense", icon: "ShoppingCart", color: "#10B981", isCustom: false },
  { _id: "cat_utilities", name: "Utilities", type: "expense", icon: "Zap", color: "#EAB308", isCustom: false },
  { _id: "cat_entertainment", name: "Entertainment", type: "expense", icon: "Film", color: "#8B5CF6", isCustom: false },
  { _id: "cat_housing", name: "Housing", type: "expense", icon: "Home", color: "#3B82F6", isCustom: false },
  { _id: "cat_health", name: "Health", type: "expense", icon: "HeartPulse", color: "#EF4444", isCustom: false },
  { _id: "cat_transportation", name: "Transportation", type: "expense", icon: "Car", color: "#06B6D4", isCustom: false },
  { _id: "cat_clothing", name: "Clothing", type: "expense", icon: "Shirt", color: "#EC4899", isCustom: false },
  { _id: "cat_education", name: "Education", type: "expense", icon: "GraduationCap", color: "#6366F1", isCustom: false },
  { _id: "cat_insurance", name: "Insurance", type: "expense", icon: "ShieldCheck", color: "#14B8A6", isCustom: false },
  { _id: "cat_shopping", name: "Shopping", type: "expense", icon: "ShoppingBag", color: "#F43F5E", isCustom: false },
  // Income
  { _id: "cat_salary", name: "Salary", type: "income", icon: "Briefcase", color: "#22C55E", isCustom: false },
  { _id: "cat_investment", name: "Investment", type: "income", icon: "TrendingUp", color: "#0EA5E9", isCustom: false },
  { _id: "cat_gift", name: "Bonus / Gift", type: "income", icon: "Gift", color: "#A855F7", isCustom: false },
  { _id: "cat_other_income", name: "Other Income", type: "income", icon: "Wallet", color: "#64748B", isCustom: false },
];

export const INITIAL_MEMO_TAGS = [
  "for fam dinner",
  "Dinner for fam",
  "Malaysia spenditure",
  "JB food",
  "yakiniku",
  "Didi birthday cake",
  "premium soup",
  "pizza",
  "Liquor",
  "tori q",
];

export const INITIAL_RECURRING_RULES: MockRecurringRule[] = [
  {
    _id: "rec_salary",
    title: "Monthly Salary",
    amount: 1185.00,
    type: "income",
    frequency: "monthly",
    accountId: "acc_main_local",
    categoryId: "cat_salary",
    nextRun: new Date(2026, 9, 1, 9, 0, 0).getTime(),
    isActive: true,
  },
  {
    _id: "rec_housing",
    title: "House maintenance",
    amount: 180.00,
    type: "expense",
    frequency: "monthly",
    accountId: "acc_main_local",
    categoryId: "cat_housing",
    nextRun: new Date(2026, 9, 1, 9, 0, 0).getTime(),
    isActive: true,
  },
  {
    _id: "rec_utilities",
    title: "SP Services Utilities",
    amount: 115.40,
    type: "expense",
    frequency: "monthly",
    accountId: "acc_main_local",
    categoryId: "cat_utilities",
    nextRun: new Date(2026, 9, 12, 9, 0, 0).getTime(),
    isActive: true,
  },
  {
    _id: "rec_health",
    title: "Gym & Club membership",
    amount: 45.00,
    type: "expense",
    frequency: "monthly",
    accountId: "acc_main_local",
    categoryId: "cat_health",
    nextRun: new Date(2026, 9, 15, 9, 0, 0).getTime(),
    isActive: true,
  },
];

export const INITIAL_TRANSACTIONS: MockTransaction[] = [
  // Sep 2026 transactions matching screenshots
  {
    _id: "tx_sep_income",
    type: "income",
    amount: 1185.00,
    accountId: "acc_main_local",
    categoryId: "cat_salary",
    date: new Date(2026, 8, 1, 10, 0, 0).getTime(),
    memo: "Monthly Salary",
  },
  {
    _id: "tx_sep_rent",
    type: "expense",
    amount: 550.00,
    accountId: "acc_main_local",
    categoryId: "cat_housing",
    date: new Date(2026, 8, 2, 11, 0, 0).getTime(),
    memo: "House maintenance & room rent",
  },
  {
    _id: "tx_sep_sp",
    type: "expense",
    amount: 185.00,
    accountId: "acc_main_local",
    categoryId: "cat_utilities",
    date: new Date(2026, 8, 5, 14, 0, 0).getTime(),
    memo: "SP Services electricity and water",
  },
  {
    _id: "tx_sep_fairprice",
    type: "expense",
    amount: 143.93,
    accountId: "acc_main_local",
    categoryId: "cat_groceries",
    date: new Date(2026, 8, 8, 16, 30, 0).getTime(),
    memo: "FairPrice monthly staples",
  },
  // Sat, 12/09: -$18.75
  {
    _id: "tx_sep_12",
    type: "expense",
    amount: 18.75,
    accountId: "acc_main_local",
    categoryId: "cat_food",
    date: new Date(2026, 8, 12, 19, 30, 0).getTime(),
    memo: "pizza",
  },
  // Sun, 13/09: -$56.80
  {
    _id: "tx_sep_13",
    type: "expense",
    amount: 56.80,
    accountId: "acc_overseas_card",
    categoryId: "cat_food",
    date: new Date(2026, 8, 13, 13, 15, 0).getTime(),
    memo: "JB food",
  },
  // Mon, 14/09: -$7.30
  {
    _id: "tx_sep_14",
    type: "expense",
    amount: 7.30,
    accountId: "acc_main_local",
    categoryId: "cat_transportation",
    date: new Date(2026, 8, 14, 8, 45, 0).getTime(),
    memo: "MRT transport",
  },
  // Tue, 15/09: -$12.65
  {
    _id: "tx_sep_15",
    type: "expense",
    amount: 12.65,
    accountId: "acc_main_local",
    categoryId: "cat_food",
    date: new Date(2026, 8, 15, 12, 30, 0).getTime(),
    memo: "tori q",
  },
  // Fri, 18/09: Shopping -$9.27, Food -$34.44, Food -$23.11 (total -$66.82)
  {
    _id: "tx_sep_18_1",
    type: "expense",
    amount: 9.27,
    accountId: "acc_main_local",
    categoryId: "cat_shopping",
    date: new Date(2026, 8, 18, 15, 10, 0).getTime(),
    memo: "Daiso stationery",
  },
  {
    _id: "tx_sep_18_2",
    type: "expense",
    amount: 34.44,
    accountId: "acc_main_local",
    categoryId: "cat_food",
    date: new Date(2026, 8, 18, 18, 45, 0).getTime(),
    memo: "Dinner for fam",
  },
  {
    _id: "tx_sep_18_3",
    type: "expense",
    amount: 23.11,
    accountId: "acc_main_local",
    categoryId: "cat_food",
    date: new Date(2026, 8, 18, 21, 20, 0).getTime(),
    memo: "premium soup",
  },
  // Sat, 19/09: -$101.26
  {
    _id: "tx_sep_19",
    type: "expense",
    amount: 101.26,
    accountId: "acc_main_local",
    categoryId: "cat_food",
    date: new Date(2026, 8, 19, 12, 30, 0).getTime(),
    memo: "for fam dinner yakiniku",
  },
  // Jan - Aug Historical for 2026 Analytics ($12,398.65 total, ~$1,377.63 avg)
  { _id: "tx_jan_exp", type: "expense", amount: 1332.17, accountId: "acc_main_local", categoryId: "cat_food", date: new Date(2026, 0, 15).getTime(), memo: "Jan expenditures" },
  { _id: "tx_jan_inc", type: "income", amount: 1185.00, accountId: "acc_main_local", categoryId: "cat_salary", date: new Date(2026, 0, 1).getTime(), memo: "Salary" },
  { _id: "tx_feb_exp", type: "expense", amount: 1641.07, accountId: "acc_main_local", categoryId: "cat_shopping", date: new Date(2026, 1, 15).getTime(), memo: "Feb expenditures & CNY" },
  { _id: "tx_feb_inc", type: "income", amount: 1685.00, accountId: "acc_main_local", categoryId: "cat_salary", date: new Date(2026, 1, 1).getTime(), memo: "Salary + Bonus" },
  { _id: "tx_mar_exp", type: "expense", amount: 1420.50, accountId: "acc_main_local", categoryId: "cat_groceries", date: new Date(2026, 2, 15).getTime(), memo: "Mar expenditures" },
  { _id: "tx_mar_inc", type: "income", amount: 1185.00, accountId: "acc_main_local", categoryId: "cat_salary", date: new Date(2026, 2, 1).getTime(), memo: "Salary" },
  { _id: "tx_apr_exp", type: "expense", amount: 1280.90, accountId: "acc_main_local", categoryId: "cat_utilities", date: new Date(2026, 3, 15).getTime(), memo: "Apr expenditures" },
  { _id: "tx_apr_inc", type: "income", amount: 1185.00, accountId: "acc_main_local", categoryId: "cat_salary", date: new Date(2026, 3, 1).getTime(), memo: "Salary" },
  { _id: "tx_may_exp", type: "expense", amount: 1510.40, accountId: "acc_main_local", categoryId: "cat_entertainment", date: new Date(2026, 4, 15).getTime(), memo: "May expenditures" },
  { _id: "tx_may_inc", type: "income", amount: 1185.00, accountId: "acc_main_local", categoryId: "cat_salary", date: new Date(2026, 4, 1).getTime(), memo: "Salary" },
  { _id: "tx_jun_exp", type: "expense", amount: 1395.20, accountId: "acc_main_local", categoryId: "cat_housing", date: new Date(2026, 5, 15).getTime(), memo: "Jun expenditures" },
  { _id: "tx_jun_inc", type: "income", amount: 1185.00, accountId: "acc_main_local", categoryId: "cat_salary", date: new Date(2026, 5, 1).getTime(), memo: "Salary" },
  { _id: "tx_jul_exp", type: "expense", amount: 1460.10, accountId: "acc_overseas_card", categoryId: "cat_food", date: new Date(2026, 6, 15).getTime(), memo: "Jul expenditures" },
  { _id: "tx_jul_inc", type: "income", amount: 1185.00, accountId: "acc_main_local", categoryId: "cat_salary", date: new Date(2026, 6, 1).getTime(), memo: "Salary" },
  { _id: "tx_aug_exp", type: "expense", amount: 1215.80, accountId: "acc_main_local", categoryId: "cat_health", date: new Date(2026, 7, 15).getTime(), memo: "Aug expenditures" },
  { _id: "tx_aug_inc", type: "income", amount: 1185.00, accountId: "acc_main_local", categoryId: "cat_salary", date: new Date(2026, 7, 1).getTime(), memo: "Salary" },
];
