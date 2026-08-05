import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || '00000000-0000-0000-0000-000000000001';

  try {
    const [
      { data: profile },
      { data: preferences },
      { data: purchases },
      { data: favourites },
      { data: searches },
      { data: allProducts },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabaseAdmin.from('preferences').select('*').eq('profile_id', userId).maybeSingle(),
      supabaseAdmin.from('purchases').select('*').eq('profile_id', userId).order('purchased_at', { ascending: false }).limit(100),
      supabaseAdmin.from('favourites').select('*, product:products(*, vendor:vendors(*))').eq('profile_id', userId),
      supabaseAdmin.from('searches').select('*').eq('profile_id', userId).order('searched_at', { ascending: false }).limit(10),
      supabaseAdmin.from('products').select('*, vendor:vendors(*)').eq('is_active', true).limit(60),
    ]);

    const totalBudget = Number(profile?.monthly_budget_zar || 1500);
    const resetDay = profile?.budget_reset_day || 1;

    const startOfMonth = new Date();
    startOfMonth.setDate(resetDay);
    startOfMonth.setHours(0, 0, 0, 0);
    if (startOfMonth > new Date()) startOfMonth.setMonth(startOfMonth.getMonth() - 1);

    const monthPurchases = (purchases || []).filter(
      (p) => new Date(p.purchased_at) >= startOfMonth
    );

    const spent = monthPurchases.reduce((sum, p) => sum + Number(p.total_zar), 0);
    const remaining = totalBudget - spent;

    const categorySpend: Record<string, number> = {};
    monthPurchases.forEach((p) => {
      categorySpend[p.category] = (categorySpend[p.category] || 0) + Number(p.total_zar);
    });

    return NextResponse.json({
      profile: profile || {
        id: userId,
        display_name: 'DUT Student',
        university: 'Durban University of Technology',
        suburb: 'Glenwood',
        monthly_budget_zar: 1500,
        budget_reset_day: 1,
      },
      preferences: preferences || null,
      totalBudget,
      spent,
      remaining,
      purchasesCount: purchases?.length || 0,
      monthPurchasesCount: monthPurchases.length,
      savedCount: favourites?.length || 0,
      searchesCount: searches?.length || 0,
      purchases: purchases || [],
      monthPurchases,
      favourites: favourites || [],
      recentSearches: searches || [],
      categorySpend,
      allProducts: allProducts || [],
    });
  } catch (err: any) {
    console.error('Error in /api/dashboard:', err);
    return NextResponse.json({
      profile: { display_name: 'DUT Student', university: 'Durban University of Technology', suburb: 'Glenwood', monthly_budget_zar: 1500, budget_reset_day: 1 },
      preferences: null,
      totalBudget: 1500,
      spent: 0,
      remaining: 1500,
      purchasesCount: 0,
      monthPurchasesCount: 0,
      savedCount: 0,
      searchesCount: 0,
      purchases: [],
      monthPurchases: [],
      favourites: [],
      recentSearches: [],
      categorySpend: {},
      allProducts: [],
    });
  }
}
