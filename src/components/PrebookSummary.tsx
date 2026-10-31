'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Summary {
  pending: number;
  confirmed: number;
  delivered: number;
  openValue: number;
  cashWithStaff: number;
  demand: { productId: string; productName: string; required: number; stock: number; shortfall: number }[];
}

/** Open pre-bookings count as demand, so production can plan before delivery. */
export function PrebookSummary({ demandOnly = false }: { demandOnly?: boolean }) {
  const { data } = useQuery({
    queryKey: ['prebook-summary'],
    queryFn: () => api.get<Summary>('/prebookings/summary').then((r) => r.data),
    refetchInterval: 60_000,
  });
  if (!data) return null;
  if (demandOnly && data.demand.length === 0) return null;

  const tiles = [
    { label: 'To confirm', value: String(data.pending) },
    { label: 'In delivery', value: String(data.confirmed) },
    { label: 'Open order value', value: formatCurrency(data.openValue) },
    { label: 'Cash with delivery staff', value: formatCurrency(data.cashWithStaff) },
  ];

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">{demandOnly ? 'Pre-booking demand' : 'Pre-bookings'}</h2>
        {!demandOnly && (
          <Link href="/sales/pre-bookings" className="text-sm font-medium text-kedar-navy hover:underline">
            Open
          </Link>
        )}
      </div>

      {!demandOnly && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{t.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{t.value}</p>
            </div>
          ))}
        </div>
      )}

      {data.demand.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="py-1 font-medium">Product</th>
              <th className="py-1 text-right font-medium">Booked</th>
              <th className="py-1 text-right font-medium">In stock</th>
              <th className="py-1 text-right font-medium">To make</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.demand.map((d) => (
              <tr key={d.productId}>
                <td className="py-1.5 text-slate-700">{d.productName}</td>
                <td className="py-1.5 text-right tabular-nums">{d.required}</td>
                <td className="py-1.5 text-right tabular-nums">{d.stock}</td>
                <td className={`py-1.5 text-right font-medium tabular-nums ${d.shortfall > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {d.shortfall}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
