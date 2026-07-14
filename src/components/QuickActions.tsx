'use client';

import Link from 'next/link';
import { Factory, Package, ShoppingCart, CreditCard, Truck, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { canWriteModule } from '@/lib/permissions';

const ACTIONS = [
  { label: 'Production Entry', href: '/manufacturing', module: 'manufacturing', icon: Factory, color: 'bg-kedar-gold/15 text-kedar-navy hover:bg-kedar-gold/25' },
  { label: 'Stock Check', href: '/inventory', module: 'inventory', icon: Package, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  { label: 'New Sales Order', href: '/sales', module: 'sales', icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { label: 'Record Payment', href: '/payments', module: 'payments', icon: CreditCard, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { label: 'Create Challan', href: '/delivery', module: 'delivery', icon: Truck, color: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
  { label: 'Add Customer', href: '/customers', module: 'customers', icon: Users, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
];

export function QuickActions() {
  const { user } = useAuth();
  const perms = user?.permissions || [];
  const role = user?.role || '';

  const actions = ACTIONS.filter((a) => canWriteModule(role, perms, a.module));

  if (!actions.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-3 text-xs font-medium transition-colors sm:py-2.5 ${a.color}`}
            >
              <Icon size={16} />
              {a.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
