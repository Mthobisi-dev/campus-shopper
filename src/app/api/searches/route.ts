import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const { userId, query, resultCount = 0, filters = {} } = await req.json();
    if (!userId || !query) {
      return NextResponse.json({ success: false });
    }

    await supabaseAdmin.from('searches').insert({
      profile_id: userId,
      query,
      result_count: resultCount,
      filters,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error logging search:', err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
