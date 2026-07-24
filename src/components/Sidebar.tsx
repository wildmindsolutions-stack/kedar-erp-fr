'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Factory,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Truck,
  Settings,
  LogOut,
  Menu,
  X,
  Box,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { NAV_GROUPS, canAccessModule } from '@/lib/permissions';
import { BrandLogo } from '@/components/BrandLogo';

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  factory: Factory,
  package: Package,
  cart: ShoppingCart,
  users: Users,
  credit: CreditCard,
  truck: Truck,
  box: Box,
  settings: Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const role = user?.role || '';
  const perms = user?.permissions || [];

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.module === 'users') {
        return role === 'Owner' || role === 'Admin';
      }
      return canAccessModule(role, perms, item.module);
    }),
  })).filter((g) => g.items.length > 0);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-kedar-navy/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-kedar-navy text-kedar-gold shadow-lg lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,17rem)] flex-col bg-kedar-navy text-white shadow-2xl transition-transform duration-200 ease-out lg:z-40 lg:w-64 lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-kedar-gold/20 px-5 py-4 pt-14 lg:px-6 lg:py-5 lg:pt-5">
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <BrandLogo size="md" light />
          </Link>
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {filteredGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-kedar-gold/70">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ICONS[item.icon] || Package;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-kedar-gold font-medium text-kedar-navy'
                          : 'text-white/75 hover:bg-kedar-navy-light hover:text-white',
                      )}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-kedar-gold/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-1 truncate text-sm font-medium text-white">{user?.name}</div>
          <div className="mb-3 truncate text-xs text-kedar-gold/80">{user?.role}</div>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-kedar-navy-light"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
