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
exports.ManufacturingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const date_util_1 = require("../../common/utils/date.util");
const notifications_service_1 = require("../notifications/notifications.service");
let ManufacturingService = class ManufacturingService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    findAll() {
        return this.prisma.productionBatch.findMany({
            include: { product: { include: { unit: true, category: true } } },
            orderBy: { batchDate: 'desc' },
        });
    }
    async create(data) {
        const batch = await this.prisma.$transaction(async (tx) => {
            const created = await tx.productionBatch.create({
                data: {
                    productId: data.productId,
                    batchNo: data.batchNo,
                    batchDate: (0, date_util_1.parseBusinessDate)(data.batchDate),
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
        const byProduct = {};
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
};
exports.ManufacturingService = ManufacturingService;
exports.ManufacturingService = ManufacturingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ManufacturingService);
//# sourceMappingURL=manufacturing.service.js.map