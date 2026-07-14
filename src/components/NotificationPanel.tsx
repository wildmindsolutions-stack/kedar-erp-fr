'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { buildNotificationHref } from '@/lib/notification-links';

interface Notification {
  id: string;
  type: string;
  module: string;
  title: string;
  message: string;
  link?: string;
  refId?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: { name: string; role: { name: string } };
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications').then((r) => r.data),
    refetchInterval: 15000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => api.get<number>('/notifications/unread-count').then((r) => r.data),
    refetchInterval: 15000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  const moduleColors: Record<string, string> = {
    manufacturing: 'bg-blue-100 text-blue-700',
    inventory: 'bg-purple-100 text-purple-700',
    sales: 'bg-emerald-100 text-emerald-700',
    payments: 'bg-amber-100 text-amber-700',
    delivery: 'bg-cyan-100 text-cyan-700',
    customers: 'bg-indigo-100 text-indigo-700',
    products: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-14 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50',
                    !n.isRead && 'bg-blue-50/50',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', moduleColors[n.module] || 'bg-slate-100')}>
                          {n.module}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                      {n.actor && (
                        <p className="mt-1 text-[10px] text-slate-400">by {n.actor.name} ({n.actor.role.name})</p>
                      )}
                      {n.link && (
                        <Link
                          href={buildNotificationHref(n.link, n.refId) ?? n.link}
                          onClick={() => { markRead.mutate(n.id); setOpen(false); }}
                          className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(n.id)}
                        className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
