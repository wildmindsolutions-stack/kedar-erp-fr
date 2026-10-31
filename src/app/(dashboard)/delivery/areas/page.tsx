'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { MapPin, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { ActionButton } from '@/components/ActionButton';
import { DataTable } from '@/components/DataTable';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { ModuleHeader } from '@/components/ModuleHeader';
import { SelectField } from '@/components/SelectField';
import { toastApiError, toastSuccess } from '@/lib/toast';
import type { ColumnDef } from '@tanstack/react-table';

interface Area {
  id: string;
  name: string;
  pincodes: string[];
  isActive: boolean;
  supervisorId: string | null;
  supervisor?: { name: string } | null;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  supervisorId: string | null;
}

const emptyForm = { name: '', pincodes: '', supervisorId: '' };
const parsePincodes = (value: string) => value.split(/[\s,]+/).filter(Boolean);

export default function DeliveryAreasPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ['delivery-areas'],
    queryFn: () => api.get<Area[]>('/delivery-areas').then((r) => r.data),
  });

  const { data: staff } = useQuery({
    queryKey: ['delivery-staff'],
    queryFn: () =>
      api.get<{ supervisors: StaffMember[]; executives: StaffMember[] }>('/delivery-areas/staff').then((r) => r.data),
  });

  const supervisors = staff?.supervisors ?? [];
  const executives = staff?.executives ?? [];
  const supervisorOptions = supervisors.map((s) => ({ value: s.id, label: s.name }));

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        pincodes: parsePincodes(form.pincodes),
        supervisorId: form.supervisorId || null,
      };
      return editingId ? api.patch(`/delivery-areas/${editingId}`, payload) : api.post('/delivery-areas', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-board'] });
      toastSuccess(editingId ? 'Area updated' : 'Area created');
      closeForm();
    },
    onError: (error) => toastApiError(error, 'Could not save the area.'),
  });

  const toggleMutation = useMutation({
    mutationFn: (area: Area) => api.patch(`/delivery-areas/${area.id}`, { isActive: !area.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery-areas'] }),
    onError: (error) => toastApiError(error, 'Could not update the area.'),
  });

  const teamMutation = useMutation({
    mutationFn: ({ id, supervisorId }: { id: string; supervisorId: string }) =>
      api.patch(`/delivery-areas/staff/${id}`, { supervisorId: supervisorId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-staff'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-executives'] });
      toastSuccess('Team updated');
    },
    onError: (error) => toastApiError(error, 'Could not update the team.'),
  });

  const columns: ColumnDef<Area>[] = [
    { accessorKey: 'name', header: 'Area' },
    {
      id: 'pincodes',
      header: 'Pincodes',
      cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.pincodes.join(', ') || '—'}</span>,
    },
    {
      id: 'supervisor',
      header: 'Supervisor',
      cell: ({ row }) =>
        row.original.supervisor?.name ?? <span className="text-xs font-medium text-red-600">Not set</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.original.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Edit area"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-kedar-gold-dark"
            onClick={() => {
              setEditingId(row.original.id);
              setShowForm(true);
              setForm({
                name: row.original.name,
                pincodes: row.original.pincodes.join(', '),
                supervisorId: row.original.supervisorId ?? '',
              });
            }}
          >
            <Pencil size={16} />
          </button>
          <ActionButton size="sm" variant="ghost" onClick={() => toggleMutation.mutate(row.original)}>
            {row.original.isActive ? 'Deactivate' : 'Activate'}
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <ModuleHeader
        module="delivery-areas"
        icon={MapPin}
        actions={
          <ActionButton
            variant={showForm ? 'secondary' : 'primary'}
            className="w-full sm:w-auto"
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
          >
            {showForm ? 'Cancel' : 'Add Area'}
          </ActionButton>
        }
      />

      {showForm && (
        <form
          className="mb-6 rounded-lg border border-slate-200 bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <FloatingLabelInput
              label="Area name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <FloatingLabelInput
              label="Pincodes (comma separated)"
              value={form.pincodes}
              onChange={(e) => setForm({ ...form, pincodes: e.target.value })}
            />
            <SelectField
              value={form.supervisorId}
              onChange={(supervisorId) => setForm({ ...form, supervisorId })}
              placeholder="Select supervisor"
              options={supervisorOptions}
              searchable={false}
              emptyMessage="Create a Delivery Supervisor user first"
            />
          </div>
          <ActionButton type="submit" className="mt-4" loading={saveMutation.isPending} loadingText="Saving...">
            {editingId ? 'Update Area' : 'Save Area'}
          </ActionButton>
        </form>
      )}

      {isLoading ? <p className="text-slate-500">Loading...</p> : <DataTable columns={columns} data={areas} />}

      <h2 className="mb-1 mt-8 text-lg font-semibold text-slate-900">Delivery Team</h2>
      <p className="mb-4 text-sm text-slate-500">
        Add people in Users &amp; Roles with the Delivery Supervisor or Delivery Executive role, then choose who each
        executive reports to.
      </p>
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {executives.length === 0 && <p className="p-4 text-sm text-slate-500">No delivery executives yet.</p>}
        {executives.map((executive) => (
          <div key={executive.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{executive.name}</p>
              <p className="truncate text-xs text-slate-500">{executive.email}</p>
            </div>
            <SelectField
              className="sm:w-64"
              value={executive.supervisorId ?? ''}
              onChange={(supervisorId) => teamMutation.mutate({ id: executive.id, supervisorId })}
              placeholder="Assign supervisor"
              options={supervisorOptions}
              searchable={false}
              disabled={teamMutation.isPending}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
