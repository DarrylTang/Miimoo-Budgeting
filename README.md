# 📱 Miimoo Budgeting

A private, mobile-first responsive web budgeting application built with Next.js, Tailwind CSS, and Convex, crafted specifically for single-user personal finance management.

---

## 🔒 Security & Access Gate

This application is hardened for production hosting on Vercel:
- **Master Passcode / PIN Gatekeeper**: All views and data are blocked behind a full-screen numeric PIN lock screen (`PinAuthModal`).
- **Perpetual Trusted Session**: Once you enter your PIN, the device stores a long-lived session cookie/token so you don't have to re-enter your PIN on every visit.
- **Manual Lock Anytime**: Tap **Lock App** inside the Sidebar Drawer to instantly re-lock the session.
- **Customizable PIN**: Set `NEXT_PUBLIC_MASTER_PIN` in Vercel Environment Variables, or change your Master PIN anytime via the drawer settings (**Security & Master PIN**).
- **Search Engine Blocking**: Includes `public/robots.txt` (`Disallow: /`) and `<meta name="robots" content="noindex, nofollow">` to prevent public search engines from indexing your financial records.
- **HTTP Security Headers**: Strict `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy` configured in `next.config.ts`.

---

## 🚀 Getting Started

### 1. Local Development
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The default Master PIN is `1234`.

### 2. Environment Variables (`.env.local`)
```env
# Custom Master PIN for production access (default is 1234 if unset)
NEXT_PUBLIC_MASTER_PIN=1234

# Convex Deployment URL (configured automatically on Vercel)
NEXT_PUBLIC_CONVEX_URL=https://<your-project>.convex.cloud
```

---

## ☁️ Deployment on Vercel

1. Push this repository to GitHub.
2. In your Vercel Dashboard, import the repository:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_MASTER_PIN`: Your desired 4–6 digit master PIN.
   - `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL (if using Convex backend).
4. Deploy! Vercel will automatically build and deploy the app. Future pushes to `main` trigger automated production builds.

---

## 💼 Core Features

- **Mobile-First Responsive UI**: Styled after modern iOS budgeting applications with curved wave header, pastel coral (`#F46C6C`) and mint (`#58B5A7`) accents, and haptic-feel interactions.
- **Credit Card Tracker**: Track multiple cards with EMV chip preview, cycle start days, cashback perk thresholds (Min Spend Requirement), and customizable monthly limits (supports typing `$0` for unlimited spending).
- **Multi-Month Global Search**: Instant search across all months, categories, credit cards, accounts, amounts (including operators like `>100`), and dates.
- **Built-in Keypad Calculator**: Quick calculations while entering transactions.
- **Data Center**: 1-click JSON backup, CSV export, restore backup, plus 1-tap "Load Demo Data" and "Clear Slate" buttons.
