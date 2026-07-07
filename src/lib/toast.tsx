'use client';

import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function parseAmount(value: string): number {
  return Number(value.replace(/[₹,\s]/g, '')) || 0;
}

function parseCreditLimitDetails(message: string) {
  const match = message.match(
    /credit limit:\s*([^,]+),\s*outstanding:\s*([^,]+),\s*order total:\s*([^,]+),\s*available credit:\s*([^.]+)/i,
  );
  if (!match) return null;

  const creditLimit = parseAmount(match[1]);
  const outstanding = parseAmount(match[2]);
  const orderTotal = parseAmount(match[3]);
  const availableCredit = parseAmount(match[4]);
  const shortfall = Math.max(0, orderTotal - availableCredit);

  return { creditLimit, outstanding, orderTotal, availableCredit, shortfall };
}

function CreditLimitToast({ id, details }: {
  id: string | number;
  details: ReturnType<typeof parseCreditLimitDetails>;
}) {
  const rows = details
    ? [
        { label: 'Credit limit', value: formatCurrency(details.creditLimit), tone: 'text-slate-800' },
        { label: 'Outstanding', value: formatCurrency(details.outstanding), tone: 'text-slate-800' },
        { label: 'Order total', value: formatCurrency(details.orderTotal), tone: 'text-red-600 font-semibold' },
        { label: 'Available credit', value: formatCurrency(details.availableCredit), tone: 'text-emerald-700 font-medium' },
      ]
    : [];

  return (
    <div className="flex w-[min(100vw-2rem,22rem)] gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-lg">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-5 w-5 text-red-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-red-800">Credit limit exceeded</p>
          <button
            type="button"
            onClick={() => toast.dismiss(id)}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          This order cannot be confirmed. The customer does not have enough available credit.
        </p>
        {details && (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/80">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0"
              >
                <span className="text-xs text-slate-500">{row.label}</span>
                <span className={`text-xs tabular-nums ${row.tone}`}>{row.value}</span>
              </div>
            ))}
            {details.shortfall > 0 && (
              <div className="flex items-center justify-between gap-3 bg-red-50 px-3 py-2">
                <span className="text-xs font-medium text-red-700">Shortfall</span>
                <span className="text-xs font-semibold tabular-nums text-red-700">
                  {formatCurrency(details.shortfall)}
                </span>
              </div>
            )}
          </div>
        )}
        <p className="mt-2.5 text-[11px] text-slate-500">
          Reduce the order amount or increase the customer&apos;s credit limit.
        </p>
      </div>
    </div>
  );
}

export function toastSuccess(message: string, description?: string) {
  toast.success(message, { description, duration: 4000 });
}

export function toastError(message: string, description?: string) {
  toast.error(message, { description, duration: 5000 });
}

export function toastApiError(error: unknown, fallback?: string) {
  toastError(getApiErrorMessage(error, fallback));
}

export function toastCreditLimitError(error: unknown) {
  const message = getApiErrorMessage(error);
  const details = parseCreditLimitDetails(message);

  toast.custom(
    (id) => <CreditLimitToast id={id} details={details} />,
    { duration: 8000 },
  );
}
