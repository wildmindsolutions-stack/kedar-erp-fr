'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { MODULE_META } from '@/lib/permissions';

interface ModuleHeaderProps {
  module: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function ModuleHeader({ module, icon: Icon, actions }: ModuleHeaderProps) {
  const meta = MODULE_META[module];
  if (!meta) return null;

  return (
    <div className="mb-5 sm:mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kedar-navy text-kedar-gold shadow-sm sm:h-11 sm:w-11">
              <Icon size={21} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{meta.title}</h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{meta.description}</p>
          </div>
        </div>
        {actions && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
