'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { SelectField } from '@/components/SelectField';
import { CreditCard } from 'lucide-react';
import { ModuleHeader } from '@/components/ModuleHeader';
import { formatCurrency, formatDate, formatCustomerOptionLabel } from '@/lib/utils';
import { toastApiError, toastSuccess } from '@/lib/toast';
import type { ColumnDef } from '@tanstack/react-table';

interface Payment {
  id: string;
  amount: number;
  mode: string;
  receivedAt: string;
  customer: { name: string };
}

interface Outstanding {
  customerId: string;
  customerName: string;
  outstanding: number;
}

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', amount: '', mode: 'CASH', receivedAt: new Date().toISOString().split('T')[0], reference: '', notes: '' });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get<Payment[]>('/payments').then((r) => r.data),
  });

  const { data: outstanding = [] } = useQuery({
    queryKey: ['outstanding'],
    queryFn: () => api.get<Outstanding[]>('/payments/outstanding').then((r) => r.data),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<{ id: string; name: string; phone?: string; city?: string }[]>('/customers').then((r) => r.data),
    enabled: showForm,
  });

  const selectedOutstanding = useMemo(
    () => outstanding.find((o) => o.customerId === form.customerId)?.outstanding ?? null,
    [outstanding, form.customerId],
  );

  const totalOutstanding = useMemo(
    () => outstanding.reduce((sum, o) => sum + o.outstanding, 0),
    [outstanding],
  );

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['outstanding'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowForm(false);
      setForm({ customerId: '', amount: '', mode: 'CASH', receivedAt: new Date().toISOString().split('T')[0], reference: '', notes: '' });
      toastSuccess('Payment recorded');
    },
    onError: (error) => toastApiError(error, 'Could not record payment.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (selectedOutstanding == null) {
      toastApiError(new Error('Select a customer with an outstanding balance'));
      return;
    }
    if (amount > selectedOutstanding) {
      toastApiError(
        new Error(`Amount cannot exceed outstanding balance of ${formatCurrency(selectedOutstanding)}`),
      );
      return;
    }
    createMutation.mutate({ ...form, amount });
  };

  const paymentColumns: ColumnDef<Payment>[] = [
    { accessorKey: 'receivedAt', header: 'Date', cell: ({ row }) => formatDate(row.original.receivedAt) },
    { accessorKey: 'customer.name', header: 'Customer' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="tabular-nums">{formatCurrency(Number(row.original.amount))}</span> },
    { accessorKey: 'mode', header: 'Mode' },
  ];

  const outstandingColumns: ColumnDef<Outstanding>[] = [
    { accessorKey: 'customerName', header: 'Customer' },
    { accessorKey: 'outstanding', header: 'Outstanding', cell: ({ row }) => (
      <span className="tabular-nums font-medium text-amber-600">{formatCurrency(row.original.outstanding)}</span>
    )},
  ];

  const paymentModes = [
    { value: 'CASH', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
  ];

  const customerOptions = outstanding.map((o) => ({
    value: o.customerId,
    label: `${o.customerName} — ${formatCurrency(o.outstanding)} due`,
  }));

  return (
    <div>
      <ModuleHeader
        module="payments"
        icon={CreditCard}
        actions={
          <ActionButton onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} className="w-full sm:w-auto">
            {showForm ? 'Cancel' : 'Record Payment'}
          </ActionButton>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              value={form.customerId}
              onChange={(customerId) => setForm({ ...form, customerId, amount: '' })}
              placeholder="Select customer with dues"
              options={customerOptions.length > 0 ? customerOptions : customers.map((c) => ({
                value: c.id,
                label: formatCustomerOptionLabel(c, customers),
              }))}
              required
            />
            <div>
              <input
                placeholder="Amount"
                type="number"
                min={0.01}
                max={selectedOutstanding ?? undefined}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                required
                disabled={!form.customerId || selectedOutstanding == null}
              />
              {selectedOutstanding != null && (
                <p className="mt-1 text-xs text-slate-500">
                  Max: <span className="font-medium text-amber-700">{formatCurrency(selectedOutstanding)}</span>
                </p>
              )}
            </div>
            <SelectField
              value={form.mode}
              onChange={(mode) => setForm({ ...form, mode })}
              placeholder="Payment mode"
              options={paymentModes}
              searchable={false}
            />
            <input type="date" value={form.receivedAt} onChange={(e) => setForm({ ...form, receivedAt: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
            <input placeholder="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <ActionButton type="submit" loading={createMutation.isPending} loadingText="Saving payment..." className="mt-4">
            Save Payment
          </ActionButton>
        </form>
      )}

      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Outstanding Balances</h2>
          {totalOutstanding > 0 && (
            <p className="text-sm text-slate-500">
              Total outstanding: <span className="font-semibold tabular-nums text-amber-700">{formatCurrency(totalOutstanding)}</span>
            </p>
          )}
        </div>
        <DataTable columns={outstandingColumns} data={outstanding} />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Payment History</h2>
      {isLoading ? <p className="text-slate-500">Loading...</p> : <DataTable columns={paymentColumns} data={payments} />}
    </div>
  );
}
