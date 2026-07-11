'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { SelectField } from '@/components/SelectField';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Truck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { canWriteModule } from '@/lib/permissions';
import { toastApiError, toastSuccess } from '@/lib/toast';
import type { ColumnDef } from '@tanstack/react-table';

interface Delivery {
  id: string;
  challanNo: string;
  vehicle: string;
  driverName: string;
  status: string;
  dispatchedAt: string;
  invoice: { invoiceNo: string; order: { customer: { name: string } } };
}

export default function DeliveryPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = canWriteModule(user?.role || '', user?.permissions || [], 'delivery');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ invoiceId: '', vehicle: '', driverName: '', notes: '' });
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => api.get<Delivery[]>('/delivery').then((r) => r.data),
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['delivery-invoices'],
    queryFn: () => api.get<{ id: string; invoiceNo: string; order: { customer: { name: string } } }[]>('/delivery/invoices').then((r) => r.data),
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post<{ challanNo: string }>('/delivery', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-invoices'] });
      setShowForm(false);
      setForm({ invoiceId: '', vehicle: '', driverName: '', notes: '' });
      toastSuccess('Delivery challan created', res.data.challanNo ? `Challan ${res.data.challanNo} created.` : undefined);
    },
    onError: (error) => toastApiError(error, 'Could not create challan.'),
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api.patch<{ challanNo: string }>(`/delivery/${id}/dispatch`, {}),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setActionId(null);
      toastSuccess('Order dispatched', res.data.challanNo ? `Challan ${res.data.challanNo} is on the way.` : undefined);
    },
    onError: (error) => {
      setActionId(null);
      toastApiError(error, 'Could not dispatch delivery.');
    },
  });

  const deliverMutation = useMutation({
    mutationFn: (id: string) => api.patch<{ challanNo: string; invoice?: { order: { customer: { name: string } } } }>(`/delivery/${id}/delivered`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setActionId(null);
      const customer = res.data.invoice?.order?.customer?.name;
      toastSuccess(
        'Delivery completed',
        customer ? `Challan ${res.data.challanNo} delivered to ${customer}.` : `Challan ${res.data.challanNo} marked delivered.`,
      );
    },
    onError: (error) => {
      setActionId(null);
      toastApiError(error, 'Could not mark delivery as completed.');
    },
  });

  const columns: ColumnDef<Delivery>[] = [
    { accessorKey: 'challanNo', header: 'Challan No' },
    { accessorKey: 'invoice.invoiceNo', header: 'Invoice' },
    { accessorKey: 'invoice.order.customer.name', header: 'Customer' },
    { accessorKey: 'vehicle', header: 'Vehicle' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        row.original.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
        row.original.status === 'DISPATCHED' ? 'bg-kedar-gold/20 text-kedar-navy' :
        'bg-amber-100 text-amber-700'
      }`}>{row.original.status}</span>
    )},
    { id: 'actions', header: 'Actions', cell: ({ row }) => (
      <div className="flex flex-col gap-2 sm:flex-row">
        {row.original.status === 'PENDING' && canWrite && (
          <ActionButton
            size="sm"
            loading={actionId === `dispatch-${row.original.id}`}
            loadingText="..."
            onClick={() => {
              setActionId(`dispatch-${row.original.id}`);
              dispatchMutation.mutate(row.original.id);
            }}
          >
            Dispatch
          </ActionButton>
        )}
        {row.original.status === 'DISPATCHED' && canWrite && (
          <ActionButton
            size="sm"
            variant="success"
            loading={actionId === `deliver-${row.original.id}`}
            loadingText="..."
            onClick={() => {
              setActionId(`deliver-${row.original.id}`);
              deliverMutation.mutate(row.original.id);
            }}
          >
            Delivered
          </ActionButton>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <ModuleHeader
        module="delivery"
        icon={Truck}
        actions={canWrite ? (
          <ActionButton onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} className="w-full sm:w-auto">
            {showForm ? 'Cancel' : 'New Challan'}
          </ActionButton>
        ) : undefined}
      />

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <SelectField
                label="Select invoice"
                value={form.invoiceId}
                onChange={(invoiceId) => setForm({ ...form, invoiceId })}
                placeholder={invoicesLoading ? 'Loading invoices...' : 'Select invoice'}
                disabled={invoicesLoading}
                options={invoices.map((inv) => ({
                  value: inv.id,
                  label: inv.invoiceNo,
                  description: inv.order.customer.name,
                }))}
                emptyMessage="No invoices available"
                required
              />
              {!invoicesLoading && invoices.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">No invoices available. Confirm a sales order first (Accountant role).</p>
              )}
            </div>
            <input placeholder="Vehicle number" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm self-end" />
            <input placeholder="Driver name" value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <ActionButton
            type="submit"
            loading={createMutation.isPending}
            loadingText="Creating challan..."
            className="mt-4"
          >
            Create Challan
          </ActionButton>
        </form>
      )}

      {isLoading ? <p className="text-slate-500">Loading...</p> : <DataTable columns={columns} data={deliveries} />}
    </div>
  );
}
