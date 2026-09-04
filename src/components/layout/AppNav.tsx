'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, Heart, History, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favourites', label: 'Saved', icon: Heart },
  { href: '/history', label: 'History', icon: History },
  { href: '/preferences', label: 'Profile', icon: Settings },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-between px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase()}`}
              className={active ? 'nav-link-active' : 'nav-link'}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] sm:text-xs tracking-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
