'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ROLE_HOME, canAccessModule } from '@/lib/permissions';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const home = ROLE_HOME[user.role] || '/dashboard';
    if (home === '/dashboard' && !canAccessModule(user.role, user.permissions || [], 'dashboard')) {
      router.replace('/sales');
    } else {
      router.replace(home);
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}
