import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getAllProductStock, getTotalOutstandingReceivable } from '../../common/utils/gst.util';
import {
  getBusinessDateString,
  getBusinessDayUtcRange,
  getBusinessMonthStartUtc,
  parseBusinessDate,
} from '../../common/utils/date.util';
import { canAccessModule } from '../../common/permissions';

export interface RoleTask {
  id: string;
  title: string;
  message: string;
  href: string;
  actionLabel: string;
  count: number;
  priority: 'high' | 'normal';
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(role: string, permissions: string[]) {
    const todayBiz = getBusinessDateString();
    const { start: dayStart, end: dayEnd } = getBusinessDayUtcRange(todayBiz);
    const monthStart = getBusinessMonthStartUtc();

    const canDelivery = canAccessModule(role, permissions, 'delivery');
    const canSales = canAccessModule(role, permissions, 'sales');
    const canInventory = canAccessModule(role, permissions, 'inventory');
    const canManufacturing = canAccessModule(role, permissions, 'manufacturing');
    const canPayments = canAccessModule(role, permissions, 'payments');

    const [
      todayProduction,
      todayInvoiceAgg,
      monthlyInvoiceAgg,
      products,
      topProducts,
      recentActivity,
      stockByProduct,
      pendingDeliveries,
      dispatchedDeliveries,
      invoicesAwaitingChallan,
      draftOrders,
      pendingPayments,
    ] = await Promise.all([
      this.prisma.productionBatch.aggregate({
        where: { batchDate: parseBusinessDate(todayBiz) },
        _sum: { qtyProduced: true },
      }),
      this.prisma.invoice.aggregate({
        where: { issuedAt: { gte: dayStart, lt: dayEnd }, isDeleted: false },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: { issuedAt: { gte: monthStart }, isDeleted: false },
        _sum: { total: true },
      }),
      canAccessModule(role, permissions, 'products')
        ? this.prisma.product.count({ where: { isDeleted: false, isActive: true } })
        : Promise.resolve(0),
      canSales
        ? this.prisma.invoiceItem.groupBy({
            by: ['productId'],
            _sum: { qty: true },
            orderBy: { _sum: { qty: 'desc' } },
            take: 5,
          })
        : Promise.resolve([]),
      this.getRecentActivity(role, permissions),
      canInventory ? getAllProductStock(this.prisma) : Promise.resolve(new Map<string, number>()),
      canDelivery
        ? this.prisma.delivery.count({ where: { status: 'PENDING' } })
        : Promise.resolve(0),
      canDelivery
        ? this.prisma.delivery.count({ where: { status: 'DISPATCHED' } })
        : Promise.resolve(0),
      canDelivery ? this.getInvoicesAwaitingChallan() : Promise.resolve([]),
      canSales ? this.getDraftOrders() : Promise.resolve([]),
      canPayments ? getTotalOutstandingReceivable(this.prisma) : Promise.resolve(0),
    ]);

    const todaySales = Number(todayInvoiceAgg._sum.total || 0);
    const monthlyRevenue = Number(monthlyInvoiceAgg._sum.total || 0);
    const lowStock = canInventory
      ? await this.getLowStockItems(stockByProduct as Map<string, number>)
      : [];
    const lowStockCount = lowStock.length;

    const productIds = topProducts.map((tp) => tp.productId);
    const productNames = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = Object.fromEntries(productNames.map((p) => [p.id, p.name]));
    const topProductDetails = topProducts.map((tp) => ({
      productId: tp.productId,
      productName: nameById[tp.productId] || 'Unknown',
      totalQty: Number(tp._sum.qty || 0),
    }));

    const salesTrend = canSales ? await this.getSalesTrend() : [];
    const roleTasks = this.buildRoleTasks({
      role,
      permissions,
      invoicesAwaitingChallan,
      pendingDeliveries,
      dispatchedDeliveries,
      draftOrders,
      lowStockCount,
      pendingPayments,
    });

    return {
      role,
      todayProduction: canManufacturing ? Number(todayProduction._sum.qtyProduced || 0) : null,
      todaySales: canSales ? todaySales : null,
      todayInvoiceCount: canSales ? todayInvoiceAgg._count : null,
      monthlyRevenue: canSales ? monthlyRevenue : null,
      pendingPayments: canPayments ? pendingPayments : null,
      totalProducts: canAccessModule(role, permissions, 'products') ? products : null,
      lowStockCount: canInventory ? lowStockCount : null,
      pendingDeliveries: canDelivery ? pendingDeliveries : null,
      dispatchedDeliveries: canDelivery ? dispatchedDeliveries : null,
      invoicesAwaitingChallanCount: canDelivery ? invoicesAwaitingChallan.length : null,
      draftOrdersCount: canSales ? draftOrders.length : null,
      bestSellingProducts: canSales ? topProductDetails : [],
      lowStockItems: canInventory ? lowStock : [],
      invoicesAwaitingChallan: canDelivery
        ? invoicesAwaitingChallan.map((inv) => ({
            id: inv.id,
            invoiceNo: inv.invoiceNo,
            customerName: inv.order.customer.name,
            total: Number(inv.total),
            issuedAt: inv.issuedAt,
          }))
        : [],
      draftOrders: canSales
        ? draftOrders.map((o) => ({
            id: o.id,
            orderDate: o.orderDate,
            customerName: o.customer.name,
            itemCount: o.items.length,
            subtotal: o.items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0),
          }))
        : [],
      salesTrend,
      recentActivity,
      roleTasks,
    };
  }

  private buildRoleTasks(ctx: {
    role: string;
    permissions: string[];
    invoicesAwaitingChallan: { id: string }[];
    pendingDeliveries: number;
    dispatchedDeliveries: number;
    draftOrders: { id: string }[];
    lowStockCount: number;
    pendingPayments: number;
  }): RoleTask[] {
    const tasks: RoleTask[] = [];

    if (canAccessModule(ctx.role, ctx.permissions, 'delivery')) {
      if (ctx.invoicesAwaitingChallan.length > 0) {
        tasks.push({
          id: 'challan-pending',
          title: 'Create delivery challan',
          message: `${ctx.invoicesAwaitingChallan.length} confirmed invoice(s) need a challan before dispatch`,
          href: '/delivery',
          actionLabel: 'Open Delivery',
          count: ctx.invoicesAwaitingChallan.length,
          priority: 'high',
        });
      }
      if (ctx.pendingDeliveries > 0) {
        tasks.push({
          id: 'dispatch-pending',
          title: 'Dispatch pending challans',
          message: `${ctx.pendingDeliveries} challan(s) created but not yet dispatched`,
          href: '/delivery',
          actionLabel: 'Dispatch now',
          count: ctx.pendingDeliveries,
          priority: 'high',
        });
      }
      if (ctx.dispatchedDeliveries > 0) {
        tasks.push({
          id: 'delivery-pending',
          title: 'Mark deliveries complete',
          message: `${ctx.dispatchedDeliveries} shipment(s) in transit — confirm delivery`,
          href: '/delivery',
          actionLabel: 'View deliveries',
          count: ctx.dispatchedDeliveries,
          priority: 'normal',
        });
      }
    }

    if (canAccessModule(ctx.role, ctx.permissions, 'sales') && ctx.draftOrders.length > 0) {
      const isAccountant = ctx.role === 'Accountant';
      tasks.push({
        id: 'draft-orders',
        title: isAccountant ? 'Confirm draft orders' : 'Draft orders pending',
        message: isAccountant
          ? `${ctx.draftOrders.length} order(s) waiting for invoice confirmation`
          : `${ctx.draftOrders.length} draft order(s) awaiting accountant confirmation`,
        href: '/sales',
        actionLabel: isAccountant ? 'Confirm orders' : 'View orders',
        count: ctx.draftOrders.length,
        priority: 'high',
      });
    }

    if (canAccessModule(ctx.role, ctx.permissions, 'inventory') && ctx.lowStockCount > 0 && ctx.role !== 'Warehouse') {
      tasks.push({
        id: 'low-stock',
        title: 'Low stock alert',
        message: `${ctx.lowStockCount} product(s) below threshold — check inventory or production`,
        href: '/inventory',
        actionLabel: 'View inventory',
        count: ctx.lowStockCount,
        priority: 'normal',
      });
    }

    if (canAccessModule(ctx.role, ctx.permissions, 'payments') && ctx.pendingPayments > 0) {
      tasks.push({
        id: 'collections',
        title: 'Outstanding collections',
        message: `₹${ctx.pendingPayments.toFixed(2)} total outstanding from customers`,
        href: '/payments',
        actionLabel: 'Record payment',
        count: 1,
        priority: 'normal',
      });
    }

    return tasks;
  }

  private async getInvoicesAwaitingChallan() {
    return this.prisma.invoice.findMany({
      where: {
        isDeleted: false,
        status: 'ISSUED',
        deliveries: { none: {} },
      },
      include: { order: { include: { customer: true } } },
      orderBy: { issuedAt: 'desc' },
      take: 15,
    });
  }

  private async getDraftOrders() {
    return this.prisma.salesOrder.findMany({
      where: { status: 'DRAFT' },
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private async getLowStockItems(stockByProduct: Map<string, number>) {
    const products = await this.prisma.product.findMany({
      where: { isDeleted: false, isActive: true },
      include: { unit: true },
    });
    const items = [];
    for (const p of products) {
      const stock = stockByProduct.get(p.id) ?? 0;
      if (stock <= Number(p.lowStockThreshold)) {
        items.push({ productName: p.name, stock, unit: p.unit.symbol, threshold: Number(p.lowStockThreshold) });
      }
    }
    return items;
  }

  private async getSalesTrend() {
    const days = 7;
    const todayBiz = getBusinessDateString();
    const anchor = parseBusinessDate(todayBiz);
    const firstDay = new Date(anchor);
    firstDay.setUTCDate(firstDay.getUTCDate() - (days - 1));
    const { start } = getBusinessDayUtcRange(getBusinessDateString(firstDay));
    const { end: endExclusive } = getBusinessDayUtcRange(todayBiz);

    const invoices = await this.prisma.invoice.findMany({
      where: { issuedAt: { gte: start, lt: endExclusive }, isDeleted: false },
      select: { issuedAt: true, total: true },
    });

    const dayKeys: string[] = [];
    const salesByDay = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(anchor);
      day.setUTCDate(day.getUTCDate() - i);
      const dayStr = getBusinessDateString(day);
      dayKeys.push(dayStr);
      salesByDay.set(dayStr, 0);
    }

    for (const inv of invoices) {
      const dayStr = getBusinessDateString(new Date(inv.issuedAt));
      if (salesByDay.has(dayStr)) {
        salesByDay.set(dayStr, (salesByDay.get(dayStr) || 0) + Number(inv.total));
      }
    }

    return dayKeys.map((dayStr) => ({
      date: parseBusinessDate(dayStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        timeZone: 'Asia/Kolkata',
      }),
      sales: salesByDay.get(dayStr) || 0,
    }));
  }

  private async getRecentActivity(role: string, permissions: string[]) {
    const [auditLogs, notifications] = await Promise.all([
      this.prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, role: { select: { name: true } } } } },
      }),
      this.prisma.notification.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { name: true, role: { select: { name: true } } } } },
      }),
    ]);

    const entityModule: Record<string, string> = {
      sales_order: 'sales',
      production_batch: 'manufacturing',
      delivery: 'delivery',
      payment: 'payments',
      customer: 'customers',
      product: 'products',
    };

    const canSee = (mod: string) =>
      canAccessModule(role, permissions, mod) || role === 'Owner' || role === 'Admin' || role === 'Manager';

    // One row per business event — notifications are stored per user, so dedupe by type + ref
    const dedupedNotifications = new Map<string, (typeof notifications)[0]>();
    for (const n of notifications) {
      if (!canSee(n.module)) continue;
      const key = `${n.type}:${n.refId ?? n.id}`;
      if (!dedupedNotifications.has(key)) {
        dedupedNotifications.set(key, n);
      }
    }

    const auditSkipActions: Record<string, string[]> = {
      sales_order: ['confirm'],
    };

    const activities = [
      ...auditLogs
        .filter((a) => {
          const mod = entityModule[a.entity] || a.entity;
          if (!canSee(mod)) return false;
          const skip = auditSkipActions[a.entity];
          if (skip?.includes(a.action)) return false;
          return true;
        })
        .map((a) => ({
          id: `audit-${a.id}`,
          type: 'audit' as const,
          title: this.formatAuditTitle(a.entity, a.action),
          message: a.user ? `${a.user.name} (${a.user.role.name})` : 'System',
          time: a.createdAt,
          module: entityModule[a.entity],
        })),
      ...[...dedupedNotifications.values()].map((n) => ({
        id: `notif-${n.id}`,
        type: 'notification' as const,
        title: n.title,
        message: n.message,
        module: n.module,
        time: n.createdAt,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 12);
  }

  private formatAuditTitle(entity: string, action: string): string {
    const labels: Record<string, Record<string, string>> = {
      sales_order: { create: 'Sales order created', cancel: 'Sales order cancelled' },
      production_batch: { create: 'Production entry logged' },
      delivery: { create: 'Delivery challan created' },
      payment: { create: 'Payment recorded' },
      customer: { create: 'Customer added', update: 'Customer updated' },
      product: { create: 'Product added', update: 'Product updated' },
    };
    return labels[entity]?.[action] ?? `${entity.replace(/_/g, ' ')} ${action}`;
  }
}
