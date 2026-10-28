'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { ModuleHeader } from '@/components/ModuleHeader';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CalendarCheck, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { canWriteModule, canConfirmSalesOrders } from '@/lib/permissions';
import { getApiErrorMessage, toastApiError, toastCreditLimitError, toastSuccess } from '@/lib/toast';
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
  status: Status;
  paymentMode: string;
  paymentReceived: boolean;
  total: number | string;
  createdAt: string;
  confirmedAt?: string | null;
  deliveredAt?: string | null;
  items: { id: string; productName: string; packSize?: string | null; qty: number | string; rate: number | string; lineTotal: number | string }[];
  salesOrder?: {
    id: string;
    status: string;
    invoice?: { id: string; invoiceNo: string; total: number | string; withGst?: boolean } | null;
  } | null;
}

const STATUS_TABS: { value: 'ALL' | Status; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_STYLES: Record<Status, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function PreBookingsPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
      <PreBookingsPageContent />
    </Suspense>
  );
}

function PreBookingsPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { user } = useAuth();
  const canWrite = canWriteModule(user?.role || '', user?.permissions || [], 'sales');
  const canConfirm = canConfirmSalesOrders(user?.role || '');
  const [tab, setTab] = useState<'ALL' | Status>('ALL');
  const [viewId, setViewId] = useState<string | null>(highlightId);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [invoiceGenId, setInvoiceGenId] = useState<string | null>(null);
  const [deliverId, setDeliverId] = useState<string | null>(null);
  const [cashCollected, setCashCollected] = useState(true);
  const [deliverGenerateInvoice, setDeliverGenerateInvoice] = useState(false);
  const [deliverWithGst, setDeliverWithGst] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
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
    queryClient.invalidateQueries({ queryKey: ['prebookings'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['delivery-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const confirmMutation = useMutation({
    mutationFn: ({ id, generateInvoice, withGst }: { id: string; generateInvoice?: boolean; withGst?: boolean }) =>
      api.post<{ invoice?: { invoiceNo: string; total: number } | null; bookingNo: string }>(`/prebookings/${id}/confirm`, {
        generateInvoice,
        withGst,
      }),
    onSuccess: (res, variables) => {
      invalidate();
      setConfirmId(null);
      if (variables.generateInvoice && res.data.invoice) {
        const label = variables.withGst ? 'Tax Invoice' : 'Invoice (without GST)';
        toastSuccess(`${label} generated`, `${res.data.invoice.invoiceNo} — ${formatCurrency(Number(res.data.invoice.total))}`);
      } else {
        toastSuccess('Pre-booking confirmed', `${res.data.bookingNo} is confirmed and ready for dispatch.`);
      }
    },
    onError: (error) => {
      if (getApiErrorMessage(error).toLowerCase().includes('credit limit')) {
        toastCreditLimitError(error);
      } else {
        toastApiError(error, 'Could not confirm pre-booking.');
      }
    },
    onSettled: () => setActionId(null),
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: ({ id, withGst }: { id: string; withGst: boolean }) =>
      api.post<{ invoiceNo: string; total: number }>(`/prebookings/${id}/generate-invoice`, { withGst }),
    onSuccess: (res, variables) => {
      invalidate();
      setInvoiceGenId(null);
      const label = variables.withGst ? 'Tax Invoice (5% GST included)' : 'Invoice (Without GST)';
      toastSuccess(`${label} generated`, `${res.data.invoiceNo} — ${formatCurrency(Number(res.data.total))}`);
    },
    onError: (error) => toastApiError(error, 'Could not generate invoice.'),
    onSettled: () => setActionId(null),
  });

  const deliverMutation = useMutation({
    mutationFn: ({
      id,
      paymentReceived,
      generateInvoice,
      withGst,
    }: {
      id: string;
      paymentReceived: boolean;
      generateInvoice?: boolean;
      withGst?: boolean;
    }) =>
      api.patch(`/prebookings/${id}/delivered`, { paymentReceived, generateInvoice, withGst }),
    onSuccess: (_res, variables) => {
      invalidate();
      setDeliverId(null);
      toastSuccess(
        'Marked as delivered',
        variables.paymentReceived ? 'Cash payment recorded.' : undefined,
      );
    },
    onError: (error) => toastApiError(error, 'Could not mark as delivered.'),
    onSettled: () => setActionId(null),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/prebookings/${id}/cancel`, {}),
    onSuccess: () => {
      invalidate();
      toastSuccess('Pre-booking cancelled');
    },
    onError: (error) => toastApiError(error, 'Could not cancel pre-booking.'),
    onSettled: () => setActionId(null),
  });

  const downloadPdf = async (invoiceId: string) => {
    setPdfLoadingId(invoiceId);
    try {
      const res = await api.get(`/sales/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
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
          {highlightId === row.original.id && (
            <span className="mt-1 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">From notification</span>
          )}
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
      id: 'location',
      header: 'Delivery',
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="text-slate-700">{row.original.city}</p>
          <p className="text-slate-500">{row.original.pincode}</p>
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
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <div>
          <span className="tabular-nums font-medium">{formatCurrency(Number(row.original.total))}</span>
          <span className="block text-[10px] text-slate-400">5% tax incl.</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[row.original.status])}>
            {row.original.status}
          </span>
          {row.original.status === 'DELIVERED' && (
            <span className={cn('text-[10px] font-medium', row.original.paymentReceived ? 'text-emerald-700' : 'text-orange-700')}>
              {row.original.paymentReceived ? 'Cash collected' : 'Payment pending'}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'invoice',
      header: 'Invoice',
      cell: ({ row }) => {
        const inv = row.original.salesOrder?.invoice;
        if (inv) {
          return (
            <div>
              <span className="font-mono text-xs font-semibold text-emerald-800">{inv.invoiceNo}</span>
              <span className="block text-[10px] text-slate-500">{inv.withGst ? 'Tax Invoice' : 'Bill of Supply'}</span>
            </div>
          );
        }
        return <span className="text-xs text-slate-400">Not generated</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const b = row.original;
        const invoice = b.salesOrder?.invoice;
        return (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {/* PENDING ACTIONS */}
            {b.status === 'PENDING' && canConfirm && (
              <ActionButton
                size="sm"
                loading={actionId === b.id && confirmMutation.isPending}
                loadingText="Confirming..."
                onClick={() => setConfirmId(b.id)}
              >
                Confirm Order
              </ActionButton>
            )}
            {b.status === 'PENDING' && !canConfirm && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Awaiting confirmation</span>
            )}

            {/* CONFIRMED ACTIONS */}
            {b.status === 'CONFIRMED' && canWrite && (
              <ActionButton
                size="sm"
                variant="success"
                loading={actionId === b.id && deliverMutation.isPending}
                loadingText="Saving..."
                onClick={() => {
                  setCashCollected(true);
                  setDeliverGenerateInvoice(false);
                  setDeliverWithGst(true);
                  setDeliverId(b.id);
                }}
              >
                Mark Delivered
              </ActionButton>
            )}

            {/* MANUAL INVOICE GENERATION (At delivery or anytime after) */}
            {(b.status === 'CONFIRMED' || b.status === 'DELIVERED') && !invoice && canConfirm && (
              <ActionButton
                size="sm"
                variant="secondary"
                loading={actionId === b.id && generateInvoiceMutation.isPending}
                loadingText="Generating..."
                onClick={() => setInvoiceGenId(b.id)}
              >
                Generate Invoice
              </ActionButton>
            )}

            {/* INVOICE PDF DOWNLOAD (If invoice generated) */}
            {invoice && (
              <ActionButton
                size="sm"
                variant="secondary"
                loading={pdfLoadingId === invoice.id}
                loadingText="PDF..."
                onClick={() => downloadPdf(invoice.id)}
              >
                Invoice PDF
              </ActionButton>
            )}

            {/* CANCEL ACTION */}
            {b.status === 'PENDING' && canWrite && (
              <ActionButton
                size="sm"
                variant="ghost"
                loading={actionId === b.id && cancelMutation.isPending}
                loadingText="Cancelling..."
                onClick={() => {
                  if (!confirm(`Cancel pre-booking ${b.bookingNo}?`)) return;
                  setActionId(b.id);
                  cancelMutation.mutate(b.id);
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
  const confirming = bookings.find((b) => b.id === confirmId);
  const invoicing = bookings.find((b) => b.id === invoiceGenId);
  const delivering = bookings.find((b) => b.id === deliverId);
  const busy = confirmMutation.isPending || deliverMutation.isPending || generateInvoiceMutation.isPending;

  return (
    <div>
      <ModuleHeader module="pre-bookings" icon={CalendarCheck} />

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

      {/* Detail modal */}
      {viewing && (
        <Modal onClose={() => setViewId(null)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-kedar-navy">{viewing.bookingNo}</h3>
              <p className="text-xs text-slate-500">Booked {formatDate(viewing.createdAt)} · Cash on delivery (5% GST included)</p>
            </div>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[viewing.status])}>{viewing.status}</span>
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
                  <td className="py-1.5 text-slate-700">
                    {i.productName}
                    {i.packSize && <span className="block text-xs text-slate-400">{i.packSize}</span>}
                  </td>
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
          {viewing.salesOrder?.invoice && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  {viewing.salesOrder.invoice.withGst ? 'Tax Invoice' : 'Invoice'}
                </p>
                <p className="font-mono text-sm font-bold text-emerald-900">{viewing.salesOrder.invoice.invoiceNo}</p>
              </div>
              <ActionButton
                size="sm"
                variant="secondary"
                loading={pdfLoadingId === viewing.salesOrder.invoice.id}
                loadingText="PDF..."
                onClick={() => downloadPdf(viewing.salesOrder!.invoice!.id)}
              >
                Download PDF
              </ActionButton>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <ActionButton type="button" variant="secondary" onClick={() => setViewId(null)}>Close</ActionButton>
          </div>
        </Modal>
      )}

      {/* Confirm Pre-booking modal */}
      {confirming && (
        <Modal onClose={() => !busy && setConfirmId(null)}>
          <h3 className="text-lg font-semibold text-kedar-navy">Confirm Pre-booking</h3>
          <p className="mt-2 text-sm text-slate-600">
            {confirming.bookingNo} · <span className="font-medium text-slate-900">{confirming.name}</span> · {formatCurrency(Number(confirming.total))}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Confirming puts this pre-booking in line for fulfillment and delivery. An official invoice can either be generated now or later when delivered / requested by customer.
          </p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setActionId(confirming.id);
                confirmMutation.mutate({ id: confirming.id, generateInvoice: false });
              }}
              className="w-full rounded-lg border border-blue-200 bg-blue-50 p-4 text-left transition hover:bg-blue-100 disabled:opacity-60"
            >
              <p className="text-sm font-semibold text-blue-900">
                Confirm for Delivery (Standard COD)
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Booking status becomes Confirmed. Invoice can be generated manually at delivery or after if customer requests.
              </p>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setActionId(confirming.id);
                confirmMutation.mutate({ id: confirming.id, generateInvoice: true, withGst: true });
              }}
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100 disabled:opacity-60"
            >
              <p className="text-sm font-semibold text-emerald-900">
                Confirm & Generate Tax Invoice (With 5% GST Included)
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Immediately creates Tax Invoice with 5% GST breakdown. Total matches {formatCurrency(Number(confirming.total))}.
              </p>
            </button>
          </div>
          <div className="mt-5 flex justify-end">
            <ActionButton type="button" variant="secondary" disabled={busy} onClick={() => setConfirmId(null)}>Cancel</ActionButton>
          </div>
        </Modal>
      )}

      {/* Manual Invoice Generation modal (On demand at delivery or after) */}
      {invoicing && (
        <Modal onClose={() => !busy && setInvoiceGenId(null)}>
          <div className="flex items-center gap-2 text-kedar-navy">
            <FileText className="h-5 w-5 text-kedar-gold-dark" />
            <h3 className="text-lg font-semibold">Generate Customer Invoice / Receipt</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {invoicing.bookingNo} · <span className="font-medium text-slate-900">{invoicing.name}</span> · {formatCurrency(Number(invoicing.total))}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Generate an official invoice for the customer. The 5% tax is already included in the price and will reflect cleanly on the bill.
          </p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setActionId(invoicing.id);
                generateInvoiceMutation.mutate({ id: invoicing.id, withGst: true });
              }}
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100 disabled:opacity-60"
            >
              <p className="text-sm font-semibold text-emerald-900">
                Tax Invoice (5% GST Included)
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Itemized CGST/SGST/IGST breakdown. Taxable + GST totals to exact pre-booked amount ({formatCurrency(Number(invoicing.total))}).
              </p>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setActionId(invoicing.id);
                generateInvoiceMutation.mutate({ id: invoicing.id, withGst: false });
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100 disabled:opacity-60"
            >
              <p className="text-sm font-semibold text-slate-900">
                Invoice / Bill of Supply (Without GST lines)
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Standard delivery invoice without separate tax lines.
              </p>
            </button>
          </div>
          <div className="mt-5 flex justify-end">
            <ActionButton type="button" variant="secondary" disabled={busy} onClick={() => setInvoiceGenId(null)}>Cancel</ActionButton>
          </div>
        </Modal>
      )}

      {/* Delivered modal */}
      {delivering && (
        <Modal onClose={() => !busy && setDeliverId(null)}>
          <h3 className="text-lg font-semibold text-kedar-navy">Mark as Delivered</h3>
          <p className="mt-2 text-sm text-slate-600">
            {delivering.bookingNo} · <span className="font-medium text-slate-900">{delivering.name}</span>
          </p>
          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={cashCollected}
                onChange={(e) => setCashCollected(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-kedar-navy"
              />
              <span className="text-sm">
                <span className="font-medium text-slate-900">
                  Cash collected ({formatCurrency(Number(delivering.salesOrder?.invoice?.total ?? delivering.total))})
                </span>
                <span className="block text-xs text-slate-500">Records a CASH payment in Payments ledger.</span>
              </span>
            </label>

            {!delivering.salesOrder?.invoice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={deliverGenerateInvoice}
                    onChange={(e) => setDeliverGenerateInvoice(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-kedar-navy"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-slate-900">
                      Customer requested invoice / receipt at delivery
                    </span>
                    <span className="block text-xs text-slate-500">Generates official invoice right now.</span>
                  </span>
                </label>

                {deliverGenerateInvoice && (
                  <div className="mt-3 flex gap-2 pl-7">
                    <button
                      type="button"
                      onClick={() => setDeliverWithGst(true)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition',
                        deliverWithGst ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-700',
                      )}
                    >
                      Tax Invoice (5% GST)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliverWithGst(false)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition',
                        !deliverWithGst ? 'bg-slate-700 text-white' : 'border border-slate-200 bg-white text-slate-700',
                      )}
                    >
                      Invoice (Without GST)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <ActionButton type="button" variant="secondary" disabled={busy} onClick={() => setDeliverId(null)}>Cancel</ActionButton>
            <ActionButton
              type="button"
              variant="success"
              loading={deliverMutation.isPending}
              loadingText="Saving..."
              onClick={() => {
                setActionId(delivering.id);
                deliverMutation.mutate({
                  id: delivering.id,
                  paymentReceived: cashCollected,
                  generateInvoice: deliverGenerateInvoice,
                  withGst: deliverWithGst,
                });
              }}
            >
              Confirm Delivery
            </ActionButton>
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
