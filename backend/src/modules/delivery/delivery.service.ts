import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getAvailableInvoices() {
    return this.prisma.invoice.findMany({
      where: {
        isDeleted: false,
        status: 'ISSUED',
        deliveries: { none: {} },
      },
      include: {
        order: { include: { customer: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  findAll() {
    return this.prisma.delivery.findMany({
      include: {
        invoice: {
          include: {
            order: { include: { customer: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    invoiceId: string;
    vehicle?: string;
    driverName?: string;
    notes?: string;
    createdBy?: string;
  }) {
    const count = await this.prisma.delivery.count();
    const challanNo = `DC/${new Date().getFullYear()}/${String(count + 1).padStart(4, '0')}`;
    const delivery = await this.prisma.delivery.create({
      data: {
        invoiceId: data.invoiceId,
        challanNo,
        vehicle: data.vehicle,
        driverName: data.driverName,
        notes: data.notes,
        status: 'PENDING',
      },
      include: {
        invoice: { include: { order: { include: { customer: true } } } },
      },
    });

    await this.notifications.notifyByModule({
      module: 'delivery',
      type: 'CHALLAN_CREATED',
      title: 'Delivery Challan Created',
      message: `Challan ${challanNo} created for ${delivery.invoice.order.customer.name} (Invoice ${delivery.invoice.invoiceNo})`,
      refId: delivery.id,
      link: '/delivery',
      actorId: data.createdBy,
    });

    return delivery;
  }

  async dispatch(id: string, data: { vehicle?: string; driverName?: string; actorId?: string }) {
    const delivery = await this.prisma.delivery.update({
      where: { id },
      data: {
        status: 'DISPATCHED',
        dispatchedAt: new Date(),
        vehicle: data.vehicle,
        driverName: data.driverName,
      },
      include: { invoice: { include: { order: { include: { customer: true } } } } },
    });

    await this.notifications.notifyByModule({
      module: 'delivery',
      type: 'DISPATCHED',
      title: 'Order Dispatched',
      message: `Challan ${delivery.challanNo} dispatched to ${delivery.invoice.order.customer.name}`,
      refId: delivery.id,
      link: '/delivery',
      actorId: data.actorId,
    });

    return delivery;
  }

  async markDelivered(id: string, actorId?: string) {
    const delivery = await this.prisma.delivery.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
      include: { invoice: { include: { order: { include: { customer: true } } } } },
    });

    await this.notifications.notifyByModule({
      module: 'delivery',
      type: 'DELIVERED',
      title: 'Delivery Completed',
      message: `Challan ${delivery.challanNo} delivered to ${delivery.invoice.order.customer.name}`,
      refId: delivery.id,
      link: '/delivery',
      actorId,
    });

    return delivery;
  }
}
