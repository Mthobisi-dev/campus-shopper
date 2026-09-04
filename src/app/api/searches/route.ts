import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
