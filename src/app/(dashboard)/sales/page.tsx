'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import type { ColumnDef } from '@tanstack/react-table';

interface Order {
  id: string;
  orderDate: string;
  status: string;
  customer: { name: string };
  items: { product: { name: string }; qty: number; rate: number }[];
  invoice?: { id: string; invoiceNo: string; total: number };
}

interface OrderItem {
  productId: string;
  qty: number;
  rate: number;
}

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = canWriteModule(user?.role || '', user?.permissions || [], 'sales');
  const canConfirm = canConfirmSalesOrders(user?.role || '');
  const [tab, setTab] = useState<'orders' | 'invoices'>('orders');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', orderDate: new Date().toISOString().split('T')[0], notes: '' });
  const [items, setItems] = useState<OrderItem[]>([{ productId: '', qty: 1, rate: 0 }]);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<Order[]>('/sales/orders').then((r) => r.data),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: () => api.get('/sales/invoices').then((r) => r.data),
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
    mutationFn: (id: string) => api.post<{ invoiceNo: string; total: number; order?: { customer: { name: string } } }>(`/sales/orders/${id}/confirm`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setConfirmingId(null);
      const inv = res.data;
      toastSuccess(
        'Order confirmed & invoice generated',
        inv.invoiceNo ? `Invoice ${inv.invoiceNo} — ${formatCurrency(Number(inv.total))}` : undefined,
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
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        row.original.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
        row.original.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
        'bg-amber-100 text-amber-700'
      }`}>{row.original.status}</span>
    )},
    { accessorKey: 'invoice.invoiceNo', header: 'Invoice', cell: ({ row }) => row.original.invoice?.invoiceNo || '—' },
    { id: 'actions', header: 'Actions', cell: ({ row }) => (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {row.original.status === 'DRAFT' && canConfirm && (
          <ActionButton
            size="sm"
            loading={confirmingId === row.original.id}
            loadingText="Confirming..."
            onClick={() => {
              setConfirmingId(row.original.id);
              confirmMutation.mutate(row.original.id);
            }}
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

  const invoiceColumns: ColumnDef<{ id: string; invoiceNo: string; issuedAt: string; order: { customer: { name: string } }; total: number }>[] = [
    { accessorKey: 'invoiceNo', header: 'Invoice No' },
    { accessorKey: 'issuedAt', header: 'Date', cell: ({ row }) => formatDate(row.original.issuedAt) },
    { accessorKey: 'order.customer.name', header: 'Customer' },
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
            <input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" required />
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
            <button type="button" onClick={() => setItems([...items, { productId: '', qty: 1, rate: 0 }])} className="text-sm text-blue-600 hover:underline">+ Add line</button>
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
        <button type="button" onClick={() => setTab('orders')} className={`min-h-[40px] flex-1 rounded-md px-4 py-2 text-sm transition-colors sm:flex-none sm:min-h-0 ${tab === 'orders' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50'}`}>Orders</button>
        <button type="button" onClick={() => setTab('invoices')} className={`min-h-[40px] flex-1 rounded-md px-4 py-2 text-sm transition-colors sm:flex-none sm:min-h-0 ${tab === 'invoices' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50'}`}>Invoices</button>
      </div>

      {isLoading ? <p className="text-slate-500">Loading...</p> : (
        tab === 'orders'
          ? <DataTable columns={orderColumns} data={orders} />
          : <DataTable columns={invoiceColumns} data={invoices} />
      )}
    </div>
  );
}
