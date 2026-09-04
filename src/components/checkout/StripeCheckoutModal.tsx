'use client';

import { useState } from 'react';
import { Product } from '@/types';
import { formatZAR } from '@/lib/utils';
import {
  CreditCard, ShieldCheck, X, Loader2, CheckCircle2, ExternalLink, AlertCircle, Lock, ShoppingCart,
} from 'lucide-react';
import { CATEGORY_ICONS } from '@/types';
import { CartItem } from '@/context/CartContext';

interface StripeCheckoutModalProps {
  product?: Product;
  items?: CartItem[];
  remainingBudget?: number;
  budgetStrictness?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (chargeData: any, itemsPurchased?: CartItem[]) => void;
}

export default function StripeCheckoutModal({
  product,
  items,
  remainingBudget,
  budgetStrictness = 'Strict',
  isOpen,
  onClose,
  onSuccess,
}: StripeCheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  // Form state
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expDate, setExpDate] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [cardName, setCardName] = useState('DUT Student');

  if (!isOpen) return null;

  // Determine single product vs cart items
  const isCartCheckout = Array.isArray(items) && items.length > 0;

  let totalCost = 0;
  let titleText = '';
  let subText = '';
  let icon = '📦';

  if (isCartCheckout) {
    totalCost = +items
      .reduce(
        (sum, item) =>
          sum + (Number(item.product.price_zar) || 0) * item.quantity + (Number(item.product.shipping_cost_zar) || 0),
        0
      )
      .toFixed(2);
    titleText = `${items.length} Cart Items`;
    subText = items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ');
    icon = '🛒';
  } else if (product) {
    const unitPrice = Number(product.price_zar) || 0;
    const shipping = Number(product.shipping_cost_zar) || 0;
    totalCost = +(unitPrice + shipping).toFixed(2);
    titleText = product.name;
    subText = product.vendor?.name || (product as any).merchant_name || 'Durban Retailer';
    icon = CATEGORY_ICONS[product.category] || '📦';
  }

  const safeRemaining = Math.max(0, remainingBudget ?? 0);
  const strict70Limit = +(0.70 * safeRemaining).toFixed(2);
  const strictnessLower = String(budgetStrictness).toLowerCase();
  const mode = strictnessLower.includes('flexible')
    ? 'flexible'
    : strictnessLower.includes('relaxed')
    ? 'relaxed'
    : 'strict';

  const overBudget = remainingBudget !== undefined && remainingBudget !== null && totalCost > remainingBudget;
  const isStrictBlocked = mode === 'strict' && remainingBudget !== undefined && remainingBudget !== null && (totalCost > strict70Limit || overBudget);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (isStrictBlocked) {
      setError(`🔴 AI Budget Guard (Strict Mode): BLOCKED! Total amount (R${totalCost.toFixed(2)}) exceeds 70% of your remaining balance (R${safeRemaining.toFixed(2)}). Maximum allowed single purchase is R${strict70Limit.toFixed(2)}.`);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountZar: totalCost,
          productName: isCartCheckout ? `Cart Purchase (${items!.length} items)` : product?.name,
          vendorName: isCartCheckout ? 'Various Durban Vendors' : product?.vendor?.name || (product as any)?.merchant_name || 'Durban Retailer',
          currency: 'usd',
          source: 'tok_visa',
          metadata: {
            isCart: isCartCheckout,
            itemCount: isCartCheckout ? items!.length : 1,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Stripe payment failed.');
      }

      setSuccessData(data);
      onSuccess(data, items);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass-card p-5 sm:p-6 border border-white/20 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Payment Success View */}
        {successData ? (
          <div className="text-center py-6 space-y-4 animate-scale-up">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-400">
                {successData.simulated ? '✅ Order Placed Successfully!' : 'Stripe Payment Successful!'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {successData.simulated
                  ? '🎭 Demo Mode — No real money charged'
                  : 'Transaction processed via Stripe Test Gateway'}
              </p>
            </div>

            <div className="bg-secondary/60 rounded-xl p-4 text-left text-xs space-y-2 font-mono border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Charge ID:</span>
                <span className="font-semibold text-foreground">{successData.chargeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-semibold text-green-400">{formatZAR(totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Card Brand:</span>
                <span className="uppercase text-foreground font-semibold">
                  {successData.paymentMethodBrand} •••• {successData.last4}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-400 font-bold uppercase">{successData.status}</span>
              </div>
            </div>

            {successData.receiptUrl && (
              <a
                href={successData.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline pt-2"
              >
                View Official Stripe Receipt <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl btn-primary font-bold text-sm mt-4"
            >
              Done
            </button>
          </div>
        ) : (
          /* Payment Form View */
          <form onSubmit={handlePay} className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Stripe Secure Checkout</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3 text-green-400" /> Encrypted 256-bit Stripe SSL
                </p>
              </div>
            </div>

            {/* Product / Cart Summary */}
            <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center text-xl shrink-0">
                    {icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs line-clamp-1">{titleText}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{subText}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-green-400">{formatZAR(totalCost)}</div>
                </div>
              </div>

              {/* Multi-item breakdown preview */}
              {isCartCheckout && items!.length > 0 && (
                <div className="pt-2 border-t border-border/60 text-[11px] space-y-1">
                  {items!.map((it) => (
                    <div key={it.product.id} className="flex justify-between text-muted-foreground">
                      <span className="truncate max-w-[200px]">
                        {it.quantity}x {it.product.name}
                      </span>
                      <span>{formatZAR((Number(it.product.price_zar) || 0) * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isStrictBlocked ? (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-red-400">🔴 AI Budget Guard (Strict Mode Active)</span>
                  <span className="text-[11px] leading-relaxed">
                    Blocked! This purchase ({formatZAR(totalCost)}) exceeds 70% of your remaining balance ({formatZAR(safeRemaining)}).
                    Maximum allowed single item/cart purchase in Strict Mode is <strong>{formatZAR(strict70Limit)}</strong>.
                  </span>
                </div>
              </div>
            ) : overBudget ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Notice: Total exceeds your remaining monthly budget!</span>
              </div>
            ) : mode === 'flexible' && totalCost > 0.85 * safeRemaining ? (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>🟡 AI Warning (Flexible Mode): Purchase takes up over 85% of remaining balance!</span>
              </div>
            ) : null}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Card Form */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Name on Card
                </label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Card Number (Stripe Test Visa)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="input-field text-xs font-mono pl-9"
                  />
                  <CreditCard className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    placeholder="MM/YY"
                    className="input-field text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    className="input-field text-xs font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isStrictBlocked}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg mt-4 ${
                isStrictBlocked
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing via Stripe...</>
              ) : isStrictBlocked ? (
                <><AlertCircle className="w-4 h-4" /> AI Guard Blocked (70% Threshold Exceeded)</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Pay {formatZAR(totalCost)} with Stripe</>
              )}
            </button>

            <div className="text-center">
              <span className="text-[10px] text-muted-foreground">
                Test Mode API Key Active (`sk_test_51RC...`)
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
