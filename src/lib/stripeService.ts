import Stripe from 'stripe';

export const STRIPE_TEST_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51MockCampusShopperKey00000000';

export const stripe = new Stripe(STRIPE_TEST_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia' as any,
});

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
}

// Create a charge using Stripe API
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
    return handleStripeError(err);
  }
}

// Retrieve a charge with expansion options
export async function retrieveStripeCharge(
  chargeId: string,
  expandOptions: string[] = ['customer', 'payment_intent.customer']
) {
  try {
    const charge = await stripe.charges.retrieve(chargeId, {
      expand: expandOptions,
    });
    return { success: true, charge };
  } catch (err: any) {
    return handleStripeError(err);
  }
}

// Capture an uncaptured charge
export async function captureStripeCharge(chargeId: string) {
  try {
    const charge = await stripe.charges.capture(chargeId);
    return { success: true, charge };
  } catch (err: any) {
    return handleStripeError(err);
  }
}

// List balance transactions
export async function listStripeBalanceTransactions(limit = 3) {
  try {
    const balanceTransactions = await stripe.balanceTransactions.list({
      limit,
    });
    return { success: true, balanceTransactions: balanceTransactions.data };
  } catch (err: any) {
    return handleStripeError(err);
  }
}

// Centralised robust Stripe error handler matching exact user error specifications
function handleStripeError(e: any): StripeChargeResult {
  console.error('Stripe Exception:', e);

  if (e.type === 'StripeCardError') {
    return {
      success: false,
      error: e.message || 'Card was declined.',
      errorCode: e.code,
      requestId: e.requestId,
    };
  } else if (e.type === 'StripeRateLimitError') {
    return {
      success: false,
      error: 'Rate limit exceeded. Too many requests made to Stripe API.',
      requestId: e.requestId,
    };
  } else if (e.type === 'StripeInvalidRequestError') {
    return {
      success: false,
      error: e.message || 'Invalid parameters supplied to Stripe API.',
      errorCode: e.code,
      requestId: e.requestId,
    };
  } else if (e.type === 'StripeAuthenticationError') {
    return {
      success: false,
      error: 'Authentication with Stripe API failed.',
      requestId: e.requestId,
    };
  } else if (e.type === 'StripeAPIConnectionError') {
    return {
      success: false,
      error: 'Network communication with Stripe failed.',
      requestId: e.requestId,
    };
  } else {
    return {
      success: false,
      error: e.message || 'An unexpected error occurred during Stripe payment processing.',
      errorCode: e.code,
      requestId: e.requestId,
    };
  }
}
