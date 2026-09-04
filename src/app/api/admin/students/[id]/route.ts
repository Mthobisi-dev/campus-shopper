import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function isAdminVerified(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader.includes('admin_verified=');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminVerified(request)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await params;

  let [{ data: profile }, { data: purchases }, { data: prefs }] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabaseAdmin.from('purchases').select('*').eq('profile_id', id).order('purchased_at', { ascending: false }),
    supabaseAdmin.from('preferences').select('*').eq('profile_id', id).maybeSingle(),
  ]);

  if (!profile) {
    // If user exists in Auth but has no profile row, create default profile row
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
    if (!authUser || !authUser.user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const defaultProf = {
      id: authUser.user.id,
      display_name: authUser.user.user_metadata?.display_name || authUser.user.email?.split('@')[0] || 'DUT Student',
      student_number: authUser.user.user_metadata?.student_number || `DUT-${authUser.user.id.slice(0, 6)}`,
      university: 'Durban University of Technology',
      suburb: 'Glenwood',
      monthly_budget_zar: 1500,
      budget_reset_day: 1,
    };
    await supabaseAdmin.from('profiles').upsert(defaultProf, { onConflict: 'id' });
    profile = defaultProf;
  }

  return NextResponse.json({ profile, purchases: purchases || [], preferences: prefs });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminVerified(request)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { monthly_budget_zar, budget_reset_day, display_name, suburb } = body;

  // Only allow specific fields to be updated by admin
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (monthly_budget_zar !== undefined) {
    const budget = Number(monthly_budget_zar);
    if (isNaN(budget) || budget <= 0 || budget > 100000) {
      return NextResponse.json({ error: 'Budget must be between R1 and R100,000' }, { status: 400 });
    }
    updatePayload.monthly_budget_zar = budget;
  }
  if (budget_reset_day !== undefined) updatePayload.budget_reset_day = Number(budget_reset_day);
  if (display_name !== undefined) updatePayload.display_name = display_name;
  if (suburb !== undefined) updatePayload.suburb = suburb;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
