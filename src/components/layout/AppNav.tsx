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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/5 rounded-none px-2 py-2 safe-area-inset-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase()}`}
              className={active ? 'nav-link-active' : 'nav-link'}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
