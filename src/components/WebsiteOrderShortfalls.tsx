'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ShortfallLine {
  productName: string;
  ordered: number;
  unit: string;
  available: number;
  shortfall: number;
}

interface WebsiteShortfall {
  orderId: string;
  customerName: string;
  orderDate: string;
  shortfalls: ShortfallLine[];
}

interface WebsiteOrderShortfallsProps {
  endpoint: '/manufacturing/website-shortfalls' | '/inventory/website-shortfalls';
  focusOrderId?: string | null;
}

export function WebsiteOrderShortfalls({ endpoint, focusOrderId }: WebsiteOrderShortfallsProps) {
  const { data: entries = [] } = useQuery({
    queryKey: ['website-shortfalls', endpoint],
    queryFn: () => api.get<WebsiteShortfall[]>(endpoint).then((r) => r.data),
    refetchInterval: 30000,
  });

  if (!entries.length) return null;

  const visible = focusOrderId
    ? entries.filter((e) => e.orderId === focusOrderId)
    : entries;

  if (!visible.length) return null;

  return (
    <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-900">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Website orders awaiting stock
      </div>
      <ul className="space-y-3">
        {visible.map((entry) => (
          <li key={entry.orderId} className="rounded-md border border-orange-100 bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-slate-900">
                {entry.customerName}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {formatDate(entry.orderDate)}
                </span>
              </p>
              <Link
                href={`/sales?highlight=${entry.orderId}`}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                View in Sales →
              </Link>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {entry.shortfalls.map((line) => (
                <li key={`${entry.orderId}-${line.productName}`}>
                  <span className="font-medium text-slate-800">{line.productName}</span>
                  {' — '}
                  need {line.shortfall} {line.unit} production
                  {' '}
                  <span className="text-slate-500">
                    ({line.available} {line.unit} in stock, {line.ordered} {line.unit} ordered)
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
