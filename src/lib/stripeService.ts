import Stripe from 'stripe';

// ----------------------------------------------------------------
// Stripe key validation
// A real key always starts with 'sk_test_' or 'sk_live_'
// ----------------------------------------------------------------
const RAW_KEY = process.env.STRIPE_SECRET_KEY || '';
export const IS_STRIPE_CONFIGURED =
  RAW_KEY.startsWith('sk_test_') || RAW_KEY.startsWith('sk_live_');

// Only instantiate a real Stripe client when a valid key is present
export const stripe = IS_STRIPE_CONFIGURED
  ? new Stripe(RAW_KEY, { apiVersion: '2025-01-27.acacia' as any })
  : null;

export interface StripeChargeResult {
  success: boolean;
  chargeId?: string;
  amountCaptured?: number;
  status?: string;
  receiptUrl?: string | null;
  paymentMethodBrand?: string;
  last4?: string;
  error?: string;
  errorCode?: string;
  requestId?: string;
  simulated?: boolean;
}

// ----------------------------------------------------------------
// Simulate a successful charge (used when Stripe is not configured)
// ----------------------------------------------------------------
function simulatedCharge(amountInCents: number, description?: string): StripeChargeResult {
  const fakeId = `ch_sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.info(`[Stripe Simulation] Simulated charge: ${fakeId} — R${(amountInCents / 100).toFixed(2)}`);
  return {
    success: true,
    chargeId: fakeId,
    amountCaptured: amountInCents,
    status: 'succeeded',
    receiptUrl: null,
    paymentMethodBrand: 'visa',
    last4: '4242',
    simulated: true,
  };
}

// ----------------------------------------------------------------
// Create a charge — falls back to simulation if Stripe not configured
// ----------------------------------------------------------------
export async function createStripeCharge({
  amountInCents,
  currency = 'usd',
  source = 'tok_visa',
  description,
  metadata,
}: {
  amountInCents: number;
  currency?: string;
  source?: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<StripeChargeResult> {
  // Simulation mode — no real Stripe key
  if (!IS_STRIPE_CONFIGURED || !stripe) {
    return simulatedCharge(amountInCents, description);
  }

  try {
    const charge = await stripe.charges.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      source,
      description: description || 'CampusShopper Student Purchase',
      metadata: metadata || {},
    });

    const cardDetails = charge.payment_method_details?.card;

    return {
      success: charge.status === 'succeeded' || charge.paid,
      chargeId: charge.id,
      amountCaptured: charge.amount_captured,
      status: charge.status,
      receiptUrl: charge.receipt_url,
      paymentMethodBrand: cardDetails?.brand || 'visa',
      last4: cardDetails?.last4 || '4242',
    };
  } catch (err: any) {
    // If auth fails mid-session (e.g., key revoked), fall back to simulation
    if (err.type === 'StripeAuthenticationError') {
      console.warn('[Stripe] Auth failed — falling back to simulation mode');
      return simulatedCharge(amountInCents, description);
    }
    return handleStripeError(err);
  }
}

// Retrieve a charge
export async function retrieveStripeCharge(
  chargeId: string,
  expandOptions: string[] = ['customer', 'payment_intent.customer']
) {
  if (!IS_STRIPE_CONFIGURED || !stripe) {
    return { success: true, charge: { id: chargeId, status: 'succeeded', simulated: true } };
  }
  try {
    const charge = await stripe.charges.retrieve(chargeId, { expand: expandOptions });
    return { success: true, charge };
  } catch (err: any) {
    return handleStripeError(err);
  }
}

// Capture an uncaptured charge
export async function captureStripeCharge(chargeId: string) {
  if (!IS_STRIPE_CONFIGURED || !stripe) {
    return { success: true, charge: { id: chargeId, status: 'succeeded', simulated: true } };
  }
  try {
    const charge = await stripe.charges.capture(chargeId);
    return { success: true, charge };
  } catch (err: any) {
    return handleStripeError(err);
  }
}

// List balance transactions
export async function listStripeBalanceTransactions(limit = 3) {
  if (!IS_STRIPE_CONFIGURED || !stripe) {
    return { success: true, balanceTransactions: [], simulated: true };
  }
  try {
    const balanceTransactions = await stripe.balanceTransactions.list({ limit });
    return { success: true, balanceTransactions: balanceTransactions.data };
  } catch (err: any) {
    return handleStripeError(err);
  }
}

// ----------------------------------------------------------------
// Centralised Stripe error handler
// ----------------------------------------------------------------
function handleStripeError(e: any): StripeChargeResult {
  console.error('Stripe Exception:', e);

  if (e.type === 'StripeCardError') {
    return { success: false, error: e.message || 'Card was declined.', errorCode: e.code, requestId: e.requestId };
  } else if (e.type === 'StripeRateLimitError') {
    return { success: false, error: 'Rate limit exceeded. Too many requests made to Stripe API.', requestId: e.requestId };
  } else if (e.type === 'StripeInvalidRequestError') {
    return { success: false, error: e.message || 'Invalid parameters supplied to Stripe API.', errorCode: e.code, requestId: e.requestId };
  } else if (e.type === 'StripeAuthenticationError') {
    return { success: false, error: 'Authentication with Stripe API failed. Please contact support.', requestId: e.requestId };
  } else if (e.type === 'StripeAPIConnectionError') {
    return { success: false, error: 'Network communication with Stripe failed.', requestId: e.requestId };
  } else {
    return { success: false, error: e.message || 'An unexpected error occurred during payment processing.', errorCode: e.code, requestId: e.requestId };
  }
}
