'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatZAR, getBudgetPercentage, getBudgetStatus } from '@/lib/utils';
import { AlertTriangle, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getOrCreateUserId } from '@/lib/userSession';

interface BudgetBannerProps {
  spent?: number;
  total?: number;
}

export default function BudgetBanner({ spent: initialSpent = 0, total: initialTotal = 1500 }: BudgetBannerProps) {
  const [spent, setSpent] = useState<number>(initialSpent);
  const [total, setTotal] = useState<number>(initialTotal);
  const { openCart, cartCount } = useCart();

  const fetchLatestBudget = useCallback(async () => {
    try {
      const userId = await getOrCreateUserId();
      const res = await fetch(`/api/dashboard?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.totalBudget !== undefined) setTotal(Number(data.totalBudget));
        if (data.spent !== undefined) setSpent(Number(data.spent));
      }
    } catch (err) {
      console.warn('Error updating budget banner:', err);
    }
  }, []);

  useEffect(() => {
    fetchLatestBudget();

    const handleBudgetUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.newBudget) {
        setTotal(Number(customEvent.detail.newBudget));
      }
      fetchLatestBudget();
    };

    window.addEventListener('campus_shopper_budget_updated', handleBudgetUpdate);
    return () => {
      window.removeEventListener('campus_shopper_budget_updated', handleBudgetUpdate);
    };
  }, [fetchLatestBudget]);

  const remaining = total - spent;
  const pct = getBudgetPercentage(spent, total);
  const status = getBudgetStatus(spent, total);

  return (
    <div className="sticky top-0 z-40 px-4 py-2 glass-card border-b border-white/5 rounded-none">
      <div className="max-w-2xl mx-auto flex items-center gap-3 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {status === 'danger' && (
                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
              )}
              <span className="text-xs font-medium text-muted-foreground truncate">
                {status === 'danger' ? 'Budget low!' :
                 status === 'warning' ? 'Budget warning' :
                 'Monthly budget'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <span className={`font-bold ${
                status === 'danger' ? 'text-red-400' :
                status === 'warning' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {formatZAR(remaining)}
              </span>
              <span className="text-muted-foreground">/ {formatZAR(total)}</span>
            </div>
          </div>

          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'danger' ? 'budget-bar-danger' :
                status === 'warning' ? 'budget-bar-warning' :
                'budget-bar-safe'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Shopping Cart Button */}
        <button
          onClick={openCart}
          className="relative p-2 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary transition-all flex items-center justify-center shrink-0"
          title="Open Cart"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-bounce">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
