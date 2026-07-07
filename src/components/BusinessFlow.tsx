'use client';

import { cn } from '@/lib/utils';
import { Factory, Package, ShoppingCart, FileText, CreditCard, Truck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { canAccessModule } from '@/lib/permissions';

const STEPS = [
  { step: 1, label: 'Production', icon: Factory, href: '/manufacturing', module: 'manufacturing' },
  { step: 2, label: 'Inventory', icon: Package, href: '/inventory', module: 'inventory' },
  { step: 3, label: 'Sales Order', icon: ShoppingCart, href: '/sales', module: 'sales' },
  { step: 4, label: 'GST Invoice', icon: FileText, href: '/sales', module: 'sales' },
  { step: 5, label: 'Delivery', icon: Truck, href: '/delivery', module: 'delivery' },
  { step: 6, label: 'Payment', icon: CreditCard, href: '/payments', module: 'payments' },
];

interface BusinessFlowProps {
  activeStep?: number;
  compact?: boolean;
}

export function BusinessFlow({ activeStep, compact }: BusinessFlowProps) {
  const { user } = useAuth();
  const perms = user?.permissions || [];
  const role = user?.role || '';

  const visibleSteps = STEPS.filter((s) => canAccessModule(role, perms, s.module));

  if (visibleSteps.length === 0) return null;

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white', compact ? 'p-4' : 'p-6')}>
      {!compact && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Business Flow</h3>
          <p className="text-xs text-slate-500">Manufacturing → Inventory → Sales → Invoice → Delivery → Payment</p>
        </div>
      )}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {visibleSteps.map((s, i) => {
          const Icon = s.icon;
          const isActive = activeStep === s.step;
          return (
            <div key={s.step} className="flex items-center">
              <Link
                href={s.href}
                className={cn(
                  'flex min-w-[80px] flex-col items-center gap-1.5 rounded-lg px-3 py-2 transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <Icon size={compact ? 16 : 20} />
                <span className="text-[10px] font-medium leading-tight text-center">{s.label}</span>
              </Link>
              {i < visibleSteps.length - 1 && (
                <div className="mx-1 h-px w-4 shrink-0 bg-slate-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
