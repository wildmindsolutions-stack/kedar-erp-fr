'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { PageToolbar } from '@/components/PageToolbar';
import { SelectField } from '@/components/SelectField';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { formatCurrency } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';

interface Product {
  id: string;
  name: string;
  category: { name: string };
  unit: { symbol: string };
  price: number;
  hsnCode: string;
  gstRate: number;
  stock: number;
  isActive: boolean;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', categoryId: '', unitId: '', price: '', hsnCode: '', gstRate: '5' });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<Product[]>('/products').then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/products/categories').then((r) => r.data),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/products/units').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setForm({ name: '', categoryId: '', unitId: '', price: '', hsnCode: '', gstRate: '5' });
    },
  });

  const columns: ColumnDef<Product>[] = [
    { accessorKey: 'name', header: 'Product' },
    { accessorKey: 'category.name', header: 'Category' },
    { accessorKey: 'unit.symbol', header: 'Unit' },
    { accessorKey: 'price', header: 'Price', cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.price)}</span> },
    { accessorKey: 'hsnCode', header: 'HSN' },
    { accessorKey: 'gstRate', header: 'GST %', cell: ({ row }) => <span className="tabular-nums">{row.original.gstRate}%</span> },
    { accessorKey: 'stock', header: 'Stock', cell: ({ row }) => (
      <span className={`tabular-nums ${row.original.stock <= 10 ? 'text-amber-600 font-medium' : ''}`}>
        {row.original.stock}
      </span>
    )},
  ];

  return (
    <div>
      <PageToolbar
        title="Products"
        actions={
          <ActionButton onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} className="w-full sm:w-auto">
            {showForm ? 'Cancel' : 'Add Product'}
          </ActionButton>
        }
      />

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ ...form, price: Number(form.price), gstRate: Number(form.gstRate) });
          }}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FloatingLabelInput
              label="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <SelectField
              value={form.categoryId}
              onChange={(categoryId) => setForm({ ...form, categoryId })}
              placeholder="Select category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              required
              searchable={false}
            />
            <SelectField
              value={form.unitId}
              onChange={(unitId) => setForm({ ...form, unitId })}
              placeholder="Select unit"
              options={units.map((u) => ({ value: u.id, label: u.name }))}
              required
              searchable={false}
            />
            <FloatingLabelInput
              label="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <FloatingLabelInput
              label="HSN Code"
              value={form.hsnCode}
              onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
              required
            />
            <FloatingLabelInput
              label="GST %"
              type="number"
              value={form.gstRate}
              onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
              min={0}
              max={28}
              step={0.01}
            />
          </div>
          <ActionButton type="submit" loading={createMutation.isPending} loadingText="Saving..." className="mt-4">
            Save Product
          </ActionButton>
        </form>
      )}

      {isLoading ? <p className="text-slate-500">Loading...</p> : <DataTable columns={columns} data={products} searchKey="name" searchPlaceholder="Search products..." />}
    </div>
  );
}
