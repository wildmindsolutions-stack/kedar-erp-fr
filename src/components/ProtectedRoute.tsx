'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.push('/login');
    }
  }, [user, ready, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-kedar-cream px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-kedar-gold border-t-transparent" />
        <p className="text-sm text-kedar-navy/60">Starting Kedar ERP…</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
