# CampusShopper 🛍️

**Smart Shopping & Budgeting Assistant for South African University Students**

Built for UKZN students in Durban — compare products from 5 local vendors, track your NSFAS budget, and get AI-powered personalised recommendations.

---

## Features

- 🔍 **AI Search** — Powered by Gemini: type naturally like *"affordable winter jacket under R500, dark colours"*
- 💰 **Budget Tracker** — Set your monthly allowance, track spending, get warnings before overspending
- ⭐ **Smart Recommendations** — Weighted scoring based on your preferences, purchase history & distance
- 🗂️ **Filter & Sort** — Price, colour, size, shipping cost, vendor, distance from your suburb
- ❤️ **Favourites** — Save products for later
- 📊 **Dashboard** — Spending by category chart, recent searches, recommended items
- 🏪 **5 Durban Vendors** — FreshKart, CampusBooks, UrbanThreads, TechNest, PharmaPlus
- 📱 **Mobile-First** — Designed for phone use

---

## Prerequisites

- Node.js 18+ (installed automatically if missing)
- A Supabase project (credentials already configured)

---

## Setup & Run

### 1. Clone / open the project

```bash
cd campus-shopper
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

1. Open your [Supabase dashboard](https://czzlkgnekogmltbhzhvq.supabase.co)
2. Go to **SQL Editor**
3. Paste and run the contents of `supabase/schema.sql`
4. Then seed the data:

```bash
npm run seed
```

> The seed script inserts 5 vendors and ~65 products across Durban.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## Environment Variables

Already configured in `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `GEMINI_API_KEY` | Google Gemini API (NL query parsing) |
| `SEARCH_API_KEY` | Additional search API key |

---

## App Structure

```
src/
  app/
    auth/login          — Login page
    auth/signup         — Signup (student number + email + password)
    onboarding          — 3-step setup wizard
    (app)/
      dashboard         — Main dashboard
      search            — AI-powered product search
      favourites        — Saved items
      history           — Purchase history
      preferences       — Profile & settings
  components/
    layout/AppNav       — Bottom navigation
    budget/BudgetBanner — Sticky budget progress bar
    product/ProductCard — Product display card
    search/FilterPanel  — Slide-in filter/sort panel
  lib/
    supabase/           — Browser + server Supabase clients
    recommendation.ts   — Weighted scoring algorithm
    nlParser.ts         — NL query → structured filters
    distance.ts         — Haversine distance calculation
    utils.ts            — Shared utilities
  types/index.ts        — TypeScript types + constants
```

---

## Vendors (Durban)

| Vendor | Category | Suburb | Coords |
|---|---|---|---|
| FreshKart | Groceries | Westville | -29.8308, 30.9343 |
| CampusBooks | Books & Stationery | Glenwood | -29.8650, 30.9822 |
| UrbanThreads | Clothing | Musgrave | -29.8557, 30.9845 |
| TechNest | Electronics & Data | Umhlanga | -29.7300, 31.0784 |
| PharmaPlus | Toiletries & Health | Pinetown | -29.8175, 30.8561 |

---

## Recommendation Algorithm

Each product is scored 0–1 using weighted factors:

| Factor | Weight | Logic |
|---|---|---|
| Budget fit | 30% | 1.0 if price ≤ remaining budget |
| Preference match | 20% | Colour / size / vendor match rate |
| Category affinity | 20% | Based on purchase history frequency |
| Rating | 15% | Normalised product rating (1–5 → 0–1) |
| Distance | 10% | 1 − (dist / max_dist) |
| Shipping penalty | 5% | Penalises high shipping costs |

---

## Resetting the Database

To clear all products/vendors and re-seed:

```bash
npm run seed
```

To reset user data (purchases, favourites, searches) use the Supabase Dashboard → Table Editor.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v3 + shadcn/ui components |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Google Gemini 1.5 Flash |
| Charts | Recharts |
| Icons | Lucide React |
