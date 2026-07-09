'use client';

import { usePathname } from 'next/navigation';
import { NotificationPanel } from './NotificationPanel';
import { useAuth } from '@/lib/auth';
import { MODULE_META, getModuleFromPath } from '@/lib/permissions';

export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const moduleKey = getModuleFromPath(pathname);
  const meta = MODULE_META[moduleKey] || MODULE_META.dashboard;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pl-14 pr-3 py-2.5 backdrop-blur sm:pl-16 sm:pr-4 lg:pl-8 lg:pr-8 lg:py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{meta.title}</h2>
          <p className="hidden truncate text-xs text-slate-500 sm:block">{meta.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <NotificationPanel />
          <div className="hidden text-right md:block">
            <p className="max-w-[120px] truncate text-sm font-medium text-slate-900 lg:max-w-none">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
