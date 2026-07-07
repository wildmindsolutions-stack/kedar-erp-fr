'use client';

import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ModuleGuard } from '@/components/ModuleGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="min-w-0 lg:pl-64">
          <TopBar />
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8">
            <ModuleGuard>{children}</ModuleGuard>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
