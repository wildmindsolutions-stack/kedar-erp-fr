'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { canAccessRoute, ROLE_HOME } from '@/lib/permissions';

export function ModuleGuard({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const canView = !!user && canAccessRoute(user.role, user.permissions || [], pathname);

  useEffect(() => {
    if (!ready || !user || canView) return;
    toast.error('Access denied', {
      description: 'Your role does not have permission to open this page.',
    });
    router.replace(ROLE_HOME[user.role] || '/dashboard');
  }, [user, ready, canView, pathname, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
