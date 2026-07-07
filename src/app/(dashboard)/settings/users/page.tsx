'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { PageToolbar } from '@/components/PageToolbar';
import { SelectField } from '@/components/SelectField';
import type { ColumnDef } from '@tanstack/react-table';

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: { name: string };
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users').then((r) => r.data),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/users/roles').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
    },
  });

  const columns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role.name', header: 'Role' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.original.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  return (
    <div>
      <PageToolbar
        title="User Management"
        actions={
          <ActionButton onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} className="w-full sm:w-auto">
            {showForm ? 'Cancel' : 'Add User'}
          </ActionButton>
        }
      />

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
            <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" required />
            <SelectField
              value={form.roleId}
              onChange={(roleId) => setForm({ ...form, roleId })}
              placeholder="Select role"
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              required
              searchable={false}
            />
          </div>
          <ActionButton type="submit" loading={createMutation.isPending} loadingText="Saving..." className="mt-4">
            Save User
          </ActionButton>
        </form>
      )}

      {isLoading ? <p className="text-slate-500">Loading...</p> : <DataTable columns={columns} data={users} />}
    </div>
  );
}
