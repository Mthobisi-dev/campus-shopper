'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { analyzeCartWithAIBudgetGuard, AIBudgetAssessment } from '@/lib/aiBudgetGuard';
import { formatZAR } from '@/lib/utils';
import {
  X, Trash2, Plus, Minus, ShoppingBag, CreditCard,
  ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2,
  Sparkles, Zap, Brain, TrendingDown, Info,
} from 'lucide-react';
import StripeCheckoutModal from '@/components/checkout/StripeCheckoutModal';
import { getOrCreateUserId } from '@/lib/userSession';

export default function CartDrawer() {
  const {
    cart,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    shippingTotal,
    grandTotal,
    cartCount,
  } = useCart();

  const [showStripeModal, setShowStripeModal] = useState(false);
  const [totalBudget, setTotalBudget] = useState(1500);
  const [spentThisMonth, setSpentThisMonth] = useState(0);
  const [budgetResetDay, setBudgetResetDay] = useState(1);
  const [budgetStrictness, setBudgetStrictness] = useState('Strict');
  const [assessment, setAssessment] = useState<AIBudgetAssessment | null>(null);
  const [autoTrimming, setAutoTrimming] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);

  // Load real user budget data when cart opens
  const loadBudget = useCallback(async () => {
    try {
      const userId = await getOrCreateUserId();
      const res = await fetch(`/api/dashboard?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const tb = Number(data.totalBudget) || 1500;
        const sp = Number(data.spent) || 0;
        const rd = Number(data.profile?.budget_reset_day) || 1;
        const bs = (data.preferences?.ai_survey_answers as any)?.budgetStrictness || 'Strict';
        setTotalBudget(tb);
        setSpentThisMonth(sp);
        setBudgetResetDay(rd);
        setBudgetStrictness(bs);
      }
    } catch (err) {
      console.error('Budget load error:', err);
    }
  }, []);

  useEffect(() => {
    loadBudget();

    const handleBudgetUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.newBudget) {
        setTotalBudget(Number(customEvent.detail.newBudget));
      }
      loadBudget();
    };

    window.addEventListener('campus_shopper_budget_updated', handleBudgetUpdate);
    return () => {
      window.removeEventListener('campus_shopper_budget_updated', handleBudgetUpdate);
    };
  }, [loadBudget]);

  // Recompute AI assessment any time cart or budget or strictness changes
  useEffect(() => {
    if (cart.length === 0) {
      setAssessment(null);
      return;
    }
    const result = analyzeCartWithAIBudgetGuard(cart, totalBudget, spentThisMonth, budgetResetDay, budgetStrictness);
    setAssessment(result);
  }, [cart, totalBudget, spentThisMonth, budgetResetDay, budgetStrictness]);

  if (!isOpen) return null;

  const remainingBudget = Math.max(0, totalBudget - spentThisMonth);

  // ── AI Auto-Trim: remove suggested items ────────────────────
  function handleAutoTrim() {
    if (!assessment || assessment.suggestedRemovals.length === 0) return;
    setAutoTrimming(true);
    assessment.suggestedRemovals.forEach((item) => removeFromCart(item.product.id));
    setTimeout(() => setAutoTrimming(false), 800);
  }

  // ── After Stripe success, log all cart items ─────────────────
  async function handleCartCheckoutSuccess(chargeData: any) {
    try {
      const userId = await getOrCreateUserId();
      await Promise.all(
        cart.map((item) =>
          fetch('/api/purchases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              productId: item.product.id,
              productName: item.product.name,
              vendorName: item.product.vendor?.name || (item.product as any).merchant_name || 'Durban Store',
              productImageUrl: item.product.image_url,
              productUrl: chargeData?.receiptUrl || (item.product as any).product_url || null,
              category: item.product.category,
              quantity: item.quantity,
              unitPrice: Number(item.product.price_zar) || 0,
              shippingCost: Number(item.product.shipping_cost_zar) || 0,
              totalZar: +(
                (Number(item.product.price_zar) || 0) * item.quantity +
                (Number(item.product.shipping_cost_zar) || 0)
              ).toFixed(2),
            }),
          })
        )
      );
      clearCart();
      closeCart();
    } catch (err) {
      console.error('Error logging cart purchases:', err);
    }
  }

  // ── Risk colour helpers ──────────────────────────────────────
  const riskColour =
    assessment?.riskLevel === 'critical'
      ? 'text-red-400 border-red-500/30 bg-red-500/10'
      : assessment?.riskLevel === 'warning'
      ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
      : 'text-green-400 border-green-500/30 bg-green-500/10';

  const riskIcon =
    assessment?.riskLevel === 'critical' ? (
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
    ) : assessment?.riskLevel === 'warning' ? (
      <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
    ) : (
      <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
    );

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 h-full flex flex-col shadow-2xl">

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm flex items-center gap-2">
                  Shopping Cart
                  {cartCount > 0 && (
                    <span className="text-[10px] bg-primary/30 text-primary px-2 py-0.5 rounded-full font-semibold">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </h2>
                <p className="text-[10px] text-muted-foreground">AI Budget Guard Active</p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── AI Budget Guard Panel ──────────────────────────── */}
          {assessment && (
            <div className={`mx-3 mt-3 rounded-xl border p-3 ${riskColour}`}>
              <button
                onClick={() => setAiExpanded(!aiExpanded)}
                className="w-full flex items-start gap-2 text-left"
              >
                <Brain className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {riskIcon}
                    <span className="text-xs font-bold uppercase tracking-wide">
                      AI Budget Guard
                      {assessment.riskLevel === 'critical' && ' — BLOCKED'}
                      {assessment.riskLevel === 'warning' && ' — WARNING'}
                      {assessment.riskLevel === 'safe' && ' — APPROVED'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug opacity-90">{assessment.aiMessage}</p>
                </div>
                <Info className="w-3.5 h-3.5 shrink-0 opacity-50 mt-0.5" />
              </button>

              {aiExpanded && (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-2">
                  {/* Advice points */}
                  {assessment.advicePoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] opacity-85">
                      <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}

                  {/* Spending breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-[10px] opacity-70 mb-0.5">Essential</div>
                      <div className="text-xs font-bold text-green-400">
                        {formatZAR(assessment.essentialTotal)}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-[10px] opacity-70 mb-0.5">Discretionary</div>
                      <div className="text-xs font-bold text-orange-400">
                        {formatZAR(assessment.discretionaryTotal)}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-[10px] opacity-70 mb-0.5">Daily runway</div>
                      <div className={`text-xs font-bold ${assessment.dailyRunwayZar < 30 ? 'text-red-400' : 'text-blue-400'}`}>
                        R{assessment.dailyRunwayZar}/day
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-[10px] opacity-70 mb-0.5">Budget used</div>
                      <div className={`text-xs font-bold ${assessment.budgetUsedPct >= 80 ? 'text-red-400' : 'text-purple-400'}`}>
                        {assessment.budgetUsedPct}%
                      </div>
                    </div>
                  </div>

                  {/* Budget progress bar */}
                  <div className="pt-1">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          assessment.budgetUsedPct >= 80 ? 'bg-red-500' :
                          assessment.budgetUsedPct >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, assessment.budgetUsedPct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] opacity-60 mt-0.5">
                      <span>R0</span>
                      <span>R{totalBudget}</span>
                    </div>
                  </div>

                  {/* Auto-Trim button for critical */}
                  {assessment.riskLevel === 'critical' && assessment.suggestedRemovals.length > 0 && (
                    <button
                      onClick={handleAutoTrim}
                      disabled={autoTrimming}
                      className="w-full mt-1 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <TrendingDown className="w-4 h-4" />
                      {autoTrimming
                        ? 'Trimming...'
                        : `AI Auto-Trim Cart (removes ${assessment.suggestedRemovals.length} discretionary item${assessment.suggestedRemovals.length > 1 ? 's' : ''})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Cart Items ──────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 mt-2">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="text-5xl">🛒</div>
                <h3 className="font-bold text-sm">Your cart is empty</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Browse products and click <strong>Add to Cart</strong> — the AI will check your budget before checkout.
                </p>
                <button
                  onClick={closeCart}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemUnit = Number(item.product.price_zar) || 0;
                const itemShip = Number(item.product.shipping_cost_zar) || 0;
                const itemTotal = +(itemUnit * item.quantity + itemShip).toFixed(2);
                const isDiscretionary = !['groceries','textbooks','toiletries','data','pharmacy','stationery'].includes(
                  (item.product.category || '').toLowerCase()
                );
                const isSuggested = assessment?.suggestedRemovals.some((r) => r.product.id === item.product.id);

                return (
                  <div
                    key={item.product.id}
                    className={`rounded-xl p-3 flex gap-3 items-center border transition-all ${
                      isSuggested
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {/* Image */}
                    <div className="w-14 h-14 rounded-xl bg-secondary flex-shrink-0 overflow-hidden border border-white/10">
                      {item.product.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <h4 className="font-semibold text-xs leading-tight line-clamp-1">{item.product.name}</h4>
                        {isDiscretionary && (
                          <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1 py-0.5 rounded shrink-0">
                            non-essential
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.product.vendor?.name || (item.product as any).merchant_name || 'Durban Vendor'}
                      </p>

                      {/* Variants */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.selectedColour && (
                          <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded border border-border capitalize">
                            {item.selectedColour}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded border border-border">
                            {item.selectedSize}
                          </span>
                        )}
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center bg-secondary border border-border rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-muted-foreground hover:text-red-400 p-1 transition-colors ml-auto"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* AI suggestion indicator */}
                      {isSuggested && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> AI suggests removing this item
                        </p>
                      )}
                    </div>

                    {/* Item total */}
                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-green-400">{formatZAR(itemTotal)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatZAR(itemUnit)} ea</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Footer & Checkout ──────────────────────────────── */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-slate-950/90 space-y-3">
              {/* Cost breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="text-foreground font-medium">{formatZAR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Shipping</span>
                  <span className={shippingTotal > 0 ? 'text-foreground font-medium' : 'text-green-400 font-medium'}>
                    {shippingTotal > 0 ? formatZAR(shippingTotal) : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1.5 border-t border-white/10 text-sm">
                  <span>Grand Total</span>
                  <span className="text-green-400 text-base">{formatZAR(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Remaining budget after:</span>
                  <span className={assessment?.postPurchaseRemaining! < 0 ? 'text-red-400 font-bold' : 'text-blue-400 font-medium'}>
                    {assessment ? formatZAR(Math.max(0, assessment.postPurchaseRemaining)) : '—'}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-3 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground text-xs font-semibold transition-all"
                >
                  Clear
                </button>

                {assessment?.riskLevel === 'critical' ? (
                  <button
                    disabled
                    className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <AlertCircle className="w-4 h-4" />
                    AI Guard Blocked — Fix Cart First
                  </button>
                ) : (
                  <button
                    onClick={() => setShowStripeModal(true)}
                    className="flex-1 py-3 rounded-xl btn-primary font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay {formatZAR(grandTotal)} with Stripe
                  </button>
                )}
              </div>

              {/* AI safety badge */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Protected by CampusShopper AI Budget Guard
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stripe Modal — cart checkout */}
      <StripeCheckoutModal
        items={cart}
        remainingBudget={remainingBudget}
        budgetStrictness={budgetStrictness}
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        onSuccess={handleCartCheckoutSuccess}
      />
    </>
  );
}
