import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const adminVerified = cookieStore.get('admin_verified');

  // Check Supabase session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !adminVerified) {
    redirect('/admin/login');
  }

  // Verify still in admins table
  const { data: adminRow } = await supabase
    .from('admins')
    .select('display_name')
    .eq('id', user.id)
    .single();

  if (!adminRow) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AdminHeader adminName={adminRow.display_name || 'Administrator'} />
      <main className="p-6">{children}</main>
    </div>
  );
}

