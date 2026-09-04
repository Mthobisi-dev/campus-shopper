import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function isAdminVerified(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader.includes('admin_verified=');
}

export async function GET(request: Request) {
  if (!isAdminVerified(request)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    // 1. Fetch all registered users from Supabase Auth
    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    const authUsers = authUsersData?.users || [];

    // 2. Fetch existing profiles
    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('*');

    const profileMap = new Map((existingProfiles || []).map((p) => [p.id, p]));

    // 3. For any auth user missing a profile, create one on-the-fly
    const allStudentProfiles: any[] = [];

    for (const user of authUsers) {
      // Exclude admin email if desired or list all
      let prof = profileMap.get(user.id);
      if (!prof) {
        const defaultProf = {
          id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'DUT Student',
          student_number: user.user_metadata?.student_number || `DUT-${user.id.slice(0, 6)}`,
          university: 'Durban University of Technology',
          suburb: 'Glenwood',
          monthly_budget_zar: 1500,
          budget_reset_day: 1,
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        };

        await supabaseAdmin.from('profiles').upsert(defaultProf, { onConflict: 'id' });
        prof = defaultProf;
      }
      allStudentProfiles.push({ ...prof, email: user.email });
    }

    // 4. Calculate monthly spend for each student
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: allPurchases } = await supabaseAdmin
      .from('purchases')
      .select('profile_id, total_zar, purchased_at')
      .gte('purchased_at', startOfMonth);

    const spendMap: Record<string, number> = {};
    (allPurchases || []).forEach((p) => {
      spendMap[p.profile_id] = (spendMap[p.profile_id] || 0) + Number(p.total_zar);
    });

    const studentsWithSpend = allStudentProfiles.map((p) => ({
      ...p,
      spent_this_month: spendMap[p.id] || 0,
      remaining: Number(p.monthly_budget_zar) - (spendMap[p.id] || 0),
    }));

    return NextResponse.json({ students: studentsWithSpend });
  } catch (err: any) {
    console.error('Error fetching admin students:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
