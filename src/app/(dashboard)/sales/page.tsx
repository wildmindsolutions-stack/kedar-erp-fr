'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { SelectField } from '@/components/SelectField';
import { formatCurrency, formatDate, formatCustomerOptionLabel } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { ModuleHeader } from '@/components/ModuleHeader';
import { useAuth } from '@/lib/auth';
import { canWriteModule, canConfirmSalesOrders } from '@/lib/permissions';
import { getApiErrorMessage, toastApiError, toastCreditLimitError, toastSuccess } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';

interface Order {
  id: string;
  orderDate: string;
  status: string;
  notes?: string | null;
  customer: { name: string };
  items: { product: { name: string }; qty: number; rate: number }[];
  invoice?: { id: string; invoiceNo: string; total: number; withGst?: boolean };
}

interface SalesInvoice {
  id: string;
  invoiceNo: string;
  issuedAt: string;
  withGst?: boolean;
  order: { customer: { name: string } };
  total: number;
}

const WEBSITE_ORDER_MARKER = 'Kedar Foundation website';

function isWebsiteOrder(notes?: string | null) {
  return Boolean(notes?.includes(WEBSITE_ORDER_MARKER));
}

function hasAwaitingStock(notes?: string | null) {
  return Boolean(notes?.includes('AWAITING_STOCK'));
}

interface OrderItem {
  productId: string;
  qty: number;
  rate: number;
}

export default function SalesPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
      <SalesPageContent />
    </Suspense>
  );
}

function SalesPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { user } = useAuth();
  const canWrite = canWriteModule(user?.role || '', user?.permissions || [], 'sales');
  const canConfirm = canConfirmSalesOrders(user?.role || '');
  const [tab, setTab] = useState<'orders' | 'invoices'>('orders');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', orderDate: new Date().toISOString().split('T')[0], notes: '' });
  const [items, setItems] = useState<OrderItem[]>([{ productId: '', qty: 1, rate: 0 }]);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<Order[]>('/sales/orders').then((r) => r.data),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: () => api.get<SalesInvoice[]>('/sales/invoices').then((r) => r.data),
    enabled: tab === 'invoices',
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<{ id: string; name: string; phone?: string; city?: string }[]>('/customers').then((r) => r.data),
    enabled: showForm,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<{ id: string; name: string; price: number }[]>('/products').then((r) => r.data),
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/sales/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowForm(false);
      setItems([{ productId: '', qty: 1, rate: 0 }]);
      toastSuccess('Sales order created', 'Order saved as DRAFT. Confirm it to generate an invoice.');
    },
    onError: (error) => toastApiError(error, 'Could not create sales order.'),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, withGst }: { id: string; withGst: boolean }) =>
      api.post<{ invoiceNo: string; total: number; withGst?: boolean; order?: { customer: { name: string } } }>(
        `/sales/orders/${id}/confirm`,
        { withGst },
      ),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setConfirmingId(null);
      setConfirmOrderId(null);
      const inv = res.data;
      const label = variables.withGst ? 'Tax Invoice' : 'Invoice (without GST)';
      toastSuccess(
        `${label} generated`,
        inv.invoiceNo ? `${inv.invoiceNo} — ${formatCurrency(Number(inv.total))}` : undefined,
      );
    },
    onError: (error) => {
      setConfirmingId(null);
      const message = getApiErrorMessage(error);
      if (message.toLowerCase().includes('credit limit')) {
        toastCreditLimitError(error);
      } else {
        toastApiError(error, 'Could not confirm order.');
      }
    },
  });

  function runConfirm(withGst: boolean) {
    if (!confirmOrderId) return;
    setConfirmingId(confirmOrderId);
    confirmMutation.mutate({ id: confirmOrderId, withGst });
  }

  const downloadPdf = async (invoiceId: string) => {
    setPdfLoadingId(invoiceId);
    try {
      const res = await api.get(`/sales/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch {
      alert('Could not generate PDF. Please try again.');
    } finally {
      setPdfLoadingId(null);
    }
  };

  const orderColumns: ColumnDef<Order>[] = [
    { accessorKey: 'orderDate', header: 'Date', cell: ({ row }) => formatDate(row.original.orderDate) },
    { accessorKey: 'customer.name', header: 'Customer' },
    {
      id: 'highlight',
      header: '',
      cell: ({ row }) => (
        highlightId === row.original.id ? (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">From notification</span>
        ) : null
      ),
    },
    {
      id: 'source',
      header: 'Source',
      cell: ({ row }) => (
        isWebsiteOrder(row.original.notes) ? (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">Website</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">ERP</span>
        )
      ),
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        row.original.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
        row.original.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
        'bg-amber-100 text-amber-700'
      }`}>{row.original.status}</span>
    )},
    {
      id: 'notes',
      header: 'Notes',
      cell: ({ row }) => {
        const notes = row.original.notes;
        if (!notes) return <span className="text-slate-400">—</span>;
        return (
          <div className="max-w-xs">
            <p className="truncate text-xs text-slate-600" title={notes}>
              {notes.split('\n')[0]}
            </p>
            {hasAwaitingStock(notes) && (
              <span className="mt-1 inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-800">
                Awaiting stock
              </span>
            )}
          </div>
        );
      },
    },
    { accessorKey: 'invoice.invoiceNo', header: 'Invoice', cell: ({ row }) => row.original.invoice?.invoiceNo || '—' },
    { id: 'actions', header: 'Actions', cell: ({ row }) => (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {row.original.status === 'DRAFT' && canConfirm && (
          <ActionButton
            size="sm"
            loading={confirmingId === row.original.id}
            loadingText="Confirming..."
            onClick={() => setConfirmOrderId(row.original.id)}
          >
            Confirm & Invoice
          </ActionButton>
        )}
        {row.original.status === 'DRAFT' && !canConfirm && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            Awaiting confirmation
          </span>
        )}
        {row.original.invoice && (
          <ActionButton
            size="sm"
            variant="secondary"
            loading={pdfLoadingId === row.original.invoice!.id}
            loadingText="PDF..."
            onClick={() => downloadPdf(row.original.invoice!.id)}
          >
            PDF
          </ActionButton>
        )}
      </div>
    )},
  ];

  const invoiceColumns: ColumnDef<SalesInvoice>[] = [
    { accessorKey: 'invoiceNo', header: 'Invoice No' },
    { accessorKey: 'issuedAt', header: 'Date', cell: ({ row }) => formatDate(row.original.issuedAt) },
    { accessorKey: 'order.customer.name', header: 'Customer' },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => (
        row.original.withGst === false ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Without GST</span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Tax Invoice</span>
        )
      ),
    },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="tabular-nums">{formatCurrency(Number(row.original.total))}</span> },
    { id: 'pdf', header: '', cell: ({ row }) => (
      <ActionButton
        size="sm"
        variant="secondary"
        loading={pdfLoadingId === row.original.id}
        loadingText="PDF..."
        onClick={() => downloadPdf(row.original.id)}
      >
        PDF
      </ActionButton>
    )},
  ];

  const confirmOrder = orders.find((o) => o.id === confirmOrderId);

  return (
    <div>
      <ModuleHeader
        module="sales"
        icon={ShoppingCart}
        actions={canWrite ? (
          <ActionButton onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} className="w-full sm:w-auto">
            {showForm ? 'Cancel' : 'New Sales Order'}
          </ActionButton>
        ) : undefined}
      />

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ ...form, items: items.filter((i) => i.productId) });
          }}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <SelectField
              value={form.customerId}
              onChange={(customerId) => setForm({ ...form, customerId })}
              placeholder="Select customer"
              options={customers.map((c) => ({
                value: c.id,
                label: formatCustomerOptionLabel(c, customers),
              }))}
              required
            />
            <input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-kedar-gold focus:outline-none focus:ring-1 focus:ring-kedar-gold" required />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Line Items</p>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-2 lg:grid-cols-4 lg:border-0 lg:bg-transparent lg:p-0">
                <SelectField
                  value={item.productId}
                  onChange={(productId) => {
                    const product = products.find((p) => p.id === productId);
                    const newItems = [...items];
                    newItems[idx] = { ...item, productId, rate: product?.price || 0 };
                    setItems(newItems);
                  }}
                  placeholder="Product"
                  options={products.map((p) => ({ value: p.id, label: p.name }))}
                  required
                />
                <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => { const n = [...items]; n[idx].qty = Number(e.target.value); setItems(n); }} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
                <input type="number" placeholder="Rate" value={item.rate} onChange={(e) => { const n = [...items]; n[idx].rate = Number(e.target.value); setItems(n); }} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
                <span className="flex items-center tabular-nums text-sm font-medium">{formatCurrency(item.qty * item.rate)}</span>
              </div>
            ))}
            <button type="button" onClick={() => setItems([...items, { productId: '', qty: 1, rate: 0 }])} className="text-sm text-kedar-navy hover:underline">+ Add line</button>
          </div>
          <p className="mt-4 text-sm font-medium tabular-nums">
            Subtotal: {formatCurrency(items.reduce((s, i) => s + i.qty * i.rate, 0))}
          </p>
          <ActionButton
            type="submit"
            loading={createMutation.isPending}
            loadingText="Creating order..."
            className="mt-4"
          >
            Create Order
          </ActionButton>
        </form>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab('orders')} className={`min-h-[40px] flex-1 rounded-md px-4 py-2 text-sm transition-colors sm:flex-none sm:min-h-0 ${tab === 'orders' ? 'bg-kedar-navy text-kedar-gold' : 'border border-slate-200 bg-white hover:bg-kedar-cream'}`}>Orders</button>
        <button type="button" onClick={() => setTab('invoices')} className={`min-h-[40px] flex-1 rounded-md px-4 py-2 text-sm transition-colors sm:flex-none sm:min-h-0 ${tab === 'invoices' ? 'bg-kedar-navy text-kedar-gold' : 'border border-slate-200 bg-white hover:bg-kedar-cream'}`}>Invoices</button>
      </div>

      {highlightId && orders.some((o) => o.id === highlightId) && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Showing order linked from your notification. Look for the highlighted row below.
        </div>
      )}

      {confirmOrderId && confirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kedar-navy/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-kedar-navy">Confirm Order & Generate Bill</h3>
            <p className="mt-2 text-sm text-slate-600">
              Customer: <span className="font-medium text-slate-900">{confirmOrder.customer.name}</span>
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Choose bill type. Stock will be deducted in both cases.
            </p>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                disabled={confirmMutation.isPending}
                onClick={() => runConfirm(true)}
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition-colors hover:bg-emerald-100 disabled:opacity-60"
              >
                <p className="text-sm font-semibold text-emerald-900">Tax Invoice (With GST)</p>
                <p className="mt-1 text-xs text-emerald-800/80">
                  Prints as Tax Invoice with CGST/SGST/IGST. Use for GST customers.
                </p>
              </button>
              <button
                type="button"
                disabled={confirmMutation.isPending}
                onClick={() => runConfirm(false)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 disabled:opacity-60"
              >
                <p className="text-sm font-semibold text-slate-900">Invoice (Without GST)</p>
                <p className="mt-1 text-xs text-slate-600">
                  Prints as Invoice only — for parchi / trade bills. No GST lines. Stock still maintained.
                </p>
              </button>
            </div>
            <div className="mt-5 flex justify-end">
              <ActionButton
                type="button"
                variant="secondary"
                disabled={confirmMutation.isPending}
                onClick={() => {
                  if (!confirmMutation.isPending) setConfirmOrderId(null);
                }}
              >
                Cancel
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <p className="text-slate-500">Loading...</p> : (
        tab === 'orders'
          ? (
            <div className={cn(highlightId && 'rounded-lg ring-2 ring-blue-200')}>
              <DataTable columns={orderColumns} data={orders} />
            </div>
          )
          : <DataTable columns={invoiceColumns} data={invoices} />
      )}
    </div>
  );
}
