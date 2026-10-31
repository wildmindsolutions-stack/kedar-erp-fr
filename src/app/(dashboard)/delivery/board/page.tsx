'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPin, Phone, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import { ActionButton } from '@/components/ActionButton';
import { ModuleHeader } from '@/components/ModuleHeader';
import { SelectField } from '@/components/SelectField';
import { useAuth } from '@/lib/auth';
import { canManageDeliveryAreas, DELIVERY_EXECUTIVE, DELIVERY_SUPERVISOR } from '@/lib/permissions';
import { toastApiError, toastSuccess } from '@/lib/toast';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

type Stage = 'UNROUTED' | 'TO_ASSIGN' | 'ASSIGNED' | 'OUT' | 'DELIVERED';

interface BoardBooking {
  id: string;
  bookingNo: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  notes?: string | null;
  status: 'CONFIRMED' | 'DELIVERED';
  paymentReceived: boolean;
  total: number | string;
  confirmedAt?: string | null;
  supervisorId?: string | null;
  outForDeliveryAt?: string | null;
  cashHandedOverAt?: string | null;
  failedAttempts: number;
  lastFailReason?: string | null;
  area?: { id: string; name: string } | null;
  supervisor?: { id: string; name: string } | null;
  executive?: { id: string; name: string } | null;
  items: { id: string; productName: string; qty: number | string }[];
}

interface Executive {
  id: string;
  name: string;
  supervisorId: string | null;
}

const STAGES: { value: Stage; label: string; className: string }[] = [
  { value: 'UNROUTED', label: 'No supervisor', className: 'bg-red-100 text-red-700' },
  { value: 'TO_ASSIGN', label: 'To assign', className: 'bg-amber-100 text-amber-700' },
  { value: 'ASSIGNED', label: 'Assigned', className: 'bg-blue-100 text-blue-700' },
  { value: 'OUT', label: 'Out for delivery', className: 'bg-indigo-100 text-indigo-700' },
  { value: 'DELIVERED', label: 'Delivered', className: 'bg-emerald-100 text-emerald-700' },
];

function getStage(b: BoardBooking): Stage {
  if (b.status === 'DELIVERED') return 'DELIVERED';
  if (b.outForDeliveryAt) return 'OUT';
  if (b.executive) return 'ASSIGNED';
  return b.supervisorId ? 'TO_ASSIGN' : 'UNROUTED';
}

export default function DeliveryBoardPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
      <DeliveryBoardContent />
    </Suspense>
  );
}

function DeliveryBoardContent() {
  const queryClient = useQueryClient();
  const highlightId = useSearchParams().get('ref');
  const { user } = useAuth();
  const role = user?.role || '';
  const isExecutive = role === DELIVERY_EXECUTIVE;
  const canAssign = role === DELIVERY_SUPERVISOR || canManageDeliveryAreas(role);
  const canUpdateProgress = isExecutive || canAssign;
  const canRoute = canManageDeliveryAreas(role);
  const [tab, setTab] = useState<'ALL' | Stage>('ALL');
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [deliverId, setDeliverId] = useState<string | null>(null);
  const [cashCollected, setCashCollected] = useState(true);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['delivery-board'],
    queryFn: () => api.get<BoardBooking[]>('/prebook-delivery/board').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: executives = [] } = useQuery({
    queryKey: ['delivery-executives'],
    queryFn: () => api.get<Executive[]>('/prebook-delivery/executives').then((r) => r.data),
    enabled: canAssign,
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['delivery-areas'],
    queryFn: () => api.get<{ id: string; name: string; isActive: boolean }[]>('/delivery-areas').then((r) => r.data),
    enabled: canRoute,
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: bookings.length };
    for (const b of bookings) {
      const stage = getStage(b);
      c[stage] = (c[stage] ?? 0) + 1;
    }
    return c;
  }, [bookings]);

  const visible = tab === 'ALL' ? bookings : bookings.filter((b) => getStage(b) === tab);
  const tabs = STAGES.filter((s) => s.value !== 'UNROUTED' || canRoute).filter(
    (s) => !isExecutive || s.value !== 'TO_ASSIGN',
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['delivery-board'] });
    queryClient.invalidateQueries({ queryKey: ['prebookings'] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const routeMutation = useMutation({
    mutationFn: ({ id, areaId }: { id: string; areaId: string }) =>
      api.patch(`/prebook-delivery/${id}/area`, { areaId }),
    onSuccess: () => {
      refresh();
      toastSuccess('Area updated');
    },
    onError: (error) => toastApiError(error, 'Could not set the area.'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, executiveId }: { id: string; executiveId: string }) =>
      api.patch(`/prebook-delivery/${id}/assign`, { executiveId }),
    onSuccess: () => {
      refresh();
      toastSuccess('Delivery executive assigned');
    },
    onError: (error) => toastApiError(error, 'Could not assign the executive.'),
  });

  const outMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/prebook-delivery/${id}/out-for-delivery`, {}),
    onSuccess: () => {
      refresh();
      toastSuccess('Marked out for delivery');
    },
    onError: (error) => toastApiError(error, 'Could not update delivery.'),
  });

  const deliverMutation = useMutation({
    mutationFn: ({ id, paymentReceived }: { id: string; paymentReceived: boolean }) =>
      api.patch(`/prebook-delivery/${id}/delivered`, { paymentReceived }),
    onSuccess: () => {
      refresh();
      setDeliverId(null);
      toastSuccess('Delivered', cashCollected ? 'Cash marked as collected.' : undefined);
    },
    onError: (error) => toastApiError(error, 'Could not mark as delivered.'),
  });

  const failMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/prebook-delivery/${id}/failed`, { reason }),
    onSuccess: () => {
      refresh();
      toastSuccess('Attempt recorded', 'The order stays open for another try.');
    },
    onError: (error) => toastApiError(error, 'Could not record the attempt.'),
  });

  const collectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/prebook-delivery/${id}/collect-cash`, {}),
    onSuccess: () => {
      refresh();
      toastSuccess('Cash recorded');
    },
    onError: (error) => toastApiError(error, 'Could not record the cash.'),
  });

  const handoverMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/prebook-delivery/${id}/cash-handover`, {}),
    onSuccess: () => {
      refresh();
      toastSuccess('Cash received from executive');
    },
    onError: (error) => toastApiError(error, 'Could not update the handover.'),
  });

  const delivering = bookings.find((b) => b.id === deliverId);
  const cashHeld = useMemo(() => {
    const held: Record<string, number> = {};
    for (const b of bookings) {
      if (b.paymentReceived && !b.cashHandedOverAt) {
        const name = b.executive?.name ?? 'Unassigned';
        held[name] = (held[name] ?? 0) + Number(b.total);
      }
    }
    return Object.entries(held);
  }, [bookings]);

  return (
    <div>
      <ModuleHeader module="delivery-board" icon={Truck} />

      {cashHeld.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-medium">Cash not yet handed over: </span>
          {cashHeld.map(([name, amount]) => `${name} ${formatCurrency(amount)}`).join(' · ')}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {[{ value: 'ALL' as const, label: 'All' }, ...tabs].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              'min-h-[40px] rounded-md px-4 py-2 text-sm transition-colors sm:min-h-0',
              tab === t.value ? 'bg-kedar-navy text-kedar-gold' : 'border border-slate-200 bg-white hover:bg-kedar-cream',
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">{counts[t.value] ?? 0}</span>
          </button>
        ))}
      </div>

      {isLoading && <p className="text-slate-500">Loading...</p>}
      {!isLoading && visible.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {isExecutive ? 'No deliveries assigned to you yet.' : 'No confirmed pre-bookings here yet.'}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((b) => {
          const stage = STAGES.find((s) => s.value === getStage(b))!;
          const team = executives.filter((e) => e.supervisorId === b.supervisorId);
          return (
            <article
              key={b.id}
              className={cn(
                'rounded-xl border bg-white p-4 shadow-sm',
                highlightId === b.id ? 'border-blue-300 ring-2 ring-blue-200' : 'border-slate-200',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-kedar-navy">{b.bookingNo}</p>
                  <p className="font-medium text-slate-900">{b.name}</p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', stage.className)}>
                  {stage.label}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <a href={`tel:${b.phone}`} className="flex items-center gap-2 hover:text-kedar-navy">
                  <Phone size={14} className="shrink-0 text-slate-400" /> {b.phone}
                </a>
                <p className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>
                    {b.address}, {b.city} – {b.pincode}
                  </span>
                </p>
              </div>

              <ul className="mt-3 space-y-0.5 text-xs text-slate-700">
                {b.items.map((i) => (
                  <li key={i.id}>
                    {Number(i.qty)} × {i.productName}
                  </li>
                ))}
              </ul>
              {b.notes && <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">Note: {b.notes}</p>}
              {b.lastFailReason && b.status !== 'DELIVERED' && (
                <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-800">
                  Attempt {b.failedAttempts} failed: {b.lastFailReason}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>
                  {b.area?.name ?? 'No area'}
                  {b.supervisor ? ` · ${b.supervisor.name}` : ''}
                  {b.executive ? ` · ${b.executive.name}` : ''}
                </span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {formatCurrency(Number(b.total))} COD
                </span>
              </div>

              {getStage(b) === 'UNROUTED' && canRoute && (
                <div className="mt-3">
                  <SelectField
                    value={b.area?.id ?? ''}
                    onChange={(areaId) => routeMutation.mutate({ id: b.id, areaId })}
                    placeholder="Set delivery area"
                    options={areas.filter((a) => a.isActive).map((a) => ({ value: a.id, label: a.name }))}
                    searchable={false}
                    disabled={routeMutation.isPending}
                    emptyMessage="Create an area first"
                  />
                </div>
              )}

              {(getStage(b) === 'TO_ASSIGN' || getStage(b) === 'ASSIGNED' || getStage(b) === 'OUT') && canAssign && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <SelectField
                    className="flex-1"
                    value={selection[b.id] ?? b.executive?.id ?? ''}
                    onChange={(executiveId) => setSelection({ ...selection, [b.id]: executiveId })}
                    placeholder="Select delivery executive"
                    options={team.map((e) => ({ value: e.id, label: e.name }))}
                    searchable={false}
                    emptyMessage="No executives in this team"
                  />
                  <ActionButton
                    size="sm"
                    disabled={!selection[b.id] || selection[b.id] === b.executive?.id}
                    loading={assignMutation.isPending && assignMutation.variables?.id === b.id}
                    loadingText="Assigning..."
                    onClick={() => assignMutation.mutate({ id: b.id, executiveId: selection[b.id] })}
                  >
                    {b.executive ? 'Reassign' : 'Assign'}
                  </ActionButton>
                </div>
              )}

              {canUpdateProgress && (getStage(b) === 'ASSIGNED' || getStage(b) === 'OUT') && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <ActionButton
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const reason = window.prompt('Why could this not be delivered?', 'Customer not home');
                      if (reason !== null) failMutation.mutate({ id: b.id, reason });
                    }}
                  >
                    Not Delivered
                  </ActionButton>
                  {getStage(b) === 'ASSIGNED' && (
                    <ActionButton
                      size="sm"
                      variant="secondary"
                      loading={outMutation.isPending && outMutation.variables === b.id}
                      loadingText="Saving..."
                      onClick={() => outMutation.mutate(b.id)}
                    >
                      Out for Delivery
                    </ActionButton>
                  )}
                  <ActionButton
                    size="sm"
                    variant="success"
                    onClick={() => {
                      setCashCollected(true);
                      setDeliverId(b.id);
                    }}
                  >
                    Mark Delivered
                  </ActionButton>
                </div>
              )}

              {b.status === 'DELIVERED' && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className={cn('text-xs font-medium', b.paymentReceived ? 'text-emerald-700' : 'text-orange-700')}>
                    {!b.paymentReceived && 'Cash pending'}
                    {b.paymentReceived && (b.cashHandedOverAt ? 'Cash received by office' : 'Cash with executive')}
                    {b.confirmedAt ? ` · confirmed ${formatDate(b.confirmedAt)}` : ''}
                  </p>
                  {!b.paymentReceived && canUpdateProgress && (
                    <ActionButton
                      size="sm"
                      variant="secondary"
                      loading={collectMutation.isPending && collectMutation.variables === b.id}
                      loadingText="Saving..."
                      onClick={() => collectMutation.mutate(b.id)}
                    >
                      Cash Collected
                    </ActionButton>
                  )}
                  {b.paymentReceived && !b.cashHandedOverAt && canAssign && (
                    <ActionButton
                      size="sm"
                      variant="secondary"
                      loading={handoverMutation.isPending && handoverMutation.variables === b.id}
                      loadingText="Saving..."
                      onClick={() => handoverMutation.mutate(b.id)}
                    >
                      Cash Received
                    </ActionButton>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {delivering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kedar-navy/50 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-kedar-navy">Mark as Delivered</h3>
            <p className="mt-2 text-sm text-slate-600">
              {delivering.bookingNo} · <span className="font-medium text-slate-900">{delivering.name}</span>
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={cashCollected}
                onChange={(e) => setCashCollected(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-kedar-navy"
              />
              <span className="text-sm font-medium text-slate-900">
                Cash collected ({formatCurrency(Number(delivering.total))})
              </span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <ActionButton
                type="button"
                variant="secondary"
                disabled={deliverMutation.isPending}
                onClick={() => setDeliverId(null)}
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="button"
                variant="success"
                loading={deliverMutation.isPending}
                loadingText="Saving..."
                onClick={() => deliverMutation.mutate({ id: delivering.id, paymentReceived: cashCollected })}
              >
                Confirm Delivery
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
