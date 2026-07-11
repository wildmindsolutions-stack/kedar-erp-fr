'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { PageToolbar } from '@/components/PageToolbar';
import { formatCurrency } from '@/lib/utils';
import { toastApiError, toastSuccess } from '@/lib/toast';
import { useAuth } from '@/lib/auth';
import { canWriteModule } from '@/lib/permissions';
import { Pencil } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  creditLimit: number;
  outstanding: number;
  isActive: boolean;
}

const emptyForm = { name: '', phone: '', city: '', state: 'Maharashtra', creditLimit: '' };

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = canWriteModule(user?.role || '', user?.permissions || [], 'customers');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<Customer[]>('/customers').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/customers', data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowForm(false);
      setForm(emptyForm);
      const name = (variables as { name?: string }).name;
      toastSuccess('Customer created', name ? `${name} added successfully.` : undefined);
    },
    onError: (error) => toastApiError(error, 'Could not create customer.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => api.patch(`/customers/${id}`, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditingId(null);
      setEditForm(emptyForm);
      const name = (variables.data as { name?: string }).name;
      toastSuccess('Customer updated', name ? `${name} details saved.` : undefined);
    },
    onError: (error) => toastApiError(error, 'Could not update customer.'),
  });

  const openEdit = (customer: Customer) => {
    setShowForm(false);
    setEditingId(customer.id);
    setEditForm({
      name: customer.name,
      phone: customer.phone || '',
      city: customer.city || '',
      state: customer.state || 'Maharashtra',
      creditLimit: String(customer.creditLimit),
    });
  };

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: 'name', header: 'Customer' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'city', header: 'City' },
    { accessorKey: 'state', header: 'State' },
    { accessorKey: 'creditLimit', header: 'Credit Limit', cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.creditLimit)}</span> },
    { accessorKey: 'outstanding', header: 'Outstanding', cell: ({ row }) => (
      <span className={`tabular-nums ${row.original.outstanding > 0 ? 'font-medium text-amber-600' : 'text-emerald-600'}`}>
        {formatCurrency(row.original.outstanding)}
      </span>
    )},
    ...(canWrite ? [{
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: Customer } }) => (
        <button
          type="button"
          onClick={() => openEdit(row.original)}
          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-kedar-gold-dark"
          title="Edit customer"
        >
          <Pencil size={16} />
        </button>
      ),
    }] : []),
  ];

  const inputClass = 'min-h-[44px] rounded-md border border-slate-200 px-3 py-2.5 text-base focus:border-kedar-gold focus:outline-none focus:ring-1 focus:ring-kedar-gold sm:py-2 sm:text-sm';

  return (
    <div>
      <PageToolbar
        title="Customers"
        actions={canWrite ? (
          <ActionButton
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }}
            variant={showForm ? 'secondary' : 'primary'}
            className="w-full sm:w-auto"
          >
            {showForm ? 'Cancel' : 'Add Customer'}
          </ActionButton>
        ) : undefined}
      />

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ ...form, creditLimit: Number(form.creditLimit) || 0 });
          }}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input placeholder="Customer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
            <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
            <input placeholder="Credit limit" type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} className={inputClass} />
          </div>
          <ActionButton type="submit" loading={createMutation.isPending} loadingText="Saving..." className="mt-4">
            Save Customer
          </ActionButton>
        </form>
      )}

      {editingId && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate({
              id: editingId,
              data: {
                name: editForm.name,
                city: editForm.city,
                state: editForm.state,
                creditLimit: Number(editForm.creditLimit) || 0,
              },
            });
          }}
          className="mb-6 rounded-lg border border-kedar-gold/30 bg-kedar-gold/10 p-6"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Edit Customer</h2>
            <ActionButton type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
              Cancel
            </ActionButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input placeholder="Customer name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} required />
            <input
              placeholder="Phone"
              value={editForm.phone}
              readOnly
              disabled
              className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
              title="Phone number cannot be changed"
            />
            <input placeholder="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className={inputClass} />
            <input placeholder="State" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} className={inputClass} />
            <input placeholder="Credit limit" type="number" value={editForm.creditLimit} onChange={(e) => setEditForm({ ...editForm, creditLimit: e.target.value })} className={inputClass} />
          </div>
          <ActionButton type="submit" loading={updateMutation.isPending} loadingText="Updating..." className="mt-4">
            Update Customer
          </ActionButton>
        </form>
      )}

      {isLoading ? <p className="text-slate-500">Loading...</p> : <DataTable columns={columns} data={customers} searchKey="name" searchPlaceholder="Search customers..." />}
    </div>
  );
}
