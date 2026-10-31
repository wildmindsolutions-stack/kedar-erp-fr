'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { ModuleHeader } from '@/components/ModuleHeader';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CalendarCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { canWriteModule, canConfirmSalesOrders } from '@/lib/permissions';
import { toastApiError, toastSuccess } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';

type Status = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

interface PreBooking {
  id: string;
  bookingNo: string;
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string | null;
  cancelReason?: string | null;
  status: Status;
  paymentReceived: boolean;
  total: number | string;
  createdAt: string;
  outForDeliveryAt?: string | null;
  area?: { name: string } | null;
  executive?: { name: string } | null;
  items: { id: string; productName: string; packSize?: string | null; qty: number | string; rate: number | string; lineTotal: number | string }[];
  salesOrder?: {
    invoice?: { id: string; invoiceNo: string; total: number | string; withGst?: boolean } | null;
  } | null;
}

const STATUS_TABS: { value: 'ALL' | Status; label: string }[] = [
  { value: 'PENDING', label: 'To confirm' },
  { value: 'CONFIRMED', label: 'In delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ALL', label: 'All' },
];

const STATUS_STYLES: Record<Status, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function stageLabel(b: PreBooking) {
  if (b.status === 'PENDING') return 'To confirm';
  if (b.status === 'CANCELLED') return 'Cancelled';
  if (b.status === 'DELIVERED') return b.paymentReceived ? 'Delivered · paid' : 'Delivered · cash pending';
  if (b.outForDeliveryAt) return 'Out for delivery';
  return b.executive ? `With ${b.executive.name}` : 'Waiting for executive';
}

export default function PreBookingsPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
      <PreBookingsPageContent />
    </Suspense>
  );
}

function PreBookingsPageContent() {
  const queryClient = useQueryClient();
  const highlightId = useSearchParams().get('highlight');
  const { user } = useAuth();
  const canWrite = canWriteModule(user?.role || '', user?.permissions || [], 'sales');
  const canInvoice = canConfirmSalesOrders(user?.role || '');
  const [tab, setTab] = useState<'ALL' | Status>('PENDING');
  const [viewId, setViewId] = useState<string | null>(highlightId);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['prebookings'],
    queryFn: () => api.get<PreBooking[]>('/prebookings').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: bookings.length };
    for (const b of bookings) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [bookings]);

  const filtered = tab === 'ALL' ? bookings : bookings.filter((b) => b.status === tab);

  const invalidate = () => {
    for (const key of ['prebookings', 'delivery-board', 'orders', 'sales-invoices', 'inventory', 'customers', 'payments', 'dashboard']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.post(`/prebookings/${id}/confirm`, {}),
    onSuccess: () => {
      invalidate();
      toastSuccess('Confirmed', 'Sent to the delivery supervisor.');
    },
    onError: (error) => toastApiError(error, 'Could not confirm pre-booking.'),
  });

  const invoiceMutation = useMutation({
    mutationFn: ({ id, withGst }: { id: string; withGst: boolean }) =>
      api.post<{ invoiceNo: string; total: number }>(`/prebookings/${id}/generate-invoice`, { withGst }),
    onSuccess: (res) => {
      invalidate();
      setInvoiceId(null);
      toastSuccess('Invoice generated', `${res.data.invoiceNo} — ${formatCurrency(Number(res.data.total))}`);
    },
    onError: (error) => toastApiError(error, 'Could not generate invoice.'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/prebookings/${id}/cancel`, { reason }),
    onSuccess: () => {
      invalidate();
      toastSuccess('Pre-booking cancelled');
    },
    onError: (error) => toastApiError(error, 'Could not cancel pre-booking.'),
  });

  const downloadPdf = async (id: string) => {
    setPdfLoadingId(id);
    try {
      const res = await api.get(`/sales/invoices/${id}/pdf`, { responseType: 'blob' });
      window.open(URL.createObjectURL(res.data), '_blank');
    } catch (error) {
      toastApiError(error, 'Could not generate PDF.');
    } finally {
      setPdfLoadingId(null);
    }
  };

  const columns: ColumnDef<PreBooking>[] = [
    {
      accessorKey: 'bookingNo',
      header: 'Booking',
      cell: ({ row }) => (
        <div>
          <button type="button" onClick={() => setViewId(row.original.id)} className="font-mono text-xs font-semibold text-kedar-navy hover:underline">
            {row.original.bookingNo}
          </button>
          <p className="text-xs text-slate-500">{formatDate(row.original.createdAt)}</p>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.name}</p>
          <a href={`tel:${row.original.phone}`} className="text-xs text-slate-500 hover:text-kedar-navy">{row.original.phone}</a>
        </div>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      cell: ({ row }) => (
        <ul className="max-w-xs space-y-0.5 text-xs text-slate-700">
          {row.original.items.map((i) => (
            <li key={i.id}>
              {Number(i.qty)} × {i.productName}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'area',
      header: 'Area',
      cell: ({ row }) => <span className="text-xs text-slate-700">{row.original.area?.name ?? row.original.pincode}</span>,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => <span className="tabular-nums font-medium">{formatCurrency(Number(row.original.total))}</span>,
    },
    {
      id: 'stage',
      header: 'Status',
      cell: ({ row }) => (
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[row.original.status])}>
          {stageLabel(row.original)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const b = row.original;
        const invoice = b.salesOrder?.invoice;
        return (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {b.status === 'PENDING' && canWrite && (
              <ActionButton
                size="sm"
                loading={confirmMutation.isPending && confirmMutation.variables === b.id}
                loadingText="Confirming..."
                onClick={() => confirmMutation.mutate(b.id)}
              >
                Confirm
              </ActionButton>
            )}
            {b.status === 'DELIVERED' && !invoice && canInvoice && (
              <ActionButton size="sm" variant="secondary" onClick={() => setInvoiceId(b.id)}>
                Invoice
              </ActionButton>
            )}
            {invoice && (
              <ActionButton
                size="sm"
                variant="secondary"
                loading={pdfLoadingId === invoice.id}
                loadingText="PDF..."
                onClick={() => downloadPdf(invoice.id)}
              >
                {invoice.invoiceNo}
              </ActionButton>
            )}
            {(b.status === 'PENDING' || b.status === 'CONFIRMED') && canWrite && !invoice && (
              <ActionButton
                size="sm"
                variant="ghost"
                onClick={() => {
                  const reason = window.prompt(`Cancel ${b.bookingNo}? Enter a reason:`);
                  if (reason !== null) cancelMutation.mutate({ id: b.id, reason });
                }}
              >
                Cancel
              </ActionButton>
            )}
          </div>
        );
      },
    },
  ];

  const viewing = bookings.find((b) => b.id === viewId);
  const invoicing = bookings.find((b) => b.id === invoiceId);

  return (
    <div>
      <ModuleHeader module="pre-bookings" icon={CalendarCheck} />

      <p className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Confirm new orders here. Delivery then happens on the{' '}
        <Link href="/delivery/board" className="font-medium text-kedar-navy underline">
          Delivery Board
        </Link>
        , which updates stock and cash automatically.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              'min-h-[40px] rounded-md px-4 py-2 text-sm transition-colors sm:min-h-0',
              tab === t.value ? 'bg-kedar-navy text-kedar-gold' : 'border border-slate-200 bg-white hover:bg-kedar-cream',
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">{counts[t.value] ?? 0}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <DataTable columns={columns} data={filtered} searchKey="name" searchPlaceholder="Search name or booking no..." />
      )}

      {viewing && (
        <Modal onClose={() => setViewId(null)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-kedar-navy">{viewing.bookingNo}</h3>
              <p className="text-xs text-slate-500">Booked {formatDate(viewing.createdAt)} · Cash on delivery</p>
            </div>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[viewing.status])}>
              {stageLabel(viewing)}
            </span>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-900">{viewing.name}</p>
            <p className="text-slate-600">
              <a href={`tel:${viewing.phone}`} className="hover:underline">{viewing.phone}</a>
              {viewing.email ? ` · ${viewing.email}` : ''}
            </p>
            <p className="mt-1 text-slate-600">{viewing.address}</p>
            <p className="text-slate-600">{viewing.city}, {viewing.state} – {viewing.pincode}</p>
          </div>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {viewing.items.map((i) => (
                <tr key={i.id}>
                  <td className="py-1.5 text-slate-700">{i.productName}</td>
                  <td className="py-1.5 text-right text-slate-500">{Number(i.qty)} × {formatCurrency(Number(i.rate))}</td>
                  <td className="py-1.5 text-right font-medium tabular-nums">{formatCurrency(Number(i.lineTotal))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={2} className="pt-2 text-right font-medium">Total (5% tax incl.)</td>
                <td className="pt-2 text-right font-semibold tabular-nums">{formatCurrency(Number(viewing.total))}</td>
              </tr>
            </tfoot>
          </table>
          {viewing.notes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Note: {viewing.notes}</p>}
          {viewing.cancelReason && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">Cancelled: {viewing.cancelReason}</p>}
          <div className="mt-5 flex justify-end">
            <ActionButton type="button" variant="secondary" onClick={() => setViewId(null)}>Close</ActionButton>
          </div>
        </Modal>
      )}

      {invoicing && (
        <Modal onClose={() => !invoiceMutation.isPending && setInvoiceId(null)}>
          <h3 className="text-lg font-semibold text-kedar-navy">Generate Invoice</h3>
          <p className="mt-2 text-sm text-slate-600">
            {invoicing.bookingNo} · <span className="font-medium text-slate-900">{invoicing.name}</span> · {formatCurrency(Number(invoicing.total))}
          </p>
          <div className="mt-5 space-y-3">
            {[true, false].map((withGst) => (
              <button
                key={String(withGst)}
                type="button"
                disabled={invoiceMutation.isPending}
                onClick={() => invoiceMutation.mutate({ id: invoicing.id, withGst })}
                className={cn(
                  'w-full rounded-lg border p-3 text-left text-sm font-semibold transition disabled:opacity-60',
                  withGst ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100' : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100',
                )}
              >
                {withGst ? 'Tax Invoice (5% GST included)' : 'Invoice without GST lines'}
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <ActionButton type="button" variant="secondary" disabled={invoiceMutation.isPending} onClick={() => setInvoiceId(null)}>Close</ActionButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-kedar-navy/50 p-4 backdrop-blur-[1px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}
