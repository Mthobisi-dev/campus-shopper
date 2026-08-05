'use client';

import { useState, useEffect } from 'react';
import { Purchase } from '@/types';
import { formatZAR, formatDate } from '@/lib/utils';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/types';
import { History, ShoppingBag, ExternalLink, Receipt } from 'lucide-react';
import { getOrCreateUserId } from '@/lib/userSession';

export default function HistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'month'>('month');

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const userId = await getOrCreateUserId();
      const res = await fetch(`/api/purchases?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const filtered = tab === 'month'
    ? purchases.filter((p) => new Date(p.purchased_at) >= startOfMonth)
    : purchases;

  const total = filtered.reduce((sum, p) => sum + Number(p.total_zar), 0);

  // Group by date
  const grouped: Record<string, Purchase[]> = {};
  filtered.forEach((p) => {
    const day = formatDate(p.purchased_at);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(p);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <History className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Purchase History</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} purchase{filtered.length !== 1 ? 's' : ''} · Spent {formatZAR(total)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary p-1 rounded-xl mb-6">
        <button
          onClick={() => setTab('month')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            tab === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          This month
        </button>
        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            tab === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All time
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-semibold mb-2 text-base">No purchases yet</h3>
          <p className="text-sm text-muted-foreground">Browse products and click "Buy" to log a purchase.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day} className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{day}</h3>
              <div className="space-y-2">
                {items.map((p) => {
                  const icon = CATEGORY_ICONS[p.category] || '🛍️';
                  return (
                    <div key={p.id} className="glass-card p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl shrink-0">
                          {icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm line-clamp-1">{p.product_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {p.vendor_name} · <span className="capitalize">{CATEGORY_LABELS[p.category] || p.category}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-green-400 text-sm">{formatZAR(p.total_zar)}</div>
                        {p.product_url && (
                          <a
                            href={p.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-0.5"
                          >
                            <Receipt className="w-3 h-3" /> Stripe Receipt
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
