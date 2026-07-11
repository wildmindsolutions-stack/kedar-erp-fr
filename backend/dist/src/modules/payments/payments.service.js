"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const gst_util_1 = require("../../common/utils/gst.util");
const notifications_service_1 = require("../notifications/notifications.service");
let PaymentsService = class PaymentsService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    findAll() {
        return this.prisma.payment.findMany({
            include: { customer: true, creator: { select: { name: true } } },
            orderBy: { receivedAt: 'desc' },
        });
    }
    async create(data) {
        if (data.amount <= 0) {
            throw new common_1.BadRequestException('Payment amount must be greater than zero');
        }
        const outstanding = await (0, gst_util_1.getCustomerOutstanding)(this.prisma, data.customerId);
        if (outstanding <= 0) {
            throw new common_1.BadRequestException('This customer has no outstanding balance to collect');
        }
        if (data.amount > outstanding) {
            throw new common_1.BadRequestException(`Payment amount cannot exceed outstanding balance of ₹${outstanding.toFixed(2)}`);
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
        const results = await Promise.all(customers.map(async (c) => {
            const outstanding = await (0, gst_util_1.getCustomerOutstanding)(this.prisma, c.id);
            return {
                customerId: c.id,
                customerName: c.name,
                phone: c.phone,
                creditLimit: Number(c.creditLimit),
                outstanding,
            };
        }));
        return results.filter((r) => r.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map