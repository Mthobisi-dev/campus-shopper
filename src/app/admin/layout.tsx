import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ShieldCheck, LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white">CampusShopper</span>
            <span className="text-gray-500 text-sm ml-2">Admin Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{adminRow.display_name}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>

          <Link
            href="/admin/dashboard"
            className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
          >
            Dashboard
          </Link>

          <form action="/api/admin/auth" method="POST">
            <button
              formAction="/api/admin/logout"
              onClick={async () => {
                await fetch('/api/admin/auth', { method: 'DELETE' });
                window.location.href = '/admin/login';
              }}
              type="button"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition px-3 py-1.5 rounded-lg hover:bg-gray-800"
              id="admin-logout"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
