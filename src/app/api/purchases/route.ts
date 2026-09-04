import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET purchases for a userId
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ purchases: [], monthSpent: 0, totalSpent: 0 });
  }

  try {
    const { data: purchases, error } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .eq('profile_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    // Get current profile for reset day
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('monthly_budget_zar, budget_reset_day')
      .eq('id', userId)
      .maybeSingle();

    const resetDay = profile?.budget_reset_day || 1;
    const periodStart = new Date();
    periodStart.setDate(resetDay);
    periodStart.setHours(0, 0, 0, 0);
    if (periodStart > new Date()) periodStart.setMonth(periodStart.getMonth() - 1);

    const monthPurchases = (purchases || []).filter(
      (p) => new Date(p.purchased_at) >= periodStart
    );

    const monthSpent = monthPurchases.reduce((s, p) => s + Number(p.total_zar), 0);
    const totalSpent = (purchases || []).reduce((s, p) => s + Number(p.total_zar), 0);

    return NextResponse.json({
      purchases: purchases || [],
      monthPurchases,
      monthSpent,
      totalSpent,
      monthlyBudget: Number(profile?.monthly_budget_zar || 1500),
      remainingBudget: Number(profile?.monthly_budget_zar || 1500) - monthSpent,
    });
  } catch (err: any) {
    console.error('Error fetching purchases:', err);
    return NextResponse.json({ purchases: [], monthSpent: 0, totalSpent: 0 });
  }
}

// POST log a new purchase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      productId,
      productName,
      vendorName,
      productImageUrl,
      productUrl,
      category = 'groceries',
      quantity = 1,
      unitPrice,
      shippingCost = 0,
      totalZar,
    } = body;

    if (!userId || !productName || totalZar === undefined) {
      return NextResponse.json({ error: 'Missing required purchase details' }, { status: 400 });
    }

    // Get user profile & budget
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('monthly_budget_zar, budget_reset_day')
      .eq('id', userId)
      .maybeSingle();

    const budget = Number(prof?.monthly_budget_zar) || 1500;
    const resetDay = prof?.budget_reset_day || 1;
    const periodStart = new Date();
    periodStart.setDate(resetDay);
    periodStart.setHours(0, 0, 0, 0);
    if (periodStart > new Date()) periodStart.setMonth(periodStart.getMonth() - 1);

    const { data: monthPurchases } = await supabaseAdmin
      .from('purchases')
      .select('total_zar')
      .eq('profile_id', userId)
      .gte('purchased_at', periodStart.toISOString());

    const alreadySpent = (monthPurchases || []).reduce((s, p) => s + Number(p.total_zar), 0);
    const remainingBalance = Math.max(0, budget - alreadySpent);
    const purchaseAmount = Number(totalZar);

    // Fetch student's budget strictness preference from preferences
    const { data: pref } = await supabaseAdmin
      .from('preferences')
      .select('ai_survey_answers')
      .eq('profile_id', userId)
      .maybeSingle();

    const strictnessSetting = (pref?.ai_survey_answers as any)?.budgetStrictness || 'Strict';
    const strictnessLower = String(strictnessSetting).toLowerCase();
    const mode = strictnessLower.includes('flexible')
      ? 'flexible'
      : strictnessLower.includes('relaxed')
      ? 'relaxed'
      : 'strict';

    // ── Real & Robust Enforcement Rules ───────────────────────
    if (mode === 'strict') {
      const maxAllowed70Pct = +(0.70 * remainingBalance).toFixed(2);
      if (purchaseAmount > maxAllowed70Pct) {
        return NextResponse.json(
          {
            success: false,
            error: `AI Budget Guard (Strict Mode): Purchase blocked! Product price (R${purchaseAmount.toFixed(
              2
            )}) exceeds 70% of your remaining balance (R${remainingBalance.toFixed(
              2
            )}). Maximum allowed single purchase in Strict Mode is R${maxAllowed70Pct.toFixed(2)}.`,
          },
          { status: 400 }
        );
      }
      if (purchaseAmount > remainingBalance) {
        return NextResponse.json(
          {
            success: false,
            error: `AI Budget Guard (Strict Mode): Purchase blocked! Purchase total of R${purchaseAmount.toFixed(
              2
            )} exceeds your remaining balance of R${remainingBalance.toFixed(2)}.`,
          },
          { status: 400 }
        );
      }
    } else if (mode === 'flexible') {
      if (purchaseAmount > remainingBalance) {
        return NextResponse.json(
          {
            success: false,
            error: `AI Budget Guard (Flexible Mode): Purchase blocked! Total of R${purchaseAmount.toFixed(
              2
            )} exceeds your remaining balance of R${remainingBalance.toFixed(2)}.`,
          },
          { status: 400 }
        );
      }
    }
    // Relaxed mode allows processing if balance allows, or passes through with warning

    const budgetBefore = +remainingBalance.toFixed(2);
    const budgetAfter  = +(budgetBefore - purchaseAmount).toFixed(2);

    const { data: purchase, error } = await supabaseAdmin
      .from('purchases')
      .insert({
        profile_id: userId,
        product_id: productId && !productId.startsWith('serp_') ? productId : null,
        product_name: productName,
        vendor_name: vendorName || 'Durban Store',
        product_image_url: productImageUrl || null,
        product_url: productUrl || null,
        category,
        quantity,
        unit_price: unitPrice || totalZar,
        shipping_cost: shippingCost,
        total_zar: totalZar,
        budget_before: budgetBefore,
        budget_after: budgetAfter,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, purchase });
  } catch (err: any) {
    console.error('Error recording purchase:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
