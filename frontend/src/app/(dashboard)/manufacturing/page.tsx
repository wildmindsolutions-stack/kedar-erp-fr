'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { SelectField } from '@/components/SelectField';
import { formatDate } from '@/lib/utils';
import { Factory } from 'lucide-react';
import { ModuleHeader } from '@/components/ModuleHeader';
import { useAuth } from '@/lib/auth';
import { canWriteModule } from '@/lib/permissions';
import type { ColumnDef } from '@tanstack/react-table';

interface Batch {
  id: string;
  batchNo: string;
  batchDate: string;
  qtyProduced: number;
  product: { name: string; unit: { symbol: string } };
}

export default function ManufacturingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = canWriteModule(user?.role || '', user?.permissions || [], 'manufacturing');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: '', batchNo: '', batchDate: new Date().toISOString().split('T')[0], qtyProduced: '', notes: '' });

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['manufacturing'],
    queryFn: () => api.get<Batch[]>('/manufacturing').then((r) => r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/products').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/manufacturing', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowForm(false);
    },
  });

  const columns: ColumnDef<Batch>[] = [
    { accessorKey: 'batchNo', header: 'Batch No' },
    { accessorKey: 'product.name', header: 'Product' },
    { accessorKey: 'batchDate', header: 'Date', cell: ({ row }) => formatDate(row.original.batchDate) },
    { accessorKey: 'qtyProduced', header: 'Qty Produced', cell: ({ row }) => (
      <span className="tabular-nums">{Number(row.original.qtyProduced)} {row.original.product.unit.symbol}</span>
    )},
  ];

  return (
    <div>
      <ModuleHeader
        module="manufacturing"
        icon={Factory}
        actions={canWrite ? (
          <ActionButton onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} className="w-full sm:w-auto">
            {showForm ? 'Cancel' : 'New Production Entry'}
          </ActionButton>
        ) : undefined}
      />

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ ...form, qtyProduced: Number(form.qtyProduced) });
          }}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              value={form.productId}
              onChange={(productId) => setForm({ ...form, productId })}
              placeholder="Select product"
              options={products.map((p) => ({ value: p.id, label: p.name }))}
              required
            />
            <input placeholder="Batch number" value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
            <input type="date" value={form.batchDate} onChange={(e) => setForm({ ...form, batchDate: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
            <input placeholder="Quantity produced" type="number" value={form.qtyProduced} onChange={(e) => setForm({ ...form, qtyProduced: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
            <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <ActionButton type="submit" loading={createMutation.isPending} loadingText="Saving..." className="mt-4">
            Save Production Entry
          </ActionButton>
        </form>
      )}

      {isLoading ? <p className="text-slate-500">Loading...</p> : <DataTable columns={columns} data={batches} searchKey="batchNo" />}
    </div>
  );
}
