import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getCustomerOutstanding } from '../../common/utils/gst.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  findAll() {
    return this.prisma.payment.findMany({
      include: { customer: true, creator: { select: { name: true } } },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async create(data: {
    customerId: string;
    amount: number;
    mode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
    reference?: string;
    receivedAt: string;
    notes?: string;
    createdBy?: string;
  }) {
    if (data.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const outstanding = await getCustomerOutstanding(this.prisma, data.customerId);
    if (outstanding <= 0) {
      throw new BadRequestException('This customer has no outstanding balance to collect');
    }
    if (data.amount > outstanding) {
      throw new BadRequestException(
        `Payment amount cannot exceed outstanding balance of ₹${outstanding.toFixed(2)}`,
      );
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          mode: data.mode,
          reference: data.reference,
          receivedAt: new Date(data.receivedAt),
          notes: data.notes,
          createdBy: data.createdBy,
        },
        include: { customer: true },
      });

      await tx.customerLedger.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          type: 'CREDIT',
          refId: created.id,
          notes: `Payment received - ${data.mode}`,
        },
      });

      return created;
    });

    const actor = data.createdBy
      ? await this.prisma.user.findUnique({ where: { id: data.createdBy } })
      : null;

    await this.notifications.notifyByModule({
      module: 'payments',
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Recorded',
      message: `${actor?.name || 'Accountant'} received ₹${data.amount} from ${payment.customer.name} via ${data.mode}`,
      refId: payment.id,
      link: '/payments',
      actorId: data.createdBy,
    });

    await this.notifications.notifyByModule({
      module: 'sales',
      type: 'PAYMENT_RECEIVED',
      title: 'Customer Payment Received',
      message: `₹${data.amount} received from ${payment.customer.name} via ${data.mode}`,
      refId: payment.id,
      link: '/payments',
      actorId: data.createdBy,
    });

    return payment;
  }

  async getOutstanding() {
    const customers = await this.prisma.customer.findMany({
      where: { isDeleted: false, isActive: true },
    });
    const results = await Promise.all(
      customers.map(async (c) => {
        const outstanding = await getCustomerOutstanding(this.prisma, c.id);
        return {
          customerId: c.id,
          customerName: c.name,
          phone: c.phone,
          creditLimit: Number(c.creditLimit),
          outstanding,
        };
      }),
    );
    return results.filter((r) => r.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding);
  }
}
