'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 2,
        retryDelay: (attempt) => Math.min(2000 * (attempt + 1), 8000),
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          toastOptions={{
            className: 'max-[480px]:!left-4 max-[480px]:!right-4 max-[480px]:!w-auto',
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
