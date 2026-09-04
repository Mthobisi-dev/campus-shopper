import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const ADMIN_SECRET = process.env.ADMIN_SECRET_CODE;

export async function POST(request: Request) {
  const { secretCode } = await request.json();

  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'Admin access not configured' }, { status: 500 });
  }

  if (secretCode !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Invalid admin code' }, { status: 403 });
  }

  // Verify user is logged in AND is in the admins table
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: adminRow } = await supabase
    .from('admins')
    .select('id, display_name')
    .eq('id', user.id)
    .single();

  if (!adminRow) {
    return NextResponse.json({ error: 'This account does not have admin privileges' }, { status: 403 });
  }

  // Set admin_verified cookie (httpOnly, secure)
  const response = NextResponse.json({ success: true, admin: adminRow });
  response.cookies.set('admin_verified', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_verified');
  return response;
}
