# Implementation Plan: Analytics Page Fixes, Category Management Cleanup & New Entry Autofocus

## 1. Overview & Objectives

This document details the complete technical implementation plan to address the user requirements identified during the `/grill-me` design alignment session:

1. **Analytics Page Fixes & Enhancements**:
   - Streamline tabs from 4 to 3: `[Expense]`, `[Income]`, and `[Net Income]` (retiring the broken/redundant `Balance` tab).
   - Ensure 100% calculation accuracy across monthly aggregations, year-to-date totals, and monthly averages.
   - Accurately format currency amounts under each month with appropriate `-` and `+` sign indicators and color coding (`-$X.XX` in coral/red for expenses, `+$X.XX` in teal/green for income, and signed amounts for net income).
   - Resolve Net Income calculation bugs (eliminating absolute-value summing so that net gains and losses calculate correctly).
   - Render color-coded single bars in the Net Income chart (teal for positive net savings months, red for negative net savings months).
   - Adapt the category filter pills dynamically according to the active tab (expense categories on Expense tab, income categories on Income tab, and all/reset on Net Income).
   - Provide a comprehensive expanded month breakdown on the Net Income tab showing Total Income (`+`), Total Expense (`-`), followed by monthly category breakdowns.
2. **Category Management Cleanup**:
   - Remove the "Reset to Defaults" button and confirmation toast in `ManageCategoriesModal.tsx`.
3. **New Entry UX Enhancement**:
   - Add autofocus on the amount input field when `NewEntryModal` opens.

---

## 2. Affected Files

1. `src/components/AnalyticsView.tsx`
2. `src/components/ManageCategoriesModal.tsx`
3. `src/components/NewEntryModal.tsx`

---

## 3. Step-by-Step Implementation Details

### Step 1: Analytics Page (`src/components/AnalyticsView.tsx`)

#### A. Metric Tabs
- Change `type MetricType = 'Expense' | 'Income' | 'Net Income';` (remove `'Balance'`).
- Update segmented control tabs to `['Expense', 'Income', 'Net Income']`.

#### B. Data Aggregations & Month Computations
- Separate category tracking into `expenseCategories: Record<string, number>` and `incomeCategories: Record<string, number>` for each month, rather than commingling expense and income into one object.
- For each month \(i \in [0, 11]\):
  - `expense`: sum of all expense transactions in that month.
  - `income`: sum of all income transactions in that month.
  - `netIncome`: `income - expense`.
- Implement `getMonthValue(item)`:
  - If `Expense`: returns `item.expense` (positive magnitude).
  - If `Income`: returns `item.income` (positive magnitude).
  - If `Net Income`: returns `item.netIncome` (signed: can be positive or negative).

#### C. Totals & Averages Calculations
- **Expense tab**:
  - `totalValue = sum(item.expense)`
  - `avgValue = totalValue / (activeMonthCount || 12)`
  - `maxValue = Math.max(...allExpenses, 100)`
- **Income tab**:
  - `totalValue = sum(item.income)`
  - `avgValue = totalValue / (activeMonthCount || 12)`
  - `maxValue = Math.max(...allIncomes, 100)`
- **Net Income tab**:
  - `totalValue = sum(item.income) - sum(item.expense)` (true signed net income across the year).
  - `avgValue = totalValue / (activeMonthCount || 12)` (signed average monthly net income).
  - `maxValue = Math.max(...monthlyData.map(d => Math.abs(d.netIncome)), 100)` (for scaling bar heights).

#### D. Currency Formatting Helper
- Fix `formatCurrency` and create a signed formatting helper:
  - Base `formatCurrency(val)`: returns `$X.XX` or `$ •••••` if balance is hidden.
  - Signed helper `formatSignedCurrency(val, type)`:
    - If `type === 'Expense'`: `val === 0 ? '$0.00' : `-$${formatNumber(val)}`` with text color `#E53E3E`.
    - If `type === 'Income'`: `val === 0 ? '$0.00' : `+$${formatNumber(val)}`` with text color `#38A169`.
    - If `type === 'Net Income'`:
      - If `val >= 0`: `+$${formatNumber(val)}` with text color `#38A169` (or neutral `#2D3748` if zero).
      - If `val < 0`: `-$${formatNumber(Math.abs(val))}` with text color `#E53E3E`.

#### E. Chart Visualization
- Use dynamic bar colors matching the active tab:
  - **Expense**: Coral/red (`#FF7676`, selected `#F46C6C`).
  - **Income**: Teal/green (`#58B5A7`, selected `#38A169`).
  - **Net Income**: 
    - For months where `item.netIncome >= 0`: Teal/green (`#58B5A7`).
    - For months where `item.netIncome < 0`: Coral/red (`#FF7676`).
- Tooltip above selected bar:
  - Formatted with signed value (`+$X` or `-$X`).

#### F. Dynamic Category Filter Pills
- Update `filterCategories`:
  - When `metric === 'Expense'`: show `['All', ...expenseCategories]`.
  - When `metric === 'Income'`: show `['All', ...incomeCategories]`.
  - When `metric === 'Net Income'`: show `['All', ...allCategories]`.
- Auto-reset `selectedCategory` to `'All'` when switching tabs if the current selection does not exist in the new tab's categories.

#### G. Monthly Breakdown List & Expanded Accordion
- Display month total with signed prefix:
  - Expense: `-$X.XX` in red.
  - Income: `+$X.XX` in green.
  - Net Income: `+$X.XX` (green) or `-$X.XX` (red).
- Progress bar visually reflects the percentage of max month or total with matching metric colors.
- Expanded row details:
  - For `Expense` tab: list top expense categories with `-$X.XX`.
  - For `Income` tab: list top income categories with `+$X.XX`.
  - For `Net Income` tab:
    - Display summary row for **Total Income** (`+$X.XX`, green).
    - Display summary row for **Total Expenses** (`-$X.XX`, red).
    - Display top category contributions for that month.

---

### Step 2: Category Management Popup (`src/components/ManageCategoriesModal.tsx`)

1. Remove the `<RotateCcw className="w-4 h-4" />` button from the modal header.
2. Remove the `confirmReset` warning notification banner from the modal body.
3. Clean up the `confirmReset` state variable, `handleResetToDefaults` method, and the `RotateCcw` icon import.

---

### Step 3: New Entry Amount Autofocus (`src/components/NewEntryModal.tsx`)

1. Create a ref: `const amountInputRef = useRef<HTMLInputElement>(null);`
2. Attach `ref={amountInputRef}` and `autoFocus` to the amount input element:
   ```tsx
   <input
     ref={amountInputRef}
     autoFocus
     type="text"
     inputMode="decimal"
     ...
   />
   ```
3. In the modal open effect (`useEffect` triggered when `isOpen` becomes `true`), invoke `setTimeout(() => amountInputRef.current?.focus(), 50)` or `requestAnimationFrame` to ensure the input receives focus as soon as the modal mounts/slides in, supporting desktop and mobile environments.

---

## 4. Verification & Testing

1. **TypeScript & Build Validation**:
   - Run `npx tsc --noEmit` to ensure zero compilation or type errors.
2. **Visual & Behavioral Verification**:
   - **Analytics Tab Switching**: Check `[Expense]`, `[Income]`, `[Net Income]`. Verify the removal of the `Balance` tab.
   - **Calculation Accuracy**: Verify that adding an expense and an income in the same month correctly computes net income without absolute-value distortions.
   - **Sign & Color Accuracy**: Verify `-$` for expenses, `+$` for incomes, and signed indicators for net income.
   - **Category Management**: Open Category Management modal, confirm the reset button is completely gone, and that adding/editing categories continues to work smoothly.
   - **Autofocus**: Open New Entry modal, confirm the amount input is automatically focused and ready for immediate numeric input.
