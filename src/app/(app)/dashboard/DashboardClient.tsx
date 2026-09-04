'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Profile, Preferences, Purchase, SearchRecord, Product } from '@/types';
import { formatZAR, formatDate, getBudgetPercentage, getBudgetStatus, formatOrdinalDay } from '@/lib/utils';
import { haversineKm } from '@/lib/distance';
import { rankProducts } from '@/lib/recommendation';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import {
  Wallet, TrendingUp, Clock, Heart, ShoppingBag,
  ArrowRight, Sparkles, Star, MapPin, Loader2, Search,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import { getOrCreateUserId } from '@/lib/userSession';

const CHART_COLOURS = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4'];

interface DashboardClientProps {
  profile?: any;
  preferences?: Preferences | null;
  purchases?: Purchase[];
  monthPurchases?: Purchase[];
  favourites?: any[];
  recentSearches?: SearchRecord[];
  allProducts?: Product[];
  spent?: number;
  totalBudget?: number;
  remaining?: number;
  categorySpend?: Record<string, number>;
}

export default function DashboardClient(props: DashboardClientProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: props.profile || { display_name: 'DUT Student', university: 'Durban University of Technology', suburb: 'Glenwood', monthly_budget_zar: 1500, budget_reset_day: 1 },
    preferences: props.preferences || null,
    purchases: props.purchases || [],
    monthPurchases: props.monthPurchases || [],
    favourites: props.favourites || [],
    recentSearches: props.recentSearches || [],
    allProducts: props.allProducts || [],
    spent: props.spent || 0,
    totalBudget: props.totalBudget || 1500,
    remaining: props.remaining || 1500,
    categorySpend: props.categorySpend || {},
    purchasesCount: props.purchases?.length || 0,
    savedCount: props.favourites?.length || 0,
    searchesCount: props.recentSearches?.length || 0,
  });

  useEffect(() => {
    loadLiveDashboard();

    const handleBudgetUpdate = () => loadLiveDashboard();
    window.addEventListener('campus_shopper_budget_updated', handleBudgetUpdate);
    return () => {
      window.removeEventListener('campus_shopper_budget_updated', handleBudgetUpdate);
    };
  }, []);

  async function loadLiveDashboard() {
    try {
      const userId = await getOrCreateUserId();
      const res = await fetch(`/api/dashboard?userId=${userId}`);
      if (res.ok) {
        const live = await res.json();
        setData((prev) => ({
          ...prev,
          profile: live.profile || prev.profile,
          preferences: live.preferences || prev.preferences,
          purchases: live.purchases || [],
          monthPurchases: live.monthPurchases || [],
          favourites: live.favourites || [],
          recentSearches: live.recentSearches || [],
          allProducts: live.allProducts?.length > 0 ? live.allProducts : prev.allProducts,
          spent: live.spent || 0,
          totalBudget: live.totalBudget || 1500,
          remaining: live.remaining !== undefined ? live.remaining : 1500,
          categorySpend: live.categorySpend || {},
          purchasesCount: live.purchasesCount || 0,
          savedCount: live.savedCount || 0,
          searchesCount: live.searchesCount || 0,
        }));
      }
    } catch (err) {
      console.error('Error loading live dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const {
    profile, preferences, purchases, monthPurchases, favourites,
    recentSearches, allProducts, spent, totalBudget, remaining, categorySpend,
    purchasesCount, savedCount, searchesCount,
  } = data;

  const pct = getBudgetPercentage(spent, totalBudget);
  const status = getBudgetStatus(spent, totalBudget);

  // Generate recommended products using scoring
  const recommended = rankProducts(
    allProducts.map((p: any) => ({
      ...p,
      distance_km: profile?.lat && profile?.lng && p.vendor?.lat && p.vendor?.lng
        ? haversineKm(profile.lat, profile.lng, p.vendor.lat, p.vendor.lng)
        : undefined,
    })),
    {
      remainingBudget: remaining,
      preferences,
      purchases,
      studentLat: profile?.lat,
      studentLng: profile?.lng,
    }
  ).slice(0, 6);

  // Chart data
  const chartData = Object.entries(categorySpend).map(([cat, amount]) => ({
    name: CATEGORY_LABELS[cat] || cat,
    value: Number(Number(amount).toFixed(2)),
    icon: CATEGORY_ICONS[cat] || '📦',
  }));

  const displayName = profile?.display_name || 'DUT Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting}, <span className="gradient-text">{displayName.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {profile?.university || 'Durban University of Technology'} · {profile?.suburb || 'Glenwood'}
        </p>
      </div>

      {/* Budget Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Monthly Budget</p>
              <p className="text-xs text-muted-foreground">Resets on {formatOrdinalDay(profile?.budget_reset_day || 1)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              status === 'danger' ? 'text-red-400' :
              status === 'warning' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {formatZAR(remaining)}
            </p>
            <p className="text-xs text-muted-foreground">remaining of {formatZAR(totalBudget)}</p>
          </div>
        </div>

        <div className="h-2.5 bg-secondary rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              status === 'danger' ? 'budget-bar-danger' :
              status === 'warning' ? 'budget-bar-warning' :
              'budget-bar-safe'
            }`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Spent: {formatZAR(spent)}</span>
          <span>{pct.toFixed(0)}% used</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Purchases', value: purchasesCount, icon: ShoppingBag, colour: 'text-blue-400', bg: 'bg-blue-500/10', href: '/history' },
          { label: 'Saved items', value: savedCount, icon: Heart, colour: 'text-red-400', bg: 'bg-red-500/10', href: '/favourites' },
          { label: 'Searches', value: searchesCount, icon: TrendingUp, colour: 'text-purple-400', bg: 'bg-purple-500/10', href: '/search' },
        ].map(({ label, value, icon: Icon, colour, bg, href }) => (
          <Link key={label} href={href} className="glass-card p-4 text-center hover:scale-105 transition-all">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 ${colour}`} />
            </div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      {/* Spending Chart */}
      {chartData.length > 0 ? (
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-primary" />
            Spending by Category
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLOURS[index % CHART_COLOURS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatZAR(value), '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLOURS[i % CHART_COLOURS.length] }} />
                <span className="text-muted-foreground truncate">{d.icon} {d.name}</span>
                <span className="font-bold ml-auto">{formatZAR(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-center space-y-3">
          <div className="text-4xl">🛍️</div>
          <h3 className="font-bold text-base">Start Shopping & Compare Durban Deals</h3>
          <p className="text-xs text-muted-foreground">Search for groceries, textbooks, clothing and tech near Glenwood & Durban campus.</p>
          <Link href="/search" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-xs font-bold shadow-lg">
            <Search className="w-4 h-4" /> Search & Compare Now
          </Link>
        </div>
      )}

      {/* Recommended for You */}
      {recommended.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Recommended for You
            </h2>
            <Link href="/search" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommended.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                studentLat={profile?.lat}
                studentLng={profile?.lng}
                initialFav={favourites.some((f: any) => f.product_id === product.id)}
                remainingBudget={remaining}
                budgetStrictness={(preferences?.ai_survey_answers as any)?.budgetStrictness || 'Strict'}
                onBuy={() => loadLiveDashboard()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
