'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { PageToolbar } from '@/components/PageToolbar';
import { SelectField } from '@/components/SelectField';
import { useAuth } from '@/lib/auth';
import { toastApiError, toastSuccess } from '@/lib/toast';
import { Pencil, UserX, UserCheck, KeyRound, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: { id: string; name: string };
}

interface Role {
  id: string;
  name: string;
  isActive: boolean;
  _count: { users: number };
}

const PROTECTED_ROLES = ['Owner', 'Admin'];
const inputClass =
  'min-h-[44px] rounded-md border border-slate-200 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:py-2 sm:text-sm';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<'users' | 'roles'>('users');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', roleId: '', isActive: true });
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users').then((r) => r.data),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<Role[]>('/users/roles').then((r) => r.data),
  });

  const activeRoles = roles.filter((r) => r.isActive);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/users', data),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm({ name: '', email: '', password: '', roleId: '' });
      toastSuccess('User created', 'New user can now sign in.');
    },
    onError: (error) => toastApiError(error, 'Could not create user.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => api.patch(`/users/${id}`, data),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toastSuccess('User updated');
    },
    onError: (error) => toastApiError(error, 'Could not update user.'),
  });

  const toggleUserMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}`, { isActive }),
    onSuccess: (_res, vars) => {
      invalidate();
      setActionId(null);
      toastSuccess(vars.isActive ? 'User activated' : 'User deactivated');
    },
    onError: (error) => {
      setActionId(null);
      toastApiError(error, 'Could not update user status.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.post(`/users/${id}/reset-password`, { password }),
    onSuccess: () => {
      setResetPasswordId(null);
      setNewPassword('');
      toastSuccess('Password reset', 'User must sign in with the new password.');
    },
    onError: (error) => toastApiError(error, 'Could not reset password.'),
  });

  const toggleRoleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/roles/${id}`, { isActive }),
    onSuccess: (_res, vars) => {
      invalidate();
      setActionId(null);
      toastSuccess(vars.isActive ? 'Role activated' : 'Role deactivated');
    },
    onError: (error) => {
      setActionId(null);
      toastApiError(error, 'Could not update role.');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/roles/${id}`),
    onSuccess: () => {
      invalidate();
      toastSuccess('Role removed');
    },
    onError: (error) => toastApiError(error, 'Could not remove role.'),
  });

  const openEdit = (u: User) => {
    setShowForm(false);
    setResetPasswordId(null);
    setEditingId(u.id);
    setEditForm({
      name: u.name,
      email: u.email,
      roleId: u.role.id,
      isActive: u.isActive,
    });
  };

  const userColumns: ColumnDef<User>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role.name', header: 'Role' },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.original.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const u = row.original;
        const isSelf = u.id === currentUser?.id;
        return (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => openEdit(u)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
              title="Edit user"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setResetPasswordId(u.id);
                setEditingId(null);
                setNewPassword('');
              }}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600"
              title="Reset password"
            >
              <KeyRound size={16} />
            </button>
            {!isSelf && (
              <ActionButton
                size="sm"
                variant={u.isActive ? 'danger' : 'secondary'}
                loading={actionId === u.id}
                loadingText="..."
                onClick={() => {
                  if (u.isActive && !window.confirm(`Deactivate ${u.name}? They will not be able to sign in.`)) {
                    return;
                  }
                  setActionId(u.id);
                  toggleUserMutation.mutate({ id: u.id, isActive: !u.isActive });
                }}
              >
                {u.isActive ? (
                  <span className="flex items-center gap-1"><UserX size={14} /> Deactivate</span>
                ) : (
                  <span className="flex items-center gap-1"><UserCheck size={14} /> Activate</span>
                )}
              </ActionButton>
            )}
          </div>
        );
      },
    },
  ];

  const roleColumns: ColumnDef<Role>[] = [
    { accessorKey: 'name', header: 'Role' },
    {
      id: 'users',
      header: 'Users',
      cell: ({ row }) => <span className="tabular-nums">{row.original._count.users}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.original.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const r = row.original;
        const isProtected = PROTECTED_ROLES.includes(r.name);
        const canToggle = !isProtected && (r.isActive ? r._count.users === 0 : true);
        const canDelete = !isProtected && r._count.users === 0;

        return (
          <div className="flex flex-wrap gap-1.5">
            {canToggle && (
              <ActionButton
                size="sm"
                variant={r.isActive ? 'danger' : 'secondary'}
                loading={actionId === r.id}
                loadingText="..."
                onClick={() => {
                  const msg = r.isActive
                    ? `Deactivate the ${r.name} role? No users can be assigned this role while inactive.`
                    : `Activate the ${r.name} role?`;
                  if (window.confirm(msg)) {
                    setActionId(r.id);
                    toggleRoleMutation.mutate({ id: r.id, isActive: !r.isActive });
                  }
                }}
              >
                {r.isActive ? 'Deactivate' : 'Activate'}
              </ActionButton>
            )}
            {canDelete && (
              <ActionButton
                size="sm"
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Permanently remove the ${r.name} role from the database?`)) {
                    deleteRoleMutation.mutate(r.id);
                  }
                }}
              >
                <span className="flex items-center gap-1"><Trash2 size={14} /> Remove</span>
              </ActionButton>
            )}
            {isProtected && <span className="text-xs text-slate-400">Protected</span>}
            {!isProtected && r.isActive && r._count.users > 0 && (
              <span className="text-xs text-slate-400">Reassign users first</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageToolbar
        title="User Management"
        actions={
          tab === 'users' ? (
            <ActionButton
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setResetPasswordId(null);
              }}
              variant={showForm ? 'secondary' : 'primary'}
              className="w-full sm:w-auto"
            >
              {showForm ? 'Cancel' : 'Add User'}
            </ActionButton>
          ) : undefined
        }
      />

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {(['users', 'roles'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' && showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
        >
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Add User</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} required />
            <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} required />
            <SelectField
              value={form.roleId}
              onChange={(roleId) => setForm({ ...form, roleId })}
              placeholder="Select role"
              options={activeRoles.map((r) => ({ value: r.id, label: r.name }))}
              required
              searchable={false}
            />
          </div>
          <ActionButton type="submit" loading={createMutation.isPending} loadingText="Saving..." className="mt-4">
            Save User
          </ActionButton>
        </form>
      )}

      {tab === 'users' && editingId && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate({ id: editingId, data: editForm });
          }}
          className="mb-6 rounded-lg border border-blue-200 bg-blue-50/30 p-6"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Edit User</h2>
            <ActionButton type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
              Cancel
            </ActionButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} required />
            <input placeholder="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} required />
            <SelectField
              value={editForm.roleId}
              onChange={(roleId) => setEditForm({ ...editForm, roleId })}
              placeholder="Select role"
              options={roles.filter((r) => r.isActive || r.id === editForm.roleId).map((r) => ({ value: r.id, label: r.name }))}
              required
              searchable={false}
            />
            <SelectField
              value={editForm.isActive ? 'active' : 'inactive'}
              onChange={(v) => setEditForm({ ...editForm, isActive: v === 'active' })}
              placeholder="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              searchable={false}
              disabled={editingId === currentUser?.id}
            />
          </div>
          <ActionButton type="submit" loading={updateMutation.isPending} loadingText="Saving..." className="mt-4">
            Save Changes
          </ActionButton>
        </form>
      )}

      {tab === 'users' && resetPasswordId && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPasswordMutation.mutate({ id: resetPasswordId, password: newPassword });
          }}
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50/30 p-6"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Reset Password</h2>
            <ActionButton type="button" variant="ghost" size="sm" onClick={() => setResetPasswordId(null)}>
              Cancel
            </ActionButton>
          </div>
          <input
            placeholder="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`${inputClass} max-w-md`}
            required
            minLength={6}
          />
          <ActionButton type="submit" loading={resetPasswordMutation.isPending} loadingText="Saving..." className="mt-4">
            Update Password
          </ActionButton>
        </form>
      )}

      {tab === 'users' && (
        isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <DataTable columns={userColumns} data={users} />
        )
      )}

      {tab === 'roles' && (
        <div>
          <p className="mb-4 text-sm text-slate-500">
            Deactivate or remove roles when no users are assigned. Owner and Admin roles are protected.
          </p>
          <DataTable columns={roleColumns} data={roles} />
        </div>
      )}
    </div>
  );

}
