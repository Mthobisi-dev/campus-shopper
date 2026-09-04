import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();

  const [{ data: profile }, { data: purchases }, { data: prefs }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('purchases').select('*').eq('profile_id', id).order('purchased_at', { ascending: false }),
    supabase.from('preferences').select('*').eq('profile_id', id).maybeSingle(),
  ]);

  if (!profile) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
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

  const supabase = await createClient();
  const { data, error } = await supabase
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
