import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DEFAULT_PROFILE = (userId: string) => ({
  id: userId,
  display_name: 'DUT Student',
  student_number: null,
  university: 'Durban University of Technology',
  faculty: null,
  year_of_study: 1,
  suburb: 'Glenwood',
  lat: -29.8650,
  lng: 30.9822,
  monthly_budget_zar: 1500,
  budget_reset_day: 1,
  avatar_url: null,
  bio: null,
  phone: null,
});

const DEFAULT_PREFERENCES = (userId: string) => ({
  profile_id: userId,
  max_shipping_zar: 100,
  max_distance_km: 50,
  notify_budget: true,
  notify_deals: true,
  ai_persona_summary: null,
  ai_survey_answers: {},
  // 4NF arrays (reconstructed from junction tables via v_preferences view)
  fav_colours: [],
  fav_sizes: [],
  fav_vendors: [],
  interests: [],
  fav_categories: [],
});

// ── GET: fetch profile + preferences (uses 4NF v_preferences view) ──
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  try {
    // Fetch profile
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      const def = DEFAULT_PROFILE(userId);
      const { data: created } = await supabaseAdmin
        .from('profiles')
        .upsert(def, { onConflict: 'id' })
        .select('*')
        .maybeSingle();
      profile = created || def;
    }

    // Fetch preferences from 4NF view (arrays already aggregated)
    let { data: preferences } = await supabaseAdmin
      .from('v_preferences')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (!preferences) {
      // Create base scalar row — junction rows start empty
      await supabaseAdmin
        .from('preferences')
        .upsert({ profile_id: userId }, { onConflict: 'profile_id' });
      preferences = DEFAULT_PREFERENCES(userId);
    }

    return NextResponse.json({ profile, preferences });
  } catch (err: any) {
    console.error('Profile GET error:', err);
    return NextResponse.json({
      profile: DEFAULT_PROFILE(userId),
      preferences: DEFAULT_PREFERENCES(userId),
    });
  }
}

// ── POST: save profile + preferences using stored procedure ─────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, profile, preferences } = body;
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Update scalar profile fields (budget fields can only be set by admins via admin API)
    if (profile) {
      const { monthly_budget_zar, budget_reset_day, ...safeProfile } = profile;
      await supabaseAdmin.from('profiles').upsert(
        { id: userId, ...safeProfile, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    }

    // Use stored procedure for atomic 4NF multi-table preferences write
    if (preferences) {
      const { error } = await supabaseAdmin.rpc('save_preferences', {
        p_profile_id:   userId,
        p_max_shipping: preferences.max_shipping_zar  ?? 100,
        p_max_distance: preferences.max_distance_km   ?? 50,
        p_ai_summary:   preferences.ai_persona_summary ?? null,
        p_ai_answers:   preferences.ai_survey_answers  ?? {},
        p_colours:      preferences.fav_colours         ?? [],
        p_sizes:        preferences.fav_sizes           ?? [],
        p_vendors:      preferences.fav_vendors         ?? [],
        p_interests:    preferences.interests           ?? [],
        p_categories:   preferences.fav_categories      ?? [],
      });
      if (error) {
        console.error('save_preferences RPC error:', error);
        // Fallback: direct scalar upsert without junction tables
        await supabaseAdmin.from('preferences').upsert(
          { profile_id: userId, ...preferences, updated_at: new Date().toISOString() },
          { onConflict: 'profile_id' }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Profile POST error:', err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
