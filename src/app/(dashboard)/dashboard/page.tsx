'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { canAccessModule, ROLE_HOME } from '@/lib/permissions';
import { QuickActions } from '@/components/QuickActions';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts';
import {
  Factory, ShoppingCart, AlertTriangle, Truck, TrendingUp, Activity,
  ClipboardList, FileText, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface RoleTask {
  id: string;
  title: string;
  message: string;
  href: string;
  actionLabel: string;
  count: number;
  priority: 'high' | 'normal';
}

interface DashboardStats {
  role: string;
  todayProduction: number | null;
  todaySales: number | null;
  todayInvoiceCount: number | null;
  monthlyRevenue: number | null;
  pendingPayments: number | null;
  lowStockCount: number | null;
  pendingDeliveries: number | null;
  dispatchedDeliveries: number | null;
  invoicesAwaitingChallanCount: number | null;
  draftOrdersCount: number | null;
  bestSellingProducts: { productName: string; totalQty: number }[];
  lowStockItems: { productName: string; stock: number; unit: string; threshold: number }[];
  invoicesAwaitingChallan: { id: string; invoiceNo: string; customerName: string; total: number; issuedAt: string }[];
  draftOrders: { id: string; orderDate: string; customerName: string; itemCount: number; subtotal: number }[];
  salesTrend: { date: string; sales: number }[];
  recentActivity: { id: string; type: string; title: string; message: string; time: string; module?: string }[];
  roleTasks: RoleTask[];
}

const ROLE_INTRO: Record<string, string> = {
  Warehouse: 'Your dispatch queue, stock alerts, and production tasks',
  Sales: 'Your orders, customers, and sales pipeline',
  Accountant: 'Orders to confirm, invoices, and collections',
  Manager: 'Full business overview across all operations',
  Owner: 'Full business overview across all operations',
  Admin: 'Full business overview across all operations',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('kedar_show_welcome') === '1') {
      setShowWelcome(true);
      sessionStorage.removeItem('kedar_show_welcome');
    }
  }, []);

  useEffect(() => {
    if (user && !canAccessModule(user.role, user.permissions || [], 'dashboard')) {
      router.replace(ROLE_HOME[user.role] || '/sales');
    }
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardStats>('/dashboard').then((r) => r.data),
    refetchInterval: 30000,
    enabled: !!user && canAccessModule(user.role, user.permissions || [], 'dashboard'),
  });

  if (!user || !canAccessModule(user.role, user.permissions || [], 'dashboard')) {
    return null;
  }

  if (isLoading) {
    return <div className="animate-pulse text-slate-500">Loading dashboard...</div>;
  }

  if (user.role === 'Warehouse' && data) {
    return <WarehouseDashboard user={user} data={data} showWelcome={showWelcome} />;
  }

  const statCards = [
    data?.invoicesAwaitingChallanCount != null && data.invoicesAwaitingChallanCount > 0 && {
      label: 'Awaiting Challan',
      value: String(data.invoicesAwaitingChallanCount),
      icon: FileText,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      href: '/delivery',
    },
    data?.pendingDeliveries != null && data.pendingDeliveries > 0 && {
      label: 'To Dispatch',
      value: String(data.pendingDeliveries),
      icon: Truck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/delivery',
    },
    data?.draftOrdersCount != null && data.draftOrdersCount > 0 && {
      label: 'Draft Orders',
      value: String(data.draftOrdersCount),
      icon: ShoppingCart,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/sales',
    },
    data?.todayProduction != null && {
      label: "Today's Production",
      value: `${data.todayProduction} units`,
      icon: Factory,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/manufacturing',
    },
    data?.todaySales != null && {
      label: "Today's Sales",
      value: formatCurrency(data.todaySales),
      icon: ShoppingCart,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/sales',
    },
    data?.monthlyRevenue != null && {
      label: 'Monthly Revenue',
      value: formatCurrency(data.monthlyRevenue),
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/sales',
    },
    data?.pendingPayments != null && data.pendingPayments > 0 && {
      label: 'Outstanding',
      value: formatCurrency(data.pendingPayments),
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/payments',
    },
    data?.lowStockCount != null && data.lowStockCount > 0 && {
      label: 'Low Stock Items',
      value: String(data.lowStockCount),
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      href: '/inventory',
    },
    data?.dispatchedDeliveries != null && data.dispatchedDeliveries > 0 && {
      label: 'In Transit',
      value: String(data.dispatchedDeliveries),
      icon: Truck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/delivery',
    },
  ].filter(Boolean) as { label: string; value: string; icon: typeof Factory; color: string; bg: string; href: string }[];

  const showCharts = (data?.salesTrend?.length ?? 0) > 0 || (data?.bestSellingProducts?.length ?? 0) > 0;
  const isOpsRole = user.role === 'Warehouse' || user.role === 'Sales';

  return (
    <div className="space-y-6">
      {showWelcome && (
        <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
          <p className="text-sm text-slate-300">Welcome back,</p>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="mt-1 text-sm text-slate-400">{ROLE_INTRO[user.role] || 'Your operational overview'}</p>
        </div>
      )}

      {!showWelcome && isOpsRole && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{ROLE_INTRO[user.role]}</p>
        </div>
      )}

      {data?.roleTasks && data.roleTasks.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">My Tasks</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.roleTasks.map((task) => (
              <Link
                key={task.id}
                href={task.href}
                className={`group flex items-start justify-between gap-3 rounded-lg border p-4 transition-all hover:shadow-md ${
                  task.priority === 'high'
                    ? 'border-cyan-200 bg-cyan-50/50 hover:border-cyan-300'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    {task.count > 0 && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                        task.priority === 'high' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {task.count}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{task.message}</p>
                  <p className="mt-2 text-xs font-medium text-blue-600 group-hover:underline">
                    {task.actionLabel} →
                  </p>
                </div>
                <ArrowRight size={16} className="mt-1 shrink-0 text-slate-400 group-hover:text-blue-600" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {statCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                href={s.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <div className={`rounded-lg p-2 ${s.bg}`}>
                    <Icon size={18} className={s.color} />
                  </div>
                </div>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</p>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {data?.invoicesAwaitingChallan && data.invoicesAwaitingChallan.length > 0 && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/30 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-cyan-600" />
                  <h2 className="text-sm font-semibold text-slate-900">Invoices Ready for Challan</h2>
                </div>
                <Link href="/delivery" className="text-xs font-medium text-cyan-700 hover:underline">
                  Create challan →
                </Link>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {data.invoicesAwaitingChallan.map((inv) => (
                  <div key={inv.id} className="flex flex-col gap-1 rounded-lg bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{inv.invoiceNo}</p>
                      <p className="text-xs text-slate-500">{inv.customerName} · {formatDate(inv.issuedAt)}</p>
                    </div>
                    <span className="tabular-nums font-medium text-slate-800">{formatCurrency(inv.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.draftOrders && data.draftOrders.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-amber-600" />
                  <h2 className="text-sm font-semibold text-slate-900">Draft Sales Orders</h2>
                </div>
                <Link href="/sales" className="text-xs font-medium text-amber-700 hover:underline">
                  View sales →
                </Link>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {data.draftOrders.map((order) => (
                  <div key={order.id} className="flex flex-col gap-1 rounded-lg bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{formatDate(order.orderDate)} · {order.itemCount} item(s)</p>
                    </div>
                    <span className="tabular-nums font-medium text-slate-800">{formatCurrency(order.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showCharts && data?.salesTrend && data.salesTrend.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">7-Day Sales Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.salesTrend}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="#2563eb" fill="url(#salesGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {data?.bestSellingProducts && data.bestSellingProducts.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Best Selling Products</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.bestSellingProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="productName" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="totalQty" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <QuickActions />

          {data?.lowStockItems && data.lowStockItems.length > 0 && (
            <div className="flex flex-col rounded-xl border border-amber-200 bg-amber-50/50 p-5">
              <div className="mb-3 flex shrink-0 items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-900">Low Stock Alerts</h3>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto overscroll-contain pr-1">
                {data.lowStockItems.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-slate-800">{item.productName}</span>
                    <span className="tabular-nums text-amber-700">{item.stock} {item.unit}</span>
                  </div>
                ))}
              </div>
              <Link href="/inventory" className="mt-3 shrink-0 text-xs text-amber-700 hover:underline">
                View all inventory →
              </Link>
            </div>
          )}

          {data?.recentActivity && data.recentActivity.length > 0 && (
            <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 shrink-0 text-sm font-semibold text-slate-900">Recent Activity</h3>
              <div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1">
                {data.recentActivity.map((a) => (
                  <div key={a.id} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-xs font-medium text-slate-800">{a.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{a.message}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(a.time)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  label, value, suffix, icon: Icon, color, bg, href,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: typeof Factory;
  color: string;
  bg: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
        <div className={`rounded-lg p-2 ${bg}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      <p className={`mt-3 text-2xl font-semibold tabular-nums sm:text-3xl ${color}`}>{value}</p>
      {suffix && <p className="mt-0.5 text-xs text-slate-400">{suffix}</p>}
    </Link>
  );
}

function WarehouseDashboard({
  user,
  data,
  showWelcome,
}: {
  user: { name: string; role: string };
  data: DashboardStats;
  showWelcome: boolean;
}) {
  const kpis = [
    {
      label: "Today's Production",
      value: String(data.todayProduction ?? 0),
      suffix: 'units produced today',
      icon: Factory,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/manufacturing',
    },
    {
      label: 'Low Stock',
      value: String(data.lowStockCount ?? 0),
      suffix: (data.lowStockCount ?? 0) > 0 ? 'items need attention' : 'all items healthy',
      icon: AlertTriangle,
      color: (data.lowStockCount ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600',
      bg: (data.lowStockCount ?? 0) > 0 ? 'bg-red-50' : 'bg-emerald-50',
      href: '/inventory',
    },
    {
      label: 'Awaiting Challan',
      value: String(data.invoicesAwaitingChallanCount ?? 0),
      suffix: 'confirmed invoices',
      icon: FileText,
      color: (data.invoicesAwaitingChallanCount ?? 0) > 0 ? 'text-cyan-600' : 'text-slate-500',
      bg: (data.invoicesAwaitingChallanCount ?? 0) > 0 ? 'bg-cyan-50' : 'bg-slate-50',
      href: '/delivery',
    },
    {
      label: 'To Dispatch',
      value: String(data.pendingDeliveries ?? 0),
      suffix: 'challans pending',
      icon: Truck,
      color: (data.pendingDeliveries ?? 0) > 0 ? 'text-indigo-600' : 'text-slate-500',
      bg: (data.pendingDeliveries ?? 0) > 0 ? 'bg-indigo-50' : 'bg-slate-50',
      href: '/delivery',
    },
  ];

  const dispatchTasks = data.roleTasks.filter((t) =>
    ['challan-pending', 'dispatch-pending', 'delivery-pending'].includes(t.id),
  );

  return (
    <div className="space-y-5">
      {showWelcome ? (
        <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
          <p className="text-sm text-slate-300">Welcome back,</p>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="mt-1 text-sm text-slate-400">{ROLE_INTRO.Warehouse}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Operations overview</h1>
          <p className="text-sm text-slate-500">{ROLE_INTRO.Warehouse}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((kpi) => (
          <KpiTile key={kpi.label} {...kpi} />
        ))}
      </div>

      {dispatchTasks.length > 0 && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList size={18} className="text-cyan-700" />
            <h2 className="text-sm font-semibold text-slate-900">Dispatch actions</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dispatchTasks.map((task) => (
              <Link
                key={task.id}
                href={task.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-white bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{task.message}</p>
                </div>
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-cyan-600 px-2 text-xs font-bold text-white tabular-nums">
                  {task.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-cyan-600" />
                <h2 className="text-sm font-semibold text-slate-900">Invoices ready for challan</h2>
              </div>
              <Link href="/delivery" className="text-xs font-medium text-cyan-700 hover:underline">
                Go to delivery →
              </Link>
            </div>
            {data.invoicesAwaitingChallan.length > 0 ? (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {data.invoicesAwaitingChallan.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{inv.invoiceNo}</p>
                      <p className="text-xs text-slate-500">{inv.customerName} · {formatDate(inv.issuedAt)}</p>
                    </div>
                    <span className="tabular-nums font-semibold text-slate-800">{formatCurrency(inv.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No invoices waiting for challan</p>
                <p className="mt-1 text-xs text-slate-500">
                  When the Accountant confirms an order, it will appear here for you to create a delivery challan.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <QuickActions />

          {data.lowStockItems.length > 0 && (
            <div className="flex flex-col rounded-xl border border-amber-200 bg-amber-50/50 p-5">
              <div className="mb-3 flex shrink-0 items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-900">Low stock</h3>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {data.lowStockItems.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-slate-800">{item.productName}</span>
                    <span className="tabular-nums text-amber-700">{item.stock} {item.unit}</span>
                  </div>
                ))}
              </div>
              <Link href="/inventory" className="mt-3 text-xs text-amber-700 hover:underline">
                View inventory →
              </Link>
            </div>
          )}

          {data.recentActivity.length > 0 && (
            <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent activity</h3>
              <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                {data.recentActivity.map((a) => (
                  <div key={a.id} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-xs font-medium text-slate-800">{a.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{a.message}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(a.time)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
