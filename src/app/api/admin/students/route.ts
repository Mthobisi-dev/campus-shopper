import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function isAdminVerified(request: Request): boolean {
  // Check the admin_verified cookie
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader.includes('admin_verified=');
}

export async function GET(request: Request) {
  if (!isAdminVerified(request)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const supabase = await createClient();

  // Fetch all profiles with their auth user email via service_role
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id,
      student_number,
      display_name,
      university,
      suburb,
      monthly_budget_zar,
      budget_reset_day,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get spend for each student this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: allPurchases } = await supabase
    .from('purchases')
    .select('profile_id, total_zar, purchased_at')
    .gte('purchased_at', startOfMonth);

  const spendMap: Record<string, number> = {};
  (allPurchases || []).forEach((p) => {
    spendMap[p.profile_id] = (spendMap[p.profile_id] || 0) + Number(p.total_zar);
  });

  const studentsWithSpend = (profiles || []).map((p) => ({
    ...p,
    spent_this_month: spendMap[p.id] || 0,
    remaining: Number(p.monthly_budget_zar) - (spendMap[p.id] || 0),
  }));

  return NextResponse.json({ students: studentsWithSpend });
}
