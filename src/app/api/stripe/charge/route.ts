import { NextRequest, NextResponse } from 'next/server';
import { createStripeCharge, retrieveStripeCharge } from '@/lib/stripeService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountZar, productName, vendorName, currency = 'usd', source = 'tok_visa', metadata = {} } = body;

    if (!amountZar || amountZar <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    // Convert ZAR amount to cents (e.g., R39.99 → 3999 cents or equivalent in USD/ZAR cents)
    const amountInCents = Math.round(Number(amountZar) * 100);

    const chargeResult = await createStripeCharge({
      amountInCents,
      currency,
      source,
      description: `CampusShopper: ${productName || 'Item'} from ${vendorName || 'Durban Store'}`,
      metadata: {
        productName: productName || 'Item',
        vendorName: vendorName || 'Durban Store',
        ...metadata,
      },
    });

    if (!chargeResult.success) {
      return NextResponse.json(chargeResult, { status: 400 });
    }

    return NextResponse.json(chargeResult);
  } catch (err: any) {
    console.error('Stripe API route error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const chargeId = req.nextUrl.searchParams.get('chargeId');
  if (!chargeId) {
    return NextResponse.json({ error: 'Missing chargeId' }, { status: 400 });
  }

  const result = await retrieveStripeCharge(chargeId);
  return NextResponse.json(result);
}
