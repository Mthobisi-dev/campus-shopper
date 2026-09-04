'use client';

import Link from 'next/link';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminHeader({ adminName }: { adminName: string }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-hidden">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-sm sm:text-base">CampusShopper</span>
          <span className="text-gray-500 text-xs sm:text-sm ml-1.5 hidden xs:inline">Admin</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">{adminName}</p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>

        <Link
          href="/admin/dashboard"
          className="text-xs sm:text-sm text-gray-400 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-gray-800"
        >
          Dashboard
        </Link>

        <button
          onClick={handleLogout}
          type="button"
          className="flex items-center gap-1.5 text-xs font-semibold text-red-300 bg-red-950/70 border border-red-800/80 hover:bg-red-900/80 px-2.5 sm:px-3.5 py-2 rounded-xl transition shadow-md min-h-[36px]"
          id="admin-logout-btn"
        >
          <LogOut className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="hidden sm:inline">Log Out Admin</span>
          <span className="sm:hidden">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
