import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getProductStock } from '../../common/utils/gst.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getStockSummary() {
    const products = await this.prisma.product.findMany({
      where: { isDeleted: false, isActive: true },
      include: { category: true, unit: true },
    });
    return Promise.all(
      products.map(async (p) => {
        const stock = await getProductStock(this.prisma, p.id);
        const threshold = Number(p.lowStockThreshold);
        return {
          productId: p.id,
          productName: p.name,
          category: p.category.name,
          unit: p.unit.symbol,
          stock,
          lowStockThreshold: threshold,
          isLowStock: stock <= threshold,
        };
      }),
    );
  }

  getLedger(productId?: string) {
    return this.prisma.stockLedger.findMany({
      where: productId ? { productId } : undefined,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async adjust(data: {
    productId: string;
    qtyChange: number;
    notes?: string;
    createdBy?: string;
  }) {
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    const entry = await this.prisma.stockLedger.create({
      data: {
        productId: data.productId,
        qtyChange: data.qtyChange,
        reason: 'ADJUSTMENT',
        notes: data.notes,
        createdBy: data.createdBy,
      },
    });

    const actor = data.createdBy
      ? await this.prisma.user.findUnique({ where: { id: data.createdBy } })
      : null;

    await this.notifications.notifyByModule({
      module: 'inventory',
      type: 'STOCK_ADJUSTED',
      title: 'Stock Adjustment',
      message: `${actor?.name || 'User'} adjusted ${product?.name} by ${data.qtyChange > 0 ? '+' : ''}${data.qtyChange}`,
      refId: entry.id,
      link: '/inventory',
      actorId: data.createdBy,
    });

    const stock = await getProductStock(this.prisma, data.productId);
    if (product && stock <= Number(product.lowStockThreshold)) {
      await this.notifications.notifyByModule({
        module: 'inventory',
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${product.name} is low on stock (${stock} remaining)`,
        refId: product.id,
        link: '/inventory',
        actorId: data.createdBy,
      });
    }

    return entry;
  }

  async transfer(data: {
    fromProductId: string;
    toProductId: string;
    qty: number;
    notes?: string;
    createdBy?: string;
  }) {
    const [from, to] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: data.fromProductId } }),
      this.prisma.product.findUnique({ where: { id: data.toProductId } }),
    ]);

    const result = await this.prisma.$transaction([
      this.prisma.stockLedger.create({
        data: {
          productId: data.fromProductId,
          qtyChange: -data.qty,
          reason: 'TRANSFER_OUT',
          notes: data.notes,
          createdBy: data.createdBy,
        },
      }),
      this.prisma.stockLedger.create({
        data: {
          productId: data.toProductId,
          qtyChange: data.qty,
          reason: 'TRANSFER_IN',
          notes: data.notes,
          createdBy: data.createdBy,
        },
      }),
    ]);

    await this.notifications.notifyByModule({
      module: 'inventory',
      type: 'STOCK_TRANSFER',
      title: 'Stock Transfer',
      message: `Transferred ${data.qty} from ${from?.name} to ${to?.name}`,
      link: '/inventory',
      actorId: data.createdBy,
    });

    return result;
  }

  async getLowStockAlerts() {
    const summary = await this.getStockSummary();
    return summary.filter((s) => s.isLowStock);
  }
}
