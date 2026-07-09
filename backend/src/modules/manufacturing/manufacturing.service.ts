import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseBusinessDate } from '../../common/utils/date.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ManufacturingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  findAll() {
    return this.prisma.productionBatch.findMany({
      include: { product: { include: { unit: true, category: true } } },
      orderBy: { batchDate: 'desc' },
    });
  }

  async create(data: {
    productId: string;
    batchNo: string;
    batchDate: string;
    qtyProduced: number;
    notes?: string;
    createdBy?: string;
  }) {
    const batch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.productionBatch.create({
        data: {
          productId: data.productId,
          batchNo: data.batchNo,
          batchDate: parseBusinessDate(data.batchDate),
          qtyProduced: data.qtyProduced,
          notes: data.notes,
          createdBy: data.createdBy,
        },
        include: { product: { include: { unit: true } } },
      });

      await tx.stockLedger.create({
        data: {
          productId: data.productId,
          qtyChange: data.qtyProduced,
          reason: 'PRODUCTION',
          refId: created.id,
          notes: `Production batch ${data.batchNo}`,
          createdBy: data.createdBy,
        },
      });

      return created;
    });

    const actor = data.createdBy
      ? await this.prisma.user.findUnique({ where: { id: data.createdBy } })
      : null;

    await this.notifications.notifyByModule({
      module: 'manufacturing',
      type: 'PRODUCTION_CREATED',
      title: 'New Production Entry',
      message: `${actor?.name || 'Warehouse'} recorded ${data.qtyProduced} ${batch.product.unit.symbol} of ${batch.product.name} (Batch ${data.batchNo})`,
      refId: batch.id,
      link: '/manufacturing',
      actorId: data.createdBy,
    });

    await this.notifications.notifyByModule({
      module: 'inventory',
      type: 'STOCK_INCREASED',
      title: 'Stock Updated from Production',
      message: `${batch.product.name} stock increased by ${data.qtyProduced} ${batch.product.unit.symbol}`,
      refId: batch.id,
      link: '/inventory',
      actorId: data.createdBy,
    });

    return batch;
  }

  async getYieldReport() {
    const batches = await this.prisma.productionBatch.findMany({
      include: { product: true },
      orderBy: { batchDate: 'desc' },
    });
    const byProduct: Record<string, { product: string; totalQty: number; batches: number }> = {};
    for (const b of batches) {
      const key = b.productId;
      if (!byProduct[key]) {
        byProduct[key] = { product: b.product.name, totalQty: 0, batches: 0 };
      }
      byProduct[key].totalQty += Number(b.qtyProduced);
      byProduct[key].batches += 1;
    }
    return Object.values(byProduct);
  }
}
