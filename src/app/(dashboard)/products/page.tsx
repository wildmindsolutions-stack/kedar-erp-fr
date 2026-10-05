'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { PageToolbar } from '@/components/PageToolbar';
import { SelectField } from '@/components/SelectField';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { formatCurrency } from '@/lib/utils';
import { toastApiError, toastSuccess } from '@/lib/toast';
import { useAuth } from '@/lib/auth';
import { canWriteModule } from '@/lib/permissions';
import type { ColumnDef } from '@tanstack/react-table';

interface Product {
  id: string;
  name: string;
  categoryId: string;
  unitId: string;
  category: { name: string };
  unit: { symbol: string };
  price: number;
  hsnCode: string;
  gstRate: number;
  stock: number;
  isActive: boolean;
}

const emptyForm = { name: '', categoryId: '', unitId: '', price: '', hsnCode: '', gstRate: '5' };

function toPayload(form: typeof emptyForm) {
  return {
    name: form.name.trim(),
    categoryId: form.categoryId,
    unitId: form.unitId,
    price: Number(form.price),
    hsnCode: form.hsnCode.trim(),
    gstRate: Number(form.gstRate),
  };
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = canWriteModule(user?.role || '', user?.permissions || [], 'products');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

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
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setForm(emptyForm);
      const name = (variables as { name?: string }).name;
      toastSuccess('Product created', name ? `${name} added successfully.` : undefined);
    },
    onError: (error) => toastApiError(error, 'Could not create product.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => api.patch(`/products/${id}`, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingId(null);
      setEditForm(emptyForm);
      const name = (variables.data as { name?: string }).name;
      toastSuccess('Product updated', name ? `${name} details saved.` : undefined);
    },
    onError: (error) => toastApiError(error, 'Could not update product.'),
  });

  const openEdit = (product: Product) => {
    setShowForm(false);
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      categoryId: product.categoryId,
      unitId: product.unitId,
      price: String(product.price),
      hsnCode: product.hsnCode,
      gstRate: String(product.gstRate),
    });
  };

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
    ...(canWrite ? [{
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: Product } }) => (
        <button
          type="button"
          onClick={() => openEdit(row.original)}
          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-kedar-gold-dark"
          title="Edit product"
        >
          <Pencil size={16} />
        </button>
      ),
    }] : []),
  ];

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const unitOptions = units.map((u) => ({ value: u.id, label: u.name }));

  return (
    <div>
      <PageToolbar
        title="Products"
        actions={canWrite ? (
          <ActionButton
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }}
            variant={showForm ? 'secondary' : 'primary'}
            className="w-full sm:w-auto"
          >
            {showForm ? 'Cancel' : 'Add Product'}
          </ActionButton>
        ) : undefined}
      />

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(toPayload(form));
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
              options={categoryOptions}
              required
              searchable={false}
            />
            <SelectField
              value={form.unitId}
              onChange={(unitId) => setForm({ ...form, unitId })}
              placeholder="Select unit"
              options={unitOptions}
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

      {editingId && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate({ id: editingId, data: toPayload(editForm) });
          }}
          className="mb-6 rounded-lg border border-kedar-gold/30 bg-kedar-gold/10 p-6"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Edit Product</h2>
            <ActionButton type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
              Cancel
            </ActionButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FloatingLabelInput
              label="Product name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <SelectField
              value={editForm.categoryId}
              onChange={(categoryId) => setEditForm({ ...editForm, categoryId })}
              placeholder="Select category"
              options={categoryOptions}
              required
              searchable={false}
            />
            <SelectField
              value={editForm.unitId}
              onChange={(unitId) => setEditForm({ ...editForm, unitId })}
              placeholder="Select unit"
              options={unitOptions}
              required
              searchable={false}
            />
            <FloatingLabelInput
              label="Price"
              type="number"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              required
            />
            <FloatingLabelInput
              label="HSN Code"
              value={editForm.hsnCode}
              onChange={(e) => setEditForm({ ...editForm, hsnCode: e.target.value })}
              required
            />
            <FloatingLabelInput
              label="GST %"
              type="number"
              value={editForm.gstRate}
              onChange={(e) => setEditForm({ ...editForm, gstRate: e.target.value })}
              min={0}
              max={28}
              step={0.01}
            />
          </div>
          <ActionButton type="submit" loading={updateMutation.isPending} loadingText="Updating..." className="mt-4">
            Update Product
          </ActionButton>
        </form>
      )}

      {isLoading ? <p className="text-slate-500">Loading...</p> : <DataTable columns={columns} data={products} searchKey="name" searchPlaceholder="Search products..." />}
    </div>
  );
}
