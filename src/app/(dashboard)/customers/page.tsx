'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { PageToolbar } from '@/components/PageToolbar';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { formatCurrency } from '@/lib/utils';
import { toastApiError, toastSuccess } from '@/lib/toast';
import { useAuth } from '@/lib/auth';
import { canWriteModule } from '@/lib/permissions';
import { KeyRound, Pencil } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  city: string;
  state: string;
  creditLimit: number;
  outstanding: number;
  isActive: boolean;
  hasPortalAccount?: boolean;
  portalEmail?: string | null;
}

const emptyForm = {
  name: '',
  phone: '',
  address: '',
  gstin: '',
  city: '',
  state: 'Maharashtra',
  creditLimit: '',
};

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

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.post<{ email: string }>(`/customers/${id}/reset-website-password`, { password }),
    onSuccess: (res) => toastSuccess('Website password reset', `Login email: ${res.data.email}`),
    onError: (error) => toastApiError(error, 'Could not reset the password.'),
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
      address: customer.address || '',
      gstin: customer.gstin || '',
      city: customer.city || '',
      state: customer.state || 'Maharashtra',
      creditLimit: String(customer.creditLimit),
    });
  };

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: 'name', header: 'Customer' },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.email || row.original.portalEmail || '—'}</span>
    )},
    {
      id: 'portal',
      header: 'Portal',
      cell: ({ row }) => (
        row.original.hasPortalAccount ? (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">Website account</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      ),
    },
    { accessorKey: 'phone', header: 'Phone' },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => (
        <span className="block max-w-[14rem] truncate text-sm text-slate-600" title={row.original.address || ''}>
          {row.original.address || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'gstin',
      header: 'GST No.',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-700">{row.original.gstin || '—'}</span>
      ),
    },
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openEdit(row.original)}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-kedar-gold-dark"
            title="Edit customer"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              const password = window.prompt(`New website password for ${row.original.name} (min 6 characters):`);
              if (password) resetPasswordMutation.mutate({ id: row.original.id, password });
            }}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-kedar-gold-dark"
            title="Reset website password"
          >
            <KeyRound size={16} />
          </button>
        </div>
      ),
    }] : []),
  ];

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
            createMutation.mutate({
              ...form,
              creditLimit: Number(form.creditLimit) || 0,
              address: form.address.trim() || undefined,
              gstin: form.gstin.trim() || undefined,
            });
          }}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FloatingLabelInput label="Customer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FloatingLabelInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <FloatingLabelInput label="Customer address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} containerClassName="sm:col-span-2 lg:col-span-1" />
            <FloatingLabelInput label="Customer GST No." value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} maxLength={15} />
            <FloatingLabelInput label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <FloatingLabelInput label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <FloatingLabelInput label="Credit limit" type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
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
                address: editForm.address.trim() || null,
                gstin: editForm.gstin.trim() || null,
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
            <FloatingLabelInput label="Customer name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            <FloatingLabelInput label="Phone" value={editForm.phone} readOnly disabled title="Phone number cannot be changed" />
            <FloatingLabelInput label="Customer address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} containerClassName="sm:col-span-2 lg:col-span-1" />
            <FloatingLabelInput label="Customer GST No." value={editForm.gstin} onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })} maxLength={15} />
            <FloatingLabelInput label="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
            <FloatingLabelInput label="State" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
            <FloatingLabelInput label="Credit limit" type="number" value={editForm.creditLimit} onChange={(e) => setEditForm({ ...editForm, creditLimit: e.target.value })} />
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
