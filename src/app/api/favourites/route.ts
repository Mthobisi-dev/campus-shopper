import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// GET favourites for a userId
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ favourites: [], count: 0 });
  }

  try {
    const { data: favs, error } = await supabaseAdmin
      .from('favourites')
      .select('*, product:products(*, vendor:vendors(*))')
      .eq('profile_id', userId)
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ favourites: favs || [], count: favs?.length || 0 });
  } catch (err: any) {
    console.error('Error fetching favourites:', err);
    return NextResponse.json({ favourites: [], count: 0 });
  }
}

// POST toggle favourite (add or remove)
export async function POST(req: NextRequest) {
  try {
    const { userId, productId, isFavourite } = await req.json();
    if (!userId || !productId) {
      return NextResponse.json({ error: 'Missing userId or productId' }, { status: 400 });
    }

    if (isFavourite) {
      await supabaseAdmin
        .from('favourites')
        .upsert({ profile_id: userId, product_id: productId }, { onConflict: 'profile_id,product_id' });
    } else {
      await supabaseAdmin
        .from('favourites')
        .delete()
        .eq('profile_id', userId)
        .eq('product_id', productId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error toggling favourite:', err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

// DELETE clear all favourites
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ success: false });
  }

  try {
    await supabaseAdmin.from('favourites').delete().eq('profile_id', userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error clearing favourites:', err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
