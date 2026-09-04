// ============================================================
// AI Budget Safeguard & Spending Advisor Algorithm
// Protects South African students from overspending their allowance
// ============================================================
import { Product, Profile, Purchase } from '@/types';
import { CartItem } from '@/context/CartContext';

export interface AIBudgetAssessment {
  riskLevel: 'safe' | 'warning' | 'critical';
  cartTotal: number;
  remainingBudget: number;
  postPurchaseRemaining: number;
  budgetUsedPct: number;
  daysLeftInMonth: number;
  dailyRunwayZar: number;
  essentialTotal: number;
  discretionaryTotal: number;
  aiMessage: string;
  advicePoints: string[];
  suggestedRemovals: CartItem[];
  canProceedToCheckout: boolean;
}

const ESSENTIAL_CATEGORIES = ['groceries', 'textbooks', 'toiletries', 'data', 'pharmacy', 'stationery'];

export type BudgetStrictnessMode = 'strict' | 'flexible' | 'relaxed';

export function getStrictnessMode(strictnessStr?: string): BudgetStrictnessMode {
  if (!strictnessStr) return 'strict';
  const lower = strictnessStr.toLowerCase();
  if (lower.includes('strict')) return 'strict';
  if (lower.includes('flexible')) return 'flexible';
  if (lower.includes('relaxed')) return 'relaxed';
  return 'strict';
}

export function analyzeCartWithAIBudgetGuard(
  cart: CartItem[],
  totalBudget: number,
  spentThisMonth: number,
  budgetResetDay: number = 1,
  budgetStrictness: string = 'Strict'
): AIBudgetAssessment {
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + (Number(item.product.price_zar) || 0) * item.quantity,
    0
  );
  const cartShipping = cart.reduce(
    (sum, item) => sum + (Number(item.product.shipping_cost_zar) || 0),
    0
  );
  const cartTotal = +(cartSubtotal + cartShipping).toFixed(2);

  const remainingBudget = Math.max(0, totalBudget - spentThisMonth);
  const postPurchaseRemaining = +(remainingBudget - cartTotal).toFixed(2);
  const strict70Limit = +(0.70 * remainingBudget).toFixed(2);

  const mode = getStrictnessMode(budgetStrictness);

  // Calculate days remaining until next budget reset day
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  let daysLeftInMonth = 0;
  if (budgetResetDay > currentDay) {
    daysLeftInMonth = budgetResetDay - currentDay;
  } else {
    daysLeftInMonth = daysInMonth - currentDay + budgetResetDay;
  }
  daysLeftInMonth = Math.max(1, daysLeftInMonth);

  // Daily runway calculation (remaining ZAR per day after this purchase)
  const dailyRunwayZar = +(Math.max(0, postPurchaseRemaining) / daysLeftInMonth).toFixed(2);
  const budgetUsedPct = Math.min(100, Math.round(((spentThisMonth + cartTotal) / totalBudget) * 100));

  // Separate essential vs discretionary spend in cart
  let essentialTotal = 0;
  let discretionaryTotal = 0;

  cart.forEach((item) => {
    const itemCost =
      (Number(item.product.price_zar) || 0) * item.quantity +
      (Number(item.product.shipping_cost_zar) || 0);

    if (ESSENTIAL_CATEGORIES.includes((item.product.category || '').toLowerCase())) {
      essentialTotal += itemCost;
    } else {
      discretionaryTotal += itemCost;
    }
  });

  // Calculate suggested items to remove if over budget or over strict 70% threshold
  const suggestedRemovals: CartItem[] = [];
  const maxAllowedCart = mode === 'strict' ? Math.min(remainingBudget, strict70Limit) : remainingBudget;
  let amountNeededToTrim = cartTotal - maxAllowedCart;

  if (amountNeededToTrim > 0) {
    // First target non-essential items
    const nonEssentials = cart.filter(
      (item) => !ESSENTIAL_CATEGORIES.includes((item.product.category || '').toLowerCase())
    );

    let trimmedSum = 0;
    for (const item of nonEssentials) {
      if (trimmedSum < amountNeededToTrim) {
        suggestedRemovals.push(item);
        trimmedSum +=
          (Number(item.product.price_zar) || 0) * item.quantity +
          (Number(item.product.shipping_cost_zar) || 0);
      }
    }

    // If still not enough, target expensive items
    if (trimmedSum < amountNeededToTrim) {
      const remainingCart = cart.filter((i) => !suggestedRemovals.includes(i));
      for (const item of remainingCart) {
        if (trimmedSum < amountNeededToTrim) {
          suggestedRemovals.push(item);
          trimmedSum +=
            (Number(item.product.price_zar) || 0) * item.quantity +
            (Number(item.product.shipping_cost_zar) || 0);
        }
      }
    }
  }

  // ------------------------------------------------------------
  // AI Risk Level Assessment & Natural Language Guard Engine
  // ------------------------------------------------------------
  let riskLevel: 'safe' | 'warning' | 'critical' = 'safe';
  let aiMessage = '';
  const advicePoints: string[] = [];
  let canProceedToCheckout = true;

  if (mode === 'strict') {
    if (cartTotal > strict70Limit) {
      riskLevel = 'critical';
      canProceedToCheckout = false;
      aiMessage = `🔴 AI Budget Guard (Strict Mode): BLOCKED! Purchase of R${cartTotal.toFixed(
        2
      )} exceeds 70% of your available balance (R${remainingBudget.toFixed(
        2
      )}). Maximum allowed single purchase is R${strict70Limit.toFixed(2)}.`;

      advicePoints.push(
        `Strict Mode Rule: Blocked because purchase exceeds 70% of available balance (Limit: R${strict70Limit.toFixed(2)}).`
      );
      if (discretionaryTotal > 0) {
        advicePoints.push(
          `Removing discretionary items (R${discretionaryTotal.toFixed(
            2
          )}) will bring your cart back under the 70% threshold.`
        );
      }
      advicePoints.push(`Suggested action: Click 'AI Auto-Trim' to adjust your cart automatically.`);
    } else if (cartTotal > remainingBudget) {
      riskLevel = 'critical';
      canProceedToCheckout = false;
      aiMessage = `🔴 AI Budget Guard (Strict Mode): BLOCKED! Your cart total (R${cartTotal.toFixed(
        2
      )}) exceeds your available monthly budget of R${remainingBudget.toFixed(2)}.`;
      advicePoints.push(`Over budget by R${(cartTotal - remainingBudget).toFixed(2)}.`);
    } else if (dailyRunwayZar < 30 || budgetUsedPct >= 80) {
      riskLevel = 'warning';
      canProceedToCheckout = true;
      aiMessage = `⚠️ AI Spending Alert (Strict Mode): Cart takes up R${cartTotal.toFixed(
        2
      )} leaving R${dailyRunwayZar.toFixed(2)}/day runway for the remaining ${daysLeftInMonth} days.`;
      advicePoints.push(`Within 70% limit (R${strict70Limit.toFixed(2)}), but caution advised.`);
    } else {
      riskLevel = 'safe';
      canProceedToCheckout = true;
      aiMessage = `🛡️ AI Budget Guard (Strict Mode): APPROVED! Cart total R${cartTotal.toFixed(
        2
      )} is well within 70% limit (R${strict70Limit.toFixed(2)}) of your remaining balance.`;
      advicePoints.push(`Remaining budget after checkout: R${postPurchaseRemaining.toFixed(2)}.`);
    }
  } else if (mode === 'flexible') {
    if (cartTotal > remainingBudget) {
      riskLevel = 'critical';
      canProceedToCheckout = false;
      aiMessage = `🚨 AI Budget Guard (Flexible Mode): BLOCKED! Cart total (R${cartTotal.toFixed(
        2
      )}) exceeds your available monthly budget of R${remainingBudget.toFixed(2)}.`;
      advicePoints.push(`Over budget by R${(cartTotal - remainingBudget).toFixed(2)}.`);
    } else if (cartTotal > 0.85 * remainingBudget) {
      riskLevel = 'warning';
      canProceedToCheckout = true;
      aiMessage = `🟡 AI Budget Guard (Flexible Mode): Warning! Cart total of R${cartTotal.toFixed(
        2
      )} takes up over 85% of your remaining balance (R${remainingBudget.toFixed(2)}). Proceed with caution.`;
      advicePoints.push(`Consider saving non-essentials for next month.`);
    } else {
      riskLevel = 'safe';
      canProceedToCheckout = true;
      aiMessage = `🛡️ AI Budget Guard (Flexible Mode): APPROVED! Cart total R${cartTotal.toFixed(
        2
      )} is within your available balance.`;
      advicePoints.push(`Remaining budget after checkout: R${postPurchaseRemaining.toFixed(2)}.`);
    }
  } else {
    // Relaxed mode
    if (cartTotal > remainingBudget) {
      riskLevel = 'warning';
      canProceedToCheckout = true;
      aiMessage = `🟢 AI Budget Guard (Relaxed Mode): Advisory — Cart total of R${cartTotal.toFixed(
        2
      )} is higher than your remaining balance of R${remainingBudget.toFixed(2)}.`;
      advicePoints.push(`Relaxed mode allows proceeding, but monitor spending.`);
    } else {
      riskLevel = 'safe';
      canProceedToCheckout = true;
      aiMessage = `🟢 AI Budget Guard (Relaxed Mode): APPROVED! Cart total R${cartTotal.toFixed(
        2
      )} fits your remaining balance.`;
      advicePoints.push(`Remaining budget after checkout: R${postPurchaseRemaining.toFixed(2)}.`);
    }
  }

  return {
    riskLevel,
    cartTotal,
    remainingBudget,
    postPurchaseRemaining,
    budgetUsedPct,
    daysLeftInMonth,
    dailyRunwayZar,
    essentialTotal,
    discretionaryTotal,
    aiMessage,
    advicePoints,
    suggestedRemovals,
    canProceedToCheckout,
  };
}

