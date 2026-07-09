import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getCustomerOutstanding } from '../../common/utils/gst.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    });
    return Promise.all(
      customers.map(async (c) => ({
        ...c,
        creditLimit: Number(c.creditLimit),
        outstanding: await getCustomerOutstanding(this.prisma, c.id),
      })),
    );
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) return null;
    const outstanding = await getCustomerOutstanding(this.prisma, id);
    const ledger = await this.prisma.customerLedger.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
    });
    return {
      ...customer,
      creditLimit: Number(customer.creditLimit),
      outstanding,
      ledger: ledger.map((l) => ({
        ...l,
        amount: Number(l.amount),
      })),
    };
  }

  async create(data: {
    name: string;
    gstin?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    creditLimit?: number;
    createdBy?: string;
  }) {
    const customer = await this.prisma.customer.create({
      data: {
        name: data.name,
        gstin: data.gstin,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        creditLimit: data.creditLimit ?? 0,
      },
    });

    await this.notifications.notifyByModule({
      module: 'customers',
      type: 'CUSTOMER_CREATED',
      title: 'New Customer Added',
      message: `Customer "${customer.name}" added to the system`,
      refId: customer.id,
      link: '/customers',
      actorId: data.createdBy,
    });

    return customer;
  }

  update(id: string, data: Partial<{
    name: string;
    gstin: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    creditLimit: number;
    isActive: boolean;
  }>) {
    const { phone: _phone, ...updatable } = data;
    return this.prisma.customer.update({ where: { id }, data: updatable });
  }

  remove(id: string) {
    return this.prisma.customer.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });
  }
}
