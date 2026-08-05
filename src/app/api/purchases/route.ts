import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

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

    // Get user budget before purchase
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
    const budgetBefore = +(budget - alreadySpent).toFixed(2);
    const budgetAfter  = +(budgetBefore - Number(totalZar)).toFixed(2);

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
