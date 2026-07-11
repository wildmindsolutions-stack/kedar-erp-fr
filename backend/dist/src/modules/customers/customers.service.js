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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const gst_util_1 = require("../../common/utils/gst.util");
const notifications_service_1 = require("../notifications/notifications.service");
let CustomersService = class CustomersService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async findAll() {
        const customers = await this.prisma.customer.findMany({
            where: { isDeleted: false },
            orderBy: { name: 'asc' },
        });
        return Promise.all(customers.map(async (c) => ({
            ...c,
            creditLimit: Number(c.creditLimit),
            outstanding: await (0, gst_util_1.getCustomerOutstanding)(this.prisma, c.id),
        })));
    }
    async findOne(id) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });
        if (!customer)
            return null;
        const outstanding = await (0, gst_util_1.getCustomerOutstanding)(this.prisma, id);
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
    async create(data) {
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
    update(id, data) {
        const { phone: _phone, ...updatable } = data;
        return this.prisma.customer.update({ where: { id }, data: updatable });
    }
    remove(id) {
        return this.prisma.customer.update({
            where: { id },
            data: { isDeleted: true, isActive: false },
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map