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

export function analyzeCartWithAIBudgetGuard(
  cart: CartItem[],
  totalBudget: number,
  spentThisMonth: number,
  budgetResetDay: number = 1
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

  // Calculate suggested items to remove if over budget
  const suggestedRemovals: CartItem[] = [];
  let amountNeededToTrim = cartTotal - remainingBudget;

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

  if (cartTotal > remainingBudget) {
    riskLevel = 'critical';
    canProceedToCheckout = false;
    aiMessage = `🚨 AI Guard Intervened: Your cart total (R${cartTotal.toFixed(
      2
    )}) exceeds your available monthly budget of R${remainingBudget.toFixed(
      2
    )}. Payment is paused to prevent NSFAS allowance deficit.`;

    advicePoints.push(
      `Overbudget by R${(cartTotal - remainingBudget).toFixed(2)}. Trim discretionary items to proceed.`
    );
    if (discretionaryTotal > 0) {
      advicePoints.push(
        `Removing discretionary items (R${discretionaryTotal.toFixed(
          2
        )}) will free up your allowance.`
      );
    }
    advicePoints.push(`Suggested action: Click 'AI Auto-Trim' to adjust your cart automatically.`);
  } else if (dailyRunwayZar < 30 || budgetUsedPct >= 80) {
    riskLevel = 'warning';
    canProceedToCheckout = true;
    aiMessage = `⚠️ AI Spending Alert: Buying these items leaves you with only R${dailyRunwayZar.toFixed(
      2
    )}/day for the next ${daysLeftInMonth} days until your allowance resets.`;

    advicePoints.push(
      `You will have used ${budgetUsedPct}% of your total R${totalBudget.toFixed(2)} budget.`
    );
    if (discretionaryTotal > 0) {
      advicePoints.push(
        `R${discretionaryTotal.toFixed(
          2
        )} of this cart is for non-essential items. Consider postponing these.`
      );
    }
    advicePoints.push(
      `Daily food & travel minimum target is R40/day in Durban. You are currently at R${dailyRunwayZar.toFixed(
        2
      )}/day.`
    );
  } else {
    riskLevel = 'safe';
    canProceedToCheckout = true;
    aiMessage = `🛡️ AI Budget Guard Approved: Your cart is healthy! You will maintain a comfortable R${dailyRunwayZar.toFixed(
      2
    )}/day runway for the remaining ${daysLeftInMonth} days.`;

    advicePoints.push(
      `Essential purchases: ${Math.round((essentialTotal / (cartTotal || 1)) * 100)}% of cart.`
    );
    advicePoints.push(`Remaining budget after checkout: R${postPurchaseRemaining.toFixed(2)}.`);
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
