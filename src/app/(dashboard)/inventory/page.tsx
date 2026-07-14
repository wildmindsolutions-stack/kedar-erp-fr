'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { PageToolbar } from '@/components/PageToolbar';
import { SelectField } from '@/components/SelectField';
import { WebsiteOrderShortfalls } from '@/components/WebsiteOrderShortfalls';
import type { ColumnDef } from '@tanstack/react-table';

interface StockItem {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
      <InventoryPageContent />
    </Suspense>
  );
}

function InventoryPageContent() {
  const searchParams = useSearchParams();
  const focusOrderId = searchParams.get('order');
  const queryClient = useQueryClient();
  const [showAdjust, setShowAdjust] = useState(false);
  const [form, setForm] = useState({ productId: '', qtyChange: '', notes: '' });

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get<StockItem[]>('/inventory').then((r) => r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/products').then((r) => r.data),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: object) => api.post('/inventory/adjust', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowAdjust(false);
    },
  });

  const columns: ColumnDef<StockItem>[] = [
    { accessorKey: 'productName', header: 'Product' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'stock', header: 'Stock', cell: ({ row }) => (
      <span className={`tabular-nums ${row.original.isLowStock ? 'font-medium text-amber-600' : ''}`}>
        {row.original.stock} {row.original.unit}
      </span>
    )},
    { accessorKey: 'lowStockThreshold', header: 'Threshold', cell: ({ row }) => <span className="tabular-nums">{row.original.lowStockThreshold}</span> },
    { accessorKey: 'isLowStock', header: 'Status', cell: ({ row }) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.original.isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
        {row.original.isLowStock ? 'Low Stock' : 'In Stock'}
      </span>
    )},
  ];

  return (
    <div>
      <PageToolbar
        title="Inventory"
        actions={
          <ActionButton onClick={() => setShowAdjust(!showAdjust)} variant={showAdjust ? 'secondary' : 'primary'} className="w-full sm:w-auto">
            {showAdjust ? 'Cancel' : 'Stock Adjustment'}
          </ActionButton>
        }
      />

      <WebsiteOrderShortfalls endpoint="/inventory/website-shortfalls" focusOrderId={focusOrderId} />

      {showAdjust && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            adjustMutation.mutate({ ...form, qtyChange: Number(form.qtyChange) });
          }}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              value={form.productId}
              onChange={(productId) => setForm({ ...form, productId })}
              placeholder="Select product"
              options={products.map((p) => ({ value: p.id, label: p.name }))}
              required
            />
            <input placeholder="Qty change (+/-)" type="number" value={form.qtyChange} onChange={(e) => setForm({ ...form, qtyChange: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
            <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <ActionButton type="submit" loading={adjustMutation.isPending} loadingText="Saving..." className="mt-4">
            Save Adjustment
          </ActionButton>
        </form>
      )}

      {isLoading ? <p className="text-slate-500">Loading...</p> : <DataTable columns={columns} data={stock} searchKey="productName" />}
    </div>
  );
}
